import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scan, CheckCircle2, XCircle, Wifi, WifiOff,
} from 'lucide-react';
import { useCameraPermission } from '../hooks/useCameraPermission';
import PermissionScreen from '../components/scanner/PermissionScreen';
import PermissionDenied from '../components/scanner/PermissionDenied';
import CameraError from '../components/scanner/CameraError';
import ScannerView from '../components/scanner/ScannerView';
import ManualEntry from '../components/scanner/ManualEntry';
import type { ScanUIResult } from '../components/scanner/ScannerView';
import { Card, CardContent } from '../components/ui/card';
import { api } from '../lib/api';
import { getSocket, registerScanner, scannerPing } from '../lib/socket';

const GATE_NAME = 'Back of the Church';
const PING_INTERVAL = 30000;
const SUCCESS_DURATION = 1000;
const ERROR_DURATION = 1000;
const DEVICE_ID_KEY = 'scanner-device-id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function playBeep(ctx: AudioContext, freq: number, dur: number, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

function successSound(ctx: AudioContext) {
  playBeep(ctx, 880, 0.15);
  setTimeout(() => playBeep(ctx, 1100, 0.2), 100);
}

function errorSound(ctx: AudioContext) {
  playBeep(ctx, 300, 0.3, 'sawtooth');
  setTimeout(() => playBeep(ctx, 200, 0.4, 'sawtooth'), 200);
}

