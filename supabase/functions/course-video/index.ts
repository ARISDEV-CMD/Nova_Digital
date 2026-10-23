import { admin } from "../_shared/supabase.ts";
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
  if (authHeader) {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return json({ error: "Session invalide" }, 401);
  }
  const { data: allowed, error: accessError } = await client.rpc("can_access_lesson", { p_lesson: lessonId });
  if (accessError || !allowed) return json({ error: "Un accès est nécessaire" }, 403);
  const { data: content, error } = await client.from("course_lesson_contents")
    .select("video_storage_path").eq("lesson_id", lessonId).maybeSingle();
  if (error || !content?.video_storage_path) return json({ error: "Vidéo indisponible" }, 404);
  const { data: signed, error: signedError } = await admin.storage.from("course-content")
    .createSignedUrl(content.video_storage_path, 600);
  if (signedError || !signed) return json({ error: "Vidéo indisponible" }, 500);
  return json({ url: signed.signedUrl, expires_in: 600 });
});
