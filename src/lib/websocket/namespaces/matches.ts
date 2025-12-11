import { Socket } from 'socket.io';
import { getSocket } from '../server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/api/utils/logger';

interface MatchEventPayload {
  matchId: string;
  type: 'GOAL' | 'CARD' | 'SUB' | 'KICKOFF' | 'HALFTIME' | 'FULLTIME';
  playerId?: string;
  minute: number;
  additionalInfo?: string;
}

interface ScoreUpdatePayload {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
}

interface StatusChangePayload {
  matchId: string;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED';
}

export function setupMatchNamespace() {
  const io = getSocket();
  const matchNsp = io.of('/matches');

  matchNsp.on('connection', (socket: Socket) => {
    console.log(`[Matches] User connected: ${socket.data.userId}`);

    // ===== JOIN MATCH ROOM =====
    socket.on('match:join', async (matchId: string) => {
      try {
        // Verify match exists
        const match = await prisma.match.findUnique({
          where: { id: matchId },
        });

        if (!match) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        // Join room for this match
        socket.join(`match:${matchId}`);

        logger.info(`User ${socket.data.userId} joined match ${matchId}`);

        // Send current match state
        socket.emit('match:state', {
          matchId,
          status: match.status,
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join match' });
      }
    });

    // ===== LEAVE MATCH ROOM =====
    socket.on('match:leave', (matchId: string) => {
      socket.leave(`match:${matchId}`);
      logger.info(`User ${socket.data.userId} left match ${matchId}`);
    });

    // ===== MATCH EVENT BROADCAST (from API) =====
    socket.on('match:event:add', async (payload: MatchEventPayload) => {
      try {
        const { matchId, type, playerId, minute, additionalInfo } = payload;

        // Verify user is authorized (referee/official)
        const isOfficial = await prisma.referee.findFirst({
          where: { userId: socket.data.userId },
        });

        if (!isOfficial) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Create event in database
        const event = await prisma.matchEvent.create({
          data: {
            matchId,
            type: type as any,
            playerId,
            minute,
            additionalInfo,
          },
          include: {
            player: {
              select: { firstName: true, lastName: true, shirtNumber: true },
            },
          },
        });

        // Broadcast to all watching this match
        matchNsp.to(`match:${matchId}`).emit('match:event:added', {
          eventId: event.id,
          type,
          playerId,
          playerName: event.player
            ? `${event.player.firstName} ${event.player.lastName}`
            : undefined,
          minute,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Event added to match ${matchId}: ${type}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to add event' });
      }
    });

    // ===== SCORE UPDATE BROADCAST =====
    socket.on('match:score:update', async (payload: ScoreUpdatePayload) => {
      try {
        const { matchId, homeGoals, awayGoals } = payload;

        // Verify authorization
        const isOfficial = await prisma.referee.findFirst({
          where: { userId: socket.data.userId },
        });

        if (!isOfficial) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Update match
        await prisma.match.update({
          where: { id: matchId },
          data: { homeGoals, awayGoals },
        });

        // Broadcast score update
        matchNsp.to(`match:${matchId}`).emit('match:score:updated', {
          matchId,
          homeGoals,
          awayGoals,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Match ${matchId} score updated: ${homeGoals}-${awayGoals}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to update score' });
      }
    });

    // ===== STATUS CHANGE BROADCAST =====
    socket.on('match:status:change', async (payload: StatusChangePayload) => {
      try {
        const { matchId, status } = payload;

        // Verify authorization
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: { fixture: { include: { league: true } } },
        });

        if (!match) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        const isLeagueAdmin = match.fixture?.league.adminId === socket.data.userId;
        const isReferee = match.refereeId === (await prisma.referee.findFirst({
          where: { userId: socket.data.userId },
        }))?.id;

        if (!isLeagueAdmin && !isReferee) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Update match status
        await prisma.match.update({
          where: { id: matchId },
          data: { status },
        });

        // Broadcast status change
        matchNsp.to(`match:${matchId}`).emit('match:status:changed', {
          matchId,
          status,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Match ${matchId} status changed to ${status}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // ===== PLAYER ATTENDANCE UPDATE =====
    socket.on('match:attendance:update', async (payload: any) => {
      try {
        const { matchId, playerId, status } = payload;

        // Verify player or coach
        const player = await prisma.player.findUnique({
          where: { userId: socket.data.userId },
        });

        if (!player || player.id !== playerId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Update attendance
        await prisma.matchAttendance.upsert({
          where: {
            matchId_playerId: {
              matchId,
              playerId,
            },
          },
          create: { matchId, playerId, status },
          update: { status },
        });

        // Broadcast attendance update
        matchNsp.to(`match:${matchId}`).emit('match:attendance:updated', {
          matchId,
          playerId,
          status,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Player ${playerId} attendance updated: ${status}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to update attendance' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.data.userId} disconnected from matches namespace`);
    });
  });
}
