/**
 * ============================================================================
 * 🏆 USE SPORT CONFIG HOOK v7.10.1 - MULTI-SPORT FOUNDATION
 * ============================================================================
 * 
 * Provides sport-aware context for the entire application.
 * This is the FOUNDATION hook that all other sport-related hooks depend on.
 * 
 * Features:
 * - Full 12-sport support with authentic terminology
 * - Dynamic scoring systems per sport
 * - Period/quarter configurations
 * - Position categories per sport
 * - Event type mappings
 * - Zod validation for type safety
 * 
 * @version 7.10.1
 * @path src/hooks/useSportConfig.ts
 * ============================================================================
 */

'use client';

import { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { z } from 'zod';

// =============================================================================
// ZOD SCHEMAS - TYPE SAFETY
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

export const MatchStatusEnum = z.enum([
  'SCHEDULED',
  'WARMUP',
  'LIVE',
  'HALFTIME',
  'SECOND_HALF',
  'EXTRA_TIME_FIRST',
  'EXTRA_TIME_SECOND',
  'PENALTIES',
  'FINISHED',
  'CANCELLED',
  'POSTPONED',
  'ABANDONED',
  'REPLAY_SCHEDULED',
  'VOIDED',
  'DELAYED',
  'SUSPENDED',
]);

export type MatchStatus = z.infer<typeof MatchStatusEnum>;

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ScoringUnit {
  name: string;
  namePlural: string;
  points: number;
  icon: string;
  color: string;
}

export interface PeriodConfig {
  name: string;
  namePlural: string;
  count: number;
  durationMinutes: number;
  hasOvertime: boolean;
  overtimeName?: string;
  hasShootout?: boolean;
  shootoutName?: string;
}

export interface PositionCategory {
  key: string;
  name: string;
  color: string;
  order: number;
}

export interface SportEventType {
  key: string;
  label: string;
  icon: string;
  category: 'scoring' | 'disciplinary' | 'substitution' | 'set_piece' | 'time' | 'defensive' | 'other';
  points?: number;
  color: string;
  bgColor: string;
}

export interface SportConfig {
  sport: Sport;
  name: string;
  shortName: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Scoring
  scoringUnits: ScoringUnit[];
  primaryScoringUnit: ScoringUnit;
  hasDraws: boolean;
  
  // Periods
  periods: PeriodConfig;
  
  // Positions
  positionCategories: PositionCategory[];
  
  // Events
  eventTypes: SportEventType[];
  scoringEvents: string[];
  disciplinaryEvents: string[];
  
  // UI
  liveStatuses: MatchStatus[];
  finishedStatuses: MatchStatus[];
  
  // Terminology
  terms: {
    match: string;
    matchPlural: string;
    team: string;
    teamPlural: string;
    player: string;
    playerPlural: string;
    coach: string;
    venue: string;
  };
}

// =============================================================================
// SPORT CONFIGURATIONS - ALL 12 SPORTS
// =============================================================================

const LIVE_STATUSES: MatchStatus[] = [
  'LIVE', 'HALFTIME', 'SECOND_HALF', 
  'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES'
];

const FINISHED_STATUSES: MatchStatus[] = ['FINISHED', 'ABANDONED', 'VOIDED'];

const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  // =========================================================================
  // FOOTBALL (SOCCER)
  // =========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    name: 'Football',
    shortName: 'Football',
    icon: '⚽',
    primaryColor: '#22C55E',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 1, icon: '⚽', color: 'text-green-600' },
    ],
    primaryScoringUnit: { name: 'Goal', namePlural: 'Goals', points: 1, icon: '⚽', color: 'text-green-600' },
    hasDraws: true,
    periods: {
      name: 'Half',
      namePlural: 'Halves',
      count: 2,
      durationMinutes: 45,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: true,
      shootoutName: 'Penalty Shootout',
    },
    positionCategories: [
      { key: 'goalkeeper', name: 'Goalkeeper', color: '#F59E0B', order: 1 },
      { key: 'defense', name: 'Defense', color: '#3B82F6', order: 2 },
      { key: 'midfield', name: 'Midfield', color: '#22C55E', order: 3 },
      { key: 'attack', name: 'Attack', color: '#EF4444', order: 4 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal', icon: '⚽', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'OWN_GOAL', label: 'Own Goal', icon: '⚽', category: 'scoring', points: 1, color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'PENALTY_SCORED', label: 'Penalty Scored', icon: '⚽', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'PENALTY_MISSED', label: 'Penalty Missed', icon: '❌', category: 'set_piece', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'ASSIST', label: 'Assist', icon: '🎯', category: 'scoring', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'SECOND_YELLOW', label: 'Second Yellow', icon: '🟨🟥', category: 'disciplinary', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'disciplinary', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'SUBSTITUTION_ON', label: 'Substitution On', icon: '🔼', category: 'substitution', color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'SUBSTITUTION_OFF', label: 'Substitution Off', icon: '🔽', category: 'substitution', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'CORNER', label: 'Corner', icon: '🚩', category: 'set_piece', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
      { key: 'OFFSIDE', label: 'Offside', icon: '🚫', category: 'other', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
      { key: 'VAR_REVIEW', label: 'VAR Review', icon: '📺', category: 'other', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ],
    scoringEvents: ['GOAL', 'OWN_GOAL', 'PENALTY_SCORED'],
    disciplinaryEvents: ['YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Manager',
      venue: 'Stadium',
    },
  },

  // =========================================================================
  // RUGBY UNION
  // =========================================================================
  RUGBY: {
    sport: 'RUGBY',
    name: 'Rugby Union',
    shortName: 'Rugby',
    icon: '🏉',
    primaryColor: '#8B5CF6',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Try', namePlural: 'Tries', points: 5, icon: '🏉', color: 'text-green-600' },
      { name: 'Conversion', namePlural: 'Conversions', points: 2, icon: '🥅', color: 'text-blue-600' },
      { name: 'Penalty', namePlural: 'Penalties', points: 3, icon: '🎯', color: 'text-amber-600' },
      { name: 'Drop Goal', namePlural: 'Drop Goals', points: 3, icon: '🦶', color: 'text-purple-600' },
    ],
    primaryScoringUnit: { name: 'Point', namePlural: 'Points', points: 1, icon: '🏉', color: 'text-purple-600' },
    hasDraws: true,
    periods: {
      name: 'Half',
      namePlural: 'Halves',
      count: 2,
      durationMinutes: 40,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: false,
    },
    positionCategories: [
      { key: 'front_row', name: 'Front Row', color: '#EF4444', order: 1 },
      { key: 'second_row', name: 'Locks', color: '#F97316', order: 2 },
      { key: 'back_row', name: 'Back Row', color: '#F59E0B', order: 3 },
      { key: 'half_backs', name: 'Half Backs', color: '#22C55E', order: 4 },
      { key: 'centres', name: 'Centres', color: '#3B82F6', order: 5 },
      { key: 'outside_backs', name: 'Outside Backs', color: '#8B5CF6', order: 6 },
    ],
    eventTypes: [
      { key: 'TRY', label: 'Try', icon: '🏉', category: 'scoring', points: 5, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'CONVERSION', label: 'Conversion', icon: '🥅', category: 'scoring', points: 2, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'PENALTY_GOAL', label: 'Penalty Goal', icon: '🎯', category: 'scoring', points: 3, color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'DROP_GOAL', label: 'Drop Goal', icon: '🦶', category: 'scoring', points: 3, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'YELLOW_CARD_RUGBY', label: 'Yellow Card', icon: '🟨', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'RED_CARD_RUGBY', label: 'Red Card', icon: '🟥', category: 'disciplinary', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'SIN_BIN', label: 'Sin Bin', icon: '⏱️', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'SCRUM', label: 'Scrum', icon: '🤼', category: 'set_piece', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
      { key: 'LINEOUT', label: 'Lineout', icon: '📏', category: 'set_piece', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    ],
    scoringEvents: ['TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL'],
    disciplinaryEvents: ['YELLOW_CARD_RUGBY', 'RED_CARD_RUGBY', 'SIN_BIN'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Stadium',
    },
  },

  // =========================================================================
  // CRICKET
  // =========================================================================
  CRICKET: {
    sport: 'CRICKET',
    name: 'Cricket',
    shortName: 'Cricket',
    icon: '🏏',
    primaryColor: '#F59E0B',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Run', namePlural: 'Runs', points: 1, icon: '🏃', color: 'text-green-600' },
      { name: 'Four', namePlural: 'Fours', points: 4, icon: '4️⃣', color: 'text-blue-600' },
      { name: 'Six', namePlural: 'Sixes', points: 6, icon: '6️⃣', color: 'text-purple-600' },
      { name: 'Wicket', namePlural: 'Wickets', points: 0, icon: '🎯', color: 'text-red-600' },
    ],
    primaryScoringUnit: { name: 'Run', namePlural: 'Runs', points: 1, icon: '🏏', color: 'text-amber-600' },
    hasDraws: true,
    periods: {
      name: 'Innings',
      namePlural: 'Innings',
      count: 2,
      durationMinutes: 0, // Overs-based, not time-based
      hasOvertime: false,
      hasShootout: false,
    },
    positionCategories: [
      { key: 'wicket_keeper', name: 'Wicket-Keeper', color: '#F59E0B', order: 1 },
      { key: 'batsman', name: 'Batsman', color: '#3B82F6', order: 2 },
      { key: 'bowler', name: 'Bowler', color: '#EF4444', order: 3 },
      { key: 'all_rounder', name: 'All-Rounder', color: '#22C55E', order: 4 },
    ],
    eventTypes: [
      { key: 'BOUNDARY', label: 'Four', icon: '4️⃣', category: 'scoring', points: 4, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'SIX', label: 'Six', icon: '6️⃣', category: 'scoring', points: 6, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'WICKET', label: 'Wicket', icon: '🎯', category: 'scoring', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'CAUGHT', label: 'Caught', icon: '🧤', category: 'defensive', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
      { key: 'BOWLED', label: 'Bowled', icon: '🎳', category: 'defensive', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'LBW', label: 'LBW', icon: '🦵', category: 'defensive', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'RUN_OUT', label: 'Run Out', icon: '🏃', category: 'defensive', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'STUMPED', label: 'Stumped', icon: '🧤', category: 'defensive', color: 'text-teal-600', bgColor: 'bg-teal-100' },
      { key: 'WIDE', label: 'Wide', icon: '↔️', category: 'other', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'NO_BALL', label: 'No Ball', icon: '🚫', category: 'other', color: 'text-red-600', bgColor: 'bg-red-100' },
    ],
    scoringEvents: ['BOUNDARY', 'SIX'],
    disciplinaryEvents: [],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Ground',
    },
  },

  // =========================================================================
  // BASKETBALL
  // =========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    name: 'Basketball',
    shortName: 'Basketball',
    icon: '🏀',
    primaryColor: '#EF4444',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Two-Pointer', namePlural: 'Two-Pointers', points: 2, icon: '🏀', color: 'text-green-600' },
      { name: 'Three-Pointer', namePlural: 'Three-Pointers', points: 3, icon: '3️⃣', color: 'text-purple-600' },
      { name: 'Free Throw', namePlural: 'Free Throws', points: 1, icon: '🎯', color: 'text-blue-600' },
    ],
    primaryScoringUnit: { name: 'Point', namePlural: 'Points', points: 1, icon: '🏀', color: 'text-red-600' },
    hasDraws: false,
    periods: {
      name: 'Quarter',
      namePlural: 'Quarters',
      count: 4,
      durationMinutes: 12,
      hasOvertime: true,
      overtimeName: 'Overtime',
      hasShootout: false,
    },
    positionCategories: [
      { key: 'guards', name: 'Guards', color: '#3B82F6', order: 1 },
      { key: 'forwards', name: 'Forwards', color: '#22C55E', order: 2 },
      { key: 'center', name: 'Center', color: '#EF4444', order: 3 },
    ],
    eventTypes: [
      { key: 'TWO_POINTER', label: '2-Point FG', icon: '🏀', category: 'scoring', points: 2, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'THREE_POINTER', label: '3-Point FG', icon: '3️⃣', category: 'scoring', points: 3, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'FREE_THROW_MADE', label: 'Free Throw', icon: '🎯', category: 'scoring', points: 1, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'DUNK', label: 'Dunk', icon: '💥', category: 'scoring', points: 2, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      { key: 'BLOCK', label: 'Block', icon: '✋', category: 'defensive', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
      { key: 'STEAL', label: 'Steal', icon: '🏃', category: 'defensive', color: 'text-teal-600', bgColor: 'bg-teal-100' },
      { key: 'OFFENSIVE_FOUL', label: 'Offensive Foul', icon: '⚠️', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'DEFENSIVE_FOUL', label: 'Defensive Foul', icon: '⚠️', category: 'disciplinary', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'TIMEOUT', label: 'Timeout', icon: '⏸️', category: 'time', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
    ],
    scoringEvents: ['TWO_POINTER', 'THREE_POINTER', 'FREE_THROW_MADE', 'DUNK'],
    disciplinaryEvents: ['OFFENSIVE_FOUL', 'DEFENSIVE_FOUL'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Game',
      matchPlural: 'Games',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Arena',
    },
  },

  // =========================================================================
  // AMERICAN FOOTBALL
  // =========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    name: 'American Football',
    shortName: 'Am. Football',
    icon: '🏈',
    primaryColor: '#6366F1',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Touchdown', namePlural: 'Touchdowns', points: 6, icon: '🏈', color: 'text-green-600' },
      { name: 'Extra Point', namePlural: 'Extra Points', points: 1, icon: '➕', color: 'text-blue-600' },
      { name: '2-Point Conversion', namePlural: '2-Point Conversions', points: 2, icon: '2️⃣', color: 'text-purple-600' },
      { name: 'Field Goal', namePlural: 'Field Goals', points: 3, icon: '🥅', color: 'text-amber-600' },
      { name: 'Safety', namePlural: 'Safeties', points: 2, icon: '⚠️', color: 'text-teal-600' },
    ],
    primaryScoringUnit: { name: 'Point', namePlural: 'Points', points: 1, icon: '🏈', color: 'text-indigo-600' },
    hasDraws: false,
    periods: {
      name: 'Quarter',
      namePlural: 'Quarters',
      count: 4,
      durationMinutes: 15,
      hasOvertime: true,
      overtimeName: 'Overtime',
      hasShootout: false,
    },
    positionCategories: [
      { key: 'offense', name: 'Offense', color: '#22C55E', order: 1 },
      { key: 'defense', name: 'Defense', color: '#EF4444', order: 2 },
      { key: 'special_teams', name: 'Special Teams', color: '#3B82F6', order: 3 },
    ],
    eventTypes: [
      { key: 'TOUCHDOWN', label: 'Touchdown', icon: '🏈', category: 'scoring', points: 6, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'EXTRA_POINT', label: 'Extra Point', icon: '➕', category: 'scoring', points: 1, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'TWO_POINT_CONVERSION', label: '2-Point Conversion', icon: '2️⃣', category: 'scoring', points: 2, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'FIELD_GOAL', label: 'Field Goal', icon: '🥅', category: 'scoring', points: 3, color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'SAFETY_SCORE', label: 'Safety', icon: '⚠️', category: 'scoring', points: 2, color: 'text-teal-600', bgColor: 'bg-teal-100' },
      { key: 'INTERCEPTION', label: 'Interception', icon: '🤚', category: 'defensive', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'FUMBLE', label: 'Fumble', icon: '🔄', category: 'other', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'SACK', label: 'Sack', icon: '💥', category: 'defensive', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    ],
    scoringEvents: ['TOUCHDOWN', 'EXTRA_POINT', 'TWO_POINT_CONVERSION', 'FIELD_GOAL', 'SAFETY_SCORE'],
    disciplinaryEvents: [],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Game',
      matchPlural: 'Games',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Stadium',
    },
  },

  // =========================================================================
  // NETBALL
  // =========================================================================
  NETBALL: {
    sport: 'NETBALL',
    name: 'Netball',
    shortName: 'Netball',
    icon: '🏐',
    primaryColor: '#EC4899',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 1, icon: '🥅', color: 'text-green-600' },
      { name: 'Super Shot', namePlural: 'Super Shots', points: 2, icon: '⭐', color: 'text-purple-600' },
    ],
    primaryScoringUnit: { name: 'Goal', namePlural: 'Goals', points: 1, icon: '🏐', color: 'text-pink-600' },
    hasDraws: true,
    periods: {
      name: 'Quarter',
      namePlural: 'Quarters',
      count: 4,
      durationMinutes: 15,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: false,
    },
    positionCategories: [
      { key: 'shooters', name: 'Shooters', color: '#EF4444', order: 1 },
      { key: 'centre_court', name: 'Centre Court', color: '#22C55E', order: 2 },
      { key: 'defenders', name: 'Defenders', color: '#3B82F6', order: 3 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal', icon: '🥅', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'SUPER_SHOT', label: 'Super Shot (2pts)', icon: '⭐', category: 'scoring', points: 2, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'INTERCEPT', label: 'Intercept', icon: '🤚', category: 'defensive', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'REBOUND', label: 'Rebound', icon: '🔄', category: 'defensive', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'CENTER_PASS', label: 'Centre Pass', icon: '🎯', category: 'other', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
      { key: 'OBSTRUCTION', label: 'Obstruction', icon: '🚫', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'CONTACT', label: 'Contact', icon: '⚠️', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    ],
    scoringEvents: ['GOAL', 'SUPER_SHOT'],
    disciplinaryEvents: ['OBSTRUCTION', 'CONTACT'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Court',
    },
  },

  // =========================================================================
  // HOCKEY (FIELD HOCKEY)
  // =========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    name: 'Field Hockey',
    shortName: 'Hockey',
    icon: '🏑',
    primaryColor: '#06B6D4',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 1, icon: '🥅', color: 'text-green-600' },
    ],
    primaryScoringUnit: { name: 'Goal', namePlural: 'Goals', points: 1, icon: '🏑', color: 'text-cyan-600' },
    hasDraws: true,
    periods: {
      name: 'Quarter',
      namePlural: 'Quarters',
      count: 4,
      durationMinutes: 15,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: true,
      shootoutName: 'Shootout',
    },
    positionCategories: [
      { key: 'goalkeeper', name: 'Goalkeeper', color: '#F59E0B', order: 1 },
      { key: 'defense', name: 'Defense', color: '#3B82F6', order: 2 },
      { key: 'midfield', name: 'Midfield', color: '#22C55E', order: 3 },
      { key: 'attack', name: 'Attack', color: '#EF4444', order: 4 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal', icon: '🥅', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'PENALTY_CORNER', label: 'Penalty Corner', icon: '🚩', category: 'set_piece', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'PENALTY_STROKE', label: 'Penalty Stroke', icon: '⚠️', category: 'set_piece', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'GREEN_CARD', label: 'Green Card', icon: '🟩', category: 'disciplinary', color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'disciplinary', color: 'text-red-600', bgColor: 'bg-red-100' },
    ],
    scoringEvents: ['GOAL'],
    disciplinaryEvents: ['GREEN_CARD', 'YELLOW_CARD', 'RED_CARD'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Pitch',
    },
  },

  // =========================================================================
  // LACROSSE
  // =========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    name: 'Lacrosse',
    shortName: 'Lacrosse',
    icon: '🥍',
    primaryColor: '#14B8A6',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 1, icon: '🥍', color: 'text-green-600' },
      { name: 'Two-Point Goal', namePlural: 'Two-Point Goals', points: 2, icon: '2️⃣', color: 'text-purple-600' },
    ],
    primaryScoringUnit: { name: 'Goal', namePlural: 'Goals', points: 1, icon: '🥍', color: 'text-teal-600' },
    hasDraws: false,
    periods: {
      name: 'Quarter',
      namePlural: 'Quarters',
      count: 4,
      durationMinutes: 15,
      hasOvertime: true,
      overtimeName: 'Overtime',
      hasShootout: false,
    },
    positionCategories: [
      { key: 'goalkeeper', name: 'Goalkeeper', color: '#F59E0B', order: 1 },
      { key: 'defense', name: 'Defense', color: '#3B82F6', order: 2 },
      { key: 'midfield', name: 'Midfield', color: '#22C55E', order: 3 },
      { key: 'attack', name: 'Attack', color: '#EF4444', order: 4 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal', icon: '🥍', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'TWO_POINT_GOAL', label: '2-Point Goal', icon: '2️⃣', category: 'scoring', points: 2, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'FACE_OFF_WIN', label: 'Face-Off Win', icon: '🤼', category: 'other', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
      { key: 'GROUND_BALL', label: 'Ground Ball', icon: '⚫', category: 'other', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'MAN_UP_GOAL', label: 'Man-Up Goal', icon: '⬆️', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
    ],
    scoringEvents: ['GOAL', 'TWO_POINT_GOAL', 'MAN_UP_GOAL'],
    disciplinaryEvents: [],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Game',
      matchPlural: 'Games',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Field',
    },
  },

  // =========================================================================
  // AUSTRALIAN RULES FOOTBALL (AFL)
  // =========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    name: 'Australian Rules Football',
    shortName: 'AFL',
    icon: '🏉',
    primaryColor: '#F97316',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 6, icon: '🥅', color: 'text-green-600' },
      { name: 'Behind', namePlural: 'Behinds', points: 1, icon: '🎯', color: 'text-blue-600' },
    ],
    primaryScoringUnit: { name: 'Point', namePlural: 'Points', points: 1, icon: '🏉', color: 'text-orange-600' },
    hasDraws: true,
    periods: {
      name: 'Quarter',
      namePlural: 'Quarters',
      count: 4,
      durationMinutes: 20,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: false,
    },
    positionCategories: [
      { key: 'key_position', name: 'Key Position', color: '#EF4444', order: 1 },
      { key: 'general', name: 'General', color: '#22C55E', order: 2 },
      { key: 'ruck', name: 'Ruck', color: '#3B82F6', order: 3 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal (6 pts)', icon: '🥅', category: 'scoring', points: 6, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'BEHIND', label: 'Behind (1 pt)', icon: '🎯', category: 'scoring', points: 1, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'RUSHED_BEHIND', label: 'Rushed Behind', icon: '↩️', category: 'scoring', points: 1, color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { key: 'MARK', label: 'Mark', icon: '🙌', category: 'other', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'HANDBALL', label: 'Handball', icon: '✋', category: 'other', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    ],
    scoringEvents: ['GOAL', 'BEHIND', 'RUSHED_BEHIND'],
    disciplinaryEvents: [],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Club',
      teamPlural: 'Clubs',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Senior Coach',
      venue: 'Ground',
    },
  },

  // =========================================================================
  // GAELIC FOOTBALL
  // =========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    name: 'Gaelic Football',
    shortName: 'GAA Football',
    icon: '🏐',
    primaryColor: '#84CC16',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 3, icon: '🥅', color: 'text-green-600' },
      { name: 'Point', namePlural: 'Points', points: 1, icon: '🎯', color: 'text-blue-600' },
    ],
    primaryScoringUnit: { name: 'Score', namePlural: 'Scores', points: 1, icon: '🏐', color: 'text-lime-600' },
    hasDraws: true,
    periods: {
      name: 'Half',
      namePlural: 'Halves',
      count: 2,
      durationMinutes: 35,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: false,
    },
    positionCategories: [
      { key: 'goalkeeper', name: 'Goalkeeper', color: '#F59E0B', order: 1 },
      { key: 'backs', name: 'Backs', color: '#3B82F6', order: 2 },
      { key: 'midfield', name: 'Midfield', color: '#22C55E', order: 3 },
      { key: 'forwards', name: 'Forwards', color: '#EF4444', order: 4 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal (3 pts)', icon: '🥅', category: 'scoring', points: 3, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'POINT', label: 'Point (1 pt)', icon: '🎯', category: 'scoring', points: 1, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { key: 'WIDE', label: 'Wide', icon: '↔️', category: 'other', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
      { key: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'BLACK_CARD', label: 'Black Card', icon: '⬛', category: 'disciplinary', color: 'text-neutral-600', bgColor: 'bg-neutral-800' },
      { key: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'disciplinary', color: 'text-red-600', bgColor: 'bg-red-100' },
    ],
    scoringEvents: ['GOAL', 'POINT'],
    disciplinaryEvents: ['YELLOW_CARD', 'BLACK_CARD', 'RED_CARD'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Manager',
      venue: 'Ground',
    },
  },

  // =========================================================================
  // FUTSAL
  // =========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    name: 'Futsal',
    shortName: 'Futsal',
    icon: '⚽',
    primaryColor: '#10B981',
    secondaryColor: '#FFFFFF',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 1, icon: '⚽', color: 'text-green-600' },
    ],
    primaryScoringUnit: { name: 'Goal', namePlural: 'Goals', points: 1, icon: '⚽', color: 'text-emerald-600' },
    hasDraws: true,
    periods: {
      name: 'Half',
      namePlural: 'Halves',
      count: 2,
      durationMinutes: 20,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: true,
      shootoutName: 'Penalty Shootout',
    },
    positionCategories: [
      { key: 'goleiro', name: 'Goleiro', color: '#F59E0B', order: 1 },
      { key: 'fixo', name: 'Fixo/Beque', color: '#3B82F6', order: 2 },
      { key: 'ala', name: 'Ala', color: '#22C55E', order: 3 },
      { key: 'pivo', name: 'Pivô', color: '#EF4444', order: 4 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal', icon: '⚽', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'ACCUMULATED_FOUL', label: 'Accumulated Foul (6th+)', icon: '🔴', category: 'set_piece', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'DOUBLE_PENALTY', label: 'Double Penalty (10m)', icon: '⚠️', category: 'set_piece', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'disciplinary', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'POWER_PLAY', label: 'Power Play (5v4)', icon: '⬆️', category: 'other', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    ],
    scoringEvents: ['GOAL'],
    disciplinaryEvents: ['YELLOW_CARD', 'RED_CARD'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Técnico',
      venue: 'Court',
    },
  },

  // =========================================================================
  // BEACH FOOTBALL (BEACH SOCCER)
  // =========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    name: 'Beach Soccer',
    shortName: 'Beach Soccer',
    icon: '🏖️',
    primaryColor: '#FBBF24',
    secondaryColor: '#06B6D4',
    scoringUnits: [
      { name: 'Goal', namePlural: 'Goals', points: 1, icon: '⚽', color: 'text-green-600' },
    ],
    primaryScoringUnit: { name: 'Goal', namePlural: 'Goals', points: 1, icon: '🏖️', color: 'text-amber-600' },
    hasDraws: false,
    periods: {
      name: 'Period',
      namePlural: 'Periods',
      count: 3,
      durationMinutes: 12,
      hasOvertime: true,
      overtimeName: 'Extra Time',
      hasShootout: true,
      shootoutName: 'Penalty Shootout',
    },
    positionCategories: [
      { key: 'goalkeeper', name: 'Goalkeeper', color: '#F59E0B', order: 1 },
      { key: 'defense', name: 'Defense', color: '#3B82F6', order: 2 },
      { key: 'attack', name: 'Attack', color: '#EF4444', order: 3 },
    ],
    eventTypes: [
      { key: 'GOAL', label: 'Goal', icon: '⚽', category: 'scoring', points: 1, color: 'text-green-600', bgColor: 'bg-green-100' },
      { key: 'BICYCLE_KICK_GOAL', label: 'Bicycle Kick Goal', icon: '🚴', category: 'scoring', points: 1, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { key: 'SCISSOR_KICK_GOAL', label: 'Scissor Kick Goal', icon: '✂️', category: 'scoring', points: 1, color: 'text-pink-600', bgColor: 'bg-pink-100' },
      { key: 'GOALKEEPER_GOAL', label: 'Goalkeeper Goal', icon: '🧤⚽', category: 'scoring', points: 1, color: 'text-teal-600', bgColor: 'bg-teal-100' },
      { key: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'disciplinary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      { key: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'disciplinary', color: 'text-red-600', bgColor: 'bg-red-100' },
      { key: 'BLUE_CARD', label: 'Blue Card (2min)', icon: '🟦', category: 'disciplinary', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    ],
    scoringEvents: ['GOAL', 'BICYCLE_KICK_GOAL', 'SCISSOR_KICK_GOAL', 'GOALKEEPER_GOAL'],
    disciplinaryEvents: ['YELLOW_CARD', 'RED_CARD', 'BLUE_CARD'],
    liveStatuses: LIVE_STATUSES,
    finishedStatuses: FINISHED_STATUSES,
    terms: {
      match: 'Match',
      matchPlural: 'Matches',
      team: 'Team',
      teamPlural: 'Teams',
      player: 'Player',
      playerPlural: 'Players',
      coach: 'Head Coach',
      venue: 'Arena',
    },
  },
};

// =============================================================================
// CONTEXT & PROVIDER
// =============================================================================

interface SportConfigContextType {
  sport: Sport;
  config: SportConfig;
  setSport: (sport: Sport) => void;
  isValidSport: (value: unknown) => value is Sport;
  getSportConfig: (sport: Sport) => SportConfig;
  getAllSports: () => Sport[];
  getEventIcon: (eventType: string) => string;
  getEventLabel: (eventType: string) => string;
  getEventPoints: (eventType: string) => number;
  isScoringEvent: (eventType: string) => boolean;
  isDisciplinaryEvent: (eventType: string) => boolean;
  isLiveStatus: (status: MatchStatus) => boolean;
  isFinishedStatus: (status: MatchStatus) => boolean;
  getPeriodName: (periodNumber: number) => string;
  formatScore: (homeScore: number, awayScore: number) => string;
}

const SportConfigContext = createContext<SportConfigContextType | null>(null);

interface SportConfigProviderProps {
  children: ReactNode;
  defaultSport?: Sport;
}

export function SportConfigProvider({ 
  children, 
  defaultSport = 'FOOTBALL' 
}: SportConfigProviderProps) {
  const [sport, setSportState] = React.useState<Sport>(defaultSport);

  const config = useMemo(() => SPORT_CONFIGS[sport], [sport]);

  const setSport = useCallback((newSport: Sport) => {
    const result = SportEnum.safeParse(newSport);
    if (result.success) {
      setSportState(result.data);
    }
  }, []);

  const isValidSport = useCallback((value: unknown): value is Sport => {
    return SportEnum.safeParse(value).success;
  }, []);

  const getSportConfig = useCallback((sportKey: Sport): SportConfig => {
    return SPORT_CONFIGS[sportKey];
  }, []);

  const getAllSports = useCallback((): Sport[] => {
    return Object.keys(SPORT_CONFIGS) as Sport[];
  }, []);

  const getEventIcon = useCallback((eventType: string): string => {
    const event = config.eventTypes.find(e => e.key === eventType);
    return event?.icon || '📌';
  }, [config]);

  const getEventLabel = useCallback((eventType: string): string => {
    const event = config.eventTypes.find(e => e.key === eventType);
    return event?.label || eventType;
  }, [config]);

  const getEventPoints = useCallback((eventType: string): number => {
    const event = config.eventTypes.find(e => e.key === eventType);
    return event?.points || 0;
  }, [config]);

  const isScoringEvent = useCallback((eventType: string): boolean => {
    return config.scoringEvents.includes(eventType);
  }, [config]);

  const isDisciplinaryEvent = useCallback((eventType: string): boolean => {
    return config.disciplinaryEvents.includes(eventType);
  }, [config]);

  const isLiveStatus = useCallback((status: MatchStatus): boolean => {
    return config.liveStatuses.includes(status);
  }, [config]);

  const isFinishedStatus = useCallback((status: MatchStatus): boolean => {
    return config.finishedStatuses.includes(status);
  }, [config]);

  const getPeriodName = useCallback((periodNumber: number): string => {
    const { name, count } = config.periods;
    if (periodNumber <= 0) return 'Pre-Match';
    if (periodNumber > count) return 'Extra Time';
    
    if (count === 2) {
      return periodNumber === 1 ? `1st ${name}` : `2nd ${name}`;
    }
    
    const suffix = ['st', 'nd', 'rd', 'th'][Math.min(periodNumber - 1, 3)];
    return `${periodNumber}${suffix} ${name}`;
  }, [config]);

  const formatScore = useCallback((homeScore: number, awayScore: number): string => {
    // For sports with compound scoring (AFL, Gaelic), format appropriately
    if (sport === 'AUSTRALIAN_RULES') {
      // AFL shows goals.behinds (total)
      return `${homeScore} - ${awayScore}`;
    }
    if (sport === 'GAELIC_FOOTBALL') {
      // Gaelic shows goals-points format
      return `${homeScore} - ${awayScore}`;
    }
    return `${homeScore} - ${awayScore}`;
  }, [sport]);

  const value: SportConfigContextType = useMemo(() => ({
    sport,
    config,
    setSport,
    isValidSport,
    getSportConfig,
    getAllSports,
    getEventIcon,
    getEventLabel,
    getEventPoints,
    isScoringEvent,
    isDisciplinaryEvent,
    isLiveStatus,
    isFinishedStatus,
    getPeriodName,
    formatScore,
  }), [
    sport,
    config,
    setSport,
    isValidSport,
    getSportConfig,
    getAllSports,
    getEventIcon,
    getEventLabel,
    getEventPoints,
    isScoringEvent,
    isDisciplinaryEvent,
    isLiveStatus,
    isFinishedStatus,
    getPeriodName,
    formatScore,
  ]);

  return (
    <SportConfigContext.Provider value={value}>
      {children}
    </SportConfigContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access sport configuration and utilities
 * Must be used within SportConfigProvider
 */
export function useSportConfig(): SportConfigContextType {
  const context = useContext(SportConfigContext);
  
  if (!context) {
    throw new Error('useSportConfig must be used within SportConfigProvider');
  }
  
  return context;
}

// =============================================================================
// STANDALONE UTILITIES (No context required)
// =============================================================================

/**
 * Get sport configuration without context
 */
export function getSportConfig(sport: Sport): SportConfig {
  const result = SportEnum.safeParse(sport);
  if (!result.success) {
    throw new Error(`Invalid sport: ${sport}`);
  }
  return SPORT_CONFIGS[result.data];
}

/**
 * Get all available sports
 */
export function getAllSports(): Sport[] {
  return Object.keys(SPORT_CONFIGS) as Sport[];
}

/**
 * Check if a value is a valid sport
 */
export function isValidSport(value: unknown): value is Sport {
  return SportEnum.safeParse(value).success;
}

/**
 * Get sport icon
 */
export function getSportIcon(sport: Sport): string {
  return SPORT_CONFIGS[sport]?.icon || '🏆';
}

/**
 * Get sport name
 */
export function getSportName(sport: Sport): string {
  return SPORT_CONFIGS[sport]?.name || sport;
}

// =============================================================================
// REACT IMPORT FIX
// =============================================================================

import React from 'react';

// =============================================================================
// EXPORTS
// =============================================================================

export { SPORT_CONFIGS };
export default useSportConfig;
