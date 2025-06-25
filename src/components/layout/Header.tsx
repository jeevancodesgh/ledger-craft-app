
import React from 'react';
import { Bell, Menu, Search, LogOut, UserPlus, Download, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

export function Header({ toggleSidebar, isMobile }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the invoice preview page
  const isInvoicePreview = location.pathname.includes('/invoices/new') || 
                          location.pathname.includes('/invoices/edit');

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out successfully',
      description: 'You have been logged out of your account.'
    });
    navigate('/login');
  };

  const handleAddCustomer = () => {
    navigate('/customers/new');
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center px-4 md:px-6 sticky top-0 z-10">
      <button 
        onClick={toggleSidebar} 
        className="p-2 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
        aria-label={isMobile ? "Open menu" : "Toggle sidebar"}
      >
        <Menu className="h-5 w-5" />
      </button>
      
      {!isMobile && (
        <div className="flex-1 mx-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="w-full py-2 pl-10 pr-4 text-sm bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}
      
      {/* Mobile page title */}
      {isMobile && (
        <div className="flex-1 mx-2 flex justify-center">
          {isInvoicePreview ? (
            <h1 className="text-lg font-medium">Invoice</h1>
          ) : (
            <div className="flex items-center">
              <img src="/logo.png" alt="LedgerCraft" className="w-6 h-6 mr-2" />
              <span className="text-lg font-medium">LedgerCraft</span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-end space-x-2">
        <ThemeToggle />
        
        <button className="p-2 rounded-md text-muted-foreground hover:bg-secondary transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-invoice-coral rounded-full"></span>
        </button>
        
        {user && (
          <div className="flex items-center gap-2">
            {!isMobile && (
              <span className="text-sm hidden md:block">
                {user.email}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
