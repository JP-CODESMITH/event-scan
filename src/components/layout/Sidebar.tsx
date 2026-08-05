import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TicketCheck,
  QrCode,
  Settings,
  Scan,
  LogOut,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: TicketCheck, label: 'Tickets' },
  { to: '/authorized', icon: ShieldCheck, label: 'Authorized' },
  { to: '/scanner-devices', icon: Scan, label: 'Scanners' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const handleLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.reload();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen glass border-r border-white/5 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <QrCode className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Event Scan
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
