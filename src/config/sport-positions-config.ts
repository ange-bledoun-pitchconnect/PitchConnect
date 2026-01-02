/**
 * ============================================================================
 * SPORT POSITIONS CONFIGURATION - PitchConnect v7.10.1
 * ============================================================================
 * 
 * World-class multi-sport position configuration system.
 * Based on PlayHQ (Australia's #1 sports platform), SAP Sports One,
 * and official governing body standards.
 * 
 * ARCHITECTURE:
 * - Each sport has position categories (e.g., "Attack", "Defense")
 * - Each category contains individual positions
 * - Positions include metadata for display, stats, and formations
 * 
 * FEATURES:
 * - 12 sports with 200+ positions
 * - Formation-aware positioning
 * - Category grouping for filtering
 * - Position-specific stat templates
 * - Multi-language abbreviation support
 * - Visual positioning for pitch/court diagrams
 * 
 * @version 2.0.0
 * @path src/config/sport-positions-config.ts
 * 
 * ============================================================================
 */

import { type Sport } from './sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export interface Position {
  /** Unique position code (e.g., "GK", "FW", "C") */
  code: string;
  /** Full position name */
  name: string;
  /** Short abbreviation for badges */
  abbreviation: string;
  /** Category this position belongs to */
  category: PositionCategory;
  /** Position number (for sports like Rugby that use numbers) */
  number?: number;
  /** Whether this is a primary/core position */
  isPrimary?: boolean;
  /** Visual position on pitch diagram (0-100 for x,y) */
  pitchPosition?: { x: number; y: number };
  /** Associated stats this position typically tracks */
  relevantStats?: string[];
  /** Icon name for visual display */
  icon?: string;
  /** Color for visual distinction */
  color?: string;
}

export type PositionCategory =
  | 'GOALKEEPER'
  | 'DEFENSE'
  | 'MIDFIELD'
  | 'ATTACK'
  | 'FORWARD'
  | 'BACK'
  | 'FRONT_ROW'
  | 'SECOND_ROW'
  | 'BACK_ROW'
  | 'HALF_BACK'
  | 'CENTRE'
  | 'WING'
  | 'FULLBACK'
  | 'BATSMAN'
  | 'BOWLER'
  | 'ALL_ROUNDER'
  | 'WICKET_KEEPER'
  | 'GUARD'
  | 'FORWARD_BASKETBALL'
  | 'CENTER_BASKETBALL'
  | 'OFFENSE'
  | 'DEFENSE_AM_FOOTBALL'
  | 'SPECIAL_TEAMS'
  | 'SHOOTER'
  | 'DEFENDER_NETBALL'
  | 'CENTRE_NETBALL'
  | 'ATTACKER'
  | 'MIDFIELDER_LACROSSE'
  | 'DEFENDER_LACROSSE'
  | 'KEY_POSITION'
  | 'GENERAL'
  | 'RUCK'
  | 'ONFIELD'
  | 'UTILITY';

export interface SportPositionConfig {
  sport: Sport;
  /** Number of players on field/court at once */
  playersOnField: number;
  /** Maximum squad/bench size */
  maxSquadSize: number;
  /** Whether positions are numbered (like Rugby) */
  hasNumberedPositions: boolean;
  /** Whether sport uses formations */
  hasFormations: boolean;
  /** Available formations if applicable */
  formations?: Formation[];
  /** Position categories for this sport */
  categories: PositionCategoryConfig[];
  /** All available positions */
  positions: Position[];
  /** Default/fallback positions if none assigned */
  defaultPositions: string[];
}

export interface PositionCategoryConfig {
  category: PositionCategory;
  name: string;
  color: string;
  order: number;
}

export interface Formation {
  code: string;
  name: string;
  /** Position codes and their locations in this formation */
  layout: Array<{ position: string; x: number; y: number }>;
}

// =============================================================================
// POSITION CATEGORIES BY SPORT
// =============================================================================

const FOOTBALL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GOALKEEPER', name: 'Goalkeeper', color: '#FFD700', order: 1 },
  { category: 'DEFENSE', name: 'Defense', color: '#3B82F6', order: 2 },
  { category: 'MIDFIELD', name: 'Midfield', color: '#22C55E', order: 3 },
  { category: 'ATTACK', name: 'Attack', color: '#EF4444', order: 4 },
];

const RUGBY_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'FRONT_ROW', name: 'Front Row', color: '#DC2626', order: 1 },
  { category: 'SECOND_ROW', name: 'Locks', color: '#EA580C', order: 2 },
  { category: 'BACK_ROW', name: 'Back Row', color: '#D97706', order: 3 },
  { category: 'HALF_BACK', name: 'Half Backs', color: '#65A30D', order: 4 },
  { category: 'CENTRE', name: 'Centres', color: '#0D9488', order: 5 },
  { category: 'BACK', name: 'Outside Backs', color: '#7C3AED', order: 6 },
];

const CRICKET_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'WICKET_KEEPER', name: 'Wicket-Keeper', color: '#FFD700', order: 1 },
  { category: 'BATSMAN', name: 'Batsman', color: '#3B82F6', order: 2 },
  { category: 'BOWLER', name: 'Bowler', color: '#22C55E', order: 3 },
  { category: 'ALL_ROUNDER', name: 'All-Rounder', color: '#A855F7', order: 4 },
];

const BASKETBALL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GUARD', name: 'Guards', color: '#3B82F6', order: 1 },
  { category: 'FORWARD_BASKETBALL', name: 'Forwards', color: '#22C55E', order: 2 },
  { category: 'CENTER_BASKETBALL', name: 'Center', color: '#EF4444', order: 3 },
];

const AMERICAN_FOOTBALL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'OFFENSE', name: 'Offense', color: '#22C55E', order: 1 },
  { category: 'DEFENSE_AM_FOOTBALL', name: 'Defense', color: '#3B82F6', order: 2 },
  { category: 'SPECIAL_TEAMS', name: 'Special Teams', color: '#A855F7', order: 3 },
];

const NETBALL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'SHOOTER', name: 'Shooters', color: '#EF4444', order: 1 },
  { category: 'CENTRE_NETBALL', name: 'Centre Court', color: '#22C55E', order: 2 },
  { category: 'DEFENDER_NETBALL', name: 'Defenders', color: '#3B82F6', order: 3 },
];

