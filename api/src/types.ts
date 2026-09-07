import type { Database } from './db/client';
import type { Auth } from './modules/auth/auth';

export type AppEnv = {
  Variables: {
    requestId: string;
    checkDatabase?: () => Promise<boolean>;
    auth?: Auth;
    db?: Database;
  };
};

export type AppDependencies = {
  checkDatabase?: () => Promise<boolean>;
  auth?: Auth;
  db?: Database;
};
