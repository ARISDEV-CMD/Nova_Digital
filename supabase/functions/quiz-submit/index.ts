import { admin } from '../_shared/supabase.ts';
import { corsHeaders, json } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { publishableKey } from '../_shared/keys.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'JSON invalide' }, 400); }
  const lessonId = String(body.lesson_id ?? '');
  const answers = body.answers;
  if (!/^[0-9a-f-]{36}$/i.test(lessonId) || !Array.isArray(answers) || answers.length > 100) {
    return json({ error: 'Réponses invalides' }, 400);
  }
  const authHeader = req.headers.get('Authorization');
  const headers: Record<string, string> = {};
  if (authHeader) headers.Authorization = authHeader;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, publishableKey(), {
    global: { headers }, auth: { persistSession: false },
  });
  if (authHeader) {
    const { data: auth, error } = await client.auth.getUser();
    if (error || !auth.user) return json({ error: 'Session invalide' }, 401);
  }
  const { data: allowed, error: accessError } = await client.rpc('can_access_lesson', { p_lesson: lessonId });
  if (accessError || !allowed) return json({ error: 'Accès à la leçon requis' }, 403);

  const { data: questions, error: questionsError } = await admin.from('quiz_questions')
    .select('id,quiz_answer_keys(correct_option_ids,explanation_md)').eq('lesson_id', lessonId);
  if (questionsError || !questions?.length) return json({ error: 'Quiz introuvable ou incomplet' }, 404);
  const submitted = new Map<string, string[]>();
  for (const answer of answers) {
    if (!answer || typeof answer.question_id !== 'string' || !Array.isArray(answer.selected_option_ids) ||
      answer.selected_option_ids.some((id: unknown) => typeof id !== 'string')) return json({ error: 'Réponses invalides' }, 400);
    submitted.set(answer.question_id, answer.selected_option_ids);
  }
  const result = questions.map((question) => {
    const key = question.quiz_answer_keys?.[0];
    const correctIds = Array.isArray(key?.correct_option_ids) ? key.correct_option_ids.map(String).sort() : [];
    const selectedIds = (submitted.get(question.id) || []).slice().sort();
    const correct = correctIds.length > 0 && correctIds.length === selectedIds.length && correctIds.every((id, index) => id === selectedIds[index]);
    return { question_id: question.id, correct, correct_option_ids: correctIds, explanation_md: key?.explanation_md ?? null };
  });
  return json({ score: result.filter((answer) => answer.correct).length, total: result.length, answers: result });
});
