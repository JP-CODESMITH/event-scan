import { AlertTriangle, ArrowLeft, Keyboard, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface CameraErrorProps {
  error: string;
  onRetry: () => void;
  onBack?: () => void;
  onManual?: () => void;
  insecure?: boolean;
}

export default function CameraError({ error, onRetry, onBack, onManual, insecure }: CameraErrorProps) {
  return (
    <div className="gate gate-screen flex min-h-[100dvh] flex-col">
      <header className="safe-top flex items-center justify-between border-b border-border px-5 pb-3">
        <p className="eyebrow">Gate check-in</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">Camera</p>
      </header>

      <main className="flex flex-1 items-center px-5 py-8">
        <div className="mx-auto w-full max-w-[400px]">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-warning/30 bg-warning-soft text-warning">
            <AlertTriangle className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <p className="eyebrow mt-6">Camera unavailable</p>
          <h1 className="mt-2 font-display text-[2.7rem] font-medium leading-[0.95] tracking-[-0.04em] text-ink">
            {insecure ? 'Needs a secure page.' : 'Camera did not open.'}
          </h1>
          <p className="mt-3 text-small text-ink-secondary">
            {insecure
              ? 'Browsers only allow the camera on HTTPS. Open the secure address printed by the server, accept the certificate warning, then reload.'
              : error}
          </p>

          <div className="mt-7 space-y-2.5">
            {!insecure && (
              <Button onClick={onRetry} size="lg" className="w-full">
                <RefreshCw className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Try again
              </Button>
            )}
            {onManual && (
              <Button onClick={onManual} variant="outline" size="lg" className="w-full">
                <Keyboard className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Enter a code instead
              </Button>
            )}
            {onBack && (
              <Button onClick={onBack} variant="ghost" size="lg" className="w-full">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Back to start
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
