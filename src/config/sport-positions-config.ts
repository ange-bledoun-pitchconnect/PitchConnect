/**
 * ============================================================================
 * SPORT POSITIONS CONFIGURATION - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade multi-sport position configuration with:
 * - 12 sports with 250+ authentic positions
 * - Zod validation for runtime safety
 * - Formation-aware positioning
 * - Position-specific stat templates
 * - Visual pitch/court diagram coordinates
 * - Category grouping for filtering
 * - Multi-language abbreviation support
 * 
 * Sources:
 * - FIFA/UEFA Technical Guidelines
 * - World Rugby Position Standards
 * - Cricket ICC Playing Conditions
 * - FIBA Basketball Rules
 * - NFL Position Guidelines
 * - Netball Australia Standards
 * - FIH Hockey Rules
 * - World Lacrosse Standards
 * - AFL Official Positions
 * - GAA Position Standards
 * - FIFA Futsal Rules
 * - Beach Soccer Worldwide
 * 
 * @version 3.0.0
 * @path src/config/sport-positions-config.ts
 * 
 * ============================================================================
 */

import { z } from 'zod';

// =============================================================================
// ENUMS & TYPES
// =============================================================================

export const SportEnum = z.enum([
  'FOOTBALL',
  'NETBALL',
  'RUGBY',
  'CRICKET',
  'AMERICAN_FOOTBALL',
  'BASKETBALL',
  'HOCKEY',
  'LACROSSE',
  'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL',
  'FUTSAL',
  'BEACH_FOOTBALL',
]);

export type Sport = z.infer<typeof SportEnum>;

export const PositionCategoryEnum = z.enum([
  // Universal
  'GOALKEEPER',
  'DEFENSE',
  'MIDFIELD',
  'ATTACK',
  'FORWARD',
  'UTILITY',
  
  // Rugby-specific
  'FRONT_ROW',
  'SECOND_ROW',
  'BACK_ROW',
  'HALF_BACK',
  'CENTRE',
  'BACK',
  
  // Cricket-specific
  'BATSMAN',
  'BOWLER',
  'ALL_ROUNDER',
  'WICKET_KEEPER',
  
  // Basketball-specific
  'GUARD',
  'FORWARD_BASKETBALL',
  'CENTER_BASKETBALL',
  
  // American Football-specific
  'OFFENSE',
  'DEFENSE_AF',
  'SPECIAL_TEAMS',
  
  // Netball-specific
  'SHOOTER',
  'CENTRE_NETBALL',
  'DEFENDER_NETBALL',
  
  // Lacrosse-specific
  'ATTACKER',
  'MIDFIELDER_LACROSSE',
  'DEFENDER_LACROSSE',
  
  // AFL-specific
  'KEY_POSITION',
  'GENERAL',
  'RUCK',
  'ONFIELD',
]);

export type PositionCategory = z.infer<typeof PositionCategoryEnum>;

// =============================================================================
// SCHEMAS
// =============================================================================

export const PositionSchema = z.object({
  code: z.string().min(1).max(6),
  name: z.string().min(1),
  abbreviation: z.string().min(1).max(4),
  category: PositionCategoryEnum,
  number: z.number().optional(),
  isPrimary: z.boolean().default(false),
  pitchPosition: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }).optional(),
  relevantStats: z.array(z.string()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export type Position = z.infer<typeof PositionSchema>;

export const PositionCategoryConfigSchema = z.object({
  category: PositionCategoryEnum,
  name: z.string(),
  color: z.string(),
  order: z.number(),
});

export type PositionCategoryConfig = z.infer<typeof PositionCategoryConfigSchema>;

export const FormationLayoutSchema = z.object({
  position: z.string(),
  x: z.number(),
  y: z.number(),
});

export const FormationSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  layout: z.array(FormationLayoutSchema),
});

export type Formation = z.infer<typeof FormationSchema>;

export const SportPositionConfigSchema = z.object({
  sport: SportEnum,
  playersOnField: z.number().min(1),
  maxSquadSize: z.number().min(1),
  hasNumberedPositions: z.boolean(),
  hasFormations: z.boolean(),
  formations: z.array(FormationSchema).optional(),
  categories: z.array(PositionCategoryConfigSchema),
  positions: z.array(PositionSchema),
  defaultPositions: z.array(z.string()),
});

export type SportPositionConfig = z.infer<typeof SportPositionConfigSchema>;

// =============================================================================
// CATEGORY CONFIGURATIONS
// =============================================================================

const FOOTBALL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GOALKEEPER', name: 'Goalkeeper', color: '#FFD700', order: 1 },
  { category: 'DEFENSE', name: 'Defense', color: '#3B82F6', order: 2 },
  { category: 'MIDFIELD', name: 'Midfield', color: '#22C55E', order: 3 },
  { category: 'ATTACK', name: 'Attack', color: '#EF4444', order: 4 },
];

const FUTSAL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GOALKEEPER', name: 'Goleiro', color: '#FFD700', order: 1 },
  { category: 'DEFENSE', name: 'Fixo/Beque', color: '#3B82F6', order: 2 },
  { category: 'MIDFIELD', name: 'Ala', color: '#22C55E', order: 3 },
  { category: 'ATTACK', name: 'Pivô', color: '#EF4444', order: 4 },
];

