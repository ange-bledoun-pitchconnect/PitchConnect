/**
 * ============================================================================
 * SportSelector Component
 * ============================================================================
 * 
 * Enterprise-grade sport selector aligned with Schema v7.10.1 Sport enum.
 * Used during club/team creation and sport filtering.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - CLUB_OWNER: Creating new clubs
 * - CLUB_MANAGER: Managing club settings
 * - ADMIN: System administration
 * - SUPERADMIN: Platform management
 * - LEAGUE_ADMIN: League configuration
 * 
 * SCHEMA ALIGNMENT:
 * - Sport enum (all 12 sports from schema)
 * - Position enum (sport-specific positions)
 * - Club model (sport field)
 * - Team model (sport field)
 * 
 * SUPPORTED SPORTS (from Schema v7.10.1):
 * - FOOTBALL ⚽
 * - NETBALL 🏐
 * - RUGBY 🏉
 * - CRICKET 🏏
 * - AMERICAN_FOOTBALL 🏈
 * - BASKETBALL 🏀
 * - HOCKEY 🏒
 * - LACROSSE 🥍
 * - AUSTRALIAN_RULES 🏉
 * - GAELIC_FOOTBALL 🏐
 * - FUTSAL ⚽
 * - BEACH_FOOTBALL 🏖️
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo } from 'react';
import { Check, Users, Timer, Award, Info, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

// =============================================================================
// TYPE DEFINITIONS (Aligned with Schema v7.10.1)
// =============================================================================

/**
 * Sport enum from Schema v7.10.1
 */
export type Sport =
  | 'FOOTBALL'
  | 'NETBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

/**
 * Sport category for grouping
 */
type SportCategory = 'ball' | 'field' | 'court' | 'indoor' | 'other';

/**
 * Position definition
 */
interface SportPosition {
  key: string;
  name: string;
  abbreviation: string;
  category: string;
}

/**
 * Training category definition
 */
interface TrainingCategory {
  category: string;
  label: string;
  icon: string;
}

/**
 * Stat configuration
 */
interface StatConfig {
  key: string;
  name: string;
  type: 'count' | 'percentage' | 'duration' | 'distance';
}

/**
 * Sport configuration interface
 */
interface SportConfig {
  key: Sport;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  category: SportCategory;
  description: string;
  squadSize: { min: number; max: number };
  matchDuration: number;
  periods: number;
  periodName: string;
  positions: SportPosition[];
  trainingCategories: TrainingCategory[];
  statsConfig: StatConfig[];
  scoringTerms: { goal: string; point?: string };
  hasDraws: boolean;
}

// =============================================================================
// SPORT CONFIGURATIONS (Aligned with Schema v7.10.1)
// =============================================================================