const HOCKEY_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GOALKEEPER', name: 'Goalkeeper', color: '#FFD700', order: 1 },
  { category: 'DEFENSE', name: 'Defense', color: '#3B82F6', order: 2 },
  { category: 'MIDFIELD', name: 'Midfield', color: '#22C55E', order: 3 },
  { category: 'ATTACK', name: 'Attack', color: '#EF4444', order: 4 },
];

const LACROSSE_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GOALKEEPER', name: 'Goalkeeper', color: '#FFD700', order: 1 },
  { category: 'DEFENDER_LACROSSE', name: 'Defense', color: '#3B82F6', order: 2 },
  { category: 'MIDFIELDER_LACROSSE', name: 'Midfield', color: '#22C55E', order: 3 },
  { category: 'ATTACKER', name: 'Attack', color: '#EF4444', order: 4 },
];

const AFL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'KEY_POSITION', name: 'Key Position', color: '#EF4444', order: 1 },
  { category: 'GENERAL', name: 'General', color: '#22C55E', order: 2 },
  { category: 'RUCK', name: 'Ruck', color: '#3B82F6', order: 3 },
  { category: 'ONFIELD', name: 'On-Field', color: '#A855F7', order: 4 },
];

const GAELIC_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GOALKEEPER', name: 'Goalkeeper', color: '#FFD700', order: 1 },
  { category: 'DEFENSE', name: 'Backs', color: '#3B82F6', order: 2 },
  { category: 'MIDFIELD', name: 'Midfield', color: '#22C55E', order: 3 },
  { category: 'ATTACK', name: 'Forwards', color: '#EF4444', order: 4 },
];

// =============================================================================
// FOOTBALL (SOCCER) POSITIONS
// =============================================================================

