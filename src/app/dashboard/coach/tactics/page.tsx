'use client';

/**
 * Coach Tactical Board Page
 * Path: /dashboard/coach/tactics
 * 
 * Features:
 * - Formation builder with visual pitch
 * - Tactical setup and configuration
 * - Starting XI management
 * - Play style and defensive strategy selection
 * - Save and export tactics
 * 
 * Schema Aligned: Tactic, TacticPlayer, Team, Player, Formation models
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  Eye,
  Share2,
  Settings,
  Users,
  Target,
  Shield,
  Download,
  Edit,
} from 'lucide-react';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

interface Formation {
  id: string;
  name: string;
  formation: number[][];
  description: string;
}

interface TacticPlayer {
  id: string;
  name: string;
  pos: string;
  num: number;
  color: 'gold' | 'blue' | 'purple' | 'orange';
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  role?: string;
}

interface Tactic {
  id: string;
  coachId: string;
  teamId: string;
  name: string;
  formation: Formation['id'];
  description?: string;
  playStyle: string;
  defensiveShape: string;
  pressType: string;
  notes?: string;
  playerPositions?: TacticPlayer[];
  createdAt: string;
  updatedAt: string;
}

interface PlayStyle {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FORMATIONS: Formation[] = [
  {
    id: 'FOUR_FOUR_TWO',
    name: '4-4-2',
    formation: [[1], [4], [4], [2]],
    description: 'Classic attacking setup',
  },
  {
    id: 'FOUR_THREE_THREE',
    name: '4-3-3',
    formation: [[1], [4], [3], [3]],
    description: 'Balanced possession play',
  },
  {
    id: 'THREE_FIVE_TWO',
    name: '3-5-2',
    formation: [[1], [3], [5], [2]],
    description: 'Midfield control',
  },
  {
    id: 'FIVE_THREE_TWO',
    name: '5-3-2',
    formation: [[1], [5], [3], [2]],
    description: 'Defensive solid structure',
  },
  {
    id: 'THREE_FOUR_THREE',
    name: '3-4-3',
    formation: [[1], [3], [4], [3]],
    description: 'Flexible attacking formation',
  },
  {
    id: 'FOUR_TWO_THREE_ONE',
    name: '4-2-3-1',
    formation: [[1], [4], [2], [3], [1]],
    description: 'Modern defensive formation',
  },
];

const DEFAULT_FORMATION: Formation = FORMATIONS[1]; // 4-3-3

const STARTING_XI: TacticPlayer[] = [
  { id: '1', name: 'Sarah Brown', pos: 'GK', num: 1, color: 'gold', preferredFoot: 'RIGHT' },
  { id: '2', name: 'James Wilson', pos: 'CB', num: 5, color: 'blue', preferredFoot: 'RIGHT' },
  { id: '3', name: 'Alex Williams', pos: 'RB', num: 4, color: 'blue', preferredFoot: 'LEFT' },
  { id: '4', name: 'John Smith', pos: 'CM', num: 7, color: 'purple', preferredFoot: 'RIGHT', role: 'Box-to-Box' },
  { id: '5', name: 'Marcus Johnson', pos: 'ST', num: 9, color: 'orange', preferredFoot: 'LEFT' },
  { id: '6', name: 'Emma Taylor', pos: 'LW', num: 12, color: 'orange', preferredFoot: 'RIGHT' },
];

const PLAY_STYLES: PlayStyle[] = [
  {
    id: 'POSSESSION',
    name: 'Possession-Based',
    icon: '🎯',
    description: 'Control the ball and build attacks slowly',
  },
  {
    id: 'COUNTER',
    name: 'Counter Attack',
    icon: '⚡',
    description: 'Quick transitions and fast breaks',
  },
  {
    id: 'DIRECT',
    name: 'Direct Play',
    icon: '→',
    description: 'Long balls and direct routes to goal',
  },
  {
    id: 'PRESSING',
    name: 'Pressing Game',
    icon: '🔥',
    description: 'High intensity pressing from the front',
  },
];

const DEFENSIVE_SHAPES = [
  { id: 'AGGRESSIVE', name: 'Aggressive', description: 'High line, high risk/reward' },
  { id: 'COMPACT', name: 'Compact', description: 'Mid-block, balanced approach' },
  { id: 'DEEP', name: 'Deep', description: 'Low block, defensive priority' },
];

const PRESS_TYPES = [
  { id: 'HIGH_PRESS', name: 'High Press', description: 'Press from kickoff' },
  { id: 'MID_BLOCK', name: 'Mid Press', description: 'Press in midfield' },
  { id: 'LOW_PRESS', name: 'Low Press', description: 'Defensive press' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function TacticalBoardPage() {
  const { isLoading } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [selectedFormation, setSelectedFormation] = useState<Formation>(DEFAULT_FORMATION);
  const [playStyle, setPlayStyle] = useState('POSSESSION');
  const [defensiveShape, setDefensiveShape] = useState('COMPACT');
  const [pressType, setPressType] = useState('HIGH_PRESS');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<TacticPlayer | null>(null);
  const [tactics, setTactics] = useState<Tactic[]>([]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle saving tactic to database
   */
  const handleSaveTactic = async () => {
    try {
      setIsSaving(true);

      const tacticData: Partial<Tactic> = {
        name: `${selectedFormation.name} - ${playStyle}`,
        formation: selectedFormation.id,
        description: `${selectedFormation.description} with ${playStyle} play style`,
        playStyle,
        defensiveShape,
        pressType,
        notes: `Defensive Shape: ${defensiveShape}, Press Type: ${pressType}`,
      };

      const response = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tacticData),
      });

      if (!response.ok) {
        throw new Error('Failed to save tactic');
      }

      const result = await response.json();
      console.log('✅ Tactic saved:', result);

      // Add to local tactics list
      if (result.data) {
        setTactics((prev) => [...prev, result.data]);
      }
    } catch (error) {
      console.error('❌ Error saving tactic:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle exporting tactic as JSON
   */
  const handleExportTactic = () => {
    const tacticExport = {
      formation: selectedFormation.name,
      playStyle: PLAY_STYLES.find((s) => s.id === playStyle)?.name,
      defensiveShape: DEFENSIVE_SHAPES.find((d) => d.id === defensiveShape)?.name,
      pressType: PRESS_TYPES.find((p) => p.id === pressType)?.name,
      startingXI: STARTING_XI,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(tacticExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tactic-${selectedFormation.id}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('✅ Tactic exported');
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get player card color based on position
   */
  const getPlayerColor = (color: string): string => {
    switch (color) {
      case 'gold':
        return 'bg-gradient-to-br from-gold-400 to-orange-400';
      case 'blue':
        return 'bg-gradient-to-br from-blue-400 to-blue-500';
      case 'purple':
        return 'bg-gradient-to-br from-purple-400 to-purple-500';
      case 'orange':
        return 'bg-gradient-to-br from-orange-400 to-orange-500';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-500';
    }
  };

  /**
   * Get position abbreviation label
   */
  const getPositionLabel = (pos: string): string => {
    const positions: Record<string, string> = {
      GK: 'Goalkeeper',
      CB: 'Center Back',
      RB: 'Right Back',
      LB: 'Left Back',
      CM: 'Central Mid',
      RM: 'Right Mid',
      LM: 'Left Mid',
      ST: 'Striker',
      LW: 'Left Wing',
      RW: 'Right Wing',
      CAM: 'Attacking Mid',
      CDM: 'Defensive Mid',
    };
    return positions[pos] || pos;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Tactical Board</h1>
          <p className="text-charcoal-600">
            Design your team&apos;s formation, strategy, and tactical setup
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
            onClick={handleSaveTactic}
            disabled={isSaving}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Tactic'}
          </Button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* LEFT: FORMATIONS & SETTINGS PANEL */}
        <div className="lg:col-span-1 space-y-6">
          {/* FORMATION SELECTOR */}
          <Card className="bg-white border border-neutral-200 shadow-sm sticky top-20">
            <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-gold-600" />
                Formations
              </CardTitle>
              <CardDescription>Choose your team formation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {FORMATIONS.map((formation) => (
                <button
                  key={formation.id}
                  onClick={() => setSelectedFormation(formation)}
                  className={`w-full p-3 rounded-lg text-left transition-all transform hover:scale-105 ${
                    selectedFormation.id === formation.id
                      ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white shadow-lg'
                      : 'bg-neutral-100 text-charcoal-900 hover:bg-neutral-200'
                  }`}
                >
                  <div className="font-bold text-base">{formation.name}</div>
                  <div
                    className={`text-xs mt-1 ${
                      selectedFormation.id === formation.id
                        ? 'text-white/80'
                        : 'text-charcoal-600'
                    }`}
                  >
                    {formation.description}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* TACTICAL SETTINGS */}
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-purple-600" />
                Tactics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Play Style */}
              <div>
                <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2 block">
                  Play Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAY_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setPlayStyle(style.id)}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                        playStyle === style.id
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-neutral-100 text-charcoal-700 hover:bg-neutral-200'
                      }`}
                      title={style.description}
                    >
                      {style.icon} {style.name.split('-')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Defensive Shape */}
              <div>
                <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2 block">
                  Defensive Shape
                </label>
                <select
                  value={defensiveShape}
                  onChange={(e) => setDefensiveShape(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm font-medium text-charcoal-900 hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                >
                  {DEFENSIVE_SHAPES.map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {shape.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Press Type */}
              <div>
                <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2 block">
                  Press Type
                </label>
                <select
                  value={pressType}
                  onChange={(e) => setPressType(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm font-medium text-charcoal-900 hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                >
                  {PRESS_TYPES.map((press) => (
                    <option key={press.id} value={press.id}>
                      {press.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: PITCH VISUALIZATION & SQUAD */}
        <div className="lg:col-span-3 space-y-6">
          {/* FORMATION DISPLAY ON PITCH */}
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
              <CardTitle className="text-xl">{selectedFormation.name} Formation</CardTitle>
              <CardDescription>Visual representation of player positions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* FOOTBALL PITCH */}
              <div className="bg-gradient-to-b from-green-600 to-green-500 rounded-b-xl p-8 aspect-video flex flex-col justify-between relative overflow-hidden">
                {/* Field Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Center Line */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/40 -translate-x-1/2" />
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 w-1/3 h-2/5 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  {/* Center Spot */}
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  {/* Penalty Areas */}
                  <div className="absolute top-0 left-0 right-0 h-1/4 border-2 border-white/40 border-t-0" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/4 border-2 border-white/40 border-b-0" />
                </div>

                {/* PLAYERS ON PITCH */}
                <div className="relative z-10 space-y-6">
                  {/* GOALKEEPER */}
                  <div className="flex justify-center">
                    <div
                      className="w-14 h-14 bg-gradient-to-br from-gold-400 to-orange-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/50 hover:scale-110 transition-transform cursor-pointer group relative"
                      onClick={() => setSelectedPlayer(STARTING_XI[0])}
                      title={STARTING_XI[0]?.name}
                    >
                      <span className="text-lg">1</span>
                      <div className="absolute bottom-full mb-2 whitespace-nowrap bg-charcoal-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {STARTING_XI[0]?.name}
                      </div>
                    </div>
                  </div>

                  {/* FORMATION ROWS */}
                  {selectedFormation.formation.slice(1).map((row, rowIndex) => {
                    const playerCount = row[0] ?? 0;
                    return (
                      <div key={rowIndex} className="flex justify-center gap-10">
                        {Array.from({ length: playerCount }).map((_, playerIndex) => {
                          const player = STARTING_XI[rowIndex * 2 + playerIndex] || {
                            id: `player-${rowIndex}-${playerIndex}`,
                            name: `Player ${rowIndex * 2 + playerIndex + 1}`,
                            pos: 'DEF',
                            num: rowIndex * 2 + playerIndex + 2,
                            color: 'blue' as const,
                          };
                          return (
                            <div
                              key={playerIndex}
                              className={`w-12 h-12 ${getPlayerColor(
                                player.color
                              )} rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/50 hover:scale-110 transition-all cursor-pointer group relative`}
                              onClick={() => setSelectedPlayer(player)}
                              title={`${player.num} - ${player.name}`}
                            >
                              <span className="text-sm">{player.num}</span>
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 whitespace-nowrap bg-charcoal-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {player.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STARTING XI & TACTICAL SUMMARY */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* STARTING XI TABLE */}
            <Card className="bg-white border border-neutral-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Starting XI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STARTING_XI.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 bg-neutral-50 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
                      selectedPlayer?.id === player.id
                        ? 'border-gold-400 bg-gold-50'
                        : 'border-neutral-200 hover:border-gold-300'
                    }`}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 ${getPlayerColor(
                          player.color
                        )} rounded-full flex items-center justify-center font-bold text-white text-xs`}
                      >
                        {player.num}
                      </div>
                      <div>
                        <p className="font-bold text-charcoal-900 text-sm">{player.name}</p>
                        <p className="text-xs text-charcoal-500">
                          {getPositionLabel(player.pos)}
                          {player.preferredFoot && ` • ${player.preferredFoot}`}
                        </p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 bg-gold-100 text-gold-600 rounded hover:bg-gold-200 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TACTICAL SUMMARY */}
            <Card className="bg-white border border-neutral-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Tactical Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formation Display */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-200">
                  <p className="text-xs text-charcoal-700 font-semibold mb-1">FORMATION</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedFormation.name}</p>
                  <p className="text-xs text-charcoal-600 mt-1">{selectedFormation.description}</p>
                </div>

                {/* Tactical Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">PLAY STYLE</p>
                    <p className="font-bold text-charcoal-900 text-sm">
                      {PLAY_STYLES.find((s) => s.id === playStyle)?.name}
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">DEFENSIVE</p>
                    <p className="font-bold text-charcoal-900 text-sm">
                      {DEFENSIVE_SHAPES.find((d) => d.id === defensiveShape)?.name}
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">PRESS</p>
                    <p className="font-bold text-charcoal-900 text-sm">
                      {PRESS_TYPES.find((p) => p.id === pressType)?.name}
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">SQUAD SIZE</p>
                    <p className="font-bold text-charcoal-900 text-sm">{STARTING_XI.length} Players</p>
                  </div>
                </div>

                {/* Selected Player Info */}
                {selectedPlayer && (
                  <div className="p-3 bg-gradient-to-r from-gold-50 to-transparent rounded-lg border border-gold-200">
                    <p className="text-xs text-charcoal-700 font-semibold mb-2">SELECTED PLAYER</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 ${getPlayerColor(
                          selectedPlayer.color
                        )} rounded-full flex items-center justify-center font-bold text-white text-xs`}
                      >
                        {selectedPlayer.num}
                      </div>
                      <div>
                        <p className="font-bold text-charcoal-900">{selectedPlayer.name}</p>
                        <p className="text-xs text-charcoal-600">
                          {getPositionLabel(selectedPlayer.pos)}
                          {selectedPlayer.role && ` • ${selectedPlayer.role}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 flex-wrap">
            <Button className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md min-w-[120px]">
              <Save className="w-5 h-5 mr-2" />
              Save Tactic
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 min-w-[120px]"
            >
              <Eye className="w-5 h-5 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 min-w-[120px]"
              onClick={handleExportTactic}
            >
              <Download className="w-5 h-5 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
