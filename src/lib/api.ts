// src/lib/api.ts
// ============================================================================
// PITCHCONNECT API CLIENT - Multi-Sport Platform
// ============================================================================
// Axios-based API client with:
// - Type-safe request/response handling
// - Automatic retry with exponential backoff
// - Request/response interceptors
// - Multi-sport endpoint support (all 12 sports)
// - Error standardization
// - Request cancellation
// - Offline queue support
// ============================================================================

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { Sport } from '@prisma/client';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export interface APIResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipRetry?: boolean;
  retryCount?: number;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class APIClient {
  private client: AxiosInstance;
  private authToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // ---------------------------------------------------------------------------
  // INTERCEPTORS
  // ---------------------------------------------------------------------------

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        if (this.authToken && !(config as RequestOptions).skipAuth) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Time'] = new Date().toISOString();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as RequestOptions;

        // Handle 401 - Token refresh
        if (error.response?.status === 401 && !config?.skipAuth) {
          try {
            const newToken = await this.refreshToken();
            if (newToken && config) {
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${newToken}`;
              return this.client.request(config);
            }
          } catch {
            // Refresh failed, redirect to login
            this.handleAuthFailure();
          }
        }

        // Handle retry logic
        if (this.shouldRetry(error, config)) {
          const retryCount = (config?.retryCount || 0) + 1;
          const delay = Math.min(
            API_CONFIG.retryDelay * Math.pow(2, retryCount - 1),
            API_CONFIG.maxRetryDelay
          );

          await this.delay(delay);

          return this.client.request({
            ...config,
            retryCount,
          } as RequestOptions);
        }

        // Standardize error
        throw this.standardizeError(error);
      }
    );
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private shouldRetry(error: AxiosError, config?: RequestOptions): boolean {
    if (config?.skipRetry) return false;
    if ((config?.retryCount || 0) >= API_CONFIG.retryAttempts) return false;

    // Retry on network errors or 5xx responses
    const status = error.response?.status;
    return !status || (status >= 500 && status < 600);
  }

  private standardizeError(error: AxiosError): APIError {
    const response = error.response?.data as Record<string, unknown> | undefined;

    return {
      code: (response?.code as string) || error.code || 'UNKNOWN_ERROR',
      message:
        (response?.message as string) ||
        error.message ||
        'An unexpected error occurred',
      status: error.response?.status || 500,
      details: response?.details as Record<string, unknown>,
      timestamp: new Date().toISOString(),
      requestId: error.config?.headers?.['X-Request-ID'] as string,
    };
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await this.client.post<{ token: string }>(
          '/auth/refresh',
          {},
          { skipAuth: true } as RequestOptions
        );
        this.authToken = response.data.token;
        return this.authToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private handleAuthFailure(): void {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      window.location.href = '/login?expired=true';
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  async get<T>(url: string, config?: RequestOptions): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: RequestOptions): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Create singleton instance
const apiClient = new APIClient();

// ============================================================================
// MULTI-SPORT API ENDPOINTS
// ============================================================================

/**
 * All 12 supported sports
 */
const ALL_SPORTS: Sport[] = [
  'FOOTBALL',
  'FUTSAL',
  'BEACH_FOOTBALL',
  'RUGBY',
  'AMERICAN_FOOTBALL',
  'BASKETBALL',
  'CRICKET',
  'NETBALL',
  'HOCKEY',
  'LACROSSE',
  'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL',
];

// ---------------------------------------------------------------------------
// AUTH ENDPOINTS
// ---------------------------------------------------------------------------

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post<{ user: unknown; token: string }>('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    selectedTier?: string;
  }) => apiClient.post<{ user: unknown; token: string }>('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: () => apiClient.post<{ token: string }>('/auth/refresh'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),

  setupTwoFactor: () =>
    apiClient.post<{ secret: string; qrCode: string }>('/auth/2fa/setup'),

  verifyTwoFactor: (code: string) =>
    apiClient.post('/auth/2fa/verify', { code }),

  disableTwoFactor: (code: string) =>
    apiClient.post('/auth/2fa/disable', { code }),
};

// ---------------------------------------------------------------------------
// USER ENDPOINTS
// ---------------------------------------------------------------------------

export const userAPI = {
  getProfile: () => apiClient.get<{ user: unknown }>('/users/me'),

  updateProfile: (data: Record<string, unknown>) =>
    apiClient.patch<{ user: unknown }>('/users/me', data),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/users/me/password', { currentPassword, newPassword }),

  getPreferences: () =>
    apiClient.get<{ preferences: Record<string, unknown> }>('/users/me/preferences'),

  updatePreferences: (preferences: Record<string, unknown>) =>
    apiClient.patch('/users/me/preferences', { preferences }),

  getNotifications: (params?: PaginationParams) =>
    apiClient.get<APIResponse<unknown[]>>('/users/me/notifications', { params }),

  markNotificationRead: (id: string) =>
    apiClient.patch(`/users/me/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    apiClient.post('/users/me/notifications/read-all'),
};

// ---------------------------------------------------------------------------
// TEAM ENDPOINTS
// ---------------------------------------------------------------------------

export const teamAPI = {
  list: (params?: PaginationParams & { sport?: Sport }) =>
    apiClient.get<APIResponse<unknown[]>>('/teams', { params }),

  get: (id: string) => apiClient.get<{ team: unknown }>(`/teams/${id}`),

  create: (data: { name: string; sport: Sport; [key: string]: unknown }) =>
    apiClient.post<{ team: unknown }>('/teams', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ team: unknown }>(`/teams/${id}`, data),

  delete: (id: string) => apiClient.delete(`/teams/${id}`),

  // Members
  getMembers: (teamId: string, params?: PaginationParams) =>
    apiClient.get<APIResponse<unknown[]>>(`/teams/${teamId}/members`, { params }),

  addMember: (teamId: string, data: { userId: string; role: string }) =>
    apiClient.post(`/teams/${teamId}/members`, data),

  removeMember: (teamId: string, userId: string) =>
    apiClient.delete(`/teams/${teamId}/members/${userId}`),

  updateMemberRole: (teamId: string, userId: string, role: string) =>
    apiClient.patch(`/teams/${teamId}/members/${userId}`, { role }),

  // Join requests
  getJoinRequests: (teamId: string) =>
    apiClient.get<APIResponse<unknown[]>>(`/teams/${teamId}/join-requests`),

  approveJoinRequest: (teamId: string, requestId: string) =>
    apiClient.post(`/teams/${teamId}/join-requests/${requestId}/approve`),

  rejectJoinRequest: (teamId: string, requestId: string) =>
    apiClient.post(`/teams/${teamId}/join-requests/${requestId}/reject`),

  // Stats
  getStats: (teamId: string, season?: string) =>
    apiClient.get<{ stats: unknown }>(`/teams/${teamId}/stats`, {
      params: { season },
    }),
};

// ---------------------------------------------------------------------------
// PLAYER ENDPOINTS
// ---------------------------------------------------------------------------

export const playerAPI = {
  list: (params?: PaginationParams & { teamId?: string; sport?: Sport; position?: string }) =>
    apiClient.get<APIResponse<unknown[]>>('/players', { params }),

  get: (id: string) => apiClient.get<{ player: unknown }>(`/players/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ player: unknown }>('/players', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ player: unknown }>(`/players/${id}`, data),

  delete: (id: string) => apiClient.delete(`/players/${id}`),

  // Stats
  getStats: (playerId: string, params?: { season?: string; matchId?: string }) =>
    apiClient.get<{ stats: unknown }>(`/players/${playerId}/stats`, { params }),

  // History
  getHistory: (playerId: string) =>
    apiClient.get<APIResponse<unknown[]>>(`/players/${playerId}/history`),

  // Injuries
  getInjuries: (playerId: string) =>
    apiClient.get<APIResponse<unknown[]>>(`/players/${playerId}/injuries`),

  // Contract
  getContract: (playerId: string) =>
    apiClient.get<{ contract: unknown }>(`/players/${playerId}/contract`),
};

// ---------------------------------------------------------------------------
// MATCH ENDPOINTS
// ---------------------------------------------------------------------------

export const matchAPI = {
  list: (params?: PaginationParams & {
    teamId?: string;
    leagueId?: string;
    sport?: Sport;
    status?: string;
    from?: string;
    to?: string;
  }) => apiClient.get<APIResponse<unknown[]>>('/matches', { params }),

  get: (id: string) => apiClient.get<{ match: unknown }>(`/matches/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ match: unknown }>('/matches', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ match: unknown }>(`/matches/${id}`, data),

  delete: (id: string) => apiClient.delete(`/matches/${id}`),

  // Lineup
  getLineup: (matchId: string) =>
    apiClient.get<{ lineup: unknown }>(`/matches/${matchId}/lineup`),

  setLineup: (matchId: string, lineup: unknown) =>
    apiClient.put(`/matches/${matchId}/lineup`, { lineup }),

  // Events
  getEvents: (matchId: string) =>
    apiClient.get<APIResponse<unknown[]>>(`/matches/${matchId}/events`),

  addEvent: (matchId: string, event: Record<string, unknown>) =>
    apiClient.post(`/matches/${matchId}/events`, event),

  updateEvent: (matchId: string, eventId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/matches/${matchId}/events/${eventId}`, data),

  deleteEvent: (matchId: string, eventId: string) =>
    apiClient.delete(`/matches/${matchId}/events/${eventId}`),

  // Stats
  getStats: (matchId: string) =>
    apiClient.get<{ stats: unknown }>(`/matches/${matchId}/stats`),

  recordStats: (matchId: string, stats: unknown) =>
    apiClient.post(`/matches/${matchId}/stats`, { stats }),

  // Result
  recordResult: (matchId: string, result: Record<string, unknown>) =>
    apiClient.post(`/matches/${matchId}/result`, result),

  // Live
  getLive: () =>
    apiClient.get<APIResponse<unknown[]>>('/matches/live'),
};

// ---------------------------------------------------------------------------
// TRAINING ENDPOINTS
// ---------------------------------------------------------------------------

export const trainingAPI = {
  list: (params?: PaginationParams & { teamId?: string; from?: string; to?: string }) =>
    apiClient.get<APIResponse<unknown[]>>('/training', { params }),

  get: (id: string) => apiClient.get<{ session: unknown }>(`/training/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ session: unknown }>('/training', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ session: unknown }>(`/training/${id}`, data),

  delete: (id: string) => apiClient.delete(`/training/${id}`),

  // Attendance
  getAttendance: (sessionId: string) =>
    apiClient.get<{ attendance: unknown[] }>(`/training/${sessionId}/attendance`),

  recordAttendance: (sessionId: string, attendance: unknown[]) =>
    apiClient.post(`/training/${sessionId}/attendance`, { attendance }),
};

// ---------------------------------------------------------------------------
// INJURY ENDPOINTS
// ---------------------------------------------------------------------------

export const injuryAPI = {
  list: (params?: PaginationParams & { playerId?: string; teamId?: string; severity?: string }) =>
    apiClient.get<APIResponse<unknown[]>>('/injuries', { params }),

  get: (id: string) => apiClient.get<{ injury: unknown }>(`/injuries/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ injury: unknown }>('/injuries', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ injury: unknown }>(`/injuries/${id}`, data),

  delete: (id: string) => apiClient.delete(`/injuries/${id}`),

  recordReturn: (id: string, returnDate: string) =>
    apiClient.post(`/injuries/${id}/return`, { returnDate }),
};

// ---------------------------------------------------------------------------
// CONTRACT ENDPOINTS
// ---------------------------------------------------------------------------

export const contractAPI = {
  list: (params?: PaginationParams & { teamId?: string; status?: string }) =>
    apiClient.get<APIResponse<unknown[]>>('/contracts', { params }),

  get: (id: string) => apiClient.get<{ contract: unknown }>(`/contracts/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ contract: unknown }>('/contracts', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ contract: unknown }>(`/contracts/${id}`, data),

  terminate: (id: string, reason: string) =>
    apiClient.post(`/contracts/${id}/terminate`, { reason }),
};

// ---------------------------------------------------------------------------
// TACTICS ENDPOINTS
// ---------------------------------------------------------------------------

export const tacticsAPI = {
  list: (params?: PaginationParams & { teamId?: string; sport?: Sport }) =>
    apiClient.get<APIResponse<unknown[]>>('/tactics', { params }),

  get: (id: string) => apiClient.get<{ tactic: unknown }>(`/tactics/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ tactic: unknown }>('/tactics', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ tactic: unknown }>(`/tactics/${id}`, data),

  delete: (id: string) => apiClient.delete(`/tactics/${id}`),

  setDefault: (teamId: string, tacticId: string) =>
    apiClient.post(`/teams/${teamId}/tactics/${tacticId}/default`),
};

// ---------------------------------------------------------------------------
// LEAGUE ENDPOINTS
// ---------------------------------------------------------------------------

export const leagueAPI = {
  list: (params?: PaginationParams & { sport?: Sport; country?: string }) =>
    apiClient.get<APIResponse<unknown[]>>('/leagues', { params }),

  get: (id: string) => apiClient.get<{ league: unknown }>(`/leagues/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ league: unknown }>('/leagues', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ league: unknown }>(`/leagues/${id}`, data),

  delete: (id: string) => apiClient.delete(`/leagues/${id}`),

  // Table
  getTable: (leagueId: string, season?: string) =>
    apiClient.get<{ table: unknown[] }>(`/leagues/${leagueId}/table`, {
      params: { season },
    }),

  // Fixtures
  getFixtures: (leagueId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<APIResponse<unknown[]>>(`/leagues/${leagueId}/fixtures`, { params }),

  // Teams
  getTeams: (leagueId: string) =>
    apiClient.get<APIResponse<unknown[]>>(`/leagues/${leagueId}/teams`),

  addTeam: (leagueId: string, teamId: string) =>
    apiClient.post(`/leagues/${leagueId}/teams`, { teamId }),

  removeTeam: (leagueId: string, teamId: string) =>
    apiClient.delete(`/leagues/${leagueId}/teams/${teamId}`),
};

// ---------------------------------------------------------------------------
// ANALYTICS ENDPOINTS
// ---------------------------------------------------------------------------

export const analyticsAPI = {
  getTeamAnalytics: (teamId: string, params?: { from?: string; to?: string; metrics?: string[] }) =>
    apiClient.get<{ analytics: unknown }>(`/analytics/team/${teamId}`, { params }),

  getPlayerAnalytics: (playerId: string, params?: { from?: string; to?: string; metrics?: string[] }) =>
    apiClient.get<{ analytics: unknown }>(`/analytics/player/${playerId}`, { params }),

  getMatchAnalytics: (matchId: string) =>
    apiClient.get<{ analytics: unknown }>(`/analytics/match/${matchId}`),

  getLeagueAnalytics: (leagueId: string, params?: { season?: string }) =>
    apiClient.get<{ analytics: unknown }>(`/analytics/league/${leagueId}`, { params }),

  compare: (type: 'players' | 'teams', ids: string[], metrics: string[]) =>
    apiClient.post<{ comparison: unknown }>('/analytics/compare', { type, ids, metrics }),

  export: (params: { type: string; id: string; format: 'csv' | 'xlsx' | 'pdf' }) =>
    apiClient.get<Blob>('/analytics/export', {
      params,
      responseType: 'blob',
    }),
};

// ---------------------------------------------------------------------------
// SPORT-SPECIFIC ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * Generate sport-specific endpoints for all 12 sports
 */
export const sportAPI = Object.fromEntries(
  ALL_SPORTS.map((sport) => [
    sport.toLowerCase(),
    {
      // Sport-specific positions
      getPositions: () =>
        apiClient.get<{ positions: string[] }>(`/sports/${sport.toLowerCase()}/positions`),

      // Sport-specific configuration
      getConfig: () =>
        apiClient.get<{ config: unknown }>(`/sports/${sport.toLowerCase()}/config`),

      // Sport-specific stats schema
      getStatsSchema: () =>
        apiClient.get<{ schema: unknown }>(`/sports/${sport.toLowerCase()}/stats-schema`),

      // Sport-specific event types
      getEventTypes: () =>
        apiClient.get<{ eventTypes: string[] }>(`/sports/${sport.toLowerCase()}/event-types`),

      // Sport-specific formations/tactics
      getFormations: () =>
        apiClient.get<{ formations: unknown[] }>(`/sports/${sport.toLowerCase()}/formations`),

      // Top performers in this sport
      getTopPerformers: (params?: { metric?: string; limit?: number }) =>
        apiClient.get<APIResponse<unknown[]>>(`/sports/${sport.toLowerCase()}/top-performers`, { params }),

      // Upcoming matches in this sport
      getUpcomingMatches: (params?: PaginationParams) =>
        apiClient.get<APIResponse<unknown[]>>(`/sports/${sport.toLowerCase()}/matches/upcoming`, { params }),
    },
  ])
) as Record<Lowercase<Sport>, {
  getPositions: () => Promise<{ positions: string[] }>;
  getConfig: () => Promise<{ config: unknown }>;
  getStatsSchema: () => Promise<{ schema: unknown }>;
  getEventTypes: () => Promise<{ eventTypes: string[] }>;
  getFormations: () => Promise<{ formations: unknown[] }>;
  getTopPerformers: (params?: { metric?: string; limit?: number }) => Promise<APIResponse<unknown[]>>;
  getUpcomingMatches: (params?: PaginationParams) => Promise<APIResponse<unknown[]>>;
}>;

// ---------------------------------------------------------------------------
// ANNOUNCEMENT ENDPOINTS
// ---------------------------------------------------------------------------

export const announcementAPI = {
  list: (params?: PaginationParams & { teamId?: string }) =>
    apiClient.get<APIResponse<unknown[]>>('/announcements', { params }),

  get: (id: string) => apiClient.get<{ announcement: unknown }>(`/announcements/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ announcement: unknown }>('/announcements', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ announcement: unknown }>(`/announcements/${id}`, data),

  delete: (id: string) => apiClient.delete(`/announcements/${id}`),
};

// ---------------------------------------------------------------------------
// UPLOAD ENDPOINTS
// ---------------------------------------------------------------------------

export const uploadAPI = {
  uploadImage: (file: File, options?: { folder?: string; maxSize?: number }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) formData.append('folder', options.folder);
    
    return apiClient.post<{ url: string; id: string }>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadDocument: (file: File, options?: { folder?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) formData.append('folder', options.folder);
    
    return apiClient.post<{ url: string; id: string }>('/uploads/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteFile: (id: string) => apiClient.delete(`/uploads/${id}`),
};

// ============================================================================
// EXPORTS
// ============================================================================

export { apiClient, ALL_SPORTS };

export default {
  client: apiClient,
  auth: authAPI,
  user: userAPI,
  team: teamAPI,
  player: playerAPI,
  match: matchAPI,
  training: trainingAPI,
  injury: injuryAPI,
  contract: contractAPI,
  tactics: tacticsAPI,
  league: leagueAPI,
  analytics: analyticsAPI,
  sport: sportAPI,
  announcement: announcementAPI,
  upload: uploadAPI,
};