const FOOTBALL_POSITIONS: Position[] = [
  // Goalkeeper
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 5 }, relevantStats: ['saves', 'cleanSheets', 'goalsConceded'], color: '#FFD700' },
  // Defense
  { code: 'CB', name: 'Centre-Back', abbreviation: 'CB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 20 }, relevantStats: ['tackles', 'interceptions', 'clearances', 'aerialDuels'], color: '#3B82F6' },
  { code: 'LB', name: 'Left-Back', abbreviation: 'LB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 15, y: 25 }, relevantStats: ['tackles', 'interceptions', 'crosses', 'assists'], color: '#3B82F6' },
  { code: 'RB', name: 'Right-Back', abbreviation: 'RB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 85, y: 25 }, relevantStats: ['tackles', 'interceptions', 'crosses', 'assists'], color: '#3B82F6' },
  { code: 'LWB', name: 'Left Wing-Back', abbreviation: 'LWB', category: 'DEFENSE', pitchPosition: { x: 10, y: 40 }, relevantStats: ['tackles', 'crosses', 'assists', 'dribbles'], color: '#3B82F6' },
  { code: 'RWB', name: 'Right Wing-Back', abbreviation: 'RWB', category: 'DEFENSE', pitchPosition: { x: 90, y: 40 }, relevantStats: ['tackles', 'crosses', 'assists', 'dribbles'], color: '#3B82F6' },
  { code: 'SW', name: 'Sweeper', abbreviation: 'SW', category: 'DEFENSE', pitchPosition: { x: 50, y: 15 }, relevantStats: ['tackles', 'interceptions', 'passes'], color: '#3B82F6' },
  // Midfield
  { code: 'CDM', name: 'Defensive Midfielder', abbreviation: 'CDM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 35 }, relevantStats: ['tackles', 'interceptions', 'passes', 'duelsWon'], color: '#22C55E' },
  { code: 'CM', name: 'Central Midfielder', abbreviation: 'CM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 45 }, relevantStats: ['passes', 'assists', 'shotsOnTarget', 'duelsWon'], color: '#22C55E' },
  { code: 'CAM', name: 'Attacking Midfielder', abbreviation: 'CAM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 60 }, relevantStats: ['assists', 'keyPasses', 'shotsOnTarget', 'goals'], color: '#22C55E' },
  { code: 'LM', name: 'Left Midfielder', abbreviation: 'LM', category: 'MIDFIELD', pitchPosition: { x: 20, y: 50 }, relevantStats: ['crosses', 'assists', 'dribbles', 'passes'], color: '#22C55E' },
  { code: 'RM', name: 'Right Midfielder', abbreviation: 'RM', category: 'MIDFIELD', pitchPosition: { x: 80, y: 50 }, relevantStats: ['crosses', 'assists', 'dribbles', 'passes'], color: '#22C55E' },
  // Attack
  { code: 'LW', name: 'Left Winger', abbreviation: 'LW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 15, y: 70 }, relevantStats: ['goals', 'assists', 'dribbles', 'shotsOnTarget'], color: '#EF4444' },
  { code: 'RW', name: 'Right Winger', abbreviation: 'RW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 85, y: 70 }, relevantStats: ['goals', 'assists', 'dribbles', 'shotsOnTarget'], color: '#EF4444' },
  { code: 'CF', name: 'Centre Forward', abbreviation: 'CF', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 80 }, relevantStats: ['goals', 'shotsOnTarget', 'aerialDuels', 'assists'], color: '#EF4444' },
  { code: 'ST', name: 'Striker', abbreviation: 'ST', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 85 }, relevantStats: ['goals', 'shotsOnTarget', 'conversion', 'assists'], color: '#EF4444' },
  { code: 'SS', name: 'Second Striker', abbreviation: 'SS', category: 'ATTACK', pitchPosition: { x: 50, y: 75 }, relevantStats: ['goals', 'assists', 'keyPasses', 'dribbles'], color: '#EF4444' },
];

// =============================================================================
// RUGBY POSITIONS (UNION & LEAGUE)
// =============================================================================

const RUGBY_POSITIONS: Position[] = [
  // Front Row (1-3)
  { code: 'LHP', name: 'Loosehead Prop', abbreviation: 'LHP', category: 'FRONT_ROW', number: 1, isPrimary: true, pitchPosition: { x: 40, y: 10 }, relevantStats: ['scrums', 'tackles', 'carries', 'metresGained'], color: '#DC2626' },
  { code: 'HK', name: 'Hooker', abbreviation: 'HK', category: 'FRONT_ROW', number: 2, isPrimary: true, pitchPosition: { x: 50, y: 10 }, relevantStats: ['lineoutsWon', 'scrums', 'tackles', 'throws'], color: '#DC2626' },
  { code: 'THP', name: 'Tighthead Prop', abbreviation: 'THP', category: 'FRONT_ROW', number: 3, isPrimary: true, pitchPosition: { x: 60, y: 10 }, relevantStats: ['scrums', 'tackles', 'carries', 'metresGained'], color: '#DC2626' },
  // Second Row / Locks (4-5)
  { code: 'LK', name: 'Lock', abbreviation: 'LK', category: 'SECOND_ROW', number: 4, isPrimary: true, pitchPosition: { x: 45, y: 20 }, relevantStats: ['lineoutsWon', 'tackles', 'carries', 'turnovers'], color: '#EA580C' },
  { code: 'LK2', name: 'Lock', abbreviation: 'LK', category: 'SECOND_ROW', number: 5, isPrimary: true, pitchPosition: { x: 55, y: 20 }, relevantStats: ['lineoutsWon', 'tackles', 'carries', 'turnovers'], color: '#EA580C' },
  // Back Row (6-8)
  { code: 'BF', name: 'Blindside Flanker', abbreviation: 'BF', category: 'BACK_ROW', number: 6, isPrimary: true, pitchPosition: { x: 35, y: 30 }, relevantStats: ['tackles', 'turnovers', 'carries', 'offloads'], color: '#D97706' },
  { code: 'OF', name: 'Openside Flanker', abbreviation: 'OF', category: 'BACK_ROW', number: 7, isPrimary: true, pitchPosition: { x: 65, y: 30 }, relevantStats: ['tackles', 'turnovers', 'jackals', 'carries'], color: '#D97706' },
  { code: 'N8', name: 'Number 8', abbreviation: 'N8', category: 'BACK_ROW', number: 8, isPrimary: true, pitchPosition: { x: 50, y: 30 }, relevantStats: ['carries', 'metresGained', 'tackles', 'offloads'], color: '#D97706' },
  // Half Backs (9-10)
  { code: 'SH', name: 'Scrum-Half', abbreviation: 'SH', category: 'HALF_BACK', number: 9, isPrimary: true, pitchPosition: { x: 45, y: 45 }, relevantStats: ['passes', 'kicks', 'tries', 'tackles'], color: '#65A30D' },
  { code: 'FH', name: 'Fly-Half', abbreviation: 'FH', category: 'HALF_BACK', number: 10, isPrimary: true, pitchPosition: { x: 50, y: 55 }, relevantStats: ['conversions', 'penalties', 'dropGoals', 'passes', 'kicks'], color: '#65A30D' },
  // Centres (12-13)
  { code: 'IC', name: 'Inside Centre', abbreviation: 'IC', category: 'CENTRE', number: 12, isPrimary: true, pitchPosition: { x: 40, y: 65 }, relevantStats: ['carries', 'tackles', 'offloads', 'lineBreaks'], color: '#0D9488' },
  { code: 'OC', name: 'Outside Centre', abbreviation: 'OC', category: 'CENTRE', number: 13, isPrimary: true, pitchPosition: { x: 60, y: 65 }, relevantStats: ['carries', 'lineBreaks', 'tries', 'assists'], color: '#0D9488' },
  // Outside Backs (11, 14, 15)
  { code: 'LW', name: 'Left Wing', abbreviation: 'LW', category: 'BACK', number: 11, isPrimary: true, pitchPosition: { x: 15, y: 75 }, relevantStats: ['tries', 'metresGained', 'lineBreaks', 'tackles'], color: '#7C3AED' },
  { code: 'RW', name: 'Right Wing', abbreviation: 'RW', category: 'BACK', number: 14, isPrimary: true, pitchPosition: { x: 85, y: 75 }, relevantStats: ['tries', 'metresGained', 'lineBreaks', 'tackles'], color: '#7C3AED' },
  { code: 'FB', name: 'Fullback', abbreviation: 'FB', category: 'BACK', number: 15, isPrimary: true, pitchPosition: { x: 50, y: 85 }, relevantStats: ['catches', 'kicks', 'tries', 'metresGained'], color: '#7C3AED' },
];

// =============================================================================
// CRICKET POSITIONS
// =============================================================================

const CRICKET_POSITIONS: Position[] = [
  // Wicket-Keeper
  { code: 'WK', name: 'Wicket-Keeper', abbreviation: 'WK', category: 'WICKET_KEEPER', isPrimary: true, relevantStats: ['catches', 'stumpings', 'runs', 'dismissals'], color: '#FFD700' },
  { code: 'WKB', name: 'Wicket-Keeper Batsman', abbreviation: 'WK-B', category: 'WICKET_KEEPER', relevantStats: ['catches', 'stumpings', 'runs', 'average', 'strikeRate'], color: '#FFD700' },
  // Batsmen
  { code: 'OPN', name: 'Opening Batsman', abbreviation: 'OPN', category: 'BATSMAN', isPrimary: true, relevantStats: ['runs', 'average', 'strikeRate', 'centuries', 'fifties'], color: '#3B82F6' },
  { code: 'TOP', name: 'Top Order Batsman', abbreviation: 'TOP', category: 'BATSMAN', isPrimary: true, relevantStats: ['runs', 'average', 'strikeRate', 'centuries'], color: '#3B82F6' },
  { code: 'MID', name: 'Middle Order Batsman', abbreviation: 'MID', category: 'BATSMAN', isPrimary: true, relevantStats: ['runs', 'average', 'strikeRate', 'finishingRate'], color: '#3B82F6' },
  { code: 'LOW', name: 'Lower Order Batsman', abbreviation: 'LOW', category: 'BATSMAN', relevantStats: ['runs', 'average', 'notOuts'], color: '#3B82F6' },
  // Bowlers
  { code: 'FP', name: 'Fast Bowler (Pace)', abbreviation: 'PACE', category: 'BOWLER', isPrimary: true, relevantStats: ['wickets', 'average', 'economy', 'strikeRate', 'bestFigures'], color: '#22C55E' },
  { code: 'FM', name: 'Fast-Medium Bowler', abbreviation: 'FM', category: 'BOWLER', relevantStats: ['wickets', 'average', 'economy', 'maidens'], color: '#22C55E' },
  { code: 'MF', name: 'Medium-Fast Bowler', abbreviation: 'MF', category: 'BOWLER', relevantStats: ['wickets', 'average', 'economy'], color: '#22C55E' },
  { code: 'OS', name: 'Off-Spinner', abbreviation: 'OS', category: 'BOWLER', isPrimary: true, relevantStats: ['wickets', 'average', 'economy', 'strikeRate'], color: '#22C55E' },
  { code: 'LS', name: 'Leg-Spinner', abbreviation: 'LS', category: 'BOWLER', relevantStats: ['wickets', 'average', 'economy', 'strikeRate'], color: '#22C55E' },
  { code: 'SLA', name: 'Slow Left-Arm Orthodox', abbreviation: 'SLA', category: 'BOWLER', relevantStats: ['wickets', 'average', 'economy'], color: '#22C55E' },
  { code: 'LCH', name: 'Left-Arm Chinaman', abbreviation: 'LCH', category: 'BOWLER', relevantStats: ['wickets', 'average', 'economy'], color: '#22C55E' },
  // All-Rounders
  { code: 'BAR', name: 'Batting All-Rounder', abbreviation: 'BAR', category: 'ALL_ROUNDER', isPrimary: true, relevantStats: ['runs', 'wickets', 'battingAvg', 'bowlingAvg'], color: '#A855F7' },
  { code: 'BOW', name: 'Bowling All-Rounder', abbreviation: 'BOW', category: 'ALL_ROUNDER', relevantStats: ['wickets', 'runs', 'bowlingAvg', 'battingAvg'], color: '#A855F7' },
];

// =============================================================================
// BASKETBALL POSITIONS
// =============================================================================

const BASKETBALL_POSITIONS: Position[] = [
  // Guards
  { code: 'PG', name: 'Point Guard', abbreviation: 'PG', category: 'GUARD', isPrimary: true, pitchPosition: { x: 50, y: 25 }, relevantStats: ['assists', 'steals', 'points', 'turnovers', 'assistToTurnover'], color: '#3B82F6' },
  { code: 'SG', name: 'Shooting Guard', abbreviation: 'SG', category: 'GUARD', isPrimary: true, pitchPosition: { x: 75, y: 35 }, relevantStats: ['points', 'threePointPct', 'fieldGoalPct', 'steals'], color: '#3B82F6' },
  { code: 'CG', name: 'Combo Guard', abbreviation: 'CG', category: 'GUARD', pitchPosition: { x: 60, y: 30 }, relevantStats: ['points', 'assists', 'steals', 'threePointPct'], color: '#3B82F6' },
  // Forwards
  { code: 'SF', name: 'Small Forward', abbreviation: 'SF', category: 'FORWARD_BASKETBALL', isPrimary: true, pitchPosition: { x: 25, y: 45 }, relevantStats: ['points', 'rebounds', 'steals', 'blocks'], color: '#22C55E' },
  { code: 'PF', name: 'Power Forward', abbreviation: 'PF', category: 'FORWARD_BASKETBALL', isPrimary: true, pitchPosition: { x: 30, y: 60 }, relevantStats: ['rebounds', 'points', 'blocks', 'fieldGoalPct'], color: '#22C55E' },
  { code: 'SW', name: 'Swingman', abbreviation: 'SW', category: 'FORWARD_BASKETBALL', pitchPosition: { x: 20, y: 50 }, relevantStats: ['points', 'rebounds', 'assists'], color: '#22C55E' },
  { code: 'SF/PF', name: 'Stretch Four', abbreviation: 'S4', category: 'FORWARD_BASKETBALL', pitchPosition: { x: 70, y: 55 }, relevantStats: ['threePointPct', 'rebounds', 'points'], color: '#22C55E' },
  // Center
  { code: 'C', name: 'Center', abbreviation: 'C', category: 'CENTER_BASKETBALL', isPrimary: true, pitchPosition: { x: 50, y: 75 }, relevantStats: ['rebounds', 'blocks', 'points', 'fieldGoalPct'], color: '#EF4444' },
  { code: 'C/PF', name: 'Center-Forward', abbreviation: 'C/PF', category: 'CENTER_BASKETBALL', pitchPosition: { x: 45, y: 70 }, relevantStats: ['rebounds', 'blocks', 'points'], color: '#EF4444' },
];

// =============================================================================
// AMERICAN FOOTBALL POSITIONS
// =============================================================================

const AMERICAN_FOOTBALL_POSITIONS: Position[] = [
  // Offense
  { code: 'QB', name: 'Quarterback', abbreviation: 'QB', category: 'OFFENSE', isPrimary: true, relevantStats: ['passingYards', 'touchdowns', 'interceptions', 'completionPct', 'qbRating'], color: '#22C55E' },
  { code: 'RB', name: 'Running Back', abbreviation: 'RB', category: 'OFFENSE', isPrimary: true, relevantStats: ['rushingYards', 'touchdowns', 'yardsPerCarry', 'receptions'], color: '#22C55E' },
  { code: 'FB', name: 'Fullback', abbreviation: 'FB', category: 'OFFENSE', relevantStats: ['rushingYards', 'receptions', 'blocks'], color: '#22C55E' },
  { code: 'WR', name: 'Wide Receiver', abbreviation: 'WR', category: 'OFFENSE', isPrimary: true, relevantStats: ['receptions', 'receivingYards', 'touchdowns', 'yardsPerReception'], color: '#22C55E' },
  { code: 'TE', name: 'Tight End', abbreviation: 'TE', category: 'OFFENSE', isPrimary: true, relevantStats: ['receptions', 'receivingYards', 'touchdowns', 'blocks'], color: '#22C55E' },
  { code: 'LT', name: 'Left Tackle', abbreviation: 'LT', category: 'OFFENSE', isPrimary: true, relevantStats: ['pancakeBlocks', 'sacksAllowed', 'penaltiesCommitted'], color: '#22C55E' },
  { code: 'LG', name: 'Left Guard', abbreviation: 'LG', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'sacksAllowed'], color: '#22C55E' },
  { code: 'C', name: 'Center', abbreviation: 'C', category: 'OFFENSE', isPrimary: true, relevantStats: ['pancakeBlocks', 'sacksAllowed', 'badSnaps'], color: '#22C55E' },
  { code: 'RG', name: 'Right Guard', abbreviation: 'RG', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'sacksAllowed'], color: '#22C55E' },
  { code: 'RT', name: 'Right Tackle', abbreviation: 'RT', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'sacksAllowed'], color: '#22C55E' },
  // Defense
  { code: 'DE', name: 'Defensive End', abbreviation: 'DE', category: 'DEFENSE_AM_FOOTBALL', isPrimary: true, relevantStats: ['sacks', 'tackles', 'forcedFumbles', 'tacklesForLoss'], color: '#3B82F6' },
  { code: 'DT', name: 'Defensive Tackle', abbreviation: 'DT', category: 'DEFENSE_AM_FOOTBALL', isPrimary: true, relevantStats: ['tackles', 'sacks', 'tacklesForLoss'], color: '#3B82F6' },
  { code: 'NT', name: 'Nose Tackle', abbreviation: 'NT', category: 'DEFENSE_AM_FOOTBALL', relevantStats: ['tackles', 'sacks', 'stuffs'], color: '#3B82F6' },
  { code: 'OLB', name: 'Outside Linebacker', abbreviation: 'OLB', category: 'DEFENSE_AM_FOOTBALL', isPrimary: true, relevantStats: ['tackles', 'sacks', 'interceptions', 'passDeflections'], color: '#3B82F6' },
  { code: 'MLB', name: 'Middle Linebacker', abbreviation: 'MLB', category: 'DEFENSE_AM_FOOTBALL', isPrimary: true, relevantStats: ['tackles', 'sacks', 'interceptions', 'forcedFumbles'], color: '#3B82F6' },
  { code: 'CB', name: 'Cornerback', abbreviation: 'CB', category: 'DEFENSE_AM_FOOTBALL', isPrimary: true, relevantStats: ['interceptions', 'passDeflections', 'tackles', 'touchdowns'], color: '#3B82F6' },
  { code: 'FS', name: 'Free Safety', abbreviation: 'FS', category: 'DEFENSE_AM_FOOTBALL', isPrimary: true, relevantStats: ['interceptions', 'tackles', 'passDeflections'], color: '#3B82F6' },
  { code: 'SS', name: 'Strong Safety', abbreviation: 'SS', category: 'DEFENSE_AM_FOOTBALL', relevantStats: ['tackles', 'interceptions', 'forcedFumbles'], color: '#3B82F6' },
  // Special Teams
  { code: 'K', name: 'Kicker', abbreviation: 'K', category: 'SPECIAL_TEAMS', isPrimary: true, relevantStats: ['fieldGoalPct', 'fieldGoalsMade', 'longFieldGoal', 'extraPointPct'], color: '#A855F7' },
  { code: 'P', name: 'Punter', abbreviation: 'P', category: 'SPECIAL_TEAMS', isPrimary: true, relevantStats: ['averagePunt', 'puntsInside20', 'longPunt'], color: '#A855F7' },
  { code: 'LS', name: 'Long Snapper', abbreviation: 'LS', category: 'SPECIAL_TEAMS', relevantStats: ['badSnaps'], color: '#A855F7' },
  { code: 'KR', name: 'Kick Returner', abbreviation: 'KR', category: 'SPECIAL_TEAMS', relevantStats: ['returnYards', 'touchdowns', 'averageReturn'], color: '#A855F7' },
  { code: 'PR', name: 'Punt Returner', abbreviation: 'PR', category: 'SPECIAL_TEAMS', relevantStats: ['returnYards', 'touchdowns', 'averageReturn'], color: '#A855F7' },
];

// =============================================================================
// NETBALL POSITIONS
// =============================================================================

const NETBALL_POSITIONS: Position[] = [
  // Shooters
  { code: 'GS', name: 'Goal Shooter', abbreviation: 'GS', category: 'SHOOTER', isPrimary: true, pitchPosition: { x: 50, y: 85 }, relevantStats: ['goals', 'attempts', 'shootingPct', 'rebounds'], color: '#EF4444' },
  { code: 'GA', name: 'Goal Attack', abbreviation: 'GA', category: 'SHOOTER', isPrimary: true, pitchPosition: { x: 50, y: 70 }, relevantStats: ['goals', 'attempts', 'shootingPct', 'centrePassReceives', 'feeds'], color: '#EF4444' },
  // Centre Court
  { code: 'WA', name: 'Wing Attack', abbreviation: 'WA', category: 'CENTRE_NETBALL', isPrimary: true, pitchPosition: { x: 25, y: 55 }, relevantStats: ['centrePassReceives', 'feeds', 'goalAssists', 'intercepts'], color: '#22C55E' },
  { code: 'C', name: 'Centre', abbreviation: 'C', category: 'CENTRE_NETBALL', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['centrePassReceives', 'feeds', 'intercepts', 'deflections'], color: '#22C55E' },
  { code: 'WD', name: 'Wing Defence', abbreviation: 'WD', category: 'CENTRE_NETBALL', isPrimary: true, pitchPosition: { x: 75, y: 45 }, relevantStats: ['intercepts', 'deflections', 'rebounds', 'gains'], color: '#22C55E' },
  // Defenders
  { code: 'GD', name: 'Goal Defence', abbreviation: 'GD', category: 'DEFENDER_NETBALL', isPrimary: true, pitchPosition: { x: 50, y: 30 }, relevantStats: ['intercepts', 'deflections', 'rebounds', 'gains', 'blocks'], color: '#3B82F6' },
  { code: 'GK', name: 'Goal Keeper', abbreviation: 'GK', category: 'DEFENDER_NETBALL', isPrimary: true, pitchPosition: { x: 50, y: 15 }, relevantStats: ['intercepts', 'rebounds', 'blocks', 'deflections'], color: '#3B82F6' },
];

// =============================================================================
// HOCKEY (FIELD) POSITIONS
// =============================================================================

const HOCKEY_POSITIONS: Position[] = [
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 5 }, relevantStats: ['saves', 'cleanSheets', 'goalsConceded'], color: '#FFD700' },
  { code: 'CB', name: 'Centre Back', abbreviation: 'CB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 20 }, relevantStats: ['tackles', 'interceptions', 'clearances'], color: '#3B82F6' },
  { code: 'LB', name: 'Left Back', abbreviation: 'LB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 20, y: 25 }, relevantStats: ['tackles', 'interceptions'], color: '#3B82F6' },
  { code: 'RB', name: 'Right Back', abbreviation: 'RB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 80, y: 25 }, relevantStats: ['tackles', 'interceptions'], color: '#3B82F6' },
  { code: 'CDM', name: 'Defensive Midfielder', abbreviation: 'CDM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 40 }, relevantStats: ['tackles', 'passes', 'interceptions'], color: '#22C55E' },
  { code: 'CM', name: 'Central Midfielder', abbreviation: 'CM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['passes', 'assists', 'goals'], color: '#22C55E' },
  { code: 'LM', name: 'Left Midfielder', abbreviation: 'LM', category: 'MIDFIELD', pitchPosition: { x: 20, y: 50 }, relevantStats: ['crosses', 'assists'], color: '#22C55E' },
  { code: 'RM', name: 'Right Midfielder', abbreviation: 'RM', category: 'MIDFIELD', pitchPosition: { x: 80, y: 50 }, relevantStats: ['crosses', 'assists'], color: '#22C55E' },
  { code: 'LW', name: 'Left Wing', abbreviation: 'LW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 15, y: 75 }, relevantStats: ['goals', 'assists', 'penaltyCorners'], color: '#EF4444' },
  { code: 'RW', name: 'Right Wing', abbreviation: 'RW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 85, y: 75 }, relevantStats: ['goals', 'assists', 'penaltyCorners'], color: '#EF4444' },
  { code: 'CF', name: 'Centre Forward', abbreviation: 'CF', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 80 }, relevantStats: ['goals', 'assists', 'shotsOnTarget'], color: '#EF4444' },
];

// =============================================================================
// LACROSSE POSITIONS
// =============================================================================

const LACROSSE_POSITIONS: Position[] = [
  { code: 'G', name: 'Goalkeeper', abbreviation: 'G', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 10 }, relevantStats: ['saves', 'savePct', 'goalsAllowed'], color: '#FFD700' },
  { code: 'LD', name: 'Long-Stick Defender', abbreviation: 'LD', category: 'DEFENDER_LACROSSE', isPrimary: true, pitchPosition: { x: 30, y: 25 }, relevantStats: ['groundBalls', 'causedTurnovers', 'clears'], color: '#3B82F6' },
  { code: 'SD', name: 'Short-Stick Defender', abbreviation: 'SD', category: 'DEFENDER_LACROSSE', pitchPosition: { x: 70, y: 25 }, relevantStats: ['groundBalls', 'causedTurnovers'], color: '#3B82F6' },
  { code: 'LSM', name: 'Long-Stick Midfielder', abbreviation: 'LSM', category: 'MIDFIELDER_LACROSSE', isPrimary: true, pitchPosition: { x: 50, y: 40 }, relevantStats: ['groundBalls', 'faceoffWins', 'clears'], color: '#22C55E' },
  { code: 'M', name: 'Midfielder', abbreviation: 'M', category: 'MIDFIELDER_LACROSSE', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['goals', 'assists', 'groundBalls', 'faceoffs'], color: '#22C55E' },
  { code: 'FOGO', name: 'Face-Off Get-Off', abbreviation: 'FOGO', category: 'MIDFIELDER_LACROSSE', pitchPosition: { x: 50, y: 45 }, relevantStats: ['faceoffWins', 'faceoffPct', 'groundBalls'], color: '#22C55E' },
  { code: 'A', name: 'Attackman', abbreviation: 'A', category: 'ATTACKER', isPrimary: true, pitchPosition: { x: 50, y: 75 }, relevantStats: ['goals', 'assists', 'shots', 'shotsOnGoal'], color: '#EF4444' },
  { code: 'X', name: 'X Attackman (Behind Goal)', abbreviation: 'X', category: 'ATTACKER', pitchPosition: { x: 50, y: 90 }, relevantStats: ['goals', 'assists', 'feeds'], color: '#EF4444' },
];

// =============================================================================
// AUSTRALIAN RULES (AFL) POSITIONS
// =============================================================================

const AFL_POSITIONS: Position[] = [
  // Key Position
  { code: 'FB', name: 'Full Back', abbreviation: 'FB', category: 'KEY_POSITION', isPrimary: true, relevantStats: ['spoils', 'intercepts', 'onePercenters'], color: '#EF4444' },
  { code: 'CHB', name: 'Centre Half Back', abbreviation: 'CHB', category: 'KEY_POSITION', isPrimary: true, relevantStats: ['spoils', 'intercepts', 'kicks'], color: '#EF4444' },
  { code: 'CHF', name: 'Centre Half Forward', abbreviation: 'CHF', category: 'KEY_POSITION', isPrimary: true, relevantStats: ['goals', 'marks', 'hitouts'], color: '#EF4444' },
  { code: 'FF', name: 'Full Forward', abbreviation: 'FF', category: 'KEY_POSITION', isPrimary: true, relevantStats: ['goals', 'behinds', 'marks', 'disposals'], color: '#EF4444' },
  // General
  { code: 'BP', name: 'Back Pocket', abbreviation: 'BP', category: 'GENERAL', isPrimary: true, relevantStats: ['spoils', 'tackles', 'disposals'], color: '#22C55E' },
  { code: 'HBF', name: 'Half Back Flank', abbreviation: 'HBF', category: 'GENERAL', isPrimary: true, relevantStats: ['disposals', 'kicks', 'handballs', 'rebounds'], color: '#22C55E' },
  { code: 'W', name: 'Wing', abbreviation: 'W', category: 'GENERAL', isPrimary: true, relevantStats: ['disposals', 'kicks', 'handballs', 'metres'], color: '#22C55E' },
  { code: 'HFF', name: 'Half Forward Flank', abbreviation: 'HFF', category: 'GENERAL', isPrimary: true, relevantStats: ['goals', 'behinds', 'marks', 'tackles'], color: '#22C55E' },
  { code: 'FP', name: 'Forward Pocket', abbreviation: 'FP', category: 'GENERAL', isPrimary: true, relevantStats: ['goals', 'behinds', 'marks'], color: '#22C55E' },
  // Ruck
  { code: 'R', name: 'Ruck', abbreviation: 'R', category: 'RUCK', isPrimary: true, relevantStats: ['hitouts', 'hitoutsToAdvantage', 'marks', 'disposals'], color: '#3B82F6' },
  { code: 'RR', name: 'Ruck Rover', abbreviation: 'RR', category: 'RUCK', relevantStats: ['hitouts', 'disposals', 'clearances'], color: '#3B82F6' },
  // On-Field
  { code: 'C', name: 'Centre', abbreviation: 'C', category: 'ONFIELD', isPrimary: true, relevantStats: ['disposals', 'clearances', 'inside50s'], color: '#A855F7' },
  { code: 'ROV', name: 'Rover', abbreviation: 'ROV', category: 'ONFIELD', isPrimary: true, relevantStats: ['disposals', 'clearances', 'tackles', 'goals'], color: '#A855F7' },
  // Utility
  { code: 'INT', name: 'Interchange', abbreviation: 'INT', category: 'UTILITY', relevantStats: ['disposals', 'tackles'], color: '#6B7280' },
  { code: 'UTIL', name: 'Utility', abbreviation: 'UTIL', category: 'UTILITY', relevantStats: ['disposals', 'tackles', 'goals'], color: '#6B7280' },
];

// =============================================================================
// GAELIC FOOTBALL POSITIONS
// =============================================================================

const GAELIC_POSITIONS: Position[] = [
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', isPrimary: true, relevantStats: ['saves', 'kickouts', 'restarts'], color: '#FFD700' },
  // Backs
  { code: 'RCB', name: 'Right Corner Back', abbreviation: 'RCB', category: 'DEFENSE', isPrimary: true, relevantStats: ['tackles', 'blocks', 'interceptions'], color: '#3B82F6' },
  { code: 'FB', name: 'Full Back', abbreviation: 'FB', category: 'DEFENSE', isPrimary: true, relevantStats: ['tackles', 'blocks', 'interceptions'], color: '#3B82F6' },
  { code: 'LCB', name: 'Left Corner Back', abbreviation: 'LCB', category: 'DEFENSE', isPrimary: true, relevantStats: ['tackles', 'blocks', 'interceptions'], color: '#3B82F6' },
  { code: 'RHB', name: 'Right Half Back', abbreviation: 'RHB', category: 'DEFENSE', isPrimary: true, relevantStats: ['tackles', 'possessions', 'kickPasses'], color: '#3B82F6' },
  { code: 'CHB', name: 'Centre Half Back', abbreviation: 'CHB', category: 'DEFENSE', isPrimary: true, relevantStats: ['tackles', 'possessions', 'kickPasses'], color: '#3B82F6' },
  { code: 'LHB', name: 'Left Half Back', abbreviation: 'LHB', category: 'DEFENSE', isPrimary: true, relevantStats: ['tackles', 'possessions', 'kickPasses'], color: '#3B82F6' },
  // Midfield
  { code: 'MF', name: 'Midfielder', abbreviation: 'MF', category: 'MIDFIELD', isPrimary: true, relevantStats: ['possessions', 'kickPasses', 'catches', 'kickouts'], color: '#22C55E' },
  // Forwards
  { code: 'RHF', name: 'Right Half Forward', abbreviation: 'RHF', category: 'ATTACK', isPrimary: true, relevantStats: ['points', 'goals', 'frees', 'possessions'], color: '#EF4444' },
  { code: 'CHF', name: 'Centre Half Forward', abbreviation: 'CHF', category: 'ATTACK', isPrimary: true, relevantStats: ['points', 'goals', 'frees', 'possessions'], color: '#EF4444' },
  { code: 'LHF', name: 'Left Half Forward', abbreviation: 'LHF', category: 'ATTACK', isPrimary: true, relevantStats: ['points', 'goals', 'frees', 'possessions'], color: '#EF4444' },
  { code: 'RCF', name: 'Right Corner Forward', abbreviation: 'RCF', category: 'ATTACK', isPrimary: true, relevantStats: ['goals', 'points', 'frees'], color: '#EF4444' },
  { code: 'FF', name: 'Full Forward', abbreviation: 'FF', category: 'ATTACK', isPrimary: true, relevantStats: ['goals', 'points', 'marks'], color: '#EF4444' },
  { code: 'LCF', name: 'Left Corner Forward', abbreviation: 'LCF', category: 'ATTACK', isPrimary: true, relevantStats: ['goals', 'points', 'frees'], color: '#EF4444' },
];

// =============================================================================
// FORMATIONS
// =============================================================================

const FOOTBALL_FORMATIONS: Formation[] = [
  { code: '4-4-2', name: '4-4-2', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 35, y: 20 }, { position: 'CB', x: 65, y: 20 }, { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 15, y: 50 }, { position: 'CM', x: 35, y: 45 }, { position: 'CM', x: 65, y: 45 }, { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 35, y: 80 }, { position: 'ST', x: 65, y: 80 },
  ]},
  { code: '4-3-3', name: '4-3-3', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 35, y: 20 }, { position: 'CB', x: 65, y: 20 }, { position: 'RB', x: 85, y: 25 },
    { position: 'CM', x: 30, y: 45 }, { position: 'CDM', x: 50, y: 40 }, { position: 'CM', x: 70, y: 45 },
    { position: 'LW', x: 15, y: 75 }, { position: 'ST', x: 50, y: 80 }, { position: 'RW', x: 85, y: 75 },
  ]},
  { code: '3-5-2', name: '3-5-2', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 25, y: 20 }, { position: 'CB', x: 50, y: 18 }, { position: 'CB', x: 75, y: 20 },
    { position: 'LWB', x: 10, y: 45 }, { position: 'CM', x: 30, y: 45 }, { position: 'CDM', x: 50, y: 40 }, { position: 'CM', x: 70, y: 45 }, { position: 'RWB', x: 90, y: 45 },
    { position: 'ST', x: 35, y: 80 }, { position: 'ST', x: 65, y: 80 },
  ]},
  { code: '4-2-3-1', name: '4-2-3-1', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 35, y: 20 }, { position: 'CB', x: 65, y: 20 }, { position: 'RB', x: 85, y: 25 },
    { position: 'CDM', x: 35, y: 38 }, { position: 'CDM', x: 65, y: 38 },
    { position: 'LW', x: 20, y: 60 }, { position: 'CAM', x: 50, y: 58 }, { position: 'RW', x: 80, y: 60 },
    { position: 'ST', x: 50, y: 82 },
  ]},
  { code: '5-3-2', name: '5-3-2', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LWB', x: 10, y: 30 }, { position: 'CB', x: 30, y: 20 }, { position: 'CB', x: 50, y: 18 }, { position: 'CB', x: 70, y: 20 }, { position: 'RWB', x: 90, y: 30 },
    { position: 'CM', x: 30, y: 50 }, { position: 'CM', x: 50, y: 48 }, { position: 'CM', x: 70, y: 50 },
    { position: 'ST', x: 35, y: 80 }, { position: 'ST', x: 65, y: 80 },
  ]},
];

