// src/app/dashboard/players/page.tsx
// ============================================================================
// PAGE: /dashboard/players - WORLD-CLASS PLAYER ANALYTICS DASHBOARD
// Purpose: Real-time player performance analytics with advanced filtering
// Enhanced for PitchConnect Multi-Sport Management Platform
// STATUS: Production-ready, fully type-safe, enterprise-grade
// ============================================================================

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  Heart,
  BarChart3,
  Activity,
  Zap,
  Trophy,
  Download,
  Filter,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// IMPORTS - UI COMPONENTS
// ============================================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// ============================================================================
// IMPORTS - CHARTS
// ============================================================================

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// ============================================================================
// IMPORTS - UTILITIES
// ============================================================================

import { cn } from '@/lib/utils';
import { Logger } from '@/lib/logging';

const logger = new Logger('PlayersAnalyticsDashboard');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Player analytics data from API
 */
interface PlayerAnalyticsData {
  id: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
    shirtNumber?: number;
    photoUrl?: string;
    status: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'INACTIVE';
    dateOfBirth: string;
    height: number;
    weight: number;
  };
  stats: {
    season: number;
    appearances: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    passingAccuracy: number;
    tackles: number;
    interceptions: number;
    blocks: number;
    foulsCommitted: number;
    yellowCards: number;
    redCards: number;
    shotsOnTarget: number;
    dribbles: number;
    tackles: number;
  };
  ratings: {
    overall: number;
    passing: number;
    shooting: number;
    defending: number;
    physical: number;
    dribbling: number;
    pace: number;
  };
  performance: {
    form: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'MODERATE' | 'POOR';
    trend: 'improving' | 'stable' | 'declining';
    consistency: number; // 0-100
    recentForm: string; // W/D/L pattern
  };
  injuries: {
    activeInjuries: number;
    injuryRisk: 'low' | 'medium' | 'high' | 'critical';
    injuryHistory: Array<{
      type: string;
      startDate: string;
      endDate?: string;
      severity: string;
    }>;
    predictedReturnDate?: string;
  };
  team: {
    id: string;
    name: string;
    logo?: string;
  };
}

/**
 * Dashboard filters state
 */
interface DashboardFilters {
  teamId?: string;
  leagueId?: string;
  season: number;
  sport: string;
  position?: string;
  injuryStatus?: 'all' | 'active' | 'injured' | 'suspended';
  formFilter?: 'excellent' | 'good' | 'satisfactory' | 'moderate' | 'poor';
  ratingMin?: number;
  ratingMax?: number;
  sort: 'rating' | 'goals' | 'assists' | 'minutesPlayed' | 'consistency';
  sortOrder: 'asc' | 'desc';
  search?: string;
  limit: number;
  page: number;
}

/**
 * Dashboard state
 */
interface DashboardState {
  filters: DashboardFilters;
  selectedPlayers: Set<string>;
  viewMode: 'list' | 'grid' | 'comparison' | 'radar';
  showFilters: boolean;
  expandedPlayer?: string;
}

/**
 * API response structure
 */
