import { Auth } from '@auth/core';
import type { AppUser } from '../../src/lib/auth-client.ts';
import { authConfig } from './auth-config.ts';

export type RequestSession = { user: AppUser; expires: string };

export async function getRequestSession(request: Request): Promise<RequestSession | null> {
  const url = new URL('/api/auth/session', request.url);
  const sessionRequest = new Request(url, { headers: { cookie: request.headers.get('cookie') || '' } });
  const response = await Auth(sessionRequest, authConfig);
  if (!response.ok) return null;
  const session = await response.json() as RequestSession | null;
  return session?.user?.id ? session : null;
}

export async function requireUser(request: Request): Promise<RequestSession> {
  const session = await getRequestSession(request);
  if (!session) throw new Response('Connexion requise.', { status: 401 });
  return session;
}

export async function requireAdmin(request: Request): Promise<RequestSession> {
  const session = await requireUser(request);
  if (session.user.role !== 'admin') throw new Response('Accès administrateur requis.', { status: 403 });
  return session;
}
