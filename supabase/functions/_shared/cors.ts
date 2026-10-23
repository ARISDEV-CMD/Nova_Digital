// SITE_URL = origine du front, sans slash final (ex. https://novadigital.com ou http://localhost:3000)
const origin = (Deno.env.get("SITE_URL") ?? "*").replace(/\/$/, "");

export const corsHeaders = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
