'use client';

// ============================================================================
// 📋 PITCHCONNECT - LINEUP CLIENT COMPONENT
// ============================================================================
// Visual lineup builder with drag-and-drop, formations, and availability checks
// ============================================================================

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Grid,
  List,
  Download,
  Copy,
  Trash2,
  Plus,
  GripVertical,
} from 'lucide-react';
import { Sport, Position, InjurySeverity } from '@prisma/client';
import {
  getSportConfig,
  SPORT_POSITIONS,
  SPORT_SQUAD_CONFIG,
  SPORT_FORMATIONS,
  formatPositionName,
} from '@/lib/sport-config';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface LineupClientProps {
  match: MatchWithRelations;
  lineup: {
    starting: LineupEntry[];
    substitutes: LineupEntry[];
  };
  availablePlayers: TeamPlayerWithRelations[];
  savedFormations: SavedFormation[];
  permissions: {
    canManageLineup: boolean;
    userRole: string;
  };
  sport: Sport;
  isHomeTeam: boolean;
  teamId: string;
}

interface MatchWithRelations {
  id: string;
  status: string;
  scheduledAt: Date;
  homeTeam: {
    id: string;
    name: string;
    club: { id: string; name: string; sport: Sport };
  };
  awayTeam: {
    id: string;
    name: string;
    club: { id: string; name: string; sport: Sport };
  };
  competition: { id: string; name: string } | null;
  venue: { id: string; name: string } | null;
  formation: { id: string; name: string; positions: any } | null;
}

interface LineupEntry {
  id: string;
  position: Position | null;
  jerseyNumber: number | null;
  isStarter: boolean;
  isCaptain: boolean;
  player: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    injuries: { id: string; severity: InjurySeverity }[];
  };
}

interface TeamPlayerWithRelations {
  id: string;
  jerseyNumber: number | null;
  position: Position | null;
  player: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    injuries: { id: string; severity: InjurySeverity; bodyPart: string | null }[];
    availability: { status: string }[];
  };
}

