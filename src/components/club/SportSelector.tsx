// ============================================================================
// ⚽ SPORT SELECTOR - PitchConnect v7.3.0
// ============================================================================
// Component for selecting a sport during club creation
// Displays sport icons, features, and configuration info
// ============================================================================

'use client';

import { useState } from 'react';
import { Check, Users, Timer, Award, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { SPORT_CONFIGS, type SportKey } from '@/config/sport-config';
import type { Sport } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface SportSelectorProps {
  value?: Sport;
  onChange: (sport: Sport) => void;
  disabled?: boolean;
  showDetails?: boolean;
}

// ============================================================================
// SPORT ICONS
// ============================================================================

const SPORT_ICONS: Record<SportKey, string> = {
  FOOTBALL: '⚽',
  BASKETBALL: '🏀',
  RUGBY_UNION: '🏉',
  RUGBY_LEAGUE: '🏉',
  AMERICAN_FOOTBALL: '🏈',
  ICE_HOCKEY: '🏒',
  FIELD_HOCKEY: '🏑',
  VOLLEYBALL: '🏐',
  HANDBALL: '🤾',
  BASEBALL: '⚾',
  CRICKET: '🏏',
  LACROSSE: '🥍',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SportSelector({
  value,
  onChange,
  disabled = false,
  showDetails = true,
}: SportSelectorProps) {
  const [hoveredSport, setHoveredSport] = useState<SportKey | null>(null);

  const sports = Object.entries(SPORT_CONFIGS) as [SportKey, typeof SPORT_CONFIGS[SportKey]][];

  // Get details for selected or hovered sport
  const detailSport = hoveredSport || value;
  const detailConfig = detailSport ? SPORT_CONFIGS[detailSport as SportKey] : null;

  return (
    <div className="space-y-4">
      <Label>Select Sport *</Label>
      
      {/* Sport Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {sports.map(([key, config]) => {
          const isSelected = value === key;
          const icon = SPORT_ICONS[key] || '🎯';

          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(key as Sport)}
                    onMouseEnter={() => setHoveredSport(key)}
                    onMouseLeave={() => setHoveredSport(null)}
                    className={cn(
                      'relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-3xl mb-2">{icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">
                      {config.name}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{config.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {config.positions.length} positions • {config.matchDuration}min matches
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Sport Details */}
      {showDetails && detailConfig && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{SPORT_ICONS[detailSport as SportKey] || '🎯'}</span>
              <div>
                <CardTitle>{detailConfig.name}</CardTitle>
                <CardDescription>Sport Configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-semibold">{detailConfig.squadSize.min}-{detailConfig.squadSize.max}</div>
                <div className="text-xs text-muted-foreground">Squad Size</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Timer className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-semibold">{detailConfig.matchDuration}</div>
                <div className="text-xs text-muted-foreground">Match (mins)</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Award className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-semibold">{detailConfig.positions.length}</div>
                <div className="text-xs text-muted-foreground">Positions</div>
              </div>
            </div>

            {/* Positions */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Available Positions</Label>
              <div className="flex flex-wrap gap-1.5">
                {detailConfig.positions.slice(0, 12).map((position) => (
                  <Badge key={position.key} variant="secondary" className="text-xs">
                    {position.abbreviation || position.name}
                  </Badge>
                ))}
                {detailConfig.positions.length > 12 && (
                  <Badge variant="outline" className="text-xs">
                    +{detailConfig.positions.length - 12} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Training Categories */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Training Categories</Label>
              <div className="flex flex-wrap gap-1.5">
                {detailConfig.trainingCategories.slice(0, 8).map((category) => (
                  <Badge key={category.category} variant="outline" className="text-xs">
                    {category.icon} {category.label}
                  </Badge>
                ))}
                {detailConfig.trainingCategories.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{detailConfig.trainingCategories.length - 8} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats Tracked */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Performance Stats</Label>
              <div className="flex flex-wrap gap-1.5">
                {detailConfig.statsConfig.slice(0, 6).map((stat) => (
                  <Badge key={stat.key} variant="secondary" className="text-xs">
                    {stat.name}
                  </Badge>
                ))}
                {detailConfig.statsConfig.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{detailConfig.statsConfig.length - 6} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-blue-700 dark:text-blue-300">
                All sport configurations include position-specific metrics, training categories, 
                and match statistics tailored for {detailConfig.name.toLowerCase()}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Selection Prompt */}
      {showDetails && !detailConfig && (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-4xl mb-3">🎯</span>
            <p className="text-muted-foreground">
              Select a sport to see configuration details
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

interface SportSelectorCompactProps {
  value?: Sport;
  onChange: (sport: Sport) => void;
  disabled?: boolean;
}

export function SportSelectorCompact({
  value,
  onChange,
  disabled = false,
}: SportSelectorCompactProps) {
  const sports = Object.entries(SPORT_CONFIGS) as [SportKey, typeof SPORT_CONFIGS[SportKey]][];

  return (
    <div className="flex flex-wrap gap-2">
      {sports.map(([key, config]) => {
        const isSelected = value === key;
        const icon = SPORT_ICONS[key] || '🎯';

        return (
          <Button
            key={key}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            disabled={disabled}
            onClick={() => onChange(key as Sport)}
            className={cn(
              'gap-1.5',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            <span>{icon}</span>
            <span>{config.name}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default SportSelector;