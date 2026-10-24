export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
};

export type AppSession = {
  user: AppUser;
  expires: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const hint = import.meta.env.DEV
      ? 'Redémarre le serveur de développement pour activer les routes API.'
      : 'Vérifie que les routes API sont bien déployées.';
    throw new Error(`Le serveur API a renvoyé une page web au lieu du résultat attendu. ${hint}`);
  }
  return response.json().catch(() => null) as Promise<T | null>;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init?.headers },
  });
  const body = await parseJsonResponse<{ error?: string } | T>(response);
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error
      : 'La requête n’a pas abouti.';
    throw new Error(message);
  }
  return body as T;
}

export async function getAppSession(): Promise<AppSession | null> {
  const response = await fetch('/api/auth/session', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Impossible de vérifier la session.');

  const session = await parseJsonResponse<AppSession>(response);
  return session?.user?.id ? session : null;
}

export async function signInWithEmailPassword(email: string, password: string, callbackUrl: string) {
  const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  const csrf = await parseJsonResponse<{ csrfToken?: string }>(csrfResponse);
  if (!csrfResponse.ok || !csrf?.csrfToken) throw new Error('Impossible de préparer la connexion par e-mail.');

  const response = await fetch('/api/auth/callback/email-password', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, email: email.trim(), password, callbackUrl }),
  });
  const result = await parseJsonResponse<{ url?: string; message?: string }>(response);
  if (!response.ok || !result?.url) throw new Error(result?.message || 'La connexion par e-mail a échoué.');

  const destination = new URL(result.url, window.location.origin);
  if (destination.searchParams.has('error')) throw new Error('Adresse e-mail ou mot de passe incorrect.');
  window.location.assign(destination.toString());
}

export async function signInWithGoogle(callbackUrl: string) {
  const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  if (!csrfResponse.ok) throw new Error('Impossible de préparer la connexion Google.');
  const csrf = await parseJsonResponse<{ csrfToken?: string }>(csrfResponse);
  if (!csrf?.csrfToken) throw new Error('Impossible de préparer la connexion Google.');
  const response = await fetch('/api/auth/signin/google', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, callbackUrl }),
  });
  const result = await parseJsonResponse<{ url?: string; message?: string }>(response);
  if (!response.ok || !result?.url) throw new Error(result?.message || 'La connexion Google a échoué.');
  window.location.assign(result.url);
}

export async function signOutApp() {
  const csrfResponse = await fetch('/api/auth/csrf', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!csrfResponse.ok) throw new Error('Impossible de terminer la déconnexion.');

  const csrf = await parseJsonResponse<{ csrfToken?: string }>(csrfResponse);
  if (!csrf?.csrfToken) throw new Error('Impossible de terminer la déconnexion.');
  const response = await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, callbackUrl: window.location.origin }),
  });
  const result = await parseJsonResponse<{ url?: string }>(response);
  if (!response.ok) throw new Error('La déconnexion a échoué.');
  window.location.assign(result?.url || '/');
}
