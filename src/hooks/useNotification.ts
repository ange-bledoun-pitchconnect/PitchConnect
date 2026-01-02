/**
 * ============================================================================
 * 🔔 USE NOTIFICATION HOOK v7.10.1 - MULTI-SPORT NOTIFICATIONS
 * ============================================================================
 * 
 * Enterprise notification system with sport-specific event handling.
 * Supports all 12 sports with authentic terminology and icons.
 * 
 * @version 7.10.1
 * @path src/hooks/useNotification.ts
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useSportConfig, Sport, getSportConfig } from './useSportConfig';
import type { MatchStatus } from './useSportConfig';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationType =
  | 'SYSTEM_ALERT' | 'SYSTEM_MAINTENANCE' | 'SYSTEM_UPDATE'
  | 'MATCH_SCHEDULED' | 'MATCH_REMINDER' | 'MATCH_STARTING' | 'MATCH_LIVE'
  | 'MATCH_HALFTIME' | 'MATCH_FULLTIME' | 'MATCH_CANCELLED' | 'MATCH_POSTPONED'
  | 'MATCH_RESULT' | 'MATCH_LINEUP_ANNOUNCED' | 'MATCH_SQUAD_SELECTED'
  | 'TEAM_JOINED' | 'TEAM_LEFT' | 'TEAM_INVITE' | 'TEAM_REMOVED' | 'TEAM_UPDATE' | 'TEAM_ANNOUNCEMENT'
  | 'TRAINING_SCHEDULED' | 'TRAINING_REMINDER' | 'TRAINING_CANCELLED'
  | 'PLAYER_INJURED' | 'PLAYER_RECOVERED' | 'PLAYER_MILESTONE' | 'PLAYER_ACHIEVEMENT'
  | 'PAYMENT_RECEIVED' | 'PAYMENT_DUE' | 'PAYMENT_OVERDUE'
  | 'BADGE_EARNED' | 'ACHIEVEMENT_UNLOCKED' | 'LEVEL_UP' | 'XP_EARNED';

export interface NotificationConfig {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  dismissible?: boolean;
}

export interface MatchEventPayload {
  matchId: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute?: number;
  period?: string;
  eventType: string;
  player?: {
    id: string;
    firstName: string;
    lastName: string;
    number?: number;
  };
  assistPlayer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  team: 'HOME' | 'AWAY';
  metadata?: Record<string, unknown>;
}

interface UseNotificationsOptions {
  enableMatchEvents?: boolean;
  enableSystemNotifications?: boolean;
  matchId?: string;
  sport?: Sport;
  homeTeam?: string;
  awayTeam?: string;
}

// =============================================================================
// SPORT-SPECIFIC NOTIFICATION HANDLERS
// =============================================================================

/**
 * Get scoring notification for any sport
 */
function createScoringNotification(payload: MatchEventPayload): void {
  const config = getSportConfig(payload.sport);
  const playerName = payload.player 
    ? `${payload.player.firstName} ${payload.player.lastName}` 
    : 'Unknown Player';
  const teamName = payload.team === 'HOME' ? payload.homeTeam : payload.awayTeam;
  
  // Get event details from sport config
  const eventType = config.eventTypes.find(e => e.key === payload.eventType);
  const icon = eventType?.icon || config.icon;
  const label = eventType?.label || payload.eventType;
  const points = eventType?.points;
  
  // Build description based on sport
  let description = '';
  if (payload.minute) {
    description += `${payload.minute}' - `;
  }
  description += `${payload.homeTeam} ${payload.homeScore} - ${payload.awayScore} ${payload.awayTeam}`;
  
  // Add assist info if available
  if (payload.assistPlayer) {
    description += ` (Assist: ${payload.assistPlayer.firstName} ${payload.assistPlayer.lastName})`;
  }
  
  // Format title based on points
  const title = points && points > 1 
    ? `${icon} ${label} (${points} pts)! ${playerName}`
    : `${icon} ${label}! ${playerName} (${teamName})`;
  
  toast.success(title, {
    description,
    duration: 6000,
    icon,
  });
}

/**
 * Get disciplinary notification for any sport
 */
function createDisciplinaryNotification(payload: MatchEventPayload): void {
  const config = getSportConfig(payload.sport);
  const playerName = payload.player 
    ? `${payload.player.firstName} ${payload.player.lastName}` 
    : 'Unknown Player';
  const teamName = payload.team === 'HOME' ? payload.homeTeam : payload.awayTeam;
  
  const eventType = config.eventTypes.find(e => e.key === payload.eventType);
  const icon = eventType?.icon || '⚠️';
  const label = eventType?.label || payload.eventType;
  
  const description = payload.minute 
    ? `${payload.minute}' - ${payload.homeTeam} vs ${payload.awayTeam}`
    : `${payload.homeTeam} vs ${payload.awayTeam}`;
  
  toast.warning(`${icon} ${label} - ${playerName} (${teamName})`, {
    description,
    duration: 5000,
  });
}

