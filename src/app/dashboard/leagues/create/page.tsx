// =============================================================================
// 🏆 PITCHCONNECT - CREATE LEAGUE v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/create/page.tsx
// Purpose: 3-step wizard to create League + LeagueSeason + LeagueConfiguration
//
// FEATURES:
// ✅ Server-side auth check (must be logged in)
// ✅ 3-step wizard: Basic Info → Format & Rules → Configuration
// ✅ Multi-sport support (12 sports from schema)
// ✅ Sport-specific scoring defaults with ability to override
// ✅ Sport-specific tiebreaker options
// ✅ Creates League + LeagueSeason + LeagueConfiguration in one API call
// ✅ Real-time preview
// ✅ Dark mode + responsive design
// ✅ Schema-aligned data models
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import CreateLeagueClient from './CreateLeagueClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

// =============================================================================
// SPORT CONFIGURATION WITH DEFAULTS
// =============================================================================

export const SPORT_CONFIG: Record<Sport, {
  label: string;
  icon: string;
  color: string;
  defaults: {
    pointsForWin: number;
    pointsForDraw: number;
    pointsForLoss: number;
    bonusPointsEnabled: boolean;
    bonusPointsConfig?: Record<string, number>;
  };
  tiebreakers: Array<{ value: string; label: string }>;
}> = {
  FOOTBALL: {
    label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600',
    defaults: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
      { value: 'GOALS_SCORED', label: 'Goals Scored' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
      { value: 'AWAY_GOALS', label: 'Away Goals' },
    ],
  },
  RUGBY: {
    label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600',
    defaults: { 
      pointsForWin: 4, pointsForDraw: 2, pointsForLoss: 0, 
      bonusPointsEnabled: true,
      bonusPointsConfig: { tryBonus: 1, losingBonus: 1 },
    },
    tiebreakers: [
      { value: 'POINT_DIFFERENCE', label: 'Point Difference' },
      { value: 'TRIES_SCORED', label: 'Tries Scored' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
  CRICKET: {
    label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600',
    defaults: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: true },
    tiebreakers: [
      { value: 'NET_RUN_RATE', label: 'Net Run Rate' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
      { value: 'WICKETS_TAKEN', label: 'Wickets Taken' },
    ],
  },
  BASKETBALL: {
    label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600',
    defaults: { pointsForWin: 2, pointsForDraw: 0, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'POINT_DIFFERENCE', label: 'Point Differential' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
      { value: 'POINTS_SCORED', label: 'Points Scored' },
    ],
  },
  NETBALL: {
    label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600',
    defaults: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
      { value: 'GOAL_PERCENTAGE', label: 'Goal Percentage' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
  HOCKEY: {
    label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600',
    defaults: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
      { value: 'GOALS_SCORED', label: 'Goals Scored' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
  AMERICAN_FOOTBALL: {
    label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600',
    defaults: { pointsForWin: 1, pointsForDraw: 0, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
      { value: 'DIVISION_RECORD', label: 'Division Record' },
      { value: 'POINT_DIFFERENCE', label: 'Point Differential' },
    ],
  },
  LACROSSE: {
    label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600',
    defaults: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
      { value: 'GOALS_SCORED', label: 'Goals Scored' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
  AUSTRALIAN_RULES: {
    label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600',
    defaults: { pointsForWin: 4, pointsForDraw: 2, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'PERCENTAGE', label: 'Percentage' },
      { value: 'POINTS_SCORED', label: 'Points Scored' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
  GAELIC_FOOTBALL: {
    label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600',
    defaults: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'SCORE_DIFFERENCE', label: 'Score Difference' },
      { value: 'SCORES_FOR', label: 'Scores For' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
  FUTSAL: {
    label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600',
    defaults: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
      { value: 'GOALS_SCORED', label: 'Goals Scored' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
  BEACH_FOOTBALL: {
    label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500',
    defaults: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
    tiebreakers: [
      { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
      { value: 'GOALS_SCORED', label: 'Goals Scored' },
      { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    ],
  },
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function CreateLeaguePage() {
  const session = await getServerSession(authOptions);

  // Must be logged in to create a league
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/dashboard/leagues/create');
  }

  const sportOptions = Object.entries(SPORT_CONFIG).map(([value, config]) => ({
    value: value as Sport,
    label: config.label,
    icon: config.icon,
  }));

  return (
    <CreateLeagueClient 
      sportOptions={sportOptions}
      sportConfig={SPORT_CONFIG}
    />
  );
}