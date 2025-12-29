// =============================================================================
// 🏆 PITCHCONNECT - COACH TACTICAL BOARD v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach/tactics
// Access: HEAD_COACH, ASSISTANT_COACH, ANALYST
// 
// FEATURES:
// ✅ Sport-specific formation systems for all 12 sports
// ✅ Visual pitch/court/field based on sport
// ✅ Drag-and-drop player positioning
// ✅ Tactic model integration with JSON playerPositions
// ✅ Play style and strategy configuration
// ✅ Save, load, and export tactics
// ✅ Starting lineup management
// ✅ Schema-aligned with Tactic, TacticPlayer, FormationType
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Save,
  Download,
  Upload,
  Share2,
  Settings,
  Users,
  Target,
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Layers,
  Move,
  RotateCcw,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type FormationType =
  | 'FOUR_FOUR_TWO' | 'FOUR_THREE_THREE' | 'THREE_FIVE_TWO' | 'FOUR_TWO_THREE_ONE'
  | 'FIVE_THREE_TWO' | 'THREE_FOUR_THREE' | 'FOUR_ONE_FOUR_ONE' | 'FOUR_FIVE_ONE'
  | 'FOUR_FOUR_ONE_ONE' | 'THREE_FOUR_TWO_ONE' | 'FOUR_THREE_TWO_ONE'
  | 'FOUR_ONE_TWO_ONE_TWO' | 'FIVE_FOUR_ONE' | 'FOUR_TWO_TWO_TWO'
  | 'CUSTOM';

interface TacticPlayer {
  id: string;
  playerId?: string;
  name: string;
  position: string;
  jerseyNumber: number;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role?: string;
  instructions?: string;
}