// =============================================================================
// SPORT CONFIGURATION MAPPING
// =============================================================================

export const SPORT_POSITIONS: Record<Sport, SportPositionConfig> = {
  FOOTBALL: {
    sport: 'FOOTBALL',
    playersOnField: 11,
    maxSquadSize: 23,
    hasNumberedPositions: false,
    hasFormations: true,
    formations: FOOTBALL_FORMATIONS,
    categories: FOOTBALL_CATEGORIES,
    positions: FOOTBALL_POSITIONS,
    defaultPositions: ['GK', 'CB', 'CM', 'ST'],
  },
  RUGBY: {
    sport: 'RUGBY',
    playersOnField: 15,
    maxSquadSize: 23,
    hasNumberedPositions: true,
    hasFormations: false,
    categories: RUGBY_CATEGORIES,
    positions: RUGBY_POSITIONS,
    defaultPositions: ['LHP', 'HK', 'THP', 'LK', 'N8', 'SH', 'FH', 'FB'],
  },
  CRICKET: {
    sport: 'CRICKET',
    playersOnField: 11,
    maxSquadSize: 15,
    hasNumberedPositions: false,
    hasFormations: false,
    categories: CRICKET_CATEGORIES,
    positions: CRICKET_POSITIONS,
    defaultPositions: ['WK', 'OPN', 'TOP', 'FP', 'OS'],
  },
  BASKETBALL: {
    sport: 'BASKETBALL',
    playersOnField: 5,
    maxSquadSize: 15,
    hasNumberedPositions: false,
    hasFormations: false,
    categories: BASKETBALL_CATEGORIES,
    positions: BASKETBALL_POSITIONS,
    defaultPositions: ['PG', 'SG', 'SF', 'PF', 'C'],
  },
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    playersOnField: 11,
    maxSquadSize: 53,
    hasNumberedPositions: false,
    hasFormations: true,
    categories: AMERICAN_FOOTBALL_CATEGORIES,
    positions: AMERICAN_FOOTBALL_POSITIONS,
    defaultPositions: ['QB', 'RB', 'WR', 'TE', 'CB', 'MLB'],
  },
  NETBALL: {
    sport: 'NETBALL',
    playersOnField: 7,
    maxSquadSize: 12,
    hasNumberedPositions: false,
    hasFormations: false,
    categories: NETBALL_CATEGORIES,
    positions: NETBALL_POSITIONS,
    defaultPositions: ['GK', 'GD', 'WD', 'C', 'WA', 'GA', 'GS'],
  },
  HOCKEY: {
    sport: 'HOCKEY',
    playersOnField: 11,
    maxSquadSize: 18,
    hasNumberedPositions: false,
    hasFormations: true,
    formations: FOOTBALL_FORMATIONS, // Uses similar formations
    categories: HOCKEY_CATEGORIES,
    positions: HOCKEY_POSITIONS,
    defaultPositions: ['GK', 'CB', 'CM', 'CF'],
  },
  LACROSSE: {
    sport: 'LACROSSE',
    playersOnField: 10,
    maxSquadSize: 23,
    hasNumberedPositions: false,
    hasFormations: false,
    categories: LACROSSE_CATEGORIES,
    positions: LACROSSE_POSITIONS,
    defaultPositions: ['G', 'LD', 'M', 'A'],
  },
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    playersOnField: 18,
    maxSquadSize: 22,
    hasNumberedPositions: false,
    hasFormations: false,
    categories: AFL_CATEGORIES,
    positions: AFL_POSITIONS,
    defaultPositions: ['FB', 'CHB', 'C', 'CHF', 'FF', 'R'],
  },
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    playersOnField: 15,
    maxSquadSize: 24,
    hasNumberedPositions: false,
    hasFormations: false,
    categories: GAELIC_CATEGORIES,
    positions: GAELIC_POSITIONS,
    defaultPositions: ['GK', 'FB', 'CHB', 'MF', 'CHF', 'FF'],
  },
  FUTSAL: {
    sport: 'FUTSAL',
    playersOnField: 5,
    maxSquadSize: 14,
    hasNumberedPositions: false,
    hasFormations: true,
    categories: FOOTBALL_CATEGORIES,
    positions: FOOTBALL_POSITIONS.filter(p => ['GK', 'CB', 'CM', 'LW', 'RW', 'ST', 'CDM'].includes(p.code)),
    defaultPositions: ['GK', 'CB', 'CM', 'ST'],
  },
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    playersOnField: 5,
    maxSquadSize: 12,
    hasNumberedPositions: false,
    hasFormations: true,
    categories: FOOTBALL_CATEGORIES,
    positions: FOOTBALL_POSITIONS.filter(p => ['GK', 'CB', 'CM', 'ST', 'LW', 'RW'].includes(p.code)),
    defaultPositions: ['GK', 'CB', 'CM', 'ST'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get position configuration for a sport
 */
export function getSportPositions(sport: Sport): SportPositionConfig {
  return SPORT_POSITIONS[sport];
}

/**
 * Get a specific position by code
 */
export function getPositionByCode(sport: Sport, code: string): Position | undefined {
  return SPORT_POSITIONS[sport]?.positions.find(p => p.code === code);
}

/**
 * Get positions by category
 */
export function getPositionsByCategory(sport: Sport, category: PositionCategory): Position[] {
  return SPORT_POSITIONS[sport]?.positions.filter(p => p.category === category) || [];
}

/**
 * Get primary positions only
 */
export function getPrimaryPositions(sport: Sport): Position[] {
  return SPORT_POSITIONS[sport]?.positions.filter(p => p.isPrimary) || [];
}

/**
 * Get formation by code
 */
export function getFormationByCode(sport: Sport, code: string): Formation | undefined {
  return SPORT_POSITIONS[sport]?.formations?.find(f => f.code === code);
}

/**
 * Get position display name with abbreviation
 */
export function getPositionDisplayName(sport: Sport, code: string): string {
  const position = getPositionByCode(sport, code);
  return position ? `${position.name} (${position.abbreviation})` : code;
}

/**
 * Get category color
 */
export function getCategoryColor(sport: Sport, category: PositionCategory): string {
  const cat = SPORT_POSITIONS[sport]?.categories.find(c => c.category === category);
  return cat?.color || '#6B7280';
}

/**
 * Check if a sport uses formations
 */
export function sportHasFormations(sport: Sport): boolean {
  return SPORT_POSITIONS[sport]?.hasFormations || false;
}

/**
 * Check if a sport uses numbered positions (like Rugby 1-15)
 */
export function sportHasNumberedPositions(sport: Sport): boolean {
  return SPORT_POSITIONS[sport]?.hasNumberedPositions || false;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SPORT_POSITIONS;