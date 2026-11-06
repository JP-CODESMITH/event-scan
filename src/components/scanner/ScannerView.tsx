import { useEffect, useRef, useState } from 'react';
import {
  BatteryMedium,
  Keyboard,
  SwitchCamera,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Zap,
  ZapOff,
} from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import type { CameraState } from '../../hooks/useCameraPermission';
import { cn, formatClock } from '../../lib/utils';

interface ScannerViewProps {
  camera: CameraState;
  selectedGate: string;
  connected: boolean;
  online: boolean;
  battery: number | null;
  muted: boolean;
  scanning: boolean;
  checkedIn: number;
  totalTickets: number;
  onToggleMute: () => void;
  onSwitchCamera: () => void;
  onToggleFlashlight: () => void;
  onStop: () => void;
  onManual: () => void;
  onScanResult: (text: string) => void;
}

export default function ScannerView({
  camera,
  selectedGate,
  connected,
  online,
  battery,
  muted,
  scanning,
  checkedIn,
  totalTickets,
  onToggleMute,
  onSwitchCamera,
  onToggleFlashlight,
  onStop,
  onManual,
  onScanResult,
}: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!camera.stream || !videoRef.current) return;
    videoRef.current.srcObject = camera.stream;
    videoRef.current.play().catch(() => {});
  }, [camera.stream]);

  useEffect(() => {
    if (!camera.stream || !videoRef.current || !scanning) return;

    const reader = new BrowserQRCodeReader();
    let cancelled = false;
    processingRef.current = false;

    reader
      .decodeFromVideoElement(videoRef.current, (result) => {
        if (processingRef.current || !result) return;
        const text = result.getText();
        if (!text) return;
        processingRef.current = true;
        controlsRef.current?.stop();
        controlsRef.current = null;
        onScanResult(text);
      })
      .then((controls) => {
        if (cancelled || processingRef.current) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      processingRef.current = false;
    };
  }, [camera.stream, scanning, onScanResult]);

  const progress = totalTickets > 0 ? Math.min((checkedIn / totalTickets) * 100, 100) : 0;

  return (
    <div className="gate relative h-[100dvh] overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        aria-label="Camera preview for ticket scanning"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-x-0 top-0 z-10 h-44 bg-gradient-to-b from-[#0b0a08]/90 via-[#0b0a08]/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-[54%] bg-gradient-to-t from-[#0b0a08] via-[#0b0a08]/92 to-transparent" />

      <header className="safe-top absolute inset-x-0 top-0 z-20 px-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onStop}
            className="flex h-11 items-center gap-1.5 rounded-sm bg-[#0b0a08]/55 px-2.5 text-tiny text-ink transition-colors hover:bg-[#0b0a08]/80 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <X className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            End
          </button>

          <div className="min-w-0 pt-1 text-center">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-secondary">Gate</p>
            <p className="mt-0.5 truncate text-small font-medium text-ink">{selectedGate || 'Not set'}</p>
          </div>

          <div className="flex h-11 items-center gap-2 rounded-sm bg-[#0b0a08]/55 px-2.5 font-mono text-[11px] tabular text-ink-secondary">
            <span>{formatClock(time)}</span>
            {battery !== null && (
              <span className="flex items-center gap-1">
                <BatteryMedium className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
                {battery}%
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-ink-secondary">
            {connected ? (
              <Wifi className="h-3.5 w-3.5 text-success" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-danger" strokeWidth={1.8} aria-hidden="true" />
            )}
            {connected ? 'Live' : 'Reconnecting'}
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
          <span className="flex items-center gap-1.5 text-ink-secondary">
            <span
              className={cn('status-dot', scanning ? 'bg-success' : 'bg-warning')}
              aria-hidden="true"
            />
            {scanning ? 'Scanning' : 'Reading'}
          </span>
        </div>
      </header>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="w-[min(68vw,292px)]">
          <div
            className="relative aspect-square shadow-[0_0_0_9999px_rgba(11,10,8,0.34)]"
            aria-hidden="true"
          >
            <span className="viewfinder-corner tl" />
            <span className="viewfinder-corner tr" />
            <span className="viewfinder-corner bl" />
            <span className="viewfinder-corner br" />
            <div className="viewfinder-grid absolute inset-x-[12%] inset-y-[12%] opacity-30" />
          </div>
          <p className="mt-6 text-center text-tiny text-ink-secondary">Hold the QR inside the frame.</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-24">
        {!online && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-sm border border-danger/40 bg-danger-soft px-3 py-2.5"
          >
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.8} aria-hidden="true" />
            <p className="text-tiny text-danger">Offline. Scans will not be recorded until the connection returns.</p>
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">Checked in</p>
            <p className="mt-1 font-mono text-[2.6rem] font-medium leading-none tabular text-ink">
              {checkedIn}
              <span className="ml-1 text-[1.1rem] font-normal text-ink-tertiary">/ {totalTickets}</span>
            </p>
          </div>
          <p className="pb-1 text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-ink-tertiary">
            {connected ? 'All gates' : 'Local only'}
            <br />
            <span className="text-ink-secondary">{scanning ? 'Ready' : 'Hold'}</span>
          </p>
        </div>

        <div className="mt-3 h-[3px] w-full overflow-hidden bg-ink/15" aria-hidden="true">
          <div className="h-full bg-accent transition-[width] duration-slow ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-4 gap-1.5" role="group" aria-label="Scanner controls">
          <ControlButton
            label={muted ? 'Muted' : 'Sound'}
            active={!muted}
            onClick={onToggleMute}
            icon={muted ? <VolumeX className="h-5 w-5" strokeWidth={1.7} /> : <Volume2 className="h-5 w-5" strokeWidth={1.7} />}
            ariaLabel={muted ? 'Turn sound on' : 'Mute scanner sound'}
          />
          <ControlButton
            label="Code"
            onClick={onManual}
            icon={<Keyboard className="h-5 w-5" strokeWidth={1.7} />}
            ariaLabel="Enter a ticket code manually"
          />
          <ControlButton
            label="Flip"
            onClick={onSwitchCamera}
            disabled={camera.devices.length < 2}
            icon={<SwitchCamera className="h-5 w-5" strokeWidth={1.7} />}
            ariaLabel="Switch camera"
          />
          <ControlButton
            label="Torch"
            onClick={onToggleFlashlight}
            active={camera.torchOn}
            disabled={!camera.hasTorch}
            icon={
              camera.torchOn ? (
                <Zap className="h-5 w-5" strokeWidth={1.7} />
              ) : (
                <ZapOff className="h-5 w-5" strokeWidth={1.7} />
              )
            }
            ariaLabel={camera.torchOn ? 'Turn torch off' : 'Turn torch on'}
          />
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  icon,
  onClick,
  ariaLabel,
  active = false,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      className={cn(
        'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-sm border px-1 text-[10px] font-medium uppercase tracking-[0.06em] transition-colors duration-fast focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-30',
        active
          ? 'border-accent/40 bg-accent-soft text-accent-strong'
          : 'border-border bg-surface/90 text-ink-secondary hover:border-border-strong hover:text-ink'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
