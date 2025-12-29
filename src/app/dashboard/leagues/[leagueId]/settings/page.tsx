// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE SETTINGS v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/[leagueId]/settings
// Access: PUBLIC for public leagues (read-only), LEAGUE_ADMIN (edit)
//
// FEATURES:
// ✅ Role-based UI: Admin sees edit form, others see read-only
// ✅ Multi-sport scoring systems (12 sports)
// ✅ Sport-specific tiebreaker rules
// ✅ Points configuration per sport
// ✅ Team and player limits
// ✅ Registration settings
// ✅ Server-side rendering + Client interactivity
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import SettingsClient from './SettingsClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface LeagueSettings {
  id: string;
  leagueId: string;
  // Points
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  bonusPointsEnabled: boolean;
  bonusPointsConfig?: Record<string, number>;
  // Team limits
  minTeams: number;
  maxTeams: number | null;
  maxPlayersPerTeam: number | null;
  minPlayersPerMatch: number;
  // Player age
  minPlayerAge: number;
  maxPlayerAge: number;
  // Tiebreakers
  tiebreaker1: string;
  tiebreaker2: string;
  tiebreaker3: string;
  // Registration
  registrationOpen: boolean;
  registrationDeadline: Date | null;
  entryFee: number | null;
  // Standings display
  standingsColumns: string[];
}

interface LeagueData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  season: string;
  format: string;
  isPublic: boolean;
  settings: LeagueSettings | null;
}

// =============================================================================
// SPORT-SPECIFIC CONFIGURATION
// =============================================================================

export const SPORT_SCORING_DEFAULTS: Record<Sport, {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  bonusPointsEnabled: boolean;
  bonusPointsConfig?: Record<string, number>;
}> = {
  FOOTBALL: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
  RUGBY: { 
    pointsForWin: 4, pointsForDraw: 2, pointsForLoss: 0, 
    bonusPointsEnabled: true,
    bonusPointsConfig: { tryBonus: 1, losingBonus: 1 },
  },
  CRICKET: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: true },
  BASKETBALL: { pointsForWin: 2, pointsForDraw: 0, pointsForLoss: 0, bonusPointsEnabled: false },
  NETBALL: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
  HOCKEY: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
  AMERICAN_FOOTBALL: { pointsForWin: 1, pointsForDraw: 0, pointsForLoss: 0, bonusPointsEnabled: false },
  LACROSSE: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
  AUSTRALIAN_RULES: { pointsForWin: 4, pointsForDraw: 2, pointsForLoss: 0, bonusPointsEnabled: false },
  GAELIC_FOOTBALL: { pointsForWin: 2, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
  FUTSAL: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
  BEACH_FOOTBALL: { pointsForWin: 3, pointsForDraw: 1, pointsForLoss: 0, bonusPointsEnabled: false },
};

