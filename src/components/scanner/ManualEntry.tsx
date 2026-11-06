import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, WifiOff } from 'lucide-react';
import { Button } from '../ui/button';

interface ManualEntryProps {
  onSubmit: (ticketNumber: string) => void;
  onBack: () => void;
  gate?: string;
  online?: boolean;
  submitting?: boolean;
}

export default function ManualEntry({ onSubmit, onBack, gate, online = true, submitting }: ManualEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) {
      setTouched(true);
      inputRef.current?.focus();
      return;
    }
    onSubmit(text);
    setValue('');
    setTouched(false);
  };

  return (
    <div className="gate gate-screen flex min-h-[100dvh] flex-col">
      <header className="safe-top flex items-center justify-between border-b border-border px-5 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center gap-1.5 rounded-sm px-1 text-tiny text-ink-secondary transition-colors hover:text-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
          Back
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">{gate || 'Back of the Church'}</p>
      </header>

      <main className="flex flex-1 items-center px-5 py-8">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[400px]" noValidate>
          <p className="eyebrow">Manual entry</p>
          <h1 className="mt-2 font-display text-[2.6rem] font-medium leading-[0.95] tracking-[-0.04em] text-ink">
            Enter the code.
          </h1>
          <p className="mt-3 text-small text-ink-secondary">
            Type the ticket number printed under the QR. Press Enter to check it.
          </p>

          {!online && (
            <div className="mt-5 flex items-start gap-2.5 rounded-sm border border-danger/30 bg-danger-soft px-3.5 py-3">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.7} aria-hidden="true" />
              <p className="text-small text-danger">You are offline. A code cannot be checked until the connection returns.</p>
            </div>
          )}

          <div className="mt-7">
            <label htmlFor="ticket-code" className="mb-2 block text-tiny font-medium text-ink">
              Ticket number
            </label>
            <input
              ref={inputRef}
              id="ticket-code"
              name="ticket-code"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="001"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-invalid={touched && !value.trim()}
              aria-describedby={touched && !value.trim() ? 'ticket-code-error' : 'ticket-code-help'}
              className="h-16 w-full rounded-sm border border-border-strong bg-surface px-4 font-mono text-[1.75rem] font-medium tabular tracking-[0.04em] text-ink placeholder:text-ink-tertiary focus-visible:border-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[invalid=true]:border-danger"
            />
            <p id="ticket-code-help" className="mt-2 text-tiny text-ink-tertiary">
              Codes are not case sensitive.
            </p>
            {touched && !value.trim() && (
              <p id="ticket-code-error" role="alert" className="mt-2 text-tiny text-danger">
                Enter a ticket number to check it.
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting || !online} loading={submitting}>
            Check ticket
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </form>
      </main>
    </div>
  );
}
