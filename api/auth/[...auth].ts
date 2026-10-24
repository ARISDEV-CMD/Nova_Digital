import { Auth } from '@auth/core';
import { createApiHandler } from '../_lib/http.ts';
import { authConfig } from '../_lib/auth-config.ts';
import { registerEmailAccount } from '../_lib/supabase-admin.ts';

export default createApiHandler((request) => {
  if (!process.env.AUTH_SECRET) return Response.json({ error: 'AUTH_SECRET is not configured.' }, { status: 503 });
  const requestUrl = new URL(request.url);
  const rewrittenAuthPaths: Record<string, string> = {
    '/api/auth/signin-google': '/api/auth/signin/google',
    '/api/auth/signin-email-password': '/api/auth/signin/email-password',
    '/api/auth/callback-google': '/api/auth/callback/google',
    '/api/auth/callback-email-password': '/api/auth/callback/email-password',
  };
  const pathname = rewrittenAuthPaths[requestUrl.pathname] || requestUrl.pathname;
  if (pathname !== requestUrl.pathname) {
    requestUrl.pathname = pathname;
    request = new Request(requestUrl, request);
  }

  if (pathname === '/api/auth/register') return handleRegistration(request);
  if (pathname.includes('/signin/google') && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
    return Response.json({ error: 'Google OAuth credentials are not configured.' }, { status: 503 });
  }
  return Auth(request, authConfig);
});

async function handleRegistration(request: Request) {
  if (request.method !== 'POST') return Response.json({ error: 'Méthode non autorisée.' }, { status: 405 });
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: 'Format de requête invalide.' }, { status: 415 });
  }

  let input: unknown;
  try { input = await request.json(); }
  catch { return Response.json({ error: 'Les informations du compte sont invalides.' }, { status: 400 }); }
  if (!input || typeof input !== 'object') return Response.json({ error: 'Les informations du compte sont invalides.' }, { status: 400 });

  const body = input as Record<string, unknown>;
  if (typeof body.email !== 'string' || typeof body.password !== 'string' || typeof body.name !== 'string') {
    return Response.json({ error: 'Renseigne ton nom, ton adresse e-mail et un mot de passe.' }, { status: 400 });
  }
  const result = await registerEmailAccount({ email: body.email, password: body.password, name: body.name });
  return Response.json(result.error ? { error: result.error } : { created: true }, { status: result.status });
}

