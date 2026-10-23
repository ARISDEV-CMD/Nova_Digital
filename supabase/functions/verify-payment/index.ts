// Appelée par le front au retour de Notch Pay (?reference=…) : filet de sécurité si le webhook tarde.
// La référence Notch Pay (aléatoire, non devinable) sert de preuve d'accès à la confirmation.
import { corsHeaders, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { finalizeOrder, findOrder } from "../_shared/finalize.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  let reference: unknown;
  try {
    ({ reference } = await req.json());
  } catch {
    return json({ error: "JSON invalide" }, 400);
  }

  const order = await findOrder(admin, [reference]); // par provider_ref uniquement
  if (!order) return json({ state: "unknown" }, 404);

  let state;
  try {
    state = await finalizeOrder(admin, order);
  } catch (e) {
    console.error("verify-payment", e);
    return json({ error: "Vérification impossible pour le moment" }, 502);
  }
  if (state !== "paid") return json({ state });

  const { data } = await admin
    .from("orders")
    .select("order_number,total_cents,client_email,client_name,invoice_ref,paid_at,order_items(license_tier,license_key,price_cents,revoked_at,products(title,slug,delivery_type,github_repo))")
    .eq("id", order.id)
    .single();
  return json({ state: "paid", order: data });
});
