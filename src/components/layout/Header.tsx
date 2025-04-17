
import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-background border-b border-border flex items-center px-6 sticky top-0 z-10">
      <button 
        onClick={toggleSidebar} 
        className="p-2 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      
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
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-md text-muted-foreground hover:bg-secondary transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-invoice-coral rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
