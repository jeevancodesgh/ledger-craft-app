import { Page } from '@playwright/test';

export interface MockUser {
  id: string;
  email: string;
  fullName?: string;
  emailConfirmed?: boolean;
}

export interface MockAuthOptions {
  user?: MockUser;
  hasSession?: boolean;
  hasBusinessProfile?: boolean;
  needsEmailConfirmation?: boolean;
}

/**
 * Comprehensive authentication mocking utility for Playwright tests
 */
export class AuthMocker {
  constructor(private page: Page) {}

  /**
   * Set up authentication mocking before page navigation
   */
  async setupAuthMocking(options: MockAuthOptions = {}) {
    const {
      user = {
        id: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        emailConfirmed: true
      },
      hasSession = true,
      hasBusinessProfile = false,
      needsEmailConfirmation = false
    } = options;

    // Mock the Supabase client in the browser context
    await this.page.addInitScript(({ user, hasSession, hasBusinessProfile, needsEmailConfirmation }) => {
      // Create mock session data
      const mockSession = hasSession ? {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.fullName },
          email_confirmed_at: user.emailConfirmed ? new Date().toISOString() : null
        },
        expires_at: Date.now() + 3600000
      } : null;

      // Mock localStorage auth data
      if (hasSession) {
        localStorage.setItem('sb-viqckjmborlqaemavrzu-auth-token', JSON.stringify({
          currentSession: mockSession,
          expiresAt: Date.now() + 3600000
        }));
      }

      // Store mock data globally for route interception
      (window as any).__mockAuthData = {
        user,
        session: mockSession,
        hasBusinessProfile,
        needsEmailConfirmation
      };
    }, { user, hasSession, hasBusinessProfile, needsEmailConfirmation });

    // Set up route interceptions
    await this.setupRouteInterceptions();
    
    // Also mock the session endpoint for better compatibility
    await this.page.route('**/auth/v1/session', async route => {
      const mockData = await this.page.evaluate(() => (window as any).__mockAuthData);
      
      if (mockData.session) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData.session)
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No session' })
        });
      }
    });
  }

  /**
   * Set up all necessary route interceptions for auth
   */
  private async setupRouteInterceptions() {
    // Mock auth session endpoint
    await this.page.route('**/auth/v1/user', async route => {
      const mockData = await this.page.evaluate(() => (window as any).__mockAuthData);
      
      if (mockData.session) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData.user)
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      }
    });

    // Mock sign-up endpoint
    await this.page.route('**/auth/v1/signup', async route => {
      const mockData = await this.page.evaluate(() => (window as any).__mockAuthData);
      
      const response = {
        user: {
          id: mockData.user.id,
          email: mockData.user.email,
          user_metadata: { full_name: mockData.user.fullName },
          email_confirmed_at: mockData.needsEmailConfirmation ? null : new Date().toISOString()
        },
        session: mockData.needsEmailConfirmation ? null : mockData.session
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });

    // Mock sign-in endpoint
    await this.page.route('**/auth/v1/token**', async route => {
      const mockData = await this.page.evaluate(() => (window as any).__mockAuthData);
      
      if (route.request().url().includes('grant_type=password')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: mockData.user
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock business profile endpoint
    await this.page.route('**/rest/v1/business_profiles**', async route => {
      const mockData = await this.page.evaluate(() => (window as any).__mockAuthData);
      
      if (route.request().method() === 'GET') {
        if (mockData.hasBusinessProfile) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              id: 'business-profile-id',
              business_name: 'Test Business',
              business_email: 'business@test.com',
              country: 'United States'
            }])
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }
      } else if (route.request().method() === 'POST') {
        // Mock business profile creation
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'new-business-profile-id',
            business_name: 'Test Business',
            business_email: 'business@test.com',
            country: 'United States'
          }])
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Mock immediate authentication (no email confirmation)
   */
  async mockImmediateAuth(user?: Partial<MockUser>) {
    await this.setupAuthMocking({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        emailConfirmed: true,
        ...user
      },
      hasSession: true,
      hasBusinessProfile: false,
      needsEmailConfirmation: false
    });
  }

  /**
   * Mock email confirmation required
   */
  async mockEmailConfirmationRequired(user?: Partial<MockUser>) {
    await this.setupAuthMocking({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        emailConfirmed: false,
        ...user
      },
      hasSession: false,
      hasBusinessProfile: false,
      needsEmailConfirmation: true
    });
  }

  /**
   * Mock authenticated user with completed onboarding
   */
  async mockCompletedOnboarding(user?: Partial<MockUser>) {
    await this.setupAuthMocking({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        emailConfirmed: true,
        ...user
      },
      hasSession: true,
      hasBusinessProfile: true,
      needsEmailConfirmation: false
    });
  }
}