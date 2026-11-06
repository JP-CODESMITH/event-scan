import { CameraOff, ExternalLink, Keyboard, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface PermissionDeniedProps {
  onRetry: () => void;
  onManual?: () => void;
  message?: string;
}

export default function PermissionDenied({ onRetry, onManual, message }: PermissionDeniedProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const helpUrl = isIOS
    ? 'https://support.apple.com/guide/iphone/change-camera-settings-iph3c0f2b3a/ios'
    : 'https://support.google.com/chrome/answer/2693767';

  return (
    <div className="gate gate-screen flex min-h-[100dvh] flex-col">
      <header className="safe-top flex items-center justify-between border-b border-border px-5 pb-3">
        <p className="eyebrow">Gate check-in</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">Camera</p>
      </header>

      <main className="flex flex-1 items-center px-5 py-8">
        <div className="mx-auto w-full max-w-[400px]">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-danger/30 bg-danger-soft text-danger">
            <CameraOff className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <p className="eyebrow mt-6">Permission needed</p>
          <h1 className="mt-2 font-display text-[2.7rem] font-medium leading-[0.95] tracking-[-0.04em] text-ink">
            Camera is blocked.
          </h1>
          <p className="mt-3 text-small text-ink-secondary">
            {message === 'Permission denied'
              ? 'This browser is not allowed to use the camera for this site.'
              : message || 'Camera access is required to scan tickets.'}
          </p>

          <div className="mt-6 rounded-sm border border-border bg-surface px-4 py-4">
            <p className="text-tiny font-medium text-ink">How to allow it</p>
            <ol className="mt-2 space-y-1.5 text-small text-ink-secondary">
              <li>1. Open this site's settings in your browser.</li>
              <li>2. Set Camera to Allow.</li>
              <li>3. Reload this page and try again.</li>
            </ol>
          </div>

          <div className="mt-7 space-y-2.5">
            <Button onClick={onRetry} size="lg" className="w-full">
              <RefreshCw className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              Try camera again
            </Button>
            {onManual && (
              <Button onClick={onManual} variant="outline" size="lg" className="w-full">
                <Keyboard className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Enter a code instead
              </Button>
            )}
            <a
              href={helpUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center justify-center gap-1.5 text-tiny text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
            >
              Browser camera help
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
