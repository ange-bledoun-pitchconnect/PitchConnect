import { Socket } from 'socket.io';
import { getSocket } from '../server';
import { prisma } from '@/lib/prisma';

export function setupTeamsNamespace() {
  const io = getSocket();
  const teamNsp = io.of('/teams');

  teamNsp.on('connection', (socket: Socket) => {
    console.log(`[Teams] User connected: ${socket.data.userId}`);

    // ===== JOIN TEAM ROOM =====
    socket.on('team:join', async (teamId: string) => {
      try {
        // Verify user is member of team
        const member = await prisma.teamMember.findFirst({
          where: {
            teamId,
            userId: socket.data.userId,
          },
        });

        if (!member) {
          socket.emit('error', { message: 'Not a team member' });
          return;
        }

        socket.join(`team:${teamId}`);

        // Notify team members
        teamNsp.to(`team:${teamId}`).emit('team:member:online', {
          teamId,
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join team' });
      }
    });

    // ===== TEAM MESSAGE =====
    socket.on('team:message', async (payload: any) => {
      const { teamId, content } = payload;

      // Create message in database
      const message = await prisma.message.create({
        data: {
          teamId,
          senderId: socket.data.userId,
          content,
        },
      });

      // Broadcast to team
      teamNsp.to(`team:${teamId}`).emit('team:message', {
        messageId: message.id,
        teamId,
        userId: socket.data.userId,
        content,
        timestamp: new Date().toISOString(),
      });
    });

    // ===== TRAINING SESSION UPDATE =====
    socket.on('team:training:update', async (payload: any) => {
      const { teamId, sessionData } = payload;

      // Broadcast training update
      teamNsp.to(`team:${teamId}`).emit('team:training:updated', {
        teamId,
        ...sessionData,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Teams] User disconnected: ${socket.data.userId}`);
    });
  });
}
