import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getPayment } from "./notchpay.ts";

export interface OrderRow {
  id: string;
  status: string;
  amount_xaf: number | null;
  provider_ref: string | null;
}
export type FinalizeState = "paid" | "pending" | "failed" | "mismatch";

const FAILED = new Set(["failed", "canceled", "cancelled", "expired"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLS = "id,status,amount_xaf,provider_ref";

/** Retrouve la commande par référence Notch Pay (et, si autorisé, par id de commande = `trxref`). */
export async function findOrder(
  admin: SupabaseClient,
  candidates: unknown[],
  allowOrderId = false,
): Promise<OrderRow | null> {
  const refs = candidates.filter((c): c is string => typeof c === "string" && c.length > 0 && c.length < 200);
  if (refs.length === 0) return null;

  const byRef = await admin.from("orders").select(COLS).in("provider_ref", refs).maybeSingle();
  if (byRef.data) return byRef.data as OrderRow;

  if (allowOrderId) {
    const id = refs.find((r) => UUID.test(r));
    if (id) {
      const byId = await admin.from("orders").select(COLS).eq("id", id).maybeSingle();
      if (byId.data) return byId.data as OrderRow;
    }
  }
  return null;
}

/**
 * Relit le paiement chez Notch Pay puis met la commande à jour.
 * Idempotent : mark_order_paid ne fait rien si la commande n'est plus 'pending'.
 */
export async function finalizeOrder(admin: SupabaseClient, order: OrderRow): Promise<FinalizeState> {
  if (order.status === "paid") return "paid";
  if (order.status === "failed" || order.status === "refunded") return "failed";
  if (!order.provider_ref) return "pending";

  const tx = await getPayment(order.provider_ref);

  if (tx.status === "complete") {
    const amountOk = Number(tx.amount) === order.amount_xaf && String(tx.currency).toUpperCase() === "XAF";
    const refOk = !tx.trxref || tx.trxref === order.id;
    if (!amountOk || !refOk) {
      console.error("Paiement incohérent", { order: order.id, expected: order.amount_xaf, got: tx.amount, currency: tx.currency, trxref: tx.trxref });
      return "mismatch";
    }
    const { error } = await admin.rpc("mark_order_paid", { p_order: order.id, p_provider_ref: order.provider_ref });
    if (error) throw error;
    return "paid";
  }

  if (FAILED.has(tx.status)) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id).eq("status", "pending");
    return "failed";
  }
  return "pending";
}
