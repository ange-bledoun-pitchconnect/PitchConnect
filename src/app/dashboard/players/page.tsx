// ============================================================================
// PAGE: /app/dashboard/players - WORLD-CLASS IMPLEMENTATION
// Purpose: Real-time player analytics dashboard with charts & controls
// Status: Production-ready, Phase 3 implementation
// ============================================================================

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, TrendingUp, Users, Target, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// IMPORTS - COMPONENTS
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

interface PlayerAnalyticsData {
  id: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    preferredFoot: string;
    shirtNumber?: number;
    photo?: string;
    status: string;
  };
  stats: {
    season: number;
    appearances: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    passingAccuracy?: number;
    tackles?: number;
    interceptions?: number;
    blocks?: number;
    foulsCommitted?: number;
    yellowCards?: number;
    redCards?: number;
  };
  ratings: {
    overall: number;
    passing: number;
    shooting: number;
    defending: number;
    physical: number;
  };
  performance: {
    form: string;
    trend: 'improving' | 'stable' | 'declining';
    consistency: number;
  };
  injuries: {
    activeInjuries: number;
    injuryRisk: 'low' | 'medium' | 'high' | 'critical';
    injuryPrediction?: string;
  };
}

interface DashboardFilters {
  teamId?: string;
  leagueId?: string;
  season: number;
  sport: string;
  position?: string;
  sort: 'rating' | 'goals' | 'assists' | 'minutesPlayed';
  limit: number;
}

interface DashboardState {
  filters: DashboardFilters;
  selectedPlayers: string[];
  viewMode: 'list' | 'grid' | 'comparison';
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
];

const FORM_COLORS = {
  EXCELLENT: '#10b981',
  GOOD: '#3b82f6',
  SATISFACTORY: '#f59e0b',
  MODERATE: '#ef4444',
  POOR: '#dc2626',
};

const INJURY_COLORS = {
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

// ============================================================================
// COMPONENT: STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  title,
  value,
  unit,
  trend,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: color || '#3b82f6' }}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {unit && <p className="text-sm text-gray-500">{unit}</p>}
            </div>
          </div>
          <div className="text-gray-400">{Icon}</div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className={cn(
              'h-4 w-4',
              trend === 'up' && 'text-green-500',
              trend === 'down' && 'text-red-500',
              trend === 'stable' && 'text-yellow-500',
            )} />
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

