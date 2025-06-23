import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  X,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  onCloseMobileMenu?: () => void;
}

export function Sidebar({ collapsed, isMobile, onCloseMobileMenu }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Items', path: '/items', icon: FileText },
    { name: 'Accounts', path: '/accounts', icon: FileText },
    { name: 'Categories', path: '/categories', icon: FileText },
  ];

  // Mobile sidebar is a full-screen menu
  if (isMobile) {
    return (
      <aside className="flex flex-col h-full bg-sidebar overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <h1 className="font-semibold text-xl text-white">
            LedgerCraft
          </h1>
          {onCloseMobileMenu && (
            <button 
              onClick={onCloseMobileMenu}
              className="text-sidebar-foreground hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 py-6">
          <ul className="space-y-2 px-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onCloseMobileMenu}
                  className={({ isActive }) => cn(
                    "flex items-center px-4 py-3 rounded-md text-base transition-colors",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-invoice-teal text-white flex items-center justify-center mr-3">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-base font-medium text-sidebar-foreground truncate max-w-[200px]">
                {user?.email || 'User'}
              </p>
              {user?.user_metadata?.full_name && (
                <p className="text-sm text-sidebar-foreground/70">
                  {user.user_metadata.full_name}
                </p>
              )}
            </div>
          </div>
          {user && (
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-md bg-red-600 text-white font-semibold text-base hover:bg-red-700 transition-colors"
              onClick={async () => {
                await signOut();
                if (onCloseMobileMenu) onCloseMobileMenu();
                if (navigate) navigate('/login');
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  // Desktop sidebar
  return (
    <aside 
      className={cn(
        "bg-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <h1 className={cn(
          "font-semibold text-xl text-white transition-opacity duration-300",
          collapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          LedgerCraft
        </h1>
        <div className={cn(
          "font-semibold text-xl text-white transition-all duration-300",
          !collapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          LC
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className={cn(
                  "ml-3 transition-all duration-300",
                  collapsed ? "opacity-0 w-0" : "opacity-100"
                )}>
                  {item.name}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center">
          <div 
            className={cn(
              "w-8 h-8 rounded-full bg-invoice-teal text-white flex items-center justify-center",
              collapsed && "mx-auto"
            )}
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={cn(
            "ml-3 transition-all duration-300",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            <p className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">
              {user?.email || 'User'}
            </p>
            {user?.user_metadata?.full_name && (
              <p className="text-xs text-sidebar-foreground/70">
                {user.user_metadata.full_name}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
