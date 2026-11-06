import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Brand } from '../components/layout/Brand';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';
import toast from 'react-hot-toast';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Enter your username to continue.');
      usernameRef.current?.focus();
      return;
    }
    if (!password) {
      setError('Enter your password to continue.');
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(username.trim(), password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.username || username.trim());
      toast.success('Signed in');
      onLogin();
    } catch (err: any) {
      setError(err?.message === 'Invalid credentials' ? 'That username or password is not right.' : err?.message || 'Could not sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-[#12110e] px-10 py-10 text-[#f1ecdf] lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-[#f1ecdf]" aria-label="Event Scan home">
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#f1ecdf] text-[#12110e]">
              <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
                <circle cx="7" cy="12" r="1.4" fill="currentColor" />
                <circle cx="17" cy="12" r="1.4" fill="currentColor" />
                <path d="M9 12.4l2 2 4.2-4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
              </svg>
            </span>
            <span className="font-display text-[1.3rem] font-medium tracking-[-0.035em]">
              Event <span className="italic text-[#e07a4e]">Scan</span>
            </span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8c8575]">Desk access</span>
        </div>

        <div className="py-12">
          <div className="ticket-stub mx-auto max-w-[380px] px-8 py-7">
            <div className="flex items-start justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5f594d]">Event Scan</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a33f1e]">Gate pass</p>
            </div>
            <p className="mt-10 font-display text-[3.6rem] font-medium leading-[0.85] tracking-[-0.05em]">
              Admit
              <br />
              one.
            </p>
            <div className="mt-8 flex items-end justify-between border-t border-dashed border-[#d9d1c0] pt-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6e6759]">Holder</p>
                <p className="mt-1 text-small font-medium text-[#17150f]">The person at the door</p>
              </div>
              <p className="font-mono text-[2rem] font-medium leading-none tabular text-[#17150f]">001</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6e6759]">One clean scan per entry</p>
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#1e6b45]" />
            </div>
          </div>
        </div>

        <div className="max-w-[42ch]">
          <p className="font-display text-[1.35rem] leading-snug tracking-[-0.02em]">
            The desk sees every gate. The gate sees one job.
          </p>
          <p className="mt-3 text-small leading-relaxed text-[#b9b1a0]">
            Authorise the list, watch check-ins arrive, and keep the door moving. No rented hardware, no guesswork.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 pt-5 lg:px-10 lg:pt-8">
          <Link to="/" className="lg:invisible" aria-label="Back to Event Scan home">
            <Brand />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-secondary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.7} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.7} />}
          </button>
        </div>

        <div className="flex flex-1 items-center px-5 py-10 lg:px-10">
          <div className="mx-auto w-full max-w-[420px]">
            <p className="eyebrow">Admin desk</p>
            <h1 className="mt-3 font-display text-[2.6rem] font-medium leading-[0.98] tracking-[-0.04em] text-ink">
              Sign in to the desk.
            </h1>
            <p className="mt-3 text-small text-ink-secondary">
              Manage the guest list, authorise tickets, and watch every gate.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              {error && (
                <div role="alert" className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2.5 text-small text-danger">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="mb-1.5 block text-tiny font-medium text-ink">
                  Username
                </label>
                <Input
                  ref={usernameRef}
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  disabled={loading}
                  aria-invalid={Boolean(error && !username.trim())}
                  aria-describedby={error ? 'login-error' : undefined}
                  placeholder="admin"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-tiny font-medium text-ink">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    aria-invalid={Boolean(error && !password)}
                    aria-describedby={error ? 'login-error' : undefined}
                    placeholder="Enter your password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-sm text-ink-tertiary transition-colors hover:text-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.7} /> : <Eye className="h-4 w-4" strokeWidth={1.7} />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading} disabled={loading}>
                {loading ? 'Signing in' : 'Sign in'}
              </Button>
              {error && <span id="login-error" className="sr-only">{error}</span>}
            </form>

            <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-small text-ink-secondary sm:flex-row sm:items-center sm:justify-between">
              <Link to="/scanner" className="font-medium text-accent-strong underline-offset-4 hover:underline">
                Open the gate scanner
              </Link>
              <Link to="/" className="inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
                Back to home
              </Link>
            </div>
          </div>
        </div>

        <p className="px-5 pb-6 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary lg:px-10">
          Event Scan · local-first gate control
        </p>
      </main>
    </div>
  );
}
