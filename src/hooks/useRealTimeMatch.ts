/**
 * ============================================================================
 * 🔄 USE REAL-TIME MATCH HOOK v7.10.1 - MULTI-SPORT LIVE UPDATES
 * ============================================================================
 * 
 * WebSocket-based live match updates with sport-aware period handling.
 * Supports all 12 sports with automatic polling fallback.
 * 
 * @version 7.10.1
 * @path src/hooks/useRealTimeMatch.ts
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { z } from 'zod';
import { Sport, MatchStatus, getSportConfig, SportConfig } from './useSportConfig';

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

const MatchEventSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  eventType: z.string(),
  minute: z.number().optional(),
  second: z.number().optional(),
  period: z.number().optional(),
  teamSide: z.enum(['home', 'away']),
  playerId: z.string().optional(),
  player: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    number: z.number().optional(),
  }).optional(),
  assistPlayerId: z.string().optional(),
  assistPlayer: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});

export type MatchEvent = z.infer<typeof MatchEventSchema>;

const TeamStatsSchema = z.object({
  possession: z.number().default(0),
  shots: z.number().default(0),
  shotsOnTarget: z.number().default(0),
  corners: z.number().default(0),
  fouls: z.number().default(0),
  yellowCards: z.number().default(0),
  redCards: z.number().default(0),
  offsides: z.number().default(0),
  passes: z.number().default(0),
  passAccuracy: z.number().default(0),
});

export type TeamStats = z.infer<typeof TeamStatsSchema>;

// =============================================================================
// TYPES
// =============================================================================

export interface Match {
  id: string;
  sport: Sport;
  status: MatchStatus;
  homeClubId: string;
  awayClubId: string;
  homeClubName: string;
  awayClubName: string;
  homeScore: number;
  awayScore: number;
  homeScoreDetail?: Record<string, number>; // For AFL: { goals: 5, behinds: 3 }
  awayScoreDetail?: Record<string, number>;
  kickOffTime?: string;
  venue?: string;
  currentPeriod: number;
  currentMinute: number;
  injuryTime: number;
  attendance?: number;
}

export interface LiveMatchStats {
  home: TeamStats;
  away: TeamStats;
}

export interface PlayerMatchPerformance {
  playerId: string;
  playerName: string;
  position: string;
  minutesPlayed: number;
  rating: number;
  events: MatchEvent[];
  stats: Record<string, number>;
}

export interface UseRealTimeMatchOptions {
  matchId: string;
  sport?: Sport;
  enabled?: boolean;
  pollingInterval?: number;
  enableWebSocket?: boolean;
  onEvent?: (event: MatchEvent) => void;
  onStatusChange?: (status: MatchStatus) => void;
  onScoreChange?: (homeScore: number, awayScore: number) => void;
  onError?: (error: Error) => void;
}

export interface UseRealTimeMatchReturn {
  match: Match | null;
  events: MatchEvent[];
  performances: PlayerMatchPerformance[];
  stats: LiveMatchStats;
  sportConfig: SportConfig;
  
  // Live state
  isLive: boolean;
  isFinished: boolean;
  currentMinute: number;
  currentPeriod: number;
  periodName: string;
  injuryTime: number;
  
  // Connection state
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'polling';
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => Promise<void>;
  addEvent: (event: Partial<MatchEvent>) => void;
  updateScore: (homeScore: number, awayScore: number) => void;
  updateStatus: (status: MatchStatus) => void;
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
}

// =============================================================================
// SOCKET MANAGER (Singleton)
// =============================================================================

interface SocketMessage {
  type: 'event' | 'score' | 'status' | 'stats' | 'sync' | 'period';
  matchId: string;
  data: unknown;
  timestamp: string;
}

class SocketManager {
  private static instance: SocketManager;
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<(message: SocketMessage) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(url: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onclose = () => {
          this.isConnecting = false;
          this.handleReconnect(url);
        };

        this.socket.onerror = (error) => {
          this.isConnecting = false;
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SocketMessage;
            this.notifyListeners(message.matchId, message);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(url).catch(() => {});
    }, delay);
  }

  subscribe(matchId: string, callback: (message: SocketMessage) => void): () => void {
    if (!this.listeners.has(matchId)) {
      this.listeners.set(matchId, new Set());
    }

    this.listeners.get(matchId)!.add(callback);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'subscribe', matchId }));
    }

    return () => {
      const callbacks = this.listeners.get(matchId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(matchId);
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'unsubscribe', matchId }));
          }
        }
      }
    };
  }

  private notifyListeners(matchId: string, message: SocketMessage): void {
    const callbacks = this.listeners.get(matchId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message));
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export function getSocketManager(): SocketManager {
  return SocketManager.getInstance();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createEmptyStats(): LiveMatchStats {
  const emptyTeamStats: TeamStats = {
    possession: 0,
    shots: 0,
    shotsOnTarget: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    offsides: 0,
    passes: 0,
    passAccuracy: 0,
  };

  return {
    home: { ...emptyTeamStats },
    away: { ...emptyTeamStats },
  };
}

function calculateMinute(match: Match, sportConfig: SportConfig, now: Date): number {
  if (!match.kickOffTime) return match.currentMinute || 0;

  const kickOff = new Date(match.kickOffTime);
  const elapsed = Math.floor((now.getTime() - kickOff.getTime()) / 60000);
  const periodDuration = sportConfig.periods.durationMinutes;
  const periodCount = sportConfig.periods.count;

  // Handle different period structures
  if (match.status === 'HALFTIME') {
    return periodDuration; // End of first period
  }

  if (match.status === 'SECOND_HALF') {
    // For 2-period sports
    return Math.min(periodDuration * 2, periodDuration + Math.max(0, elapsed - periodDuration - 15));
  }

  if (match.status === 'LIVE') {
    return Math.min(periodDuration, Math.max(0, elapsed));
  }

  return match.currentMinute || 0;
}

function getPeriodName(status: MatchStatus, period: number, sportConfig: SportConfig): string {
  const { name, count } = sportConfig.periods;

  switch (status) {
    case 'WARMUP':
      return 'Warm Up';
    case 'HALFTIME':
      return count === 2 ? 'Half Time' : `${name} Break`;
    case 'FINISHED':
      return 'Full Time';
    case 'LIVE':
    case 'SECOND_HALF':
    case 'EXTRA_TIME_FIRST':
    case 'EXTRA_TIME_SECOND':
      if (count === 2) {
        return status === 'LIVE' ? '1st Half' : status === 'SECOND_HALF' ? '2nd Half' : 'Extra Time';
      } else {
        const suffix = ['st', 'nd', 'rd', 'th'][Math.min(period - 1, 3)];
        return `${period}${suffix} ${name}`;
      }
    case 'PENALTIES':
      return sportConfig.periods.shootoutName || 'Penalties';
    default:
      return status;
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useRealTimeMatch(options: UseRealTimeMatchOptions): UseRealTimeMatchReturn {
  const {
    matchId,
    sport = 'FOOTBALL',
    enabled = true,
    pollingInterval = 30000,
    enableWebSocket = true,
    onEvent,
    onStatusChange,
    onScoreChange,
    onError,
  } = options;

  // State
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [performances, setPerformances] = useState<PlayerMatchPerformance[]>([]);
  const [stats, setStats] = useState<LiveMatchStats>(createEmptyStats());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'polling'>('disconnected');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentMinute, setCurrentMinute] = useState(0);

  // Refs
  const pollingRef = useRef<NodeJS.Timeout>();
  const minuteRef = useRef<NodeJS.Timeout>();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Sport config
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);

  // Derived state
  const isLive = useMemo(() => {
    return sportConfig.liveStatuses.includes(match?.status as MatchStatus);
  }, [match?.status, sportConfig]);

  const isFinished = useMemo(() => {
    return sportConfig.finishedStatuses.includes(match?.status as MatchStatus);
  }, [match?.status, sportConfig]);

  const currentPeriod = match?.currentPeriod || 1;
  const injuryTime = match?.injuryTime || 0;

  const periodName = useMemo(() => {
    return getPeriodName(match?.status as MatchStatus, currentPeriod, sportConfig);
  }, [match?.status, currentPeriod, sportConfig]);

  // Fetch match data
  const refresh = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      const data = await response.json();

      setMatch(data.match);
      setEvents(data.events || []);
      setStats(data.stats || createEmptyStats());
      setPerformances(data.performances || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, onError]);

  // Add event
  const addEvent = useCallback((eventData: Partial<MatchEvent>): void => {
    const newEvent: MatchEvent = {
      id: `temp-${Date.now()}`,
      matchId,
      eventType: eventData.eventType || 'UNKNOWN',
      teamSide: eventData.teamSide || 'home',
      createdAt: new Date().toISOString(),
      ...eventData,
    } as MatchEvent;

    setEvents((prev) => [newEvent, ...prev]);
    onEvent?.(newEvent);

    // Update score for scoring events
    if (sportConfig.scoringEvents.includes(eventData.eventType || '')) {
      const points = sportConfig.eventTypes.find(e => e.key === eventData.eventType)?.points || 1;
      setMatch((prev) => {
        if (!prev) return prev;
        const newHomeScore = eventData.teamSide === 'home' ? prev.homeScore + points : prev.homeScore;
        const newAwayScore = eventData.teamSide === 'away' ? prev.awayScore + points : prev.awayScore;
        onScoreChange?.(newHomeScore, newAwayScore);
        return { ...prev, homeScore: newHomeScore, awayScore: newAwayScore };
      });
    }

    // Update cards in stats
    if (sportConfig.disciplinaryEvents.includes(eventData.eventType || '')) {
      setStats((prev) => {
        const side = eventData.teamSide === 'home' ? 'home' : 'away';
        const isYellow = eventData.eventType?.includes('YELLOW');
        const isRed = eventData.eventType?.includes('RED') || eventData.eventType === 'SECOND_YELLOW';
        return {
          ...prev,
          [side]: {
            ...prev[side],
            yellowCards: prev[side].yellowCards + (isYellow ? 1 : 0),
            redCards: prev[side].redCards + (isRed ? 1 : 0),
          },
        };
      });
    }
  }, [matchId, onEvent, onScoreChange, sportConfig]);

  // Update score
  const updateScore = useCallback((homeScore: number, awayScore: number): void => {
    setMatch((prev) => prev ? { ...prev, homeScore, awayScore } : prev);
    onScoreChange?.(homeScore, awayScore);
  }, [onScoreChange]);

  // Update status
  const updateStatus = useCallback((status: MatchStatus): void => {
    setMatch((prev) => prev ? { ...prev, status } : prev);
    onStatusChange?.(status);
  }, [onStatusChange]);

  // Handle WebSocket message
  const handleSocketMessage = useCallback((message: SocketMessage): void => {
    switch (message.type) {
      case 'event':
        addEvent(message.data as MatchEvent);
        break;
      case 'score':
        const { homeScore, awayScore } = message.data as { homeScore: number; awayScore: number };
        updateScore(homeScore, awayScore);
        break;
      case 'status':
        const { status } = message.data as { status: MatchStatus };
        updateStatus(status);
        break;
      case 'stats':
        setStats(message.data as LiveMatchStats);
        break;
      case 'sync':
        refresh();
        break;
    }
    setLastUpdated(new Date());
  }, [addEvent, updateScore, updateStatus, refresh]);

  // WebSocket setup
  useEffect(() => {
    if (!enabled || !enableWebSocket) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `wss://${typeof window !== 'undefined' ? window.location.host : ''}/api/ws`;
    const socketManager = getSocketManager();

    setConnectionStatus('connecting');

    socketManager
      .connect(wsUrl)
      .then(() => {
        setConnectionStatus('connected');
        unsubscribeRef.current = socketManager.subscribe(matchId, handleSocketMessage);
      })
      .catch(() => {
        setConnectionStatus('polling');
      });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [matchId, enabled, enableWebSocket, handleSocketMessage]);

  // Polling fallback
  useEffect(() => {
    if (!enabled) return;
    if (connectionStatus === 'connected') return;

    setConnectionStatus('polling');
    refresh();

    pollingRef.current = setInterval(() => {
      if (isLive) {
        refresh();
      }
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enabled, connectionStatus, isLive, pollingInterval, refresh]);

  // Minute counter
  useEffect(() => {
    if (!isLive || !match) return;

    const updateMinute = () => {
      const minute = calculateMinute(match, sportConfig, new Date());
      setCurrentMinute(minute);
    };

    updateMinute();
    minuteRef.current = setInterval(updateMinute, 1000);

    return () => {
      if (minuteRef.current) {
        clearInterval(minuteRef.current);
      }
    };
  }, [isLive, match, sportConfig]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    match,
    events,
    performances,
    stats,
    sportConfig,
    isLive,
    isFinished,
    currentMinute,
    currentPeriod,
    periodName,
    injuryTime,
    connectionStatus,
    lastUpdated,
    refresh,
    addEvent,
    updateScore,
    updateStatus,
    isLoading,
    error,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

/**
 * Hook for match timeline
 */
export function useMatchTimeline(matchId: string, sport: Sport = 'FOOTBALL', enabled = true) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);

  useEffect(() => {
    if (!enabled) return;

    const fetchTimeline = async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}/events?limit=100`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [matchId, enabled]);

  return { events, isLoading, sportConfig };
}

/**
 * Hook for match stats
 */
export function useMatchStats(matchId: string, sport: Sport = 'FOOTBALL', enabled = true) {
  const [stats, setStats] = useState<LiveMatchStats>(createEmptyStats());
  const [isLoading, setIsLoading] = useState(true);
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);

  useEffect(() => {
    if (!enabled) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || createEmptyStats());
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [matchId, enabled]);

  return { stats, isLoading, sportConfig };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useRealTimeMatch;
