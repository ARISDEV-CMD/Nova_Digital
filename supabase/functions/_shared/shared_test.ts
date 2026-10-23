import assert from "node:assert/strict";
import { eurCentsToXaf } from "./money.ts";
import { hmacSha256Hex, verifySignature } from "./notchpay.ts";

Deno.test("eurCentsToXaf : 88 € -> 57 724 FCFA (même résultat que le front)", () => {
  assert.equal(eurCentsToXaf(8800), 57724);
  assert.equal(eurCentsToXaf(0), 0);
  assert.equal(eurCentsToXaf(100), 656); // 1 € = 655,957 -> 656
});

Deno.test("eurCentsToXaf rejette les montants invalides", () => {
  for (const bad of [-1, 1.5, NaN]) {
    let threw = false;
    try { eurCentsToXaf(bad); } catch { threw = true; }
    assert.ok(threw, `devrait rejeter ${bad}`);
  }
});

Deno.test("verifySignature : signature valide / altérée / mauvais secret / mauvaise longueur", async () => {
  const body = JSON.stringify({ id: "evt_1", type: "payment.complete", data: { reference: "trx.abc" } });
  const sig = await hmacSha256Hex(body, "whsec_test");
  assert.ok(await verifySignature(body, sig, "whsec_test"));
  assert.ok(await verifySignature(body, sig.toUpperCase(), "whsec_test"));
  assert.ok(!(await verifySignature(body + " ", sig, "whsec_test")));   // corps modifié
  assert.ok(!(await verifySignature(body, sig, "autre_secret")));
  assert.ok(!(await verifySignature(body, "abcd", "whsec_test")));
  assert.ok(!(await verifySignature(body, "", "whsec_test")));
});
