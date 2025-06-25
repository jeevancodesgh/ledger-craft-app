import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/ui/spinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/hooks/use-toast";
import { AppProvider } from "./context/AppContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
const AccountsPage = lazy(() => import("@/pages/Accounts"));
const Categories = lazy(() => import("@/pages/Categories"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const ExpenseCategories = lazy(() => import("@/pages/ExpenseCategories"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
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
        <AppProvider>
          <TooltipProvider>
            <AuthProvider>
              <Outlet />
              <Toaster />
              <Sonner />
            </AuthProvider>
          </TooltipProvider>
        </AppProvider>
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
          { path: "invoices/:id/edit", element: <EditInvoice /> },
          { path: "invoices/:id", element: <InvoiceViewPage /> },
          { path: "customers", element: <Customers /> },
          { path: "items", element: <Items /> },
          { path: "settings", element: <Settings /> },
          { path: "accounts", element: <AccountsPage /> },
          { path: "categories", element: <Categories /> },
          { path: "expenses", element: <Expenses /> },
          { path: "expense-categories", element: <ExpenseCategories /> },
        ],
      },
      {
        path: "/public/invoice/:invoiceId",
        element: <SuspenseWrapper><PublicInvoice /></SuspenseWrapper>,
      },
      {
        path: "*",
        element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
      },
    ]
  }
];

export const router = createBrowserRouter(appRoutes);
