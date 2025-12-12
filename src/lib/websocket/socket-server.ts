// 🎯 PRODUCTION-GRADE WEBSOCKET SETUP
// Enhanced with better error handling and monitoring

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { logger } from '@/lib/api/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SocketUser {
  userId: string;
  username: string;
  role: string;
  joinedAt: Date;
  isOnline: boolean;
}

interface MatchRoom {
  matchId: string;
  activeUsers: Map<string, SocketUser>;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  lastUpdate: Date;
  lastScore: { home: number; away: number } | null;
}

interface NotificationPayload {
  id: string;
  type: 'MATCH_UPDATE' | 'GOAL' | 'CARD' | 'INJURY' | 'TEAM_MESSAGE' | 'SYSTEM';
  title: string;
  message: string;
  recipientId: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, any>;
}

// ============================================================================
// SOCKET SERVER INITIALIZATION
// ============================================================================

let io: SocketIOServer | null = null;
const matchRooms = new Map<string, MatchRoom>();
const userSockets = new Map<string, Set<string>>();
const userPresence = new Map<string, { status: 'online' | 'away' | 'offline'; lastSeen: Date }>();

export async function initializeSocketServer(httpServer: any): Promise<SocketIOServer> {
  if (io) {
    logger.info('[WebSocket] Socket server already initialized');
    return io;
  }

  try {
    // Initialize Redis clients
    const pubClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      retryStrategy: (times) => Math.min(times * 50, 500),
    });

    const subClient = pubClient.duplicate();

    // Connect clients
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    logger.info('[WebSocket] Redis clients connected');

    // Initialize Socket.IO
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      adapter: createAdapter(pubClient, subClient),
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 1e6, // 1MB max message size
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    // ========================================================================
    // MIDDLEWARE
    // ========================================================================

    // Authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      const username = socket.handshake.auth.username || 'Anonymous';

      if (!token || !userId) {
        return next(new Error('Authentication failed: token or userId missing'));
      }

      // In production, verify JWT here
      socket.data = {
        userId,
        username,
        token,
        connectedAt: new Date(),
      };

      logger.info(`[WebSocket] User ${userId} authenticated`);
      next();
    });

    // Error middleware
    io.use((socket, next) => {
      socket.on('error', (error) => {
        logger.error(`[WebSocket] Socket error for ${socket.data.userId}:`, error);
      });
      next();
    });

    // ========================================================================
    // CONNECTION HANDLERS
    // ========================================================================

    io.on('connection', (socket) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      logger.info(`[WebSocket] User ${userId} connected. Socket ID: ${socket.id}`);

      // Track user sockets
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
        userPresence.set(userId, {
          status: 'online',
          lastSeen: new Date(),
        });

        // Notify all users
        io?.emit('presence:user-online', {
          userId,
          username,
          timestamp: new Date().toISOString(),
        });
      }
      userSockets.get(userId)?.add(socket.id);

      // ====================================================================
      // MATCH EVENTS
      // ====================================================================

      socket.on('match:join', (data: { matchId: string; teamId?: string }) => {
        const { matchId, teamId } = data;
        const room = `match:${matchId}`;

        socket.join(room);
        logger.info(`[WebSocket] User ${userId} joined match ${matchId}`);

        // Initialize room if needed
        if (!matchRooms.has(matchId)) {
          matchRooms.set(matchId, {
            matchId,
            activeUsers: new Map(),
            status: 'SCHEDULED',
            lastUpdate: new Date(),
            lastScore: null,
          });
        }

        const matchRoom = matchRooms.get(matchId)!;
        matchRoom.activeUsers.set(socket.id, {
          userId,
          username,
          role: 'VIEWER',
          joinedAt: new Date(),
          isOnline: true,
        });

        // Notify room
        io?.to(room).emit('match:user-joined', {
          userId,
          username,
          totalUsers: matchRoom.activeUsers.size,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('match:leave', (matchId: string) => {
        const room = `match:${matchId}`;
        const matchRoom = matchRooms.get(matchId);

        if (matchRoom) {
          matchRoom.activeUsers.delete(socket.id);
          if (matchRoom.activeUsers.size === 0) {
            matchRooms.delete(matchId);
          }
        }

        socket.leave(room);
        logger.info(`[WebSocket] User ${userId} left match ${matchId}`);

        io?.to(room).emit('match:user-left', {
          userId,
          timestamp: new Date().toISOString(),
          totalUsers: matchRoom?.activeUsers.size || 0,
        });
      });

      // Real-time match score update
      socket.on('match:score-update', (data: any) => {
        const { matchId, homeGoals, awayGoals, minute } = data;
        const room = `match:${matchId}`;

        const matchRoom = matchRooms.get(matchId);
        if (matchRoom) {
          matchRoom.lastScore = { home: homeGoals, away: awayGoals };
          matchRoom.lastUpdate = new Date();
        }

        io?.to(room).emit('match:score-updated', {
          matchId,
          homeGoals,
          awayGoals,
          minute,
          timestamp: new Date().toISOString(),
        });

        logger.info(`[WebSocket] Match ${matchId} score: ${homeGoals}-${awayGoals}`);
      });

      // Match event logged (goal, card, etc)
      socket.on('match:event-logged', (data: any) => {
        const { matchId, eventType, playerId, playerName, minute, description } = data;
        const room = `match:${matchId}`;

        io?.to(room).emit('match:event-logged', {
          matchId,
          eventType,
          playerId,
          playerName,
          minute,
          description,
          timestamp: new Date().toISOString(),
        });

        logger.info(`[WebSocket] Event in match ${matchId}: ${eventType} by ${playerName}`);
      });

      // Match status change
      socket.on('match:status-change', (data: any) => {
        const { matchId, status } = data;
        const room = `match:${matchId}`;

        if (matchRooms.has(matchId)) {
          matchRooms.get(matchId)!.status = status;
        }

        io?.to(room).emit('match:status-changed', {
          matchId,
          status,
          timestamp: new Date().toISOString(),
        });

        logger.info(`[WebSocket] Match ${matchId} status: ${status}`);
      });

      // ====================================================================
      // NOTIFICATIONS
      // ====================================================================

      socket.on('notification:send', (data: Omit<NotificationPayload, 'id' | 'createdAt' | 'read'>) => {
        const notification: NotificationPayload = {
          id: `notif_${Date.now()}_${Math.random()}`,
          ...data,
          createdAt: new Date().toISOString(),
          read: false,
        };

        const recipientSockets = userSockets.get(data.recipientId);
        if (recipientSockets) {
          recipientSockets.forEach((socketId) => {
            io?.to(socketId).emit('notification:new', notification);
          });
        }

        logger.info(`[WebSocket] Notification sent to ${data.recipientId}: ${notification.title}`);
      });

      socket.on('notification:read', (notificationId: string) => {
        io?.emit('notification:acknowledged', {
          notificationId,
          read: true,
          timestamp: new Date().toISOString(),
        });
      });

      // ====================================================================
      // PRESENCE
      // ====================================================================

      socket.on('presence:status-change', (status: 'online' | 'away' | 'offline') => {
        userPresence.set(userId, {
          status,
          lastSeen: new Date(),
        });

        io?.emit('presence:user-status', {
          userId,
          username,
          status,
          lastSeen: new Date().toISOString(),
        });
      });

      // ====================================================================
      // TEAM COLLABORATION
      // ====================================================================

      socket.on('team:join', (teamId: string) => {
        const teamRoom = `team:${teamId}`;
        socket.join(teamRoom);

        io?.to(teamRoom).emit('team:user-joined', {
          userId,
          username,
          timestamp: new Date().toISOString(),
        });

        logger.info(`[WebSocket] User ${userId} joined team ${teamId}`);
      });

      socket.on('team:message', (data: { teamId: string; message: string; type?: string }) => {
        const { teamId, message, type = 'TEXT' } = data;
        const teamRoom = `team:${teamId}`;

        io?.to(teamRoom).emit('team:message-received', {
          userId,
          username,
          message,
          type,
          timestamp: new Date().toISOString(),
        });

        logger.info(`[WebSocket] Team ${teamId} message from ${username}`);
      });

      socket.on('team:leave', (teamId: string) => {
        const teamRoom = `team:${teamId}`;
        socket.leave(teamRoom);

        io?.to(teamRoom).emit('team:user-left', {
          userId,
          username,
          timestamp: new Date().toISOString(),
        });
      });

      // ====================================================================
      // DISCONNECT
      // ====================================================================

      socket.on('disconnect', () => {
        logger.info(`[WebSocket] User ${userId} disconnected`);

        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);

          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
            userPresence.set(userId, {
              status: 'offline',
              lastSeen: new Date(),
            });

            io?.emit('presence:user-offline', {
              userId,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Leave all match rooms
        matchRooms.forEach((room, matchId) => {
          room.activeUsers.delete(socket.id);
          if (room.activeUsers.size === 0) {
            matchRooms.delete(matchId);
          } else {
            io?.to(`match:${matchId}`).emit('match:user-left', {
              userId,
              totalUsers: room.activeUsers.size,
            });
          }
        });
      });
    });

    logger.info('[WebSocket] Socket.IO server initialized successfully');
    return io;
  } catch (error) {
    logger.error('[WebSocket] Failed to initialize Socket.IO:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function broadcastMessage(event: string, data: any): void {
  if (!io) return;
  io.emit(event, data);
}

export function sendToUser(userId: string, event: string, data: any): void {
  if (!io) return;
  const socketIds = userSockets.get(userId);
  if (socketIds) {
    socketIds.forEach((socketId) => {
      io?.to(socketId).emit(event, data);
    });
  }
}

export function sendToRoom(room: string, event: string, data: any): void {
  if (!io) return;
  io.to(room).emit(event, data);
}

export function getActiveUsersCount(): number {
  return userSockets.size;
}

export function getMatchRoomInfo(matchId: string): MatchRoom | undefined {
  return matchRooms.get(matchId);
}

export function getMatchRoomUsers(matchId: string): string[] {
  const room = matchRooms.get(matchId);
  return room ? Array.from(room.activeUsers.values()).map((u) => u.userId) : [];
}

export function isUserOnline(userId: string): boolean {
  return userPresence.get(userId)?.status === 'online';
}

export default {
  initializeSocketServer,
  getSocketServer,
  broadcastMessage,
  sendToUser,
  sendToRoom,
  getActiveUsersCount,
  getMatchRoomInfo,
  getMatchRoomUsers,
  isUserOnline,
};
