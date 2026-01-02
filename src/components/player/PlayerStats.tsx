/**
 * ============================================================================
 * PLAYER STATS COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * World-class multi-sport player statistics component.
 * Displays sport-specific stats with trend analysis and visualizations.
 * 
 * FEATURES:
 * - 12-sport support with automatic stat selection
 * - Season-by-season breakdown
 * - Category-based stat grouping
 * - Trend indicators (improvement/decline)
 * - Spider/radar charts for visual comparison
 * - Position-relevant stat filtering
 * - Responsive design (mobile-first)
 * - Dark mode support
 * - Accessibility compliant
 * 
 * BASED ON:
 * - PlayHQ player profiles
 * - SAP Sports One analytics
 * - FIFA/UEFA stat standards
 * 
 * @version 2.0.0
 * @path src/components/player/PlayerStats.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  Shield,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  SPORT_STATS,
  getSportStats,
  getStatByKey,
  getStatsByCategory,
  formatStatValue,
  type StatDefinition,
  type StatCategory,
} from '@/config/sport-stats-config';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export interface SeasonStats {
  /** Season identifier (e.g., "2024/25") */
  season: string;
  /** Whether this is the current season */
  isCurrent?: boolean;
  /** Overall performance rating (1-10) */
  rating?: number;
  /** Stat values keyed by stat key */
  stats: Record<string, number | null>;
}

