// ============================================================================
// 🏆 PITCHCONNECT - Multi-Sport Utilities v7.7.0
// ============================================================================
// Path: lib/sports/sport-config.ts
// Shared utilities for all 12 sports - positions, stats, drill categories
// ============================================================================

import { Sport, Position, DrillCategory } from '@prisma/client';

// ============================================================================
// SPORT METADATA
// ============================================================================

export interface SportConfig {
  name: string;
  shortName: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  teamSize: number;
  matchDuration: number; // minutes
  periods: number;
  periodName: string;
  scoringUnit: string;
  scoringUnitPlural: string;
}

export const SPORT_CONFIG: Record<Sport, SportConfig> = {
  FOOTBALL: {
    name: 'Football',
    shortName: 'Football',
    icon: '⚽',
    color: '#22c55e',
    gradientFrom: '#22c55e',
    gradientTo: '#16a34a',
    teamSize: 11,
    matchDuration: 90,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
  },
  FUTSAL: {
    name: 'Futsal',
    shortName: 'Futsal',
    icon: '⚽',
    color: '#f59e0b',
    gradientFrom: '#f59e0b',
    gradientTo: '#d97706',
    teamSize: 5,
    matchDuration: 40,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
  },
  BEACH_FOOTBALL: {
    name: 'Beach Football',
    shortName: 'Beach',
    icon: '🏖️',
    color: '#06b6d4',
    gradientFrom: '#06b6d4',
    gradientTo: '#0891b2',
    teamSize: 5,
    matchDuration: 36,
    periods: 3,
    periodName: 'Period',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
  },
  RUGBY: {
    name: 'Rugby Union',
    shortName: 'Rugby',
    icon: '🏉',
    color: '#dc2626',
    gradientFrom: '#dc2626',
    gradientTo: '#b91c1c',
    teamSize: 15,
    matchDuration: 80,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
  },
  BASKETBALL: {
    name: 'Basketball',
    shortName: 'Basketball',
    icon: '🏀',
    color: '#f97316',
    gradientFrom: '#f97316',
    gradientTo: '#ea580c',
    teamSize: 5,
    matchDuration: 48,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
  },
  CRICKET: {
    name: 'Cricket',
    shortName: 'Cricket',
    icon: '🏏',
    color: '#84cc16',
    gradientFrom: '#84cc16',
    gradientTo: '#65a30d',
    teamSize: 11,
    matchDuration: 0, // Variable
    periods: 2,
    periodName: 'Innings',
    scoringUnit: 'Run',
    scoringUnitPlural: 'Runs',
  },
  AMERICAN_FOOTBALL: {
    name: 'American Football',
    shortName: 'NFL',
    icon: '🏈',
    color: '#7c3aed',
    gradientFrom: '#7c3aed',
    gradientTo: '#6d28d9',
    teamSize: 11,
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
  },
  NETBALL: {
    name: 'Netball',
    shortName: 'Netball',
    icon: '🏐',
    color: '#ec4899',
    gradientFrom: '#ec4899',
    gradientTo: '#db2777',
    teamSize: 7,
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
  },
  HOCKEY: {
    name: 'Ice Hockey',
    shortName: 'Hockey',
    icon: '🏒',
    color: '#3b82f6',
    gradientFrom: '#3b82f6',
    gradientTo: '#2563eb',
    teamSize: 6,
    matchDuration: 60,
    periods: 3,
    periodName: 'Period',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
  },
  LACROSSE: {
    name: 'Lacrosse',
    shortName: 'Lacrosse',
    icon: '🥍',
    color: '#14b8a6',
    gradientFrom: '#14b8a6',
    gradientTo: '#0d9488',
    teamSize: 10,
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Goal',
    scoringUnitPlural: 'Goals',
  },
  AUSTRALIAN_RULES: {
    name: 'Australian Rules',
    shortName: 'AFL',
    icon: '🏉',
    color: '#eab308',
    gradientFrom: '#eab308',
    gradientTo: '#ca8a04',
    teamSize: 18,
    matchDuration: 80,
    periods: 4,
    periodName: 'Quarter',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
  },
  GAELIC_FOOTBALL: {
    name: 'Gaelic Football',
    shortName: 'GAA',
    icon: '🏐',
    color: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    teamSize: 15,
    matchDuration: 70,
    periods: 2,
    periodName: 'Half',
    scoringUnit: 'Point',
    scoringUnitPlural: 'Points',
  },
};