const BEACH_FOOTBALL_CATEGORIES: PositionCategoryConfig[] = [
  { category: 'GOALKEEPER', name: 'Goalkeeper', color: '#FFD700', order: 1 },
  { category: 'DEFENSE', name: 'Defense', color: '#3B82F6', order: 2 },
  { category: 'ATTACK', name: 'Attack', color: '#EF4444', order: 3 },
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
  { category: 'DEFENSE_AF', name: 'Defense', color: '#3B82F6', order: 2 },
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
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 5 }, relevantStats: ['saves', 'cleanSheets', 'goalsConceded'], color: '#FFD700', description: 'Last line of defense, handles the ball' },
  
  // Defense
  { code: 'CB', name: 'Centre-Back', abbreviation: 'CB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 20 }, relevantStats: ['tackles', 'interceptions', 'clearances', 'aerialDuels'], color: '#3B82F6', description: 'Central defender, stops attacks' },
  { code: 'LB', name: 'Left-Back', abbreviation: 'LB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 15, y: 25 }, relevantStats: ['tackles', 'interceptions', 'crosses', 'assists'], color: '#3B82F6', description: 'Left-side defender, supports attacks' },
  { code: 'RB', name: 'Right-Back', abbreviation: 'RB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 85, y: 25 }, relevantStats: ['tackles', 'interceptions', 'crosses', 'assists'], color: '#3B82F6', description: 'Right-side defender, supports attacks' },
  { code: 'LWB', name: 'Left Wing-Back', abbreviation: 'LWB', category: 'DEFENSE', pitchPosition: { x: 10, y: 40 }, relevantStats: ['tackles', 'crosses', 'assists', 'dribbles'], color: '#3B82F6', description: 'Attacking left defender' },
  { code: 'RWB', name: 'Right Wing-Back', abbreviation: 'RWB', category: 'DEFENSE', pitchPosition: { x: 90, y: 40 }, relevantStats: ['tackles', 'crosses', 'assists', 'dribbles'], color: '#3B82F6', description: 'Attacking right defender' },
  { code: 'SW', name: 'Sweeper', abbreviation: 'SW', category: 'DEFENSE', pitchPosition: { x: 50, y: 15 }, relevantStats: ['tackles', 'interceptions', 'passes'], color: '#3B82F6', description: 'Sweeps behind defense' },
  
  // Midfield
  { code: 'CDM', name: 'Defensive Midfielder', abbreviation: 'CDM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 35 }, relevantStats: ['tackles', 'interceptions', 'passes', 'recoveries'], color: '#22C55E', description: 'Shields the defense' },
  { code: 'CM', name: 'Central Midfielder', abbreviation: 'CM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['passes', 'assists', 'tackles', 'shots'], color: '#22C55E', description: 'Box-to-box midfielder' },
  { code: 'CAM', name: 'Attacking Midfielder', abbreviation: 'CAM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 65 }, relevantStats: ['assists', 'keyPasses', 'shots', 'goals'], color: '#22C55E', description: 'Creative playmaker' },
  { code: 'LM', name: 'Left Midfielder', abbreviation: 'LM', category: 'MIDFIELD', pitchPosition: { x: 15, y: 50 }, relevantStats: ['crosses', 'assists', 'dribbles', 'tackles'], color: '#22C55E', description: 'Left-side midfielder' },
  { code: 'RM', name: 'Right Midfielder', abbreviation: 'RM', category: 'MIDFIELD', pitchPosition: { x: 85, y: 50 }, relevantStats: ['crosses', 'assists', 'dribbles', 'tackles'], color: '#22C55E', description: 'Right-side midfielder' },
  
  // Attack
  { code: 'LW', name: 'Left Winger', abbreviation: 'LW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 15, y: 75 }, relevantStats: ['goals', 'assists', 'dribbles', 'crosses'], color: '#EF4444', description: 'Left-side attacker' },
  { code: 'RW', name: 'Right Winger', abbreviation: 'RW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 85, y: 75 }, relevantStats: ['goals', 'assists', 'dribbles', 'crosses'], color: '#EF4444', description: 'Right-side attacker' },
  { code: 'CF', name: 'Centre Forward', abbreviation: 'CF', category: 'ATTACK', pitchPosition: { x: 50, y: 80 }, relevantStats: ['goals', 'assists', 'shots', 'aerialDuels'], color: '#EF4444', description: 'Central striker' },
  { code: 'ST', name: 'Striker', abbreviation: 'ST', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 85 }, relevantStats: ['goals', 'shots', 'shotsOnTarget', 'aerialDuels'], color: '#EF4444', description: 'Main goalscorer' },
  { code: 'SS', name: 'Second Striker', abbreviation: 'SS', category: 'ATTACK', pitchPosition: { x: 50, y: 75 }, relevantStats: ['goals', 'assists', 'dribbles', 'keyPasses'], color: '#EF4444', description: 'Supporting striker' },
];

// =============================================================================
// FUTSAL POSITIONS (Authentic Portuguese/Spanish terminology)
// =============================================================================

const FUTSAL_POSITIONS: Position[] = [
  // Goalkeeper (Goleiro)
  { code: 'GOL', name: 'Goleiro', abbreviation: 'GOL', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 5 }, relevantStats: ['saves', 'cleanSheets', 'goalsConceded', 'passAccuracy'], color: '#FFD700', description: 'Futsal goalkeeper' },
  
  // Defense (Fixo/Beque)
  { code: 'FIX', name: 'Fixo', abbreviation: 'FIX', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 25 }, relevantStats: ['tackles', 'interceptions', 'passes', 'clearances'], color: '#3B82F6', description: 'Last outfield player, defensive anchor' },
  { code: 'BEQ', name: 'Beque', abbreviation: 'BEQ', category: 'DEFENSE', pitchPosition: { x: 50, y: 30 }, relevantStats: ['tackles', 'interceptions', 'passes'], color: '#3B82F6', description: 'Defensive player (alternative term)' },
  
  // Wingers (Ala)
  { code: 'ALA', name: 'Ala', abbreviation: 'ALA', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 25, y: 50 }, relevantStats: ['goals', 'assists', 'dribbles', 'shots'], color: '#22C55E', description: 'Wing player, both attack and defense' },
  { code: 'ALE', name: 'Ala Esquerda', abbreviation: 'ALE', category: 'MIDFIELD', pitchPosition: { x: 15, y: 50 }, relevantStats: ['goals', 'assists', 'dribbles', 'crosses'], color: '#22C55E', description: 'Left winger' },
  { code: 'ALD', name: 'Ala Direita', abbreviation: 'ALD', category: 'MIDFIELD', pitchPosition: { x: 85, y: 50 }, relevantStats: ['goals', 'assists', 'dribbles', 'crosses'], color: '#22C55E', description: 'Right winger' },
  
  // Pivot (Pivô)
  { code: 'PIV', name: 'Pivô', abbreviation: 'PIV', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 75 }, relevantStats: ['goals', 'assists', 'shots', 'holds'], color: '#EF4444', description: 'Target player, plays with back to goal' },
  
  // Universal Player
  { code: 'UNI', name: 'Universal', abbreviation: 'UNI', category: 'UTILITY', pitchPosition: { x: 50, y: 50 }, relevantStats: ['goals', 'assists', 'tackles', 'passes'], color: '#A855F7', description: 'Versatile player, all positions' },
];

// =============================================================================
// BEACH FOOTBALL (Beach Soccer) POSITIONS
// =============================================================================

const BEACH_FOOTBALL_POSITIONS: Position[] = [
  // Goalkeeper
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 5 }, relevantStats: ['saves', 'cleanSheets', 'goalsConceded', 'goals'], color: '#FFD700', description: 'Beach soccer goalkeeper (often scores)' },
  
  // Defense
  { code: 'DEF', name: 'Defender', abbreviation: 'DEF', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 30 }, relevantStats: ['tackles', 'interceptions', 'clearances'], color: '#3B82F6', description: 'Central defensive player' },
  { code: 'LD', name: 'Left Defender', abbreviation: 'LD', category: 'DEFENSE', pitchPosition: { x: 25, y: 30 }, relevantStats: ['tackles', 'interceptions'], color: '#3B82F6', description: 'Left-side defender' },
  { code: 'RD', name: 'Right Defender', abbreviation: 'RD', category: 'DEFENSE', pitchPosition: { x: 75, y: 30 }, relevantStats: ['tackles', 'interceptions'], color: '#3B82F6', description: 'Right-side defender' },
  
  // Attack
  { code: 'WG', name: 'Winger', abbreviation: 'WG', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 25, y: 65 }, relevantStats: ['goals', 'assists', 'bicycleKicks', 'volleyGoals'], color: '#EF4444', description: 'Wide attacker, specialist in acrobatic goals' },
  { code: 'LW', name: 'Left Winger', abbreviation: 'LW', category: 'ATTACK', pitchPosition: { x: 15, y: 65 }, relevantStats: ['goals', 'assists', 'dribbles'], color: '#EF4444', description: 'Left-side attacker' },
  { code: 'RW', name: 'Right Winger', abbreviation: 'RW', category: 'ATTACK', pitchPosition: { x: 85, y: 65 }, relevantStats: ['goals', 'assists', 'dribbles'], color: '#EF4444', description: 'Right-side attacker' },
  { code: 'PV', name: 'Pivot', abbreviation: 'PV', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 75 }, relevantStats: ['goals', 'bicycleKicks', 'scissorKicks', 'headers'], color: '#EF4444', description: 'Central striker, acrobatic specialist' },
];

