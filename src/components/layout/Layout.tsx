import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-3 focus:text-small focus:text-bg"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="lg:pl-[232px]">
        <Header />
        <main id="main" className="mx-auto w-full max-w-[1360px] px-4 pb-28 pt-6 lg:px-8 lg:pb-16 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