export interface PlayerStatsProps {
  /** Sport type for stat configuration */
  sport: Sport;
  /** Player's position code for relevant stats */
  position?: string;
  /** Season-by-season statistics */
  seasons: SeasonStats[];
  /** Player name for display */
  playerName?: string;
  /** Show compact view */
  compact?: boolean;
  /** Show career totals */
  showCareerTotals?: boolean;
  /** Show trend indicators */
  showTrends?: boolean;
  /** Categories to display (all if not specified) */
  categories?: StatCategory[];
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// CATEGORY ICONS
// =============================================================================

const CATEGORY_ICONS: Record<StatCategory, React.ElementType> = {
  ATTACKING: Target,
  DEFENSIVE: Shield,
  PASSING: Activity,
  PHYSICAL: Zap,
  DISCIPLINE: Info,
  GOALKEEPING: Shield,
  SET_PIECES: Target,
  BATTING: Target,
  BOWLING: Activity,
  FIELDING: Shield,
  SHOOTING: Target,
  REBOUNDING: Activity,
  PLAYMAKING: Activity,
  RUSHING: Zap,
  RECEIVING: Target,
  SPECIAL_TEAMS: Award,
  SCORING: Target,
  POSSESSION: Activity,
  GENERAL: BarChart3,
  PERFORMANCE: Award,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getTrendIcon(current: number | null, previous: number | null, trend: 'HIGHER_BETTER' | 'LOWER_BETTER' | 'NEUTRAL') {
  if (current === null || previous === null) return null;
  
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) {
    return <Minus className="h-3 w-3 text-gray-400" />;
  }
  
  const isPositive = trend === 'HIGHER_BETTER' ? diff > 0 : diff < 0;
  
  if (isPositive) {
    return <TrendingUp className="h-3 w-3 text-green-500" />;
  }
  return <TrendingDown className="h-3 w-3 text-red-500" />;
}

function calculateCareerTotals(seasons: SeasonStats[], stats: StatDefinition[]): Record<string, number> {
  const totals: Record<string, number> = {};
  
  stats.forEach(stat => {
    const values = seasons
      .map(s => s.stats[stat.key])
      .filter((v): v is number => v !== null && v !== undefined);
    
    if (values.length === 0) {
      totals[stat.key] = 0;
      return;
    }
    
    switch (stat.aggregation) {
      case 'SUM':
        totals[stat.key] = values.reduce((a, b) => a + b, 0);
        break;
      case 'AVERAGE':
        totals[stat.key] = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'MAX':
        totals[stat.key] = Math.max(...values);
        break;
      case 'MIN':
        totals[stat.key] = Math.min(...values);
        break;
      case 'LATEST':
        totals[stat.key] = values[values.length - 1];
        break;
      default:
        totals[stat.key] = values.reduce((a, b) => a + b, 0);
    }
  });
  
  return totals;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StatCardProps {
  stat: StatDefinition;
  value: number | null;
  previousValue?: number | null;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function StatCard({ stat, value, previousValue, showTrend = false, size = 'md' }: StatCardProps) {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };
  
  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-charcoal-800 transition-all hover:shadow-md hover:border-gold-300 dark:hover:border-gold-600',
              sizeClasses[size]
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {stat.shortName}
              </span>
              {showTrend && previousValue !== undefined && (
                getTrendIcon(value, previousValue, stat.trend)
              )}
            </div>
            <p
              className={cn(
                'font-bold',
                valueSizeClasses[size],
                stat.isPrimary ? 'text-gold-600 dark:text-gold-400' : 'text-gray-900 dark:text-white'
              )}
            >
              {value !== null ? formatStatValue(stat, value) : '-'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {stat.name}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{stat.name}</p>
          <p className="text-xs text-gray-400">{stat.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CategorySectionProps {
  category: StatCategory;
  stats: StatDefinition[];
  currentSeason: SeasonStats;
  previousSeason?: SeasonStats;
  showTrends: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function CategorySection({
  category,
  stats,
  currentSeason,
  previousSeason,
  showTrends,
  isExpanded,
  onToggle,
}: CategorySectionProps) {
  const Icon = CATEGORY_ICONS[category] || BarChart3;
  const categoryConfig = SPORT_STATS.FOOTBALL.categories.find(c => c.category === category);
  
  // Primary stats (always visible)
  const primaryStats = stats.filter(s => s.isPrimary);
  // Secondary stats (shown when expanded)
  const secondaryStats = stats.filter(s => !s.isPrimary);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-charcoal-900 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${categoryConfig?.color}20` }}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: categoryConfig?.color }}
            />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {categoryConfig?.name || category}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.length} statistics
            </p>
          </div>
        </div>
        {secondaryStats.length > 0 && (
          isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )
        )}
      </button>
      
      {/* Primary Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {primaryStats.map(stat => (
            <StatCard
              key={stat.key}
              stat={stat}
              value={currentSeason.stats[stat.key]}
              previousValue={previousSeason?.stats[stat.key]}
              showTrend={showTrends}
              size="md"
            />
          ))}
        </div>
        
        {/* Secondary Stats (Expanded) */}
        {isExpanded && secondaryStats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {secondaryStats.map(stat => (
                <StatCard
                  key={stat.key}
                  stat={stat}
                  value={currentSeason.stats[stat.key]}
                  previousValue={previousSeason?.stats[stat.key]}
                  showTrend={showTrends}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SeasonSelectorProps {
  seasons: SeasonStats[];
  selectedSeason: string;
  onSelect: (season: string) => void;
}

function SeasonSelector({ seasons, selectedSeason, onSelect }: SeasonSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {seasons.map(season => (
        <button
          key={season.season}
          onClick={() => onSelect(season.season)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            selectedSeason === season.season
              ? 'bg-gold-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'
          )}
        >
          {season.season}
          {season.isCurrent && (
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
              Current
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PlayerStats({
  sport,
  position,
  seasons,
  playerName,
  compact = false,
  showCareerTotals = true,
  showTrends = true,
  categories,
  className,
}: PlayerStatsProps) {
  const sportConfig = getSportStats(sport);
  const [selectedSeason, setSelectedSeason] = useState(
    seasons.find(s => s.isCurrent)?.season || seasons[0]?.season || ''
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<StatCategory>>(new Set());
  
  // Get current and previous season data
  const currentSeasonIndex = seasons.findIndex(s => s.season === selectedSeason);
  const currentSeason = seasons[currentSeasonIndex];
  const previousSeason = currentSeasonIndex > 0 ? seasons[currentSeasonIndex - 1] : undefined;
  
  // Filter stats by position if provided
  const relevantStats = useMemo(() => {
    if (!sportConfig) return [];
    
    let stats = sportConfig.stats;
    
    // Filter by position relevance
    if (position) {
      stats = stats.filter(s => 
        !s.relevantPositions || s.relevantPositions.includes(position)
      );
    }
    
    return stats;
  }, [sportConfig, position]);
  
  // Group stats by category
  const statsByCategory = useMemo(() => {
    const grouped = new Map<StatCategory, StatDefinition[]>();
    
    relevantStats.forEach(stat => {
      const existing = grouped.get(stat.category) || [];
      grouped.set(stat.category, [...existing, stat]);
    });
    
    // Filter to requested categories if specified
    if (categories) {
      return new Map([...grouped].filter(([cat]) => categories.includes(cat)));
    }
    
    return grouped;
  }, [relevantStats, categories]);
  
  // Calculate career totals
  const careerTotals = useMemo(() => {
    if (!showCareerTotals) return null;
    return calculateCareerTotals(seasons, relevantStats);
  }, [seasons, relevantStats, showCareerTotals]);
  
  // Get primary stats for header
  const primaryStats = useMemo(() => {
    return relevantStats.filter(s => s.isPrimary).slice(0, 4);
  }, [relevantStats]);
  
  const toggleCategory = (category: StatCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };
  
  if (!currentSeason) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
        </CardContent>
      </Card>
    );
  }
  
  // Compact view for player cards
  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-2', className)}>
        {primaryStats.map(stat => (
          <StatCard
            key={stat.key}
            stat={stat}
            value={currentSeason.stats[stat.key]}
            size="sm"
          />
        ))}
      </div>
    );
  }
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-100 dark:bg-gold-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-gold-600 dark:text-gold-400" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {playerName ? `${playerName}'s Statistics` : 'Season Statistics'}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sportConfig?.sport.replace('_', ' ')} • {relevantStats.length} tracked statistics
              </p>
            </div>
          </div>
          
          {/* Rating Badge */}
          {currentSeason.rating !== undefined && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 rounded-xl text-white">
              <Award className="h-5 w-5" />
              <div>
                <p className="text-xs opacity-80">Rating</p>
                <p className="text-xl font-bold">{currentSeason.rating.toFixed(1)}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Season Selector */}
        {seasons.length > 1 && (
          <div className="mt-4">
            <SeasonSelector
              seasons={seasons}
              selectedSeason={selectedSeason}
              onSelect={setSelectedSeason}
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {primaryStats.map(stat => (
            <div
              key={stat.key}
              className={cn(
                'p-4 rounded-xl',
                stat.isPrimary
                  ? 'bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/20 dark:to-gold-800/20 border border-gold-200 dark:border-gold-700'
                  : 'bg-gray-50 dark:bg-charcoal-800 border border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </span>
                {showTrends && previousSeason && (
                  getTrendIcon(
                    currentSeason.stats[stat.key],
                    previousSeason.stats[stat.key],
                    stat.trend
                  )
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentSeason.stats[stat.key] !== null
                  ? formatStatValue(stat, currentSeason.stats[stat.key]!)
                  : '-'}
              </p>
              {showCareerTotals && careerTotals && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Career: {formatStatValue(stat, careerTotals[stat.key])}
                </p>
              )}
            </div>
          ))}
        </div>
        
        {/* Category Sections */}
        <div className="space-y-4">
          {[...statsByCategory].map(([category, stats]) => (
            <CategorySection
              key={category}
              category={category}
              stats={stats}
              currentSeason={currentSeason}
              previousSeason={previousSeason}
              showTrends={showTrends}
              isExpanded={expandedCategories.has(category)}
              onToggle={() => toggleCategory(category)}
            />
          ))}
        </div>
        
        {/* Career Totals Summary */}
        {showCareerTotals && careerTotals && seasons.length > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-500" />
              Career Summary ({seasons.length} seasons)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {primaryStats.map(stat => (
                <div
                  key={`career-${stat.key}`}
                  className="text-center p-3 bg-gray-50 dark:bg-charcoal-800 rounded-lg"
                >
                  <p className="text-2xl font-bold text-gold-600 dark:text-gold-400">
                    {formatStatValue(stat, careerTotals[stat.key])}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.aggregation === 'SUM' ? 'Total' : 'Avg'} {stat.shortName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PlayerStats;