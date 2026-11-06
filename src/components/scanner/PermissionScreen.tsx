import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Keyboard } from 'lucide-react';
import { Button } from '../ui/button';
import { Brand } from '../layout/Brand';

interface PermissionScreenProps {
  onStart: () => void;
  onManual?: () => void;
  loading?: boolean;
  insecure?: boolean;
  gate?: string;
}

const steps = [
  'Allow camera access.',
  'Frame the ticket QR.',
  'Read the verdict, then next.',
];

export default function PermissionScreen({ onStart, onManual, loading, insecure, gate }: PermissionScreenProps) {
  return (
    <div className="gate gate-screen relative flex min-h-[100dvh] flex-col">
      <header className="safe-top flex items-center justify-between border-b border-border px-5 pb-3">
        <Link to="/" aria-label="Back to Event Scan home" className="flex items-center gap-2">
          <Brand compact />
          <span className="text-small font-medium text-ink">Gate scanner</span>
        </Link>
        <Link
          to="/"
          className="flex h-11 items-center gap-1.5 rounded-sm px-2 text-tiny text-ink-secondary transition-colors hover:text-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
          Leave
        </Link>
      </header>

      <main className="flex flex-1 items-center px-5 py-8">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Gate check-in</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">{gate || 'Back of the Church'}</p>
          </div>

          <h1 className="mt-4 font-display text-[3.1rem] font-medium leading-[0.92] tracking-[-0.045em] text-ink">
            Scan at
            <br />
            the door.
          </h1>
          <p className="mt-4 max-w-[34ch] text-base text-ink-secondary">
            Point this phone at a ticket QR. The verdict takes over the screen, so nobody has to squint.
          </p>

          {insecure && (
            <div className="mt-6 rounded-sm border border-warning/30 bg-warning-soft px-3.5 py-3">
              <p className="text-tiny font-medium text-warning">This page needs HTTPS for the camera.</p>
              <p className="mt-1 text-small text-ink-secondary">
                Open the secure address printed by the server, then allow the certificate and reload.
              </p>
            </div>
          )}

          <ol className="mt-8 space-y-3 border-y border-border py-5">
            {steps.map((step, index) => (
              <li key={step} className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] tabular text-ink-tertiary">0{index + 1}</span>
                <span className="text-small text-ink-secondary">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 space-y-2.5">
            <Button onClick={onStart} disabled={loading} size="lg" className="w-full">
              <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              {loading ? 'Opening camera' : 'Start camera'}
            </Button>
            {onManual && (
              <Button onClick={onManual} disabled={loading} variant="outline" size="lg" className="w-full">
                <Keyboard className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Enter a code instead
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-tiny leading-relaxed text-ink-tertiary">
            The camera stays on this phone. Nothing is recorded until a ticket is scanned.
          </p>
        </div>
      </main>
    </div>
  );
}
