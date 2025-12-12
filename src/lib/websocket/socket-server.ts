// 🎯 SECTION 6: WEBSOCKET INFRASTRUCTURE - REAL-TIME FEATURES
// Path: src/lib/websocket/socket-server.ts

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { logger } from '@/lib/api/logger';

// ============================================================================
// TYPES
// ============================================================================

interface SocketUser {
  userId: string;
  username: string;
  role: string;
  joinedAt: Date;
}

interface MatchRoom {
  matchId: string;
  activeUsers: Map<string, SocketUser>;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  lastUpdate: Date;
}

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  recipientId: string;
  createdAt: string;
  read: boolean;
}

// ============================================================================
// SOCKET SERVER SETUP
// ============================================================================

let io: SocketIOServer | null = null;
const matchRooms = new Map<string, MatchRoom>();
const userSockets = new Map<string, Set<string>>(); // userId -> set of socket IDs

/**
 * Initialize Socket.IO server with Redis adapter for scalability
 * Call this once on server startup
 */
export async function initializeSocketServer(httpServer: any): Promise<SocketIOServer> {
  if (io) {
    return io;
  }

  try {
    // Create Redis client for adapter
    const pubClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });

    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Initialize Socket.IO with Redis adapter
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      adapter: createAdapter(pubClient, subClient),
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 1e6, // 1MB
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // ========================================================================
    // MIDDLEWARE
    // ========================================================================

    // Authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;

      if (!token || !userId) {
        return next(new Error('Authentication failed: token or userId missing'));
      }

      // In production, verify JWT token here
      socket.data.userId = userId;
      socket.data.token = token;

      logger.info(`[WebSocket] User ${userId} authenticated`);
      next();
    });

    // ========================================================================
    // CONNECTION HANDLERS
    // ========================================================================

    io.on('connection', (socket) => {
      const userId = socket.data.userId;
      logger.info(`[WebSocket] User ${userId} connected. Socket ID: ${socket.id}`);

      // Track user sockets
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
        // Notify others that user is online
        io?.emit('presence:user-online', {
          userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      }
      userSockets.get(userId)?.add(socket.id);

      // ========================================================================
      // MATCH EVENTS
      // ========================================================================

      socket.on('match:join', (matchId: string) => {
        const room = `match:${matchId}`;
        socket.join(room);

        // Initialize room if needed
        if (!matchRooms.has(matchId)) {
          matchRooms.set(matchId, {
            matchId,
            activeUsers: new Map(),
            status: 'SCHEDULED',
            lastUpdate: new Date(),
          });
        }

        const matchRoom = matchRooms.get(matchId);
        if (matchRoom) {
          matchRoom.activeUsers.set(socket.id, {
            userId,
            username: socket.handshake.auth.username || 'Anonymous',
            role: socket.handshake.auth.role || 'VIEWER',
            joinedAt: new Date(),
          });
        }

        logger.info(`[WebSocket] User ${userId} joined match ${matchId}`);

        // Notify others in room
        socket.emit('match:user-joined', {
          userId,
          totalUsers: matchRoom?.activeUsers.size || 0,
        });

        socket.to(room).emit('match:user-joined', {
          userId,
          totalUsers: matchRoom?.activeUsers.size || 0,
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

        socket.to(room).emit('match:user-left', {
          userId,
          totalUsers: matchRoom?.activeUsers.size || 0,
        });
      });

      /**
       * Handle real-time match score updates
       * Event: match:score-updated
       * Payload: { matchId, homeGoals, awayGoals, timestamp }
       */
      socket.on('match:score-updated', (data) => {
        const { matchId, homeGoals, awayGoals } = data;
        const room = `match:${matchId}`;

        logger.info(`[WebSocket] Match ${matchId} score updated: ${homeGoals} - ${awayGoals}`);

        // Broadcast to all users in match room
        io?.to(room).emit('match:score-updated', {
          matchId,
          homeGoals,
          awayGoals,
          timestamp: new Date().toISOString(),
        });

        // Optionally persist to database here
        if (matchRooms.has(matchId)) {
          const matchRoom = matchRooms.get(matchId)!;
          matchRoom.lastUpdate = new Date();
        }
      });

      /**
       * Handle match event logging (goal, yellow card, etc)
       * Event: match:event-logged
       * Payload: { matchId, eventType, playerId, minute, description }
       */
      socket.on('match:event-logged', (data) => {
        const { matchId, eventType, playerId, minute } = data;
        const room = `match:${matchId}`;

        logger.info(`[WebSocket] Event logged in match ${matchId}: ${eventType} by player ${playerId} at minute ${minute}`);

        io?.to(room).emit('match:event-logged', {
          matchId,
          eventType,
          playerId,
          minute,
          timestamp: new Date().toISOString(),
        });
      });

      /**
       * Handle match status changes
       * Event: match:status-changed
       * Payload: { matchId, status }
       */
      socket.on('match:status-changed', (data) => {
        const { matchId, status } = data;
        const room = `match:${matchId}`;

        logger.info(`[WebSocket] Match ${matchId} status changed to ${status}`);

        if (matchRooms.has(matchId)) {
          matchRooms.get(matchId)!.status = status;
        }

        io?.to(room).emit('match:status-changed', {
          matchId,
          status,
          timestamp: new Date().toISOString(),
        });
      });

      // ========================================================================
      // NOTIFICATION EVENTS
      // ========================================================================

      /**
       * Send notification to specific user
       * Event: notification:send
       * Payload: { recipientId, type, title, message }
       */
      socket.on('notification:send', (data: Omit<NotificationPayload, 'id' | 'createdAt' | 'read'>) => {
        const notification: NotificationPayload = {
          id: `notif_${Date.now()}_${Math.random()}`,
          ...data,
          createdAt: new Date().toISOString(),
          read: false,
        };

        // Send to recipient's sockets
        const recipientSockets = userSockets.get(data.recipientId);
        if (recipientSockets) {
          recipientSockets.forEach((socketId) => {
            io?.to(socketId).emit('notification:new', notification);
          });
        }

        logger.info(
          `[WebSocket] Notification sent to user ${data.recipientId}: ${data.title}`
        );
      });

      socket.on('notification:read', (notificationId: string) => {
        logger.info(`[WebSocket] Notification ${notificationId} marked as read by user ${userId}`);

        socket.emit('notification:acknowledged', {
          notificationId,
          read: true,
        });
      });

      // ========================================================================
      // PRESENCE EVENTS
      // ========================================================================

      /**
       * User explicitly indicates online status
       * Broadcasts to all connected users
       */
      socket.on('presence:status-update', (data) => {
        io?.emit('presence:user-status', {
          userId,
          status: data.status, // 'online', 'away', 'offline'
          lastSeen: new Date().toISOString(),
        });
      });

      // ========================================================================
      // TEAM COLLABORATION EVENTS
      // ========================================================================

      /**
       * Join team chat/collaboration room
       */
      socket.on('team:join', (teamId: string) => {
        const teamRoom = `team:${teamId}`;
        socket.join(teamRoom);

        logger.info(`[WebSocket] User ${userId} joined team ${teamId}`);

        socket.to(teamRoom).emit('team:user-joined', {
          userId,
          timestamp: new Date().toISOString(),
        });
      });

      /**
       * Send message in team chat
       */
      socket.on('team:message', (data) => {
        const { teamId, message } = data;
        const teamRoom = `team:${teamId}`;

        logger.info(`[WebSocket] Message in team ${teamId} from ${userId}`);

        io?.to(teamRoom).emit('team:message-received', {
          userId,
          message,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('team:leave', (teamId: string) => {
        const teamRoom = `team:${teamId}`;
        socket.leave(teamRoom);

        logger.info(`[WebSocket] User ${userId} left team ${teamId}`);

        socket.to(teamRoom).emit('team:user-left', {
          userId,
          timestamp: new Date().toISOString(),
        });
      });

      // ========================================================================
      // ERROR & DISCONNECT HANDLERS
      // ========================================================================

      socket.on('error', (error) => {
        logger.error(`[WebSocket] Socket error for user ${userId}:`, error);
      });

      socket.on('disconnect', () => {
        logger.info(`[WebSocket] User ${userId} disconnected. Socket ID: ${socket.id}`);

        // Clean up user sockets
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);

          if (userSocketSet.size === 0) {
            userSockets.delete(userId);

            // Notify others that user is offline
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
    logger.error('[WebSocket] Failed to initialize Socket.IO server:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Broadcast message to all connected clients
 */
export function broadcastMessage(event: string, data: any) {
  if (!io) {
    logger.warn('[WebSocket] Attempted broadcast without initialized socket server');
    return;
  }
  io.emit(event, data);
}

/**
 * Send message to specific user's sockets
 */
export function sendToUser(userId: string, event: string, data: any) {
  if (!io) {
    logger.warn('[WebSocket] Attempted send without initialized socket server');
    return;
  }

  const userSocketIds = userSockets.get(userId);
  if (userSocketIds) {
    userSocketIds.forEach((socketId) => {
      io?.to(socketId).emit(event, data);
    });
  }
}

/**
 * Send message to specific room
 */
export function sendToRoom(room: string, event: string, data: any) {
  if (!io) {
    logger.warn('[WebSocket] Attempted send without initialized socket server');
    return;
  }
  io.to(room).emit(event, data);
}

/**
 * Get active users count
 */
export function getActiveUsersCount(): number {
  return userSockets.size;
}

/**
 * Get match room info
 */
export function getMatchRoomInfo(matchId: string): MatchRoom | undefined {
  return matchRooms.get(matchId);
}

/**
 * Get Socket.IO instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}