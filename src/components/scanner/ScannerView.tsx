import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scan, SwitchCamera, Wifi, WifiOff,
  Volume2, VolumeX, Zap, ZapOff, Clock, Battery, Pen, Send,
} from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { CameraState } from '../../hooks/useCameraPermission';

interface ScannerViewProps {
  camera: CameraState;
  selectedGate: string;
  connected: boolean;
  battery: number | null;
  muted: boolean;
  scanning: boolean;
  onToggleMute: () => void;
  onSwitchCamera: () => void;
  onToggleFlashlight: () => void;
  onStop: () => void;
  onScanResult: (text: string) => void;
}

export interface ScanUIResult {
  type: 'success' | 'error';
  message: string;
  ticketNumber?: string;
  remaining?: number;
  entryNumber?: number;
  remoteType?: string;
}

export default function ScannerView({
  camera, selectedGate, connected, battery, muted, scanning,
  onToggleMute, onSwitchCamera, onToggleFlashlight, onStop,
  onScanResult,
}: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const processingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [inputValue, setInputValue] = useState('');

  const stopReader = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    processingRef.current = false;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => stopReader();
  }, [stopReader]);

  useEffect(() => {
    if (!camera.stream || !videoRef.current) return;

    videoRef.current.srcObject = camera.stream;
    videoRef.current.play().catch(() => {});
  }, [camera.stream]);

  useEffect(() => {
    if (mode !== 'camera') {
      stopReader();
      return;
    }
    if (!camera.stream || !videoRef.current || !scanning) {
      if (!scanning) stopReader();
      return;
    }

    const reader = new BrowserQRCodeReader();
    readerRef.current = reader;
    processingRef.current = false;

    void reader.decodeFromVideoElement(
      videoRef.current,
      (zxResult, _error) => {
        if (processingRef.current || !zxResult?.text) return;
        processingRef.current = true;
        stopReader();
        onScanResult(zxResult.text);
      }
    );

    return () => stopReader();
  }, [camera.stream, scanning, stopReader, onScanResult, mode]);

  useEffect(() => {
    if (mode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    onScanResult(text);
    setInputValue('');
  };

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <style>{`
        @keyframes scan-line {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 3px); }
        }
      `}</style>

      {/* Status Bar */}
      <div className="relative z-10 glass">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {camera.status === 'granted' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-400" />
              )}
              <span className="text-xs text-muted-foreground">
                {camera.status === 'granted' ? 'Camera Ready' : 'Camera Off'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {connected ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className="text-xs text-muted-foreground">
                {connected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{timeStr}</span>
            </div>
            {battery !== null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Battery className="w-3 h-3" />
                <span>{battery}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
          <span className="text-xs text-muted-foreground">
            Gate: <span className="font-medium text-foreground">{selectedGate}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode(m => m === 'camera' ? 'manual' : 'camera')}
              className={`p-1.5 rounded-lg transition-colors ${
                mode === 'manual' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-muted-foreground'
              }`}
              aria-label={mode === 'manual' ? 'Switch to Camera' : 'Manual Input'}
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted
                ? <VolumeX className="w-4 h-4 text-muted-foreground" />
                : <Volume2 className="w-4 h-4 text-muted-foreground" />}
            </button>
            {camera.devices.length > 1 && (
              <button
                onClick={onSwitchCamera}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            {camera.hasTorch && (
              <button
                onClick={onToggleFlashlight}
                className={`p-1.5 rounded-lg transition-colors ${
                  camera.torchOn ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/10 text-muted-foreground'
                }`}
                aria-label={camera.torchOn ? 'Disable Flashlight' : 'Enable Flashlight'}
              >
                {camera.torchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scanner / Manual Input Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {mode === 'camera' ? (
          <>
            <div className="relative w-[280px] h-[280px] mb-6">
              <div className="scanner-frame w-full h-full">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="scanner-corners tl" />
              <div className="scanner-corners tr" />
              <div className="scanner-corners bl" />
              <div className="scanner-corners br" />
            </div>

            <div className="flex items-center gap-2 text-xs text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Scanning...
            </div>
          </>
        ) : (
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-indigo-500/20">
                <Pen className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Manual Entry</h2>
              <p className="text-xs text-muted-foreground">
                Type the ticket number below
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Enter ticket number..."
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onStop}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Stop Scanner
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scan className="w-3 h-3" />
            <span>{mode === 'manual' ? 'Manual Entry' : selectedGate ? `Scanning at ${selectedGate}` : 'Scanner Ready'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