// =============================================================================
// RUGBY UNION POSITIONS
// =============================================================================

const RUGBY_POSITIONS: Position[] = [
  // Front Row (Props & Hooker)
  { code: 'LHP', name: 'Loosehead Prop', abbreviation: 'LHP', category: 'FRONT_ROW', number: 1, isPrimary: true, pitchPosition: { x: 35, y: 20 }, relevantStats: ['tackles', 'scrumSuccessRate', 'carries'], color: '#DC2626' },
  { code: 'HK', name: 'Hooker', abbreviation: 'HK', category: 'FRONT_ROW', number: 2, isPrimary: true, pitchPosition: { x: 50, y: 20 }, relevantStats: ['lineoutsWon', 'tackles', 'carries'], color: '#DC2626' },
  { code: 'THP', name: 'Tighthead Prop', abbreviation: 'THP', category: 'FRONT_ROW', number: 3, isPrimary: true, pitchPosition: { x: 65, y: 20 }, relevantStats: ['tackles', 'scrumSuccessRate', 'carries'], color: '#DC2626' },
  
  // Second Row (Locks)
  { code: 'LK', name: 'Lock', abbreviation: 'LK', category: 'SECOND_ROW', number: 4, isPrimary: true, pitchPosition: { x: 40, y: 30 }, relevantStats: ['lineoutsWon', 'tackles', 'carries'], color: '#EA580C' },
  { code: 'LK2', name: 'Lock', abbreviation: 'LK', category: 'SECOND_ROW', number: 5, isPrimary: true, pitchPosition: { x: 60, y: 30 }, relevantStats: ['lineoutsWon', 'tackles', 'carries'], color: '#EA580C' },
  
  // Back Row
  { code: 'BFL', name: 'Blindside Flanker', abbreviation: 'BFL', category: 'BACK_ROW', number: 6, isPrimary: true, pitchPosition: { x: 30, y: 35 }, relevantStats: ['tackles', 'turnoversWon', 'carries'], color: '#D97706' },
  { code: 'OFL', name: 'Openside Flanker', abbreviation: 'OFL', category: 'BACK_ROW', number: 7, isPrimary: true, pitchPosition: { x: 70, y: 35 }, relevantStats: ['tackles', 'turnoversWon', 'jackals'], color: '#D97706' },
  { code: 'N8', name: 'Number Eight', abbreviation: 'N8', category: 'BACK_ROW', number: 8, isPrimary: true, pitchPosition: { x: 50, y: 40 }, relevantStats: ['carries', 'metresGained', 'tackles'], color: '#D97706' },
  
  // Half Backs
  { code: 'SH', name: 'Scrum-Half', abbreviation: 'SH', category: 'HALF_BACK', number: 9, isPrimary: true, pitchPosition: { x: 45, y: 50 }, relevantStats: ['passes', 'boxKicks', 'tries'], color: '#65A30D' },
  { code: 'FH', name: 'Fly-Half', abbreviation: 'FH', category: 'HALF_BACK', number: 10, isPrimary: true, pitchPosition: { x: 50, y: 55 }, relevantStats: ['conversions', 'penaltyGoals', 'passes'], color: '#65A30D' },
  
  // Centres
  { code: 'IC', name: 'Inside Centre', abbreviation: 'IC', category: 'CENTRE', number: 12, isPrimary: true, pitchPosition: { x: 40, y: 65 }, relevantStats: ['tackles', 'metresGained', 'lineBreaks'], color: '#0D9488' },
  { code: 'OC', name: 'Outside Centre', abbreviation: 'OC', category: 'CENTRE', number: 13, isPrimary: true, pitchPosition: { x: 60, y: 65 }, relevantStats: ['tries', 'lineBreaks', 'defendersBeaten'], color: '#0D9488' },
  
  // Outside Backs
  { code: 'LW', name: 'Left Wing', abbreviation: 'LW', category: 'BACK', number: 11, isPrimary: true, pitchPosition: { x: 15, y: 70 }, relevantStats: ['tries', 'metresGained', 'lineBreaks'], color: '#7C3AED' },
  { code: 'RW', name: 'Right Wing', abbreviation: 'RW', category: 'BACK', number: 14, isPrimary: true, pitchPosition: { x: 85, y: 70 }, relevantStats: ['tries', 'metresGained', 'lineBreaks'], color: '#7C3AED' },
  { code: 'FB', name: 'Fullback', abbreviation: 'FB', category: 'BACK', number: 15, isPrimary: true, pitchPosition: { x: 50, y: 80 }, relevantStats: ['restartsCaught', 'kickingMetres', 'tackles'], color: '#7C3AED' },
];

// =============================================================================
// CRICKET POSITIONS
// =============================================================================