const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  FOOTBALL: {
    key: 'FOOTBALL',
    name: 'Football',
    icon: '⚽',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
    category: 'field',
    description: 'Association football (soccer)',
    squadSize: { min: 11, max: 30 },
    matchDuration: 90,
    periods: 2,
    periodName: 'Half',
    positions: [
      { key: 'GOALKEEPER', name: 'Goalkeeper', abbreviation: 'GK', category: 'Goalkeeper' },
      { key: 'CENTER_BACK', name: 'Center Back', abbreviation: 'CB', category: 'Defense' },
      { key: 'LEFT_BACK', name: 'Left Back', abbreviation: 'LB', category: 'Defense' },
      { key: 'RIGHT_BACK', name: 'Right Back', abbreviation: 'RB', category: 'Defense' },
      { key: 'DEFENSIVE_MIDFIELDER', name: 'Defensive Midfielder', abbreviation: 'CDM', category: 'Midfield' },
      { key: 'CENTRAL_MIDFIELDER', name: 'Central Midfielder', abbreviation: 'CM', category: 'Midfield' },
      { key: 'ATTACKING_MIDFIELDER', name: 'Attacking Midfielder', abbreviation: 'CAM', category: 'Midfield' },
      { key: 'LEFT_WINGER', name: 'Left Winger', abbreviation: 'LW', category: 'Attack' },
      { key: 'RIGHT_WINGER', name: 'Right Winger', abbreviation: 'RW', category: 'Attack' },
      { key: 'STRIKER', name: 'Striker', abbreviation: 'ST', category: 'Attack' },
      { key: 'CENTER_FORWARD', name: 'Center Forward', abbreviation: 'CF', category: 'Attack' },
    ],
    trainingCategories: [
      { category: 'TECHNICAL', label: 'Technical', icon: '🎯' },
      { category: 'TACTICAL', label: 'Tactical', icon: '📋' },
      { category: 'PHYSICAL', label: 'Physical', icon: '💪' },
      { category: 'MENTAL', label: 'Mental', icon: '🧠' },
      { category: 'SET_PIECE', label: 'Set Pieces', icon: '🎪' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'assists', name: 'Assists', type: 'count' },
      { key: 'passAccuracy', name: 'Pass Accuracy', type: 'percentage' },
      { key: 'tackles', name: 'Tackles', type: 'count' },
      { key: 'saves', name: 'Saves', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal' },
    hasDraws: true,
  },
  NETBALL: {
    key: 'NETBALL',
    name: 'Netball',
    icon: '🏐',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-700',
    category: 'court',
    description: 'Fast-paced court sport',
    squadSize: { min: 7, max: 15 },
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    positions: [
      { key: 'GOAL_SHOOTER', name: 'Goal Shooter', abbreviation: 'GS', category: 'Attack' },
      { key: 'GOAL_ATTACK', name: 'Goal Attack', abbreviation: 'GA', category: 'Attack' },
      { key: 'WING_ATTACK', name: 'Wing Attack', abbreviation: 'WA', category: 'Midcourt' },
      { key: 'CENTER', name: 'Center', abbreviation: 'C', category: 'Midcourt' },
      { key: 'WING_DEFENSE', name: 'Wing Defense', abbreviation: 'WD', category: 'Midcourt' },
      { key: 'GOAL_DEFENSE', name: 'Goal Defense', abbreviation: 'GD', category: 'Defense' },
      { key: 'GOALKEEPER_NETBALL', name: 'Goalkeeper', abbreviation: 'GK', category: 'Defense' },
    ],
    trainingCategories: [
      { category: 'SHOOTING', label: 'Shooting', icon: '🎯' },
      { category: 'PASSING', label: 'Passing', icon: '↗️' },
      { category: 'FOOTWORK', label: 'Footwork', icon: '👟' },
      { category: 'DEFENSE', label: 'Defense', icon: '🛡️' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'goalAccuracy', name: 'Goal Accuracy', type: 'percentage' },
      { key: 'intercepts', name: 'Intercepts', type: 'count' },
      { key: 'centrePassReceives', name: 'Centre Pass Receives', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal' },
    hasDraws: true,
  },
  RUGBY: {
    key: 'RUGBY',
    name: 'Rugby',
    icon: '🏉',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-700',
    category: 'field',
    description: 'Rugby Union and League',
    squadSize: { min: 15, max: 35 },
    matchDuration: 80,
    periods: 2,
    periodName: 'Half',
    positions: [
      { key: 'PROP', name: 'Prop', abbreviation: 'P', category: 'Forwards' },
      { key: 'HOOKER', name: 'Hooker', abbreviation: 'H', category: 'Forwards' },
      { key: 'LOCK', name: 'Lock', abbreviation: 'L', category: 'Forwards' },
      { key: 'FLANKER', name: 'Flanker', abbreviation: 'FL', category: 'Forwards' },
      { key: 'NUMBER_8', name: 'Number 8', abbreviation: 'N8', category: 'Forwards' },
      { key: 'SCRUM_HALF', name: 'Scrum Half', abbreviation: 'SH', category: 'Backs' },
      { key: 'FLY_HALF', name: 'Fly Half', abbreviation: 'FH', category: 'Backs' },
      { key: 'INSIDE_CENTER', name: 'Inside Center', abbreviation: 'IC', category: 'Backs' },
      { key: 'OUTSIDE_CENTER', name: 'Outside Center', abbreviation: 'OC', category: 'Backs' },
      { key: 'FULLBACK', name: 'Fullback', abbreviation: 'FB', category: 'Backs' },
    ],
    trainingCategories: [
      { category: 'TACKLING', label: 'Tackling', icon: '💥' },
      { category: 'SCRUMMAGING', label: 'Scrummaging', icon: '🏋️' },
      { category: 'LINEOUT', label: 'Lineout', icon: '📏' },
      { category: 'KICKING', label: 'Kicking', icon: '🦵' },
    ],
    statsConfig: [
      { key: 'tries', name: 'Tries', type: 'count' },
      { key: 'conversions', name: 'Conversions', type: 'count' },
      { key: 'tackles', name: 'Tackles', type: 'count' },
      { key: 'metersCarried', name: 'Meters Carried', type: 'distance' },
    ],
    scoringTerms: { goal: 'Try', point: 'Point' },
    hasDraws: true,
  },
  CRICKET: {
    key: 'CRICKET',
    name: 'Cricket',
    icon: '🏏',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-300 dark:border-amber-700',
    category: 'field',
    description: 'Bat-and-ball team sport',
    squadSize: { min: 11, max: 18 },
    matchDuration: 360,
    periods: 2,
    periodName: 'Innings',
    positions: [
      { key: 'BATSMAN', name: 'Batsman', abbreviation: 'BAT', category: 'Batting' },
      { key: 'BOWLER', name: 'Bowler', abbreviation: 'BWL', category: 'Bowling' },
      { key: 'ALL_ROUNDER', name: 'All-Rounder', abbreviation: 'AR', category: 'All-Round' },
      { key: 'WICKET_KEEPER', name: 'Wicket Keeper', abbreviation: 'WK', category: 'Specialist' },
    ],
    trainingCategories: [
      { category: 'BATTING', label: 'Batting', icon: '🏏' },
      { category: 'BOWLING', label: 'Bowling', icon: '🎯' },
      { category: 'FIELDING', label: 'Fielding', icon: '🧤' },
      { category: 'WICKET_KEEPING', label: 'Wicket Keeping', icon: '🥅' },
    ],
    statsConfig: [
      { key: 'runs', name: 'Runs', type: 'count' },
      { key: 'wickets', name: 'Wickets', type: 'count' },
      { key: 'battingAverage', name: 'Batting Average', type: 'count' },
      { key: 'bowlingEconomy', name: 'Economy Rate', type: 'count' },
    ],
    scoringTerms: { goal: 'Run' },
    hasDraws: true,
  },
  AMERICAN_FOOTBALL: {
    key: 'AMERICAN_FOOTBALL',
    name: 'American Football',
    icon: '🏈',
    color: 'text-brown-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-300 dark:border-orange-700',
    category: 'field',
    description: 'Gridiron football',
    squadSize: { min: 11, max: 53 },
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    positions: [
      { key: 'QUARTERBACK', name: 'Quarterback', abbreviation: 'QB', category: 'Offense' },
      { key: 'RUNNING_BACK', name: 'Running Back', abbreviation: 'RB', category: 'Offense' },
      { key: 'WIDE_RECEIVER', name: 'Wide Receiver', abbreviation: 'WR', category: 'Offense' },
      { key: 'TIGHT_END', name: 'Tight End', abbreviation: 'TE', category: 'Offense' },
      { key: 'LINEBACKER', name: 'Linebacker', abbreviation: 'LB', category: 'Defense' },
      { key: 'DEFENSIVE_END', name: 'Defensive End', abbreviation: 'DE', category: 'Defense' },
      { key: 'CORNERBACK', name: 'Cornerback', abbreviation: 'CB', category: 'Defense' },
      { key: 'SAFETY', name: 'Safety', abbreviation: 'S', category: 'Defense' },
    ],
    trainingCategories: [
      { category: 'PASSING', label: 'Passing', icon: '🎯' },
      { category: 'RUSHING', label: 'Rushing', icon: '🏃' },
      { category: 'BLOCKING', label: 'Blocking', icon: '🛡️' },
      { category: 'TACKLING', label: 'Tackling', icon: '💥' },
    ],
    statsConfig: [
      { key: 'touchdowns', name: 'Touchdowns', type: 'count' },
      { key: 'passingYards', name: 'Passing Yards', type: 'distance' },
      { key: 'rushingYards', name: 'Rushing Yards', type: 'distance' },
      { key: 'tackles', name: 'Tackles', type: 'count' },
    ],
    scoringTerms: { goal: 'Touchdown', point: 'Point' },
    hasDraws: true,
  },
  BASKETBALL: {
    key: 'BASKETBALL',
    name: 'Basketball',
    icon: '🏀',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-300 dark:border-orange-700',
    category: 'court',
    description: 'Fast-paced indoor sport',
    squadSize: { min: 5, max: 15 },
    matchDuration: 48,
    periods: 4,
    periodName: 'Quarter',
    positions: [
      { key: 'POINT_GUARD', name: 'Point Guard', abbreviation: 'PG', category: 'Guard' },
      { key: 'SHOOTING_GUARD', name: 'Shooting Guard', abbreviation: 'SG', category: 'Guard' },
      { key: 'SMALL_FORWARD', name: 'Small Forward', abbreviation: 'SF', category: 'Forward' },
      { key: 'POWER_FORWARD', name: 'Power Forward', abbreviation: 'PF', category: 'Forward' },
      { key: 'CENTER_BASKETBALL', name: 'Center', abbreviation: 'C', category: 'Center' },
    ],
    trainingCategories: [
      { category: 'SHOOTING', label: 'Shooting', icon: '🎯' },
      { category: 'DRIBBLING', label: 'Dribbling', icon: '🏀' },
      { category: 'PASSING', label: 'Passing', icon: '↗️' },
      { category: 'DEFENSE', label: 'Defense', icon: '🛡️' },
    ],
    statsConfig: [
      { key: 'points', name: 'Points', type: 'count' },
      { key: 'rebounds', name: 'Rebounds', type: 'count' },
      { key: 'assists', name: 'Assists', type: 'count' },
      { key: 'steals', name: 'Steals', type: 'count' },
    ],
    scoringTerms: { goal: 'Point' },
    hasDraws: false,
  },
  HOCKEY: {
    key: 'HOCKEY',
    name: 'Hockey',
    icon: '🏒',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700',
    category: 'field',
    description: 'Field and ice hockey',
    squadSize: { min: 6, max: 23 },
    matchDuration: 60,
    periods: 3,
    periodName: 'Period',
    positions: [
      { key: 'CENTER_HOCKEY', name: 'Center', abbreviation: 'C', category: 'Forward' },
      { key: 'WINGER', name: 'Winger', abbreviation: 'W', category: 'Forward' },
      { key: 'DEFENSEMAN', name: 'Defenseman', abbreviation: 'D', category: 'Defense' },
      { key: 'GOALTENDER', name: 'Goaltender', abbreviation: 'G', category: 'Goaltender' },
    ],
    trainingCategories: [
      { category: 'SKATING', label: 'Skating', icon: '⛸️' },
      { category: 'SHOOTING', label: 'Shooting', icon: '🎯' },
      { category: 'PUCK_CONTROL', label: 'Puck Control', icon: '🏒' },
      { category: 'CHECKING', label: 'Checking', icon: '💥' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'assists', name: 'Assists', type: 'count' },
      { key: 'plusMinus', name: '+/-', type: 'count' },
      { key: 'saves', name: 'Saves', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal' },
    hasDraws: true,
  },
  LACROSSE: {
    key: 'LACROSSE',
    name: 'Lacrosse',
    icon: '🥍',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    category: 'field',
    description: 'Fast-paced stick sport',
    squadSize: { min: 10, max: 25 },
    matchDuration: 60,
    periods: 4,
    periodName: 'Quarter',
    positions: [
      { key: 'ATTACKMAN', name: 'Attackman', abbreviation: 'A', category: 'Attack' },
      { key: 'MIDFIELDER_LACROSSE', name: 'Midfielder', abbreviation: 'M', category: 'Midfield' },
      { key: 'DEFENSEMAN_LACROSSE', name: 'Defenseman', abbreviation: 'D', category: 'Defense' },
      { key: 'GOALIE_LACROSSE', name: 'Goalie', abbreviation: 'G', category: 'Goalie' },
    ],
    trainingCategories: [
      { category: 'STICK_SKILLS', label: 'Stick Skills', icon: '🥍' },
      { category: 'SHOOTING', label: 'Shooting', icon: '🎯' },
      { category: 'GROUND_BALLS', label: 'Ground Balls', icon: '🔄' },
      { category: 'DEFENSE', label: 'Defense', icon: '🛡️' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'assists', name: 'Assists', type: 'count' },
      { key: 'groundBalls', name: 'Ground Balls', type: 'count' },
      { key: 'faceoffsWon', name: 'Faceoffs Won', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal' },
    hasDraws: false,
  },
  AUSTRALIAN_RULES: {
    key: 'AUSTRALIAN_RULES',
    name: 'Australian Rules',
    icon: '🏉',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    category: 'field',
    description: 'AFL football',
    squadSize: { min: 18, max: 44 },
    matchDuration: 80,
    periods: 4,
    periodName: 'Quarter',
    positions: [
      { key: 'FULL_FORWARD', name: 'Full Forward', abbreviation: 'FF', category: 'Forward' },
      { key: 'HALF_FORWARD', name: 'Half Forward', abbreviation: 'HF', category: 'Forward' },
      { key: 'RUCK', name: 'Ruck', abbreviation: 'R', category: 'Midfield' },
      { key: 'ROVER', name: 'Rover', abbreviation: 'RO', category: 'Midfield' },
      { key: 'HALF_BACK', name: 'Half Back', abbreviation: 'HB', category: 'Defense' },
      { key: 'FULL_BACK_AFL', name: 'Full Back', abbreviation: 'FB', category: 'Defense' },
    ],
    trainingCategories: [
      { category: 'KICKING', label: 'Kicking', icon: '🦵' },
      { category: 'MARKING', label: 'Marking', icon: '🙌' },
      { category: 'HANDBALLING', label: 'Handballing', icon: '✋' },
      { category: 'TACKLING', label: 'Tackling', icon: '💪' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'behinds', name: 'Behinds', type: 'count' },
      { key: 'disposals', name: 'Disposals', type: 'count' },
      { key: 'marks', name: 'Marks', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal', point: 'Behind' },
    hasDraws: true,
  },
  GAELIC_FOOTBALL: {
    key: 'GAELIC_FOOTBALL',
    name: 'Gaelic Football',
    icon: '🏐',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    category: 'field',
    description: 'Irish team sport',
    squadSize: { min: 15, max: 30 },
    matchDuration: 70,
    periods: 2,
    periodName: 'Half',
    positions: [
      { key: 'GOALKEEPER_GAELIC', name: 'Goalkeeper', abbreviation: 'GK', category: 'Goalkeeper' },
      { key: 'FULL_BACK_GAELIC', name: 'Full Back', abbreviation: 'FB', category: 'Defense' },
      { key: 'HALF_BACK_GAELIC', name: 'Half Back', abbreviation: 'HB', category: 'Defense' },
      { key: 'MIDFIELDER_GAELIC', name: 'Midfielder', abbreviation: 'MF', category: 'Midfield' },
      { key: 'HALF_FORWARD_GAELIC', name: 'Half Forward', abbreviation: 'HF', category: 'Forward' },
      { key: 'FULL_FORWARD_GAELIC', name: 'Full Forward', abbreviation: 'FF', category: 'Forward' },
    ],
    trainingCategories: [
      { category: 'KICKING', label: 'Kicking', icon: '🦵' },
      { category: 'CATCHING', label: 'Catching', icon: '🤲' },
      { category: 'SOLOING', label: 'Soloing', icon: '🏃' },
      { category: 'TACKLING', label: 'Tackling', icon: '💪' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'points', name: 'Points', type: 'count' },
      { key: 'turnovers', name: 'Turnovers', type: 'count' },
      { key: 'soloRuns', name: 'Solo Runs', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal', point: 'Point' },
    hasDraws: true,
  },
  FUTSAL: {
    key: 'FUTSAL',
    name: 'Futsal',
    icon: '⚽',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-300 dark:border-teal-700',
    category: 'indoor',
    description: 'Indoor football variant',
    squadSize: { min: 5, max: 14 },
    matchDuration: 40,
    periods: 2,
    periodName: 'Half',
    positions: [
      { key: 'GOALKEEPER_FUTSAL', name: 'Goalkeeper', abbreviation: 'GK', category: 'Goalkeeper' },
      { key: 'FIXO', name: 'Fixo (Defender)', abbreviation: 'FX', category: 'Defense' },
      { key: 'ALA', name: 'Ala (Winger)', abbreviation: 'AL', category: 'Midfield' },
      { key: 'PIVO', name: 'Pivô (Pivot)', abbreviation: 'PV', category: 'Attack' },
    ],
    trainingCategories: [
      { category: 'TECHNIQUE', label: 'Technique', icon: '🎯' },
      { category: 'SPEED', label: 'Speed', icon: '⚡' },
      { category: 'PASSING', label: 'Passing', icon: '↗️' },
      { category: 'SHOOTING', label: 'Shooting', icon: '🥅' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'assists', name: 'Assists', type: 'count' },
      { key: 'steals', name: 'Steals', type: 'count' },
      { key: 'saves', name: 'Saves', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal' },
    hasDraws: true,
  },
  BEACH_FOOTBALL: {
    key: 'BEACH_FOOTBALL',
    name: 'Beach Football',
    icon: '🏖️',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    category: 'field',
    description: 'Beach soccer variant',
    squadSize: { min: 5, max: 12 },
    matchDuration: 36,
    periods: 3,
    periodName: 'Period',
    positions: [
      { key: 'GOALKEEPER_BEACH', name: 'Goalkeeper', abbreviation: 'GK', category: 'Goalkeeper' },
      { key: 'DEFENDER_BEACH', name: 'Defender', abbreviation: 'DF', category: 'Defense' },
      { key: 'WINGER_BEACH', name: 'Winger', abbreviation: 'WG', category: 'Attack' },
      { key: 'PIVOT_BEACH', name: 'Pivot', abbreviation: 'PV', category: 'Attack' },
    ],
    trainingCategories: [
      { category: 'TECHNIQUE', label: 'Technique', icon: '🎯' },
      { category: 'ACROBATICS', label: 'Acrobatics', icon: '🤸' },
      { category: 'FINISHING', label: 'Finishing', icon: '🥅' },
      { category: 'FITNESS', label: 'Fitness', icon: '💪' },
    ],
    statsConfig: [
      { key: 'goals', name: 'Goals', type: 'count' },
      { key: 'assists', name: 'Assists', type: 'count' },
      { key: 'bicycleKicks', name: 'Bicycle Kicks', type: 'count' },
      { key: 'headers', name: 'Headers', type: 'count' },
    ],
    scoringTerms: { goal: 'Goal' },
    hasDraws: false,
  },
};

// Export for use in other components
export { SPORT_CONFIGS };
export type { SportConfig, SportPosition, TrainingCategory, StatConfig };

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface SportSelectorProps {
  /** Selected sport value */
  value?: Sport;
  /** Change handler */
  onChange: (sport: Sport) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show detailed configuration panel */
  showDetails?: boolean;
  /** Show search filter */
  showSearch?: boolean;
  /** View mode */
  viewMode?: 'grid' | 'list';
  /** Allow view mode toggle */
  allowViewToggle?: boolean;
  /** Custom class name */
  className?: string;
  /** Required field indicator */
  required?: boolean;
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SportSelector({
  value,
  onChange,
  disabled = false,
  showDetails = true,
  showSearch = false,
  viewMode: initialViewMode = 'grid',
  allowViewToggle = false,
  className,
  required = true,
  label = 'Select Sport',
  error,
}: SportSelectorProps) {
  const [hoveredSport, setHoveredSport] = useState<Sport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(initialViewMode);

  // Filter sports based on search
  const filteredSports = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return Object.values(SPORT_CONFIGS);
    
    return Object.values(SPORT_CONFIGS).filter(
      (config) =>
        config.name.toLowerCase().includes(query) ||
        config.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get details for selected or hovered sport
  const detailSport = hoveredSport || value;
  const detailConfig = detailSport ? SPORT_CONFIGS[detailSport] : null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        
        {allowViewToggle && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search sports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
        </div>
      )}

      {/* Sport Grid/List */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3'
            : 'flex flex-col gap-2'
        )}
      >
        {filteredSports.map((config) => {
          const isSelected = value === config.key;

          return (
            <TooltipProvider key={config.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(config.key)}
                    onMouseEnter={() => setHoveredSport(config.key)}
                    onMouseLeave={() => setHoveredSport(null)}
                    className={cn(
                      'relative flex items-center transition-all duration-200',
                      'hover:border-primary hover:bg-primary/5',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      isSelected
                        ? cn('border-2 border-primary', config.bgColor)
                        : 'border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
                      disabled && 'opacity-50 cursor-not-allowed',
                      viewMode === 'grid'
                        ? 'flex-col justify-center p-4 rounded-lg'
                        : 'gap-3 p-3 rounded-lg'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className={viewMode === 'grid' ? 'text-3xl mb-2' : 'text-2xl'}>
                      {config.icon}
                    </span>
                    <span
                      className={cn(
                        'font-medium text-center leading-tight',
                        viewMode === 'grid' ? 'text-xs' : 'text-sm'
                      )}
                    >
                      {config.name}
                    </span>
                    {viewMode === 'list' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {config.positions.length} positions
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{config.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {config.positions.length} positions • {config.matchDuration}min matches
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Sport Details */}
      {showDetails && detailConfig && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={cn('text-4xl p-3 rounded-full', detailConfig.bgColor)}>
                {detailConfig.icon}
              </div>
              <div>
                <CardTitle>{detailConfig.name}</CardTitle>
                <CardDescription>{detailConfig.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                <div className="text-lg font-semibold">
                  {detailConfig.squadSize.min}-{detailConfig.squadSize.max}
                </div>
                <div className="text-xs text-gray-500">Squad Size</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Timer className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                <div className="text-lg font-semibold">{detailConfig.matchDuration}</div>
                <div className="text-xs text-gray-500">Match (mins)</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Award className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                <div className="text-lg font-semibold">{detailConfig.positions.length}</div>
                <div className="text-xs text-gray-500">Positions</div>
              </div>
            </div>

            {/* Positions */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Available Positions</Label>
              <div className="flex flex-wrap gap-1.5">
                {detailConfig.positions.slice(0, 12).map((position) => (
                  <Badge key={position.key} variant="secondary" className="text-xs">
                    {position.abbreviation}
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
                {detailConfig.trainingCategories.map((category) => (
                  <Badge key={category.category} variant="outline" className="text-xs">
                    {category.icon} {category.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats Tracked */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Performance Stats</Label>
              <div className="flex flex-wrap gap-1.5">
                {detailConfig.statsConfig.map((stat) => (
                  <Badge key={stat.key} variant="secondary" className="text-xs">
                    {stat.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-blue-700 dark:text-blue-300">
                All configurations include position-specific metrics, training categories,
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
            <p className="text-gray-500 dark:text-gray-400">
              Select a sport to see configuration details
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT VERSION
// =============================================================================

interface SportSelectorCompactProps {
  value?: Sport;
  onChange: (sport: Sport) => void;
  disabled?: boolean;
  className?: string;
}

export function SportSelectorCompact({
  value,
  onChange,
  disabled = false,
  className,
}: SportSelectorCompactProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {Object.values(SPORT_CONFIGS).map((config) => {
        const isSelected = value === config.key;

        return (
          <Button
            key={config.key}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            disabled={disabled}
            onClick={() => onChange(config.key)}
            className={cn(
              'gap-1.5',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            <span>{config.icon}</span>
            <span>{config.name}</span>
          </Button>
        );
      })}
    </div>
  );
}

SportSelector.displayName = 'SportSelector';
SportSelectorCompact.displayName = 'SportSelectorCompact';

export default SportSelector;
