import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createAppDb } from './db/client';
import { apiPort } from './env';

function createRuntimeApp() {
  const { sql } = createAppDb();
  return createApp({
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

serve({ fetch: createRuntimeApp().fetch, port: apiPort, hostname: '127.0.0.1' }, (info) => {
  console.log(JSON.stringify({ msg: 'api_listen', port: info.port }));
});
