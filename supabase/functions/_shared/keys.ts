function readSupabaseKey(preferredName: string, legacyName: string): string {
  const raw = Deno.env.get(preferredName);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const key = parsed.default ?? Object.values(parsed)[0];
        if (typeof key === "string" && key) return key;
      }
    } catch {
      return raw;
    }
    return raw;
  }
  const legacy = Deno.env.get(legacyName);
  if (!legacy) throw new Error(`Missing Supabase key: ${preferredName}`);
  return legacy;
}

export const publishableKey = () => readSupabaseKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
export const secretKey = () => readSupabaseKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
