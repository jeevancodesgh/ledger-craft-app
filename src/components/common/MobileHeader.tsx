
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, Plus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { usePermissions } from "@/hooks/usePermissions";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessProfile } = useAppContext();
  const { hasPermission } = usePermissions();

  // Determine if we're on a specific route to show back button instead of menu
  const showBackButton = location.pathname.includes('/edit') || 
                         location.pathname.includes('/create') || 
                         location.pathname.includes('/detail') ||
                         location.pathname.includes('/view') ||
                         (location.pathname.includes('/customers/') && !location.pathname.endsWith('/customers/')) ||
                         (location.pathname.includes('/invoices/') && !location.pathname.endsWith('/invoices/')) ||
                         (location.pathname.includes('/payments/') && !location.pathname.endsWith('/payments/')) ||
                         (location.pathname.includes('/receipts/') && !location.pathname.endsWith('/receipts/')) ||
                         (location.pathname.includes('/expenses/') && !location.pathname.endsWith('/expenses/')) ||
                         (location.pathname.includes('/accounts/') && !location.pathname.endsWith('/accounts/'));
  
  // Determine if we're on pages that support adding new items and user has permission
  const getAddButtonPermission = () => {
    if (location.pathname === '/invoices') return hasPermission('invoices:create');
    if (location.pathname === '/customers') return hasPermission('customers:create');
    if (location.pathname === '/payments') return hasPermission('payments:create');
    if (location.pathname === '/expenses') return hasPermission('expenses:create');
    if (location.pathname === '/accounts') return hasPermission('accounts:create');
    if (location.pathname === '/items') return true; // Items don't have specific permissions yet
    return false;
  };

  const showAddButton = (location.pathname === '/invoices' || 
                        location.pathname === '/items' || 
                        location.pathname === '/customers' ||
                        location.pathname === '/payments' ||
                        location.pathname === '/expenses' ||
                        location.pathname === '/accounts') && 
                        getAddButtonPermission();

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname === '/invoices') return 'Invoices';
    if (location.pathname === '/customers') return 'Customers';
    if (location.pathname === '/settings') return 'Settings';
    if (location.pathname === '/items') return 'Items';
    if (location.pathname === '/payments') return 'Payments';
    if (location.pathname === '/receipts') return 'Receipts';
    if (location.pathname === '/expenses') return 'Expenses';
    if (location.pathname === '/accounts') return 'Accounts';
    if (location.pathname === '/financial-reports') return 'Financial Reports';
    if (location.pathname === '/journal-entries') return 'Journal Entries';
    if (location.pathname.includes('/invoices/create')) return 'New Invoice';
    if (location.pathname.includes('/invoices/') && location.pathname.includes('/edit')) return 'Edit Invoice';
    if (location.pathname.includes('/invoices/')) return 'Invoice Details';
    if (location.pathname.includes('/customers/')) return 'Customer Details';
    if (location.pathname.includes('/payments/create')) return 'New Payment';
    if (location.pathname.includes('/payments/') && location.pathname.includes('/detail')) return 'Payment Details';
    if (location.pathname.includes('/receipts/') && location.pathname.includes('/view')) return 'Receipt Details';
    if (location.pathname.includes('/expenses/create')) return 'New Expense';
    if (location.pathname.includes('/expenses/') && location.pathname.includes('/edit')) return 'Edit Expense';
    if (location.pathname.includes('/accounts/create')) return 'New Account';
    if (location.pathname.includes('/accounts/') && location.pathname.includes('/edit')) return 'Edit Account';
    return '';
  };

  const handleAddClick = () => {
    if (location.pathname === '/invoices') navigate('/invoices/create');
    else if (location.pathname === '/customers') navigate('/customers/create');
    else if (location.pathname === '/items') navigate('/items/create');
    else if (location.pathname === '/payments') navigate('/payments/create');
    else if (location.pathname === '/expenses') navigate('/expenses/create');
    else if (location.pathname === '/accounts') navigate('/accounts/create');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b bg-card">
      <div className="flex items-center">
        {showBackButton ? (
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ChevronLeft size={24} />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu size={24} />
          </Button>
        )}
        <h1 className="ml-2 text-lg font-semibold">{getPageTitle()}</h1>
      </div>
      <div>
        {showAddButton && (
          <Button size="sm" onClick={handleAddClick}>
            <Plus size={18} className="mr-1" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
