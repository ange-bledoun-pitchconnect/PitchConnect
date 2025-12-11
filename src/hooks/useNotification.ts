'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { MatchEvent, Notification, NotificationType } from '@/types';

// ============================================================================
// NOTIFICATION CONFIGURATION & CONSTANTS
// ============================================================================

interface NotificationConfig {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  dismissible?: boolean;
}

const NOTIFICATION_DEFAULTS: NotificationConfig = {
  duration: 4000,
  position: 'top-right',
  dismissible: true,
};

const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  MATCH_REMINDER: { duration: 5000, position: 'top-center' },
  RESULT_UPDATE: { duration: 6000, position: 'top-center' },
  TEAM_INVITE: { duration: 8000, position: 'top-right' },
  SYSTEM: { duration: 5000, position: 'top-center' },
  PROMOTION: { duration: 7000, position: 'top-center' },
  ACCOUNT: { duration: 5000, position: 'top-right' },
};

// ============================================================================
// MATCH EVENT NOTIFICATION HANDLERS
// ============================================================================

interface MatchEventNotificationOptions {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchMinute?: number;
}

const createGoalNotification = (
  options: MatchEventNotificationOptions,
  event: MatchEvent & { team: 'HOME' | 'AWAY'; player?: { user?: { firstName?: string; lastName?: string } } },
) => {
  const playerName =
    event.player?.user?.firstName && event.player?.user?.lastName
      ? `${event.player.user.firstName} ${event.player.user.lastName}`
      : 'Unknown Player';

  const teamName = event.team === 'HOME' ? options.homeTeam : options.awayTeam;

  toast.success(`⚽ GOAL! ${playerName} (${teamName})`, {
    description: `${event.minute}' - Match: ${options.homeTeam} vs ${options.awayTeam}`,
    duration: 5000,
    icon: '⚽',
  });
};

const createCardNotification = (
  options: MatchEventNotificationOptions,
  event: MatchEvent & { 'color': 'yellow' | 'red'; player?: { user?: { firstName?: string; lastName?: string } } },
) => {
  const playerName =
    event.player?.user?.firstName && event.player?.user?.lastName
      ? `${event.player.user.firstName} ${event.player.user.lastName}`
      : 'Unknown Player';

  const teamName = (event.team as 'HOME' | 'AWAY') === 'HOME' ? options.homeTeam : options.awayTeam;
  const cardEmoji = event.color === 'yellow' ? '🟨' : '🟥';
  const cardText = event.color === 'yellow' ? 'Yellow Card' : 'Red Card';

  toast.warning(`${cardEmoji} ${cardText} - ${playerName} (${teamName})`, {
    description: `${event.minute}' - Match: ${options.homeTeam} vs ${options.awayTeam}`,
    duration: 4000,
  });
};

const createSubstitutionNotification = (
  options: MatchEventNotificationOptions,
  event: MatchEvent & {
    'playerOutId'?: string;
    'playerInId'?: string;
    'playerOut'?: { user?: { firstName?: string; lastName?: string } };
    'playerIn'?: { user?: { firstName?: string; lastName?: string } };
  },
) => {
  const playerOutName =
    event.playerOut?.user?.firstName && event.playerOut?.user?.lastName
      ? `${event.playerOut.user.firstName} ${event.playerOut.user.lastName}`
      : 'Player';

  const playerInName =
    event.playerIn?.user?.firstName && event.playerIn?.user?.lastName
      ? `${event.playerIn.user.firstName} ${event.playerIn.user.lastName}`
      : 'Player';

  const teamName = (event.team as 'HOME' | 'AWAY') === 'HOME' ? options.homeTeam : options.awayTeam;

  toast.info(`🔄 Substitution - ${teamName}`, {
    description: `${playerOutName} → ${playerInName} (${event.minute}')`,
    duration: 4000,
  });
};

const createInjuryNotification = (
  options: MatchEventNotificationOptions,
  event: MatchEvent & { severity?: string; player?: { user?: { firstName?: string; lastName?: string } } },
) => {
  const playerName =
    event.player?.user?.firstName && event.player?.user?.lastName
      ? `${event.player.user.firstName} ${event.player.user.lastName}`
      : 'Unknown Player';

  const teamName = (event.team as 'HOME' | 'AWAY') === 'HOME' ? options.homeTeam : options.awayTeam;

  toast.warning(`🚨 Player Injury - ${playerName} (${teamName})`, {
    description: `${event.minute}' - Severity: ${event.severity || 'Unknown'}`,
    duration: 5000,
  });
};

// ============================================================================
// SYSTEM NOTIFICATION HANDLERS
// ============================================================================

const createMatchStartNotification = (homeTeam: string, awayTeam: string) => {
  toast.info(`🏟️ Match Started`, {
    description: `${homeTeam} vs ${awayTeam} - Match is now LIVE`,
    duration: 4000,
    icon: '🏟️',
  });
};

