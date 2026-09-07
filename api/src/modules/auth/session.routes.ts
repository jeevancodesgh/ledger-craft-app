import { Hono, type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../../types';
import { getMe } from './get-me';

async function handleMe(c: Context<AppEnv>) {
  const auth = c.get('auth');
  const db = c.get('db');
  if (!auth) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  if (!db) {
    throw new HTTPException(503, { message: 'Database unavailable' });
  }

  return c.json(await getMe(db, session.user));
}

export function sessionRoutes() {
  const routes = new Hono<AppEnv>();
  routes.get('/me', handleMe);
  routes.get('/api/me', handleMe);
  return routes;
}
