import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { getRequestSession } from '../_lib/app-session.ts';
import { getAccessibleLesson, UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const body = await request.json().catch(() => null) as { lessonId?: unknown; answers?: unknown } | null;
  if (typeof body?.lessonId !== 'string' || !UUID.test(body.lessonId) || !Array.isArray(body.answers) || body.answers.length > 100) return jsonResponse({ error: 'Réponses invalides.' }, 400);
  const session = await getRequestSession(request);
  const client = getServiceClient();
  const { lesson, allowed } = await getAccessibleLesson(client, session?.user || null, body.lessonId);
  if (!lesson || !allowed) return jsonResponse({ error: 'Accès à la leçon requis.' }, 403);
  const { data: questions, error } = await client.from('quiz_questions').select('id,quiz_answer_keys(correct_option_ids,explanation_md)').eq('lesson_id', body.lessonId);
  if (error) throw error;
  if (!questions?.length) return jsonResponse({ error: 'Quiz introuvable ou incomplet.' }, 404);
  const submitted = new Map<string, string[]>();
  for (const answer of body.answers) {
    if (!answer || typeof answer !== 'object' || typeof answer.question_id !== 'string' || !Array.isArray(answer.selected_option_ids) || answer.selected_option_ids.some((id: unknown) => typeof id !== 'string')) return jsonResponse({ error: 'Réponses invalides.' }, 400);
    submitted.set(answer.question_id, answer.selected_option_ids);
  }
  const results = questions.map((question) => {
    const key = Array.isArray(question.quiz_answer_keys) ? question.quiz_answer_keys[0] : null;
    const correctIds = Array.isArray(key?.correct_option_ids) ? key.correct_option_ids.map(String).sort() : [];
    const selectedIds = (submitted.get(question.id) || []).slice().sort();
    const correct = correctIds.length > 0 && correctIds.length === selectedIds.length && correctIds.every((id, index) => id === selectedIds[index]);
    return { question_id: question.id, correct, correct_option_ids: correctIds, explanation_md: key?.explanation_md || null };
  });
  return jsonResponse({ score: results.filter((answer) => answer.correct).length, total: results.length, answers: results });
});

