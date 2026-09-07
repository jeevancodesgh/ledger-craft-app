import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler, notFoundHandler } from './middleware/errors';
import { requestLogging } from './middleware/logging';
import { requestContext } from './middleware/request-context';
import { sessionRoutes } from './modules/auth/session.routes';
import { healthRoutes } from './modules/health/health.routes';
import { getBetterAuthTrustedOrigins } from './env';
import type { AppDependencies, AppEnv } from './types';

export function createApp(deps: AppDependencies = {}) {
  const app = new Hono<AppEnv>();

  app.use('*', requestContext);
  app.use('*', async (c, next) => {
    if (deps.checkDatabase) {
      c.set('checkDatabase', deps.checkDatabase);
    }
    if (deps.auth) {
      c.set('auth', deps.auth);
    }
    if (deps.db) {
      c.set('db', deps.db);
    }
    await next();
  });
  app.use('*', requestLogging);
  app.use(
    '/api/auth/*',
    cors({
      origin: getBetterAuthTrustedOrigins(),
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['POST', 'GET', 'OPTIONS'],
    }),
  );

  app.on(['POST', 'GET'], '/api/auth/*', (c) => {
    const auth = c.get('auth');
    if (!auth) {
      return c.notFound();
    }
    return auth.handler(c.req.raw);
  });

  app.route('/', healthRoutes());
  app.route('/', sessionRoutes());

  if (process.env.NODE_ENV === 'test') {
    app.get('/api/__test/boom', () => {
      throw new Error('pg: password authentication failed for user "postgres"');
    });
  }

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
}
