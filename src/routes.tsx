import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/ui/spinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/hooks/use-toast";
import { AppProvider } from "./context/AppContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { ConversationProvider } from "./context/ConversationContext";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
//import AccountsPage from './pages/Accounts';

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const CreateInvoice = lazy(() => import("@/pages/CreateInvoice"));
const EditInvoice = lazy(() => import("@/pages/EditInvoice"));
const Customers = lazy(() => import("@/pages/Customers"));
const Items = lazy(() => import("@/pages/Items"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ModernLogin = lazy(() => import("@/pages/ModernLogin"));
const ModernSignup = lazy(() => import("@/pages/ModernSignup"));
const InvoiceViewPage = lazy(() => import("@/pages/InvoiceViewPage"));
const PublicInvoice = lazy(() => import("@/pages/PublicInvoice"));
const SharedInvoice = lazy(() => import("@/pages/SharedInvoice"));
const AccountsPage = lazy(() => import("@/pages/Accounts"));
const Categories = lazy(() => import("@/pages/Categories"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const ExpenseCategories = lazy(() => import("@/pages/ExpenseCategories"));
const BankAccounts = lazy(() => import("@/pages/BankAccounts"));
const TransactionImport = lazy(() => import("@/pages/TransactionImport"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const EmailConfirmation = lazy(() => import("@/pages/EmailConfirmation"));

// Payment & Accounting Pages
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const ReceiptsPage = lazy(() => import("@/pages/ReceiptsPage"));
const AccountingDashboardPage = lazy(() => import("@/pages/AccountingDashboardPage"));
const TaxConfigurationPage = lazy(() => import("@/pages/TaxConfigurationPage"));
const TaxOverviewPage = lazy(() => import("@/pages/TaxOverviewPage"));
const FinancialReportsPage = lazy(() => import("@/pages/FinancialReportsPage"));
const IRDReportingPage = lazy(() => import("@/pages/IRDReportingPage"));
const JournalEntriesPage = lazy(() => import("@/pages/JournalEntriesPage"));
const ReceiptViewPage = lazy(() => import("@/pages/ReceiptViewPage"));
const PaymentDetailPage = lazy(() => import("@/pages/PaymentDetailPage"));
// Loading component
const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <Spinner />
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
);

const queryClient = new QueryClient();

const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppProvider>
              <ConversationProvider>
                <Outlet />
                <Toaster />
                <Sonner />
              </ConversationProvider>
            </AppProvider>
          </AuthProvider>
        </TooltipProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

const appRoutes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      {
        path: "/login",
        element: <SuspenseWrapper><ModernLogin /></SuspenseWrapper>,
      },
      {
        path: "/signup",
        element: <SuspenseWrapper><ModernSignup /></SuspenseWrapper>,
      },
      {
        path: "/login-classic",
        element: <SuspenseWrapper><Login /></SuspenseWrapper>,
      },
      {
        path: "/signup-classic",
        element: <SuspenseWrapper><Signup /></SuspenseWrapper>,
      },
      {
        path: "/confirm-email",
        element: <SuspenseWrapper><EmailConfirmation /></SuspenseWrapper>,
      },
      {
        path: "/onboarding",
        element: (
          <ProtectedRoute requireOnboarding={false}>
            <SuspenseWrapper><Onboarding /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <SuspenseWrapper>
              <AppLayout>
                <Outlet />
              </AppLayout>
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: "invoices", element: <Invoices /> },
          { path: "invoices/new", element: <CreateInvoice /> },
          { path: "invoices/create", element: <CreateInvoice /> },
          { path: "invoices/:id/edit", element: <EditInvoice /> },
          { path: "invoices/:id", element: <InvoiceViewPage /> },
          { path: "customers", element: <Customers /> },
          { path: "items", element: <Items /> },
          { path: "settings", element: <Settings /> },
          { path: "accounts", element: <AccountsPage /> },
          { path: "bank-accounts", element: <BankAccounts /> },
          { path: "transaction-import", element: <TransactionImport /> },
          { path: "categories", element: <Categories /> },
          { path: "expenses", element: <Expenses /> },
          { path: "expense-categories", element: <ExpenseCategories /> },
          
          // Payment & Accounting Routes
          { 
            path: "payments", 
            element: (
              <PermissionGuard permission="payments:read">
                <PaymentsPage />
              </PermissionGuard>
            )
          },
          { 
            path: "payments/:id", 
            element: (
              <PermissionGuard permission="payments:read">
                <PaymentDetailPage />
              </PermissionGuard>
            )
          },
          { 
            path: "receipts", 
            element: (
              <PermissionGuard permission="receipts:read">
                <ReceiptsPage />
              </PermissionGuard>
            )
          },
          { 
            path: "receipts/:id", 
            element: (
              <PermissionGuard permission="receipts:read">
                <ReceiptViewPage />
              </PermissionGuard>
            )
          },
          { path: "accounting", element: <AccountingDashboardPage /> },
          { 
            path: "tax-config", 
            element: (
              <PermissionGuard permission="settings:manage">
                <TaxConfigurationPage />
              </PermissionGuard>
            )
          },
          { 
            path: "tax-overview", 
            element: (
              <PermissionGuard permission="reports:view">
                <TaxOverviewPage />
              </PermissionGuard>
            )
          },
          
          // Reports & Compliance Routes
          { 
            path: "reports", 
            element: (
              <PermissionGuard permission="reports:view">
                <FinancialReportsPage />
              </PermissionGuard>
            )
          },
          { 
            path: "financial-reports", 
            element: (
              <PermissionGuard permission="reports:view">
                <FinancialReportsPage />
              </PermissionGuard>
            )
          },
          { 
            path: "ird-reports", 
            element: (
              <PermissionGuard permission="reports:generate">
                <IRDReportingPage />
              </PermissionGuard>
            )
          },
          { path: "journal-entries", element: <JournalEntriesPage /> },
        ],
      },
      {
        path: "/public/invoice/:invoiceId",
        element: <SuspenseWrapper><PublicInvoice /></SuspenseWrapper>,
      },
      {
        path: "/shared/invoice/:shareToken",
        element: <SuspenseWrapper><SharedInvoice /></SuspenseWrapper>,
      },
      {
        path: "*",
        element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
      },
    ]
  }
];

export const router = createBrowserRouter(appRoutes);