export const SPORT_TIEBREAKERS: Record<Sport, Array<{ value: string; label: string }>> = {
  FOOTBALL: [
    { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
    { value: 'GOALS_SCORED', label: 'Goals Scored' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    { value: 'AWAY_GOALS', label: 'Away Goals' },
    { value: 'FAIR_PLAY', label: 'Fair Play (Fewer Cards)' },
  ],
  RUGBY: [
    { value: 'POINT_DIFFERENCE', label: 'Point Difference' },
    { value: 'TRIES_SCORED', label: 'Tries Scored' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    { value: 'POINTS_SCORED', label: 'Points Scored' },
  ],
  CRICKET: [
    { value: 'NET_RUN_RATE', label: 'Net Run Rate' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    { value: 'WICKETS_TAKEN', label: 'Wickets Taken' },
    { value: 'MATCHES_WON', label: 'Most Matches Won' },
  ],
  BASKETBALL: [
    { value: 'POINT_DIFFERENCE', label: 'Point Differential' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    { value: 'POINTS_SCORED', label: 'Points Scored' },
  ],
  NETBALL: [
    { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
    { value: 'GOAL_PERCENTAGE', label: 'Goal Percentage' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  ],
  HOCKEY: [
    { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
    { value: 'GOALS_SCORED', label: 'Goals Scored' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  ],
  AMERICAN_FOOTBALL: [
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
    { value: 'DIVISION_RECORD', label: 'Division Record' },
    { value: 'POINT_DIFFERENCE', label: 'Point Differential' },
  ],
  LACROSSE: [
    { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
    { value: 'GOALS_SCORED', label: 'Goals Scored' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  ],
  AUSTRALIAN_RULES: [
    { value: 'PERCENTAGE', label: 'Percentage' },
    { value: 'POINTS_SCORED', label: 'Points Scored' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  ],
  GAELIC_FOOTBALL: [
    { value: 'SCORE_DIFFERENCE', label: 'Score Difference' },
    { value: 'SCORES_FOR', label: 'Scores For' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  ],
  FUTSAL: [
    { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
    { value: 'GOALS_SCORED', label: 'Goals Scored' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  ],
  BEACH_FOOTBALL: [
    { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
    { value: 'GOALS_SCORED', label: 'Goals Scored' },
    { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  ],
};

export const SPORT_STANDINGS_COLUMNS: Record<Sport, Array<{ key: string; label: string; shortLabel: string }>> = {
  FOOTBALL: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'goalsFor', label: 'Goals For', shortLabel: 'GF' },
    { key: 'goalsAgainst', label: 'Goals Against', shortLabel: 'GA' },
    { key: 'goalDifference', label: 'Goal Difference', shortLabel: 'GD' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
    { key: 'form', label: 'Form', shortLabel: 'Form' },
  ],
  RUGBY: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'pointsFor', label: 'Points For', shortLabel: 'PF' },
    { key: 'pointsAgainst', label: 'Points Against', shortLabel: 'PA' },
    { key: 'pointDifference', label: 'Point Difference', shortLabel: 'PD' },
    { key: 'triesFor', label: 'Tries For', shortLabel: 'TF' },
    { key: 'bonusPoints', label: 'Bonus Points', shortLabel: 'BP' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  CRICKET: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'tied', label: 'Tied', shortLabel: 'T' },
    { key: 'noResult', label: 'No Result', shortLabel: 'NR' },
    { key: 'netRunRate', label: 'Net Run Rate', shortLabel: 'NRR' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  BASKETBALL: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'pointsFor', label: 'Points For', shortLabel: 'PF' },
    { key: 'pointsAgainst', label: 'Points Against', shortLabel: 'PA' },
    { key: 'pointDifference', label: 'Differential', shortLabel: '+/-' },
    { key: 'winPercentage', label: 'Win %', shortLabel: 'PCT' },
  ],
  NETBALL: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'goalsFor', label: 'Goals For', shortLabel: 'GF' },
    { key: 'goalsAgainst', label: 'Goals Against', shortLabel: 'GA' },
    { key: 'goalPercentage', label: 'Goal Percentage', shortLabel: '%' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  HOCKEY: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'goalsFor', label: 'Goals For', shortLabel: 'GF' },
    { key: 'goalsAgainst', label: 'Goals Against', shortLabel: 'GA' },
    { key: 'goalDifference', label: 'Goal Difference', shortLabel: 'GD' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  AMERICAN_FOOTBALL: [
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'tied', label: 'Tied', shortLabel: 'T' },
    { key: 'winPercentage', label: 'Win %', shortLabel: 'PCT' },
    { key: 'pointsFor', label: 'Points For', shortLabel: 'PF' },
    { key: 'pointsAgainst', label: 'Points Against', shortLabel: 'PA' },
    { key: 'streak', label: 'Streak', shortLabel: 'STRK' },
  ],
  LACROSSE: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'goalsFor', label: 'Goals For', shortLabel: 'GF' },
    { key: 'goalsAgainst', label: 'Goals Against', shortLabel: 'GA' },
    { key: 'goalDifference', label: 'Goal Difference', shortLabel: 'GD' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  AUSTRALIAN_RULES: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'pointsFor', label: 'Points For', shortLabel: 'PF' },
    { key: 'pointsAgainst', label: 'Points Against', shortLabel: 'PA' },
    { key: 'percentage', label: 'Percentage', shortLabel: '%' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  GAELIC_FOOTBALL: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'scoresFor', label: 'Scores For', shortLabel: 'SF' },
    { key: 'scoresAgainst', label: 'Scores Against', shortLabel: 'SA' },
    { key: 'scoreDifference', label: 'Score Difference', shortLabel: 'SD' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  FUTSAL: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'goalsFor', label: 'Goals For', shortLabel: 'GF' },
    { key: 'goalsAgainst', label: 'Goals Against', shortLabel: 'GA' },
    { key: 'goalDifference', label: 'Goal Difference', shortLabel: 'GD' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
  BEACH_FOOTBALL: [
    { key: 'played', label: 'Played', shortLabel: 'P' },
    { key: 'won', label: 'Won', shortLabel: 'W' },
    { key: 'drawn', label: 'Drawn', shortLabel: 'D' },
    { key: 'lost', label: 'Lost', shortLabel: 'L' },
    { key: 'goalsFor', label: 'Goals For', shortLabel: 'GF' },
    { key: 'goalsAgainst', label: 'Goals Against', shortLabel: 'GA' },
    { key: 'goalDifference', label: 'Goal Difference', shortLabel: 'GD' },
    { key: 'points', label: 'Points', shortLabel: 'Pts' },
  ],
};

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getLeagueSettings(leagueId: string, userId?: string): Promise<{ league: LeagueData; isAdmin: boolean } | null> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      seasons: {
        where: { isCurrent: true },
        take: 1,
      },
      configuration: true,
    },
  });

  if (!league) return null;

  // Check if user is admin
  let isAdmin = false;
  if (userId) {
    const leagueAdmin = await prisma.leagueAdminLeague.findFirst({
      where: {
        leagueId,
        leagueAdmin: { userId },
      },
    });
    isAdmin = !!leagueAdmin;
  }

  const sportDefaults = SPORT_SCORING_DEFAULTS[league.sport as Sport] || SPORT_SCORING_DEFAULTS.FOOTBALL;
  const sportTiebreakers = SPORT_TIEBREAKERS[league.sport as Sport] || SPORT_TIEBREAKERS.FOOTBALL;
  const defaultColumns = SPORT_STANDINGS_COLUMNS[league.sport as Sport]?.map(c => c.key) || ['played', 'won', 'drawn', 'lost', 'points'];

  const settings: LeagueSettings = league.configuration ? {
    id: league.configuration.id,
    leagueId: league.id,
    pointsForWin: league.configuration.pointsForWin,
    pointsForDraw: league.configuration.pointsForDraw,
    pointsForLoss: league.configuration.pointsForLoss,
    bonusPointsEnabled: league.configuration.bonusPointsEnabled,
    bonusPointsConfig: league.configuration.bonusPointsConfig as Record<string, number> | undefined,
    minTeams: league.configuration.minTeams,
    maxTeams: league.configuration.maxTeams,
    maxPlayersPerTeam: league.configuration.maxPlayersPerTeam,
    minPlayersPerMatch: league.configuration.minPlayersPerMatch,
    minPlayerAge: league.configuration.minPlayerAge,
    maxPlayerAge: league.configuration.maxPlayerAge,
    tiebreaker1: league.configuration.tiebreaker1,
    tiebreaker2: league.configuration.tiebreaker2,
    tiebreaker3: league.configuration.tiebreaker3,
    registrationOpen: league.configuration.registrationOpen,
    registrationDeadline: league.configuration.registrationDeadline,
    entryFee: league.configuration.entryFee,
    standingsColumns: (league.configuration.standingsColumns as string[]) || defaultColumns,
  } : {
    // Default settings based on sport
    id: '',
    leagueId: league.id,
    ...sportDefaults,
    minTeams: 2,
    maxTeams: null,
    maxPlayersPerTeam: null,
    minPlayersPerMatch: 7,
    minPlayerAge: 16,
    maxPlayerAge: 99,
    tiebreaker1: sportTiebreakers[0]?.value || 'GOAL_DIFFERENCE',
    tiebreaker2: sportTiebreakers[1]?.value || 'GOALS_SCORED',
    tiebreaker3: sportTiebreakers[2]?.value || 'HEAD_TO_HEAD',
    registrationOpen: true,
    registrationDeadline: null,
    entryFee: null,
    standingsColumns: defaultColumns,
  };

  return {
    league: {
      id: league.id,
      name: league.name,
      code: league.code,
      sport: league.sport as Sport,
      season: league.seasons[0]?.name || 'Current Season',
      format: league.format || 'LEAGUE',
      isPublic: league.visibility === 'PUBLIC',
      settings,
    },
    isAdmin,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function LeagueSettingsPage({
  params,
}: {
  params: { leagueId: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await getLeagueSettings(params.leagueId, session?.user?.id);

  if (!data) {
    notFound();
  }

  // Check access for private leagues
  if (!data.league.isPublic && !session?.user) {
    notFound();
  }

  const sportConfig = SPORT_CONFIG[data.league.sport];
  const tiebreakers = SPORT_TIEBREAKERS[data.league.sport];
  const standingsColumns = SPORT_STANDINGS_COLUMNS[data.league.sport];

  return (
    <SettingsClient
      leagueId={params.leagueId}
      league={data.league}
      sportConfig={sportConfig}
      tiebreakers={tiebreakers}
      standingsColumns={standingsColumns}
      isAdmin={data.isAdmin}
    />
  );
}