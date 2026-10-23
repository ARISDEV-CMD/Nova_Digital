// Parité fixe FCFA/EUR : 655,957 XAF pour 1 € (même valeur que le front : EUR_TO_XAF_RATE).
const XAF_PER_EUR_MILLI = 655_957;

/** Centimes d'euro -> XAF entiers (arrondi au franc le plus proche). */
export function eurCentsToXaf(cents: number): number {
  if (!Number.isInteger(cents) || cents < 0) throw new Error("Montant invalide");
  return Math.round((cents * XAF_PER_EUR_MILLI) / 100_000);
}
