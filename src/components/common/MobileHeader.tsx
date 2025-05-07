
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, Plus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessProfile } = useAppContext();

  // Determine if we're on a specific route to show back button instead of menu
  const showBackButton = location.pathname.includes('/edit') || 
                         location.pathname.includes('/create') || 
                         (location.pathname.includes('/customers/') && !location.pathname.endsWith('/customers/')) ||
                         (location.pathname.includes('/invoices/') && !location.pathname.endsWith('/invoices/'));
  
  // Determine if we're on invoices or items list to show add button
  const showAddButton = location.pathname === '/invoices' || location.pathname === '/items' || location.pathname === '/customers';

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname === '/invoices') return 'Invoices';
    if (location.pathname === '/customers') return 'Customers';
    if (location.pathname === '/settings') return 'Settings';
    if (location.pathname === '/items') return 'Items';
    if (location.pathname.includes('/invoices/create')) return 'New Invoice';
    if (location.pathname.includes('/invoices/') && location.pathname.includes('/edit')) return 'Edit Invoice';
    if (location.pathname.includes('/invoices/')) return 'Invoice Details';
    if (location.pathname.includes('/customers/')) return 'Customer Details';
    return '';
  };

  const handleAddClick = () => {
    if (location.pathname === '/invoices') navigate('/invoices/create');
    else if (location.pathname === '/customers') navigate('/customers/create');
    else if (location.pathname === '/items') navigate('/items/create');
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