interface Tactic {
  id: string;
  coachId: string;
  teamId: string;
  name: string;
  formation: FormationType;
  description?: string;
  playStyle?: string;
  defensiveShape?: string;
  pressType?: string;
  tempoStyle?: string;
  buildUpPlay?: string;
  attackingWidth?: string;
  defensiveLine?: string;
  notes?: string;
  playerPositions: TacticPlayer[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  club: {
    sport: Sport;
    name: string;
  };
}

interface TeamPlayer {
  id: string;
  playerId: string;
  jerseyNumber?: number;
  position?: string;
  player: {
    id: string;
    primaryPosition?: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// SPORT-SPECIFIC FORMATIONS
// =============================================================================

interface FormationConfig {
  id: FormationType | string;
  name: string;
  positions: Array<{ x: number; y: number; role: string; label: string }>;
  description: string;
}

const FOOTBALL_FORMATIONS: FormationConfig[] = [
  {
    id: 'FOUR_FOUR_TWO',
    name: '4-4-2',
    description: 'Classic balanced formation',
    positions: [
      { x: 50, y: 95, role: 'GK', label: 'GK' },
      { x: 15, y: 75, role: 'LB', label: 'LB' },
      { x: 35, y: 78, role: 'CB', label: 'CB' },
      { x: 65, y: 78, role: 'CB', label: 'CB' },
      { x: 85, y: 75, role: 'RB', label: 'RB' },
      { x: 15, y: 50, role: 'LM', label: 'LM' },
      { x: 38, y: 52, role: 'CM', label: 'CM' },
      { x: 62, y: 52, role: 'CM', label: 'CM' },
      { x: 85, y: 50, role: 'RM', label: 'RM' },
      { x: 35, y: 22, role: 'ST', label: 'ST' },
      { x: 65, y: 22, role: 'ST', label: 'ST' },
    ],
  },
  {
    id: 'FOUR_THREE_THREE',
    name: '4-3-3',
    description: 'Attacking wide formation',
    positions: [
      { x: 50, y: 95, role: 'GK', label: 'GK' },
      { x: 15, y: 75, role: 'LB', label: 'LB' },
      { x: 35, y: 78, role: 'CB', label: 'CB' },
      { x: 65, y: 78, role: 'CB', label: 'CB' },
      { x: 85, y: 75, role: 'RB', label: 'RB' },
      { x: 30, y: 52, role: 'CM', label: 'CM' },
      { x: 50, y: 48, role: 'CM', label: 'CM' },
      { x: 70, y: 52, role: 'CM', label: 'CM' },
      { x: 15, y: 25, role: 'LW', label: 'LW' },
      { x: 50, y: 18, role: 'ST', label: 'ST' },
      { x: 85, y: 25, role: 'RW', label: 'RW' },
    ],
  },
  {
    id: 'FOUR_TWO_THREE_ONE',
    name: '4-2-3-1',
    description: 'Modern defensive formation',
    positions: [
      { x: 50, y: 95, role: 'GK', label: 'GK' },
      { x: 15, y: 75, role: 'LB', label: 'LB' },
      { x: 35, y: 78, role: 'CB', label: 'CB' },
      { x: 65, y: 78, role: 'CB', label: 'CB' },
      { x: 85, y: 75, role: 'RB', label: 'RB' },
      { x: 35, y: 58, role: 'CDM', label: 'CDM' },
      { x: 65, y: 58, role: 'CDM', label: 'CDM' },
      { x: 15, y: 38, role: 'LW', label: 'LW' },
      { x: 50, y: 35, role: 'CAM', label: 'CAM' },
      { x: 85, y: 38, role: 'RW', label: 'RW' },
      { x: 50, y: 15, role: 'ST', label: 'ST' },
    ],
  },
  {
    id: 'THREE_FIVE_TWO',
    name: '3-5-2',
    description: 'Midfield control',
    positions: [
      { x: 50, y: 95, role: 'GK', label: 'GK' },
      { x: 25, y: 78, role: 'CB', label: 'CB' },
      { x: 50, y: 80, role: 'CB', label: 'CB' },
      { x: 75, y: 78, role: 'CB', label: 'CB' },
      { x: 10, y: 50, role: 'LWB', label: 'LWB' },
      { x: 30, y: 55, role: 'CM', label: 'CM' },
      { x: 50, y: 50, role: 'CDM', label: 'CDM' },
      { x: 70, y: 55, role: 'CM', label: 'CM' },
      { x: 90, y: 50, role: 'RWB', label: 'RWB' },
      { x: 35, y: 22, role: 'ST', label: 'ST' },
      { x: 65, y: 22, role: 'ST', label: 'ST' },
    ],
  },
  {
    id: 'FIVE_THREE_TWO',
    name: '5-3-2',
    description: 'Defensive solid structure',
    positions: [
      { x: 50, y: 95, role: 'GK', label: 'GK' },
      { x: 10, y: 72, role: 'LWB', label: 'LWB' },
      { x: 30, y: 78, role: 'CB', label: 'CB' },
      { x: 50, y: 80, role: 'CB', label: 'CB' },
      { x: 70, y: 78, role: 'CB', label: 'CB' },
      { x: 90, y: 72, role: 'RWB', label: 'RWB' },
      { x: 30, y: 50, role: 'CM', label: 'CM' },
      { x: 50, y: 48, role: 'CM', label: 'CM' },
      { x: 70, y: 50, role: 'CM', label: 'CM' },
      { x: 35, y: 22, role: 'ST', label: 'ST' },
      { x: 65, y: 22, role: 'ST', label: 'ST' },
    ],
  },
];

const BASKETBALL_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_FIVE',
    name: 'Standard 5',
    description: 'Traditional basketball lineup',
    positions: [
      { x: 50, y: 85, role: 'PG', label: 'PG' },
      { x: 25, y: 65, role: 'SG', label: 'SG' },
      { x: 75, y: 65, role: 'SF', label: 'SF' },
      { x: 30, y: 40, role: 'PF', label: 'PF' },
      { x: 70, y: 40, role: 'C', label: 'C' },
    ],
  },
  {
    id: 'SMALL_BALL',
    name: 'Small Ball',
    description: 'Fast-paced, perimeter-focused',
    positions: [
      { x: 50, y: 85, role: 'PG', label: 'PG' },
      { x: 20, y: 70, role: 'SG', label: 'SG' },
      { x: 80, y: 70, role: 'SG', label: 'SG' },
      { x: 30, y: 45, role: 'SF', label: 'SF' },
      { x: 70, y: 45, role: 'SF', label: 'SF' },
    ],
  },
  {
    id: 'TWIN_TOWERS',
    name: 'Twin Towers',
    description: 'Inside-out offense',
    positions: [
      { x: 50, y: 85, role: 'PG', label: 'PG' },
      { x: 25, y: 65, role: 'SG', label: 'SG' },
      { x: 75, y: 65, role: 'SF', label: 'SF' },
      { x: 35, y: 35, role: 'C', label: 'C' },
      { x: 65, y: 35, role: 'C', label: 'C' },
    ],
  },
];

const RUGBY_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_FIFTEEN',
    name: 'Standard XV',
    description: 'Traditional rugby union formation',
    positions: [
      { x: 50, y: 95, role: 'FB', label: '15' },
      { x: 15, y: 82, role: 'LW', label: '11' },
      { x: 35, y: 80, role: 'LC', label: '12' },
      { x: 65, y: 80, role: 'RC', label: '13' },
      { x: 85, y: 82, role: 'RW', label: '14' },
      { x: 40, y: 65, role: 'FH', label: '10' },
      { x: 60, y: 68, role: 'SH', label: '9' },
      { x: 25, y: 50, role: 'BF', label: '8' },
      { x: 50, y: 48, role: 'LF', label: '7' },
      { x: 75, y: 50, role: 'OF', label: '6' },
      { x: 35, y: 35, role: 'LL', label: '5' },
      { x: 65, y: 35, role: 'LR', label: '4' },
      { x: 50, y: 22, role: 'HK', label: '2' },
      { x: 30, y: 20, role: 'LP', label: '1' },
      { x: 70, y: 20, role: 'TP', label: '3' },
    ],
  },
  {
    id: 'ATTACKING_WIDE',
    name: 'Wide Attack',
    description: 'Expansive attacking rugby',
    positions: [
      { x: 50, y: 95, role: 'FB', label: '15' },
      { x: 10, y: 78, role: 'LW', label: '11' },
      { x: 30, y: 75, role: 'LC', label: '12' },
      { x: 70, y: 75, role: 'RC', label: '13' },
      { x: 90, y: 78, role: 'RW', label: '14' },
      { x: 45, y: 60, role: 'FH', label: '10' },
      { x: 55, y: 62, role: 'SH', label: '9' },
      { x: 30, y: 45, role: 'BF', label: '8' },
      { x: 50, y: 42, role: 'LF', label: '7' },
      { x: 70, y: 45, role: 'OF', label: '6' },
      { x: 35, y: 30, role: 'LL', label: '5' },
      { x: 65, y: 30, role: 'LR', label: '4' },
      { x: 50, y: 18, role: 'HK', label: '2' },
      { x: 30, y: 15, role: 'LP', label: '1' },
      { x: 70, y: 15, role: 'TP', label: '3' },
    ],
  },
];

