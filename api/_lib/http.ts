export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function errorResponse(error: unknown, fallback = 'Une erreur serveur est survenue.') {
  console.error('[api]', error);
  return jsonResponse({ error: error instanceof Error ? error.message : fallback }, 500);
}

export function createApiHandler(action: (request: Request) => Promise<Response> | Response) {
  return {
    async fetch(request: Request) {
      try {
        return await action(request);
      } catch (error) {
        if (error instanceof Response) return jsonResponse({ error: await error.text() }, error.status);
        return errorResponse(error);
      }
    },
  };
}
