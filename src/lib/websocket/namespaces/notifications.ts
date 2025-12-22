import { Socket } from 'socket.io';
import { getSocketManager } from '@/lib/socket';

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export function setupNotificationsNamespace() {
  const io = getSocketManager();
  const notifNsp = io.on('/notifications');

  notifNsp.on('connection', (socket: Socket) => {
    console.log(`[Notifications] User connected: ${socket.data.userId}`);

    // ===== SUBSCRIBE TO OWN NOTIFICATIONS =====
    socket.on('subscribe', () => {
      socket.join(`user:${socket.data.userId}`);
    });

    // ===== RECEIVE NOTIFICATION =====
    socket.on('notify', (payload: NotificationPayload) => {
      // Validate
      if (!payload.type || !payload.title || !payload.message) {
        socket.emit('error', { message: 'Invalid notification' });
        return;
      }

      // Broadcast to user
      notifNsp.to(`user:${socket.data.userId}`).emit('notification', {
        id: Math.random().toString(36),
        ...payload,
        timestamp: new Date().toISOString(),
        read: false,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Notifications] User disconnected: ${socket.data.userId}`);
    });
  });
}

// Helper to send notifications from backend
export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  const io = getSocketManager();
  io.on('/notifications').to(`user:${userId}`).emit('notification', {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}
