# End-to-End Tests with Playwright

This directory contains Playwright end-to-end tests for the Ledger Craft application.

## Test Files

### Sign-up Tests
- **`signup.spec.ts`**: Main sign-up flow tests including form display, user interactions, success/error handling, and accessibility
- **`signup-validation.spec.ts`**: Comprehensive validation tests for form fields, real-time validation, and edge cases

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# Run specific test file
npx playwright test signup.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Coverage

### Sign-up Form Tests
- ✅ Form display and field presence
- ✅ Password strength indicator
- ✅ Password visibility toggle
- ✅ Required field validation
- ✅ Password complexity validation
- ✅ Email format validation
- ✅ Password confirmation matching
- ✅ Terms agreement requirement
- ✅ Real-time field validation
- ✅ Form submission with loading states
- ✅ Success flow (redirect to onboarding)
- ✅ Error handling and display
- ✅ Navigation links
- ✅ Social signup buttons (coming soon)
- ✅ Mobile responsiveness
- ✅ Accessibility features
- ✅ Edge cases and special characters
- ✅ Focus management
- ✅ Maximum field lengths

## Test Data

Tests use unique email addresses generated with timestamps to avoid conflicts:
```typescript
const validUser = {
  fullName: 'John Doe',
  email: `test+${Date.now()}@example.com`,
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123'
};
```

## Mocking

Tests include mocking for:
- Supabase authentication responses
- Network delays for loading state testing
- Error scenarios

## Configuration

See `playwright.config.ts` for:
- Browser configurations (Chrome, Firefox, Safari, Mobile)
- Test timeout settings
- Screenshot and video recording on failures
- Local development server setup

## Best Practices

1. **Unique Test Data**: Each test uses unique email addresses to avoid conflicts
2. **Proper Selectors**: Using semantic selectors (roles, labels) over CSS selectors
3. **Accessibility Testing**: Verifying ARIA attributes and keyboard navigation
4. **Mobile Testing**: Responsive design verification
5. **Error Scenarios**: Testing both success and failure paths
6. **Loading States**: Verifying UI feedback during async operations

## Debugging

1. Use `test:e2e:debug` to run tests in debug mode
2. Use `test:e2e:ui` for interactive test development
3. Check `test-results/` directory for screenshots and videos of failed tests
4. Use `page.pause()` in tests to stop execution and inspect

## CI/CD Integration

Tests are configured to:
- Run in headless mode on CI
- Retry failed tests automatically
- Generate HTML reports
- Capture screenshots and videos on failures