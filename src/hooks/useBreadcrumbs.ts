import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrentPage?: boolean;
}

export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home
    breadcrumbs.push({
      label: 'Home',
      path: '/',
      isCurrentPage: pathSegments.length === 0
    });

    // Handle different route patterns
    if (pathSegments.length === 0) {
      return breadcrumbs;
    }

    const [firstSegment, secondSegment, thirdSegment] = pathSegments;

    // Main section pages
    switch (firstSegment) {
      case 'invoices':
        breadcrumbs.push({
          label: 'Invoices',
          path: '/invoices',
          isCurrentPage: pathSegments.length === 1
        });
        
        if (secondSegment === 'create') {
          breadcrumbs.push({
            label: 'Create Invoice',
            isCurrentPage: true
          });
        } else if (secondSegment) {
          breadcrumbs.push({
            label: 'Invoice Details',
            path: `/invoices/${secondSegment}`,
            isCurrentPage: pathSegments.length === 2
          });
          
          if (thirdSegment === 'edit') {
            breadcrumbs.push({
              label: 'Edit Invoice',
              isCurrentPage: true
            });
          } else if (thirdSegment === 'payments') {
            breadcrumbs.push({
              label: 'Record Payment',
              isCurrentPage: true
            });
          }
        }
        break;

      case 'payments':
        breadcrumbs.push({
          label: 'Payments',
          path: '/payments',
          isCurrentPage: pathSegments.length === 1
        });
        
        if (secondSegment === 'create') {
          breadcrumbs.push({
            label: 'Record Payment',
            isCurrentPage: true
          });
        } else if (secondSegment) {
          breadcrumbs.push({
            label: 'Payment Details',
            isCurrentPage: true
          });
        }
        break;

      case 'receipts':
        breadcrumbs.push({
          label: 'Receipts',
          path: '/receipts',
          isCurrentPage: pathSegments.length === 1
        });
        
        if (secondSegment) {
          breadcrumbs.push({
            label: 'Receipt Details',
            isCurrentPage: true
          });
        }
        break;

      case 'customers':
        breadcrumbs.push({
          label: 'Customers',
          path: '/customers',
          isCurrentPage: pathSegments.length === 1
        });
        
        if (secondSegment === 'create') {
          breadcrumbs.push({
            label: 'New Customer',
            isCurrentPage: true
          });
        } else if (secondSegment) {
          breadcrumbs.push({
            label: 'Customer Details',
            isCurrentPage: true
          });
        }
        break;

      case 'expenses':
        breadcrumbs.push({
          label: 'Expenses',
          path: '/expenses',
          isCurrentPage: pathSegments.length === 1
        });
        
        if (secondSegment === 'create') {
          breadcrumbs.push({
            label: 'New Expense',
            isCurrentPage: true
          });
        } else if (secondSegment) {
          breadcrumbs.push({
            label: 'Expense Details',
            path: `/expenses/${secondSegment}`,
            isCurrentPage: pathSegments.length === 2
          });
          
          if (thirdSegment === 'edit') {
            breadcrumbs.push({
              label: 'Edit Expense',
              isCurrentPage: true
            });
          }
        }
        break;

      case 'accounts':
        breadcrumbs.push({
          label: 'Accounts',
          path: '/accounts',
          isCurrentPage: pathSegments.length === 1
        });
        
        if (secondSegment === 'create') {
          breadcrumbs.push({
            label: 'New Account',
            isCurrentPage: true
          });
        } else if (secondSegment) {
          breadcrumbs.push({
            label: 'Account Details',
            path: `/accounts/${secondSegment}`,
            isCurrentPage: pathSegments.length === 2
          });
          
          if (thirdSegment === 'edit') {
            breadcrumbs.push({
              label: 'Edit Account',
              isCurrentPage: true
            });
          }
        }
        break;

      case 'financial-reports':
        breadcrumbs.push({
          label: 'Financial Reports',
          isCurrentPage: true
        });
        break;

      case 'journal-entries':
        breadcrumbs.push({
          label: 'Journal Entries',
          isCurrentPage: true
        });
        break;

      case 'items':
        breadcrumbs.push({
          label: 'Items',
          path: '/items',
          isCurrentPage: pathSegments.length === 1
        });
        
        if (secondSegment === 'create') {
          breadcrumbs.push({
            label: 'New Item',
            isCurrentPage: true
          });
        }
        break;

      case 'settings':
        breadcrumbs.push({
          label: 'Settings',
          isCurrentPage: true
        });
        break;

      default:
        // For unknown routes, just show the segment as a breadcrumb
        breadcrumbs.push({
          label: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1),
          isCurrentPage: pathSegments.length === 1
        });
        break;
    }

    return breadcrumbs;
  }, [location.pathname]);
};