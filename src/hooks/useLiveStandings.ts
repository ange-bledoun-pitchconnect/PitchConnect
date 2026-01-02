/**
 * ============================================================================
 * 🏆 USE LIVE STANDINGS HOOK v7.10.1 - MULTI-SPORT STANDINGS
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useLiveStandings.ts
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sport, getSportConfig } from './useSportConfig';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  logoUrl?: string;
  position: number;
  previousPosition?: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;      // Generic scoring
  goalsAgainst: number;  // Generic conceding
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  homeRecord: { won: number; drawn: number; lost: number };
  awayRecord: { won: number; drawn: number; lost: number };
  lastMatch?: {
    matchId: string;
    opponent: string;
    result: 'W' | 'D' | 'L';
    score: string;
  };
  nextMatch?: {
    matchId: string;
    opponent: string;
    date: string;
  };
}

export interface StandingsGroup {
  groupName: string;
  groupId: string;
  teams: TeamStanding[];
}

export interface UseLiveStandingsOptions {
  leagueId: string;
  seasonId?: string;
  sport?: Sport;
  groupId?: string;
  enabled?: boolean;
  pollingInterval?: number;
  enableWebSocket?: boolean;
}

export interface UseLiveStandingsReturn {
  standings: TeamStanding[];
  groups: StandingsGroup[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  sport: Sport;
  sportConfig: ReturnType<typeof getSportConfig>;
  
  // Helpers
  getTeamStanding: (teamId: string) => TeamStanding | undefined;
  getPositionChange: (teamId: string) => number;
  isPromotionZone: (position: number) => boolean;
  isRelegationZone: (position: number) => boolean;
  isPlayoffZone: (position: number) => boolean;
}

export function useLiveStandings(options: UseLiveStandingsOptions): UseLiveStandingsReturn {
  const {
    leagueId,
    seasonId,
    sport = 'FOOTBALL',
    groupId,
    enabled = true,
    pollingInterval = 60000,
    enableWebSocket = true,
  } = options;

  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [groups, setGroups] = useState<StandingsGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const socketRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout>();

  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);

  // Fetch standings
  const fetchStandings = useCallback(async () => {
    if (!leagueId) return;

    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({ leagueId });
      if (seasonId) params.append('seasonId', seasonId);
      if (groupId) params.append('groupId', groupId);

      const response = await fetch(`/api/standings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch standings');

      const data = await response.json();
      
      if (data.groups?.length) {
        setGroups(data.groups);
        setStandings(data.groups.flatMap((g: StandingsGroup) => g.teams));
      } else {
        setStandings(data.standings || []);
        setGroups([]);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [leagueId, seasonId, groupId]);

  // WebSocket connection
  useEffect(() => {
    if (!enabled || !enableWebSocket || typeof window === 'undefined') return;

    socketRef.current = (window as any).socket;
    
    if (socketRef.current) {
      const handleStandingsUpdate = (data: { leagueId: string; standings: TeamStanding[] }) => {
        if (data.leagueId === leagueId) {
          setStandings(data.standings);
          setLastUpdated(new Date());
        }
      };

      socketRef.current.on(`standings:${leagueId}`, handleStandingsUpdate);
      socketRef.current.emit('subscribe:standings', { leagueId });

      return () => {
        socketRef.current?.off(`standings:${leagueId}`, handleStandingsUpdate);
        socketRef.current?.emit('unsubscribe:standings', { leagueId });
      };
    }
  }, [enabled, enableWebSocket, leagueId]);

  // Polling fallback
  useEffect(() => {
    if (!enabled) return;

    fetchStandings();

    if (!enableWebSocket || !socketRef.current) {
      pollingRef.current = setInterval(fetchStandings, pollingInterval);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enabled, enableWebSocket, fetchStandings, pollingInterval]);

  // Helpers
  const getTeamStanding = useCallback((teamId: string): TeamStanding | undefined => {
    return standings.find(s => s.teamId === teamId);
  }, [standings]);

  const getPositionChange = useCallback((teamId: string): number => {
    const standing = standings.find(s => s.teamId === teamId);
    if (!standing || standing.previousPosition === undefined) return 0;
    return standing.previousPosition - standing.position;
  }, [standings]);

  const isPromotionZone = useCallback((position: number): boolean => {
    // Typically top 2-4 positions
    return position <= 4;
  }, []);

  const isRelegationZone = useCallback((position: number): boolean => {
    // Typically bottom 3 positions
    const totalTeams = standings.length;
    return position > totalTeams - 3;
  }, [standings.length]);

  const isPlayoffZone = useCallback((position: number): boolean => {
    // Typically positions 3-6
    return position >= 3 && position <= 6;
  }, []);

  return {
    standings,
    groups,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchStandings,
    sport,
    sportConfig,
    getTeamStanding,
    getPositionChange,
    isPromotionZone,
    isRelegationZone,
    isPlayoffZone,
  };
}

export default useLiveStandings;