export default function Scanner() {
  const { state: camera, requestPermission, stopCamera, switchCamera, toggleFlashlight } = useCameraPermission();

  const [step, setStep] = useState<'welcome' | 'idle' | 'manual'>('welcome');
  const [selectedGate, setSelectedGate] = useState('');
  const [connected, setConnected] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanUIResult | null>(null);
  const [deviceId] = useState(getDeviceId);
  const [loading, setLoading] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const nav = navigator as any;
    if (typeof nav.getBattery === 'function') {
      nav.getBattery().then((bat: any) => {
        const update = () => setBattery(Math.round(bat.level * 100));
        update();
        bat.addEventListener('levelchange', update);
      });
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    setConnected(socket.connected);
    return () => { socket.off('connect', on); socket.off('disconnect', off); };
  }, []);

  useEffect(() => {
    if (!selectedGate) return;
    registerScanner({
      deviceId,
      name: 'Phone Scanner',
      browser: navigator.userAgent,
      ip: '',
      gate: selectedGate,
      battery: battery ?? 100,
    });
    const interval = setInterval(() => scannerPing(deviceId), PING_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedGate, deviceId, battery]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, [stopCamera]);

  useEffect(() => {
    if (camera.status === 'granted') {
      setSelectedGate(GATE_NAME);
      setScanning(true);
    }
  }, [camera.status]);

  const handleStart = useCallback(async () => {
    try {
      setLoading(true);
      setStep('idle');
      await requestPermission();
    } catch (err) {
      console.error('Failed to start scanner:', err);
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  const handleManualStart = useCallback(() => {
    setSelectedGate(GATE_NAME);
    setStep('manual');
  }, []);

  const handleScanResult = useCallback(async (qrValue: string) => {
    if (!selectedGate) return;
    setScanning(false);

    const ctx = ensureAudio();

    try {
      const res = await api.scanTicket({
        ticketNumber: qrValue,
        gate: selectedGate,
        device: navigator.userAgent,
        deviceId,
      });

      const scanResult: ScanUIResult = {
        type: 'success',
        message: res.message || 'Entry Granted',
        ticketNumber: qrValue,
        remaining: res.remaining,
        entryNumber: res.entryNumber,
        remoteType: res.type,
      };

      if (res.success) {
        if (!mutedRef.current) successSound(ctx);
        if (navigator.vibrate) navigator.vibrate(200);
        scanResult.type = 'success';
      } else {
        if (!mutedRef.current) errorSound(ctx);
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
        scanResult.type = 'error';
        scanResult.remoteType = res.type;
      }

      setResult(scanResult);

      resultTimerRef.current = setTimeout(() => {
        setResult(null);
        setScanning(true);
      }, scanResult.type === 'success' ? SUCCESS_DURATION : ERROR_DURATION);
    } catch (err: any) {
      if (!mutedRef.current) errorSound(ctx);
      if (navigator.vibrate) navigator.vibrate([100, 100, 100]);

      setResult({
        type: 'error',
        message: err.message || 'Scan failed',
        ticketNumber: qrValue,
      });

      resultTimerRef.current = setTimeout(() => {
        setResult(null);
        setScanning(true);
      }, ERROR_DURATION);
    }
  }, [selectedGate, deviceId, ensureAudio]);

  if (camera.status === 'unavailable') {
    return (
      <CameraError
        error={camera.error || 'HTTPS required'}
        onRetry={handleStart}
        onBack={() => setStep('welcome')}
        insecure
      />
    );
  }

  if (step === 'welcome' && camera.status !== 'granted' && camera.status !== 'denied') {
    return (
      <PermissionScreen
        onStart={handleStart}
        onManual={handleManualStart}
        loading={loading}
        insecure={camera.isInsecure}
      />
    );
  }

  if (camera.status === 'denied') {
    return (
      <PermissionDenied
        onRetry={handleStart}
        message={camera.error || undefined}
      />
    );
  }

  if (camera.status === 'error') {
    return <CameraError error={camera.error || 'Camera error'} onRetry={handleStart} />;
  }

  if (camera.status === 'prompting') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <span className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm">Requesting camera access...</p>
        </div>
      </div>
    );
  }

  if (result) {
    const ok = result.type === 'success';
    return (
      <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4 ${
        ok
          ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950'
          : 'bg-gradient-to-br from-red-950 via-red-900 to-rose-950'
      }`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl ${
            ok ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`} />
        </div>

        <div className="relative w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className={`rounded-full p-4 ${ok ? 'bg-emerald-500/20 success-glow' : 'bg-red-500/20 error-glow'}`}>
              {ok
                ? <CheckCircle2 className="w-20 h-20 text-emerald-400" />
                : <XCircle className="w-20 h-20 text-red-400" />}
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {ok ? 'Entry Granted' : 'Access Denied'}
          </h2>
          <p className={`mb-6 ${ok ? 'text-emerald-300/80' : 'text-red-300/80'}`}>{result.message}</p>
          {ok && result.ticketNumber && (
            <Card className="border-emerald-500/20 bg-emerald-950/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-300/60">Ticket</span>
                  <span className="font-mono text-emerald-300">{result.ticketNumber}</span>
                </div>
                {result.entryNumber !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-300/60">Entry #</span>
                    <span className="font-mono text-emerald-300">{result.entryNumber}</span>
                  </div>
                )}
                {result.remaining !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-300/60">Remaining</span>
                    <span className="font-mono text-emerald-300">{result.remaining}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {!ok && result.remoteType === 'unauthorized' && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-300/60 font-medium uppercase tracking-wider mb-1">
                Ticket Not Authorized
              </p>
              <p className="text-sm text-red-300">
                Please proceed to the Registration Desk for assistance.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'manual') {
    return (
      <ManualEntry
        onSubmit={handleScanResult}
        onBack={() => { setSelectedGate(''); setStep('welcome'); }}
      />
    );
  }

  if (camera.status !== 'granted') {
    return (
      <PermissionScreen
        onStart={handleStart}
        onManual={handleManualStart}
        loading={loading}
        insecure={camera.isInsecure}
      />
    );
  }

  return (
    <ScannerView
      camera={camera}
      selectedGate={selectedGate}
      connected={connected}
      battery={battery}
      muted={muted}
      scanning={scanning}
      onToggleMute={() => setMuted(v => !v)}
      onSwitchCamera={switchCamera}
      onToggleFlashlight={toggleFlashlight}
      onStop={() => { stopCamera(); setSelectedGate(''); setStep('welcome'); }}
      onScanResult={handleScanResult}
    />
  );
}