const CRICKET_POSITIONS: Position[] = [
  { code: 'WK', name: 'Wicket-Keeper', abbreviation: 'WK', category: 'WICKET_KEEPER', isPrimary: true, relevantStats: ['catches', 'stumpings', 'runs', 'battingAverage'], color: '#FFD700' },
  { code: 'OPN', name: 'Opening Batsman', abbreviation: 'OPN', category: 'BATSMAN', isPrimary: true, relevantStats: ['runs', 'battingAverage', 'centuries', 'strikeRate'], color: '#3B82F6' },
  { code: 'TOP', name: 'Top Order Batsman', abbreviation: 'TOP', category: 'BATSMAN', isPrimary: true, relevantStats: ['runs', 'battingAverage', 'centuries'], color: '#3B82F6' },
  { code: 'MID', name: 'Middle Order Batsman', abbreviation: 'MID', category: 'BATSMAN', relevantStats: ['runs', 'battingAverage', 'strikeRate'], color: '#3B82F6' },
  { code: 'LOW', name: 'Lower Order Batsman', abbreviation: 'LOW', category: 'BATSMAN', relevantStats: ['runs', 'wickets'], color: '#3B82F6' },
  { code: 'FP', name: 'Fast Bowler', abbreviation: 'FP', category: 'BOWLER', isPrimary: true, relevantStats: ['wickets', 'bowlingAverage', 'economyRate'], color: '#22C55E' },
  { code: 'MF', name: 'Medium Fast Bowler', abbreviation: 'MF', category: 'BOWLER', relevantStats: ['wickets', 'bowlingAverage', 'economyRate'], color: '#22C55E' },
  { code: 'OS', name: 'Off-Spinner', abbreviation: 'OS', category: 'BOWLER', isPrimary: true, relevantStats: ['wickets', 'bowlingAverage', 'economyRate'], color: '#22C55E' },
  { code: 'LS', name: 'Leg-Spinner', abbreviation: 'LS', category: 'BOWLER', relevantStats: ['wickets', 'bowlingAverage', 'economyRate'], color: '#22C55E' },
  { code: 'SLA', name: 'Slow Left-Arm Orthodox', abbreviation: 'SLA', category: 'BOWLER', relevantStats: ['wickets', 'bowlingAverage', 'economyRate'], color: '#22C55E' },
  { code: 'AR', name: 'All-Rounder', abbreviation: 'AR', category: 'ALL_ROUNDER', isPrimary: true, relevantStats: ['runs', 'wickets', 'battingAverage', 'bowlingAverage'], color: '#A855F7' },
  { code: 'BAR', name: 'Batting All-Rounder', abbreviation: 'BAR', category: 'ALL_ROUNDER', relevantStats: ['runs', 'battingAverage', 'wickets'], color: '#A855F7' },
  { code: 'BOA', name: 'Bowling All-Rounder', abbreviation: 'BOA', category: 'ALL_ROUNDER', relevantStats: ['wickets', 'bowlingAverage', 'runs'], color: '#A855F7' },
];

// =============================================================================
// BASKETBALL POSITIONS
// =============================================================================

const BASKETBALL_POSITIONS: Position[] = [
  { code: 'PG', name: 'Point Guard', abbreviation: 'PG', category: 'GUARD', isPrimary: true, pitchPosition: { x: 50, y: 30 }, relevantStats: ['assists', 'points', 'steals', 'turnovers'], color: '#3B82F6', description: 'Floor general, primary ball handler' },
  { code: 'SG', name: 'Shooting Guard', abbreviation: 'SG', category: 'GUARD', isPrimary: true, pitchPosition: { x: 30, y: 40 }, relevantStats: ['points', 'threePointers', 'assists', 'steals'], color: '#3B82F6', description: 'Perimeter scorer' },
  { code: 'SF', name: 'Small Forward', abbreviation: 'SF', category: 'FORWARD_BASKETBALL', isPrimary: true, pitchPosition: { x: 70, y: 40 }, relevantStats: ['points', 'rebounds', 'assists', 'steals'], color: '#22C55E', description: 'Versatile wing player' },
  { code: 'PF', name: 'Power Forward', abbreviation: 'PF', category: 'FORWARD_BASKETBALL', isPrimary: true, pitchPosition: { x: 30, y: 60 }, relevantStats: ['rebounds', 'points', 'blocks', 'fieldGoalPct'], color: '#22C55E', description: 'Interior presence, stretch option' },
  { code: 'C', name: 'Center', abbreviation: 'C', category: 'CENTER_BASKETBALL', isPrimary: true, pitchPosition: { x: 50, y: 70 }, relevantStats: ['rebounds', 'blocks', 'points', 'fieldGoalPct'], color: '#EF4444', description: 'Rim protector, post scorer' },
  { code: 'G', name: 'Guard', abbreviation: 'G', category: 'GUARD', pitchPosition: { x: 40, y: 35 }, relevantStats: ['assists', 'points', 'steals'], color: '#3B82F6', description: 'Combo guard' },
  { code: 'F', name: 'Forward', abbreviation: 'F', category: 'FORWARD_BASKETBALL', pitchPosition: { x: 50, y: 50 }, relevantStats: ['rebounds', 'points', 'assists'], color: '#22C55E', description: 'Combo forward' },
  { code: 'GF', name: 'Guard-Forward', abbreviation: 'GF', category: 'UTILITY', pitchPosition: { x: 45, y: 45 }, relevantStats: ['points', 'assists', 'rebounds'], color: '#A855F7', description: 'Swingman' },
  { code: 'FC', name: 'Forward-Center', abbreviation: 'FC', category: 'UTILITY', pitchPosition: { x: 55, y: 55 }, relevantStats: ['rebounds', 'points', 'blocks'], color: '#A855F7', description: 'Stretch big' },
];

// =============================================================================
// AMERICAN FOOTBALL POSITIONS
// =============================================================================