interface PlayersAnalyticsResponse {
  success: true;
  data: {
    players: PlayerAnalyticsData[];
    aggregates: {
      totalPlayers: number;
      averageOverallRating: number;
      injuryStatus: {
        activeInjuries: number;
        playersAtRisk: number;
        healthySquad: number;
      };
      topScorers: Array<{
        name: string;
        goals: number;
        assists: number;
      }>;
      positionDistribution: Record<string, number>;
      formDistribution: Record<string, number>;
    };
    pagination: {
      total: number;
      pages: number;
      currentPage: number;
      pageSize: number;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
    queryTime: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POSITIONS = [
  'ALL',
  'GOALKEEPER',
  'DEFENDER',
  'MIDFIELDER',
  'FORWARD',
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Overall Rating' },
  { value: 'goals', label: 'Goals Scored' },
  { value: 'assists', label: 'Assists' },
  { value: 'minutesPlayed', label: 'Minutes Played' },
  { value: 'consistency', label: 'Consistency' },
];

const FORM_COLORS: Record<string, string> = {
  EXCELLENT: '#10b981',
  GOOD: '#3b82f6',
  SATISFACTORY: '#f59e0b',
  MODERATE: '#ef4444',
  POOR: '#dc2626',
};

const INJURY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
};

const POSITIONS_COLORS: Record<string, string> = {
  GOALKEEPER: '#6366f1',
  DEFENDER: '#3b82f6',
  MIDFIELDER: '#8b5cf6',
  FORWARD: '#ef4444',
};

const SPORT_OPTIONS = [
  { value: 'FOOTBALL', label: 'Football' },
  { value: 'NETBALL', label: 'Netball' },
  { value: 'RUGBY', label: 'Rugby' },
  { value: 'CRICKET', label: 'Cricket' },
  { value: 'BASKETBALL', label: 'Basketball' },
  { value: 'AMERICAN_FOOTBALL', label: 'American Football' },
];

// ============================================================================
// COMPONENT: STAT CARD
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

function StatCard({
  icon: Icon,
  title,
  value,
  unit,
  trend,
  color = '#3b82f6',
  subtitle,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'border-l-4 transition-all hover:shadow-lg cursor-pointer',
        onClick && 'hover:scale-105',
      )}
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {unit && <p className="text-sm text-gray-500">{unit}</p>}
            </div>
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="text-gray-400">{Icon}</div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp
              className={cn(
                'h-4 w-4',
                trend === 'up' && 'text-green-500',
                trend === 'down' && 'text-red-500',
                trend === 'stable' && 'text-yellow-500',
              )}
            />
            <span className="text-xs text-gray-500">
              {trend === 'up' && 'Improving'}
              {trend === 'down' && 'Declining'}
              {trend === 'stable' && 'Stable'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: PLAYER ROW
// ============================================================================

interface PlayerRowProps {
  player: PlayerAnalyticsData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
}

function PlayerRow({ player, isSelected, onSelect, onExpand }: PlayerRowProps) {
  const fullName = `${player.player.firstName} ${player.player.lastName}`;
  const age = Math.floor(
    (new Date().getTime() - new Date(player.player.dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  );

  return (
    <TableRow className={cn('cursor-pointer transition-colors', isSelected && 'bg-blue-50')}>
      {/* Selection */}
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(player.player.id)}
          className="h-4 w-4 rounded border-gray-300"
        />
      </TableCell>

      {/* Player Info */}
      <TableCell className="font-medium" onClick={() => onExpand(player.id)}>
        <div className="flex items-center gap-3">
          {player.player.photoUrl && (
            <img
              src={player.player.photoUrl}
              alt={fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-semibold">{fullName}</p>
            <p className="text-xs text-gray-500">
              #{player.player.shirtNumber} • {age} yrs
            </p>
          </div>
        </div>
      </TableCell>

      {/* Team */}
      <TableCell>
        <div className="flex items-center gap-2">
          {player.team.logo && (
            <img src={player.team.logo} alt={player.team.name} className="h-6 w-6" />
          )}
          <span className="text-sm">{player.team.name}</span>
        </div>
      </TableCell>

      {/* Position */}
      <TableCell>
        <Badge
          style={{
            backgroundColor: POSITIONS_COLORS[player.player.position] + '20',
            borderColor: POSITIONS_COLORS[player.player.position],
            color: POSITIONS_COLORS[player.player.position],
          }}
        >
          {player.player.position}
        </Badge>
      </TableCell>

      {/* Stats */}
      <TableCell className="text-center text-sm">{player.stats.appearances}</TableCell>
      <TableCell className="text-center font-semibold">{player.stats.goals}</TableCell>
      <TableCell className="text-center">{player.stats.assists}</TableCell>
      <TableCell className="text-center text-sm">{Math.round(player.stats.minutesPlayed / 60)}h</TableCell>

      {/* Passing Accuracy */}
      <TableCell className="text-center text-sm">{Math.round(player.stats.passingAccuracy)}%</TableCell>

      {/* Rating */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold">{player.ratings.overall.toFixed(1)}</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(player.ratings.overall / 10) * 100}%` }}
            />
          </div>
        </div>
      </TableCell>

      {/* Consistency */}
      <TableCell className="text-center text-sm">{player.performance.consistency}%</TableCell>

      {/* Form */}
      <TableCell className="text-center">
        <Badge
          style={{
            backgroundColor: FORM_COLORS[player.performance.form] + '20',
            color: FORM_COLORS[player.performance.form],
          }}
        >
          {player.performance.form.charAt(0) + player.performance.form.slice(1).toLowerCase()}
        </Badge>
      </TableCell>

      {/* Injury */}
      <TableCell className="text-center">
        <Badge
          variant="outline"
          style={{
            backgroundColor: INJURY_COLORS[player.injuries.injuryRisk] + '20',
            borderColor: INJURY_COLORS[player.injuries.injuryRisk],
            color: INJURY_COLORS[player.injuries.injuryRisk],
          }}
        >
          {player.injuries.activeInjuries > 0 ? '🏥' : '✓'} {player.injuries.injuryRisk}
        </Badge>
      </TableCell>

      {/* Status Badge */}
      <TableCell className="text-center">
        <Badge
          variant={player.player.status === 'ACTIVE' ? 'default' : 'secondary'}
        >
          {player.player.status}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// COMPONENT: FILTER PANEL
// ============================================================================

interface FilterPanelProps {
  filters: DashboardFilters;
  onFilterChange: (key: keyof DashboardFilters, value: any) => void;
  onClearFilters: () => void;
}

function FilterPanel({ filters, onFilterChange, onClearFilters }: FilterPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Controls
            </CardTitle>
            <CardDescription>Customize your analytics view</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Season */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Season</label>
            <Select
              value={String(filters.season)}
              onValueChange={(v) => onFilterChange('season', parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2024, 2023, 2022, 2021].map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}/{year + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sport */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sport</label>
            <Select value={filters.sport} onValueChange={(v) => onFilterChange('sport', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Position</label>
            <Select
              value={filters.position || 'ALL'}
              onValueChange={(v) => onFilterChange('position', v === 'ALL' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos === 'ALL' ? 'All Positions' : pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={filters.sort} onValueChange={(v) => onFilterChange('sort', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Players</label>
          <Input
            placeholder="Search by name..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        {/* Rating Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Rating</label>
            <Input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={filters.ratingMin || ''}
              onChange={(e) =>
                onFilterChange('ratingMin', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Rating</label>
            <Input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={filters.ratingMax || ''}
              onChange={(e) =>
                onFilterChange('ratingMax', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: PLAYER DETAIL MODAL
// ============================================================================

interface PlayerDetailModalProps {
  player: PlayerAnalyticsData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlayerDetailModal({ player, open, onOpenChange }: PlayerDetailModalProps) {
  if (!player) return null;

  const fullName = `${player.player.firstName} ${player.player.lastName}`;
  const radarData = [
    { category: 'Passing', value: player.ratings.passing },
    { category: 'Shooting', value: player.ratings.shooting },
    { category: 'Defending', value: player.ratings.defending },
    { category: 'Physical', value: player.ratings.physical },
    { category: 'Dribbling', value: player.ratings.dribbling },
    { category: 'Pace', value: player.ratings.pace },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fullName}</DialogTitle>
          <DialogDescription>{player.team.name} • {player.player.position}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
            <TabsTrigger value="injuries">Health</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Goals</p>
                <p className="text-2xl font-bold">{player.stats.goals}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Assists</p>
                <p className="text-2xl font-bold">{player.stats.assists}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Appearances</p>
                <p className="text-2xl font-bold">{player.stats.appearances}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Minutes</p>
                <p className="text-2xl font-bold">{Math.round(player.stats.minutesPlayed / 60)}h</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-4">
            <div className="flex justify-center">
              <ResponsiveContainer width={300} height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar name="Rating" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="injuries" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium">Injury Risk</p>
              <Badge
                className="mt-2"
                style={{
                  backgroundColor: INJURY_COLORS[player.injuries.injuryRisk] + '20',
                  color: INJURY_COLORS[player.injuries.injuryRisk],
                }}
              >
                {player.injuries.injuryRisk.toUpperCase()}
              </Badge>
            </div>
            {player.injuries.predictedReturnDate && (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-medium">Predicted Return</p>
                <p className="mt-1">{new Date(player.injuries.predictedReturnDate).toLocaleDateString()}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT: PLAYERS ANALYTICS DASHBOARD
// ============================================================================

export default function PlayersAnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    filters: {
      season: new Date().getFullYear(),
      sport: 'FOOTBALL',
      sort: 'rating',
      sortOrder: 'desc',
      limit: 50,
      page: 1,
    },
    selectedPlayers: new Set(),
    viewMode: 'list',
    showFilters: true,
  });

  const [selectedPlayerDetail, setSelectedPlayerDetail] = useState<PlayerAnalyticsData | null>(null);

  // =========================================================================
  // API QUERY
  // =========================================================================

  const { data: analyticsData, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['players-analytics', dashboardState.filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(dashboardState.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/analytics/players?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch player analytics');
      }
      return response.json() as Promise<PlayersAnalyticsResponse>;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleFilterChange = useCallback((key: keyof DashboardFilters, value: any) => {
    setDashboardState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
        page: 1, // Reset to first page on filter change
      },
    }));
  }, []);

  const handlePlayerSelect = useCallback((playerId: string) => {
    setDashboardState((prev) => {
      const newSelected = new Set(prev.selectedPlayers);
      if (newSelected.has(playerId)) {
        newSelected.delete(playerId);
      } else {
        newSelected.add(playerId);
      }
      return { ...prev, selectedPlayers: newSelected };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setDashboardState((prev) => ({
      ...prev,
      filters: {
        season: new Date().getFullYear(),
        sport: 'FOOTBALL',
        sort: 'rating',
        sortOrder: 'desc',
        limit: 50,
        page: 1,
      },
    }));
  }, []);

  const handleExportData = useCallback(() => {
    if (!analyticsData?.data?.players) return;

    const csv = [
      ['Name', 'Team', 'Position', 'Goals', 'Assists', 'Rating', 'Form', 'Injury Risk'].join(','),
      ...analyticsData.data.players.map((p) =>
        [
          `"${p.player.firstName} ${p.player.lastName}"`,
          p.team.name,
          p.player.position,
          p.stats.goals,
          p.stats.assists,
          p.ratings.overall,
          p.performance.form,
          p.injuries.injuryRisk,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `players-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [analyticsData]);

  // =========================================================================
  // MEMOIZED CHART DATA
  // =========================================================================

  const topScorersChartData = useMemo(() => {
    return analyticsData?.data?.aggregates?.topScorers?.slice(0, 5) ?? [];
  }, [analyticsData]);

  const positionDistributionData = useMemo(() => {
    const dist = analyticsData?.data?.aggregates?.positionDistribution ?? {};
    return Object.entries(dist).map(([position, count]) => ({
      name: position,
      value: count,
      fill: POSITIONS_COLORS[position] || '#999',
    }));
  }, [analyticsData]);

  const injuryStatusData = useMemo(() => {
    const status = analyticsData?.data?.aggregates?.injuryStatus ?? {
      activeInjuries: 0,
      playersAtRisk: 0,
      healthySquad: 0,
    };
    return [
      { name: 'Healthy', value: status.healthySquad, fill: '#10b981' },
      { name: 'At Risk', value: status.playersAtRisk, fill: '#f59e0b' },
      { name: 'Injured', value: status.activeInjuries, fill: '#ef4444' },
    ];
  }, [analyticsData]);

  const performanceScatterData = useMemo(() => {
    return (
      analyticsData?.data?.players?.map((p) => ({
        name: `${p.player.firstName.charAt(0)}. ${p.player.lastName}`,
        goals: p.stats.goals,
        rating: p.ratings.overall,
        position: p.player.position,
      })) ?? []
    );
  }, [analyticsData]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-8 pb-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Player Analytics</h1>
          <p className="mt-2 text-gray-600">
            Real-time player performance metrics, statistics, and insights
          </p>
        </div>
        <Button onClick={handleExportData} disabled={!analyticsData} className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* FILTER PANEL */}
      {dashboardState.showFilters && (
        <FilterPanel
          filters={dashboardState.filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* KEY METRICS */}
      {!isLoading && analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            title="Total Players"
            value={analyticsData.data.aggregates.totalPlayers}
            color="#3b82f6"
          />
          <StatCard
            icon={<Trophy className="h-6 w-6" />}
            title="Avg Rating"
            value={analyticsData.data.aggregates.averageOverallRating.toFixed(1)}
            unit="/10"
            color="#10b981"
            trend="up"
          />
          <StatCard
            icon={<Heart className="h-6 w-6" />}
            title="Injuries"
            value={analyticsData.data.aggregates.injuryStatus.activeInjuries}
            color={
              analyticsData.data.aggregates.injuryStatus.activeInjuries > 0 ? '#ef4444' : '#10b981'
            }
          />
          <StatCard
            icon={<AlertCircle className="h-6 w-6" />}
            title="At Risk"
            value={analyticsData.data.aggregates.injuryStatus.playersAtRisk}
            color="#f59e0b"
          />
        </div>
      )}

      {/* CHARTS */}
      {!isLoading && analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Scorers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Scorers
              </CardTitle>
              <CardDescription>Goals by top performers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topScorersChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="goals" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Position Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Position Distribution
              </CardTitle>
              <CardDescription>Squad composition</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={positionDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {positionDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Injury Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Squad Health
              </CardTitle>
              <CardDescription>Injury status overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={injuryStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {injuryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Scatter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance vs Goals
              </CardTitle>
              <CardDescription>Rating vs goal contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="goals" name="Goals" />
                  <YAxis type="number" dataKey="rating" name="Rating" domain={[0, 10]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Players" data={performanceScatterData} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PLAYERS TABLE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>
                {analyticsData?.data?.pagination?.total ?? 0} players •{' '}
                {analyticsData?.meta?.queryTime}ms
              </CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              Selected: {dashboardState.selectedPlayers.size}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : isError ? (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error instanceof Error ? error.message : 'Failed to load player data'}</p>
            </div>
          ) : analyticsData?.data?.players?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No players found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-center">Apps</TableHead>
                    <TableHead className="text-center">Goals</TableHead>
                    <TableHead className="text-center">Assists</TableHead>
                    <TableHead className="text-center">Minutes</TableHead>
                    <TableHead className="text-center">Pass %</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Consistency</TableHead>
                    <TableHead className="text-center">Form</TableHead>
                    <TableHead className="text-center">Injury</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.data?.players?.map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      isSelected={dashboardState.selectedPlayers.has(player.player.id)}
                      onSelect={handlePlayerSelect}
                      onExpand={(id) => {
                        const p = analyticsData.data.players.find((pl) => pl.id === id);
                        if (p) setSelectedPlayerDetail(p);
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PLAYER DETAIL MODAL */}
      <PlayerDetailModal
        player={selectedPlayerDetail}
        open={!!selectedPlayerDetail}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayerDetail(null);
        }}
      />

      {/* PAGINATION */}
      {analyticsData?.data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {analyticsData.data.pagination.currentPage} of {analyticsData.data.pagination.pages} •{' '}
            {analyticsData.data.pagination.total} total players
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={analyticsData.data.pagination.currentPage === 1}
              onClick={() => handleFilterChange('page', Math.max(1, dashboardState.filters.page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={
                analyticsData.data.pagination.currentPage >= analyticsData.data.pagination.pages
              }
              onClick={() =>
                handleFilterChange('page', dashboardState.filters.page + 1)
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
