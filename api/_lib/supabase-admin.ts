import { createClient } from '@supabase/supabase-js';
import { compare, hash } from 'bcryptjs';

export type ServerSupabaseClient = ReturnType<typeof createClient<any>>;

let serviceClient: ServerSupabaseClient | null = null;

export function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured.');
  }

  serviceClient ||= createClient<any>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return serviceClient;
}

export type AppProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

export async function authenticateEmailAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || password.length < 1 || password.length > 256) return null;

  const { data, error } = await getServiceClient()
    .from('profiles')
    .select('id,email,full_name,role,password_hash')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (error) throw error;
  if (!data?.password_hash || !await compare(password, data.password_hash)) return null;
  return data as AppProfile & { password_hash: string };
}

export async function registerEmailAccount(input: { email: string; password: string; name: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return { error: 'Saisis une adresse e-mail valide.', status: 400 };
  }
  if (input.password.length < 8 || input.password.length > 128) {
    return { error: 'Le mot de passe doit contenir entre 8 et 128 caractères.', status: 400 };
  }
  if (!name || name.length > 100) return { error: 'Saisis ton nom (100 caractères maximum).', status: 400 };

  const client = getServiceClient();
  const { data: existingProfile, error: lookupError } = await client
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existingProfile) return { error: 'Un compte utilise déjà cette adresse e-mail. Connecte-toi ou choisis une autre adresse.', status: 409 };

  const passwordHash = await hash(input.password, 12);
  const { error } = await client.from('profiles').insert({
    id: crypto.randomUUID(),
    email: normalizedEmail,
    full_name: name,
    role: 'customer',
    password_hash: passwordHash,
  });
  if (error?.code === '23505') {
    return { error: 'Un compte utilise déjà cette adresse e-mail. Connecte-toi ou choisis une autre adresse.', status: 409 };
  }
  if (error) throw error;
  return { error: null, status: 201 };
}

export async function getOrCreateGoogleProfile(input: {
  subject: string;
  email: string;
  name: string | null;
}) {
  const client = getServiceClient();
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: googleProfile, error: googleLookupError } = await client
    .from('profiles')
    .select('id,email,full_name,role')
    .eq('google_subject', input.subject)
    .maybeSingle();
  if (googleLookupError) throw googleLookupError;
  if (googleProfile) return googleProfile as AppProfile;

  // Match an existing account by its verified Google email so prior course
  // purchases and progress keep the same profile UUID.
  const { data: emailProfile, error: emailLookupError } = await client
    .from('profiles')
    .select('id,email,full_name,role')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (emailLookupError) throw emailLookupError;

  if (emailProfile) {
    const { data, error } = await client
      .from('profiles')
      .update({
        email: normalizedEmail,
        google_subject: input.subject,
        full_name: emailProfile.full_name || input.name,
      })
      .eq('id', emailProfile.id)
      .select('id,email,full_name,role')
      .single();
    if (error) throw error;
    return data as AppProfile;
  }

  const { data, error } = await client
    .from('profiles')
    .insert({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      google_subject: input.subject,
      full_name: input.name,
      role: 'customer',
    })
    .select('id,email,full_name,role')
    .single();
  if (!error) return data as AppProfile;

  // Handle two first-time sign-ins racing to create the same profile.
  const { data: racedProfile, error: racedLookupError } = await client
    .from('profiles')
    .select('id,email,full_name,role')
    .eq('google_subject', input.subject)
    .maybeSingle();
  if (racedLookupError || !racedProfile) throw error;
  return racedProfile as AppProfile;
}

export async function getProfileById(id: string) {
  const { data, error } = await getServiceClient()
    .from('profiles')
    .select('id,email,full_name,role')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as AppProfile | null;
}
