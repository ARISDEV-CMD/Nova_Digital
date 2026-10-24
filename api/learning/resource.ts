import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { getRequestSession } from '../_lib/app-session.ts';
import { getAccessibleLesson, UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const body = await request.json().catch(() => null) as { resourceId?: unknown } | null;
  if (typeof body?.resourceId !== 'string' || !UUID.test(body.resourceId)) return jsonResponse({ error: 'Ressource invalide.' }, 400);
  const session = await getRequestSession(request);
  const client = getServiceClient();
  const { data: resource, error } = await client.from('course_resources')
    .select('id,lesson_id,storage_path,external_url,requires_license').eq('id', body.resourceId).maybeSingle();
  if (error) throw error;
  if (!resource) return jsonResponse({ error: 'Ressource indisponible.' }, 404);
  const { lesson, allowed } = await getAccessibleLesson(client, session?.user || null, resource.lesson_id);
  if (!lesson || !allowed) return jsonResponse({ error: 'Accès à la ressource requis.' }, 403);
  if (resource.requires_license && session?.user.role !== 'admin' && session?.user.role !== 'editor') {
    if (!session) return jsonResponse({ error: 'La licence de cette ressource n’est pas incluse dans ton accès.' }, 403);
    const { data: entitlements, error: entitlementError } = await client.from('learning_entitlements')
      .select('code_license,scope,course_id,starts_at,ends_at,revoked_at,source_order_id').eq('user_id', session.user.id).is('revoked_at', null);
    if (entitlementError) throw entitlementError;
    let licenseAccess = false;
    for (const item of entitlements || []) {
      const current = new Date(item.starts_at).getTime() <= Date.now() && (!item.ends_at || new Date(item.ends_at).getTime() > Date.now());
      const courseMatch = item.scope === 'all_courses' || item.course_id === lesson.course_id;
      const licenseMatch = item.code_license === 'agency' || (item.code_license === 'standard' && resource.requires_license === 'standard');
      if (!current || !courseMatch || !licenseMatch) continue;
      if (item.source_order_id) {
        const { data: order, error: orderError } = await client.from('learning_orders').select('status').eq('id', item.source_order_id).maybeSingle();
        if (orderError) throw orderError;
        if (order?.status === 'refunded') continue;
      }
      licenseAccess = true;
      break;
    }
    if (!licenseAccess) return jsonResponse({ error: 'La licence de cette ressource n’est pas incluse dans ton accès.' }, 403);
  }
  if (resource.external_url) return jsonResponse({ url: resource.external_url, expires_in: null });
  if (!resource.storage_path) return jsonResponse({ error: 'Fichier indisponible.' }, 404);
  const { data: signed, error: signedError } = await client.storage.from('course-content').createSignedUrl(resource.storage_path, 600);
  if (signedError) throw signedError;
  return jsonResponse({ url: signed.signedUrl, expires_in: 600 });
});