function PlayerRow({ player, onSelect }: { player: PlayerAnalyticsData; onSelect?: () => void }) {
  const fullName = `${player.player.firstName} ${player.player.lastName}`;
  
  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onSelect}
    >
      {/* Player Info */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          {player.player.photo && (
            <img
              src={player.player.photo}
              alt={fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-semibold">{fullName}</p>
            <p className="text-xs text-gray-500">#{player.player.shirtNumber}</p>
          </div>
        </div>
      </TableCell>

      {/* Position */}
      <TableCell>
        <Badge variant="outline" style={{ backgroundColor: POSITIONS_COLORS[player.player.position] + '20', borderColor: POSITIONS_COLORS[player.player.position] }}>
          {player.player.position}
        </Badge>
      </TableCell>

      {/* Stats */}
      <TableCell className="text-center">
        <span className="font-semibold">{player.stats.appearances}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-semibold">{player.stats.goals}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-semibold">{player.stats.assists || 0}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm">{Math.round(player.stats.minutesPlayed / 60)}h</span>
      </TableCell>

      {/* Rating */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-lg">{player.ratings.overall}</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(player.ratings.overall / 10) * 100}%` }}
            />
          </div>
        </div>
      </TableCell>

      {/* Form */}
      <TableCell className="text-center">
        <Badge style={{ backgroundColor: FORM_COLORS[player.performance.form as keyof typeof FORM_COLORS] + '20', color: FORM_COLORS[player.performance.form as keyof typeof FORM_COLORS] }}>
          {player.performance.form}
        </Badge>
      </TableCell>

      {/* Injury */}
      <TableCell className="text-center">
        <Badge variant="outline" style={{ backgroundColor: INJURY_COLORS[player.injuries.injuryRisk] + '20', borderColor: INJURY_COLORS[player.injuries.injuryRisk] }}>
          {player.injuries.activeInjuries > 0 ? '🏥 ' : '✓ '}
          {player.injuries.injuryRisk}
        </Badge>
      </TableCell>
    </TableRow>
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
      limit: 100,
    },
    selectedPlayers: [],
    viewMode: 'list',
  });

  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // =========================================================================
  // API QUERY
  // =========================================================================

  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['players-analytics', dashboardState.filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(dashboardState.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/analytics/players?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch player analytics');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,    // 10 minutes
    refetchOnWindowFocus: false,
  });

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleFilterChange = useCallback((key: keyof DashboardFilters, value: any) => {
    setDashboardState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  }, []);

  const handlePlayerSelect = useCallback((playerId: string) => {
    setDashboardState(prev => ({
      ...prev,
      selectedPlayers: prev.selectedPlayers.includes(playerId)
        ? prev.selectedPlayers.filter(id => id !== playerId)
        : [...prev.selectedPlayers, playerId],
    }));
  }, []);

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
    const total = status.healthySquad + status.playersAtRisk + (status.activeInjuries > 0 ? status.activeInjuries : 0);
    return [
      { name: 'Healthy', value: status.healthySquad, fill: '#10b981' },
      { name: 'At Risk', value: status.playersAtRisk, fill: '#f59e0b' },
      { name: 'Injured', value: status.activeInjuries, fill: '#ef4444' },
    ];
  }, [analyticsData]);

  const performanceScatterData = useMemo(() => {
    return analyticsData?.data?.players?.map(p => ({
      name: `${p.player.firstName.charAt(0)}. ${p.player.lastName}`,
      goals: p.stats.goals,
      rating: p.ratings.overall,
      position: p.player.position,
    })) ?? [];
  }, [analyticsData]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-8 pb-8">
      {/* ===================================================================== */
      /* HEADER */
      {/* ===================================================================== */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Player Analytics</h1>
        <p className="mt-2 text-gray-600">
          Real-time player performance metrics, statistics, and insights
        </p>
      </div>

      {/* ===================================================================== */
      /* FILTERS & CONTROLS */
      {/* ===================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
          <CardDescription>Customize your analytics view</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Season */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Season</label>
              <Select
                value={String(dashboardState.filters.season)}
                onValueChange={(v) => handleFilterChange('season', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022, 2021].map((year) => (
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
              <Select value={dashboardState.filters.sport} onValueChange={(v) => handleFilterChange('sport', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOOTBALL">Football</SelectItem>
                  <SelectItem value="NETBALL">Netball</SelectItem>
                  <SelectItem value="RUGBY">Rugby</SelectItem>
                  <SelectItem value="CRICKET">Cricket</SelectItem>
                  <SelectItem value="BASKETBALL">Basketball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Select value={dashboardState.filters.position || 'ALL'} onValueChange={(v) => handleFilterChange('position', v === 'ALL' ? undefined : v)}>
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
              <Select value={dashboardState.filters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
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

          {/* View Mode */}
          <div className="flex gap-2">
            <Button
              variant={dashboardState.viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setDashboardState(prev => ({ ...prev, viewMode: 'list' }))}
            >
              List View
            </Button>
            <Button
              variant={dashboardState.viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setDashboardState(prev => ({ ...prev, viewMode: 'grid' }))}
            >
              Grid View
            </Button>
            <Button
              variant={dashboardState.viewMode === 'comparison' ? 'default' : 'outline'}
              onClick={() => setDashboardState(prev => ({ ...prev, viewMode: 'comparison' }))}
            >
              Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================== */
      /* KEY METRICS */
      {/* ===================================================================== */}
      {!isLoading && analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            title="Total Players"
            value={analyticsData.data.aggregates.totalPlayers}
            color="#3b82f6"
          />
          <StatCard
            icon={<Target className="h-6 w-6" />}
            title="Avg Rating"
            value={analyticsData.data.aggregates.averageOverallRating}
            unit="/10"
            color="#10b981"
            trend="up"
          />
          <StatCard
            icon={<Heart className="h-6 w-6" />}
            title="Injuries"
            value={analyticsData.data.aggregates.injuryStatus.activeInjuries}
            color={analyticsData.data.aggregates.injuryStatus.activeInjuries > 0 ? '#ef4444' : '#10b981'}
          />
          <StatCard
            icon={<AlertCircle className="h-6 w-6" />}
            title="At Risk"
            value={analyticsData.data.aggregates.injuryStatus.playersAtRisk}
            color="#f59e0b"
          />
        </div>
      )}

      {/* ===================================================================== */
      /* CHARTS */
      {/* ===================================================================== */}
      {!isLoading && analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Scorers Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Scorers</CardTitle>
              <CardDescription>Goals by top players</CardDescription>
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
              <CardTitle>Position Distribution</CardTitle>
              <CardDescription>Players by position</CardDescription>
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
              <CardTitle>Injury Status</CardTitle>
              <CardDescription>Squad health overview</CardDescription>
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
              <CardTitle>Performance vs Goals</CardTitle>
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

      {/* ===================================================================== */
      /* PLAYERS TABLE / LIST */
      {/* ===================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
          <CardDescription>
            {analyticsData?.data?.pagination?.total} players • {analyticsData?.meta?.queryTime}ms
          </CardDescription>
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
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-center">Appearances</TableHead>
                    <TableHead className="text-center">Goals</TableHead>
                    <TableHead className="text-center">Assists</TableHead>
                    <TableHead className="text-center">Minutes</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Form</TableHead>
                    <TableHead className="text-center">Injury</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.data.players.map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      onSelect={() => handlePlayerSelect(player.player.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================================================================== */
      /* PAGINATION */
      {/* ===================================================================== */}
      {analyticsData?.data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {analyticsData.data.pagination.currentPage} of {analyticsData.data.pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={analyticsData.data.pagination.currentPage === 1}
              onClick={() => handleFilterChange('limit', Math.max(0, dashboardState.filters.limit - 100))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={analyticsData.data.pagination.currentPage >= analyticsData.data.pagination.pages}
              onClick={() => handleFilterChange('limit', dashboardState.filters.limit + 100)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}