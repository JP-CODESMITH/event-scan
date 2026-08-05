import { Menu, QrCode } from 'lucide-react';
import { Button } from '../ui/button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <QrCode className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Event Scan
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {localStorage.getItem('username') || 'Admin'}
        </span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          {localStorage.getItem('username')?.[0]?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
