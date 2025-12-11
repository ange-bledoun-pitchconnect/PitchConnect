import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface MatchState {
  matchId: string;
  status: string;
  homeGoals: number;
  awayGoals: number;
  events: any[];
  isConnected: boolean;
}

export function useMatchSocket(matchId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [match, setMatch] = useState<MatchState>({
    matchId,
    status: 'SCHEDULED',
    homeGoals: 0,
    awayGoals: 0,
    events: [],
    isConnected: false,
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/matches`, {
      path: '/socket.io',
    });

    // Join match room
    newSocket.emit('match:join', matchId);

    // Listen for state updates
    newSocket.on('match:state', (state: any) => {
      setMatch(prev => ({ ...prev, ...state, isConnected: true }));
    });

    // Listen for score updates
    newSocket.on('match:score:updated', (data: any) => {
      setMatch(prev => ({
        ...prev,
        homeGoals: data.homeGoals,
        awayGoals: data.awayGoals,
      }));
    });

    // Listen for events
    newSocket.on('match:event:added', (event: any) => {
      setMatch(prev => ({
        ...prev,
        events: [event, ...prev.events],
      }));
    });

    // Listen for status changes
    newSocket.on('match:status:changed', (data: any) => {
      setMatch(prev => ({
        ...prev,
        status: data.status,
      }));
    });

    newSocket.on('disconnect', () => {
      setMatch(prev => ({ ...prev, isConnected: false }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('match:leave', matchId);
      newSocket.disconnect();
    };
  }, [matchId]);

  const addEvent = useCallback(
    (eventData: any) => {
      socket?.emit('match:event:add', {
        matchId,
        ...eventData,
      });
    },
    [socket, matchId]
  );

  const updateScore = useCallback(
    (homeGoals: number, awayGoals: number) => {
      socket?.emit('match:score:update', {
        matchId,
        homeGoals,
        awayGoals,
      });
    },
    [socket, matchId]
  );

  const updateStatus = useCallback(
    (status: string) => {
      socket?.emit('match:status:change', {
        matchId,
        status,
      });
    },
    [socket, matchId]
  );

  return {
    match,
    addEvent,
    updateScore,
    updateStatus,
    isConnected: match.isConnected,
  };
}
