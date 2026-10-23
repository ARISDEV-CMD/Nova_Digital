import { createClient } from "npm:@supabase/supabase-js@2";
import { secretKey } from "./keys.ts";

// Client service_role : contourne la RLS. Ne JAMAIS l'exposer au navigateur.
export const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKey(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
