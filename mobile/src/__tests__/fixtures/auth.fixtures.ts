import { User, Session } from '@supabase/supabase-js';

export const TEST_USER_CREDENTIALS = {
  email: 'test@ledgercraft.com',
  password: 'Test123!@#',
};

export const mockUser: Partial<User> = {
  id: 'test-user-id-123',
  email: TEST_USER_CREDENTIALS.email,
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    full_name: 'Test User',
  },
  aud: 'authenticated',
  role: 'authenticated',
};

export const mockSession: Partial<Session> = {
  access_token: 'mock-access-token-123',
  refresh_token: 'mock-refresh-token-456',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser as User,
};

export const mockAuthResponse = {
  data: {
    user: mockUser as User,
    session: mockSession as Session,
  },
  error: null,
};

export const mockAuthError = {
  data: {
    user: null,
    session: null,
  },
  error: {
    message: 'Invalid login credentials',
    status: 400,
  },
};

