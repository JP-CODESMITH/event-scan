import { useState, useEffect, useCallback, useRef } from 'react';

export interface CameraState {
  status: 'idle' | 'prompting' | 'granted' | 'denied' | 'error' | 'unavailable';
  stream: MediaStream | null;
  error: string | null;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  hasTorch: boolean;
  torchOn: boolean;
  isInsecure: boolean;
}

export function useCameraPermission() {
  const [state, setState] = useState<CameraState>({
    status: 'idle',
    stream: null,
    error: null,
    devices: [],
    activeDeviceId: null,
    hasTorch: false,
    torchOn: false,
    isInsecure: typeof window !== 'undefined' && !window.isSecureContext,
  });

  const checkPermission = useCallback(async (): Promise<PermissionState | null> => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return null;
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch {
      return null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (state.isInsecure) {
      setState(s => ({ ...s, status: 'unavailable', error: 'HTTPS required for camera access' }));
      return;
    }

    setState(s => ({ ...s, status: 'prompting', error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();

      let hasTorch = false;
      try {
        const capabilities = track.getCapabilities();
        hasTorch = !!capabilities?.torch;
      } catch {}

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = allDevices.filter(d => d.kind === 'videoinput');

      setState({
        status: 'granted',
        stream,
        error: null,
        devices: cameras,
        activeDeviceId: settings.deviceId ?? null,
        hasTorch,
        torchOn: false,
        isInsecure: false,
      });
    } catch (err: any) {
      let status: CameraState['status'] = 'denied';
      let error = 'Camera access denied or unavailable';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        status = 'denied';
        error = 'Permission denied';
      } else if (err.name === 'NotFoundError') {
        status = 'error';
        error = 'No camera found on this device';
      } else if (err.name === 'NotReadableError') {
        status = 'error';
        error = 'Camera is already in use by another application';
      } else if (err.name === 'NotSupportedError') {
        status = 'error';
        error = 'Camera access is not supported on this browser';
      }

      setState(s => ({ ...s, status, error }));
    }
  }, [state.isInsecure]);

  const stopCamera = useCallback(() => {
    setState(prev => {
      if (prev.stream) {
        prev.stream.getTracks().forEach(t => t.stop());
      }
      return {
        ...prev,
        status: 'idle' as const,
        stream: null,
        torchOn: false,
      };
    });
  }, []);

  const switchCamera = useCallback(async () => {
    setState(prev => {
      if (!prev.stream || prev.devices.length < 2) return prev;

      const currentId = prev.activeDeviceId;
      const currentIdx = prev.devices.findIndex(d => d.deviceId === currentId);
      const nextIdx = (currentIdx + 1) % prev.devices.length;
      const nextDevice = prev.devices[nextIdx];

      prev.stream.getTracks().forEach(t => t.stop());

      navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      }).then(newStream => {
        const track = newStream.getVideoTracks()[0];
        const settings = track.getSettings();

        let hasTorch = false;
        try {
          const capabilities = track.getCapabilities();
          hasTorch = !!capabilities?.torch;
        } catch {}

        setState(s => ({
          ...s,
          stream: newStream,
          activeDeviceId: settings.deviceId ?? nextDevice.deviceId,
          hasTorch,
          torchOn: false,
        }));
      }).catch(() => {
        setState(s => ({ ...s, status: 'error', error: 'Failed to switch camera' }));
      });

      return { ...prev, stream: null };
    });
  }, []);

  const toggleFlashlight = useCallback(async () => {
    setState(prev => {
      if (!prev.stream || !prev.hasTorch) return prev;

      const track = prev.stream.getVideoTracks()[0];
      const newState = !prev.torchOn;

      try {
        (track as any).applyConstraints({
          advanced: [{ torch: newState } as any],
        });
      } catch {}

      return { ...prev, torchOn: newState };
    });
  }, []);

  useEffect(() => {
    if (state.stream) {
      const tracks = state.stream.getTracks();
      return () => {
        tracks.forEach(t => t.stop());
      };
    }
  }, [state.stream]);

  return {
    state,
    requestPermission,
    stopCamera,
    switchCamera,
    toggleFlashlight,
    checkPermission,
  };
}
