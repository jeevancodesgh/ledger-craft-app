# LedgerCraft - Expense Tracking & Invoice Management

A modern PWA expense tracking application built with React, TypeScript, and Supabase.

## Key Features

- 💰 **Expense Tracking**: Comprehensive expense management and categorization
- 🧾 **Invoice Generation**: Create, edit, and share professional invoices
- 🏦 **Bank Account Management**: Multi-account support with transaction imports
- 📊 **CSV Transaction Import**: Upload and process bank statements automatically
- 📱 **PWA Support**: Works offline with app installation capability
- 🔐 **Secure Authentication**: User management with Supabase Auth
- 📈 **Financial Reporting**: Generate reports for tax and business purposes
- 🎯 **Smart Categorization**: Automatic transaction categorization
- 🔄 **Real-time Sync**: Live data synchronization across devices

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Run E2E tests (requires dev server running)
npx playwright test
```

## Project info

**URL**: https://lovable.dev/projects/7aac0ff4-53ad-4885-a53b-af239ec30b67

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7aac0ff4-53ad-4885-a53b-af239ec30b67) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend & Database)
- Playwright (E2E Testing)
- Vitest (Unit Testing)

## Testing

This project includes comprehensive testing coverage with both unit tests and end-to-end (E2E) tests.

### Unit Tests

Unit tests are built with **Vitest** and **React Testing Library** for component and service testing.

#### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- bankAccountService.test.ts

# Run tests matching a pattern
npm test -- --run src/components/bank-account/
```

#### Unit Test Coverage

- ✅ **Service Layer**: Bank account management, CSV parsing, transaction import
- ✅ **Components**: Bank account dialog, file upload zone
- ✅ **Utilities**: CSV column mapping, transaction categorization
- ✅ **Validation**: Form validation, data validation

### End-to-End (E2E) Tests

E2E tests are built with **Playwright** and test the complete user workflows with real database interactions.

#### Prerequisites for E2E Tests

1. **Running Development Server**: Ensure the app is running on `http://localhost:8081`
2. **Environment Variables**: Set up required environment variables for test authentication
3. **User Credentials**: Tests use real authentication with provided credentials
4. **Supabase Access**: Tests interact with the actual Supabase database

#### Environment Setup for E2E Tests

Create a `.env.local` file with the following variables:

```bash
# E2E Testing Configuration
E2E_TEST_EMAIL=your_test_user_email@example.com
E2E_TEST_PASSWORD=your_test_user_password
```

**Note**: Use a dedicated test user account. Do not use production user credentials.

#### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test suite
npx playwright test transaction-import-simple.spec.ts

# Run with browser UI visible (headed mode)
npx playwright test --headed

# Run specific test by name
npx playwright test -g "Complete transaction import workflow"

# Run tests in a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests with debugging
npx playwright test --debug

# Generate test report
npx playwright show-report
```

#### E2E Test Coverage

**Transaction Import Workflow:**
- ✅ User authentication and login
- ✅ Bank account creation and validation
- ✅ Navigation between pages
- ✅ CSV file upload and processing
- ✅ Column mapping and data preview
- ✅ Transaction import and completion
- ✅ Data persistence verification
- ✅ Error handling and validation

**Test Scenarios:**
1. **Complete Import Flow**: Full workflow from login to transaction import
2. **Validation Testing**: Form validation and error handling
3. **File Upload Testing**: Invalid file handling and user feedback

#### E2E Test Files

- `tests/e2e/transaction-import-simple.spec.ts` - Main transaction import tests
- `tests/e2e/debug-login.spec.ts` - Login flow debugging
- `tests/e2e/auth-utils.ts` - Authentication utilities (for mocked tests)

#### Sample Test Data

Tests use realistic CSV transaction data:
```csv
Date,Description,Amount,Balance
15/01/2024,"EFTPOS PURCHASE 123 NEW WORLD AUCKLAND",-45.67,1234.56
16/01/2024,"SALARY PAYMENT - ACME CORP",2500.00,3734.56
17/01/2024,"AUTOMATIC PAYMENT - POWER COMPANY",-120.50,3614.06
```

### Test Configuration

#### Playwright Configuration

- **Base URL**: `http://localhost:8081`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeout**: 120 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure

#### Vitest Configuration

- **Environment**: jsdom
- **Setup Files**: `src/test/setup.ts`
- **Coverage**: Text, JSON, and HTML reports
- **Global**: True (no need to import test functions)

### Running Tests in CI/CD

Tests can be integrated into CI/CD pipelines:

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps

# Run unit tests
npm test

# Start development server in background
npm run dev &

# Wait for server to be ready
npx wait-on http://localhost:8081

# Run E2E tests
npx playwright test

# Stop development server
pkill -f "npm run dev"
```

### Test Data Management

- **Unit Tests**: Use mocked data and services
- **E2E Tests**: Create and clean up test data automatically
- **Database**: E2E tests use real Supabase database with cleanup procedures

### Debugging Tests

#### Unit Tests
```bash
# Debug specific test
npm test -- --run --reporter=verbose bankAccountService.test.ts

# Debug with browser tools (for UI components)
npm test -- --run --inspect-brk
```

#### E2E Tests
```bash
# Debug mode with step-by-step execution
npx playwright test --debug

# Headed mode to see browser actions
npx playwright test --headed --slowMo=1000

# Generate trace for failed tests
npx playwright test --trace=on-failure

# View trace files
npx playwright show-trace trace.zip
```

### Test Best Practices

1. **Isolation**: Each test should be independent and clean up after itself
2. **Real Data**: E2E tests use real authentication and database interactions
3. **Error Handling**: Tests verify both success and failure scenarios
4. **User Experience**: Tests follow actual user workflows
5. **Performance**: Tests include timeout and performance considerations

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7aac0ff4-53ad-4885-a53b-af239ec30b67) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
