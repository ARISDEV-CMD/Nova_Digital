import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { eurCentsToXaf } from "../_shared/money.ts";
import { initializePayment } from "../_shared/notchpay.ts";
import { publishableKey } from "../_shared/keys.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON invalide" }, 400);
  }

  // ── Validation : seuls des identifiants sont acceptés, JAMAIS de prix venant du client ──
  const items = Array.isArray(body.items) ? body.items : [];
  const email = String(body.email ?? "").trim();
  const name = String(body.name ?? "").trim();
  const promo = body.promo ? String(body.promo).trim().slice(0, 40) : null;
  const phone = body.phone ? String(body.phone).trim().slice(0, 20) : undefined;

  if (items.length < 1 || items.length > 20) return json({ error: "Panier invalide" }, 400);
  for (const i of items) {
    if (!UUID.test(String(i?.product_id)) || !["standard", "agency"].includes(String(i?.tier))) {
      return json({ error: "Article invalide" }, 400);
    }
  }
  if (!EMAIL.test(email) || email.length > 254) return json({ error: "Adresse e-mail invalide" }, 400);
  if (name.length < 2 || name.length > 120) return json({ error: "Nom invalide" }, 400);

  // ── Utilisateur connecté (optionnel : l'achat invité reste possible) ──
  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const client = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey(), {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data } = await client.auth.getUser();
    userId = data.user?.id ?? null;
  }

  // ── Prix, remise et clés calculés par la base ──
  const { data: orderId, error: rpcError } = await admin.rpc("create_pending_order", {
    p_user_id: userId,
    p_email: email,
    p_name: name,
    p_company: body.company ? String(body.company).slice(0, 120) : null,
    p_vat: body.vat ? String(body.vat).slice(0, 40) : null,
    p_method: "notchpay",
    p_items: items.map((i) => ({ product_id: i.product_id, tier: i.tier })),
    p_promo: promo,
  });
  if (rpcError) {
    // P0001 = RAISE EXCEPTION de nos fonctions SQL (promo invalide, panier vide…) : message affichable
    if (rpcError.code === "P0001") return json({ error: rpcError.message }, 400);
    console.error("create_pending_order", rpcError);
    return json({ error: "Impossible de créer la commande" }, 500);
  }

  const { data: order, error: readError } = await admin
    .from("orders")
    .select("id,order_number,total_cents")
    .eq("id", orderId)
    .single();
  if (readError || !order) return json({ error: "Commande introuvable" }, 500);

  // ── Commande gratuite (code promo à 100 %) : pas de paiement ──
  if (order.total_cents === 0) {
    const { error } = await admin.rpc("mark_order_paid", { p_order: order.id, p_provider_ref: `free_${order.id}` });
    if (error) return json({ error: "Impossible de finaliser la commande" }, 500);
    return json({ order_id: order.id, order_number: order.order_number, free: true });
  }

  // ── Paiement Notch Pay ──
  const amountXaf = eurCentsToXaf(order.total_cents);
  try {
    await admin.from("orders").update({ amount_xaf: amountXaf }).eq("id", order.id);

    const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
    const { reference, authorizationUrl } = await initializePayment({
      amountXaf,
      orderId: order.id,
      description: `NovaDigital — commande ${order.order_number}`,
      // Notch Pay ajoute ?reference=…&trxref=…&status=… à cette URL au retour du client
      callback: `${siteUrl}/`,
      customer: { name, email, phone },
      metadata: { order_id: order.id, order_number: order.order_number },
    });

    await admin.from("orders").update({ provider_ref: reference }).eq("id", order.id);
    return json({ order_id: order.id, order_number: order.order_number, authorization_url: authorizationUrl });
  } catch (e) {
    console.error("Notch Pay init", e);
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id).eq("status", "pending");
    return json({ error: "Le service de paiement est momentanément indisponible" }, 502);
  }
});