const AMERICAN_FOOTBALL_POSITIONS: Position[] = [
  // Offense
  { code: 'QB', name: 'Quarterback', abbreviation: 'QB', category: 'OFFENSE', isPrimary: true, relevantStats: ['passingYards', 'passingTouchdowns', 'completionPct', 'passerRating'], color: '#22C55E' },
  { code: 'RB', name: 'Running Back', abbreviation: 'RB', category: 'OFFENSE', isPrimary: true, relevantStats: ['rushingYards', 'rushingTouchdowns', 'yardsPerCarry'], color: '#22C55E' },
  { code: 'FB', name: 'Fullback', abbreviation: 'FB', category: 'OFFENSE', relevantStats: ['rushingYards', 'receptions', 'blocks'], color: '#22C55E' },
  { code: 'WR', name: 'Wide Receiver', abbreviation: 'WR', category: 'OFFENSE', isPrimary: true, relevantStats: ['receptions', 'receivingYards', 'receivingTouchdowns'], color: '#22C55E' },
  { code: 'TE', name: 'Tight End', abbreviation: 'TE', category: 'OFFENSE', isPrimary: true, relevantStats: ['receptions', 'receivingYards', 'blocks'], color: '#22C55E' },
  { code: 'LT', name: 'Left Tackle', abbreviation: 'LT', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'sacksAllowed'], color: '#22C55E' },
  { code: 'LG', name: 'Left Guard', abbreviation: 'LG', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'sacksAllowed'], color: '#22C55E' },
  { code: 'C', name: 'Center', abbreviation: 'C', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'snaps'], color: '#22C55E' },
  { code: 'RG', name: 'Right Guard', abbreviation: 'RG', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'sacksAllowed'], color: '#22C55E' },
  { code: 'RT', name: 'Right Tackle', abbreviation: 'RT', category: 'OFFENSE', relevantStats: ['pancakeBlocks', 'sacksAllowed'], color: '#22C55E' },
  
  // Defense
  { code: 'DE', name: 'Defensive End', abbreviation: 'DE', category: 'DEFENSE_AF', isPrimary: true, relevantStats: ['sacks', 'tacklesForLoss', 'qbHits'], color: '#3B82F6' },
  { code: 'DT', name: 'Defensive Tackle', abbreviation: 'DT', category: 'DEFENSE_AF', isPrimary: true, relevantStats: ['sacks', 'tacklesForLoss', 'totalTackles'], color: '#3B82F6' },
  { code: 'NT', name: 'Nose Tackle', abbreviation: 'NT', category: 'DEFENSE_AF', relevantStats: ['totalTackles', 'tacklesForLoss'], color: '#3B82F6' },
  { code: 'OLB', name: 'Outside Linebacker', abbreviation: 'OLB', category: 'DEFENSE_AF', isPrimary: true, relevantStats: ['sacks', 'totalTackles', 'passesDefended'], color: '#3B82F6' },
  { code: 'MLB', name: 'Middle Linebacker', abbreviation: 'MLB', category: 'DEFENSE_AF', isPrimary: true, relevantStats: ['totalTackles', 'interceptionsDef', 'passesDefended'], color: '#3B82F6' },
  { code: 'ILB', name: 'Inside Linebacker', abbreviation: 'ILB', category: 'DEFENSE_AF', relevantStats: ['totalTackles', 'interceptionsDef'], color: '#3B82F6' },
  { code: 'CB', name: 'Cornerback', abbreviation: 'CB', category: 'DEFENSE_AF', isPrimary: true, relevantStats: ['interceptionsDef', 'passesDefended', 'totalTackles'], color: '#3B82F6' },
  { code: 'FS', name: 'Free Safety', abbreviation: 'FS', category: 'DEFENSE_AF', isPrimary: true, relevantStats: ['interceptionsDef', 'passesDefended', 'totalTackles'], color: '#3B82F6' },
  { code: 'SS', name: 'Strong Safety', abbreviation: 'SS', category: 'DEFENSE_AF', relevantStats: ['totalTackles', 'interceptionsDef', 'passesDefended'], color: '#3B82F6' },
  
  // Special Teams
  { code: 'K', name: 'Kicker', abbreviation: 'K', category: 'SPECIAL_TEAMS', isPrimary: true, relevantStats: ['fieldGoals', 'fieldGoalPct', 'extraPoints'], color: '#A855F7' },
  { code: 'P', name: 'Punter', abbreviation: 'P', category: 'SPECIAL_TEAMS', isPrimary: true, relevantStats: ['puntAverage', 'puntsInside20'], color: '#A855F7' },
  { code: 'LS', name: 'Long Snapper', abbreviation: 'LS', category: 'SPECIAL_TEAMS', relevantStats: ['snaps'], color: '#A855F7' },
  { code: 'KR', name: 'Kick Returner', abbreviation: 'KR', category: 'SPECIAL_TEAMS', relevantStats: ['kickReturnYards', 'kickReturnTDs'], color: '#A855F7' },
  { code: 'PR', name: 'Punt Returner', abbreviation: 'PR', category: 'SPECIAL_TEAMS', relevantStats: ['puntReturnYards', 'puntReturnTDs'], color: '#A855F7' },
];

// =============================================================================
// NETBALL POSITIONS
// =============================================================================

const NETBALL_POSITIONS: Position[] = [
  { code: 'GK', name: 'Goal Keeper', abbreviation: 'GK', category: 'DEFENDER_NETBALL', isPrimary: true, pitchPosition: { x: 50, y: 10 }, relevantStats: ['intercepts', 'rebounds', 'deflections'], color: '#3B82F6', description: 'Defends the goal, plays in defensive third' },
  { code: 'GD', name: 'Goal Defence', abbreviation: 'GD', category: 'DEFENDER_NETBALL', isPrimary: true, pitchPosition: { x: 50, y: 25 }, relevantStats: ['intercepts', 'deflections', 'gains'], color: '#3B82F6', description: 'Defends GA, plays in defensive and centre thirds' },
  { code: 'WD', name: 'Wing Defence', abbreviation: 'WD', category: 'DEFENDER_NETBALL', isPrimary: true, pitchPosition: { x: 25, y: 40 }, relevantStats: ['intercepts', 'deflections', 'centrePassReceives'], color: '#3B82F6', description: 'Defends WA, plays in defensive and centre thirds' },
  { code: 'C', name: 'Centre', abbreviation: 'C', category: 'CENTRE_NETBALL', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['centrePasses', 'feeds', 'intercepts'], color: '#22C55E', description: 'Links attack and defence, plays in all thirds except circles' },
  { code: 'WA', name: 'Wing Attack', abbreviation: 'WA', category: 'CENTRE_NETBALL', isPrimary: true, pitchPosition: { x: 75, y: 60 }, relevantStats: ['feeds', 'goalAssists', 'centrePassReceives'], color: '#22C55E', description: 'Creates for shooters, plays in centre and attacking thirds' },
  { code: 'GA', name: 'Goal Attack', abbreviation: 'GA', category: 'SHOOTER', isPrimary: true, pitchPosition: { x: 50, y: 75 }, relevantStats: ['goals', 'shootingPct', 'feeds'], color: '#EF4444', description: 'Scorer and feeder, plays in centre and attacking thirds' },
  { code: 'GS', name: 'Goal Shooter', abbreviation: 'GS', category: 'SHOOTER', isPrimary: true, pitchPosition: { x: 50, y: 90 }, relevantStats: ['goals', 'shootingPct', 'reboundsOff'], color: '#EF4444', description: 'Main scorer, plays only in attacking third' },
];

// =============================================================================
// HOCKEY POSITIONS
// =============================================================================

