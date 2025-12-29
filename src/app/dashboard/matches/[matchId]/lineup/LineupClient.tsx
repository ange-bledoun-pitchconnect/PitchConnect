'use client';

// ============================================================================
// 👥 PITCHCONNECT - LINEUP CLIENT v7.3.0
// ============================================================================
// Path: src/app/dashboard/matches/[matchId]/lineup/LineupClient.tsx
// Interactive lineup management with formation visualization
// Schema v7.3.0 aligned - Uses MatchSquad, FormationType, Position enums
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Save,
  RotateCcw,
  User,
  Star,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Minus,
  Shirt,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getSportConfig,
  getSportIcon,
  getFormationsForSport,
  getPositionsForSport,
} from '@/lib/config/sports';
import type { Sport, FormationType, Position, MatchStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerInfo {
  id: string;
  name: string;
  avatar: string | null;
  position: Position | null;
  secondaryPosition: Position | null;
  jerseyNumber: number | null;
}

interface SquadPlayer {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  lineupPosition: number | null;
  shirtNumber: number | null;
  position: Position | null;
  status: string;
  isCaptain: boolean;
  notes: string | null;
  player: {
    id: string;
    primaryPosition: Position | null;
    secondaryPosition: Position | null;
    jerseyNumber: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
}

interface TeamData {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  sport: Sport;
  primaryColor: string | null;
  secondaryColor: string | null;
  formation: FormationType | null;
  players: SquadPlayer[];
}

interface MatchData {
  id: string;
  status: MatchStatus;
  kickOffTime: string;
  venue: string | null;
  homeClubId: string;
  awayClubId: string;
  homeFormation: FormationType | null;
  awayFormation: FormationType | null;
  homeTeam: TeamData;
  awayTeam: TeamData;
}

interface LineupClientProps {
  match: MatchData;
  homeAvailablePlayers: PlayerInfo[];
  awayAvailablePlayers: PlayerInfo[];
  canManageLineup: boolean;
  managedClubId: string | null;
  currentUserId: string;
}

type LineupStatus = 'STARTING_LINEUP' | 'SUBSTITUTE' | 'NOT_SELECTED';

// ============================================================================
// FORMATION CONFIGURATIONS
// ============================================================================

interface FormationPosition {
  x: number; // Percentage from left
  y: number; // Percentage from top
  role: string;
}

const FORMATION_LAYOUTS: Record<FormationType, FormationPosition[]> = {
  FOUR_FOUR_TWO: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 15, y: 45, role: 'LM' },
    { x: 35, y: 50, role: 'CM' },
    { x: 65, y: 50, role: 'CM' },
    { x: 85, y: 45, role: 'RM' },
    { x: 35, y: 20, role: 'ST' },
    { x: 65, y: 20, role: 'ST' },
  ],
  FOUR_THREE_THREE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 30, y: 48, role: 'CM' },
    { x: 50, y: 52, role: 'CDM' },
    { x: 70, y: 48, role: 'CM' },
    { x: 15, y: 22, role: 'LW' },
    { x: 50, y: 18, role: 'ST' },
    { x: 85, y: 22, role: 'RW' },
  ],
  THREE_FIVE_TWO: [
    { x: 50, y: 90, role: 'GK' },
    { x: 25, y: 72, role: 'CB' },
    { x: 50, y: 75, role: 'CB' },
    { x: 75, y: 72, role: 'CB' },
    { x: 10, y: 45, role: 'LWB' },
    { x: 35, y: 50, role: 'CM' },
    { x: 50, y: 45, role: 'CDM' },
    { x: 65, y: 50, role: 'CM' },
    { x: 90, y: 45, role: 'RWB' },
    { x: 35, y: 20, role: 'ST' },
    { x: 65, y: 20, role: 'ST' },
  ],
  FIVE_THREE_TWO: [
    { x: 50, y: 90, role: 'GK' },
    { x: 10, y: 68, role: 'LWB' },
    { x: 30, y: 72, role: 'CB' },
    { x: 50, y: 75, role: 'CB' },
    { x: 70, y: 72, role: 'CB' },
    { x: 90, y: 68, role: 'RWB' },
    { x: 30, y: 45, role: 'CM' },
    { x: 50, y: 48, role: 'CM' },
    { x: 70, y: 45, role: 'CM' },
    { x: 35, y: 20, role: 'ST' },
    { x: 65, y: 20, role: 'ST' },
  ],
  FIVE_FOUR_ONE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 10, y: 68, role: 'LWB' },
    { x: 30, y: 72, role: 'CB' },
    { x: 50, y: 75, role: 'CB' },
    { x: 70, y: 72, role: 'CB' },
    { x: 90, y: 68, role: 'RWB' },
    { x: 15, y: 42, role: 'LM' },
    { x: 38, y: 45, role: 'CM' },
    { x: 62, y: 45, role: 'CM' },
    { x: 85, y: 42, role: 'RM' },
    { x: 50, y: 18, role: 'ST' },
  ],
  THREE_FOUR_THREE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 25, y: 72, role: 'CB' },
    { x: 50, y: 75, role: 'CB' },
    { x: 75, y: 72, role: 'CB' },
    { x: 10, y: 45, role: 'LWB' },
    { x: 35, y: 50, role: 'CM' },
    { x: 65, y: 50, role: 'CM' },
    { x: 90, y: 45, role: 'RWB' },
    { x: 20, y: 20, role: 'LW' },
    { x: 50, y: 18, role: 'ST' },
    { x: 80, y: 20, role: 'RW' },
  ],
  FOUR_TWO_THREE_ONE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 35, y: 52, role: 'CDM' },
    { x: 65, y: 52, role: 'CDM' },
    { x: 15, y: 32, role: 'LW' },
    { x: 50, y: 35, role: 'CAM' },
    { x: 85, y: 32, role: 'RW' },
    { x: 50, y: 15, role: 'ST' },
  ],
  FOUR_ONE_FOUR_ONE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 50, y: 55, role: 'CDM' },
    { x: 15, y: 38, role: 'LM' },
    { x: 38, y: 40, role: 'CM' },
    { x: 62, y: 40, role: 'CM' },
    { x: 85, y: 38, role: 'RM' },
    { x: 50, y: 15, role: 'ST' },
  ],
  FOUR_FIVE_ONE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 10, y: 45, role: 'LM' },
    { x: 30, y: 48, role: 'CM' },
    { x: 50, y: 45, role: 'CDM' },
    { x: 70, y: 48, role: 'CM' },
    { x: 90, y: 45, role: 'RM' },
    { x: 50, y: 18, role: 'ST' },
  ],
  FOUR_ONE_TWO_THREE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 50, y: 55, role: 'CDM' },
    { x: 30, y: 40, role: 'CM' },
    { x: 70, y: 40, role: 'CM' },
    { x: 20, y: 18, role: 'LW' },
    { x: 50, y: 15, role: 'ST' },
    { x: 80, y: 18, role: 'RW' },
  ],
  FOUR_FOUR_ONE_ONE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 15, y: 48, role: 'LM' },
    { x: 38, y: 52, role: 'CM' },
    { x: 62, y: 52, role: 'CM' },
    { x: 85, y: 48, role: 'RM' },
    { x: 50, y: 32, role: 'CAM' },
    { x: 50, y: 15, role: 'ST' },
  ],
  FOUR_THREE_TWO_ONE: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 70, role: 'LB' },
    { x: 35, y: 72, role: 'CB' },
    { x: 65, y: 72, role: 'CB' },
    { x: 85, y: 70, role: 'RB' },
    { x: 30, y: 52, role: 'CM' },
    { x: 50, y: 55, role: 'CDM' },
    { x: 70, y: 52, role: 'CM' },
    { x: 35, y: 32, role: 'CAM' },
    { x: 65, y: 32, role: 'CAM' },
    { x: 50, y: 15, role: 'ST' },
  ],
  CUSTOM: [],
  // Non-football formations (simplified)
  PODS: [],
  DIAMOND: [],
  FLAT_LINE: [],
  ONE_THREE_ONE: [],
  TWO_THREE: [],
  TWO_ONE_TWO: [],
  THREE_TWO: [],
  ONE_TWO_TWO: [],
  I_FORMATION: [],
  SHOTGUN: [],
  PISTOL: [],
  SPREAD: [],
  SINGLE_BACK: [],
  PRO_SET: [],
  WILDCAT: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getFormationLabel = (formation: FormationType): string => {
  const labels: Record<FormationType, string> = {
    FOUR_FOUR_TWO: '4-4-2',
    FOUR_THREE_THREE: '4-3-3',
    THREE_FIVE_TWO: '3-5-2',
    FIVE_THREE_TWO: '5-3-2',
    FIVE_FOUR_ONE: '5-4-1',
    THREE_FOUR_THREE: '3-4-3',
    FOUR_TWO_THREE_ONE: '4-2-3-1',
    FOUR_ONE_FOUR_ONE: '4-1-4-1',
    FOUR_FIVE_ONE: '4-5-1',
    FOUR_ONE_TWO_THREE: '4-1-2-3',
    FOUR_FOUR_ONE_ONE: '4-4-1-1',
    FOUR_THREE_TWO_ONE: '4-3-2-1',
    CUSTOM: 'Custom',
    PODS: 'Pods',
    DIAMOND: 'Diamond',
    FLAT_LINE: 'Flat Line',
    ONE_THREE_ONE: '1-3-1',
    TWO_THREE: '2-3',
    TWO_ONE_TWO: '2-1-2',
    THREE_TWO: '3-2',
    ONE_TWO_TWO: '1-2-2',
    I_FORMATION: 'I-Formation',
    SHOTGUN: 'Shotgun',
    PISTOL: 'Pistol',
    SPREAD: 'Spread',
    SINGLE_BACK: 'Single Back',
    PRO_SET: 'Pro Set',
    WILDCAT: 'Wildcat',
  };
  return labels[formation] || formation;
};

