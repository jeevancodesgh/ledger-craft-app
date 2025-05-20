import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({
  children
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Mobile layout with drawer navigation
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header toggleSidebar={toggleMobileMenu} isMobile={true} />
        <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DrawerContent className="h-[85vh]">
            <div className="h-full">
              <Sidebar collapsed={false} isMobile={true} onCloseMobileMenu={() => setMobileMenuOpen(false)} />
            </div>
          </DrawerContent>
        </Drawer>
        
        <main className="flex-1 overflow-auto p-4 bg-secondary/20">
          <div className="container mx-auto px-0 w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    );
  }
  
  // Desktop layout with sidebar
  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} isMobile={false} />
      <div className={cn("flex flex-col flex-1 w-0 overflow-hidden transition-all duration-300", 
        sidebarCollapsed ? "ml-16" : "ml-64")}>
        <Header toggleSidebar={toggleSidebar} isMobile={false} />
        <main className="flex-1 overflow-auto p-6 bg-secondary/20 mx-0 px-0 py-0">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
