import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createAppDb } from './db/client';
import { apiHost, apiPort } from './env';
import { createAuth } from './modules/auth/auth';

function createRuntimeApp() {
  const { db, sql } = createAppDb();
  const auth = createAuth(db);
  return createApp({
    auth,
    db,
    checkDatabase: async () => {
      try {
        await sql`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
  });
}

serve({ fetch: createRuntimeApp().fetch, port: apiPort, hostname: apiHost }, (info) => {
  console.log(JSON.stringify({ msg: 'api_listen', host: info.address, port: info.port }));
});