const NETBALL_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_SEVEN',
    name: 'Standard 7',
    description: 'Traditional netball positions',
    positions: [
      { x: 50, y: 12, role: 'GS', label: 'GS' },
      { x: 50, y: 28, role: 'GA', label: 'GA' },
      { x: 50, y: 45, role: 'WA', label: 'WA' },
      { x: 50, y: 50, role: 'C', label: 'C' },
      { x: 50, y: 55, role: 'WD', label: 'WD' },
      { x: 50, y: 72, role: 'GD', label: 'GD' },
      { x: 50, y: 88, role: 'GK', label: 'GK' },
    ],
  },
  {
    id: 'ATTACKING_SETUP',
    name: 'Attacking Setup',
    description: 'Forward-focused positioning',
    positions: [
      { x: 40, y: 10, role: 'GS', label: 'GS' },
      { x: 60, y: 22, role: 'GA', label: 'GA' },
      { x: 25, y: 40, role: 'WA', label: 'WA' },
      { x: 50, y: 50, role: 'C', label: 'C' },
      { x: 75, y: 55, role: 'WD', label: 'WD' },
      { x: 50, y: 72, role: 'GD', label: 'GD' },
      { x: 50, y: 90, role: 'GK', label: 'GK' },
    ],
  },
];

const AMERICAN_FOOTBALL_FORMATIONS: FormationConfig[] = [
  {
    id: 'I_FORMATION',
    name: 'I-Formation',
    description: 'Power running formation',
    positions: [
      { x: 50, y: 55, role: 'QB', label: 'QB' },
      { x: 50, y: 70, role: 'FB', label: 'FB' },
      { x: 50, y: 85, role: 'RB', label: 'RB' },
      { x: 15, y: 52, role: 'WR', label: 'WR' },
      { x: 85, y: 52, role: 'WR', label: 'WR' },
      { x: 25, y: 45, role: 'TE', label: 'TE' },
      { x: 35, y: 42, role: 'LT', label: 'LT' },
      { x: 42, y: 42, role: 'LG', label: 'LG' },
      { x: 50, y: 42, role: 'C', label: 'C' },
      { x: 58, y: 42, role: 'RG', label: 'RG' },
      { x: 65, y: 42, role: 'RT', label: 'RT' },
    ],
  },
  {
    id: 'SHOTGUN',
    name: 'Shotgun',
    description: 'Passing formation',
    positions: [
      { x: 50, y: 65, role: 'QB', label: 'QB' },
      { x: 35, y: 68, role: 'RB', label: 'RB' },
      { x: 65, y: 68, role: 'RB', label: 'RB' },
      { x: 10, y: 48, role: 'WR', label: 'WR' },
      { x: 25, y: 50, role: 'WR', label: 'WR' },
      { x: 75, y: 50, role: 'WR', label: 'WR' },
      { x: 90, y: 48, role: 'WR', label: 'WR' },
      { x: 40, y: 42, role: 'LT', label: 'LT' },
      { x: 45, y: 42, role: 'LG', label: 'LG' },
      { x: 50, y: 42, role: 'C', label: 'C' },
      { x: 55, y: 42, role: 'RG', label: 'RG' },
    ],
  },
];

