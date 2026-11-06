import { NavLink } from 'react-router-dom';
import { ArrowUpRight, LogOut, QrCode } from 'lucide-react';
import { Brand } from './Brand';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Today', hint: 'Live desk' },
  { to: '/tickets', label: 'Tickets', hint: 'Guest list' },
  { to: '/authorized', label: 'Authorisation', hint: 'Entry list' },
  { to: '/scanner-devices', label: 'Gates', hint: 'Devices' },
  { to: '/settings', label: 'Settings', hint: 'Event' },
];

export function Sidebar() {
  const username = localStorage.getItem('username') || 'Admin';

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
    window.location.href = '/login';
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <NavLink to="/dashboard" aria-label="Event Scan dashboard">
          <Brand />
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Desk sections">
        <p className="eyebrow px-2 pb-3">Desk</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center justify-between rounded-sm px-2 py-2.5 text-small transition-colors duration-fast',
                    isActive
                      ? 'bg-sunken font-medium text-ink'
                      : 'text-ink-secondary hover:bg-sunken/60 hover:text-ink'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-accent" />
                    )}
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-aria-[current=page]:opacity-100">
                      {item.hint}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/scanner"
          className="flex items-center justify-between rounded-sm bg-ink px-3 py-3 text-small font-medium text-bg transition-colors hover:bg-ink/90"
        >
          <span className="flex items-center gap-2">
            <QrCode className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            Open gate scanner
          </span>
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
        </NavLink>

        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken font-mono text-[11px] font-medium text-ink">
              {username.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-tiny font-medium text-ink">{username}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">Signed in</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </aside>
  );
}
