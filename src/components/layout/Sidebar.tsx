
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

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
