import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initializeSocket() {
  if (socket?.connected) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}

// Event Types
export type MatchEvent =
  | { type: 'goal'; player: string; team: string; minute: number }
  | { type: 'card'; player: string; color: 'yellow' | 'red'; minute: number }
  | { type: 'substitution'; playerOut: string; playerIn: string; minute: number }
  | { type: 'injury'; player: string; severity: string; minute: number }
  | { type: 'stats'; possession: number; shots: number; accuracy: number };

export function emitMatchEvent(matchId: string, event: MatchEvent) {
  const socket = getSocket();
  socket?.emit('match:event', { matchId, event });
}

export function subscribeToMatch(
  matchId: string,
  onEvent: (event: MatchEvent) => void,
) {
  const socket = getSocket();
  socket?.emit('match:join', { matchId });
  socket?.on(`match:${matchId}:event`, onEvent);

  return () => {
    socket?.off(`match:${matchId}:event`, onEvent);
  };
}

export function unsubscribeFromMatch(matchId: string) {
  const socket = getSocket();
  socket?.emit('match:leave', { matchId });
}
