
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';
import LoadingScreen from './components/LoadingScreen';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const EditInvoice = lazy(() => import('./pages/EditInvoice'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Items = lazy(() => import('./pages/Items'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'customers/:id',
        element: <CustomerDetail />,
      },
      {
        path: 'invoices',
        element: <Invoices />,
      },
      {
        path: 'invoices/create',
        element: <CreateInvoice />,
      },
      {
        path: 'invoices/:id',
        element: <InvoiceDetail />,
      },
      {
        path: 'invoices/:id/edit',
        element: <EditInvoice />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'items',
        element: <Items />,
      },
    ],
  },
]);

export default router;