const createMatchEndNotification = (homeTeam: string, awayTeam: string, homeGoals: number, awayGoals: number) => {
  toast.success(`🏁 Final Whistle`, {
    description: `${homeTeam} ${homeGoals} - ${awayGoals} ${awayTeam}`,
    duration: 6000,
    icon: '🏁',
  });
};

const createPostponedNotification = (homeTeam: string, awayTeam: string, newDate?: string) => {
  const dateInfo = newDate ? ` to ${new Date(newDate).toLocaleDateString()}` : '';
  
  toast.warning(`⏸️ Match Postponed`, {
    description: `${homeTeam} vs ${awayTeam}${dateInfo}`,
    duration: 5000,
  });
};

const createCancelledNotification = (homeTeam: string, awayTeam: string, reason?: string) => {
  toast.error(`❌ Match Cancelled`, {
    description: `${homeTeam} vs ${awayTeam}${reason ? ` - Reason: ${reason}` : ''}`,
    duration: 5000,
  });
};

// ============================================================================
// SYSTEM NOTIFICATION TYPES
// ============================================================================

interface SystemNotificationPayload {
  type: 'MATCH_START' | 'MATCH_END' | 'MATCH_POSTPONED' | 'MATCH_CANCELLED' | 'TEAM_INVITE' | 'ROLE_UPGRADE';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const createSystemNotification = (payload: SystemNotificationPayload) => {
  const config = NOTIFICATION_DEFAULTS;

  switch (payload.type) {
    case 'MATCH_START':
      toast.info(payload.title, {
        description: payload.message,
        duration: config.duration,
        icon: '🏟️',
      });
      break;

    case 'MATCH_END':
      toast.success(payload.title, {
        description: payload.message,
        duration: config.duration,
        icon: '✅',
      });
      break;

    case 'MATCH_POSTPONED':
      toast.warning(payload.title, {
        description: payload.message,
        duration: config.duration,
        icon: '⏸️',
      });
      break;

    case 'MATCH_CANCELLED':
      toast.error(payload.title, {
        description: payload.message,
        duration: config.duration,
        icon: '❌',
      });
      break;

    case 'TEAM_INVITE':
      toast.success(payload.title, {
        description: payload.message,
        duration: config.duration,
        icon: '👥',
        action: payload.actionUrl
          ? { label: 'View', onClick: () => window.location.href = payload.actionUrl! }
          : undefined,
      });
      break;

    case 'ROLE_UPGRADE':
      toast.success(payload.title, {
        description: payload.message,
        duration: config.duration,
        icon: '⬆️',
        action: payload.actionUrl
          ? { label: 'View', onClick: () => window.location.href = payload.actionUrl! }
          : undefined,
      });
      break;

    default:
      toast.info(payload.title, {
        description: payload.message,
        duration: config.duration,
      });
  }
};

// ============================================================================
// REACT HOOK: useNotifications
// ============================================================================

interface UseNotificationsOptions {
  enableMatchEvents?: boolean;
  enableSystemNotifications?: boolean;
  matchId?: string;
  homeTeam?: string;
  awayTeam?: string;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    enableMatchEvents = true,
    enableSystemNotifications = true,
    matchId,
    homeTeam = 'Home Team',
    awayTeam = 'Away Team',
  } = options;

