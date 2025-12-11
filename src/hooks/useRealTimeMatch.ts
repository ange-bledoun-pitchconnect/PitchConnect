'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  getSocket,
  subscribeToMatch,
  unsubscribeFromMatch,
  type MatchEvent,
} from '@/lib/socket';

interface LiveMatchData {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamGoals: number;
  awayTeamGoals: number;
  possession: number;
  shots: number;
  passAccuracy: number;
  minute: number;
  status: 'live' | 'paused' | 'finished';
}

export function useRealTimeMatch(matchId: string) {
  const [liveData, setLiveData] = useState<Partial<LiveMatchData>>({});
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial data
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await axios.get(`/api/matches/${matchId}`);
      return response.data.data;
    },
  });

  // Initialize real-time connection
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // Subscribe to match events
  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, (event) => {
      setEvents((prev) => [event, ...prev]);

      // Update live data based on event
      if (event.type === 'goal') {
        setLiveData((prev) => ({
          ...prev,
          [event.team === 'home' ? 'homeTeamGoals' : 'awayTeamGoals']:
            (prev[event.team === 'home' ? 'homeTeamGoals' : 'awayTeamGoals'] || 0) + 1,
        }));
      } else if (event.type === 'stats') {
        setLiveData((prev) => ({
          ...prev,
          possession: event.possession,
          shots: event.shots,
          passAccuracy: event.accuracy,
        }));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFromMatch(matchId);
    };
  }, [matchId]);

  const emitEvent = useCallback(
    (event: MatchEvent) => {
      const socket = getSocket();
      socket.emit('match:event', { matchId, event });
    },
    [matchId],
  );

  return {
    liveData: { ...initialData, ...liveData },
    events,
    isConnected,
    isLoading,
    emitEvent,
  };
}
