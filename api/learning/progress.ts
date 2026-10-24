import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { requireUser } from '../_lib/app-session.ts';
import { UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const { user } = await requireUser(request);
  const body = await request.json().catch(() => null) as { lessonId?: unknown; position?: unknown; completed?: unknown } | null;
  const position = Number(body?.position);
  if (typeof body?.lessonId !== 'string' || !UUID.test(body.lessonId) || !Number.isSafeInteger(position) || position < 0 || position > 86400 || typeof body?.completed !== 'boolean') {
    return jsonResponse({ error: 'Progression invalide.' }, 400);
  }
  const client = getServiceClient();
  const { error } = await client.rpc('app_save_lesson_progress', { p_user: user.id, p_lesson: body.lessonId, p_position: position, p_completed: body.completed });
  if (error) throw error;
  return jsonResponse({ saved: true, completed: body.completed, last_position_seconds: position });
});

