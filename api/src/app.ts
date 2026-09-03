import { Hono } from 'hono';
import { errorHandler, notFoundHandler } from './middleware/errors';
import { requestLogging } from './middleware/logging';
import { requestContext } from './middleware/request-context';
import { healthRoutes } from './modules/health/health.routes';
import type { AppDependencies, AppEnv } from './types';

export function createApp(deps: AppDependencies = {}) {
  const app = new Hono<AppEnv>();

  app.use('*', requestContext);
  app.use('*', async (c, next) => {
    if (deps.checkDatabase) {
      c.set('checkDatabase', deps.checkDatabase);
    }
    await next();
  });
  app.use('*', requestLogging);

  app.route('/', healthRoutes());

  if (process.env.NODE_ENV === 'test') {
    app.get('/api/__test/boom', () => {
      throw new Error('pg: password authentication failed for user "postgres"');
    });
  }

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
}
