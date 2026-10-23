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
  const resourceId = String(body.resource_id ?? "");
  if (!UUID.test(resourceId)) return json({ error: "Ressource invalide" }, 400);

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
  const { data: resource, error } = await client.from("course_resources")
    .select("storage_path,external_url").eq("id", resourceId).maybeSingle();
  if (error || !resource) return json({ error: "Ressource indisponible ou accès requis" }, 404);
  if (resource.external_url) return json({ url: resource.external_url, expires_in: null });
  if (!resource.storage_path) return json({ error: "Fichier indisponible" }, 404);
  const { data: signed, error: signedError } = await admin.storage.from("course-content")
    .createSignedUrl(resource.storage_path, 600);
  if (signedError || !signed) return json({ error: "Fichier indisponible" }, 500);
  return json({ url: signed.signedUrl, expires_in: 600 });
});