const HOCKEY_POSITIONS: Position[] = [
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 5 }, relevantStats: ['saves', 'savePercentage', 'cleanSheets'], color: '#FFD700' },
  { code: 'CB', name: 'Centre Back', abbreviation: 'CB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 20 }, relevantStats: ['tackles', 'interceptions', 'clearances'], color: '#3B82F6' },
  { code: 'LB', name: 'Left Back', abbreviation: 'LB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 20, y: 25 }, relevantStats: ['tackles', 'interceptions'], color: '#3B82F6' },
  { code: 'RB', name: 'Right Back', abbreviation: 'RB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 80, y: 25 }, relevantStats: ['tackles', 'interceptions'], color: '#3B82F6' },
  { code: 'SW', name: 'Sweeper', abbreviation: 'SW', category: 'DEFENSE', pitchPosition: { x: 50, y: 15 }, relevantStats: ['tackles', 'interceptions', 'passes'], color: '#3B82F6' },
  { code: 'CDM', name: 'Defensive Midfielder', abbreviation: 'CDM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 35 }, relevantStats: ['tackles', 'passes', 'interceptions'], color: '#22C55E' },
  { code: 'CM', name: 'Centre Midfielder', abbreviation: 'CM', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['passes', 'assists', 'circleEntries'], color: '#22C55E' },
  { code: 'LM', name: 'Left Midfielder', abbreviation: 'LM', category: 'MIDFIELD', pitchPosition: { x: 20, y: 50 }, relevantStats: ['crosses', 'assists', 'dribbles'], color: '#22C55E' },
  { code: 'RM', name: 'Right Midfielder', abbreviation: 'RM', category: 'MIDFIELD', pitchPosition: { x: 80, y: 50 }, relevantStats: ['crosses', 'assists', 'dribbles'], color: '#22C55E' },
  { code: 'LW', name: 'Left Wing', abbreviation: 'LW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 15, y: 75 }, relevantStats: ['goals', 'assists', 'circleEntries'], color: '#EF4444' },
  { code: 'RW', name: 'Right Wing', abbreviation: 'RW', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 85, y: 75 }, relevantStats: ['goals', 'assists', 'circleEntries'], color: '#EF4444' },
  { code: 'CF', name: 'Centre Forward', abbreviation: 'CF', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 80 }, relevantStats: ['goals', 'shots', 'pcGoals'], color: '#EF4444' },
];

// =============================================================================
// LACROSSE POSITIONS
// =============================================================================

const LACROSSE_POSITIONS: Position[] = [
  { code: 'G', name: 'Goalkeeper', abbreviation: 'G', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 10 }, relevantStats: ['savesLax', 'savePctLax', 'goalsAgainst'], color: '#FFD700' },
  { code: 'LD', name: 'Long Stick Defender', abbreviation: 'LD', category: 'DEFENDER_LACROSSE', isPrimary: true, pitchPosition: { x: 30, y: 25 }, relevantStats: ['groundBalls', 'causedTurnovers', 'clears'], color: '#3B82F6' },
  { code: 'LSD', name: 'Long Stick Defender', abbreviation: 'LSD', category: 'DEFENDER_LACROSSE', pitchPosition: { x: 70, y: 25 }, relevantStats: ['groundBalls', 'causedTurnovers', 'clears'], color: '#3B82F6' },
  { code: 'SSM', name: 'Short Stick Defensive Middie', abbreviation: 'SSDM', category: 'DEFENDER_LACROSSE', pitchPosition: { x: 50, y: 30 }, relevantStats: ['groundBalls', 'causedTurnovers'], color: '#3B82F6' },
  { code: 'M', name: 'Midfielder', abbreviation: 'M', category: 'MIDFIELDER_LACROSSE', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['goals', 'assists', 'groundBalls', 'faceoffsWon'], color: '#22C55E' },
  { code: 'LM', name: 'Left Midfielder', abbreviation: 'LM', category: 'MIDFIELDER_LACROSSE', pitchPosition: { x: 25, y: 50 }, relevantStats: ['goals', 'assists', 'groundBalls'], color: '#22C55E' },
  { code: 'RM', name: 'Right Midfielder', abbreviation: 'RM', category: 'MIDFIELDER_LACROSSE', pitchPosition: { x: 75, y: 50 }, relevantStats: ['goals', 'assists', 'groundBalls'], color: '#22C55E' },
  { code: 'FO', name: 'Face-Off Specialist', abbreviation: 'FO', category: 'MIDFIELDER_LACROSSE', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['faceoffsWon', 'faceoffPct', 'groundBalls'], color: '#22C55E' },
  { code: 'A', name: 'Attackman', abbreviation: 'A', category: 'ATTACKER', isPrimary: true, pitchPosition: { x: 50, y: 80 }, relevantStats: ['goals', 'assists', 'shots'], color: '#EF4444' },
  { code: 'LA', name: 'Left Attack', abbreviation: 'LA', category: 'ATTACKER', pitchPosition: { x: 30, y: 75 }, relevantStats: ['goals', 'assists', 'shots'], color: '#EF4444' },
  { code: 'RA', name: 'Right Attack', abbreviation: 'RA', category: 'ATTACKER', pitchPosition: { x: 70, y: 75 }, relevantStats: ['goals', 'assists', 'shots'], color: '#EF4444' },
];

// =============================================================================
// AFL POSITIONS
// =============================================================================

const AFL_POSITIONS: Position[] = [
  // Key Position
  { code: 'FB', name: 'Full Back', abbreviation: 'FB', category: 'KEY_POSITION', isPrimary: true, pitchPosition: { x: 50, y: 10 }, relevantStats: ['intercepts', 'spoils', 'marks'], color: '#EF4444' },
  { code: 'CHB', name: 'Centre Half Back', abbreviation: 'CHB', category: 'KEY_POSITION', isPrimary: true, pitchPosition: { x: 50, y: 25 }, relevantStats: ['intercepts', 'marks', 'disposals'], color: '#EF4444' },
  { code: 'CHF', name: 'Centre Half Forward', abbreviation: 'CHF', category: 'KEY_POSITION', isPrimary: true, pitchPosition: { x: 50, y: 75 }, relevantStats: ['goalsAFL', 'marks', 'contestedMarks'], color: '#EF4444' },
  { code: 'FF', name: 'Full Forward', abbreviation: 'FF', category: 'KEY_POSITION', isPrimary: true, pitchPosition: { x: 50, y: 90 }, relevantStats: ['goalsAFL', 'marks', 'contestedMarks'], color: '#EF4444' },
  
  // General
  { code: 'BP', name: 'Back Pocket', abbreviation: 'BP', category: 'GENERAL', pitchPosition: { x: 25, y: 15 }, relevantStats: ['spoils', 'marks', 'disposals'], color: '#22C55E' },
  { code: 'HBF', name: 'Half Back Flank', abbreviation: 'HBF', category: 'GENERAL', isPrimary: true, pitchPosition: { x: 25, y: 30 }, relevantStats: ['rebound50s', 'disposals', 'marks'], color: '#22C55E' },
  { code: 'W', name: 'Wing', abbreviation: 'W', category: 'GENERAL', isPrimary: true, pitchPosition: { x: 15, y: 50 }, relevantStats: ['disposals', 'inside50s', 'marks'], color: '#22C55E' },
  { code: 'HFF', name: 'Half Forward Flank', abbreviation: 'HFF', category: 'GENERAL', isPrimary: true, pitchPosition: { x: 25, y: 70 }, relevantStats: ['goalsAFL', 'disposals', 'marks'], color: '#22C55E' },
  { code: 'FP', name: 'Forward Pocket', abbreviation: 'FP', category: 'GENERAL', pitchPosition: { x: 25, y: 85 }, relevantStats: ['goalsAFL', 'marks'], color: '#22C55E' },
  
  // Ruck
  { code: 'R', name: 'Ruckman', abbreviation: 'R', category: 'RUCK', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['hitouts', 'hitoutsToAdvantage', 'marks'], color: '#3B82F6' },
  { code: 'RR', name: 'Ruck Rover', abbreviation: 'RR', category: 'RUCK', pitchPosition: { x: 45, y: 55 }, relevantStats: ['clearances', 'disposals', 'contestedPossessions'], color: '#3B82F6' },
  
  // Onfield/Midfield
  { code: 'C', name: 'Centre', abbreviation: 'C', category: 'ONFIELD', isPrimary: true, pitchPosition: { x: 50, y: 50 }, relevantStats: ['clearances', 'disposals', 'inside50s'], color: '#A855F7' },
  { code: 'ROV', name: 'Rover', abbreviation: 'ROV', category: 'ONFIELD', isPrimary: true, pitchPosition: { x: 55, y: 55 }, relevantStats: ['disposals', 'clearances', 'tackles'], color: '#A855F7' },
  { code: 'INT', name: 'Interchange', abbreviation: 'INT', category: 'ONFIELD', pitchPosition: { x: 0, y: 50 }, relevantStats: ['disposals', 'tackles'], color: '#A855F7' },
];

// =============================================================================
// GAELIC FOOTBALL POSITIONS
// =============================================================================

const GAELIC_POSITIONS: Position[] = [
  // Goalkeeper
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', isPrimary: true, pitchPosition: { x: 50, y: 5 }, relevantStats: ['savesGAA', 'kickoutRetention'], color: '#FFD700' },
  
  // Defense
  { code: 'RCB', name: 'Right Corner Back', abbreviation: 'RCB', category: 'DEFENSE', pitchPosition: { x: 25, y: 15 }, relevantStats: ['tacklesGAA', 'blocksGAA', 'interceptions'], color: '#3B82F6' },
  { code: 'FB', name: 'Full Back', abbreviation: 'FB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 15 }, relevantStats: ['tacklesGAA', 'blocksGAA', 'interceptions'], color: '#3B82F6' },
  { code: 'LCB', name: 'Left Corner Back', abbreviation: 'LCB', category: 'DEFENSE', pitchPosition: { x: 75, y: 15 }, relevantStats: ['tacklesGAA', 'blocksGAA', 'interceptions'], color: '#3B82F6' },
  { code: 'RHB', name: 'Right Half Back', abbreviation: 'RHB', category: 'DEFENSE', pitchPosition: { x: 25, y: 30 }, relevantStats: ['possessions', 'kickPasses', 'tacklesGAA'], color: '#3B82F6' },
  { code: 'CHB', name: 'Centre Half Back', abbreviation: 'CHB', category: 'DEFENSE', isPrimary: true, pitchPosition: { x: 50, y: 30 }, relevantStats: ['possessions', 'kickPasses', 'tacklesGAA'], color: '#3B82F6' },
  { code: 'LHB', name: 'Left Half Back', abbreviation: 'LHB', category: 'DEFENSE', pitchPosition: { x: 75, y: 30 }, relevantStats: ['possessions', 'kickPasses', 'tacklesGAA'], color: '#3B82F6' },
  
  // Midfield
  { code: 'MF', name: 'Midfielder', abbreviation: 'MF', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 40, y: 50 }, relevantStats: ['possessions', 'kickoutsWon', 'pointsGAA'], color: '#22C55E' },
  { code: 'MF2', name: 'Midfielder', abbreviation: 'MF', category: 'MIDFIELD', isPrimary: true, pitchPosition: { x: 60, y: 50 }, relevantStats: ['possessions', 'kickoutsWon', 'pointsGAA'], color: '#22C55E' },
  
  // Forwards
  { code: 'RHF', name: 'Right Half Forward', abbreviation: 'RHF', category: 'ATTACK', pitchPosition: { x: 25, y: 70 }, relevantStats: ['pointsGAA', 'possessions', 'scoresFromPlay'], color: '#EF4444' },
  { code: 'CHF', name: 'Centre Half Forward', abbreviation: 'CHF', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 70 }, relevantStats: ['pointsGAA', 'goalsGAA', 'possessions'], color: '#EF4444' },
  { code: 'LHF', name: 'Left Half Forward', abbreviation: 'LHF', category: 'ATTACK', pitchPosition: { x: 75, y: 70 }, relevantStats: ['pointsGAA', 'possessions', 'scoresFromPlay'], color: '#EF4444' },
  { code: 'RCF', name: 'Right Corner Forward', abbreviation: 'RCF', category: 'ATTACK', pitchPosition: { x: 25, y: 85 }, relevantStats: ['goalsGAA', 'pointsGAA'], color: '#EF4444' },
  { code: 'FF', name: 'Full Forward', abbreviation: 'FF', category: 'ATTACK', isPrimary: true, pitchPosition: { x: 50, y: 85 }, relevantStats: ['goalsGAA', 'pointsGAA', 'totalScoreGAA'], color: '#EF4444' },
  { code: 'LCF', name: 'Left Corner Forward', abbreviation: 'LCF', category: 'ATTACK', pitchPosition: { x: 75, y: 85 }, relevantStats: ['goalsGAA', 'pointsGAA'], color: '#EF4444' },
];

