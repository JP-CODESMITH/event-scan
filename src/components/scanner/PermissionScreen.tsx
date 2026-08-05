import { Scan, Pen } from 'lucide-react';
import { Button } from '../ui/button';

interface PermissionScreenProps {
  onStart: () => void;
  onManual?: () => void;
  loading?: boolean;
  insecure?: boolean;
}

export default function PermissionScreen({ onStart, onManual, loading, insecure }: PermissionScreenProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Scan className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
          EVENT SCAN
        </h1>
        <p className="text-lg text-muted-foreground mb-2">Ready to Scan</p>
        <p className="text-sm text-muted-foreground/60 mb-8 max-w-xs mx-auto">
          Press the button below to start scanning
        </p>

        {insecure && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-center">
            <p className="text-amber-400 text-sm font-medium">HTTPS Required for Camera</p>
            <p className="text-amber-300/60 text-xs mt-1">
              Access via <span className="font-mono text-amber-300">https://</span> to enable camera access
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={onStart}
            disabled={loading}
            size="lg"
            className="w-full text-base h-12 gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Requesting Camera...
              </>
            ) : (
              <>
                <Scan className="w-5 h-5" />
                Start Scanner
              </>
            )}
          </Button>

          {onManual && (
            <Button
              onClick={onManual}
              disabled={loading}
              variant="outline"
              size="lg"
              className="w-full text-base h-12 gap-2"
            >
              <Pen className="w-5 h-5" />
              Manual Entry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