// ============================================================================
// POSITION MAPPINGS BY SPORT
// ============================================================================

export interface PositionInfo {
  position: Position;
  name: string;
  shortName: string;
  category: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'utility';
  color: string;
}

export const POSITIONS_BY_SPORT: Record<Sport, PositionInfo[]> = {
  FOOTBALL: [
    { position: 'GOALKEEPER', name: 'Goalkeeper', shortName: 'GK', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'LEFT_BACK', name: 'Left Back', shortName: 'LB', category: 'defender', color: '#3b82f6' },
    { position: 'CENTER_BACK', name: 'Centre Back', shortName: 'CB', category: 'defender', color: '#3b82f6' },
    { position: 'RIGHT_BACK', name: 'Right Back', shortName: 'RB', category: 'defender', color: '#3b82f6' },
    { position: 'LEFT_WING_BACK', name: 'Left Wing Back', shortName: 'LWB', category: 'defender', color: '#3b82f6' },
    { position: 'RIGHT_WING_BACK', name: 'Right Wing Back', shortName: 'RWB', category: 'defender', color: '#3b82f6' },
    { position: 'DEFENSIVE_MIDFIELDER', name: 'Defensive Mid', shortName: 'CDM', category: 'midfielder', color: '#22c55e' },
    { position: 'CENTRAL_MIDFIELDER', name: 'Central Mid', shortName: 'CM', category: 'midfielder', color: '#22c55e' },
    { position: 'LEFT_MIDFIELDER', name: 'Left Mid', shortName: 'LM', category: 'midfielder', color: '#22c55e' },
    { position: 'RIGHT_MIDFIELDER', name: 'Right Mid', shortName: 'RM', category: 'midfielder', color: '#22c55e' },
    { position: 'ATTACKING_MIDFIELDER', name: 'Attacking Mid', shortName: 'CAM', category: 'midfielder', color: '#22c55e' },
    { position: 'LEFT_WINGER', name: 'Left Winger', shortName: 'LW', category: 'forward', color: '#ef4444' },
    { position: 'RIGHT_WINGER', name: 'Right Winger', shortName: 'RW', category: 'forward', color: '#ef4444' },
    { position: 'STRIKER', name: 'Striker', shortName: 'ST', category: 'forward', color: '#ef4444' },
    { position: 'CENTER_FORWARD', name: 'Centre Forward', shortName: 'CF', category: 'forward', color: '#ef4444' },
    { position: 'SECOND_STRIKER', name: 'Second Striker', shortName: 'SS', category: 'forward', color: '#ef4444' },
  ],
  FUTSAL: [
    { position: 'GOALKEEPER', name: 'Goalkeeper', shortName: 'GK', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'DEFENDER_TRAINING', name: 'Fixo', shortName: 'FX', category: 'defender', color: '#3b82f6' },
    { position: 'LEFT_WINGER', name: 'Left Wing', shortName: 'LW', category: 'midfielder', color: '#22c55e' },
    { position: 'RIGHT_WINGER', name: 'Right Wing', shortName: 'RW', category: 'midfielder', color: '#22c55e' },
    { position: 'STRIKER', name: 'Pivot', shortName: 'PV', category: 'forward', color: '#ef4444' },
  ],
  BEACH_FOOTBALL: [
    { position: 'GOALKEEPER', name: 'Goalkeeper', shortName: 'GK', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'CENTER_BACK', name: 'Defender', shortName: 'DEF', category: 'defender', color: '#3b82f6' },
    { position: 'CENTRAL_MIDFIELDER', name: 'Midfielder', shortName: 'MID', category: 'midfielder', color: '#22c55e' },
    { position: 'LEFT_WINGER', name: 'Left Wing', shortName: 'LW', category: 'forward', color: '#ef4444' },
    { position: 'RIGHT_WINGER', name: 'Right Wing', shortName: 'RW', category: 'forward', color: '#ef4444' },
  ],
  RUGBY: [
    { position: 'PROP', name: 'Loosehead Prop', shortName: '1', category: 'forward', color: '#ef4444' },
    { position: 'HOOKER', name: 'Hooker', shortName: '2', category: 'forward', color: '#ef4444' },
    { position: 'PROP', name: 'Tighthead Prop', shortName: '3', category: 'forward', color: '#ef4444' },
    { position: 'LOCK', name: 'Lock', shortName: '4/5', category: 'forward', color: '#ef4444' },
    { position: 'FLANKER', name: 'Blindside Flanker', shortName: '6', category: 'forward', color: '#ef4444' },
    { position: 'FLANKER', name: 'Openside Flanker', shortName: '7', category: 'forward', color: '#ef4444' },
    { position: 'NUMBER_8', name: 'Number 8', shortName: '8', category: 'forward', color: '#ef4444' },
    { position: 'SCRUM_HALF', name: 'Scrum Half', shortName: '9', category: 'midfielder', color: '#22c55e' },
    { position: 'FLY_HALF', name: 'Fly Half', shortName: '10', category: 'midfielder', color: '#22c55e' },
    { position: 'LEFT_WINGER', name: 'Left Wing', shortName: '11', category: 'defender', color: '#3b82f6' },
    { position: 'INSIDE_CENTER', name: 'Inside Centre', shortName: '12', category: 'midfielder', color: '#22c55e' },
    { position: 'OUTSIDE_CENTER', name: 'Outside Centre', shortName: '13', category: 'midfielder', color: '#22c55e' },
    { position: 'RIGHT_WINGER', name: 'Right Wing', shortName: '14', category: 'defender', color: '#3b82f6' },
    { position: 'FULLBACK', name: 'Fullback', shortName: '15', category: 'defender', color: '#3b82f6' },
  ],
  BASKETBALL: [
    { position: 'POINT_GUARD', name: 'Point Guard', shortName: 'PG', category: 'midfielder', color: '#22c55e' },
    { position: 'SHOOTING_GUARD', name: 'Shooting Guard', shortName: 'SG', category: 'midfielder', color: '#22c55e' },
    { position: 'SMALL_FORWARD', name: 'Small Forward', shortName: 'SF', category: 'forward', color: '#ef4444' },
    { position: 'POWER_FORWARD', name: 'Power Forward', shortName: 'PF', category: 'forward', color: '#ef4444' },
    { position: 'CENTER_BASKETBALL', name: 'Center', shortName: 'C', category: 'forward', color: '#ef4444' },
  ],
  CRICKET: [
    { position: 'WICKET_KEEPER', name: 'Wicket Keeper', shortName: 'WK', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'BATSMAN', name: 'Batsman', shortName: 'BAT', category: 'forward', color: '#ef4444' },
    { position: 'BOWLER', name: 'Bowler', shortName: 'BWL', category: 'defender', color: '#3b82f6' },
    { position: 'ALL_ROUNDER', name: 'All-Rounder', shortName: 'AR', category: 'midfielder', color: '#22c55e' },
    { position: 'FIELDER', name: 'Fielder', shortName: 'FLD', category: 'utility', color: '#8b5cf6' },
  ],
  AMERICAN_FOOTBALL: [
    { position: 'QUARTERBACK', name: 'Quarterback', shortName: 'QB', category: 'midfielder', color: '#22c55e' },
    { position: 'RUNNING_BACK', name: 'Running Back', shortName: 'RB', category: 'forward', color: '#ef4444' },
    { position: 'WIDE_RECEIVER', name: 'Wide Receiver', shortName: 'WR', category: 'forward', color: '#ef4444' },
    { position: 'TIGHT_END', name: 'Tight End', shortName: 'TE', category: 'forward', color: '#ef4444' },
    { position: 'LEFT_TACKLE', name: 'Left Tackle', shortName: 'LT', category: 'defender', color: '#3b82f6' },
    { position: 'LEFT_GUARD', name: 'Left Guard', shortName: 'LG', category: 'defender', color: '#3b82f6' },
    { position: 'CENTER_POSITION', name: 'Center', shortName: 'C', category: 'defender', color: '#3b82f6' },
    { position: 'RIGHT_GUARD', name: 'Right Guard', shortName: 'RG', category: 'defender', color: '#3b82f6' },
    { position: 'RIGHT_TACKLE', name: 'Right Tackle', shortName: 'RT', category: 'defender', color: '#3b82f6' },
    { position: 'LINEBACKER', name: 'Linebacker', shortName: 'LB', category: 'defender', color: '#3b82f6' },
    { position: 'DEFENSIVE_END', name: 'Defensive End', shortName: 'DE', category: 'defender', color: '#3b82f6' },
    { position: 'DEFENSIVE_TACKLE', name: 'Defensive Tackle', shortName: 'DT', category: 'defender', color: '#3b82f6' },
    { position: 'CORNERBACK', name: 'Cornerback', shortName: 'CB', category: 'defender', color: '#3b82f6' },
    { position: 'SAFETY', name: 'Safety', shortName: 'S', category: 'defender', color: '#3b82f6' },
    { position: 'KICKER', name: 'Kicker', shortName: 'K', category: 'utility', color: '#8b5cf6' },
    { position: 'PUNTER', name: 'Punter', shortName: 'P', category: 'utility', color: '#8b5cf6' },
  ],
  NETBALL: [
    { position: 'GOALKEEPER_NETBALL', name: 'Goal Keeper', shortName: 'GK', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'GOAL_DEFENSE', name: 'Goal Defence', shortName: 'GD', category: 'defender', color: '#3b82f6' },
    { position: 'WING_DEFENSE', name: 'Wing Defence', shortName: 'WD', category: 'defender', color: '#3b82f6' },
    { position: 'CENTER', name: 'Centre', shortName: 'C', category: 'midfielder', color: '#22c55e' },
    { position: 'WING_ATTACK', name: 'Wing Attack', shortName: 'WA', category: 'midfielder', color: '#22c55e' },
    { position: 'GOAL_ATTACK', name: 'Goal Attack', shortName: 'GA', category: 'forward', color: '#ef4444' },
    { position: 'GOAL_SHOOTER', name: 'Goal Shooter', shortName: 'GS', category: 'forward', color: '#ef4444' },
  ],
  HOCKEY: [
    { position: 'GOALTENDER', name: 'Goaltender', shortName: 'G', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'DEFENSEMAN', name: 'Left Defence', shortName: 'LD', category: 'defender', color: '#3b82f6' },
    { position: 'DEFENSEMAN', name: 'Right Defence', shortName: 'RD', category: 'defender', color: '#3b82f6' },
    { position: 'WINGER', name: 'Left Wing', shortName: 'LW', category: 'forward', color: '#ef4444' },
    { position: 'CENTER_HOCKEY', name: 'Center', shortName: 'C', category: 'forward', color: '#ef4444' },
    { position: 'WINGER', name: 'Right Wing', shortName: 'RW', category: 'forward', color: '#ef4444' },
  ],
  LACROSSE: [
    { position: 'GOALTENDER', name: 'Goalie', shortName: 'G', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'DEFENSEMAN', name: 'Defender', shortName: 'D', category: 'defender', color: '#3b82f6' },
    { position: 'CENTRAL_MIDFIELDER', name: 'Midfielder', shortName: 'M', category: 'midfielder', color: '#22c55e' },
    { position: 'STRIKER', name: 'Attacker', shortName: 'A', category: 'forward', color: '#ef4444' },
  ],
  AUSTRALIAN_RULES: [
    { position: 'FULLBACK', name: 'Full Back', shortName: 'FB', category: 'defender', color: '#3b82f6' },
    { position: 'CENTER_BACK', name: 'Back Pocket', shortName: 'BP', category: 'defender', color: '#3b82f6' },
    { position: 'CENTER_BACK', name: 'Centre Half Back', shortName: 'CHB', category: 'defender', color: '#3b82f6' },
    { position: 'LEFT_BACK', name: 'Half Back Flank', shortName: 'HBF', category: 'defender', color: '#3b82f6' },
    { position: 'CENTRAL_MIDFIELDER', name: 'Wing', shortName: 'W', category: 'midfielder', color: '#22c55e' },
    { position: 'CENTRAL_MIDFIELDER', name: 'Centre', shortName: 'C', category: 'midfielder', color: '#22c55e' },
    { position: 'UTILITY', name: 'Ruck', shortName: 'RK', category: 'utility', color: '#8b5cf6' },
    { position: 'UTILITY', name: 'Ruck Rover', shortName: 'RR', category: 'utility', color: '#8b5cf6' },
    { position: 'UTILITY', name: 'Rover', shortName: 'R', category: 'utility', color: '#8b5cf6' },
    { position: 'ATTACKING_MIDFIELDER', name: 'Centre Half Forward', shortName: 'CHF', category: 'forward', color: '#ef4444' },
    { position: 'LEFT_WINGER', name: 'Half Forward Flank', shortName: 'HFF', category: 'forward', color: '#ef4444' },
    { position: 'STRIKER', name: 'Full Forward', shortName: 'FF', category: 'forward', color: '#ef4444' },
    { position: 'STRIKER', name: 'Forward Pocket', shortName: 'FP', category: 'forward', color: '#ef4444' },
  ],
  GAELIC_FOOTBALL: [
    { position: 'GOALKEEPER', name: 'Goalkeeper', shortName: 'GK', category: 'goalkeeper', color: '#f59e0b' },
    { position: 'FULLBACK', name: 'Full Back', shortName: 'FB', category: 'defender', color: '#3b82f6' },
    { position: 'CENTER_BACK', name: 'Corner Back', shortName: 'CB', category: 'defender', color: '#3b82f6' },
    { position: 'CENTER_BACK', name: 'Centre Back', shortName: 'CHB', category: 'defender', color: '#3b82f6' },
    { position: 'LEFT_BACK', name: 'Half Back', shortName: 'HB', category: 'defender', color: '#3b82f6' },
    { position: 'CENTRAL_MIDFIELDER', name: 'Midfield', shortName: 'MF', category: 'midfielder', color: '#22c55e' },
    { position: 'ATTACKING_MIDFIELDER', name: 'Centre Forward', shortName: 'CHF', category: 'forward', color: '#ef4444' },
    { position: 'LEFT_WINGER', name: 'Half Forward', shortName: 'HF', category: 'forward', color: '#ef4444' },
    { position: 'STRIKER', name: 'Full Forward', shortName: 'FF', category: 'forward', color: '#ef4444' },
    { position: 'STRIKER', name: 'Corner Forward', shortName: 'CF', category: 'forward', color: '#ef4444' },
  ],
};

