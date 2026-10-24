import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { requireUser } from '../_lib/app-session.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const { user } = await requireUser(request);
  const body = await request.json().catch(() => null) as { events?: unknown } | null;
  if (!Array.isArray(body?.events) || body.events.length > 50) return jsonResponse({ error: 'Lot d’événements invalide.' }, 400);
  const client = getServiceClient();
  const { data, error } = await client.rpc('app_record_learning_events', { p_user: user.id, p_events: body.events });
  if (error) throw error;
  const recorded = Number(data || 0);
  return jsonResponse({ recorded });
});

