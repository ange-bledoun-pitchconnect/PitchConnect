// ============================================================================
// FILE: src/lib/api.ts
// ============================================================================
// API Client with Axios - Type-safe HTTP client with interceptors

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    async (config) => {
      const session = await getSession();
      if (session?.user) {
        config.headers.Authorization = `Bearer ${session.user.id}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Redirect to login
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

export const api = {
  // ====================================================================
  // AUTH ENDPOINTS
  // ====================================================================
  auth: {
    register: (data: any) => apiClient.post('/auth/register', data),
    login: (data: any) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    refreshToken: () => apiClient.post('/auth/refresh'),
    verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),
    resetPassword: (email: string) => apiClient.post('/auth/reset-password', { email }),
    updatePassword: (data: any) => apiClient.post('/auth/update-password', data),
  },

  // ====================================================================
  // PLAYER ENDPOINTS
  // ====================================================================
  players: {
    list: (params?: any) => apiClient.get('/players', { params }),
    get: (id: string) => apiClient.get(`/players/${id}`),
    create: (data: any) => apiClient.post('/players', data),
    update: (id: string, data: any) => apiClient.put(`/players/${id}`, data),
    delete: (id: string) => apiClient.delete(`/players/${id}`),
    getStats: (id: string, season: number) => 
      apiClient.get(`/players/${id}/stats`, { params: { season } }),
    recordInjury: (id: string, data: any) => 
      apiClient.post(`/players/${id}/injuries`, data),
    getAnalytics: (id: string) => apiClient.get(`/players/${id}/analytics`),
  },

  // ====================================================================
  // TEAM ENDPOINTS
  // ====================================================================
  teams: {
    list: (params?: any) => apiClient.get('/teams', { params }),
    get: (id: string) => apiClient.get(`/teams/${id}`),
    create: (data: any) => apiClient.post('/teams', data),
    update: (id: string, data: any) => apiClient.put(`/teams/${id}`, data),
    delete: (id: string) => apiClient.delete(`/teams/${id}`),
    getMembers: (id: string) => apiClient.get(`/teams/${id}/members`),
    addMember: (id: string, data: any) => apiClient.post(`/teams/${id}/members`, data),
    removeMember: (teamId: string, memberId: string) => 
      apiClient.delete(`/teams/${teamId}/members/${memberId}`),
    getMatches: (id: string, params?: any) => 
      apiClient.get(`/teams/${id}/matches`, { params }),
    getAnalytics: (id: string) => apiClient.get(`/teams/${id}/analytics`),
  },

  // ====================================================================
  // MATCH ENDPOINTS
  // ====================================================================
  matches: {
    list: (params?: any) => apiClient.get('/matches', { params }),
    get: (id: string) => apiClient.get(`/matches/${id}`),
    create: (data: any) => apiClient.post('/matches', data),
    update: (id: string, data: any) => apiClient.put(`/matches/${id}`, data),
    recordResult: (id: string, data: any) => 
      apiClient.post(`/matches/${id}/result`, data),
    getAnalytics: (id: string) => apiClient.get(`/matches/${id}/analytics`),
    recordAttendance: (id: string, data: any) => 
      apiClient.post(`/matches/${id}/attendance`, data),
    recordEvent: (id: string, data: any) => 
      apiClient.post(`/matches/${id}/events`, data),
  },

  // ====================================================================
  // TRAINING ENDPOINTS
  // ====================================================================
  training: {
    listSessions: (params?: any) => apiClient.get('/training', { params }),
    getSession: (id: string) => apiClient.get(`/training/${id}`),
    createSession: (data: any) => apiClient.post('/training', data),
    updateSession: (id: string, data: any) => apiClient.put(`/training/${id}`, data),
    deleteSession: (id: string) => apiClient.delete(`/training/${id}`),
    recordAttendance: (sessionId: string, data: any) => 
      apiClient.post(`/training/${sessionId}/attendance`, data),
  },

  // ====================================================================
  // TACTIC ENDPOINTS
  // ====================================================================
  tactics: {
    list: (teamId: string, params?: any) => 
      apiClient.get(`/tactics`, { params: { ...params, teamId } }),
    get: (id: string) => apiClient.get(`/tactics/${id}`),
    create: (data: any) => apiClient.post('/tactics', data),
    update: (id: string, data: any) => apiClient.put(`/tactics/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tactics/${id}`),
  },

  // ====================================================================
  // ANALYTICS ENDPOINTS
  // ====================================================================
  analytics: {
    playerStats: (playerId: string, params?: any) => 
      apiClient.get(`/analytics/players/${playerId}`, { params }),
    teamStats: (teamId: string, params?: any) => 
      apiClient.get(`/analytics/teams/${teamId}`, { params }),
    leagueStats: (leagueId: string, params?: any) => 
      apiClient.get(`/analytics/leagues/${leagueId}`, { params }),
    matchAnalysis: (matchId: string) => 
      apiClient.get(`/analytics/matches/${matchId}`),
  },

  // ====================================================================
  // SUBSCRIPTION ENDPOINTS
  // ====================================================================
  subscription: {
    getCurrent: () => apiClient.get('/subscription/current'),
    upgrade: (tier: string) => apiClient.post('/subscription/upgrade', { tier }),
    cancel: () => apiClient.post('/subscription/cancel'),
    getPaymentMethods: () => apiClient.get('/subscription/payment-methods'),
    addPaymentMethod: (data: any) => 
      apiClient.post('/subscription/payment-methods', data),
  },
};

export default api;
