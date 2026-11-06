import { NavLink } from 'react-router-dom';
import { Gauge, ScanLine, SlidersHorizontal, Ticket } from 'lucide-react';
import { cn } from '../../lib/utils';

const items = [
  { to: '/dashboard', label: 'Today', icon: Gauge },
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  { to: '/scanner-devices', label: 'Gates', icon: ScanLine },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Sections"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] transition-colors duration-fast',
                    isActive ? 'font-medium text-ink' : 'text-ink-tertiary hover:text-ink-secondary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span aria-hidden="true" className="absolute inset-x-5 top-0 h-[2px] bg-accent" />
                    )}
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.7} aria-hidden="true" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