const CRICKET_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_FIELD',
    name: 'Standard Field',
    description: 'Balanced cricket field placement',
    positions: [
      { x: 50, y: 50, role: 'WK', label: 'WK' },
      { x: 35, y: 35, role: 'SL1', label: '1st Slip' },
      { x: 45, y: 32, role: 'SL2', label: '2nd Slip' },
      { x: 65, y: 35, role: 'GU', label: 'Gully' },
      { x: 20, y: 50, role: 'PT', label: 'Point' },
      { x: 15, y: 70, role: 'CV', label: 'Cover' },
      { x: 30, y: 85, role: 'MO', label: 'Mid-Off' },
      { x: 70, y: 85, role: 'MN', label: 'Mid-On' },
      { x: 85, y: 60, role: 'MW', label: 'Mid-Wicket' },
      { x: 90, y: 40, role: 'SL', label: 'Sq Leg' },
      { x: 50, y: 15, role: 'LO', label: 'Long-On' },
    ],
  },
  {
    id: 'ATTACKING_FIELD',
    name: 'Attacking Field',
    description: 'Aggressive slip cordon',
    positions: [
      { x: 50, y: 50, role: 'WK', label: 'WK' },
      { x: 35, y: 35, role: 'SL1', label: '1st Slip' },
      { x: 42, y: 32, role: 'SL2', label: '2nd Slip' },
      { x: 49, y: 30, role: 'SL3', label: '3rd Slip' },
      { x: 60, y: 32, role: 'GU', label: 'Gully' },
      { x: 25, y: 55, role: 'PT', label: 'Point' },
      { x: 20, y: 75, role: 'CV', label: 'Cover' },
      { x: 40, y: 90, role: 'MO', label: 'Mid-Off' },
      { x: 60, y: 90, role: 'MN', label: 'Mid-On' },
      { x: 80, y: 55, role: 'SL', label: 'Sq Leg' },
      { x: 85, y: 35, role: 'LS', label: 'Leg Slip' },
    ],
  },
];

const HOCKEY_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_ELEVEN',
    name: 'Standard 3-3-3-1',
    description: 'Balanced hockey formation',
    positions: [
      { x: 50, y: 95, role: 'GK', label: 'GK' },
      { x: 25, y: 78, role: 'LB', label: 'LB' },
      { x: 50, y: 80, role: 'CB', label: 'CB' },
      { x: 75, y: 78, role: 'RB', label: 'RB' },
      { x: 25, y: 55, role: 'LM', label: 'LM' },
      { x: 50, y: 52, role: 'CM', label: 'CM' },
      { x: 75, y: 55, role: 'RM', label: 'RM' },
      { x: 25, y: 32, role: 'LF', label: 'LF' },
      { x: 50, y: 28, role: 'CF', label: 'CF' },
      { x: 75, y: 32, role: 'RF', label: 'RF' },
      { x: 50, y: 12, role: 'ST', label: 'ST' },
    ],
  },
];

const LACROSSE_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_TEN',
    name: 'Standard 10',
    description: 'Traditional lacrosse setup',
    positions: [
      { x: 50, y: 95, role: 'G', label: 'G' },
      { x: 30, y: 75, role: 'D', label: 'D' },
      { x: 50, y: 78, role: 'D', label: 'D' },
      { x: 70, y: 75, role: 'D', label: 'D' },
      { x: 25, y: 50, role: 'M', label: 'M' },
      { x: 50, y: 48, role: 'M', label: 'M' },
      { x: 75, y: 50, role: 'M', label: 'M' },
      { x: 30, y: 25, role: 'A', label: 'A' },
      { x: 50, y: 20, role: 'A', label: 'A' },
      { x: 70, y: 25, role: 'A', label: 'A' },
    ],
  },
];

