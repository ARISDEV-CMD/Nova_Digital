import { corsHeaders, json } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { publishableKey } from "../_shared/keys.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const lessonId = String(body.lesson_id ?? "");
  if (!UUID.test(lessonId)) return json({ error: "Leçon invalide" }, 400);

  const headers: Record<string, string> = {};
  const authHeader = req.headers.get("Authorization");
  if (authHeader) headers.Authorization = authHeader;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey(), {
    global: { headers }, auth: { persistSession: false },
  });
  let userId: string | null = null;
  if (authHeader) {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return json({ error: "Session invalide" }, 401);
    userId = data.user.id;
  }
  const { data: lesson, error } = await client.from("course_lessons")
    .select("id,course_id,chapter_id,title,summary,lesson_type,duration_minutes,is_free_preview,preview_requires_login")
    .eq("id", lessonId).maybeSingle();
  if (error || !lesson) return json({ error: "Leçon introuvable" }, 404);
  const { data: canAccess, error: accessError } = await client.rpc("can_access_lesson", { p_lesson: lessonId });
  if (accessError) return json({ error: "Vérification d'accès indisponible" }, 500);
  const metadata = {
    id: lesson.id, course_id: lesson.course_id, chapter_id: lesson.chapter_id,
    title: lesson.title, summary: lesson.summary, type: lesson.lesson_type, duration_minutes: lesson.duration_minutes,
    is_free_preview: lesson.is_free_preview, locked: !canAccess,
  };
  if (!canAccess) return json({ lesson: metadata, content: null, quiz_questions: [], resources: [] });

  const [contentResult, questionsResult, resourcesResult] = await Promise.all([
    client.from("course_lesson_contents").select("body_md,project_instructions").eq("lesson_id", lessonId).maybeSingle(),
    client.from("quiz_questions").select("id,position,prompt_md,options").eq("lesson_id", lessonId).order("position"),
    client.from("course_resources").select("id,title,kind,external_url,requires_license,position").eq("lesson_id", lessonId).order("position"),
  ]);
  if (contentResult.error || questionsResult.error || resourcesResult.error) {
    return json({ error: "Impossible de charger le contenu de la leçon" }, 500);
  }
  let progress = null;
  if (userId) {
    const { data, error: progressError } = await client.from("lesson_progress")
      .select("is_completed,completed_at,last_position_seconds").eq("user_id", userId).eq("lesson_id", lessonId).maybeSingle();
    if (progressError) return json({ error: "Impossible de charger la progression" }, 500);
    progress = data;
  }
  return json({ lesson: metadata, content: contentResult.data ?? null,
    quiz_questions: questionsResult.data ?? [], resources: resourcesResult.data ?? [], progress });
});
