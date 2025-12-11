'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Standing } from '@/types';

interface LiveStandingsOptions {
  leagueId: string;
  refreshInterval?: number; // milliseconds, default 10000
  enabled?: boolean;
}

interface LiveStandingsData {
  standings: Standing[];
  lastUpdated: string;
  isLive: boolean;
}

/**
 * Hook for real-time league standings with Socket.IO integration
 * Auto-updates every 10 seconds when live matches are ongoing
 */
export function useLiveStandings({
  leagueId,
  refreshInterval = 10000,
  enabled = true,
}: LiveStandingsOptions) {
  const [isLive, setIsLive] = useState(false);
  const socketRef = useRef<any>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Fetch initial standings
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<LiveStandingsData>({
    queryKey: ['standings', leagueId, 'live'],
    queryFn: async () => {
      const response = await axios.get(
        `/api/leagues/${leagueId}/standings/live`,
      );
      return response.data.data;
    },
    enabled: enabled && !!leagueId,
    refetchInterval: isLive ? refreshInterval : false,
    staleTime: isLive ? refreshInterval / 2 : 30000,
  });

  // Initialize Socket.IO for real-time updates
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled || !leagueId) return;

    socketRef.current = (window as any).socket;

    if (!socketRef.current) {
      console.warn('Socket.IO not initialized');
      return;
    }

    // Listen for league updates
    const handleLeagueUpdate = (updateData: any) => {
      if (updateData.leagueId === leagueId) {
        setIsLive(true);
        // Refetch standings immediately on update
        refetch();

        // Re-set auto-refetch interval
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
        updateIntervalRef.current = setInterval(() => {
          refetch();
        }, refreshInterval);
      }
    };

    const handleMatchStart = (matchData: any) => {
      // Check if match is in this league
      if (matchData.leagueId === leagueId) {
        setIsLive(true);
      }
    };

    const handleMatchEnd = (matchData: any) => {
      if (matchData.leagueId === leagueId) {
        // Check if any live matches remain
        const hasLiveMatches = (window as any).liveMatches?.some(
          (m: any) => m.leagueId === leagueId && m.status === 'LIVE',
        );
        if (!hasLiveMatches) {
          setIsLive(false);
        }
        refetch();
      }
    };

    socketRef.current.on(`league:${leagueId}:update`, handleLeagueUpdate);
    socketRef.current.on(`league:${leagueId}:match-start`, handleMatchStart);
    socketRef.current.on(`league:${leagueId}:match-end`, handleMatchEnd);

    // Clean up on unmount
    return () => {
      socketRef.current?.off(`league:${leagueId}:update`, handleLeagueUpdate);
      socketRef.current?.off(
        `league:${leagueId}:match-start`,
        handleMatchStart,
      );
      socketRef.current?.off(`league:${leagueId}:match-end`, handleMatchEnd);

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [leagueId, enabled, refetch, refreshInterval]);

  return {
    standings: data?.standings || [],
    lastUpdated: data?.lastUpdated,
    isLoading: isLoading || isFetching,
    error: error as Error | null,
    isLive,
    refetch,
    isFetching,
  };
}
