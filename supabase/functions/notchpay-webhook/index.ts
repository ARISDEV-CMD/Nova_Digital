// À déployer avec --no-verify-jwt : Notch Pay n'envoie pas de JWT Supabase.
// L'authenticité repose sur la signature HMAC ET sur la relecture du paiement via l'API Notch Pay.
import { admin } from "../_shared/supabase.ts";
import { getPayment, verifySignature } from "../_shared/notchpay.ts";
import { finalizeOrder, findOrder } from "../_shared/finalize.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const secret = Deno.env.get("NOTCHPAY_WEBHOOK_SECRET");
  if (!secret) {
    console.error("NOTCHPAY_WEBHOOK_SECRET manquant");
    return new Response("Server misconfigured", { status: 500 });
  }

  // La signature se calcule sur le corps BRUT : ne pas le parser avant.
  const raw = await req.text();
  const signature = req.headers.get("x-notch-signature") ?? "";
  if (!(await verifySignature(raw, signature, secret))) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: { id?: string; type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Audit (le traitement ci-dessous est idempotent, donc un rejeu ne double rien)
  await admin
    .from("webhook_events")
    .upsert({ id: event.id ?? crypto.randomUUID(), type: event.type ?? "unknown", payload: event }, { onConflict: "id", ignoreDuplicates: true });

  if (typeof event.type === "string" && event.type.startsWith("payment.")) {
    const d = event.data ?? {};
    try {
      const refs = [d.reference, d.trxref].filter((value): value is string => typeof value === "string" && value.length > 0);
      let learningOrder = null;
      if (refs.length) {
        const result = await admin.from("learning_orders")
          .select("id,status,amount_xaf,provider_reference").in("provider_reference", refs).maybeSingle();
        learningOrder = result.data;
      }
      if (!learningOrder && typeof d.trxref === "string") {
        const result = await admin.from("learning_orders")
          .select("id,status,amount_xaf,provider_reference").eq("id", d.trxref).maybeSingle();
        learningOrder = result.data;
      }
      const metadata = d.metadata as Record<string, unknown> | undefined;
      if (!learningOrder && typeof metadata?.learning_order_id === "string") {
        const result = await admin.from("learning_orders")
          .select("id,status,amount_xaf,provider_reference").eq("id", metadata.learning_order_id).maybeSingle();
        learningOrder = result.data;
      }
      if (learningOrder?.status === "pending" && learningOrder.provider_reference) {
        const payment = await getPayment(learningOrder.provider_reference);
        if (payment.status === "complete") {
          if (Number(payment.amount) !== learningOrder.amount_xaf || String(payment.currency).toUpperCase() !== "XAF" ||
            (payment.trxref && payment.trxref !== learningOrder.id)) {
            console.error("Paiement formation incohérent", { order: learningOrder.id });
            return new Response("Payment mismatch", { status: 400 });
          }
          const { error } = await admin.rpc("fulfill_learning_order", {
            p_order: learningOrder.id, p_provider_reference: learningOrder.provider_reference, p_raw_webhook: event,
          });
          if (error) throw error;
        }
      } else {
        const order = await findOrder(admin, refs, true);
        if (order) await finalizeOrder(admin, order);
      }
    } catch (e) {
      console.error("finalize payment", e);
      return new Response("Retry later", { status: 500 });
    }
  }
  return new Response("Webhook received", { status: 200 });
});
