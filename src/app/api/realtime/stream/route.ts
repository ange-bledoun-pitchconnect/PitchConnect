// =============================================================================
// 📡 REAL-TIME SSE API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/realtime/stream - Server-Sent Events stream for real-time updates
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Features: Live matches, notifications, team updates, training alerts
// =============================================================================

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sport } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type EventType =
  | 'connection'
  | 'heartbeat'
  | 'match_update'
  | 'match_goal'
  | 'match_card'
  | 'match_substitution'
  | 'match_status'
  | 'notification'
  | 'team_update'
  | 'training_reminder'
  | 'lineup_published'
  | 'achievement_unlocked'
  | 'chat_message';

interface SSEMessage {
  id: string;
  type: EventType;
  timestamp: string;
  data: Record<string, unknown>;
}

interface SubscriptionFilters {
  matchIds?: string[];
  teamIds?: string[];
  clubIds?: string[];
  sports?: Sport[];
  channels?: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
const MAX_CONNECTION_DURATION_MS = 3600000; // 1 hour

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function formatSSEMessage(message: SSEMessage): string {
  return `id: ${message.id}\nevent: ${message.type}\ndata: ${JSON.stringify(message.data)}\n\n`;
}

function parseSubscriptionFilters(searchParams: URLSearchParams): SubscriptionFilters {
  const filters: SubscriptionFilters = {};

  const matchIds = searchParams.get('matchIds');
  if (matchIds) {
    filters.matchIds = matchIds.split(',').filter(Boolean);
  }

  const teamIds = searchParams.get('teamIds');
  if (teamIds) {
    filters.teamIds = teamIds.split(',').filter(Boolean);
  }

  const clubIds = searchParams.get('clubIds');
  if (clubIds) {
    filters.clubIds = clubIds.split(',').filter(Boolean);
  }

  const sports = searchParams.get('sports');
  if (sports) {
    filters.sports = sports.split(',').filter(s => 
      Object.values(Sport).includes(s as Sport)
    ) as Sport[];
  }

  const channels = searchParams.get('channels');
  if (channels) {
    filters.channels = channels.split(',').filter(Boolean);
  }

  return filters;
}

/**
 * Get user's subscribed entities based on their memberships
 */
async function getUserSubscriptions(userId: string): Promise<{
  teamIds: string[];
  clubIds: string[];
  playerIds: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      player: {
        select: {
          id: true,
          teamPlayers: {
            where: { isActive: true },
            select: {
              teamId: true,
              team: { select: { clubId: true } },
            },
          },
        },
      },
      coach: {
        select: {
          teamAssignments: {
            where: { isActive: true },
            select: {
              teamId: true,
              team: { select: { clubId: true } },
            },
          },
        },
      },
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true },
      },
      parent: {
        select: {
          parentPortalAccess: {
            where: { isActive: true },
            select: { playerId: true },
          },
        },
      },
    },
  });

  const teamIds = new Set<string>();
  const clubIds = new Set<string>();
  const playerIds = new Set<string>();

  // From player profile
  if (user?.player) {
    playerIds.add(user.player.id);
    user.player.teamPlayers.forEach(tp => {
      teamIds.add(tp.teamId);
      clubIds.add(tp.team.clubId);
    });
  }

  // From coach profile
  if (user?.coach) {
    user.coach.teamAssignments.forEach(ta => {
      teamIds.add(ta.teamId);
      clubIds.add(ta.team.clubId);
    });
  }

  // From club memberships
  user?.clubMembers.forEach(cm => {
    clubIds.add(cm.clubId);
  });

  // From parent profile (watching children)
  if (user?.parent) {
    user.parent.parentPortalAccess.forEach(ppa => {
      playerIds.add(ppa.playerId);
    });
  }

  return {
    teamIds: Array.from(teamIds),
    clubIds: Array.from(clubIds),
    playerIds: Array.from(playerIds),
  };
}

/**
 * Check if an event should be sent to a user based on their subscriptions
 */
function shouldSendEvent(
  event: SSEMessage,
  userSubs: { teamIds: string[]; clubIds: string[]; playerIds: string[] },
  filters: SubscriptionFilters
): boolean {
  const eventData = event.data;

  // Match events
  if (event.type.startsWith('match_')) {
    const matchTeamIds = [eventData.homeTeamId, eventData.awayTeamId] as string[];
    const matchClubId = eventData.clubId as string;

    // Check explicit filters first
    if (filters.matchIds?.length) {
      return filters.matchIds.includes(eventData.matchId as string);
    }

    // Check team/club membership
    if (matchTeamIds.some(id => userSubs.teamIds.includes(id))) {
      return true;
    }
    if (matchClubId && userSubs.clubIds.includes(matchClubId)) {
      return true;
    }

    return false;
  }

  // Team events
  if (event.type === 'team_update' || event.type === 'lineup_published') {
    const teamId = eventData.teamId as string;
    if (filters.teamIds?.length) {
      return filters.teamIds.includes(teamId);
    }
    return userSubs.teamIds.includes(teamId);
  }

  // Training events
  if (event.type === 'training_reminder') {
    const teamId = eventData.teamId as string;
    return userSubs.teamIds.includes(teamId);
  }

  // Notifications - always send if targeted to user
  if (event.type === 'notification') {
    return true; // Personal notifications are already filtered server-side
  }

  // Achievement events - check if for a player the user is watching
  if (event.type === 'achievement_unlocked') {
    const playerId = eventData.playerId as string;
    return userSubs.playerIds.includes(playerId);
  }

  return false;
}

