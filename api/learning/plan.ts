import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { requireUser } from '../_lib/app-session.ts';
import { UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const { user } = await requireUser(request);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.courseId !== 'string' || !UUID.test(body.courseId)) return jsonResponse({ error: 'Formation invalide.' }, 400);
  const client = getServiceClient();
  if (body.action === 'create') {
    const weeklyMinutes = Number(body.weeklyMinutes);
    const preferredDays = body.preferredDays;
    if (!Number.isInteger(weeklyMinutes) || weeklyMinutes < 30 || weeklyMinutes > 2400 || !Array.isArray(preferredDays) || preferredDays.length < 1 || preferredDays.length > 7 || preferredDays.some((day) => !Number.isInteger(day) || Number(day) < 1 || Number(day) > 7)) {
      return jsonResponse({ error: 'Paramètres du plan invalides.' }, 400);
    }
    const { error } = await client.rpc('app_save_study_plan', { p_user: user.id, p_course: body.courseId, p_weekly_minutes: weeklyMinutes, p_preferred_days: [...new Set(preferredDays)] });
    if (error) throw error;
  } else if (body.action === 'pause' && typeof body.paused === 'boolean') {
    const { error } = await client.rpc('app_set_study_plan_paused', { p_user: user.id, p_course: body.courseId, p_paused: body.paused });
    if (error) throw error;
  } else {
    return jsonResponse({ error: 'Action de plan invalide.' }, 400);
  }
  return jsonResponse({ saved: true });
});