/**
 * Create substitution notification
 */
function createSubstitutionNotification(
  payload: MatchEventPayload & {
    playerOut?: { firstName: string; lastName: string };
    playerIn?: { firstName: string; lastName: string };
  }
): void {
  const teamName = payload.team === 'HOME' ? payload.homeTeam : payload.awayTeam;
  const playerOutName = payload.playerOut 
    ? `${payload.playerOut.firstName} ${payload.playerOut.lastName}` 
    : 'Player';
  const playerInName = payload.playerIn 
    ? `${payload.playerIn.firstName} ${payload.playerIn.lastName}` 
    : 'Player';
  
  toast.info(`🔄 Substitution - ${teamName}`, {
    description: `${playerOutName} ➡️ ${playerInName} (${payload.minute || '?'}')`,
    duration: 4000,
  });
}

/**
 * Create match status notification
 */
function createMatchStatusNotification(
  status: 'started' | 'halftime' | 'resumed' | 'ended' | 'postponed' | 'cancelled',
  payload: {
    sport: Sport;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    reason?: string;
    newDate?: string;
  }
): void {
  const config = getSportConfig(payload.sport);
  
  switch (status) {
    case 'started':
      toast.info(`🏟️ ${config.terms.match} Started`, {
        description: `${payload.homeTeam} vs ${payload.awayTeam} - Now LIVE`,
        duration: 5000,
        icon: config.icon,
      });
      break;
      
    case 'halftime':
      toast.info(`⏸️ ${config.periods.name} Break`, {
        description: `${payload.homeTeam} ${payload.homeScore ?? 0} - ${payload.awayScore ?? 0} ${payload.awayTeam}`,
        duration: 4000,
      });
      break;
      
    case 'resumed':
      toast.info(`▶️ ${config.terms.match} Resumed`, {
        description: `${payload.homeTeam} vs ${payload.awayTeam}`,
        duration: 4000,
      });
      break;
      
    case 'ended':
      toast.success(`🏁 Full Time`, {
        description: `${payload.homeTeam} ${payload.homeScore ?? 0} - ${payload.awayScore ?? 0} ${payload.awayTeam}`,
        duration: 6000,
      });
      break;
      
    case 'postponed':
      const dateInfo = payload.newDate ? ` to ${new Date(payload.newDate).toLocaleDateString()}` : '';
      toast.warning(`⏸️ ${config.terms.match} Postponed`, {
        description: `${payload.homeTeam} vs ${payload.awayTeam}${dateInfo}`,
        duration: 5000,
      });
      break;
      
    case 'cancelled':
      toast.error(`❌ ${config.terms.match} Cancelled`, {
        description: `${payload.homeTeam} vs ${payload.awayTeam}${payload.reason ? ` - ${payload.reason}` : ''}`,
        duration: 5000,
      });
      break;
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useNotifications({
  enableMatchEvents = true,
  enableSystemNotifications = true,
  matchId,
  sport = 'FOOTBALL',
  homeTeam = 'Home',
  awayTeam = 'Away',
}: UseNotificationsOptions = {}) {
  const socketRef = useRef<any>(null);
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  // Get sport config
  const sportConfig = getSportConfig(sport);

  // ==========================================================================
  // SOCKET CONNECTION
  // ==========================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    socketRef.current = (window as any).socket;

    if (!socketRef.current) {
      console.warn('Socket.IO not initialized. Real-time notifications disabled.');
      return;
    }

    // Match event listeners
    if (enableMatchEvents && matchId) {
      const handleScoringEvent = (event: MatchEventPayload) => {
        createScoringNotification({ ...event, sport, homeTeam, awayTeam });
      };

      const handleDisciplinaryEvent = (event: MatchEventPayload) => {
        createDisciplinaryNotification({ ...event, sport, homeTeam, awayTeam });
      };

      const handleSubstitution = (event: any) => {
        createSubstitutionNotification({ ...event, sport, homeTeam, awayTeam });
      };

      // Register for all scoring events
      sportConfig.scoringEvents.forEach(eventType => {
        const handler = (data: any) => handleScoringEvent({ ...data, eventType });
        socketRef.current.on(`match:${matchId}:${eventType.toLowerCase()}`, handler);
        eventHandlersRef.current.set(`match:${matchId}:${eventType.toLowerCase()}`, handler);
      });

      // Register for all disciplinary events
      sportConfig.disciplinaryEvents.forEach(eventType => {
        const handler = (data: any) => handleDisciplinaryEvent({ ...data, eventType });
        socketRef.current.on(`match:${matchId}:${eventType.toLowerCase()}`, handler);
        eventHandlersRef.current.set(`match:${matchId}:${eventType.toLowerCase()}`, handler);
      });

      // Register for substitution
      socketRef.current.on(`match:${matchId}:substitution`, handleSubstitution);
      eventHandlersRef.current.set(`match:${matchId}:substitution`, handleSubstitution);
    }

    // System notification listeners
    if (enableSystemNotifications) {
      const handleMatchStart = (data: any) => {
        createMatchStatusNotification('started', { ...data, sport });
      };

      const handleMatchEnd = (data: any) => {
        createMatchStatusNotification('ended', { ...data, sport });
      };

      const handleMatchPostponed = (data: any) => {
        createMatchStatusNotification('postponed', { ...data, sport });
      };

      const handleMatchCancelled = (data: any) => {
        createMatchStatusNotification('cancelled', { ...data, sport });
      };

      socketRef.current.on('match:started', handleMatchStart);
      socketRef.current.on('match:ended', handleMatchEnd);
      socketRef.current.on('match:postponed', handleMatchPostponed);
      socketRef.current.on('match:cancelled', handleMatchCancelled);

      eventHandlersRef.current.set('match:started', handleMatchStart);
      eventHandlersRef.current.set('match:ended', handleMatchEnd);
      eventHandlersRef.current.set('match:postponed', handleMatchPostponed);
      eventHandlersRef.current.set('match:cancelled', handleMatchCancelled);
    }

    // Cleanup
    return () => {
      eventHandlersRef.current.forEach((handler, event) => {
        socketRef.current?.off(event, handler);
      });
      eventHandlersRef.current.clear();
    };
  }, [enableMatchEvents, enableSystemNotifications, matchId, sport, homeTeam, awayTeam, sportConfig]);

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  const notify = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    options?: NotificationConfig
  ) => {
    const duration = options?.duration ?? 5000;

    switch (type) {
      case 'MATCH_REMINDER':
      case 'MATCH_STARTING':
      case 'MATCH_SCHEDULED':
        toast.info(title, { description: message, duration, icon: sportConfig.icon });
        break;

      case 'MATCH_FULLTIME':
      case 'MATCH_RESULT':
      case 'PLAYER_MILESTONE':
      case 'PLAYER_ACHIEVEMENT':
      case 'BADGE_EARNED':
      case 'ACHIEVEMENT_UNLOCKED':
      case 'LEVEL_UP':
        toast.success(title, { description: message, duration, icon: '🎉' });
        break;

      case 'MATCH_CANCELLED':
      case 'MATCH_POSTPONED':
      case 'PLAYER_INJURED':
      case 'PAYMENT_OVERDUE':
        toast.warning(title, { description: message, duration, icon: '⚠️' });
        break;

      case 'SYSTEM_ALERT':
      case 'SYSTEM_MAINTENANCE':
        toast.error(title, { description: message, duration, icon: '🚨' });
        break;

      case 'TEAM_JOINED':
      case 'TEAM_INVITE':
        toast.success(title, { description: message, duration, icon: '👥' });
        break;

      case 'TRAINING_SCHEDULED':
      case 'TRAINING_REMINDER':
        toast.info(title, { description: message, duration, icon: '🏃' });
        break;

      case 'PAYMENT_RECEIVED':
        toast.success(title, { description: message, duration, icon: '💰' });
        break;

      case 'XP_EARNED':
        toast.success(title, { description: message, duration, icon: '⭐' });
        break;

      default:
        toast.info(title, { description: message, duration });
    }
  }, [sportConfig]);

  const success = useCallback((title: string, message?: string, options?: NotificationConfig) => {
    toast.success(title, {
      description: message,
      duration: options?.duration ?? 4000,
    });
  }, []);

  const error = useCallback((title: string, message?: string, options?: NotificationConfig) => {
    toast.error(title, {
      description: message,
      duration: options?.duration ?? 5000,
    });
  }, []);

  const warning = useCallback((title: string, message?: string, options?: NotificationConfig) => {
    toast.warning(title, {
      description: message,
      duration: options?.duration ?? 4000,
    });
  }, []);

  const info = useCallback((title: string, message?: string, options?: NotificationConfig) => {
    toast.info(title, {
      description: message,
      duration: options?.duration ?? 4000,
    });
  }, []);

  const loading = useCallback((title: string, message?: string) => {
    return toast.loading(title, { description: message });
  }, []);

  const dismiss = useCallback((toastId?: string | number) => {
    toast.dismiss(toastId);
  }, []);

  const promise = useCallback(<T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  }, []);

  return {
    notify,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
    isConnected: !!socketRef.current?.connected,
    sportConfig,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { createScoringNotification, createDisciplinaryNotification, createSubstitutionNotification, createMatchStatusNotification };
export default useNotifications;
