# Agents.md - LLM Guide for LedgerCraft Project

This document provides comprehensive guidance for AI agents (LLMs) working on the LedgerCraft codebase. Use this as a reference for understanding project structure, conventions, and development patterns.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Key Conventions & Patterns](#key-conventions--patterns)
5. [Development Workflow](#development-workflow)
6. [Common Tasks Guide](#common-tasks-guide)
7. [Important Files Reference](#important-files-reference)
8. [Database Schema](#database-schema)
9. [Design System Guidelines](#design-system-guidelines)
10. [Testing Strategy](#testing-strategy)
11. [Deployment & Build](#deployment--build)

---

## Project Overview

**LedgerCraft** (formerly EasyBizInvoice) is a modern, dual-platform financial management application for businesses. The project consists of:

- **Web Application**: Progressive Web App (PWA) for desktop and mobile web browsers
- **Mobile Application**: Native iOS and Android apps built with React Native (Expo)

### Key Features

- 💰 **Expense Tracking**: Comprehensive expense management and categorization
- 🧾 **Invoice Generation**: Create, edit, and share professional invoices with templates
- 🏦 **Bank Account Management**: Multi-account support with transaction imports
- 📊 **CSV Transaction Import**: Upload and process bank statements automatically
- 💳 **Payment Management**: Track invoice payments and payment reminders
- 📱 **PWA Support**: Works offline with app installation capability
- 🔐 **Secure Authentication**: User management with Supabase Auth
- 📈 **Financial Reporting**: Generate reports for tax and business purposes
- 🎯 **Smart Categorization**: Automatic transaction categorization
- 🔄 **Real-time Sync**: Live data synchronization across devices
- 📄 **Receipt Scanning**: OCR-powered receipt scanning and extraction
- 📋 **Tax Reporting**: IRD-compliant tax reporting for New Zealand businesses

### Production URL

- Web: https://easybizinvoice.com
- Mobile: Available on iOS App Store and Google Play Store

---

## Architecture & Tech Stack

### Web Application Stack

- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.4+
- **Styling**: Tailwind CSS 3.4+ with shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React Context API
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Testing**: Vitest (unit), React Testing Library (components), Playwright (E2E)
- **Deployment**: Vercel/Netlify

### Mobile Application Stack

- **Framework**: React Native 0.81+ (Expo SDK ~54)
- **Language**: TypeScript
- **Styling**: NativeWind 4.2+ (Tailwind for React Native)
- **Navigation**: React Navigation v7
- **State Management**: Zustand 5.0+
- **Backend**: Supabase (shared with web)
- **Testing**: Jest with React Native Testing Library
- **Build & Deployment**: EAS Build (Expo Application Services)

### Backend & Infrastructure

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (email/password, OAuth)
- **Storage**: Supabase Storage (for receipts, invoices, logos)
- **Security**: Row Level Security (RLS) policies
- **Real-time**: Supabase Realtime subscriptions
- **API**: Supabase REST API and PostgREST

### Design System

- **Inspiration**: Revolut-style modern fintech UI
- **Color Palette**: Blue primary (#5B72EE), clean whites, subtle grays
- **Typography**: Clear hierarchy with bold headings, medium body text
- **Components**: Card-based layouts, rounded corners, subtle shadows
- **Animations**: Smooth transitions (200-300ms), micro-interactions

---

## Project Structure

### Root Directory

```
ledger-craft-app/
├── src/                    # Web application source
├── mobile/                 # Mobile application source
├── supabase/               # Database migrations and config
├── tests/                  # E2E tests (Playwright)
├── public/                 # Static assets for web
├── .cursor/                # Cursor IDE rules and configs
└── Agents.md              # This file
```

### Web Application (`/src`)

```
src/
├── main.tsx               # Entry point (React DOM render)
├── App.tsx                # Root component with providers
├── routes.tsx             # React Router configuration
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── invoice/          # Invoice-related components
│   ├── expense/          # Expense management components
│   ├── payment/          # Payment tracking components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard widgets
│   ├── layout/           # Layout components (headers, sidebars)
│   └── common/           # Shared utility components
├── pages/                # Page components (route handlers)
├── services/             # Service layer (Supabase abstractions)
├── hooks/                # Custom React hooks
├── context/              # React Context providers
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── lib/                  # Library configurations
│   ├── providers/       # Context providers
│   └── store/           # State management utilities
└── integrations/         # Third-party integrations
    └── supabase/        # Supabase client and types
```

### Mobile Application (`/mobile/src`)

```
mobile/src/
├── App.tsx               # Entry point (Expo)
├── navigation/           # React Navigation setup
│   ├── AppNavigator.tsx # Main app navigation
│   ├── AuthNavigator.tsx # Auth flow navigation
│   └── types.ts         # Navigation type definitions
├── screens/             # Screen components
│   ├── auth/            # Login, signup, onboarding
│   ├── invoices/       # Invoice list, detail, create
│   ├── main/           # Dashboard
│   └── settings/       # Settings screens
├── components/          # Reusable components
│   ├── ui/            # Base UI components
│   ├── invoice/       # Invoice-specific components
│   ├── dashboard/     # Dashboard widgets
│   └── onboarding/    # Onboarding flow components
├── services/           # Service layer (Supabase)
├── store/              # Zustand state management
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

### Database (`/supabase`)

```
supabase/
├── migrations/          # SQL migration files
├── config.toml         # Supabase configuration
└── types.ts            # Generated TypeScript types
```

---

## Key Conventions & Patterns

### Database Naming Conventions

**CRITICAL**: Supabase uses `snake_case` for all database columns and tables. TypeScript code uses `camelCase`.

**Database (Supabase)**:
- Table names: `business_profiles`, `invoice_items`, `payment_accounts`
- Column names: `user_id`, `created_at`, `sale_price`, `invoice_number`

**TypeScript**:
- Interface properties: `userId`, `createdAt`, `salePrice`, `invoiceNumber`
- Transform snake_case → camelCase in service layer

**Example Service Pattern**:

```typescript
// services/invoiceService.ts
const { data, error } = await supabase
  .from('invoices')
  .select('id, user_id, invoice_number, created_at')  // snake_case
  .eq('user_id', userId)  // snake_case in query
  .single();

// Transform to camelCase for TypeScript
const invoice: Invoice = {
  id: data.id,
  userId: data.user_id,           // Transform
  invoiceNumber: data.invoice_number,  // Transform
  createdAt: data.created_at,     // Transform
};
```

### Component Patterns

**Web Components**:
- Functional components with TypeScript interfaces
- Use hooks (`useState`, `useEffect`, custom hooks)
- Props typed with interfaces, not inline types
- Co-locate components in feature folders

```typescript
// components/invoice/InvoiceCard.tsx
interface InvoiceCardProps {
  invoice: Invoice;
  onEdit?: (id: string) => void;
}

export function InvoiceCard({ invoice, onEdit }: InvoiceCardProps) {
  // Component implementation
}
```

**Mobile Components**:
- React Native components (`View`, `Text`, `TouchableOpacity`)
- Use NativeWind `className` prop for styling
- StyleSheet for complex dynamic styles
- Never use HTML elements (`div`, `span`, `button`)

```typescript
// mobile/src/components/ui/ModernButton.tsx
import { View, Text, TouchableOpacity } from 'react-native';

export function ModernButton({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity className="bg-blue-500 rounded-xl px-6 py-3" onPress={onPress}>
      <Text className="text-white font-semibold">{title}</Text>
    </TouchableOpacity>
  );
}
```

### Service Layer Pattern

**Always use services, never direct Supabase calls in components.**

```typescript
// ✅ GOOD: Component uses service
import { invoiceService } from '@/services/invoiceService';

function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  useEffect(() => {
    invoiceService.getInvoices(userId).then(setInvoices);
  }, [userId]);
}

// ❌ BAD: Component directly queries Supabase
import { supabase } from '@/integrations/supabase/client';

function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  
  useEffect(() => {
    supabase.from('invoices').select('*').then(...);  // Don't do this!
  }, []);
}
```

**Service Pattern**:

```typescript
// services/invoiceService.ts
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, DatabaseInvoice } from '@/types';

export const invoiceService = {
  async getInvoices(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)  // snake_case
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform snake_case to camelCase
    return data.map(transformInvoice);
  },
  
  async createInvoice(invoice: CreateInvoiceInput): Promise<Invoice> {
    // Transform camelCase to snake_case for insert
    const dbInvoice: DatabaseInvoice = {
      user_id: invoice.userId,
      invoice_number: invoice.invoiceNumber,
      // ...
    };
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(dbInvoice)
      .select()
      .single();
    
    if (error) throw error;
    return transformInvoice(data);
  }
};

function transformInvoice(db: DatabaseInvoice): Invoice {
  return {
    id: db.id,
    userId: db.user_id,
    invoiceNumber: db.invoice_number,
    createdAt: db.created_at,
    // ...
  };
}
```

### State Management

**Web**: React Context API
- Use `AppContext` for global app state
- Use `AuthContext` for authentication state
- Use local `useState` for component-specific state
- Use TanStack Query for server state caching

**Mobile**: Zustand
- Store slices in `/mobile/src/store/`
- Separate slices by domain: `authSlice`, `invoiceSlice`, etc.
- Use TypeScript for type safety
- Persist critical state (auth) with middleware

```typescript
// mobile/src/store/authSlice.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      signIn: async (email, password) => {
        // Implementation
      },
      signOut: async () => {
        // Implementation
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### Design System: Revolut-Inspired UI

**Color Palette**:
- Primary: `#5B72EE` (Revolut blue)
- Secondary: `#4A5FD8` (darker blue)
- Accent: `#00D4FF` (cyan)
- Success: `#10B981` (emerald)
- Warning: `#F59E0B` (amber)
- Danger: `#EF4444` (red)
- Background: `#F8FAFC` (light gray)
- Text Primary: `#1E293B` (dark slate)
- Text Secondary: `#64748B` (medium slate)

**Component Styling**:
- Cards: `rounded-xl` or `rounded-2xl`, `shadow-sm`, white background
- Buttons: Primary (blue bg, white text), Secondary (white bg, blue border)
- Inputs: Light gray background (`#F8FAFC`), rounded borders
- Typography: Bold headings (700), medium body (500), clear hierarchy

**See**: `.cursor/rules/project-guide.mdc` for complete design system guidelines.

---

## Development Workflow

### Environment Setup

**Required Environment Variables**:

**Web** (`.env` or `.env.local`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Mobile** (`.env` in `/mobile`):
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development Commands

**Web**:
```bash
npm run dev          # Start dev server (Vite)
npm run build       # Build for production
npm test            # Run unit tests (Vitest)
npm run test:ui     # Test UI (Vitest)
npm run test:e2e    # Run E2E tests (Playwright)
npm run type-check  # TypeScript type checking
npm run lint        # ESLint
```

**Mobile**:
```bash
cd mobile
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm test            # Run Jest tests
npm run test:watch  # Tests in watch mode
```

### Code Organization

**Atomic Design Structure** (for components):
- `atoms/`: Basic building blocks (Button, Input, Badge)
- `molecules/`: Composed components (FormField, Card)
- `organisms/`: Complex components (InvoiceForm, Dashboard)
- `pages/`: Full page components

**Feature-Based Structure** (also used):
- Group by feature: `invoice/`, `expense/`, `payment/`
- Co-locate related files (component, styles, tests, types)

### Git Workflow

- Create feature branches from `main`
- Commit messages should be descriptive
- Run tests before committing
- Use conventional commits format recommended

---

## Common Tasks Guide

### Adding a New Feature

**1. Plan the Feature**
- Identify required database tables/columns
- Design component structure
- Plan service layer methods

**2. Database Changes**
- Create migration file in `/supabase/migrations/`
- Use snake_case for all names
- Add RLS policies
- Run migration locally

**Example Migration**:
```sql
-- supabase/migrations/YYYYMMDD_create_feature_table.sql
create table features (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table features enable row level security;

create policy "Users can view own features"
  on features for select
  using (auth.uid() = user_id);
```

**3. Create TypeScript Types**
- Add types to `/src/types/` or `/mobile/src/types/`
- Match database schema (camelCase)

**4. Create Service Layer**
- Add service file: `/src/services/featureService.ts`
- Implement CRUD operations
- Handle errors and transformations

**5. Create Components**
- Build UI components in `/src/components/feature/`
- Use Revolut design system
- Add proper TypeScript types

**6. Create Page/Route**
- Add page component: `/src/pages/Feature.tsx`
- Add route in `src/routes.tsx`
- Connect to service layer

**7. Add Tests**
- Unit tests for service: `/src/services/__tests__/featureService.test.ts`
- Component tests: Co-locate with components
- E2E tests: `/tests/e2e/feature.spec.ts`

### Adding a Mobile Feature

**1-4. Same as Web** (database, types, service)

**5. Create Mobile Service**
- Add service: `/mobile/src/services/featureService.ts`
- Follow mobile service patterns (error handling, transforms)

**6. Create Screen**
- Add screen: `/mobile/src/screens/feature/FeatureScreen.tsx`
- Use React Native components
- Add navigation route in `/mobile/src/navigation/`

**7. Add to Store (if needed)**
- Create Zustand slice: `/mobile/src/store/featureSlice.ts`
- Add to store exports

**8. Add Tests**
- Jest tests: `/mobile/src/services/__tests__/featureService.test.ts`

### Modifying Database Schema

**1. Create Migration**
- Use descriptive filename: `YYYYMMDD_description.sql`
- Include `up` and `down` migrations if needed
- Test locally first

**2. Update TypeScript Types**
- Regenerate types: `npx supabase gen types typescript`
- Or manually update types in `/src/integrations/supabase/types.ts`

**3. Update Services**
- Modify service methods to handle new schema
- Update transformations

**4. Update Components**
- Modify UI to use new data structure

### Working with Invoices

**Key Files**:
- Service: `/src/services/invoiceService.ts`
- Components: `/src/components/invoice/`
- Pages: `/src/pages/CreateInvoice.tsx`, `/src/pages/EditInvoice.tsx`
- Types: `/src/types/index.ts` (Invoice interface)
- Templates: `/mobile/src/utils/invoiceTemplates.ts`

**Common Operations**:
- Create invoice: `invoiceService.createInvoice()`
- Get invoices: `invoiceService.getInvoices()`
- Update invoice: `invoiceService.updateInvoice()`
- Generate PDF: `pdfService.generateInvoicePDF()`

### Working with Payments

**Key Files**:
- Service: `/src/services/paymentService.ts`
- Components: `/src/components/payment/`
- Pages: `/src/pages/PaymentsPage.tsx`

**Payment Flow**:
1. Invoice created → payment record initialized
2. Payment captured → update invoice status
3. Payment reminders sent automatically

---

## Important Files Reference

### Entry Points

- **Web**: `src/main.tsx` - React DOM render, imports `App.tsx`
- **Mobile**: `mobile/index.ts` - Expo entry, imports `mobile/App.tsx`

### Routing

- **Web**: `src/routes.tsx` - React Router configuration with lazy loading
- **Mobile**: 
  - `mobile/src/navigation/index.tsx` - Root navigator
  - `mobile/src/navigation/AppNavigator.tsx` - Main app navigation
  - `mobile/src/navigation/AuthNavigator.tsx` - Auth flow navigation
  - `mobile/src/navigation/types.ts` - Navigation type definitions

### Configuration

- **Web**: `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- **Mobile**: 
  - `mobile/app.config.js` - Expo configuration
  - `mobile/tailwind.config.js` - NativeWind configuration
  - `mobile/tsconfig.json` - TypeScript config

### Supabase Client

- **Web**: `src/integrations/supabase/client.ts`
- **Mobile**: `mobile/src/services/supabaseClient.ts`

**Note**: Web client is auto-generated. Mobile client uses SecureStore for auth persistence.

### State Management

- **Web Context**: 
  - `src/context/StableAppContext.tsx` - App context
  - `src/context/StableAuthContext.tsx` - Auth context
- **Mobile Store**: `mobile/src/store/` (Zustand slices)

### Services (Key Examples)

- `src/services/invoiceService.ts` - Invoice CRUD operations
- `src/services/paymentService.ts` - Payment tracking
- `src/services/bankAccountService.ts` - Bank account management
- `src/services/taxCalculationService.ts` - Tax calculations
- `mobile/src/services/invoiceService.ts` - Mobile invoice service
- `mobile/src/services/customerService.ts` - Mobile customer service

### Documentation

- `README.md` - Project overview and setup
- `.cursor/rules/project-guide.mdc` - Comprehensive development rules
- `mobile/PLAY_STORE_CHECKLIST.md` - Mobile deployment checklist
- This file: `Agents.md` - LLM agent guide

---

## Database Schema

### Key Tables

**Core Tables**:
- `invoices` - Invoice records
- `invoice_items` - Line items for invoices
- `customers` - Customer/client records
- `items` - Reusable items/products
- `expenses` - Expense records
- `payments` - Payment records (linked to invoices)
- `business_profiles` - Business/user profile information

**Supporting Tables**:
- `bank_accounts` - Bank account information
- `transactions` - Imported bank transactions
- `receipts` - Receipt records with OCR data
- `payment_accounts` - Payment account configurations
- `tax_configurations` - Tax settings per business
- `invoice_templates` - Custom invoice templates

### Row Level Security (RLS)

**Always enabled on user data tables**. Policies follow pattern:
```sql
create policy "Users can view own data"
  on table_name for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on table_name for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on table_name for update
  using (auth.uid() = user_id);
```

**Never bypass RLS in frontend code**. All security handled at database level.

### Query Patterns

**Always use services, never direct Supabase queries in components.**

**Good Pattern**:
```typescript
// Service layer
const invoices = await invoiceService.getInvoices(userId);

// Component
const [invoices, setInvoices] = useState<Invoice[]>([]);
useEffect(() => {
  invoiceService.getInvoices(userId).then(setInvoices);
}, [userId]);
```

**Bad Pattern**:
```typescript
// ❌ Don't do this in components
const { data } = await supabase.from('invoices').select('*');
```

### Foreign Key Relationships

Common relationships:
- `invoices.user_id` → `auth.users.id`
- `invoices.customer_id` → `customers.id`
- `invoice_items.invoice_id` → `invoices.id`
- `payments.invoice_id` → `invoices.id`
- `expenses.user_id` → `auth.users.id`

---

## Design System Guidelines

### Revolut-Inspired UI

**Color Palette** (use Tailwind classes or hex codes):

```typescript
// Primary brand colors
primary: '#5B72EE'      // bg-blue-500 or custom
secondary: '#4A5FD8'     // darker blue
accent: '#00D4FF'        // cyan

// Semantic colors
success: '#10B981'       // bg-emerald-500
warning: '#F59E0B'       // bg-amber-500
danger: '#EF4444'        // bg-red-500

// Neutral colors
background: '#F8FAFC'   // bg-slate-50
surface: '#FFFFFF'       // bg-white
textPrimary: '#1E293B'   // text-slate-800
textSecondary: '#64748B'  // text-slate-500
border: '#E2E8F0'        // border-slate-200
```

### Component Patterns

**Cards**:
```tsx
// Web
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  {/* Content */}
</div>

// Mobile
<View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  {/* Content */}
</View>
```

**Buttons**:
```tsx
// Primary button
<button className="bg-blue-500 text-white rounded-xl px-6 py-3 font-semibold shadow-sm">
  Submit
</button>

// Secondary button
<button className="bg-white text-blue-500 border border-blue-500 rounded-xl px-6 py-3 font-semibold">
  Cancel
</button>
```

**Inputs**:
```tsx
<input 
  className="bg-slate-50 rounded-xl px-4 py-3 border-0 focus:ring-2 focus:ring-blue-500"
  placeholder="Enter text..."
/>
```

**Status Badges**:
```tsx
// Paid (green)
<span className="bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
  ✓ Paid
</span>

// Draft (gray)
<span className="bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
  📝 Draft
</span>
```

### Typography

**Headings**:
- H1: `text-2xl font-bold` (24px, 700)
- H2: `text-xl font-semibold` (20px, 600)
- H3: `text-lg font-semibold` (18px, 600)

**Body**:
- Default: `text-base font-normal` (16px, 400)
- Medium: `text-base font-medium` (16px, 500)
- Small: `text-sm font-normal` (14px, 400)

**Labels**:
- `text-xs font-medium uppercase tracking-wide` (12px, 500, uppercase)

### Animations

**Transitions**:
```tsx
className="transition-all duration-200"
```

**Common animations**:
- Button press: Scale to 0.95-0.98
- Page transitions: Slide-in from right (400-500ms)
- Fade-in: Opacity + translateY (200-300ms)

**See**: `.cursor/rules/project-guide.mdc` for complete design system details.

---

## Testing Strategy

### Web Testing

**Unit Tests** (Vitest):
- Location: `src/services/__tests__/`
- Test services and utilities
- Mock Supabase client
- Example: `invoiceService.test.ts`

**Component Tests** (React Testing Library):
- Location: Co-located with components or `src/components/__tests__/`
- Test user interactions
- Mock services and contexts

**E2E Tests** (Playwright):
- Location: `tests/e2e/`
- Test complete user workflows
- Real Supabase connection (test environment)
- Example: `transaction-import-simple.spec.ts`

**Running Tests**:
```bash
npm test              # Unit + component tests
npm run test:ui       # Vitest UI
npm run test:e2e      # E2E tests (requires dev server)
npm run test:coverage # Coverage report
```

### Mobile Testing

**Unit Tests** (Jest):
- Location: `mobile/src/services/__tests__/`
- Test services (mock Supabase)
- Test utilities

**Component Tests** (React Native Testing Library):
- Location: Co-located or `mobile/src/components/__tests__/`
- Test React Native components
- Mock navigation and services

**Test Setup**:
- `mobile/jest.config.js` - Jest configuration
- `mobile/jest.setup.js` - Test setup file
- `mobile/src/__tests__/setup/` - Test utilities

**Running Tests**:
```bash
cd mobile
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies (Supabase, APIs)
3. **Coverage**: Aim for >80% coverage on services
4. **Real E2E**: E2E tests use real Supabase (test database)
5. **Cleanup**: Clean up test data after tests

---

## Deployment & Build

### Web Deployment

**Build**:
```bash
npm run build  # Creates /dist folder
```

**Deployment Platforms**:
- **Vercel**: Automatic from Git pushes
- **Netlify**: Automatic from Git pushes

**Environment Variables** (set in deployment platform):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**PWA Configuration**:
- `vite-plugin-pwa` handles service worker
- Manifest: `public/manifest.webmanifest`
- Icons: `public/icons/`

### Mobile Deployment

**EAS Build** (Expo Application Services):
```bash
cd mobile

# Production build
npm run build:android

# Preview build (for testing)
npm run build:android:preview

# Development build (with Expo Go)
npm run build:android:development
```

**EAS Submit** (to stores):
```bash
npm run submit:android  # Submit to Google Play
```

**Configuration**:
- `mobile/app.config.js` - Expo configuration
- `mobile/eas.json` - EAS build profiles

**Environment Variables**:
- Set in EAS secrets or `.env` file
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Store Requirements**:
- See `mobile/PLAY_STORE_CHECKLIST.md` for complete checklist
- App icons, splash screens, privacy policy
- Store listings and screenshots

### Version Management

**Web**: Uses `package.json` version
- Auto-versioning scripts: `scripts/auto-version.js`
- Version displayed in app footer

**Mobile**: Uses `mobile/app.json` version
- Update `version` and `buildNumber` for each release
- iOS: `ios.buildNumber` (CFBundleVersion)
- Android: `android.versionCode`

### Pre-Deployment Checklist

**Web**:
- [ ] Run `npm run type-check` (no TypeScript errors)
- [ ] Run `npm test` (all tests pass)
- [ ] Run `npm run build` (build succeeds)
- [ ] Test production build locally
- [ ] Environment variables set in deployment platform

**Mobile**:
- [ ] Run `npm test` in `/mobile`
- [ ] Test on physical devices (iOS + Android)
- [ ] Update version numbers
- [ ] Update store listings
- [ ] EAS secrets configured
- [ ] Icons and splash screens updated

---

## Quick Reference

### Common Import Paths

**Web**:
```typescript
import { supabase } from '@/integrations/supabase/client';
import { invoiceService } from '@/services/invoiceService';
import { useAuth } from '@/context/StableAuthContext';
```

**Mobile**:
```typescript
import { supabase } from '@/services/supabaseClient';
import { invoiceService } from '@/services/invoiceService';
import { useAuth } from '@/store';
```

### Common Patterns

**Fetching Data**:
```typescript
// Web (with TanStack Query)
const { data, isLoading } = useQuery({
  queryKey: ['invoices', userId],
  queryFn: () => invoiceService.getInvoices(userId),
});

// Mobile (with Zustand or direct)
const [invoices, setInvoices] = useState([]);
useEffect(() => {
  invoiceService.getInvoices(userId).then(setInvoices);
}, [userId]);
```

**Error Handling**:
```typescript
try {
  const result = await invoiceService.createInvoice(data);
  // Success
} catch (error) {
  console.error('Error creating invoice:', error);
  // Show error to user
}
```

### File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `InvoiceCard.tsx`)
- Services: `camelCase.ts` (e.g., `invoiceService.ts`)
- Hooks: `useCamelCase.ts` (e.g., `useInvoices.ts`)
- Types: `camelCase.ts` or `index.ts` (e.g., `invoice.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

---

## Additional Resources

- **Project Rules**: `.cursor/rules/project-guide.mdc` - Comprehensive development guidelines
- **README**: `README.md` - Project setup and overview
- **Mobile Guide**: `mobile/README.md` - Mobile-specific documentation
- **Play Store Checklist**: `mobile/PLAY_STORE_CHECKLIST.md` - Mobile deployment guide

---

**Last Updated**: 2024
**Version**: 1.0.0