const getPositionLabel = (position: Position | null): string => {
  if (!position) return 'Unknown';
  return position.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// ============================================================================
// PLAYER CARD COMPONENT
// ============================================================================

interface PlayerCardProps {
  player: SquadPlayer | null;
  position?: number;
  role?: string;
  isEditing: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onSetCaptain?: () => void;
  teamColor?: string;
}

const PlayerCard = ({
  player,
  position,
  role,
  isEditing,
  onSelect,
  onRemove,
  onSetCaptain,
  teamColor = '#3B82F6',
}: PlayerCardProps) => {
  if (!player) {
    return (
      <button
        onClick={onSelect}
        disabled={!isEditing}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
          isEditing
            ? 'border-white/50 hover:border-white hover:bg-white/20 cursor-pointer'
            : 'border-white/30 cursor-default'
        }`}
      >
        <Plus className="w-6 h-6 text-white/70" />
      </button>
    );
  }

  const { user } = player.player;
  const shirtNumber = player.shirtNumber || player.player.jerseyNumber;

  return (
    <div className="relative group">
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform hover:scale-110"
        style={{ backgroundColor: teamColor }}
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          shirtNumber || '?'
        )}
      </div>
      
      {/* Captain Badge */}
      {player.isCaptain && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-yellow-900">C</span>
        </div>
      )}

      {/* Player Name */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
        <p className="text-xs font-semibold text-white drop-shadow-lg">
          {user.lastName}
        </p>
      </div>

      {/* Edit Controls */}
      {isEditing && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onSetCaptain && !player.isCaptain && (
            <button
              onClick={onSetCaptain}
              className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300"
              title="Set as captain"
            >
              <Star className="w-3 h-3 text-yellow-900" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400"
              title="Remove from lineup"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PITCH VIEW COMPONENT
// ============================================================================

interface PitchViewProps {
  team: TeamData;
  formation: FormationType;
  isEditing: boolean;
  onPlayerSelect: (position: number) => void;
  onPlayerRemove: (playerId: string) => void;
  onSetCaptain: (playerId: string) => void;
  isHome: boolean;
}

const PitchView = ({
  team,
  formation,
  isEditing,
  onPlayerSelect,
  onPlayerRemove,
  onSetCaptain,
  isHome,
}: PitchViewProps) => {
  const sportConfig = getSportConfig(team.sport);
  const formationLayout = FORMATION_LAYOUTS[formation] || [];
  
  // Get starting lineup players
  const startingPlayers = team.players.filter((p) => p.status === 'STARTING_LINEUP');
  
  // Map players to positions
  const positionedPlayers = formationLayout.map((pos, idx) => {
    const player = startingPlayers.find((p) => p.lineupPosition === idx + 1);
    return { ...pos, player, index: idx };
  });

  const teamColor = team.primaryColor || (isHome ? '#3B82F6' : '#F97316');

  return (
    <div className="relative w-full aspect-[3/4] max-w-md mx-auto">
      {/* Pitch Background */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #2d5a27 0%, #3d7a37 50%, #2d5a27 100%)',
        }}
      >
        {/* Pitch Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133">
          {/* Outline */}
          <rect x="5" y="5" width="90" height="123" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Center Line */}
          <line x1="5" y1="66.5" x2="95" y2="66.5" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Center Circle */}
          <circle cx="50" cy="66.5" r="12" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Center Dot */}
          <circle cx="50" cy="66.5" r="0.5" fill="white" opacity="0.7" />
          {/* Penalty Areas */}
          <rect x="20" y="5" width="60" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          <rect x="20" y="106" width="60" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Goal Areas */}
          <rect x="32" y="5" width="36" height="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          <rect x="32" y="120" width="36" height="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Penalty Spots */}
          <circle cx="50" cy="16" r="0.5" fill="white" opacity="0.7" />
          <circle cx="50" cy="117" r="0.5" fill="white" opacity="0.7" />
        </svg>
      </div>

      {/* Players */}
      {positionedPlayers.map((pos, idx) => (
        <div
          key={idx}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
        >
          <PlayerCard
            player={pos.player || null}
            position={idx + 1}
            role={pos.role}
            isEditing={isEditing}
            onSelect={() => onPlayerSelect(idx + 1)}
            onRemove={pos.player ? () => onPlayerRemove(pos.player!.playerId) : undefined}
            onSetCaptain={pos.player ? () => onSetCaptain(pos.player!.playerId) : undefined}
            teamColor={teamColor}
          />
        </div>
      ))}

      {/* Team Badge */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
        {team.logo ? (
          <img src={team.logo} alt="" className="w-8 h-8 rounded" />
        ) : (
          <Shield className="w-6 h-6 text-white" />
        )}
        <div>
          <p className="text-white font-bold text-sm">{team.shortName || team.name}</p>
          <p className="text-white/70 text-xs">{getFormationLabel(formation)}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUBSTITUTE BENCH COMPONENT
// ============================================================================

interface SubstituteBenchProps {
  team: TeamData;
  isEditing: boolean;
  onAddToStarting: (playerId: string) => void;
  onRemoveFromSquad: (playerId: string) => void;
  teamColor?: string;
}

const SubstituteBench = ({
  team,
  isEditing,
  onAddToStarting,
  onRemoveFromSquad,
  teamColor = '#3B82F6',
}: SubstituteBenchProps) => {
  const substitutes = team.players.filter((p) => p.status === 'SUBSTITUTE');

  return (
    <div className="bg-charcoal-100 dark:bg-charcoal-700/50 rounded-lg p-4">
      <h4 className="font-semibold text-charcoal-900 dark:text-white mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Substitutes ({substitutes.length})
      </h4>
      {substitutes.length === 0 ? (
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 text-center py-4">
          No substitutes selected
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {substitutes.map((player) => {
            const { user } = player.player;
            const shirtNumber = player.shirtNumber || player.player.jerseyNumber;

            return (
              <div
                key={player.id}
                className="relative group flex items-center gap-2 bg-white dark:bg-charcoal-800 rounded-lg px-3 py-2 shadow-sm"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: teamColor }}
                >
                  {shirtNumber || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                    {getPositionLabel(player.player.primaryPosition)}
                  </p>
                </div>
                {isEditing && (
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => onAddToStarting(player.playerId)}
                      className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400"
                      title="Add to starting lineup"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={() => onRemoveFromSquad(player.playerId)}
                      className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400"
                      title="Remove from squad"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LineupClient({
  match,
  homeAvailablePlayers,
  awayAvailablePlayers,
  canManageLineup,
  managedClubId,
  currentUserId,
}: LineupClientProps) {
  const router = useRouter();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');
  const [homeFormation, setHomeFormation] = useState<FormationType>(
    match.homeFormation || match.homeTeam.formation || 'FOUR_FOUR_TWO'
  );
  const [awayFormation, setAwayFormation] = useState<FormationType>(
    match.awayFormation || match.awayTeam.formation || 'FOUR_FOUR_TWO'
  );
  const [homeSquad, setHomeSquad] = useState(match.homeTeam.players);
  const [awaySquad, setAwaySquad] = useState(match.awayTeam.players);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState<{ team: 'home' | 'away'; position: number } | null>(null);

  const sportConfig = getSportConfig(match.homeTeam.sport);
  const sportIcon = getSportIcon(match.homeTeam.sport);

  // Determine which team the user can manage
  const canManageHome = canManageLineup && (managedClubId === match.homeClubId || !managedClubId);
  const canManageAway = canManageLineup && (managedClubId === match.awayClubId || !managedClubId);

  // Get available formations for this sport
  const availableFormations = getFormationsForSport(match.homeTeam.sport);

  // Handle formation change
  const handleFormationChange = (team: 'home' | 'away', formation: FormationType) => {
    if (team === 'home') {
      setHomeFormation(formation);
    } else {
      setAwayFormation(formation);
    }
  };

  // Handle player selection
  const handlePlayerSelect = (team: 'home' | 'away', position: number) => {
    setShowPlayerSelect({ team, position });
  };

  // Handle adding player to lineup
  const handleAddPlayer = (team: 'home' | 'away', playerId: string, position: number) => {
    const setSquad = team === 'home' ? setHomeSquad : setAwaySquad;
    
    setSquad((prev) =>
      prev.map((p) =>
        p.playerId === playerId
          ? { ...p, status: 'STARTING_LINEUP', lineupPosition: position }
          : p.lineupPosition === position
          ? { ...p, lineupPosition: null, status: 'SUBSTITUTE' }
          : p
      )
    );
    
    setShowPlayerSelect(null);
  };

  // Handle removing player from lineup
  const handleRemovePlayer = (team: 'home' | 'away', playerId: string) => {
    const setSquad = team === 'home' ? setHomeSquad : setAwaySquad;
    
    setSquad((prev) =>
      prev.map((p) =>
        p.playerId === playerId ? { ...p, status: 'SUBSTITUTE', lineupPosition: null } : p
      )
    );
  };

  // Handle setting captain
  const handleSetCaptain = (team: 'home' | 'away', playerId: string) => {
    const setSquad = team === 'home' ? setHomeSquad : setAwaySquad;
    
    setSquad((prev) =>
      prev.map((p) => ({
        ...p,
        isCaptain: p.playerId === playerId,
      }))
    );
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${match.id}/lineup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeFormation,
          awayFormation,
          homeSquad: homeSquad.map((p) => ({
            playerId: p.playerId,
            status: p.status,
            lineupPosition: p.lineupPosition,
            isCaptain: p.isCaptain,
          })),
          awaySquad: awaySquad.map((p) => ({
            playerId: p.playerId,
            status: p.status,
            lineupPosition: p.lineupPosition,
            isCaptain: p.isCaptain,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lineup');
      }

      setSuccess('Lineup saved successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lineup');
    } finally {
      setIsSaving(false);
    }
  };

  const currentTeam = activeTab === 'home' ? match.homeTeam : match.awayTeam;
  const currentFormation = activeTab === 'home' ? homeFormation : awayFormation;
  const currentSquad = activeTab === 'home' ? homeSquad : awaySquad;
  const canEditCurrentTeam = activeTab === 'home' ? canManageHome : canManageAway;
  const currentAvailablePlayers = activeTab === 'home' ? homeAvailablePlayers : awayAvailablePlayers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/matches/${match.id}`}
            className="inline-flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Match
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{sportIcon}</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-white">
                  Match Lineup
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </p>
              </div>
            </div>

            {canManageLineup && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Lineup
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Shirt className="w-4 h-4 mr-2" />
                    Edit Lineup
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Team Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-blue-50 dark:hover:bg-charcoal-700'
            }`}
          >
            {match.homeTeam.shortName || match.homeTeam.name}
            <Badge className="ml-2" variant="outline">
              Home
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('away')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'away'
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-orange-50 dark:hover:bg-charcoal-700'
            }`}
          >
            {match.awayTeam.shortName || match.awayTeam.name}
            <Badge className="ml-2" variant="outline">
              Away
            </Badge>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formation Selector */}
          {isEditing && canEditCurrentTeam && (
            <Card className="lg:col-span-3 bg-white dark:bg-charcoal-800">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="font-semibold text-charcoal-900 dark:text-white">
                    Formation:
                  </label>
                  <select
                    value={currentFormation}
                    onChange={(e) =>
                      handleFormationChange(activeTab, e.target.value as FormationType)
                    }
                    className="px-4 py-2 bg-white dark:bg-charcoal-700 border border-charcoal-300 dark:border-charcoal-600 rounded-lg"
                  >
                    {availableFormations.map((f) => (
                      <option key={f} value={f}>
                        {getFormationLabel(f)}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pitch View */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-charcoal-800">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">
                  Starting XI - {getFormationLabel(currentFormation)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PitchView
                  team={{ ...currentTeam, players: currentSquad }}
                  formation={currentFormation}
                  isEditing={isEditing && canEditCurrentTeam}
                  onPlayerSelect={(pos) => handlePlayerSelect(activeTab, pos)}
                  onPlayerRemove={(id) => handleRemovePlayer(activeTab, id)}
                  onSetCaptain={(id) => handleSetCaptain(activeTab, id)}
                  isHome={activeTab === 'home'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Substitutes */}
          <div>
            <Card className="bg-white dark:bg-charcoal-800">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">Squad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SubstituteBench
                  team={{ ...currentTeam, players: currentSquad }}
                  isEditing={isEditing && canEditCurrentTeam}
                  onAddToStarting={(id) => handleAddPlayer(activeTab, id, 1)}
                  onRemoveFromSquad={(id) => handleRemovePlayer(activeTab, id)}
                  teamColor={currentTeam.primaryColor || (activeTab === 'home' ? '#3B82F6' : '#F97316')}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Player Selection Modal */}
      {showPlayerSelect && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-charcoal-800 max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Select Player</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPlayerSelect(null)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {currentAvailablePlayers
                  .filter((p) => !currentSquad.some((s) => s.playerId === p.id && s.status === 'STARTING_LINEUP'))
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleAddPlayer(showPlayerSelect.team, player.id, showPlayerSelect.position)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-charcoal-50 dark:hover:bg-charcoal-700 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                        {player.jerseyNumber || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-900 dark:text-white">
                          {player.name}
                        </p>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          {getPositionLabel(player.position)}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