const AUSTRALIAN_RULES_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_EIGHTEEN',
    name: 'Standard XVIII',
    description: 'Traditional AFL positions',
    positions: [
      { x: 50, y: 95, role: 'FB', label: 'FB' },
      { x: 25, y: 88, role: 'BP', label: 'BP' },
      { x: 75, y: 88, role: 'BP', label: 'BP' },
      { x: 15, y: 75, role: 'HB', label: 'HBF' },
      { x: 50, y: 78, role: 'CHB', label: 'CHB' },
      { x: 85, y: 75, role: 'HB', label: 'HBF' },
      { x: 25, y: 58, role: 'W', label: 'W' },
      { x: 50, y: 55, role: 'C', label: 'C' },
      { x: 75, y: 58, role: 'W', label: 'W' },
      { x: 50, y: 50, role: 'RU', label: 'R' },
      { x: 35, y: 48, role: 'RV', label: 'RR' },
      { x: 65, y: 48, role: 'RV', label: 'RR' },
      { x: 15, y: 35, role: 'HF', label: 'HFF' },
      { x: 50, y: 32, role: 'CHF', label: 'CHF' },
      { x: 85, y: 35, role: 'HF', label: 'HFF' },
      { x: 25, y: 18, role: 'FP', label: 'FP' },
      { x: 75, y: 18, role: 'FP', label: 'FP' },
      { x: 50, y: 8, role: 'FF', label: 'FF' },
    ],
  },
];

const GAELIC_FOOTBALL_FORMATIONS: FormationConfig[] = [
  {
    id: 'STANDARD_FIFTEEN',
    name: 'Standard XV',
    description: 'Traditional Gaelic formation',
    positions: [
      { x: 50, y: 95, role: 'GK', label: '1' },
      { x: 25, y: 82, role: 'CB', label: '2' },
      { x: 50, y: 85, role: 'FB', label: '3' },
      { x: 75, y: 82, role: 'CB', label: '4' },
      { x: 20, y: 68, role: 'HB', label: '5' },
      { x: 50, y: 70, role: 'CHB', label: '6' },
      { x: 80, y: 68, role: 'HB', label: '7' },
      { x: 35, y: 50, role: 'MF', label: '8' },
      { x: 65, y: 50, role: 'MF', label: '9' },
      { x: 20, y: 35, role: 'HF', label: '10' },
      { x: 50, y: 32, role: 'CHF', label: '11' },
      { x: 80, y: 35, role: 'HF', label: '12' },
      { x: 25, y: 18, role: 'CF', label: '13' },
      { x: 50, y: 12, role: 'FF', label: '14' },
      { x: 75, y: 18, role: 'CF', label: '15' },
    ],
  },
];

const FUTSAL_FORMATIONS: FormationConfig[] = [
  {
    id: 'ONE_TWO_ONE',
    name: '1-2-1',
    description: 'Diamond formation',
    positions: [
      { x: 50, y: 90, role: 'GK', label: 'GK' },
      { x: 25, y: 55, role: 'ALA', label: 'ALA' },
      { x: 75, y: 55, role: 'ALA', label: 'ALA' },
      { x: 50, y: 35, role: 'PIV', label: 'PIV' },
      { x: 50, y: 70, role: 'FIX', label: 'FIX' },
    ],
  },
  {
    id: 'TWO_TWO',
    name: '2-2',
    description: 'Box formation',
    positions: [
      { x: 50, y: 90, role: 'GK', label: 'GK' },
      { x: 30, y: 65, role: 'FIX', label: 'FIX' },
      { x: 70, y: 65, role: 'FIX', label: 'FIX' },
      { x: 30, y: 35, role: 'ALA', label: 'ALA' },
      { x: 70, y: 35, role: 'ALA', label: 'ALA' },
    ],
  },
];

const BEACH_FOOTBALL_FORMATIONS: FormationConfig[] = [
  {
    id: 'TWO_ONE_ONE',
    name: '2-1-1',
    description: 'Defensive formation',
    positions: [
      { x: 50, y: 90, role: 'GK', label: 'GK' },
      { x: 30, y: 65, role: 'DEF', label: 'DEF' },
      { x: 70, y: 65, role: 'DEF', label: 'DEF' },
      { x: 50, y: 45, role: 'MID', label: 'MID' },
      { x: 50, y: 20, role: 'FWD', label: 'FWD' },
    ],
  },
];

