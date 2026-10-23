import { corsHeaders, json } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { publishableKey } from "../_shared/keys.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Connexion requise" }, 401);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const lessonId = String(body.lesson_id ?? "");
  const position = Number(body.last_position_seconds ?? 0);
  const completed = body.completed === true;
  if (!UUID.test(lessonId) || !Number.isSafeInteger(position) || position < 0 || position > 86_400) {
    return json({ error: "Progression invalide" }, 400);
  }
  const client = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey(), {
    global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
  });
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return json({ error: "Session invalide" }, 401);
  const { error: progressError } = await client.rpc("save_lesson_progress", {
    p_lesson: lessonId, p_position: position, p_completed: completed,
  });
  if (progressError) return json({ error: "Leçon inaccessible ou progression impossible à enregistrer" }, 403);
  return json({ saved: true, completed, last_position_seconds: position });
});