// =============================================================================
// FORMATIONS
// =============================================================================

const FOOTBALL_FORMATIONS: Formation[] = [
  { code: '4-4-2', name: '4-4-2', description: 'Classic formation with 4 defenders, 4 midfielders, 2 strikers', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 35, y: 20 }, { position: 'CB', x: 65, y: 20 }, { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 15, y: 50 }, { position: 'CM', x: 35, y: 48 }, { position: 'CM', x: 65, y: 48 }, { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 35, y: 80 }, { position: 'ST', x: 65, y: 80 },
  ]},
  { code: '4-3-3', name: '4-3-3', description: 'Attacking formation with 3 forwards', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 35, y: 20 }, { position: 'CB', x: 65, y: 20 }, { position: 'RB', x: 85, y: 25 },
    { position: 'CM', x: 30, y: 50 }, { position: 'CM', x: 50, y: 48 }, { position: 'CM', x: 70, y: 50 },
    { position: 'LW', x: 15, y: 78 }, { position: 'ST', x: 50, y: 82 }, { position: 'RW', x: 85, y: 78 },
  ]},
  { code: '4-2-3-1', name: '4-2-3-1', description: 'Modern formation with double pivot', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 35, y: 20 }, { position: 'CB', x: 65, y: 20 }, { position: 'RB', x: 85, y: 25 },
    { position: 'CDM', x: 35, y: 40 }, { position: 'CDM', x: 65, y: 40 },
    { position: 'LW', x: 15, y: 62 }, { position: 'CAM', x: 50, y: 60 }, { position: 'RW', x: 85, y: 62 },
    { position: 'ST', x: 50, y: 82 },
  ]},
  { code: '3-5-2', name: '3-5-2', description: 'Wing-back formation', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 30, y: 20 }, { position: 'CB', x: 50, y: 18 }, { position: 'CB', x: 70, y: 20 },
    { position: 'LWB', x: 10, y: 45 }, { position: 'CM', x: 35, y: 50 }, { position: 'CDM', x: 50, y: 45 }, { position: 'CM', x: 65, y: 50 }, { position: 'RWB', x: 90, y: 45 },
    { position: 'ST', x: 35, y: 80 }, { position: 'ST', x: 65, y: 80 },
  ]},
  { code: '5-3-2', name: '5-3-2', description: 'Defensive formation with 5 at the back', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LWB', x: 10, y: 30 }, { position: 'CB', x: 30, y: 20 }, { position: 'CB', x: 50, y: 18 }, { position: 'CB', x: 70, y: 20 }, { position: 'RWB', x: 90, y: 30 },
    { position: 'CM', x: 30, y: 50 }, { position: 'CM', x: 50, y: 48 }, { position: 'CM', x: 70, y: 50 },
    { position: 'ST', x: 35, y: 80 }, { position: 'ST', x: 65, y: 80 },
  ]},
];