// =============================================================================
// EVENT SIMULATION (Replace with real event sources in production)
// =============================================================================

/**
 * In production, this would connect to:
 * - Redis pub/sub for distributed events
 * - Database change streams
 * - External match data feeds
 * - Push notification queue
 */
async function* generateEvents(
  userId: string,
  userSubs: { teamIds: string[]; clubIds: string[]; playerIds: string[] },
  filters: SubscriptionFilters,
  signal: AbortSignal
): AsyncGenerator<SSEMessage> {
  const startTime = Date.now();
  let lastHeartbeat = Date.now();

  while (!signal.aborted) {
    // Check connection duration
    if (Date.now() - startTime > MAX_CONNECTION_DURATION_MS) {
      yield {
        id: generateEventId(),
        type: 'connection',
        timestamp: new Date().toISOString(),
        data: {
          status: 'expired',
          message: 'Connection expired. Please reconnect.',
        },
      };
      break;
    }

    // Send heartbeat
    if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
      yield {
        id: generateEventId(),
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        data: {
          serverTime: new Date().toISOString(),
          connectionDuration: Math.round((Date.now() - startTime) / 1000),
        },
      };
      lastHeartbeat = Date.now();
    }

    // Poll for new notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const notif of notifications) {
      yield {
        id: generateEventId(),
        type: 'notification',
        timestamp: new Date().toISOString(),
        data: {
          notificationId: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          actionUrl: notif.actionUrl,
          priority: notif.priority,
        },
      };
    }

    // Poll for live match updates (if user has team subscriptions)
    if (userSubs.teamIds.length > 0 || filters.matchIds?.length) {
      const liveMatches = await prisma.match.findMany({
        where: {
          status: 'LIVE',
          OR: [
            { homeTeamId: { in: userSubs.teamIds } },
            { awayTeamId: { in: userSubs.teamIds } },
            ...(filters.matchIds?.length ? [{ id: { in: filters.matchIds } }] : []),
          ],
        },
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          status: true,
          currentPeriod: true,
          matchTime: true,
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
      });

      for (const match of liveMatches) {
        yield {
          id: generateEventId(),
          type: 'match_update',
          timestamp: new Date().toISOString(),
          data: {
            matchId: match.id,
            homeTeamId: match.homeTeam.id,
            homeTeamName: match.homeTeam.name,
            awayTeamId: match.awayTeam.id,
            awayTeamName: match.awayTeam.name,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            status: match.status,
            period: match.currentPeriod,
            matchTime: match.matchTime,
          },
        };
      }
    }

    // Wait before next poll cycle
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// =============================================================================
// GET HANDLER - SSE Stream
// =============================================================================

/**
 * GET /api/realtime/stream
 *
 * Establish Server-Sent Events connection for real-time updates
 *
 * Query Parameters:
 *   - matchIds: Comma-separated match IDs to watch
 *   - teamIds: Comma-separated team IDs to watch
 *   - clubIds: Comma-separated club IDs to watch
 *   - sports: Comma-separated sports to filter
 *   - channels: Comma-separated channel names (matches, notifications, teams, training)
 *
 * Response: text/event-stream
 *
 * Events:
 *   - connection: Connection status
 *   - heartbeat: Keep-alive ping
 *   - match_update: Live match score/status
 *   - match_goal: Goal scored
 *   - match_card: Yellow/red card
 *   - match_substitution: Player substitution
 *   - match_status: Match status change
 *   - notification: Personal notification
 *   - team_update: Team roster/info change
 *   - training_reminder: Upcoming training
 *   - lineup_published: Match lineup announced
 *   - achievement_unlocked: Achievement earned
 */
export async function GET(request: NextRequest): Promise<Response> {
  const requestId = `sse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = session.user.id;

    // 2. Parse subscription filters
    const { searchParams } = new URL(request.url);
    const filters = parseSubscriptionFilters(searchParams);

    // 3. Get user's default subscriptions
    const userSubs = await getUserSubscriptions(userId);

    console.log(`[${requestId}] SSE connection established`, {
      userId,
      teams: userSubs.teamIds.length,
      clubs: userSubs.clubIds.length,
      filters,
    });

    // 4. Create abort controller for cleanup
    const abortController = new AbortController();

    // 5. Create readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send connection established event
        const connectionEvent: SSEMessage = {
          id: generateEventId(),
          type: 'connection',
          timestamp: new Date().toISOString(),
          data: {
            status: 'connected',
            userId,
            subscribedTeams: userSubs.teamIds.length,
            subscribedClubs: userSubs.clubIds.length,
            maxDuration: MAX_CONNECTION_DURATION_MS,
            heartbeatInterval: HEARTBEAT_INTERVAL_MS,
          },
        };
        controller.enqueue(encoder.encode(formatSSEMessage(connectionEvent)));

        // Stream events
        try {
          for await (const event of generateEvents(
            userId,
            userSubs,
            filters,
            abortController.signal
          )) {
            if (abortController.signal.aborted) break;
            controller.enqueue(encoder.encode(formatSSEMessage(event)));
          }
        } catch (error) {
          console.error(`[${requestId}] SSE stream error:`, error);
        } finally {
          controller.close();
        }
      },
      cancel() {
        abortController.abort();
        console.log(`[${requestId}] SSE connection closed by client`);
      },
    });

    // 6. Return SSE response
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Request-ID': requestId,
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error(`[${requestId}] SSE initialization error:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to establish SSE connection' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Required for streaming