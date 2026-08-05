import { AlertTriangle, Camera, CameraOff, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface CameraErrorProps {
  error: string;
  onRetry: () => void;
  onBack?: () => void;
  insecure?: boolean;
}

export default function CameraError({ error, onRetry, onBack, insecure }: CameraErrorProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full p-5 bg-amber-500/20">
            {insecure ? (
              <AlertTriangle className="w-16 h-16 text-amber-400" />
            ) : (
              <CameraOff className="w-16 h-16 text-amber-400" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-amber-400 mb-3">Camera Unavailable</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {insecure
            ? 'Camera access requires a secure connection. Access this page via HTTPS and accept the certificate warning.'
            : error}
        </p>

        <div className="space-y-3">
          {insecure && onBack && (
            <Button
              onClick={onBack}
              variant="glass"
              size="lg"
              className="w-full text-base h-12 gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Scanner
            </Button>
          )}
          {!insecure && (
            <Button
              onClick={onRetry}
              variant="default"
              size="lg"
              className="w-full text-base h-12 gap-2"
            >
              <Camera className="w-5 h-5" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
