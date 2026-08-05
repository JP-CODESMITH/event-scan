import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        )}
      >
        {children}
      </main>
    </div>
  );
}