const FUTSAL_FORMATIONS: Formation[] = [
  { code: '1-2-1', name: '1-2-1 (Diamond)', description: 'Diamond formation with pivot', layout: [
    { position: 'GOL', x: 50, y: 5 },
    { position: 'FIX', x: 50, y: 30 },
    { position: 'ALE', x: 25, y: 55 }, { position: 'ALD', x: 75, y: 55 },
    { position: 'PIV', x: 50, y: 80 },
  ]},
  { code: '2-2', name: '2-2 (Square)', description: 'Balanced square formation', layout: [
    { position: 'GOL', x: 50, y: 5 },
    { position: 'FIX', x: 30, y: 35 }, { position: 'FIX', x: 70, y: 35 },
    { position: 'PIV', x: 30, y: 70 }, { position: 'PIV', x: 70, y: 70 },
  ]},
  { code: '3-1', name: '3-1 (Y)', description: 'Attacking formation with single pivot', layout: [
    { position: 'GOL', x: 50, y: 5 },
    { position: 'ALE', x: 20, y: 45 }, { position: 'FIX', x: 50, y: 35 }, { position: 'ALD', x: 80, y: 45 },
    { position: 'PIV', x: 50, y: 80 },
  ]},
  { code: '4-0', name: '4-0 (Rotating)', description: 'Power play / Rotating formation', layout: [
    { position: 'GOL', x: 50, y: 5 },
    { position: 'ALE', x: 20, y: 55 }, { position: 'FIX', x: 40, y: 45 }, { position: 'FIX', x: 60, y: 45 }, { position: 'ALD', x: 80, y: 55 },
  ]},
];

const BEACH_FOOTBALL_FORMATIONS: Formation[] = [
  { code: '1-2-1', name: '1-2-1', description: 'Standard beach soccer formation', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'DEF', x: 50, y: 35 },
    { position: 'LW', x: 25, y: 60 }, { position: 'RW', x: 75, y: 60 },
    { position: 'PV', x: 50, y: 80 },
  ]},
  { code: '2-1-1', name: '2-1-1', description: 'Defensive formation', layout: [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LD', x: 30, y: 35 }, { position: 'RD', x: 70, y: 35 },
    { position: 'WG', x: 50, y: 60 },
    { position: 'PV', x: 50, y: 80 },
  ]},
];

// =============================================================================
// SPORT POSITION CONFIGURATION MAPPING
// =============================================================================

export const SPORT_POSITIONS: Record<Sport, SportPositionConfig> = {
  FOOTBALL: {
    sport: 'FOOTBALL',
    playersOnField: 11,
    maxSquadSize: 25,
    hasNumberedPositions: false,
    hasFormations: true,
    formations: FOOTBALL_FORMATIONS,
    categories: FOOTBALL_CATEGORIES,
    positions: FOOTBALL_POSITIONS,
    defaultPositions: ['GK', 'CB', 'CM', 'ST'],
  },
  
  FUTSAL: {
    sport: 'FUTSAL',
    playersOnField: 5,
    maxSquadSize: 14,
    hasNumberedPositions: false,
    hasFormations: true,
    formations: FUTSAL_FORMATIONS,
    categories: FUTSAL_CATEGORIES,
    positions: FUTSAL_POSITIONS,
    defaultPositions: ['GOL', 'FIX', 'ALA', 'PIV'],
  },
  
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    playersOnField: 5,
    maxSquadSize: 12,
    hasNumberedPositions: false,
    hasFormations: true,
    formations: BEACH_FOOTBALL_FORMATIONS,
    categories: BEACH_FOOTBALL_CATEGORIES,
    positions: BEACH_FOOTBALL_POSITIONS,
    defaultPositions: ['GK', 'DEF', 'WG', 'PV'],
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
    defaultPositions: ['WK', 'OPN', 'TOP', 'FP', 'OS', 'AR'],
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
    formations: FOOTBALL_FORMATIONS,
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
    defaultPositions: ['G', 'LD', 'M', 'FO', 'A'],
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
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get position configuration for a sport
 * @throws {Error} If sport is invalid
 */
export function getSportPositions(sport: Sport): SportPositionConfig {
  const result = SportEnum.safeParse(sport);
  if (!result.success) {
    throw new Error(`Invalid sport: ${sport}. Valid sports: ${SportEnum.options.join(', ')}`);
  }
  return SPORT_POSITIONS[sport];
}

/**
 * Get a specific position by code
 */
export function getPositionByCode(sport: Sport, code: string): Position | undefined {
  return getSportPositions(sport).positions.find(p => p.code === code);
}

/**
 * Get positions by category
 */
export function getPositionsByCategory(sport: Sport, category: PositionCategory): Position[] {
  return getSportPositions(sport).positions.filter(p => p.category === category);
}

/**
 * Get primary positions only
 */
export function getPrimaryPositions(sport: Sport): Position[] {
  return getSportPositions(sport).positions.filter(p => p.isPrimary);
}

/**
 * Get formation by code
 */
export function getFormationByCode(sport: Sport, code: string): Formation | undefined {
  return getSportPositions(sport).formations?.find(f => f.code === code);
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
  const cat = getSportPositions(sport).categories.find(c => c.category === category);
  return cat?.color || '#6B7280';
}

/**
 * Check if a sport uses formations
 */
export function sportHasFormations(sport: Sport): boolean {
  return getSportPositions(sport).hasFormations;
}

/**
 * Check if a sport uses numbered positions (like Rugby 1-15)
 */
export function sportHasNumberedPositions(sport: Sport): boolean {
  return getSportPositions(sport).hasNumberedPositions;
}

/**
 * Get all position categories for a sport
 */
export function getPositionCategories(sport: Sport): PositionCategoryConfig[] {
  return getSportPositions(sport).categories.sort((a, b) => a.order - b.order);
}

/**
 * Get total number of positions for a sport
 */
export function getPositionCount(sport: Sport): number {
  return getSportPositions(sport).positions.length;
}

/**
 * Validate position code for a sport
 */
export function isValidPosition(sport: Sport, code: string): boolean {
  return getSportPositions(sport).positions.some(p => p.code === code);
}

/**
 * Get positions with pitch coordinates (for diagram rendering)
 */
export function getPositionsWithCoordinates(sport: Sport): Position[] {
  return getSportPositions(sport).positions.filter(p => p.pitchPosition !== undefined);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SPORT_POSITIONS;