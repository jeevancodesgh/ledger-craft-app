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
  LogOut,
  CreditCard,
  Tag,
  Receipt,
  FolderOpen,
  UserCircle,
  ChevronRight,
  Zap,
  Activity
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
  
  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, badge: null },
      ]
    },
    {
      title: 'Business',
      items: [
        { name: 'Invoices', path: '/invoices', icon: Receipt, badge: 'New' },
        { name: 'Customers', path: '/customers', icon: Users, badge: null },
        { name: 'Items', path: '/items', icon: FolderOpen, badge: null },
      ]
    },
    {
      title: 'Financial',
      items: [
        { name: 'Expenses', path: '/expenses', icon: CreditCard, badge: null },
        { name: 'Expense Categories', path: '/expense-categories', icon: Tag, badge: null },
        { name: 'Accounts', path: '/accounts', icon: Activity, badge: null },
        { name: 'Categories', path: '/categories', icon: Zap, badge: null },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings, badge: null },
      ]
    }
  ];

  // Mobile sidebar is a full-screen menu
  if (isMobile) {
    return (
      <aside className="flex flex-col h-full bg-gradient-to-br from-sidebar via-sidebar to-sidebar/95 overflow-y-auto animate-in slide-in-from-left duration-300">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border/20 bg-sidebar-accent/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-invoice-teal to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">LC</span>
            </div>
            <h1 className="font-bold text-xl text-white bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              LedgerCraft
            </h1>
          </div>
          {onCloseMobileMenu && (
            <button 
              onClick={onCloseMobileMenu}
              className="text-sidebar-foreground hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        
        {/* Enhanced Navigation */}
        <nav className="flex-1 py-6">
          <div className="px-4 space-y-6">
            {navSections.map((section, sectionIndex) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3 px-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onCloseMobileMenu}
                        className={({ isActive }) => cn(
                          "group flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:scale-[1.02]",
                          isActive 
                            ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground shadow-lg shadow-sidebar-accent/20" 
                            : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="flex items-center">
                          <div className={cn(
                            "mr-4 p-2 rounded-lg transition-all duration-200",
                            "group-hover:bg-white/10"
                          )}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.badge && (
                            <span className="bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        
        {/* Enhanced User Profile */}
        <div className="p-6 border-t border-sidebar-border/20 mt-auto bg-sidebar-accent/5">
          <div className="flex items-center mb-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-invoice-teal to-blue-500 text-white flex items-center justify-center mr-4 shadow-lg">
                {user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle className="h-6 w-6" />}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-sidebar"></div>
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-white truncate max-w-[200px]">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-sm text-sidebar-foreground/70 truncate max-w-[200px]">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          {user && (
            <button
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-base hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
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

  // Desktop sidebar with enhanced design
  return (
    <aside 
      className={cn(
        "bg-gradient-to-b from-sidebar via-sidebar to-sidebar/98 fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border/20 bg-sidebar-accent/10">
        <div className={cn(
          "flex items-center space-x-3 transition-all duration-300",
          collapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-invoice-teal to-blue-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">LC</span>
          </div>
          <h1 className="font-bold text-lg text-white bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            LedgerCraft
          </h1>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-lg bg-gradient-to-br from-invoice-teal to-blue-500 flex items-center justify-center shadow-md transition-all duration-300",
          !collapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          <span className="text-white font-bold text-sm">LC</span>
        </div>
      </div>
      
      {/* Enhanced Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={cn(
          "space-y-4 px-3",
          collapsed && "px-2"
        )}>
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className={cn(
                "text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-3 transition-all duration-300",
                collapsed ? "opacity-0 h-0" : "opacity-100 h-auto"
              )}>
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => cn(
                        "group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] relative",
                        isActive 
                          ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground shadow-lg shadow-sidebar-accent/20" 
                          : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <div className={cn(
                        "p-1.5 rounded-md transition-all duration-200",
                        "group-hover:bg-white/10"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "ml-3 font-medium transition-all duration-300",
                        collapsed ? "opacity-0 w-0" : "opacity-100"
                      )}>
                        {item.name}
                      </span>
                      {item.badge && !collapsed && (
                        <span className="ml-auto bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                      {item.badge && collapsed && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      
      {/* Enhanced User Profile */}
      <div className="p-4 border-t border-sidebar-border/20 bg-sidebar-accent/5">
        <div className="flex items-center">
          <div className="relative">
            <div 
              className={cn(
                "w-10 h-10 rounded-lg bg-gradient-to-br from-invoice-teal to-blue-500 text-white flex items-center justify-center shadow-lg",
                collapsed && "mx-auto w-8 h-8"
              )}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-sidebar"></div>
          </div>
          <div className={cn(
            "ml-3 transition-all duration-300",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            <p className="text-sm font-semibold text-white truncate max-w-[160px]">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate max-w-[160px]">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
