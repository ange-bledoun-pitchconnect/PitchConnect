/**
 * ============================================================================
 * 📊 USE ADVANCED ANALYTICS HOOK v7.10.1 - MULTI-SPORT ANALYTICS
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useAdvancedAnalytics.ts
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sport, getSportConfig } from './useSportConfig';

export interface PlayerAnalytics {
  playerId: string;
  playerName: string;
  position: string;
  sport: Sport;
  
  // Overall ratings
  overallRating: number;
  form: number; // 0-100
  potential: number;
  
  // Performance metrics (sport-agnostic)
  gamesPlayed: number;
  minutesPlayed: number;
  starts: number;
  
  // Scoring (adapted per sport)
  scoringContributions: number; // Goals, tries, touchdowns, etc.
  assists: number;
  scoringRate: number; // Per 90 minutes / per game
  
  // Discipline
  yellowCards: number;
  redCards: number;
  foulsCommitted: number;
  foulsWon: number;
  
  // Sport-specific stats
  sportStats: Record<string, number>;
  
  // Trends
  formTrend: ('up' | 'down' | 'stable');
  recentGames: {
    matchId: string;
    rating: number;
    contributions: number;
  }[];
}

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  sport: Sport;
  
  // Results
  played: number;
  won: number;
  drawn: number;
  lost: number;
  winRate: number;
  
  // Scoring
  scored: number;
  conceded: number;
  cleanSheets: number;
  scoringRate: number;
  concedingRate: number;
  
  // Form
  form: ('W' | 'D' | 'L')[];
  homeRecord: { won: number; drawn: number; lost: number };
  awayRecord: { won: number; drawn: number; lost: number };
  
  // Advanced
  possession: number;
  passAccuracy: number;
  shotsPerGame: number;
  
  // Sport-specific
  sportStats: Record<string, number>;
}

export interface UseAdvancedAnalyticsOptions {
  entityType: 'player' | 'team';
  entityId: string;
  sport?: Sport;
  seasonId?: string;
  competitionId?: string;
  enabled?: boolean;
}

export interface UseAdvancedAnalyticsReturn {
  data: PlayerAnalytics | TeamAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  sport: Sport;
  sportConfig: ReturnType<typeof getSportConfig>;
  
  // Helpers
  getStatLabel: (statKey: string) => string;
  getStatValue: (statKey: string) => number;
  getFormattedStat: (statKey: string, decimals?: number) => string;
}

export function useAdvancedAnalytics(options: UseAdvancedAnalyticsOptions): UseAdvancedAnalyticsReturn {
  const {
    entityType,
    entityId,
    sport = 'FOOTBALL',
    seasonId,
    competitionId,
    enabled = true,
  } = options;

  const [data, setData] = useState<PlayerAnalytics | TeamAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);

  const fetchAnalytics = useCallback(async () => {
    if (!entityId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: entityType,
        id: entityId,
        sport,
      });
      if (seasonId) params.append('seasonId', seasonId);
      if (competitionId) params.append('competitionId', competitionId);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, sport, seasonId, competitionId, enabled]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Stat label mapping per sport
  const getStatLabel = useCallback((statKey: string): string => {
    const labels: Record<string, Record<string, string>> = {
      FOOTBALL: {
        scoringContributions: 'Goals',
        assists: 'Assists',
        cleanSheets: 'Clean Sheets',
        passAccuracy: 'Pass Accuracy',
      },
      RUGBY: {
        scoringContributions: 'Tries',
        assists: 'Try Assists',
        tackles: 'Tackles',
        lineBreaks: 'Line Breaks',
      },
      BASKETBALL: {
        scoringContributions: 'Points',
        assists: 'Assists',
        rebounds: 'Rebounds',
        steals: 'Steals',
      },
      CRICKET: {
        scoringContributions: 'Runs',
        wickets: 'Wickets',
        battingAverage: 'Batting Avg',
        bowlingAverage: 'Bowling Avg',
      },
      AMERICAN_FOOTBALL: {
        scoringContributions: 'Touchdowns',
        passingYards: 'Passing Yards',
        rushingYards: 'Rushing Yards',
        sacks: 'Sacks',
      },
      NETBALL: {
        scoringContributions: 'Goals',
        assists: 'Assists',
        intercepts: 'Intercepts',
        rebounds: 'Rebounds',
      },
    };

    return labels[sport]?.[statKey] || statKey.replace(/([A-Z])/g, ' $1').trim();
  }, [sport]);

  const getStatValue = useCallback((statKey: string): number => {
    if (!data) return 0;
    return (data as any)[statKey] ?? (data.sportStats as any)?.[statKey] ?? 0;
  }, [data]);

  const getFormattedStat = useCallback((statKey: string, decimals = 1): string => {
    const value = getStatValue(statKey);
    return typeof value === 'number' ? value.toFixed(decimals) : String(value);
  }, [getStatValue]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchAnalytics,
    sport,
    sportConfig,
    getStatLabel,
    getStatValue,
    getFormattedStat,
  };
}

export default useAdvancedAnalytics;
