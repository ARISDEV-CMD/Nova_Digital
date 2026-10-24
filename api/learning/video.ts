import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { getRequestSession } from '../_lib/app-session.ts';
import { getAccessibleLesson, UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const body = await request.json().catch(() => null) as { lessonId?: unknown } | null;
  if (typeof body?.lessonId !== 'string' || !UUID.test(body.lessonId)) return jsonResponse({ error: 'Leçon invalide.' }, 400);
  const session = await getRequestSession(request);
  const client = getServiceClient();
  const { lesson, allowed } = await getAccessibleLesson(client, session?.user || null, body.lessonId);
  if (!lesson || !allowed) return jsonResponse({ error: 'Accès à la vidéo refusé.' }, 403);
  const { data: content, error } = await client.from('course_lesson_contents').select('video_storage_path').eq('lesson_id', lesson.id).maybeSingle();
  if (error) throw error;
  if (!content?.video_storage_path) return jsonResponse({ error: 'Vidéo indisponible.' }, 404);
  const { data: signed, error: signedError } = await client.storage.from('course-content').createSignedUrl(content.video_storage_path, 600);
  if (signedError) throw signedError;
  return jsonResponse({ url: signed.signedUrl, expires_in: 600 });
});

