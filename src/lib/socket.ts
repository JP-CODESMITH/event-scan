import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ['polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function registerScanner(data: {
  deviceId: string;
  name: string;
  browser: string;
  ip: string;
  gate: string;
  battery: number;
}) {
  const s = getSocket();
  s.emit('register-scanner', data);
}

export function scannerPing(deviceId: string) {
  const s = getSocket();
  s.emit('scanner-ping', { deviceId });
}
