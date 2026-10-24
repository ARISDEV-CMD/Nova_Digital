import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { getRequestSession } from '../_lib/app-session.ts';
import { getLessonPayload, UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const body = await request.json().catch(() => null) as { lessonId?: unknown } | null;
  if (typeof body?.lessonId !== 'string' || !UUID.test(body.lessonId)) return jsonResponse({ error: 'Leçon invalide.' }, 400);
  const session = await getRequestSession(request);
  const payload = await getLessonPayload(getServiceClient(), session?.user || null, body.lessonId);
  if (!payload) return jsonResponse({ error: 'Leçon introuvable.' }, 404);
  return jsonResponse(payload);
});

