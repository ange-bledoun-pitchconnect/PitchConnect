'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Player, Club } from '@/types';

interface PlayerPerformanceStats {
  playerId: string;
  playerName: string;
  position: string;
  clubId: string;
  clubName: string;
  
  // Performance metrics
  appearances: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  
  // Advanced metrics
  passAccuracy: number; // 0-100
  tacklesPerGame: number;
  interceptionsPerGame: number;
  foulsPerGame: number;
  yellowCards: number;
  redCards: number;
  
  // Calculated ratings
  overallRating: number; // 0-10
  formRating: number; // Last 5 games
  consistency: number; // Standard deviation
  
  // Trend
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface TeamTrendData {
  clubId: string;
  clubName: string;
  
  // Historical data for trend
  timestamps: string[]; // ISO dates
  values: number[]; // Rating or points
  
  // Metrics
  avgPoints: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  
  // Calculated metrics
  momentum: number; // -100 to 100
  form: 'excellent' | 'good' | 'average' | 'poor';
  consistency: number; // 0-100
}

interface LeagueAnalyticsData {
  leagueId: string;
  leagueName: string;
  season: number;
  
  // Top performers
  topScorers: PlayerPerformanceStats[];
  topAssists: PlayerPerformanceStats[];
  topCleanSheets: PlayerPerformanceStats[];
  
  // Team metrics
  bestDefense: TeamTrendData[];
  bestAttack: TeamTrendData[];
  
  // League-wide stats
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  avgAttendance: number;
}

interface AdvancedAnalyticsOptions {
  leagueId?: string;
  clubId?: string;
  playerId?: string;
  timeRange?: 'week' | 'month' | 'season';
  enabled?: boolean;
}

/**
 * Hook for advanced analytics with player/team performance data
 */
export function useAdvancedAnalytics({
  leagueId,
  clubId,
  playerId,
  timeRange = 'season',
  enabled = true,
}: AdvancedAnalyticsOptions) {
  // Build query string
  const queryParams = new URLSearchParams({
    timeRange,
  });

  if (leagueId) queryParams.append('leagueId', leagueId);
  if (clubId) queryParams.append('clubId', clubId);
  if (playerId) queryParams.append('playerId', playerId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', 'advanced', { leagueId, clubId, playerId, timeRange }],
    queryFn: async () => {
      const response = await axios.get(
        `/api/analytics/advanced?${queryParams.toString()}`,
      );
      return response.data.data;
    },
    enabled: enabled && (!!leagueId || !!clubId || !!playerId),
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
  });

  return {
    data: data as LeagueAnalyticsData | null,
    playerStats: data?.topScorers as PlayerPerformanceStats[] | undefined,
    teamTrends: data?.bestAttack as TeamTrendData[] | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Simplified hook for player performance chart data
 */
export function usePlayerPerformance(playerId: string) {
  return useQuery({
    queryKey: ['player', playerId, 'performance'],
    queryFn: async () => {
      const response = await axios.get(
        `/api/analytics/player/${playerId}/performance`,
      );
      return response.data.data;
    },
    enabled: !!playerId,
  });
}

/**
 * Simplified hook for team trend data
 */
export function useTeamTrend(clubId: string, timeRange: 'week' | 'month' | 'season' = 'season') {
  return useQuery({
    queryKey: ['team', clubId, 'trend', timeRange],
    queryFn: async () => {
      const response = await axios.get(
        `/api/analytics/team/${clubId}/trend?timeRange=${timeRange}`,
      );
      return response.data.data;
    },
    enabled: !!clubId,
    staleTime: 300000,
    refetchInterval: 600000,
  });
}
