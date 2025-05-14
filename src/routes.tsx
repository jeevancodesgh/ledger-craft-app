import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/ui/spinner";

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
const InvoiceViewPage = lazy(() => import("@/pages/InvoiceViewPage"));

// Loading component
const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="invoices/:id/edit" element={<EditInvoice />} />
          <Route path="invoices/:id" element={<InvoiceViewPage />} />
          <Route path="customers" element={<Customers />} />
          <Route path="items" element={<Items />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
