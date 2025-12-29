// ============================================================================
// 🔄 USE REAL-TIME MATCH HOOK v7.4.0
// ============================================================================
// WebSocket-based live match updates with automatic polling fallback
// ============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  Match, 
  MatchEvent, 
  LiveMatchState, 
  LiveMatchStats, 
  TeamStats,
  PlayerMatchPerformance,
} from '@/types/match';
import type { MatchStatus } from '@prisma/client';
import { LIVE_STATUSES } from '@/types/match';

// ============================================================================
// TYPES
// ============================================================================

export interface UseRealTimeMatchOptions {
  matchId: string;
  enabled?: boolean;
  pollingInterval?: number;
  enableWebSocket?: boolean;
  onEvent?: (event: MatchEvent) => void;
  onStatusChange?: (status: MatchStatus) => void;
  onScoreChange?: (homeScore: number, awayScore: number) => void;
  onError?: (error: Error) => void;
}

export interface UseRealTimeMatchReturn {
  // Match data
  match: Match | null;
  events: MatchEvent[];
  performances: PlayerMatchPerformance[];
  stats: LiveMatchStats;
  
  // Live state
  liveState: LiveMatchState | null;
  isLive: boolean;
  isFinished: boolean;
  currentMinute: number;
  currentPeriod: string;
  injuryTime: number;
  
  // Connection state
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'polling';
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => Promise<void>;
  addEvent: (event: MatchEvent) => void;
  updateScore: (homeScore: number, awayScore: number) => void;
  updateStatus: (status: MatchStatus) => void;
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// SOCKET MANAGER (Singleton)
// ============================================================================

interface SocketMessage {
  type: 'event' | 'score' | 'status' | 'stats' | 'sync';
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
    
    // Send subscription message
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        matchId,
      }));
    }
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(matchId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(matchId);
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
              type: 'unsubscribe',
              matchId,
            }));
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

function calculateMinute(match: Match, now: Date): number {
  if (!match.kickOffTime) return 0;
  
  const kickOff = new Date(match.kickOffTime);
  const elapsed = Math.floor((now.getTime() - kickOff.getTime()) / 60000);
  
  // Adjust for halftime (15 min break)
  if (match.status === 'HALFTIME') {
    return 45;
  }
  
  if (match.status === 'SECOND_HALF') {
    return Math.min(90, 45 + Math.max(0, elapsed - 60));
  }
  
  if (match.status === 'EXTRA_TIME_FIRST') {
    return Math.min(105, 90 + Math.max(0, elapsed - 105));
  }
  
  if (match.status === 'EXTRA_TIME_SECOND') {
    return Math.min(120, 105 + Math.max(0, elapsed - 120));
  }
  
  if (match.status === 'LIVE') {
    return Math.min(45, Math.max(0, elapsed));
  }
  
  return Math.min(90, Math.max(0, elapsed));
}