// Map sports to their formations
const SPORT_FORMATIONS: Record<Sport, FormationConfig[]> = {
  FOOTBALL: FOOTBALL_FORMATIONS,
  BASKETBALL: BASKETBALL_FORMATIONS,
  RUGBY: RUGBY_FORMATIONS,
  NETBALL: NETBALL_FORMATIONS,
  AMERICAN_FOOTBALL: AMERICAN_FOOTBALL_FORMATIONS,
  CRICKET: CRICKET_FORMATIONS,
  HOCKEY: HOCKEY_FORMATIONS,
  LACROSSE: LACROSSE_FORMATIONS,
  AUSTRALIAN_RULES: AUSTRALIAN_RULES_FORMATIONS,
  GAELIC_FOOTBALL: GAELIC_FOOTBALL_FORMATIONS,
  FUTSAL: FUTSAL_FORMATIONS,
  BEACH_FOOTBALL: BEACH_FOOTBALL_FORMATIONS,
};

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, {
  label: string;
  icon: string;
  color: string;
  pitchType: 'rectangle' | 'oval' | 'diamond' | 'court';
  pitchColor: string;
}> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600', pitchType: 'rectangle', pitchColor: 'from-green-600 to-green-500' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600', pitchType: 'rectangle', pitchColor: 'from-amber-600 to-amber-500' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600', pitchType: 'rectangle', pitchColor: 'from-green-600 to-green-500' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600', pitchType: 'court', pitchColor: 'from-amber-700 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600', pitchType: 'oval', pitchColor: 'from-green-600 to-green-500' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600', pitchType: 'rectangle', pitchColor: 'from-blue-600 to-blue-500' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600', pitchType: 'rectangle', pitchColor: 'from-green-600 to-green-500' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600', pitchType: 'rectangle', pitchColor: 'from-green-600 to-green-500' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600', pitchType: 'oval', pitchColor: 'from-green-600 to-green-500' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600', pitchType: 'rectangle', pitchColor: 'from-green-600 to-green-500' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600', pitchType: 'court', pitchColor: 'from-amber-600 to-amber-500' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500', pitchType: 'rectangle', pitchColor: 'from-amber-300 to-yellow-300' },
};

const PLAY_STYLES = [
  { id: 'POSSESSION', name: 'Possession', icon: '🎯', description: 'Control through passing' },
  { id: 'COUNTER_ATTACK', name: 'Counter Attack', icon: '⚡', description: 'Quick transitions' },
  { id: 'DIRECT', name: 'Direct Play', icon: '➡️', description: 'Long balls forward' },
  { id: 'HIGH_PRESS', name: 'High Press', icon: '🔥', description: 'Aggressive pressing' },
  { id: 'BALANCED', name: 'Balanced', icon: '⚖️', description: 'Adaptable approach' },
];

