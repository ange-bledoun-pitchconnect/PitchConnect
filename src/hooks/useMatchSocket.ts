/**
 * ============================================================================
 * 🔌 USE MATCH SOCKET HOOK v7.10.1 - WEBSOCKET FOR MATCHES
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useMatchSocket.ts
 * ============================================================================
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Sport, getSportConfig } from './useSportConfig';

export type MatchSocketEvent = 
  | 'connected' | 'disconnected' | 'reconnecting'
  | 'match:event' | 'match:score' | 'match:status' | 'match:stats'
  | 'match:lineup' | 'match:substitution' | 'match:period';

export interface MatchSocketMessage {
  type: MatchSocketEvent;
  matchId: string;
  data: unknown;
  timestamp: string;
}

export interface UseMatchSocketOptions {
  matchId: string;
  sport?: Sport;
  enabled?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: MatchSocketMessage) => void;
}

export interface UseMatchSocketReturn {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastMessage: MatchSocketMessage | null;
  send: (type: string, data: unknown) => void;
  subscribe: (event: MatchSocketEvent, handler: (data: unknown) => void) => () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useMatchSocket(options: UseMatchSocketOptions): UseMatchSocketReturn {
  const {
    matchId,
    sport = 'FOOTBALL',
    enabled = true,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = options;

  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastMessage, setLastMessage] = useState<MatchSocketMessage | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const handlersRef = useRef<Map<MatchSocketEvent, Set<(data: unknown) => void>>>(new Map());

  const isConnected = connectionState === 'connected';

  const connect = useCallback(() => {
    if (!enabled || !matchId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`;

    setConnectionState('connecting');

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        
        // Subscribe to match
        socket.send(JSON.stringify({
          type: 'subscribe',
          matchId,
          sport,
        }));

        onConnect?.();
      };

      socket.onclose = () => {
        setConnectionState('disconnected');
        onDisconnect?.();

        // Auto reconnect
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          setConnectionState('reconnecting');
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current);
        }
      };

      socket.onerror = (event) => {
        onError?.(new Error('WebSocket error'));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as MatchSocketMessage;
          setLastMessage(message);
          onMessage?.(message);

          // Notify subscribers
          const handlers = handlersRef.current.get(message.type as MatchSocketEvent);
          handlers?.forEach(handler => handler(message.data));
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      setConnectionState('disconnected');
      onError?.(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [enabled, matchId, sport, autoReconnect, maxReconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setConnectionState('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  const send = useCallback((type: string, data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type,
        matchId,
        data,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [matchId]);

  const subscribe = useCallback((event: MatchSocketEvent, handler: (data: unknown) => void): (() => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionState,
    lastMessage,
    send,
    subscribe,
    disconnect,
    reconnect,
  };
}

export default useMatchSocket;
