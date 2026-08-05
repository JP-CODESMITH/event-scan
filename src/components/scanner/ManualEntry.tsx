import { useState, useRef, useEffect } from 'react';
import { Send, Pen } from 'lucide-react';

interface ManualEntryProps {
  onSubmit: (ticketNumber: string) => void;
  onBack: () => void;
}

export default function ManualEntry({ onSubmit, onBack }: ManualEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue('');
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
            <Pen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Manual Entry
          </h1>
          <p className="text-sm text-muted-foreground">
            Type the ticket number to verify
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter ticket number..."
              className="w-full h-14 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Send className="w-5 h-5" />
            Verify Ticket
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Back to Scanner
          </button>
        </form>
      </div>
    </div>
  );
}