const DEFENSIVE_SHAPES = [
  { id: 'HIGH_LINE', name: 'High Line', description: 'Aggressive defensive positioning' },
  { id: 'MID_BLOCK', name: 'Mid Block', description: 'Balanced defensive stance' },
  { id: 'LOW_BLOCK', name: 'Low Block', description: 'Deep defensive shape' },
];

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 ${typeClasses[type]}`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
};

// =============================================================================
// PITCH COMPONENT
// =============================================================================

const TacticalPitch = ({
  sport,
  players,
  onPlayerMove,
  selectedPlayer,
  onSelectPlayer,
}: {
  sport: Sport;
  players: TacticPlayer[];
  onPlayerMove: (playerId: string, x: number, y: number) => void;
  selectedPlayer: string | null;
  onSelectPlayer: (playerId: string | null) => void;
}) => {
  const sportConfig = SPORT_CONFIG[sport];
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const handleMouseDown = (playerId: string) => {
    setIsDragging(playerId);
    onSelectPlayer(playerId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onPlayerMove(isDragging, Math.max(5, Math.min(95, x)), Math.max(5, Math.min(95, y)));
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const renderPitchMarkings = () => {
    switch (sportConfig.pitchType) {
      case 'rectangle':
        return (
          <>
            {/* Center line */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/40 -translate-x-1/2" />
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-1/4 h-1/3 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
            {/* Penalty areas */}
            <div className="absolute top-0 left-1/4 right-1/4 h-1/6 border-2 border-white/40 border-t-0" />
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1/6 border-2 border-white/40 border-b-0" />
            {/* Goal areas */}
            <div className="absolute top-0 left-[35%] right-[35%] h-[8%] border-2 border-white/40 border-t-0" />
            <div className="absolute bottom-0 left-[35%] right-[35%] h-[8%] border-2 border-white/40 border-b-0" />
          </>
        );
      case 'oval':
        return (
          <>
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
            {/* 50m arcs */}
            <div className="absolute top-[15%] left-1/2 w-1/2 h-1/6 border-2 border-white/40 rounded-full -translate-x-1/2" />
            <div className="absolute bottom-[15%] left-1/2 w-1/2 h-1/6 border-2 border-white/40 rounded-full -translate-x-1/2" />
          </>
        );
      case 'court':
        return (
          <>
            {/* Center line */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/40 -translate-x-1/2" />
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
            {/* Three-point lines */}
            <div className="absolute top-0 left-[15%] right-[15%] h-1/4 border-2 border-white/40 border-t-0 rounded-b-full" />
            <div className="absolute bottom-0 left-[15%] right-[15%] h-1/4 border-2 border-white/40 border-b-0 rounded-t-full" />
            {/* Keys */}
            <div className="absolute top-0 left-[35%] right-[35%] h-[15%] border-2 border-white/40 border-t-0" />
            <div className="absolute bottom-0 left-[35%] right-[35%] h-[15%] border-2 border-white/40 border-b-0" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative w-full aspect-[2/3] rounded-xl bg-gradient-to-b ${sportConfig.pitchColor} overflow-hidden shadow-lg`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Pitch markings */}
      <div className="absolute inset-0 pointer-events-none">
        {renderPitchMarkings()}
      </div>

      {/* Players */}
      {players.map((player) => (
        <div
          key={player.id}
          className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 cursor-move transition-shadow ${
            selectedPlayer === player.id ? 'z-20' : 'z-10'
          }`}
          style={{ left: `${player.x}%`, top: `${player.y}%` }}
          onMouseDown={() => handleMouseDown(player.id)}
        >
          <div
            className={`w-full h-full rounded-full flex flex-col items-center justify-center shadow-lg border-2 transition-all ${
              selectedPlayer === player.id
                ? 'border-gold-400 scale-110 ring-4 ring-gold-400/50'
                : 'border-white/50 hover:scale-105'
            } ${
              player.y < 35 ? 'bg-gradient-to-br from-red-500 to-orange-500' :
              player.y > 65 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
              'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}
          >
            <span className="text-white font-bold text-sm">{player.jerseyNumber}</span>
            <span className="text-white/80 text-[10px] font-medium">{player.position}</span>
          </div>
          {/* Name tooltip */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-white bg-black/60 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {player.name}
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CoachTacticalBoardPage() {
  const router = useRouter();

  // State
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [squadPlayers, setSquadPlayers] = useState<TeamPlayer[]>([]);
  const [savedTactics, setSavedTactics] = useState<Tactic[]>([]);
  const [currentSport, setCurrentSport] = useState<Sport>('FOOTBALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Tactic state
  const [tacticName, setTacticName] = useState('New Tactic');
  const [selectedFormation, setSelectedFormation] = useState<FormationConfig | null>(null);
  const [players, setPlayers] = useState<TacticPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playStyle, setPlayStyle] = useState('BALANCED');
  const [defensiveShape, setDefensiveShape] = useState('MID_BLOCK');
  const [notes, setNotes] = useState('');

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Get formations for current sport
  const availableFormations = useMemo(() => {
    return SPORT_FORMATIONS[currentSport] || SPORT_FORMATIONS.FOOTBALL;
  }, [currentSport]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [teamsRes, tacticsRes] = await Promise.all([
          fetch('/api/coach/teams'),
          fetch('/api/coach/tactics'),
        ]);

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.teams || []);
          if (teamsData.teams?.[0]) {
            setSelectedTeam(teamsData.teams[0]);
            setCurrentSport(teamsData.teams[0].club.sport || 'FOOTBALL');
          }
        }

        if (tacticsRes.ok) {
          const tacticsData = await tacticsRes.json();
          setSavedTactics(tacticsData.tactics || []);
        }
      } catch (error) {
        showToast('Failed to load data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  // Fetch squad when team changes
  useEffect(() => {
    if (!selectedTeam) return;

    const fetchSquad = async () => {
      try {
        const res = await fetch(`/api/teams/${selectedTeam.id}/players`);
        if (res.ok) {
          const data = await res.json();
          setSquadPlayers(data.players || []);
        }
      } catch (error) {
        console.error('Failed to fetch squad:', error);
      }
    };

    fetchSquad();
    setCurrentSport(selectedTeam.club.sport || 'FOOTBALL');
  }, [selectedTeam]);

  // Initialize formation
  useEffect(() => {
    if (availableFormations.length > 0 && !selectedFormation) {
      setSelectedFormation(availableFormations[0]);
    }
  }, [availableFormations, selectedFormation]);

  // Update players when formation changes
  useEffect(() => {
    if (!selectedFormation) return;

    const newPlayers: TacticPlayer[] = selectedFormation.positions.map((pos, idx) => ({
      id: `pos-${idx}`,
      name: squadPlayers[idx]?.player.user.firstName 
        ? `${squadPlayers[idx].player.user.firstName} ${squadPlayers[idx].player.user.lastName}`
        : `Player ${idx + 1}`,
      position: pos.label,
      jerseyNumber: squadPlayers[idx]?.jerseyNumber || idx + 1,
      x: pos.x,
      y: pos.y,
      role: pos.role,
    }));

    setPlayers(newPlayers);
  }, [selectedFormation, squadPlayers]);

  // Handle player move
  const handlePlayerMove = useCallback((playerId: string, x: number, y: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, x, y } : p
    ));
  }, []);

  // Handle save tactic
  const handleSaveTactic = async () => {
    if (!selectedTeam || !selectedFormation) {
      showToast('Please select a team and formation', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const tacticData = {
        teamId: selectedTeam.id,
        name: tacticName,
        formation: selectedFormation.id as FormationType,
        description: selectedFormation.description,
        playStyle,
        defensiveShape,
        notes,
        playerPositions: players,
      };

      const res = await fetch('/api/coach/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tacticData),
      });

      if (!res.ok) throw new Error('Failed to save');

      const data = await res.json();
      setSavedTactics(prev => [...prev, data.tactic]);
      showToast('✅ Tactic saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save tactic', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle export
  const handleExport = () => {
    const tacticExport = {
      name: tacticName,
      sport: currentSport,
      formation: selectedFormation?.name,
      playStyle: PLAY_STYLES.find(s => s.id === playStyle)?.name,
      defensiveShape: DEFENSIVE_SHAPES.find(d => d.id === defensiveShape)?.name,
      players,
      notes,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(tacticExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tactic-${tacticName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('📄 Tactic exported!', 'success');
  };

  // Reset formation
  const handleResetFormation = () => {
    if (!selectedFormation) return;
    
    const resetPlayers: TacticPlayer[] = selectedFormation.positions.map((pos, idx) => ({
      id: `pos-${idx}`,
      name: squadPlayers[idx]?.player.user.firstName 
        ? `${squadPlayers[idx].player.user.firstName} ${squadPlayers[idx].player.user.lastName}`
        : `Player ${idx + 1}`,
      position: pos.label,
      jerseyNumber: squadPlayers[idx]?.jerseyNumber || idx + 1,
      x: pos.x,
      y: pos.y,
      role: pos.role,
    }));

    setPlayers(resetPlayers);
    showToast('Formation reset to default positions', 'info');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading tactical board...</p>
        </div>
      </div>
    );
  }

  const sportConfig = SPORT_CONFIG[currentSport];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
              <span className="text-3xl">{sportConfig.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tactical Board</h1>
              <p className="text-slate-600 dark:text-slate-400">Design formations and strategies for {sportConfig.label}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleResetFormation}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleSaveTactic}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Tactic'}
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Team Selection */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Team</label>
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team || null);
                }}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Tactic Name */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tactic Name</label>
              <input
                type="text"
                value={tacticName}
                onChange={(e) => setTacticName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="Enter tactic name"
              />
            </div>

            {/* Formation Selection */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Formations</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableFormations.map(formation => (
                  <button
                    key={formation.id}
                    onClick={() => setSelectedFormation(formation)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedFormation?.id === formation.id
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <p className="font-bold text-sm">{formation.name}</p>
                    <p className={`text-xs mt-0.5 ${selectedFormation?.id === formation.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                      {formation.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Play Style */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Play Style</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PLAY_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setPlayStyle(style.id)}
                    className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                      playStyle === style.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                    title={style.description}
                  >
                    {style.icon} {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Defensive Shape */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Defense</h3>
              </div>
              <select
                value={defensiveShape}
                onChange={(e) => setDefensiveShape(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                {DEFENSIVE_SHAPES.map(shape => (
                  <option key={shape.id} value={shape.id}>{shape.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Center - Tactical Pitch */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  {selectedFormation?.name || 'Formation'} - {sportConfig.label}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  Drag players to reposition
                </span>
              </div>

              <TacticalPitch
                sport={currentSport}
                players={players}
                onPlayerMove={handlePlayerMove}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
              />
            </div>
          </div>

          {/* Right Panel - Squad & Notes */}
          <div className="lg:col-span-1 space-y-6">
            {/* Starting XI */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Starting Lineup ({players.length})
                </h3>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {players.map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    className={`w-full p-2 rounded-lg flex items-center gap-3 transition-all ${
                      selectedPlayer === player.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                      {player.jerseyNumber}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{player.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{player.position}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Summary</h3>
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">FORMATION</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{selectedFormation?.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Style</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {PLAY_STYLES.find(s => s.id === playStyle)?.name}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Defense</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {DEFENSIVE_SHAPES.find(d => d.id === defensiveShape)?.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                placeholder="Tactical notes, player instructions..."
              />
            </div>

            {/* Saved Tactics */}
            {savedTactics.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Saved Tactics</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedTactics.map(tactic => (
                    <div key={tactic.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{tactic.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{tactic.formation}</p>
                      </div>
                      <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}