interface SavedFormation {
  id: string;
  name: string;
  formation: string;
  positions: any;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LineupClient({
  match,
  lineup,
  availablePlayers,
  savedFormations,
  permissions,
  sport,
  isHomeTeam,
  teamId,
}: LineupClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sportConfig = getSportConfig(sport);
  const squadConfig = SPORT_SQUAD_CONFIG[sport];

  // State
  const [starting, setStarting] = useState<LineupEntry[]>(lineup.starting);
  const [substitutes, setSubstitutes] = useState<LineupEntry[]>(lineup.substitutes);
  const [selectedFormation, setSelectedFormation] = useState(
    SPORT_FORMATIONS[sport]?.[0]?.id || 'CUSTOM'
  );
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  // Available positions for this sport
  const sportPositions = SPORT_POSITIONS[sport] || [];
  const formations = SPORT_FORMATIONS[sport] || [];

  // Players not in lineup
  const unselectedPlayers = useMemo(() => {
    const selectedIds = new Set([
      ...starting.map((l) => l.player.id),
      ...substitutes.map((l) => l.player.id),
    ]);
    return availablePlayers.filter((tp) => !selectedIds.has(tp.player.id));
  }, [availablePlayers, starting, substitutes]);

  // Validation
  const validation = useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check starting lineup size
    if (starting.length !== squadConfig.starting) {
      issues.push(
        `Starting lineup must have exactly ${squadConfig.starting} players (currently ${starting.length})`
      );
    }

    // Check substitutes limit
    if (substitutes.length > squadConfig.maxSubs) {
      warnings.push(
        `Maximum ${squadConfig.maxSubs} substitutes allowed (currently ${substitutes.length})`
      );
    }

    // Check for injured players
    const injuredStarters = starting.filter(
      (l) => l.player.injuries.length > 0
    );
    if (injuredStarters.length > 0) {
      warnings.push(
        `${injuredStarters.length} injured player(s) in starting lineup`
      );
    }

    // Check for captain
    const hasCaptain = starting.some((l) => l.isCaptain);
    if (!hasCaptain && starting.length > 0) {
      warnings.push('No captain selected');
    }

    return { issues, warnings, isValid: issues.length === 0 };
  }, [starting, substitutes, squadConfig]);

  // Add player to lineup
  const addToStarting = (player: TeamPlayerWithRelations) => {
    if (starting.length >= squadConfig.starting) {
      // Move first player to substitutes
      const [first, ...rest] = starting;
      setSubstitutes([...substitutes, first]);
      setStarting([
        ...rest,
        {
          id: `temp-${player.player.id}`,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          isStarter: true,
          isCaptain: false,
          player: player.player,
        },
      ]);
    } else {
      setStarting([
        ...starting,
        {
          id: `temp-${player.player.id}`,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          isStarter: true,
          isCaptain: false,
          player: player.player,
        },
      ]);
    }
    setHasChanges(true);
  };

  const addToSubstitutes = (player: TeamPlayerWithRelations) => {
    setSubstitutes([
      ...substitutes,
      {
        id: `temp-${player.player.id}`,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        isStarter: false,
        isCaptain: false,
        player: player.player,
      },
    ]);
    setHasChanges(true);
  };

  const removeFromLineup = (playerId: string, isStarter: boolean) => {
    if (isStarter) {
      setStarting(starting.filter((l) => l.player.id !== playerId));
    } else {
      setSubstitutes(substitutes.filter((l) => l.player.id !== playerId));
    }
    setHasChanges(true);
  };

  const toggleCaptain = (playerId: string) => {
    setStarting(
      starting.map((l) => ({
        ...l,
        isCaptain: l.player.id === playerId ? !l.isCaptain : false,
      }))
    );
    setHasChanges(true);
  };

  const updatePosition = (playerId: string, position: Position) => {
    setStarting(
      starting.map((l) =>
        l.player.id === playerId ? { ...l, position } : l
      )
    );
    setHasChanges(true);
  };

  // Save lineup
  const saveLineup = async () => {
    try {
      const response = await fetch(`/api/matches/${match.id}/lineup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          formation: selectedFormation,
          starting: starting.map((l) => ({
            playerId: l.player.id,
            position: l.position,
            jerseyNumber: l.jerseyNumber,
            isCaptain: l.isCaptain,
          })),
          substitutes: substitutes.map((l) => ({
            playerId: l.player.id,
            position: l.position,
            jerseyNumber: l.jerseyNumber,
          })),
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to save lineup:', error);
    }
  };

  // Reset lineup
  const resetLineup = () => {
    setStarting(lineup.starting);
    setSubstitutes(lineup.substitutes);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Match
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Match Lineup
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {match.homeTeam.name} vs {match.awayTeam.name} •{' '}
            {format(new Date(match.scheduledAt), 'PPP')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('pitch')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'pitch'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {permissions.canManageLineup && (
            <>
              <button
                onClick={resetLineup}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={saveLineup}
                disabled={!hasChanges || !validation.isValid}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Lineup
              </button>
            </>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {(validation.issues.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2">
          {validation.issues.map((issue, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300"
            >
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{issue}</span>
            </div>
          ))}
          {validation.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Formation Selector */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Formation:
        </label>
        <select
          value={selectedFormation}
          onChange={(e) => {
            setSelectedFormation(e.target.value);
            setHasChanges(true);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.display}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {starting.length}/{squadConfig.starting} starting •{' '}
          {substitutes.length}/{squadConfig.maxSubs} subs
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pitch View / List View */}
        <div className="lg:col-span-2">
          {viewMode === 'pitch' ? (
            <PitchView
              starting={starting}
              formation={selectedFormation}
              sport={sport}
              canManage={permissions.canManageLineup}
              onRemove={(id) => removeFromLineup(id, true)}
              onToggleCaptain={toggleCaptain}
              onUpdatePosition={updatePosition}
              sportPositions={sportPositions}
            />
          ) : (
            <ListView
              starting={starting}
              substitutes={substitutes}
              canManage={permissions.canManageLineup}
              onRemove={removeFromLineup}
              onToggleCaptain={toggleCaptain}
              onUpdatePosition={updatePosition}
              sportPositions={sportPositions}
            />
          )}
        </div>

        {/* Player Pool */}
        <div className="space-y-4">
          {/* Substitutes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Substitutes ({substitutes.length}/{squadConfig.maxSubs})
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {substitutes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No substitutes selected
                </p>
              ) : (
                substitutes.map((entry) => (
                  <PlayerCard
                    key={entry.player.id}
                    player={entry}
                    canManage={permissions.canManageLineup}
                    onRemove={() => removeFromLineup(entry.player.id, false)}
                    showPosition
                  />
                ))
              )}
            </div>
          </div>

          {/* Available Players */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Available Players ({unselectedPlayers.length})
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {unselectedPlayers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  All players selected
                </p>
              ) : (
                unselectedPlayers.map((tp) => (
                  <div
                    key={tp.player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {tp.player.user.avatarUrl ? (
                        <img
                          src={tp.player.user.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                          {tp.player.user.firstName[0]}
                          {tp.player.user.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          #{tp.jerseyNumber || '—'}{' '}
                          {tp.player.user.firstName} {tp.player.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tp.position
                            ? formatPositionName(tp.position)
                            : 'No position'}
                        </p>
                      </div>
                      {tp.player.injuries.length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                          Injured
                        </span>
                      )}
                    </div>
                    {permissions.canManageLineup && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => addToStarting(tp)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Add to starting lineup"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addToSubstitutes(tp)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Add to substitutes"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PITCH VIEW COMPONENT
// ============================================================================

function PitchView({
  starting,
  formation,
  sport,
  canManage,
  onRemove,
  onToggleCaptain,
  onUpdatePosition,
  sportPositions,
}: {
  starting: LineupEntry[];
  formation: string;
  sport: Sport;
  canManage: boolean;
  onRemove: (id: string) => void;
  onToggleCaptain: (id: string) => void;
  onUpdatePosition: (id: string, position: Position) => void;
  sportPositions: Position[];
}) {
  // Get formation layout (simplified - would need proper coordinates)
  const getPlayerPosition = (index: number, total: number) => {
    // Simple grid layout - in production, use actual formation coordinates
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      left: `${15 + (col / cols) * 70}%`,
      top: `${15 + (row / Math.ceil(total / cols)) * 70}%`,
    };
  };

  return (
    <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg shadow aspect-[3/4] overflow-hidden">
      {/* Pitch markings */}
      <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
        {/* Center line */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/30" />
        {/* Penalty areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-16 border-2 border-t-0 border-white/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-16 border-2 border-b-0 border-white/30" />
      </div>

      {/* Players */}
      {starting.map((entry, index) => {
        const pos = getPlayerPosition(index, starting.length);
        return (
          <div
            key={entry.player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: pos.left, top: pos.top }}
          >
            <div className="relative">
              {/* Player marker */}
              <div
                className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center font-bold text-lg ${
                  entry.isCaptain ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {entry.jerseyNumber || '?'}
              </div>

              {/* Captain badge */}
              {entry.isCaptain && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                  C
                </div>
              )}

              {/* Injury indicator */}
              {entry.player.injuries.length > 0 && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Player name */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                <span className="px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                  {entry.player.user.lastName}
                </span>
              </div>

              {/* Hover actions */}
              {canManage && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg p-1">
                    <button
                      onClick={() => onToggleCaptain(entry.player.id)}
                      className={`p-1 rounded ${
                        entry.isCaptain
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'hover:bg-gray-100'
                      }`}
                      title="Toggle Captain"
                    >
                      <span className="text-xs font-bold">C</span>
                    </button>
                    <button
                      onClick={() => onRemove(entry.player.id)}
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Formation label */}
      <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/50 text-white text-sm rounded">
        {formation}
      </div>
    </div>
  );
}

// ============================================================================
// LIST VIEW COMPONENT
// ============================================================================

function ListView({
  starting,
  substitutes,
  canManage,
  onRemove,
  onToggleCaptain,
  onUpdatePosition,
  sportPositions,
}: {
  starting: LineupEntry[];
  substitutes: LineupEntry[];
  canManage: boolean;
  onRemove: (id: string, isStarter: boolean) => void;
  onToggleCaptain: (id: string) => void;
  onUpdatePosition: (id: string, position: Position) => void;
  sportPositions: Position[];
}) {
  return (
    <div className="space-y-6">
      {/* Starting XI */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Starting Lineup ({starting.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {starting.map((entry, index) => (
            <div
              key={entry.player.id}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center text-gray-400">{index + 1}</span>
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400">
                  {entry.jerseyNumber || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {entry.player.user.firstName} {entry.player.user.lastName}
                    {entry.isCaptain && (
                      <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                        Captain
                      </span>
                    )}
                    {entry.player.injuries.length > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                        Injured
                      </span>
                    )}
                  </p>
                  {canManage ? (
                    <select
                      value={entry.position || ''}
                      onChange={(e) =>
                        onUpdatePosition(entry.player.id, e.target.value as Position)
                      }
                      className="text-sm text-gray-500 bg-transparent border-none p-0 focus:ring-0"
                    >
                      <option value="">No position</option>
                      {sportPositions.map((pos) => (
                        <option key={pos} value={pos}>
                          {formatPositionName(pos)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {entry.position
                        ? formatPositionName(entry.position)
                        : 'No position'}
                    </p>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleCaptain(entry.player.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      entry.isCaptain
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                    }`}
                    title="Toggle Captain"
                  >
                    <span className="text-sm font-bold">C</span>
                  </button>
                  <button
                    onClick={() => onRemove(entry.player.id, true)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {starting.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No players in starting lineup
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PLAYER CARD COMPONENT
// ============================================================================

function PlayerCard({
  player,
  canManage,
  onRemove,
  showPosition = false,
}: {
  player: LineupEntry;
  canManage: boolean;
  onRemove: () => void;
  showPosition?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
          {player.jerseyNumber || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {player.player.user.firstName} {player.player.user.lastName}
          </p>
          {showPosition && player.position && (
            <p className="text-xs text-gray-500">
              {formatPositionName(player.position)}
            </p>
          )}
        </div>
        {player.player.injuries.length > 0 && (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        )}
      </div>
      {canManage && (
        <button
          onClick={onRemove}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}