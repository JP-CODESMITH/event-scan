import { CameraOff, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface PermissionDeniedProps {
  onRetry: () => void;
  message?: string;
}

export default function PermissionDenied({ onRetry, message }: PermissionDeniedProps) {
  const openHelp = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      window.open('https://support.apple.com/guide/iphone/change-camera-settings-iph3c0f2b3a/ios', '_blank');
    } else if (isAndroid) {
      window.open('https://support.google.com/chrome/answer/2693767', '_blank');
    } else {
      window.open('https://support.google.com/chrome/answer/2693767', '_blank');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-red-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="error-glow rounded-full p-5 bg-red-500/20">
            <CameraOff className="w-16 h-16 text-red-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-red-400 mb-3">Camera Permission Required</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {message || 'Camera access is required to scan tickets. Please enable camera permission in your browser settings.'}
        </p>

        <div className="space-y-3">
          <Button
            onClick={onRetry}
            variant="default"
            size="lg"
            className="w-full text-base h-12 gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Retry
          </Button>
          <Button
            onClick={openHelp}
            variant="glass"
            size="lg"
            className="w-full text-base h-12 gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Open Browser Help
          </Button>
        </div>
      </div>
    </div>
  );
}
