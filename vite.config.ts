import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

function localApiPlugin(): Plugin {
  const apiModules: Record<string, string> = {
    '/api/admin/catalog': '/api/admin/catalog.ts',
    '/api/admin/curriculum': '/api/admin/curriculum.ts',
    '/api/learning/dashboard': '/api/learning/dashboard.ts',
    '/api/learning/events': '/api/learning/events.ts',
    '/api/learning/lesson': '/api/learning/lesson.ts',
    '/api/learning/plan': '/api/learning/plan.ts',
    '/api/learning/program': '/api/learning/program.ts',
    '/api/learning/progress': '/api/learning/progress.ts',
    '/api/learning/quiz': '/api/learning/quiz.ts',
    '/api/learning/resource': '/api/learning/resource.ts',
    '/api/learning/video': '/api/learning/video.ts',
  };

  return {
    name: 'nova-local-api-routes',
    configureServer(server) {
      server.middlewares.use(async (incoming, outgoing, next) => {
        const pathname = new URL(incoming.url || '/', `http://${incoming.headers.host || 'localhost'}`).pathname;
        const isAuthRoute = pathname === '/api/auth' || pathname.startsWith('/api/auth/');
        const modulePath = isAuthRoute ? '/api/auth/[...auth].ts' : apiModules[pathname];
        if (!pathname.startsWith('/api/')) return next();
        if (!modulePath) {
          outgoing.statusCode = 404;
          outgoing.setHeader('Content-Type', 'application/json; charset=utf-8');
          outgoing.end(JSON.stringify({ error: 'Route API introuvable.' }));
          return;
        }

        try {
          const headers = new Headers();
          for (const [key, value] of Object.entries(incoming.headers)) {
            if (typeof value === 'string') headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(', '));
          }
          const method = incoming.method || 'GET';
          let body: Uint8Array<ArrayBuffer> | undefined;
          if (method !== 'GET' && method !== 'HEAD') {
            const chunks: Buffer[] = [];
            for await (const chunk of incoming) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            const bufferedBody = Buffer.concat(chunks);
            if (bufferedBody.length) {
              body = new Uint8Array(new ArrayBuffer(bufferedBody.length));
              body.set(bufferedBody);
            }
          }
          headers.delete('host');
          headers.delete('connection');
          headers.delete('content-length');
          headers.delete('transfer-encoding');
          const request = new Request(new URL(incoming.url || '/', `http://${incoming.headers.host || 'localhost'}`), {
            method,
            headers,
            ...(body ? { body } : {}),
          });

          const route = await server.ssrLoadModule(modulePath) as { default?: { fetch?: (request: Request) => Promise<Response> } };
          if (!route.default?.fetch) throw new Error(`Le module ${modulePath} n’expose pas de gestionnaire API.`);
          const response = await route.default.fetch(request);
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() !== 'set-cookie') outgoing.setHeader(key, value);
          });
          const cookies = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
          if (cookies?.length) outgoing.setHeader('Set-Cookie', cookies);
          else {
            const cookie = response.headers.get('set-cookie');
            if (cookie) outgoing.setHeader('Set-Cookie', cookie);
          }
          outgoing.statusCode = response.status;
          outgoing.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          console.error(`[local api] ${pathname}`, error);
          if (outgoing.headersSent) return next(error);
          outgoing.statusCode = 500;
          outgoing.setHeader('Content-Type', 'application/json; charset=utf-8');
          outgoing.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur API locale.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Keep server-only credentials available to API modules in local Vite mode.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [localApiPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
