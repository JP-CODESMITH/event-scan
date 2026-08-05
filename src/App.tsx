import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { SettingsPage } from './pages/Settings';
import { TicketsPage } from './pages/TicketsPage';
import { ScannerDevicesPage } from './pages/ScannerDevicesPage';
import { AuthorizedTicketsPage } from './pages/AuthorizedTicketsPage';
import Scanner from './pages/Scanner';
import { api } from './lib/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthorized(false);
      return;
    }
    api.verifySession(token)
      .then(() => setAuthorized(true))
      .catch(() => {
        localStorage.removeItem('token');
        setAuthorized(false);
      });
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse" />
          <p className="text-muted-foreground text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => {
        if (s.theme) setTheme(s.theme as 'dark' | 'light');
      })
      .catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 15, 35, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login onLogin={() => window.location.href = '/'} />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
        <Route path="/authorized" element={<ProtectedRoute><AuthorizedTicketsPage /></ProtectedRoute>} />
        <Route path="/scanner-devices" element={<ProtectedRoute><ScannerDevicesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
