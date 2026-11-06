import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './lib/theme';
import { api } from './lib/api';
import { Brand } from './components/layout/Brand';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scanner = lazy(() => import('./pages/Scanner'));
const TicketsPage = lazy(() => import('./pages/TicketsPage').then((m) => ({ default: m.TicketsPage })));
const AuthorizedTicketsPage = lazy(() =>
  import('./pages/AuthorizedTicketsPage').then((m) => ({ default: m.AuthorizedTicketsPage }))
);
const ScannerDevicesPage = lazy(() =>
  import('./pages/ScannerDevicesPage').then((m) => ({ default: m.ScannerDevicesPage }))
);
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));

function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg px-6" role="status" aria-live="polite">
      <Brand />
      <div className="flex items-center gap-2 text-tiny text-ink-secondary">
        <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
        {label}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthorized(false);
      return;
    }
    api
      .verifySession(token)
      .then(() => setAuthorized(true))
      .catch(() => {
        localStorage.removeItem('token');
        setAuthorized(false);
      });
  }, []);

  if (authorized === null) return <LoadingScreen label="Checking your session" />;
  if (!authorized) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          gutter={10}
          toastOptions={{
            duration: 3200,
            style: {
              background: 'hsl(var(--raised))',
              color: 'hsl(var(--ink))',
              border: '1px solid hsl(var(--border-strong))',
              borderRadius: '3px',
              fontSize: '13px',
              fontWeight: 500,
              padding: '10px 14px',
              boxShadow: '0 10px 40px hsl(var(--overlay) / 0.14)',
            },
            success: { iconTheme: { primary: 'hsl(var(--success))', secondary: 'hsl(var(--raised))' } },
            error: { iconTheme: { primary: 'hsl(var(--danger))', secondary: 'hsl(var(--raised))' } },
          }}
        />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login onLogin={() => (window.location.href = '/dashboard')} />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
            <Route path="/authorized" element={<ProtectedRoute><AuthorizedTicketsPage /></ProtectedRoute>} />
            <Route path="/scanner-devices" element={<ProtectedRoute><ScannerDevicesPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
