import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { requireAdmin } from '../_lib/app-session.ts';
import { UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  const { user } = await requireAdmin(request);
  const client = getServiceClient();
  if (request.method === 'GET') {
    const [{ data: courses, error: coursesError }, { data: offers, error: offersError }] = await Promise.all([
      client.from('courses').select('id,code,slug,title,category,status,current_version_id,draft_version_id,description,short_description,description_md,prerequisites_md,learning_outcomes,level,estimated_minutes,cover_image_url,content_source,reviewed_at,rights_verified_at').order('code'),
      client.from('offers').select('id,course_id,slug,name,active,offer_prices(currency,amount_minor,compare_at_minor)').eq('kind', 'course'),
    ]);
    if (coursesError || offersError) throw coursesError || offersError;
    const rows = (courses || []).map((course) => ({ ...course, offer: (offers || []).find((offer) => offer.course_id === course.id) || null }));
    return jsonResponse({ rows });
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const body = await request.json().catch(() => null) as { courseId?: unknown; offerId?: unknown; prices?: unknown } | null;
  if (typeof body?.courseId !== 'string' || !UUID.test(body.courseId) || (body.offerId != null && (typeof body.offerId !== 'string' || !UUID.test(body.offerId))) || !body.prices || typeof body.prices !== 'object') return jsonResponse({ error: 'Données de prix invalides.' }, 400);
  const prices = body.prices as Record<string, unknown>;
  for (const currency of ['XAF', 'EUR'] as const) {
    const amount = prices[currency];
    if (amount !== null && (!Number.isSafeInteger(amount) || Number(amount) <= 0)) return jsonResponse({ error: `Prix ${currency} invalide.` }, 400);
  }
  const { data: course, error: courseError } = await client.from('courses').select('id,slug,title,status').eq('id', body.courseId).maybeSingle();
  if (courseError) throw courseError;
  if (!course) return jsonResponse({ error: 'Formation introuvable.' }, 404);
  let offerId = body.offerId as string | undefined;
  if (offerId) {
    const { data: offer, error } = await client.from('offers').select('id,course_id,kind').eq('id', offerId).maybeSingle();
    if (error) throw error;
    if (!offer || offer.course_id !== course.id || offer.kind !== 'course') return jsonResponse({ error: 'Offre invalide.' }, 400);
    const { error: updateError } = await client.from('offers').update({ name: course.title }).eq('id', offerId);
    if (updateError) throw updateError;
  } else {
    const { data: existing, error } = await client.from('offers').select('id').eq('kind', 'course').eq('course_id', course.id).limit(1).maybeSingle();
    if (error) throw error;
    if (existing) offerId = existing.id;
    else {
      const { data, error: createError } = await client.from('offers').insert({ kind: 'course', slug: `formation-${course.slug}`, name: course.title, course_id: course.id, active: false }).select('id').single();
      if (createError) throw createError;
      offerId = data.id;
    }
  }
  for (const currency of ['XAF', 'EUR'] as const) {
    const amount = prices[currency];
    if (amount === null) {
      const { error } = await client.from('offer_prices').delete().eq('offer_id', offerId).eq('currency', currency);
      if (error) throw error;
      continue;
    }
    const { error } = await client.from('offer_prices').upsert({ offer_id: offerId, currency, amount_minor: amount, compare_at_minor: null }, { onConflict: 'offer_id,currency' });
    if (error) throw error;
  }
  if (prices.XAF === null && prices.EUR === null) {
    const { error } = await client.from('offers').update({ active: false }).eq('id', offerId);
    if (error) throw error;
  }
  return jsonResponse({ saved: true, offerId, actorId: user.id });
});