function getPeriodName(status: MatchStatus): string {
  switch (status) {
    case 'WARMUP':
      return 'Warm Up';
    case 'LIVE':
      return '1st Half';
    case 'HALFTIME':
      return 'Half Time';
    case 'SECOND_HALF':
      return '2nd Half';
    case 'EXTRA_TIME_FIRST':
      return 'Extra Time 1st';
    case 'EXTRA_TIME_SECOND':
      return 'Extra Time 2nd';
    case 'PENALTIES':
      return 'Penalties';
    case 'FINISHED':
      return 'Full Time';
    default:
      return status;
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useRealTimeMatch(
  options: UseRealTimeMatchOptions
): UseRealTimeMatchReturn {
  const {
    matchId,
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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const minuteRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Computed values
  const isLive = match ? LIVE_STATUSES.includes(match.status) : false;
  const isFinished = match?.status === 'FINISHED';
  const currentPeriod = match ? getPeriodName(match.status) : '';
  const injuryTime = match?.injuryTimeFirst || match?.injuryTimeSecond || 0;
  
  // Live state
  const liveState: LiveMatchState | null = match ? {
    matchId: match.id,
    status: match.status,
    homeScore: match.homeScore || 0,
    awayScore: match.awayScore || 0,
    minute: currentMinute,
    period: currentPeriod,
    injuryTime,
    lastEvent: events[0] || null,
    recentEvents: events.slice(0, 5),
    stats,
  } : null;
  
  // Fetch match data
  const fetchMatch = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch match');
      }
      const data = await response.json();
      setMatch(data.match);
      setEvents(data.match.events || []);
      setPerformances(data.match.playerPerformances || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [matchId, onError]);
  
  // Fetch events
  const fetchEvents = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/matches/${matchId}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [matchId]);
  
  // Fetch stats
  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/matches/${matchId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || createEmptyStats());
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [matchId]);
  
  // Refresh all data
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await Promise.all([fetchMatch(), fetchEvents(), fetchStats()]);
    setIsLoading(false);
  }, [fetchMatch, fetchEvents, fetchStats]);
  
  // Add event
  const addEvent = useCallback((event: MatchEvent): void => {
    setEvents((prev) => [event, ...prev]);
    onEvent?.(event);
    
    // Update score if scoring event
    if (event.eventType === 'GOAL' || event.eventType === 'PENALTY_SCORED') {
      setMatch((prev) => {
        if (!prev) return prev;
        const isHome = event.teamSide === 'home';
        const newHomeScore = isHome ? (prev.homeScore || 0) + 1 : prev.homeScore;
        const newAwayScore = !isHome ? (prev.awayScore || 0) + 1 : prev.awayScore;
        onScoreChange?.(newHomeScore || 0, newAwayScore || 0);
        return {
          ...prev,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
        };
      });
    }
    
    // Update cards in stats
    if (event.eventType === 'YELLOW_CARD' || event.eventType === 'SECOND_YELLOW') {
      setStats((prev) => {
        const side = event.teamSide === 'home' ? 'home' : 'away';
        return {
          ...prev,
          [side]: {
            ...prev[side],
            yellowCards: prev[side].yellowCards + 1,
          },
        };
      });
    }
    
    if (event.eventType === 'RED_CARD' || event.eventType === 'SECOND_YELLOW') {
      setStats((prev) => {
        const side = event.teamSide === 'home' ? 'home' : 'away';
        return {
          ...prev,
          [side]: {
            ...prev[side],
            redCards: prev[side].redCards + 1,
          },
        };
      });
    }
  }, [onEvent, onScoreChange]);
  
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
  
  // Set up WebSocket connection
  useEffect(() => {
    if (!enabled || !enableWebSocket) return;
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `wss://${window.location.host}/api/ws`;
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
  
  // Set up polling fallback
  useEffect(() => {
    if (!enabled) return;
    if (connectionStatus === 'connected') return;
    
    setConnectionStatus('polling');
    
    // Initial fetch
    refresh();
    
    // Set up polling interval
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
  
  // Update minute counter for live matches
  useEffect(() => {
    if (!isLive || !match) {
      return;
    }
    
    const updateMinute = () => {
      const minute = calculateMinute(match, new Date());
      setCurrentMinute(minute);
    };
    
    updateMinute();
    minuteRef.current = setInterval(updateMinute, 1000);
    
    return () => {
      if (minuteRef.current) {
        clearInterval(minuteRef.current);
      }
    };
  }, [isLive, match]);
  
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
    liveState,
    isLive,
    isFinished,
    currentMinute,
    currentPeriod,
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

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for match timeline with virtual scrolling support
 */
export function useMatchTimeline(matchId: string, enabled = true) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  return { events, isLoading };
}

/**
 * Hook for match stats aggregation
 */
export function useMatchStats(matchId: string, enabled = true) {
  const [stats, setStats] = useState<LiveMatchStats>(createEmptyStats());
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  const aggregateFromEvents = useCallback((events: MatchEvent[]) => {
    const home: TeamStats = {
      possession: 50,
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
    
    const away: TeamStats = { ...home };
    
    events.forEach((event) => {
      const target = event.teamSide === 'home' ? home : away;
      
      switch (event.eventType) {
        case 'YELLOW_CARD':
        case 'SECOND_YELLOW':
          target.yellowCards++;
          break;
        case 'RED_CARD':
          target.redCards++;
          break;
        case 'CORNER':
          target.corners++;
          break;
        case 'FOUL':
          target.fouls++;
          break;
        case 'OFFSIDE':
          target.offsides++;
          break;
      }
    });
    
    setStats({ home, away });
  }, []);
  
  return { stats, isLoading, aggregateFromEvents };
}

/**
 * Hook for player performances in a match
 */
export function useMatchPerformances(matchId: string, teamId?: string, enabled = true) {
  const [performances, setPerformances] = useState<PlayerMatchPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!enabled) return;
    
    const fetchPerformances = async () => {
      try {
        const url = teamId
          ? `/api/matches/${matchId}/performances?teamId=${teamId}`
          : `/api/matches/${matchId}/performances`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPerformances(data.performances || []);
        }
      } catch (err) {
        console.error('Failed to fetch performances:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerformances();
  }, [matchId, teamId, enabled]);
  
  return { performances, isLoading };
}
