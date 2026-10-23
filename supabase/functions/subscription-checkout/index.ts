import { admin } from "../_shared/supabase.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { initializePayment } from "../_shared/notchpay.ts";
import { publishableKey } from "../_shared/keys.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Connexion requise" }, 401);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const offerId = String(body.offer_id ?? "");
  const currency = String(body.currency ?? "XAF").toUpperCase();
  const idempotencyKey = String(req.headers.get("Idempotency-Key") ?? body.idempotency_key ?? "");
  if (!UUID.test(offerId) || !["XAF", "EUR"].includes(currency)) return json({ error: "Offre ou devise invalide" }, 400);
  if (!UUID.test(idempotencyKey)) return json({ error: "Clé d'idempotence invalide" }, 400);

  const client = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey(), {
    global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
  });
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return json({ error: "Session invalide" }, 401);
  const { data: offer } = await admin.from("offers").select("id,name,kind").eq("id", offerId).eq("active", true).single();
  if (!offer || offer.kind !== "subscription") return json({ error: "Offre d'abonnement indisponible" }, 404);

  const { data: orderRows, error: orderError } = await admin.rpc("create_pending_learning_order", {
    p_user: auth.user.id, p_offer: offerId, p_currency: currency, p_idempotency_key: idempotencyKey,
  });
  const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
  if (orderError || !order?.order_id || !order.amount_xaf) {
    console.error("create_pending_learning_order", orderError);
    return json({ error: "Offre ou tarif indisponible dans cette devise" }, 400);
  }
  const { data: existingOrder } = await admin.from("learning_orders")
    .select("status,checkout_url").eq("id", order.order_id).single();
  if (existingOrder?.checkout_url && existingOrder.status === "pending") {
    return json({ order_id: order.order_id, authorization_url: existingOrder.checkout_url });
  }
  try {
    const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
    const { reference, authorizationUrl } = await initializePayment({
      amountXaf: order.amount_xaf, orderId: order.order_id,
      description: `Nova Digital - abonnement ${offer.name}`,
      callback: `${siteUrl}/?learning_order=${order.order_id}`,
      customer: { name: String(auth.user.user_metadata?.full_name ?? "Abonné"), email: auth.user.email ?? "" },
      metadata: { learning_order_id: order.order_id, offer_id: offer.id },
    });
    await admin.from("learning_orders").update({ provider_reference: reference, checkout_url: authorizationUrl }).eq("id", order.order_id);
    return json({ order_id: order.order_id, authorization_url: authorizationUrl });
  } catch (error) {
    console.error("Notch Pay subscription checkout", error);
    await admin.from("learning_orders").update({ status: "failed" }).eq("id", order.order_id).eq("status", "pending");
    return json({ error: "Le service de paiement est momentanément indisponible" }, 502);
  }
});
