import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Brand } from './Brand';
import { useTheme } from '../../lib/theme';
import { formatClock } from '../../lib/utils';

const titles: Record<string, string> = {
  '/dashboard': 'Today',
  '/tickets': 'Tickets',
  '/authorized': 'Authorisation',
  '/scanner-devices': 'Gates',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const title = titles[location.pathname] ?? 'Desk';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:h-16 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/dashboard" className="lg:hidden" aria-label="Event Scan dashboard">
            <Brand compact />
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">Desk</span>
            <span aria-hidden="true" className="text-ink-tertiary">/</span>
            <span className="text-small font-medium text-ink">{title}</span>
          </div>
          <span className="truncate text-small font-medium text-ink lg:hidden">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          <time
            className="hidden font-mono text-tiny tabular text-ink-secondary sm:block"
            dateTime={now.toISOString()}
            aria-label="Current time"
          >
            {formatClock(now)}
          </time>
          <span aria-hidden="true" className="mx-2 hidden h-4 w-px bg-border sm:block" />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-secondary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px]" strokeWidth={1.7} />
            ) : (
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.7} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