// ============================================================================
// RANKING CATEGORIES BY SPORT
// ============================================================================

export interface RankingCategory {
  key: string;
  name: string;
  statKey: string;
  icon: string;
  color: string;
  isHigherBetter: boolean;
  unit?: string;
}

export const RANKING_CATEGORIES_BY_SPORT: Record<Sport, RankingCategory[]> = {
  FOOTBALL: [
    { key: 'topScorers', name: 'Top Scorers', statKey: 'goals', icon: '⚽', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Top Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'cleanSheets', name: 'Clean Sheets', statKey: 'cleanSheets', icon: '🧤', color: '#f59e0b', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'appearances', icon: '📊', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostMinutes', name: 'Minutes Played', statKey: 'minutesPlayed', icon: '⏱️', color: '#06b6d4', isHigherBetter: true, unit: 'min' },
    { key: 'disciplinary', name: 'Disciplinary', statKey: 'cards', icon: '🟨', color: '#ef4444', isHigherBetter: false },
  ],
  FUTSAL: [
    { key: 'topScorers', name: 'Top Scorers', statKey: 'goals', icon: '⚽', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Top Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'appearances', icon: '📊', color: '#8b5cf6', isHigherBetter: true },
  ],
  BEACH_FOOTBALL: [
    { key: 'topScorers', name: 'Top Scorers', statKey: 'goals', icon: '⚽', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Top Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'appearances', icon: '📊', color: '#8b5cf6', isHigherBetter: true },
  ],
  RUGBY: [
    { key: 'topTries', name: 'Try Scorers', statKey: 'tries', icon: '🏉', color: '#22c55e', isHigherBetter: true },
    { key: 'topConversions', name: 'Conversions', statKey: 'conversions', icon: '🥅', color: '#3b82f6', isHigherBetter: true },
    { key: 'topPenalties', name: 'Penalty Goals', statKey: 'penaltyGoals', icon: '🎯', color: '#f59e0b', isHigherBetter: true },
    { key: 'topTackles', name: 'Tackles Made', statKey: 'tacklesMade', icon: '💪', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Appearances', statKey: 'appearances', icon: '📊', color: '#06b6d4', isHigherBetter: true },
    { key: 'disciplinary', name: 'Disciplinary', statKey: 'cards', icon: '🟨', color: '#ef4444', isHigherBetter: false },
  ],
  BASKETBALL: [
    { key: 'topScorers', name: 'Points Leaders', statKey: 'goals', icon: '🏀', color: '#22c55e', isHigherBetter: true },
    { key: 'topRebounders', name: 'Rebounders', statKey: 'rebounds', icon: '📊', color: '#3b82f6', isHigherBetter: true },
    { key: 'topAssists', name: 'Assists', statKey: 'assists', icon: '🅰️', color: '#f59e0b', isHigherBetter: true },
    { key: 'topSteals', name: 'Steals', statKey: 'steals', icon: '🤏', color: '#8b5cf6', isHigherBetter: true },
    { key: 'topBlocks', name: 'Blocks', statKey: 'blocks', icon: '✋', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'appearances', icon: '🎮', color: '#ec4899', isHigherBetter: true },
  ],
  CRICKET: [
    { key: 'topRunScorers', name: 'Run Scorers', statKey: 'runs', icon: '🏏', color: '#22c55e', isHigherBetter: true },
    { key: 'topWicketTakers', name: 'Wicket Takers', statKey: 'wickets', icon: '🎯', color: '#3b82f6', isHigherBetter: true },
    { key: 'topCatches', name: 'Catches', statKey: 'catches', icon: '🧤', color: '#f59e0b', isHigherBetter: true },
    { key: 'topCenturies', name: 'Centuries', statKey: 'centuries', icon: '💯', color: '#8b5cf6', isHigherBetter: true },
    { key: 'bestAverage', name: 'Batting Average', statKey: 'battingAverage', icon: '📈', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Matches', statKey: 'appearances', icon: '📊', color: '#ec4899', isHigherBetter: true },
  ],
  AMERICAN_FOOTBALL: [
    { key: 'topTouchdowns', name: 'Touchdowns', statKey: 'touchdowns', icon: '🏈', color: '#22c55e', isHigherBetter: true },
    { key: 'topPassingYards', name: 'Passing Yards', statKey: 'passingYards', icon: '📊', color: '#3b82f6', isHigherBetter: true, unit: 'yds' },
    { key: 'topRushingYards', name: 'Rushing Yards', statKey: 'rushingYards', icon: '🏃', color: '#f59e0b', isHigherBetter: true, unit: 'yds' },
    { key: 'topReceivingYards', name: 'Receiving Yards', statKey: 'receivingYards', icon: '🤲', color: '#8b5cf6', isHigherBetter: true, unit: 'yds' },
    { key: 'topInterceptions', name: 'Interceptions', statKey: 'interceptionsMade', icon: '✋', color: '#06b6d4', isHigherBetter: true },
    { key: 'topSacks', name: 'Sacks', statKey: 'sacks', icon: '💥', color: '#ef4444', isHigherBetter: true },
  ],
  NETBALL: [
    { key: 'topScorers', name: 'Goal Scorers', statKey: 'goals', icon: '🥅', color: '#22c55e', isHigherBetter: true },
    { key: 'topAccuracy', name: 'Shooting %', statKey: 'shootingPercent', icon: '🎯', color: '#3b82f6', isHigherBetter: true, unit: '%' },
    { key: 'topInterceptions', name: 'Intercepts', statKey: 'gains', icon: '✋', color: '#f59e0b', isHigherBetter: true },
    { key: 'topDeflections', name: 'Deflections', statKey: 'deflections', icon: '👋', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'appearances', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
  HOCKEY: [
    { key: 'topScorers', name: 'Goal Scorers', statKey: 'goals', icon: '🏒', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'topPoints', name: 'Points', statKey: 'points', icon: '⭐', color: '#f59e0b', isHigherBetter: true },
    { key: 'topPlusMinus', name: '+/-', statKey: 'plusMinus', icon: '📊', color: '#8b5cf6', isHigherBetter: true },
    { key: 'topSaves', name: 'Saves (Goalies)', statKey: 'saves', icon: '🧤', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'appearances', icon: '🎮', color: '#ec4899', isHigherBetter: true },
  ],
  LACROSSE: [
    { key: 'topScorers', name: 'Goal Scorers', statKey: 'goals', icon: '🥍', color: '#22c55e', isHigherBetter: true },
    { key: 'topAssists', name: 'Assists', statKey: 'assists', icon: '🅰️', color: '#3b82f6', isHigherBetter: true },
    { key: 'topGroundBalls', name: 'Ground Balls', statKey: 'groundBalls', icon: '⚫', color: '#f59e0b', isHigherBetter: true },
    { key: 'topFaceoffs', name: 'Faceoff Wins', statKey: 'faceoffsWon', icon: '🔄', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'appearances', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
  AUSTRALIAN_RULES: [
    { key: 'topGoals', name: 'Goal Kickers', statKey: 'goals', icon: '🏉', color: '#22c55e', isHigherBetter: true },
    { key: 'topDisposals', name: 'Disposals', statKey: 'disposals', icon: '📊', color: '#3b82f6', isHigherBetter: true },
    { key: 'topMarks', name: 'Marks', statKey: 'marks', icon: '✋', color: '#f59e0b', isHigherBetter: true },
    { key: 'topTackles', name: 'Tackles', statKey: 'tackles', icon: '💪', color: '#8b5cf6', isHigherBetter: true },
    { key: 'topHitouts', name: 'Hitouts (Rucks)', statKey: 'hitouts', icon: '⬆️', color: '#06b6d4', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'appearances', icon: '🎮', color: '#ec4899', isHigherBetter: true },
  ],
  GAELIC_FOOTBALL: [
    { key: 'topScorers', name: 'Score Leaders', statKey: 'goals', icon: '🏐', color: '#22c55e', isHigherBetter: true },
    { key: 'topPoints', name: 'Points Scored', statKey: 'points', icon: '🎯', color: '#3b82f6', isHigherBetter: true },
    { key: 'topFrees', name: 'Free Takers', statKey: 'frees', icon: '⚫', color: '#f59e0b', isHigherBetter: true },
    { key: 'topMarks', name: 'Marks', statKey: 'marks', icon: '✋', color: '#8b5cf6', isHigherBetter: true },
    { key: 'mostAppearances', name: 'Games Played', statKey: 'appearances', icon: '📊', color: '#06b6d4', isHigherBetter: true },
  ],
};

// ============================================================================
// DRILL CATEGORIES BY SPORT
// ============================================================================

export const DRILL_CATEGORIES_BY_SPORT: Record<Sport, DrillCategory[]> = {
  FOOTBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'FIRST_TOUCH', 'CROSSING', 'HEADING',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'SET_PIECES', 'TRANSITIONS', 'PRESSING',
    'BUILD_UP_PLAY', 'COUNTER_ATTACK', 'GOALKEEPER_TRAINING', 'SMALL_SIDED_GAMES',
    'MATCH_SIMULATION', 'CONDITIONING', 'COOL_DOWN', 'RECOVERY',
  ],
  FUTSAL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'FIRST_TOUCH',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'SET_PIECES', 'TRANSITIONS',
    'SMALL_SIDED_GAMES', 'CONDITIONING', 'COOL_DOWN',
  ],
  BEACH_FOOTBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'HEADING',
    'ATTACKING_PATTERNS', 'SET_PIECES', 'SMALL_SIDED_GAMES', 'CONDITIONING', 'COOL_DOWN',
  ],
  RUGBY: [
    'WARM_UP', 'PASSING', 'TACKLING_TECHNIQUE', 'SCRUMMAGING', 'LINEOUT',
    'RUCKING', 'MAULING', 'BREAKDOWN', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS',
    'SET_PIECES', 'CONDITIONING', 'STRENGTH_POWER', 'COOL_DOWN', 'RECOVERY',
  ],
  BASKETBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'DRIBBLING', 'FREE_THROWS', 'THREE_POINT_SHOOTING',
    'POST_MOVES', 'PICK_AND_ROLL', 'FAST_BREAK', 'ZONE_DEFENSE', 'MAN_TO_MAN',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING', 'COOL_DOWN',
  ],
  CRICKET: [
    'WARM_UP', 'BATTING_TECHNIQUE', 'BOWLING_TECHNIQUE', 'FIELDING_DRILLS',
    'CATCHING', 'WICKET_KEEPING', 'CONDITIONING', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  AMERICAN_FOOTBALL: [
    'WARM_UP', 'PASSING', 'BLOCKING', 'ROUTE_RUNNING', 'COVERAGE', 'TACKLING_TECHNIQUE',
    'SPECIAL_TEAMS', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING',
    'STRENGTH_POWER', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  NETBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'FOOTWORK', 'INTERCEPTIONS',
    'COURT_MOVEMENT', 'CIRCLE_WORK', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS',
    'CONDITIONING', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  HOCKEY: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'STICK_HANDLING', 'SLAP_SHOT',
    'POWER_PLAY', 'PENALTY_KILL', 'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS',
    'GOALKEEPER_TRAINING', 'CONDITIONING', 'COOL_DOWN',
  ],
  LACROSSE: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'STICK_HANDLING', 'CATCHING',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING', 'COOL_DOWN',
  ],
  AUSTRALIAN_RULES: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'TACKLING_TECHNIQUE',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'CONDITIONING',
    'STRENGTH_POWER', 'SPEED_AGILITY', 'COOL_DOWN',
  ],
  GAELIC_FOOTBALL: [
    'WARM_UP', 'PASSING', 'SHOOTING', 'CATCHING', 'TACKLING_TECHNIQUE',
    'DEFENSIVE_SHAPE', 'ATTACKING_PATTERNS', 'SET_PIECES', 'CONDITIONING', 'COOL_DOWN',
  ],
};

// ============================================================================
// PLAYER STATUS CONFIGURATIONS
// ============================================================================

export const PLAYER_STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INJURED: { label: 'Injured', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  SUSPENDED: { label: 'Suspended', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  ON_LOAN: { label: 'On Loan', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  INTERNATIONAL_DUTY: { label: 'International', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIG[sport] || SPORT_CONFIG.FOOTBALL;
}

export function getPositionsForSport(sport: Sport): PositionInfo[] {
  return POSITIONS_BY_SPORT[sport] || POSITIONS_BY_SPORT.FOOTBALL;
}

export function getRankingCategories(sport: Sport): RankingCategory[] {
  return RANKING_CATEGORIES_BY_SPORT[sport] || RANKING_CATEGORIES_BY_SPORT.FOOTBALL;
}

export function getDrillCategories(sport: Sport): DrillCategory[] {
  return DRILL_CATEGORIES_BY_SPORT[sport] || DRILL_CATEGORIES_BY_SPORT.FOOTBALL;
}

export function formatSportName(sport: Sport): string {
  return SPORT_CONFIG[sport]?.name || sport;
}

export function getSportIcon(sport: Sport): string {
  return SPORT_CONFIG[sport]?.icon || '⚽';
}

export function getPositionColor(category: string): string {
  const colors: Record<string, string> = {
    goalkeeper: '#f59e0b',
    defender: '#3b82f6',
    midfielder: '#22c55e',
    forward: '#ef4444',
    utility: '#8b5cf6',
  };
  return colors[category] || '#6b7280';
}

export function calculateAge(dateOfBirth: Date | string | null): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}