  const eventHandlersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());
  const socketRef = useRef<any>(null);

  // Initialize socket connection (assuming socket is available globally or via context)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try to get socket from window (should be injected by socket provider)
    socketRef.current = (window as any).socket;

    if (!socketRef.current) {
      console.warn('Socket.IO not initialized. Real-time notifications disabled.');
      return;
    }

    // ========================================================================
    // MATCH EVENT LISTENERS
    // ========================================================================

    if (enableMatchEvents && matchId) {
      const handleGoal = (event: any) => {
        createGoalNotification(
          { matchId, homeTeam, awayTeam },
          { ...event, team: event.team as 'HOME' | 'AWAY' },
        );
      };

      const handleCard = (event: any) => {
        createCardNotification(
          { matchId, homeTeam, awayTeam },
          { ...event, team: event.team as 'HOME' | 'AWAY' },
        );
      };

      const handleSubstitution = (event: any) => {
        createSubstitutionNotification(
          { matchId, homeTeam, awayTeam },
          { ...event, team: event.team as 'HOME' | 'AWAY' },
        );
      };

      const handleInjury = (event: any) => {
        createInjuryNotification(
          { matchId, homeTeam, awayTeam },
          { ...event, team: event.team as 'HOME' | 'AWAY' },
        );
      };

      // Register handlers
      socketRef.current.on(`match:${matchId}:goal`, handleGoal);
      socketRef.current.on(`match:${matchId}:card`, handleCard);
      socketRef.current.on(`match:${matchId}:substitution`, handleSubstitution);
      socketRef.current.on(`match:${matchId}:injury`, handleInjury);

      eventHandlersRef.current.set('goal', handleGoal);
      eventHandlersRef.current.set('card', handleCard);
      eventHandlersRef.current.set('substitution', handleSubstitution);
      eventHandlersRef.current.set('injury', handleInjury);
    }

    // ========================================================================
    // SYSTEM NOTIFICATION LISTENERS
    // ========================================================================

    if (enableSystemNotifications) {
      const handleMatchStart = (data: any) => {
        createMatchStartNotification(data.homeTeam, data.awayTeam);
      };

      const handleMatchEnd = (data: any) => {
        createMatchEndNotification(
          data.homeTeam,
          data.awayTeam,
          data.homeGoals,
          data.awayGoals,
        );
      };

      const handleMatchPostponed = (data: any) => {
        createPostponedNotification(data.homeTeam, data.awayTeam, data.newDate);
      };

      const handleMatchCancelled = (data: any) => {
        createCancelledNotification(data.homeTeam, data.awayTeam, data.reason);
      };

      const handleSystemNotification = (payload: SystemNotificationPayload) => {
        createSystemNotification(payload);
      };

      // Register handlers
      socketRef.current.on('match:started', handleMatchStart);
      socketRef.current.on('match:ended', handleMatchEnd);
      socketRef.current.on('match:postponed', handleMatchPostponed);
      socketRef.current.on('match:cancelled', handleMatchCancelled);
      socketRef.current.on('notification:system', handleSystemNotification);

      eventHandlersRef.current.set('match:started', handleMatchStart);
      eventHandlersRef.current.set('match:ended', handleMatchEnd);
      eventHandlersRef.current.set('match:postponed', handleMatchPostponed);
      eventHandlersRef.current.set('match:cancelled', handleMatchCancelled);
      eventHandlersRef.current.set('notification:system', handleSystemNotification);
    }

    // Cleanup on unmount
    return () => {
      eventHandlersRef.current.forEach((handler, event) => {
        socketRef.current?.off(event, handler);
      });
      eventHandlersRef.current.clear();
    };
  }, [enableMatchEvents, enableSystemNotifications, matchId, homeTeam, awayTeam]);

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  const notify = useCallback(
    (
      type: NotificationType,
      title: string,
      message?: string,
      options?: Partial<NotificationConfig>,
    ) => {
      const config = { ...NOTIFICATION_DEFAULTS, ...NOTIFICATION_CONFIGS[type], ...options };

      switch (type) {
        case 'MATCH_REMINDER':
          toast.info(title, {
            description: message,
            duration: config.duration,
            icon: '🏟️',
          });
          break;

        case 'RESULT_UPDATE':
          toast.success(title, {
            description: message,
            duration: config.duration,
            icon: '✅',
          });
          break;

        case 'TEAM_INVITE':
          toast.info(title, {
            description: message,
            duration: config.duration,
            icon: '👥',
          });
          break;

        case 'SYSTEM':
          toast.info(title, {
            description: message,
            duration: config.duration,
            icon: '⚙️',
          });
          break;

        case 'PROMOTION':
          toast.success(title, {
            description: message,
            duration: config.duration,
            icon: '🎉',
          });
          break;

        case 'ACCOUNT':
          toast.info(title, {
            description: message,
            duration: config.duration,
            icon: '👤',
          });
          break;

        default:
          toast.info(title, {
            description: message,
            duration: config.duration,
          });
      }
    },
    [],
  );

  const success = useCallback(
    (title: string, message?: string, options?: Partial<NotificationConfig>) => {
      toast.success(title, {
        description: message,
        duration: options?.duration ?? NOTIFICATION_DEFAULTS.duration,
      });
    },
    [],
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<NotificationConfig>) => {
      toast.error(title, {
        description: message,
        duration: options?.duration ?? NOTIFICATION_DEFAULTS.duration,
      });
    },
    [],
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<NotificationConfig>) => {
      toast.warning(title, {
        description: message,
        duration: options?.duration ?? NOTIFICATION_DEFAULTS.duration,
      });
    },
    [],
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<NotificationConfig>) => {
      toast.info(title, {
        description: message,
        duration: options?.duration ?? NOTIFICATION_DEFAULTS.duration,
      });
    },
    [],
  );

  return {
    notify,
    success,
    error,
    warning,
    info,
    isConnected: !!socketRef.current?.connected,
  };
}

// ============================================================================
// EXPORT NOTIFICATION CREATORS FOR EXTERNAL USE
// ============================================================================

export {
  createGoalNotification,
  createCardNotification,
  createSubstitutionNotification,
  createInjuryNotification,
  createMatchStartNotification,
  createMatchEndNotification,
  createPostponedNotification,
  createCancelledNotification,
  createSystemNotification,
};
