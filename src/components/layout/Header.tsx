import React from 'react';
import { Bell, Menu, Search, LogOut, UserPlus, Download, Plus, User, Settings, ChevronDown, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

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
    <>
      {/* Beta Notification Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-center px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              BETA
            </Badge>
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Welcome to EasyBizInvoice Beta!
            </span>
            <span className="text-blue-600 dark:text-blue-400 hidden sm:inline">
              All features are free during beta. We're improving daily!
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-center">
                  You're using our beta version. Features may have minor improvements coming, 
                  but everything is fully functional and free to use!
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
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
                <img src="/logo.png" alt="EasyBizInvoice" className="w-6 h-6 mr-2" />
                <span className="text-lg font-medium">EasyBizInvoice</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-end space-x-2">
          <ThemeToggle />
          
          <button 
            className="p-2 rounded-md text-muted-foreground hover:bg-secondary transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-invoice-coral rounded-full"></span>
          </button>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-invoice-teal to-blue-500 text-white flex items-center justify-center text-sm font-medium">
                    {user?.email ? user.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  {!isMobile && (
                    <>
                      <span className="text-sm hidden md:block truncate max-w-[120px]">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
    </header>
    </>
  );
}
