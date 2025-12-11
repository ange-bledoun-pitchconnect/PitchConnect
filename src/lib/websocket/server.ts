import { Server as SocketServer } from 'socket.io';
import { createRedisAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { NextApiRequest } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Redis clients for Socket.io adapter
const pubClient = createClient({
  url: process.env.REDIS_URL,
});

const subClient = pubClient.duplicate();

let io: SocketServer | null = null;

export async function initializeSocket(httpServer: any): Promise<SocketServer> {
  if (io) return io;

  // Connect Redis clients
  await Promise.all([pubClient.connect(), subClient.connect()]);

  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    adapter: createRedisAdapter(pubClient, subClient),
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return next(new Error('Authentication error'));
    }

    socket.data.userId = session.user.id;
    socket.data.email = session.user.email;
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.data.userId}`);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}

export function getSocket(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
