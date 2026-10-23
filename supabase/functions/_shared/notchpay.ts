// Surchargeable (tests locaux) ; en production on garde l'API officielle.
const API = Deno.env.get("NOTCHPAY_API_URL") ?? "https://api.notchpay.co";

export class NotchPayError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface NotchTransaction {
  reference: string;
  trxref?: string;
  amount: number;
  currency: string;
  status: string; // pending | processing | complete | failed | canceled | expired
  [key: string]: unknown;
}

function headers(): HeadersInit {
  const key = Deno.env.get("NOTCHPAY_PUBLIC_KEY");
  if (!key) throw new Error("NOTCHPAY_PUBLIC_KEY manquante");
  return { Authorization: key, "Content-Type": "application/json", Accept: "application/json" };
}

/** Crée le paiement. `reference` = notre id de commande ; Notch renvoie sa propre référence (trx.xxx). */
export async function initializePayment(p: {
  amountXaf: number;
  orderId: string;
  description: string;
  callback: string;
  customer: { name: string; email: string; phone?: string };
  metadata?: Record<string, unknown>;
}): Promise<{ reference: string; authorizationUrl: string }> {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      amount: p.amountXaf,
      currency: "XAF",
      customer: p.customer,
      description: p.description,
      reference: p.orderId,
      callback: p.callback,
      metadata: p.metadata,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.transaction?.reference || !body?.authorization_url) {
    throw new NotchPayError(body?.message ?? `Notch Pay HTTP ${res.status}`, res.status);
  }
  return { reference: body.transaction.reference, authorizationUrl: body.authorization_url };
}

/** Source de vérité du statut : on relit toujours le paiement chez Notch Pay. */
export async function getPayment(reference: string): Promise<NotchTransaction> {
  const res = await fetch(`${API}/payments/${encodeURIComponent(reference)}`, { headers: headers() });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.transaction) {
    throw new NotchPayError(body?.message ?? `Notch Pay HTTP ${res.status}`, res.status);
  }
  return body.transaction as NotchTransaction;
}

const enc = new TextEncoder();

export async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** En-tête X-Notch-Signature = HMAC-SHA256 hex du CORPS BRUT avec le secret du webhook. */
export async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSha256Hex(rawBody, secret);
  const given = signature.trim().toLowerCase();
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
