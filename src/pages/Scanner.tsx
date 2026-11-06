import { useCallback, useEffect, useRef, useState } from 'react';
import { useCameraPermission } from '../hooks/useCameraPermission';
import PermissionScreen from '../components/scanner/PermissionScreen';
import PermissionDenied from '../components/scanner/PermissionDenied';
import CameraError from '../components/scanner/CameraError';
import ScannerView from '../components/scanner/ScannerView';
import ManualEntry from '../components/scanner/ManualEntry';
import ScanResultPanel from '../components/scanner/ScanResultPanel';
import type { ScanUIResult } from '../components/scanner/types';
import { api } from '../lib/api';
import { getScanOutcome } from '../lib/utils';
import { getSocket, registerScanner, scannerPing } from '../lib/socket';
import { useSocketStats } from '../hooks/useSocket';

const GATE_NAME = 'Back of the Church';
const PING_INTERVAL = 30000;
const VALID_DURATION = 1900;
const ERROR_DURATION = 3800;
const DEVICE_ID_KEY = 'scanner-device-id';

type Step = 'welcome' | 'idle' | 'manual';

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
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

function successSound(ctx: AudioContext) {
  playBeep(ctx, 880, 0.12);
  window.setTimeout(() => playBeep(ctx, 1175, 0.16), 90);
}

function errorSound(ctx: AudioContext) {
  playBeep(ctx, 280, 0.22, 'sawtooth');
  window.setTimeout(() => playBeep(ctx, 190, 0.3, 'sawtooth'), 160);
}

export default function Scanner() {
  const { state: camera, requestPermission, stopCamera, switchCamera, toggleFlashlight } = useCameraPermission();
  const { stats } = useSocketStats();

  const [step, setStep] = useState<Step>('welcome');
  const [selectedGate, setSelectedGate] = useState('');
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [battery, setBattery] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanUIResult | null>(null);
  const [deviceId] = useState(getDeviceId);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

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
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, []);

  useEffect(() => {
    if (!selectedGate) return;
    registerScanner({
      deviceId,
      name: 'Phone scanner',
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

  useEffect(() => {
    if (!result) return;
    const duration = result.tone === 'valid' ? VALID_DURATION : ERROR_DURATION;
    resultTimerRef.current = setTimeout(() => {
      setResult(null);
      setScanning(true);
    }, duration);
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, [result]);

  const handleStart = useCallback(async () => {
    setLoading(true);
    setStep('idle');
    setSelectedGate(GATE_NAME);
    try {
      await requestPermission();
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  const handleManualStart = useCallback(() => {
    setSelectedGate(GATE_NAME);
    setStep('manual');
  }, []);

  const handleScanResult = useCallback(
    async (qrValue: string) => {
      const code = qrValue.trim();
      if (!code || !online) {
        setResult({
          ...getScanOutcome(false, 'offline'),
          ticketNumber: code,
          gate: selectedGate,
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
        return;
      }

      setScanning(false);
      setSubmitting(true);
      const ctx = ensureAudio();

      try {
        const res = await api.scanTicket({
          ticketNumber: code,
          gate: selectedGate,
          device: navigator.userAgent,
          deviceId,
        });

        const copy = getScanOutcome(res.success, res.type, res.message);

        if (res.success) {
          if (!mutedRef.current) successSound(ctx);
          if (navigator.vibrate) navigator.vibrate(120);
        } else {
          if (!mutedRef.current) errorSound(ctx);
          if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
        }

        setResult({
          ...copy,
          ticketNumber: res.ticketNumber || code,
          name: res.name,
          entryNumber: res.entryNumber,
          maxEntries: res.maxEntries,
          remaining: res.remaining,
          gate: selectedGate,
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
      } catch (err: any) {
        if (!mutedRef.current) errorSound(ctx);
        if (navigator.vibrate) navigator.vibrate([80, 60, 80]);

        const copy = getScanOutcome(false, 'offline', err?.message);
        setResult({
          ...copy,
          ticketNumber: code,
          gate: selectedGate,
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [selectedGate, deviceId, ensureAudio, online]
  );

  const dismissResult = useCallback(() => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    setResult(null);
    setScanning(true);
  }, []);

  const leaveScanner = useCallback(() => {
    stopCamera();
    setSelectedGate('');
    setResult(null);
    setStep('welcome');
  }, [stopCamera]);

  if (result) {
    return (
      <ScanResultPanel
        result={result}
        onNext={dismissResult}
        duration={result.tone === 'valid' ? VALID_DURATION : ERROR_DURATION}
      />
    );
  }

  if (step === 'manual') {
    return (
      <ManualEntry
        onSubmit={handleScanResult}
        onBack={() => setStep(camera.status === 'granted' ? 'idle' : 'welcome')}
        gate={selectedGate || GATE_NAME}
        online={online}
        submitting={submitting}
      />
    );
  }

  if (camera.status === 'unavailable') {
    return (
      <CameraError
        error={camera.error || 'HTTPS required'}
        onRetry={handleStart}
        onBack={() => setStep('welcome')}
        onManual={handleManualStart}
        insecure
      />
    );
  }

  if (camera.status === 'denied') {
    return (
      <PermissionDenied
        onRetry={handleStart}
        onManual={handleManualStart}
        message={camera.error || undefined}
      />
    );
  }

  if (camera.status === 'error') {
    return (
      <CameraError
        error={camera.error || 'Camera error'}
        onRetry={handleStart}
        onManual={handleManualStart}
        onBack={() => setStep('welcome')}
      />
    );
  }

  if (camera.status === 'prompting') {
    return (
      <div className="gate gate-screen flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-ink-secondary">
        <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p role="status" className="text-small">
          Opening the camera
        </p>
      </div>
    );
  }

  if (camera.status === 'granted') {
    return (
      <ScannerView
        camera={camera}
        selectedGate={selectedGate}
        connected={connected}
        online={online}
        battery={battery}
        muted={muted}
        scanning={scanning}
        checkedIn={stats?.peopleInside ?? 0}
        totalTickets={stats?.totalTickets ?? 0}
        onToggleMute={() => setMuted((v) => !v)}
        onSwitchCamera={switchCamera}
        onToggleFlashlight={toggleFlashlight}
        onStop={leaveScanner}
        onManual={handleManualStart}
        onScanResult={handleScanResult}
      />
    );
  }

  return (
    <PermissionScreen
      onStart={handleStart}
      onManual={handleManualStart}
      loading={loading}
      insecure={camera.isInsecure}
      gate={GATE_NAME}
    />
  );
}
