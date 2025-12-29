// ============================================================================
// 🏆 PITCHCONNECT - SPORT CONFIGURATION UTILITY v2.0.0
// ============================================================================
// Multi-sport configuration for:
// - Positions & Formations
// - Match Events & Scoring
// - Training Categories (Sport-Specific)
// - Metrics & Analytics
// - Squad Rules & Configurations
// 
// Schema v7.3.0 aligned
// Supports 12 Sports: Football, Netball, Rugby, Cricket, American Football,
//                     Basketball, Hockey, Lacrosse, Australian Rules,
//                     Gaelic Football, Futsal, Beach Football
// ============================================================================

import {
  Sport,
  Position,
  MatchEventType,
  TrainingCategory,
  TrainingIntensity,
  FormationType,
} from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SportConfig {
  name: string;
  shortName: string;
  icon: string;
  emoji: string;
  
  // Squad configuration
  squadSize: number;
  maxSubstitutes: number;
  minPlayers: number;
  benchSize: number;
  
  // Positions
  positions: Position[];
  defaultFormation?: FormationType;
  formations: FormationConfig[];
  
  // Events
  eventTypes: MatchEventType[];
  scoringEvents: ScoringEventConfig[];
  disciplinaryEvents: MatchEventType[];
  
  // Match configuration
  periodCount: number;
  periodDuration: number; // minutes
  hasExtraTime: boolean;
  hasPenalties: boolean;
  hasOvertimes: boolean;
  
  // Training
  trainingCategories: TrainingCategoryConfig[];
  customTrainingCategories: string[];
  commonInjuryPatterns: string[];
  
  // Metrics
  metrics: MetricConfig[];
  primaryScoreLabel: string;
  secondaryScoreLabel?: string;
}

export interface FormationConfig {
  id: string;
  name: string;
  type?: FormationType;
  positions: { position: Position; x: number; y: number; label?: string }[];
  description?: string;
}

export interface ScoringEventConfig {
  event: MatchEventType;
  points: number;
  label: string;
}

export interface TrainingCategoryConfig {
  category: TrainingCategory | 'CUSTOM';
  customKey?: string;
  label: string;
  description: string;
  icon: string;
  suggestedDuration: number; // minutes
  suggestedIntensity: TrainingIntensity;
  drillExamples: string[];
  equipment: string[];
  focusAreas: string[];
}

export interface MetricConfig {
  key: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  category: 'scoring' | 'assists' | 'defensive' | 'disciplinary' | 'other' | 'sport_specific';
  unit?: string;
  higherIsBetter: boolean;
}

// ============================================================================
// POSITION MAPPINGS BY SPORT
// ============================================================================

export const SPORT_POSITIONS: Record<Sport, Position[]> = {
  FOOTBALL: [
    'GOALKEEPER',
    'LEFT_BACK',
    'CENTER_BACK',
    'RIGHT_BACK',
    'LEFT_WING_BACK',
    'RIGHT_WING_BACK',
    'DEFENSIVE_MIDFIELDER',
    'CENTRAL_MIDFIELDER',
    'LEFT_MIDFIELDER',
    'RIGHT_MIDFIELDER',
    'ATTACKING_MIDFIELDER',
    'LEFT_WINGER',
    'RIGHT_WINGER',
    'STRIKER',
    'CENTER_FORWARD',
    'SECOND_STRIKER',
  ] as Position[],

  NETBALL: [
    'GOAL_SHOOTER',
    'GOAL_ATTACK',
    'WING_ATTACK',
    'CENTER',
    'WING_DEFENSE',
    'GOAL_DEFENSE',
    'GOALKEEPER_NETBALL',
  ] as Position[],

  RUGBY: [
    'PROP',
    'HOOKER',
    'LOCK',
    'FLANKER',
    'NUMBER_8',
    'SCRUM_HALF',
    'FLY_HALF',
    'INSIDE_CENTER',
    'OUTSIDE_CENTER',
    'LEFT_WINGER',
    'RIGHT_WINGER',
    'FULLBACK',
  ] as Position[],

  CRICKET: [
    'BATSMAN',
    'BOWLER',
    'ALL_ROUNDER',
    'WICKET_KEEPER',
    'FIELDER',
  ] as Position[],

  AMERICAN_FOOTBALL: [
    'QUARTERBACK',
    'RUNNING_BACK',
    'WIDE_RECEIVER',
    'TIGHT_END',
    'LEFT_TACKLE',
    'LEFT_GUARD',
    'CENTER_POSITION',
    'RIGHT_GUARD',
    'RIGHT_TACKLE',
    'LINEBACKER',
    'DEFENSIVE_END',
    'DEFENSIVE_TACKLE',
    'SAFETY',
    'CORNERBACK',
    'PUNTER',
    'KICKER',
  ] as Position[],

  BASKETBALL: [
    'POINT_GUARD',
    'SHOOTING_GUARD',
    'SMALL_FORWARD',
    'POWER_FORWARD',
    'CENTER_BASKETBALL',
  ] as Position[],

  HOCKEY: [
    'GOALTENDER',
    'DEFENSEMAN',
    'CENTER_HOCKEY',
    'WINGER',
  ] as Position[],

  LACROSSE: [
    'GOALKEEPER',
    'DEFENSEMAN',
    'CENTRAL_MIDFIELDER',
    'ATTACKING_MIDFIELDER',
    'STRIKER',
  ] as Position[],

  AUSTRALIAN_RULES: [
    'FULLBACK',
    'CENTER_BACK',
    'CENTER_FORWARD',
    'WINGER',
    'CENTRAL_MIDFIELDER',
    'UTILITY',
  ] as Position[],

  GAELIC_FOOTBALL: [
    'GOALKEEPER',
    'FULLBACK',
    'CENTER_BACK',
    'CENTER_FORWARD',
    'CENTRAL_MIDFIELDER',
    'UTILITY',
  ] as Position[],

  FUTSAL: [
    'GOALKEEPER',
    'DEFENDER',
    'WINGER',
    'STRIKER',
    'UTILITY',
  ] as Position[],

  BEACH_FOOTBALL: [
    'GOALKEEPER',
    'DEFENDER',
    'WINGER',
    'STRIKER',
  ] as Position[],
};

// ============================================================================
// SQUAD CONFIGURATION BY SPORT
// ============================================================================

export const SPORT_SQUAD_CONFIG: Record<Sport, {
  startingSize: number;
  maxSubstitutes: number;
  totalSquad: number;
  minPlayers: number;
  benchSize: number;
}> = {
  FOOTBALL: { startingSize: 11, maxSubstitutes: 7, totalSquad: 18, minPlayers: 7, benchSize: 7 },
  NETBALL: { startingSize: 7, maxSubstitutes: 5, totalSquad: 12, minPlayers: 7, benchSize: 5 },
  RUGBY: { startingSize: 15, maxSubstitutes: 8, totalSquad: 23, minPlayers: 13, benchSize: 8 },
  CRICKET: { startingSize: 11, maxSubstitutes: 4, totalSquad: 15, minPlayers: 11, benchSize: 4 },
  AMERICAN_FOOTBALL: { startingSize: 11, maxSubstitutes: 42, totalSquad: 53, minPlayers: 11, benchSize: 42 },
  BASKETBALL: { startingSize: 5, maxSubstitutes: 7, totalSquad: 12, minPlayers: 5, benchSize: 7 },
  HOCKEY: { startingSize: 6, maxSubstitutes: 14, totalSquad: 20, minPlayers: 6, benchSize: 14 },
  LACROSSE: { startingSize: 10, maxSubstitutes: 13, totalSquad: 23, minPlayers: 10, benchSize: 13 },
  AUSTRALIAN_RULES: { startingSize: 18, maxSubstitutes: 4, totalSquad: 22, minPlayers: 14, benchSize: 4 },
  GAELIC_FOOTBALL: { startingSize: 15, maxSubstitutes: 6, totalSquad: 21, minPlayers: 13, benchSize: 6 },
  FUTSAL: { startingSize: 5, maxSubstitutes: 9, totalSquad: 14, minPlayers: 3, benchSize: 9 },
  BEACH_FOOTBALL: { startingSize: 5, maxSubstitutes: 3, totalSquad: 8, minPlayers: 4, benchSize: 3 },
};

// ============================================================================
// MATCH EVENT TYPES BY SPORT
// ============================================================================

export const SPORT_EVENT_TYPES: Record<Sport, MatchEventType[]> = {
  FOOTBALL: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PENALTY_SCORED', 'PENALTY_MISSED',
    'PENALTY_SAVED', 'OWN_GOAL', 'VAR_REVIEW', 'VAR_DECISION', 'INJURY',
    'OFFSIDE', 'KICKOFF', 'HALFTIME', 'FULLTIME',
  ] as MatchEventType[],

  NETBALL: [
    'GOAL', 'ASSIST', 'CENTER_PASS', 'OBSTRUCTION', 'INTERCEPT',
    'REBOUND', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT',
    'INJURY', 'YELLOW_CARD', 'RED_CARD',
  ] as MatchEventType[],

  RUGBY: [
    'TRY', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL', 'YELLOW_CARD_RUGBY',
    'RED_CARD_RUGBY', 'SIN_BIN', 'SCRUM', 'LINEOUT', 'MAUL', 'RUCK',
    'KNOCK_ON', 'HIGH_TACKLE', 'OFFSIDE', 'SUBSTITUTION_ON', 'SUBSTITUTION_OFF',
    'INJURY', 'HALFTIME', 'FULLTIME',
  ] as MatchEventType[],

  CRICKET: [
    'WICKET', 'BOUNDARY', 'SIX', 'MAIDEN_OVER', 'WIDE', 'NO_BALL',
    'BYE', 'LEG_BYE', 'OVERTHROW', 'RUN_OUT', 'CAUGHT', 'BOWLED',
    'LBW', 'STUMPED', 'INJURY',
  ] as MatchEventType[],

  AMERICAN_FOOTBALL: [
    'TOUCHDOWN', 'FIELD_GOAL', 'SAFETY_SCORE', 'EXTRA_POINT', 'TWO_POINT_CONVERSION',
    'INTERCEPTION', 'FUMBLE', 'SACK', 'PUNT', 'KICKOFF_RETURN',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT', 'INJURY',
    'YELLOW_CARD', 'RED_CARD',
  ] as MatchEventType[],

  BASKETBALL: [
    'TWO_POINTER', 'THREE_POINTER', 'FREE_THROW_MADE', 'FREE_THROW_MISSED',
    'ASSIST', 'BLOCK', 'STEAL', 'REBOUND', 'TURNOVER', 'DUNK', 'ALLEY_OOP',
    'OFFENSIVE_FOUL', 'DEFENSIVE_FOUL', 'TRAVEL', 'DOUBLE_DRIBBLE',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT', 'INJURY',
  ] as MatchEventType[],

  HOCKEY: [
    'GOAL', 'ASSIST', 'MINOR_PENALTY', 'MAJOR_PENALTY', 'FIGHT',
    'POWER_PLAY_GOAL', 'SHORTHANDED_GOAL', 'EMPTY_NET_GOAL', 'HAT_TRICK',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'INJURY', 'TIMEOUT',
  ] as MatchEventType[],

  LACROSSE: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'TURNOVER',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'TIMEOUT', 'INJURY',
  ] as MatchEventType[],

  AUSTRALIAN_RULES: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'INJURY',
  ] as MatchEventType[],

  GAELIC_FOOTBALL: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'INJURY',
  ] as MatchEventType[],

  FUTSAL: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PENALTY_SCORED', 'PENALTY_MISSED',
    'OWN_GOAL', 'INJURY', 'TIMEOUT',
  ] as MatchEventType[],

  BEACH_FOOTBALL: [
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
    'SUBSTITUTION_ON', 'SUBSTITUTION_OFF', 'PENALTY_SCORED', 'PENALTY_MISSED',
    'OWN_GOAL', 'INJURY',
  ] as MatchEventType[],
};

// ============================================================================
// SCORING EVENTS BY SPORT
// ============================================================================

export const SPORT_SCORING_EVENTS: Record<Sport, ScoringEventConfig[]> = {
  FOOTBALL: [
    { event: 'GOAL' as MatchEventType, points: 1, label: 'Goal' },
    { event: 'PENALTY_SCORED' as MatchEventType, points: 1, label: 'Penalty Goal' },
    { event: 'OWN_GOAL' as MatchEventType, points: 1, label: 'Own Goal (opponent)' },
  ],
  NETBALL: [
    { event: 'GOAL' as MatchEventType, points: 1, label: 'Goal' },
  ],
  RUGBY: [
    { event: 'TRY' as MatchEventType, points: 5, label: 'Try' },
    { event: 'CONVERSION' as MatchEventType, points: 2, label: 'Conversion' },
    { event: 'PENALTY_GOAL' as MatchEventType, points: 3, label: 'Penalty Goal' },
    { event: 'DROP_GOAL' as MatchEventType, points: 3, label: 'Drop Goal' },
  ],
  CRICKET: [
    { event: 'BOUNDARY' as MatchEventType, points: 4, label: 'Boundary (4)' },
    { event: 'SIX' as MatchEventType, points: 6, label: 'Six' },
  ],
  AMERICAN_FOOTBALL: [
    { event: 'TOUCHDOWN' as MatchEventType, points: 6, label: 'Touchdown' },
    { event: 'EXTRA_POINT' as MatchEventType, points: 1, label: 'Extra Point' },
    { event: 'TWO_POINT_CONVERSION' as MatchEventType, points: 2, label: 'Two-Point Conversion' },
    { event: 'FIELD_GOAL' as MatchEventType, points: 3, label: 'Field Goal' },
    { event: 'SAFETY_SCORE' as MatchEventType, points: 2, label: 'Safety' },
  ],
  BASKETBALL: [
    { event: 'TWO_POINTER' as MatchEventType, points: 2, label: '2-Point Field Goal' },
    { event: 'THREE_POINTER' as MatchEventType, points: 3, label: '3-Point Field Goal' },
    { event: 'FREE_THROW_MADE' as MatchEventType, points: 1, label: 'Free Throw' },
    { event: 'DUNK' as MatchEventType, points: 2, label: 'Dunk' },
    { event: 'ALLEY_OOP' as MatchEventType, points: 2, label: 'Alley-Oop' },
  ],
  HOCKEY: [
    { event: 'GOAL' as MatchEventType, points: 1, label: 'Goal' },
    { event: 'POWER_PLAY_GOAL' as MatchEventType, points: 1, label: 'Power Play Goal' },
    { event: 'SHORTHANDED_GOAL' as MatchEventType, points: 1, label: 'Shorthanded Goal' },
    { event: 'EMPTY_NET_GOAL' as MatchEventType, points: 1, label: 'Empty Net Goal' },
  ],
  LACROSSE: [
    { event: 'GOAL' as MatchEventType, points: 1, label: 'Goal' },
  ],
  AUSTRALIAN_RULES: [
    { event: 'GOAL' as MatchEventType, points: 6, label: 'Goal' },
  ],
  GAELIC_FOOTBALL: [
    { event: 'GOAL' as MatchEventType, points: 3, label: 'Goal' },
  ],
  FUTSAL: [
    { event: 'GOAL' as MatchEventType, points: 1, label: 'Goal' },
    { event: 'PENALTY_SCORED' as MatchEventType, points: 1, label: 'Penalty Goal' },
  ],
  BEACH_FOOTBALL: [
    { event: 'GOAL' as MatchEventType, points: 1, label: 'Goal' },
    { event: 'PENALTY_SCORED' as MatchEventType, points: 1, label: 'Penalty Goal' },
  ],
};

// ============================================================================
// DISCIPLINARY EVENTS BY SPORT
// ============================================================================

export const SPORT_DISCIPLINARY_EVENTS: Record<Sport, MatchEventType[]> = {
  FOOTBALL: ['YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD'] as MatchEventType[],
  NETBALL: ['YELLOW_CARD', 'RED_CARD'] as MatchEventType[],
  RUGBY: ['YELLOW_CARD_RUGBY', 'RED_CARD_RUGBY', 'SIN_BIN'] as MatchEventType[],
  CRICKET: [] as MatchEventType[],
  AMERICAN_FOOTBALL: ['YELLOW_CARD', 'RED_CARD'] as MatchEventType[],
  BASKETBALL: ['OFFENSIVE_FOUL', 'DEFENSIVE_FOUL'] as MatchEventType[],
  HOCKEY: ['MINOR_PENALTY', 'MAJOR_PENALTY', 'FIGHT'] as MatchEventType[],
  LACROSSE: ['YELLOW_CARD', 'RED_CARD'] as MatchEventType[],
  AUSTRALIAN_RULES: ['YELLOW_CARD', 'RED_CARD'] as MatchEventType[],
  GAELIC_FOOTBALL: ['YELLOW_CARD', 'RED_CARD'] as MatchEventType[],
  FUTSAL: ['YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD'] as MatchEventType[],
  BEACH_FOOTBALL: ['YELLOW_CARD', 'RED_CARD'] as MatchEventType[],
};

// ============================================================================
// 🏋️ TRAINING CATEGORIES BY SPORT - NEW IN v2.0.0
// ============================================================================

export const SPORT_TRAINING_CATEGORIES: Record<Sport, TrainingCategoryConfig[]> = {
  // =========================================================================
  // ⚽ FOOTBALL TRAINING CATEGORIES
  // =========================================================================
  FOOTBALL: [
    {
      category: 'PASSING',
      label: 'Passing & Distribution',
      description: 'Short and long passing, through balls, cross-field switches',
      icon: '⚽',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Rondo', 'Pass and Move', 'Long Ball Accuracy', 'One-Touch Passing'],
      equipment: ['Cones', 'Balls', 'Mannequins'],
      focusAreas: ['First touch', 'Weight of pass', 'Vision', 'Two-footed passing'],
    },
    {
      category: 'SHOOTING',
      label: 'Finishing & Shooting',
      description: 'Goal scoring techniques, volleys, headers, penalties',
      icon: '🎯',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Finishing Circuits', 'Penalty Practice', 'Volley Training', 'Headers'],
      equipment: ['Goals', 'Balls', 'Cones', 'Rebounders'],
      focusAreas: ['Composure', 'Shot placement', 'Power vs accuracy', 'First-time finishing'],
    },
    {
      category: 'DEFENDING',
      label: 'Defensive Work',
      description: 'Tackling, positioning, pressing, aerial duels',
      icon: '🛡️',
      suggestedDuration: 50,
      suggestedIntensity: 'HIGH',
      drillExamples: ['1v1 Defending', 'Pressing Triggers', 'Defensive Shape', 'Clearances'],
      equipment: ['Cones', 'Bibs', 'Goals', 'Mannequins'],
      focusAreas: ['Timing', 'Body position', 'Communication', 'Recovery runs'],
    },
    {
      category: 'POSSESSION',
      label: 'Possession & Build-Up',
      description: 'Ball retention, playing out from the back, transitions',
      icon: '🔄',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Keep Ball', 'Positional Play', 'Playing Out', 'Counter-Press'],
      equipment: ['Cones', 'Bibs', 'Balls', 'Mini Goals'],
      focusAreas: ['Patience', 'Third-man runs', 'Press resistance', 'Switching play'],
    },
    {
      category: 'SET_PIECES',
      label: 'Set Pieces',
      description: 'Corners, free kicks, throw-ins, penalties',
      icon: '📐',
      suggestedDuration: 35,
      suggestedIntensity: 'LOW',
      drillExamples: ['Corner Routines', 'Free Kick Delivery', 'Defensive Set Pieces', 'Throw-In Patterns'],
      equipment: ['Balls', 'Cones', 'Goals', 'Dummies'],
      focusAreas: ['Timing of runs', 'Delivery accuracy', 'Defensive marking', 'Quick restarts'],
    },
    {
      category: 'GOALKEEPER_SPECIFIC',
      label: 'Goalkeeper Training',
      description: 'Shot stopping, distribution, crosses, 1v1s',
      icon: '🧤',
      suggestedDuration: 60,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Shot Stopping', 'Cross Claiming', '1v1 Situations', 'Distribution'],
      equipment: ['Gloves', 'Balls', 'Poles', 'Hurdles'],
      focusAreas: ['Positioning', 'Reactions', 'Communication', 'Footwork'],
    },
    {
      category: 'TACTICAL',
      label: 'Tactical Work',
      description: 'Formation work, match scenarios, game management',
      icon: '📋',
      suggestedDuration: 60,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Shape Work', 'Transition Scenarios', 'Game Management', 'Pressing Patterns'],
      equipment: ['Bibs', 'Cones', 'Tactical Board'],
      focusAreas: ['Understanding', 'Communication', 'Decision making', 'Adaptability'],
    },
    {
      category: 'CONDITIONING',
      label: 'Physical Conditioning',
      description: 'Endurance, speed, agility, strength',
      icon: '💪',
      suggestedDuration: 45,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Interval Running', 'Sprint Drills', 'Agility Ladders', 'Core Work'],
      equipment: ['Cones', 'Ladders', 'Hurdles', 'Resistance Bands'],
      focusAreas: ['Stamina', 'Explosiveness', 'Change of direction', 'Recovery'],
    },
    {
      category: 'DRIBBLING',
      label: 'Dribbling & Ball Mastery',
      description: '1v1 skills, close control, feints and tricks',
      icon: '🎨',
      suggestedDuration: 40,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Cone Dribbling', '1v1 Beat Your Man', 'Skill Moves', 'Speed Dribbling'],
      equipment: ['Cones', 'Balls', 'Poles'],
      focusAreas: ['Close control', 'Change of pace', 'Body feints', 'Both feet'],
    },
    {
      category: 'RECOVERY',
      label: 'Recovery Session',
      description: 'Light work, stretching, regeneration',
      icon: '🧘',
      suggestedDuration: 30,
      suggestedIntensity: 'RECOVERY',
      drillExamples: ['Light Jogging', 'Stretching', 'Pool Session', 'Yoga'],
      equipment: ['Yoga Mats', 'Foam Rollers', 'Resistance Bands'],
      focusAreas: ['Muscle recovery', 'Flexibility', 'Mental reset', 'Injury prevention'],
    },
  ],

  // =========================================================================
  // 🏀 BASKETBALL TRAINING CATEGORIES
  // =========================================================================
  BASKETBALL: [
    {
      category: 'SHOOTING',
      label: 'Shooting & Scoring',
      description: '3-pointers, mid-range, free throws, layups',
      icon: '🏀',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Spot Shooting', 'Off-Dribble Shots', 'Free Throw Routine', 'Contested Shots'],
      equipment: ['Basketballs', 'Shot Clock', 'Rebounding Machine'],
      focusAreas: ['Form', 'Consistency', 'Shot selection', 'Range'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'BALL_HANDLING',
      label: 'Ball Handling',
      description: 'Dribbling, crossovers, behind-the-back, control',
      icon: '🎯',
      suggestedDuration: 40,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Stationary Dribbling', 'Cone Dribbling', 'Two-Ball Drills', 'Game Speed Moves'],
      equipment: ['Basketballs', 'Cones', 'Dribble Goggles'],
      focusAreas: ['Weak hand', 'Head up', 'Change of pace', 'Protection'],
    },
    {
      category: 'PASSING',
      label: 'Passing & Playmaking',
      description: 'Chest passes, bounce passes, assists, vision',
      icon: '👀',
      suggestedDuration: 35,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Partner Passing', 'No-Look Passes', 'Transition Passing', 'Entry Passes'],
      equipment: ['Basketballs', 'Targets'],
      focusAreas: ['Accuracy', 'Timing', 'Court vision', 'Decision making'],
    },
    {
      category: 'DEFENDING',
      label: 'Defense',
      description: 'On-ball defense, help defense, rebounding',
      icon: '🛡️',
      suggestedDuration: 45,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Closeouts', 'Shell Drill', 'Box Out', 'Help and Recover'],
      equipment: ['Cones', 'Pads'],
      focusAreas: ['Stance', 'Footwork', 'Communication', 'Anticipation'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'POST_PLAY',
      label: 'Post Play',
      description: 'Low post moves, hooks, drop steps, post defense',
      icon: '🎯',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Mikan Drill', 'Drop Step', 'Up and Under', 'Post Seal'],
      equipment: ['Basketballs', 'Pads'],
      focusAreas: ['Footwork', 'Touch', 'Physicality', 'Positioning'],
    },
    {
      category: 'TACTICAL',
      label: 'Team Offense & Defense',
      description: 'Plays, sets, defensive schemes, transitions',
      icon: '📋',
      suggestedDuration: 50,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Motion Offense', 'Pick and Roll', 'Zone Defense', 'Fast Break'],
      equipment: ['Tactical Board', 'Video'],
      focusAreas: ['Execution', 'Spacing', 'Timing', 'Communication'],
    },
    {
      category: 'CONDITIONING',
      label: 'Conditioning',
      description: 'Endurance, speed, agility, vertical leap',
      icon: '💪',
      suggestedDuration: 40,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Suicides', 'Ladder Drills', 'Box Jumps', 'Court Sprints'],
      equipment: ['Cones', 'Ladders', 'Boxes'],
      focusAreas: ['Stamina', 'Explosiveness', 'Lateral movement', 'Recovery'],
    },
  ],

  // =========================================================================
  // 🏉 RUGBY TRAINING CATEGORIES
  // =========================================================================
  RUGBY: [
    {
      category: 'PASSING',
      label: 'Passing & Handling',
      description: 'Spin pass, pop pass, offloads, catch and pass',
      icon: '🏉',
      suggestedDuration: 40,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Passing Lines', 'Offload Practice', 'Pop Pass Timing', 'Under Pressure'],
      equipment: ['Rugby Balls', 'Cones', 'Tackle Shields'],
      focusAreas: ['Accuracy', 'Timing', 'Soft hands', 'Both directions'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'TACKLING',
      label: 'Tackling',
      description: 'Technique, body position, wrap tackling',
      icon: '💥',
      suggestedDuration: 45,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Tackle Bags', '1v1 Tackling', 'Chop Tackle', 'Double Tackle'],
      equipment: ['Tackle Bags', 'Pads', 'Shields'],
      focusAreas: ['Safety', 'Technique', 'Positioning', 'Leg drive'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'RUCKING',
      label: 'Rucking & Breakdown',
      description: 'Ruck technique, body height, clearing out',
      icon: '⚔️',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Ruck Entry', 'Jackaling', 'Counter-Ruck', 'Ball Presentation'],
      equipment: ['Ruck Pads', 'Balls'],
      focusAreas: ['Body position', 'Timing', 'Strength', 'Decision making'],
    },
    {
      category: 'SET_PIECES',
      label: 'Set Pieces',
      description: 'Scrums, lineouts, restarts',
      icon: '📐',
      suggestedDuration: 50,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Scrum Machine', 'Lineout Lifting', 'Throwing Practice', 'Restart Drills'],
      equipment: ['Scrum Machine', 'Lineout Equipment', 'Balls'],
      focusAreas: ['Technique', 'Communication', 'Timing', 'Options'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'KICKING',
      label: 'Kicking',
      description: 'Goal kicking, box kicks, tactical kicking',
      icon: '🦶',
      suggestedDuration: 35,
      suggestedIntensity: 'LOW',
      drillExamples: ['Goal Kicking Routine', 'Box Kicks', 'Contestables', 'Touch Finders'],
      equipment: ['Kicking Tees', 'Balls', 'Posts'],
      focusAreas: ['Technique', 'Accuracy', 'Distance', 'Pressure situations'],
    },
    {
      category: 'TACTICAL',
      label: 'Attack Patterns',
      description: 'Phase play, set moves, decision making',
      icon: '📋',
      suggestedDuration: 55,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Phase Attack', 'Pod Systems', 'Wide Attack', 'First Receiver Options'],
      equipment: ['Cones', 'Shields', 'Bibs'],
      focusAreas: ['Shape', 'Depth', 'Width', 'Support lines'],
    },
    {
      category: 'DEFENDING',
      label: 'Defensive Systems',
      description: 'Line speed, drift defense, blitz patterns',
      icon: '🛡️',
      suggestedDuration: 50,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Line Speed', 'Drift vs Blitz', 'Inside Shoulder', 'Communication'],
      equipment: ['Shields', 'Cones', 'Bibs'],
      focusAreas: ['Communication', 'Line integrity', 'Shot selection', 'Scramble'],
    },
    {
      category: 'CONDITIONING',
      label: 'Rugby Conditioning',
      description: 'Rugby-specific fitness, contact conditioning',
      icon: '💪',
      suggestedDuration: 45,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Broncos', 'Yo-Yo Test', 'Wrestle Conditioning', 'Power Work'],
      equipment: ['Cones', 'Tackle Bags', 'Sleds'],
      focusAreas: ['Work capacity', 'Collision fitness', 'Recovery', 'Power endurance'],
    },
  ],

  // =========================================================================
  // 🏏 CRICKET TRAINING CATEGORIES
  // =========================================================================
  CRICKET: [
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'BATTING',
      label: 'Batting Practice',
      description: 'Technique, shot selection, footwork',
      icon: '🏏',
      suggestedDuration: 60,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Throwdowns', 'Bowling Machine', 'Net Sessions', 'Scenario Batting'],
      equipment: ['Bats', 'Balls', 'Nets', 'Bowling Machine'],
      focusAreas: ['Technique', 'Shot selection', 'Footwork', 'Temperament'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'BOWLING',
      label: 'Bowling',
      description: 'Pace, spin, accuracy, variations',
      icon: '🎯',
      suggestedDuration: 50,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Target Bowling', 'Variation Work', 'Rhythm Running', 'Net Bowling'],
      equipment: ['Balls', 'Cones', 'Stumps', 'Targets'],
      focusAreas: ['Line and length', 'Variations', 'Rhythm', 'Control'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'FIELDING',
      label: 'Fielding',
      description: 'Catching, throwing, ground fielding',
      icon: '🧤',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['High Catches', 'Slip Catching', 'Throwing Accuracy', 'Boundary Saves'],
      equipment: ['Balls', 'Catching Mitts', 'Cones'],
      focusAreas: ['Anticipation', 'Technique', 'Quick release', 'Positioning'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'WICKET_KEEPING',
      label: 'Wicket Keeping',
      description: 'Standing up, standing back, stumping',
      icon: '🧤',
      suggestedDuration: 45,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Standing Up Practice', 'Diving Catches', 'Stumping Drills', 'Movement'],
      equipment: ['Gloves', 'Pads', 'Balls', 'Stumps'],
      focusAreas: ['Footwork', 'Hand position', 'Concentration', 'Reactions'],
    },
    {
      category: 'TACTICAL',
      label: 'Match Scenarios',
      description: 'Game situations, pressure scenarios, tactics',
      icon: '📋',
      suggestedDuration: 60,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Death Overs', 'Run Chases', 'Field Placement', 'Captaincy'],
      equipment: ['Full Kit', 'Tactical Board'],
      focusAreas: ['Decision making', 'Pressure handling', 'Adaptability', 'Communication'],
    },
    {
      category: 'CONDITIONING',
      label: 'Cricket Fitness',
      description: 'Speed, agility, endurance, power',
      icon: '💪',
      suggestedDuration: 45,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Sprint Work', 'Agility Ladders', 'Core Strength', 'Throwing Power'],
      equipment: ['Cones', 'Ladders', 'Medicine Balls'],
      focusAreas: ['Speed', 'Agility', 'Arm strength', 'Core stability'],
    },
  ],

  // =========================================================================
  // 🏈 AMERICAN FOOTBALL TRAINING CATEGORIES
  // =========================================================================
  AMERICAN_FOOTBALL: [
    {
      category: 'PASSING',
      label: 'Passing Game',
      description: 'QB throws, route running, timing',
      icon: '🏈',
      suggestedDuration: 50,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Route Trees', 'Timing Routes', 'Red Zone', 'Two-Minute Drill'],
      equipment: ['Footballs', 'Cones', 'Targets'],
      focusAreas: ['Accuracy', 'Timing', 'Decision making', 'Protection'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'RUSHING',
      label: 'Running Game',
      description: 'Handoffs, blocking schemes, ball security',
      icon: '🏃',
      suggestedDuration: 45,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Zone Running', 'Power Schemes', 'Ball Security', 'Vision Drills'],
      equipment: ['Footballs', 'Blocking Pads', 'Cones'],
      focusAreas: ['Vision', 'Patience', 'Ball security', 'Cuts'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'BLOCKING',
      label: 'Offensive Line',
      description: 'Pass protection, run blocking, pulls',
      icon: '🛡️',
      suggestedDuration: 50,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Pass Pro Sets', 'Double Teams', 'Pulling', 'Hand Fighting'],
      equipment: ['Blocking Sleds', 'Pads', 'Bags'],
      focusAreas: ['Footwork', 'Hand placement', 'Leverage', 'Communication'],
    },
    {
      category: 'DEFENDING',
      label: 'Defensive Schemes',
      description: 'Coverage, pass rush, run fits',
      icon: '🛡️',
      suggestedDuration: 55,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Coverage Shell', 'Pass Rush Moves', 'Gap Fits', 'Tackling'],
      equipment: ['Pads', 'Tackling Dummies', 'Cones'],
      focusAreas: ['Assignment', 'Technique', 'Pursuit', 'Physicality'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'SPECIAL_TEAMS',
      label: 'Special Teams',
      description: 'Kicking, punting, returns, coverage',
      icon: '🦶',
      suggestedDuration: 40,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Field Goals', 'Punt Coverage', 'Kick Returns', 'Onside Kicks'],
      equipment: ['Kicking Tees', 'Footballs', 'Cones'],
      focusAreas: ['Technique', 'Timing', 'Coverage lanes', 'Ball tracking'],
    },
    {
      category: 'TACTICAL',
      label: 'Install & Film',
      description: 'Playbook, game planning, film study',
      icon: '📋',
      suggestedDuration: 60,
      suggestedIntensity: 'LOW',
      drillExamples: ['Playbook Install', 'Film Study', 'Walk-Through', 'Scout Team'],
      equipment: ['Video Equipment', 'Playbooks', 'Whiteboards'],
      focusAreas: ['Knowledge', 'Adjustments', 'Recognition', 'Communication'],
    },
    {
      category: 'CONDITIONING',
      label: 'Football Conditioning',
      description: 'Power, speed, explosiveness, stamina',
      icon: '💪',
      suggestedDuration: 50,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Gassers', 'Power Cleans', 'Sled Work', 'Agility'],
      equipment: ['Weights', 'Sleds', 'Cones', 'Ladders'],
      focusAreas: ['Power', 'Speed', 'Explosion', 'Work capacity'],
    },
  ],

  // =========================================================================
  // 🏒 HOCKEY TRAINING CATEGORIES
  // =========================================================================
  HOCKEY: [
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'SKATING',
      label: 'Skating',
      description: 'Forward, backward, crossovers, stops',
      icon: '⛸️',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Edge Work', 'Crossovers', 'Transitions', 'Speed Skating'],
      equipment: ['Cones', 'Pucks'],
      focusAreas: ['Balance', 'Speed', 'Agility', 'Edges'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'STICK_HANDLING',
      label: 'Stick Handling',
      description: 'Puck control, dekes, protection',
      icon: '🏒',
      suggestedDuration: 35,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Tight Spaces', 'Obstacle Course', 'One-on-One Dekes', 'Protection'],
      equipment: ['Pucks', 'Cones', 'Stick Handling Balls'],
      focusAreas: ['Soft hands', 'Vision', 'Creativity', 'Protection'],
    },
    {
      category: 'SHOOTING',
      label: 'Shooting',
      description: 'Wrist shots, slap shots, one-timers',
      icon: '🎯',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Wrist Shot Accuracy', 'Slap Shot Power', 'One-Timers', 'Deflections'],
      equipment: ['Pucks', 'Targets', 'Shooting Pads'],
      focusAreas: ['Accuracy', 'Release', 'Power', 'Quick release'],
    },
    {
      category: 'PASSING',
      label: 'Passing',
      description: 'Tape-to-tape, saucer passes, breakout passes',
      icon: '➡️',
      suggestedDuration: 35,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Passing Patterns', 'Saucer Passes', 'Breakout Plays', 'Cycling'],
      equipment: ['Pucks', 'Cones'],
      focusAreas: ['Accuracy', 'Weight', 'Timing', 'Vision'],
    },
    {
      category: 'GOALKEEPER_SPECIFIC',
      label: 'Goaltending',
      description: 'Positioning, saves, rebounds, tracking',
      icon: '🥅',
      suggestedDuration: 50,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Butterfly Slides', 'Rebound Control', 'Post Integration', 'Tracking'],
      equipment: ['Goalie Gear', 'Pucks', 'Shooter Tutors'],
      focusAreas: ['Positioning', 'Reactions', 'Rebound control', 'Communication'],
    },
    {
      category: 'TACTICAL',
      label: 'Systems Play',
      description: 'Forechecking, breakouts, power play, penalty kill',
      icon: '📋',
      suggestedDuration: 50,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Forecheck Systems', 'Breakout Patterns', 'PP/PK Units', 'Zone Entries'],
      equipment: ['Pucks', 'Cones', 'Video'],
      focusAreas: ['Structure', 'Communication', 'Timing', 'Support'],
    },
    {
      category: 'CONDITIONING',
      label: 'Hockey Conditioning',
      description: 'On-ice and off-ice conditioning',
      icon: '💪',
      suggestedDuration: 45,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Suicides', 'Bag Skates', 'Interval Skating', 'Dry Land'],
      equipment: ['Cones', 'Timers'],
      focusAreas: ['Stamina', 'Speed endurance', 'Recovery', 'Power'],
    },
  ],

  // =========================================================================
  // 🥍 LACROSSE TRAINING CATEGORIES
  // =========================================================================
  LACROSSE: [
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'STICK_SKILLS',
      label: 'Stick Skills',
      description: 'Cradling, catching, throwing, ground balls',
      icon: '🥍',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Wall Ball', 'Ground Ball Drills', 'Quick Stick', 'Behind-the-Back'],
      equipment: ['Sticks', 'Balls', 'Rebounder'],
      focusAreas: ['Soft hands', 'Quick release', 'Both hands', 'Ground ball technique'],
    },
    {
      category: 'SHOOTING',
      label: 'Shooting',
      description: 'Accuracy, power, off-hand, on-the-run',
      icon: '🎯',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Shooting Galleries', 'Time and Room', 'On-the-Run', 'Off-Hand'],
      equipment: ['Sticks', 'Balls', 'Goals', 'Targets'],
      focusAreas: ['Accuracy', 'Power', 'Quick release', 'Shot selection'],
    },
    {
      category: 'DEFENDING',
      label: 'Defense',
      description: 'Positioning, checks, slides, communication',
      icon: '🛡️',
      suggestedDuration: 45,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Footwork', 'Checking', 'Sliding', '1v1 Defense'],
      equipment: ['Sticks', 'Cones'],
      focusAreas: ['Positioning', 'Footwork', 'Communication', 'Stick checks'],
    },
    {
      category: 'TACTICAL',
      label: 'Team Offense & Defense',
      description: 'Sets, plays, defensive slides, clearing',
      icon: '📋',
      suggestedDuration: 50,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Motion Offense', 'Ride and Clear', 'Man-Up/Man-Down', 'Transition'],
      equipment: ['Sticks', 'Balls', 'Cones'],
      focusAreas: ['Spacing', 'Ball movement', 'Slides', 'Communication'],
    },
    {
      category: 'CONDITIONING',
      label: 'Lacrosse Conditioning',
      description: 'Speed, agility, endurance',
      icon: '💪',
      suggestedDuration: 40,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Suicides', 'Shuttle Runs', 'Agility Ladders', 'Long Distance'],
      equipment: ['Cones', 'Ladders'],
      focusAreas: ['Speed', 'Agility', 'Endurance', 'Recovery'],
    },
  ],

  // =========================================================================
  // 🏐 NETBALL TRAINING CATEGORIES
  // =========================================================================
  NETBALL: [
    {
      category: 'SHOOTING',
      label: 'Shooting',
      description: 'Goal shooting technique, accuracy, pressure',
      icon: '🎯',
      suggestedDuration: 40,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Shooting Routine', 'Pressure Shooting', 'Movement Shooting', 'Rebounds'],
      equipment: ['Balls', 'Goals', 'Rebounders'],
      focusAreas: ['Technique', 'Accuracy', 'Balance', 'Pressure handling'],
    },
    {
      category: 'PASSING',
      label: 'Passing & Receiving',
      description: 'Chest pass, bounce pass, overhead, lobs',
      icon: '🏐',
      suggestedDuration: 35,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Passing Triangles', 'Entry Passes', 'Overhead Lobs', 'Quick Hands'],
      equipment: ['Balls', 'Cones'],
      focusAreas: ['Accuracy', 'Timing', 'Weight of pass', 'Both hands'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'FOOTWORK',
      label: 'Footwork',
      description: 'Landing, pivoting, stepping patterns',
      icon: '👟',
      suggestedDuration: 30,
      suggestedIntensity: 'LOW',
      drillExamples: ['Landing Drills', 'Pivoting', 'Dodging', 'Driving'],
      equipment: ['Cones', 'Ladders'],
      focusAreas: ['Balance', 'Technique', 'Speed', 'Deception'],
    },
    {
      category: 'DEFENDING',
      label: 'Defense',
      description: 'Marking, interceptions, pressure',
      icon: '🛡️',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['1v1 Defending', 'Interceptions', 'Zoning', 'Rebounding'],
      equipment: ['Balls', 'Bibs'],
      focusAreas: ['Positioning', 'Timing', 'Communication', 'Anticipation'],
    },
    {
      category: 'TACTICAL',
      label: 'Team Play',
      description: 'Centre passes, set plays, transitions',
      icon: '📋',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Centre Pass Plays', 'Attack Patterns', 'Defensive Set-Up', 'Transitions'],
      equipment: ['Balls', 'Bibs', 'Cones'],
      focusAreas: ['Timing', 'Space creation', 'Communication', 'Options'],
    },
    {
      category: 'CONDITIONING',
      label: 'Netball Fitness',
      description: 'Speed, agility, court movement',
      icon: '💪',
      suggestedDuration: 35,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Court Sprints', 'Agility Work', 'Change of Direction', 'Jumping'],
      equipment: ['Cones', 'Ladders'],
      focusAreas: ['Speed', 'Agility', 'Power', 'Endurance'],
    },
  ],

  // =========================================================================
  // 🏉 AUSTRALIAN RULES TRAINING CATEGORIES
  // =========================================================================
  AUSTRALIAN_RULES: [
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'KICKING',
      label: 'Kicking',
      description: 'Drop punt, torpedo, snap, goal kicking',
      icon: '🦶',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Drop Punt Accuracy', 'Goal Kicking', 'Checkside', 'Long Kicking'],
      equipment: ['Footballs', 'Goals', 'Targets'],
      focusAreas: ['Technique', 'Accuracy', 'Distance', 'Both feet'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'MARKING',
      label: 'Marking',
      description: 'Chest marks, overhead marks, pack marks',
      icon: '🤲',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Marking Contests', 'Leading Patterns', 'Pack Work', 'Overhead Marks'],
      equipment: ['Footballs', 'Crash Mats'],
      focusAreas: ['Timing', 'Courage', 'Hands', 'Body position'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'HANDBALLING',
      label: 'Handballing',
      description: 'Short handball, long handball, under pressure',
      icon: '✋',
      suggestedDuration: 30,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Quick Hands', 'Handball Chains', 'Pressure Handballs', 'Both Hands'],
      equipment: ['Footballs', 'Cones'],
      focusAreas: ['Accuracy', 'Speed', 'Both hands', 'Under pressure'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'TACKLING_AFL',
      label: 'Tackling & Pressure',
      description: 'Tackling technique, pressure acts, smothering',
      icon: '💥',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Tackling Drills', 'Pressure Scenarios', 'Smothering', 'Chase Downs'],
      equipment: ['Tackle Bags', 'Footballs'],
      focusAreas: ['Technique', 'Intensity', 'Timing', 'Courage'],
    },
    {
      category: 'TACTICAL',
      label: 'Game Style',
      description: 'Structures, stoppages, transitions',
      icon: '📋',
      suggestedDuration: 50,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Stoppage Work', 'Defensive Structure', 'Corridor Play', 'Forward Entries'],
      equipment: ['Footballs', 'Cones', 'Bibs'],
      focusAreas: ['Structure', 'Decision making', 'Spacing', 'Communication'],
    },
    {
      category: 'CONDITIONING',
      label: 'AFL Fitness',
      description: 'Endurance, repeat sprints, power',
      icon: '💪',
      suggestedDuration: 50,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Time Trials', 'Repeat Sprints', 'Power Work', 'Yo-Yo Tests'],
      equipment: ['Cones', 'GPS Trackers'],
      focusAreas: ['Endurance', 'Repeat efforts', 'Speed', 'Power'],
    },
  ],

  // =========================================================================
  // ☘️ GAELIC FOOTBALL TRAINING CATEGORIES
  // =========================================================================
  GAELIC_FOOTBALL: [
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'KICKING_GAA',
      label: 'Kicking',
      description: 'Points, frees, kick-outs, long range',
      icon: '🦶',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Point Shooting', 'Free Taking', 'Kick-Out Practice', '45s'],
      equipment: ['Footballs', 'Goals', 'Cones'],
      focusAreas: ['Accuracy', 'Technique', 'Both feet', 'Pressure'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'CATCHING',
      label: 'Catching & Fielding',
      description: 'High catches, breaking ball, clean catching',
      icon: '🤲',
      suggestedDuration: 35,
      suggestedIntensity: 'HIGH',
      drillExamples: ['High Fielding', 'Contests', 'Breaking Ball', 'Kick-Out Catching'],
      equipment: ['Footballs'],
      focusAreas: ['Timing', 'Courage', 'Hands', 'Body position'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'HANDPASSING',
      label: 'Handpassing',
      description: 'Short passing, long fists, under pressure',
      icon: '✋',
      suggestedDuration: 30,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Quick Handpasses', 'Chains', 'Pressure Passing', 'Pop Passes'],
      equipment: ['Footballs', 'Cones'],
      focusAreas: ['Accuracy', 'Speed', 'Both hands', 'Weight'],
    },
    {
      category: 'CUSTOM' as TrainingCategory,
      customKey: 'SOLOING',
      label: 'Soloing & Movement',
      description: 'Solo running, side-stepping, feinting',
      icon: '🏃',
      suggestedDuration: 30,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Solo Runs', 'Weaving', 'Feinting', 'Change of Direction'],
      equipment: ['Footballs', 'Cones'],
      focusAreas: ['Control', 'Speed', 'Change of pace', 'Deception'],
    },
    {
      category: 'TACTICAL',
      label: 'Team Play',
      description: 'Systems, kick-outs, defensive structures',
      icon: '📋',
      suggestedDuration: 50,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Kick-Out Strategies', 'Attack Patterns', 'Defensive Shape', 'Transitions'],
      equipment: ['Footballs', 'Cones', 'Bibs'],
      focusAreas: ['Structure', 'Communication', 'Positioning', 'Decision making'],
    },
    {
      category: 'CONDITIONING',
      label: 'GAA Fitness',
      description: 'Endurance, speed, agility',
      icon: '💪',
      suggestedDuration: 45,
      suggestedIntensity: 'MAXIMUM',
      drillExamples: ['Runs', 'Shuttles', 'Agility Work', 'Game Conditioning'],
      equipment: ['Cones', 'Ladders'],
      focusAreas: ['Stamina', 'Speed', 'Recovery', 'Work rate'],
    },
  ],

  // =========================================================================
  // ⚽ FUTSAL TRAINING CATEGORIES
  // =========================================================================
  FUTSAL: [
    {
      category: 'PASSING',
      label: 'Passing & Control',
      description: 'Quick passing, first touch, ball control',
      icon: '⚽',
      suggestedDuration: 40,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Quick Passing Patterns', 'First Touch Work', 'Tight Space Passing', 'Combinations'],
      equipment: ['Balls', 'Cones'],
      focusAreas: ['Quick feet', 'First touch', 'Vision', 'Accuracy'],
    },
    {
      category: 'SHOOTING',
      label: 'Shooting & Finishing',
      description: 'Close range, power shots, toe pokes',
      icon: '🎯',
      suggestedDuration: 35,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Finishing Drills', 'Power Shots', 'Toe Pokes', 'Volleys'],
      equipment: ['Balls', 'Goals'],
      focusAreas: ['Accuracy', 'Quick release', 'Power', 'Composure'],
    },
    {
      category: 'DEFENDING',
      label: 'Defense',
      description: 'Pressing, blocking, positional defense',
      icon: '🛡️',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Pressing Triggers', '1v1 Defending', 'Blocking', 'Rotation'],
      equipment: ['Balls', 'Bibs'],
      focusAreas: ['Positioning', 'Pressing', 'Communication', 'Recovery'],
    },
    {
      category: 'GOALKEEPER_SPECIFIC',
      label: 'Goalkeeper',
      description: 'Shot stopping, distribution, 1v1s',
      icon: '🧤',
      suggestedDuration: 45,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Shot Stopping', 'Distribution', '1v1 Saves', 'Footwork'],
      equipment: ['Balls', 'Gloves', 'Goals'],
      focusAreas: ['Reactions', 'Distribution', 'Positioning', 'Footwork'],
    },
    {
      category: 'TACTICAL',
      label: 'Rotations & Systems',
      description: 'Rotation patterns, set plays, transitions',
      icon: '📋',
      suggestedDuration: 45,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['3-1 Rotation', '4-0 Movement', 'Power Play', 'Pressing Traps'],
      equipment: ['Balls', 'Cones', 'Bibs'],
      focusAreas: ['Movement', 'Timing', 'Communication', 'Spacing'],
    },
    {
      category: 'CONDITIONING',
      label: 'Futsal Fitness',
      description: 'Short sprints, agility, recovery',
      icon: '💪',
      suggestedDuration: 30,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Court Sprints', 'Agility Work', 'Reaction Drills', 'Recovery'],
      equipment: ['Cones', 'Ladders'],
      focusAreas: ['Speed', 'Agility', 'Quick recovery', 'Explosiveness'],
    },
  ],

  // =========================================================================
  // 🏖️ BEACH FOOTBALL TRAINING CATEGORIES
  // =========================================================================
  BEACH_FOOTBALL: [
    {
      category: 'SHOOTING',
      label: 'Shooting & Finishing',
      description: 'Volleys, bicycle kicks, headers, close range',
      icon: '🎯',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Volley Practice', 'Bicycle Kicks', 'Headers', 'Acrobatic Finishes'],
      equipment: ['Balls', 'Goals'],
      focusAreas: ['Technique', 'Timing', 'Creativity', 'Acrobatics'],
    },
    {
      category: 'PASSING',
      label: 'Ball Control & Passing',
      description: 'Sand control, quick passing, juggling',
      icon: '⚽',
      suggestedDuration: 35,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Sand Control', 'Quick Combinations', 'Juggling', 'First Touch'],
      equipment: ['Balls', 'Cones'],
      focusAreas: ['Soft touch', 'Adaptation', 'Quick passing', 'Balance'],
    },
    {
      category: 'GOALKEEPER_SPECIFIC',
      label: 'Goalkeeper',
      description: 'Diving, distribution, sand movement',
      icon: '🧤',
      suggestedDuration: 40,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Diving Practice', 'Sand Movement', 'Distribution', 'Reactions'],
      equipment: ['Balls', 'Gloves', 'Goals'],
      focusAreas: ['Diving technique', 'Sand movement', 'Reactions', 'Distribution'],
    },
    {
      category: 'TACTICAL',
      label: 'Team Play',
      description: 'Rotations, set pieces, defensive shape',
      icon: '📋',
      suggestedDuration: 40,
      suggestedIntensity: 'MEDIUM',
      drillExamples: ['Rotation Patterns', 'Set Plays', 'Defensive Organization', 'Transitions'],
      equipment: ['Balls', 'Cones'],
      focusAreas: ['Movement', 'Communication', 'Positioning', 'Creativity'],
    },
    {
      category: 'CONDITIONING',
      label: 'Sand Conditioning',
      description: 'Sand-specific fitness, jumping, balance',
      icon: '💪',
      suggestedDuration: 35,
      suggestedIntensity: 'HIGH',
      drillExamples: ['Sand Sprints', 'Jump Training', 'Balance Work', 'Agility'],
      equipment: ['Cones'],
      focusAreas: ['Sand adaptation', 'Power', 'Balance', 'Endurance'],
    },
  ],
};

// ============================================================================
// COMMON INJURY PATTERNS BY SPORT
// ============================================================================

export const SPORT_INJURY_PATTERNS: Record<Sport, string[]> = {
  FOOTBALL: [
    'Hamstring strain', 'ACL tear', 'MCL sprain', 'Ankle sprain', 'Groin strain',
    'Calf strain', 'Quadriceps strain', 'Achilles tendinitis', 'Hip flexor strain',
    'Concussion', 'Metatarsal fracture', 'Shin splints',
  ],
  NETBALL: [
    'ACL tear', 'Ankle sprain', 'Knee ligament injury', 'Achilles tendinitis',
    'Finger injury', 'Shoulder injury', 'Patella dislocation',
  ],
  RUGBY: [
    'Concussion', 'Shoulder dislocation', 'AC joint injury', 'Hamstring strain',
    'Knee ligament injury', 'Ankle sprain', 'Rib injury', 'Neck injury',
    'Calf strain', 'Hand/finger fracture',
  ],
  CRICKET: [
    'Shoulder injury', 'Lower back stress fracture', 'Hamstring strain',
    'Side strain', 'Knee injury', 'Finger injury', 'Ankle sprain',
    'Elbow injury', 'Groin strain',
  ],
  AMERICAN_FOOTBALL: [
    'Concussion', 'ACL tear', 'MCL sprain', 'Ankle sprain', 'Shoulder injury',
    'Turf toe', 'Hamstring strain', 'Hip flexor strain', 'Rib injury',
    'Neck injury', 'Hand/wrist injury',
  ],
  BASKETBALL: [
    'Ankle sprain', 'ACL tear', 'Patellar tendinitis', 'Achilles injury',
    'Finger injury', 'Knee injury', 'Shoulder injury', 'Hamstring strain',
    'Back spasm', 'Foot injury',
  ],
  HOCKEY: [
    'Groin strain', 'Hip injury', 'Concussion', 'Shoulder injury',
    'Knee injury', 'Ankle sprain', 'Back injury', 'Wrist injury',
    'Hand injury', 'Eye injury',
  ],
  LACROSSE: [
    'ACL tear', 'Ankle sprain', 'Shoulder injury', 'Concussion',
    'Knee injury', 'Hand injury', 'Hip injury', 'Lower back injury',
  ],
  AUSTRALIAN_RULES: [
    'Hamstring strain', 'ACL tear', 'Ankle sprain', 'Concussion',
    'Shoulder injury', 'Groin strain', 'Calf strain', 'Knee injury',
  ],
  GAELIC_FOOTBALL: [
    'Hamstring strain', 'ACL tear', 'Ankle sprain', 'Shoulder injury',
    'Groin strain', 'Hand injury', 'Concussion', 'Knee injury',
  ],
  FUTSAL: [
    'Ankle sprain', 'Knee injury', 'Hamstring strain', 'Groin strain',
    'Calf strain', 'Achilles injury', 'Lower back pain',
  ],
  BEACH_FOOTBALL: [
    'Ankle sprain', 'Knee injury', 'Hamstring strain', 'Shoulder injury',
    'Back strain', 'Calf strain', 'Foot injury',
  ],
};

// ============================================================================
// METRICS BY SPORT
// ============================================================================

export const SPORT_METRICS: Record<Sport, MetricConfig[]> = {
  FOOTBALL: [
    { key: 'goals', label: 'Goals', icon: '⚽', category: 'scoring', higherIsBetter: true },
    { key: 'assists', label: 'Assists', icon: '🎯', category: 'assists', higherIsBetter: true },
    { key: 'cleanSheets', label: 'Clean Sheets', icon: '🧤', category: 'defensive', higherIsBetter: true },
    { key: 'yellowCards', label: 'Yellow Cards', icon: '🟨', category: 'disciplinary', higherIsBetter: false },
    { key: 'redCards', label: 'Red Cards', icon: '🟥', category: 'disciplinary', higherIsBetter: false },
    { key: 'passAccuracy', label: 'Pass Accuracy', icon: '📊', category: 'other', unit: '%', higherIsBetter: true },
    { key: 'tackles', label: 'Tackles', icon: '🛡️', category: 'defensive', higherIsBetter: true },
    { key: 'interceptions', label: 'Interceptions', icon: '✋', category: 'defensive', higherIsBetter: true },
  ],
  BASKETBALL: [
    { key: 'points', label: 'Points', icon: '🏀', category: 'scoring', higherIsBetter: true },
    { key: 'assists', label: 'Assists', icon: '🎯', category: 'assists', higherIsBetter: true },
    { key: 'rebounds', label: 'Rebounds', icon: '📊', category: 'sport_specific', higherIsBetter: true },
    { key: 'steals', label: 'Steals', icon: '✋', category: 'defensive', higherIsBetter: true },
    { key: 'blocks', label: 'Blocks', icon: '🛡️', category: 'defensive', higherIsBetter: true },
    { key: 'turnovers', label: 'Turnovers', icon: '❌', category: 'other', higherIsBetter: false },
    { key: 'threePointPct', label: '3PT %', icon: '🎯', category: 'scoring', unit: '%', higherIsBetter: true },
    { key: 'freeThrowPct', label: 'FT %', icon: '🎯', category: 'scoring', unit: '%', higherIsBetter: true },
  ],
  RUGBY: [
    { key: 'tries', label: 'Tries', icon: '🏉', category: 'scoring', higherIsBetter: true },
    { key: 'conversions', label: 'Conversions', icon: '🎯', category: 'scoring', higherIsBetter: true },
    { key: 'penaltyGoals', label: 'Penalty Goals', icon: '🦶', category: 'scoring', higherIsBetter: true },
    { key: 'tackles', label: 'Tackles', icon: '💪', category: 'defensive', higherIsBetter: true },
    { key: 'carries', label: 'Carries', icon: '🏃', category: 'sport_specific', higherIsBetter: true },
    { key: 'lineoutWins', label: 'Lineout Wins', icon: '📊', category: 'sport_specific', higherIsBetter: true },
    { key: 'yellowCards', label: 'Yellow Cards', icon: '🟨', category: 'disciplinary', higherIsBetter: false },
    { key: 'redCards', label: 'Red Cards', icon: '🟥', category: 'disciplinary', higherIsBetter: false },
  ],
  CRICKET: [
    { key: 'runs', label: 'Runs', icon: '🏏', category: 'scoring', higherIsBetter: true },
    { key: 'wickets', label: 'Wickets', icon: '🎯', category: 'sport_specific', higherIsBetter: true },
    { key: 'catches', label: 'Catches', icon: '🧤', category: 'defensive', higherIsBetter: true },
    { key: 'battingAvg', label: 'Batting Avg', icon: '📊', category: 'scoring', higherIsBetter: true },
    { key: 'bowlingAvg', label: 'Bowling Avg', icon: '📊', category: 'sport_specific', higherIsBetter: false },
    { key: 'strikeRate', label: 'Strike Rate', icon: '⚡', category: 'scoring', higherIsBetter: true },
    { key: 'economyRate', label: 'Economy Rate', icon: '📉', category: 'sport_specific', higherIsBetter: false },
  ],
  AMERICAN_FOOTBALL: [
    { key: 'touchdowns', label: 'Touchdowns', icon: '🏈', category: 'scoring', higherIsBetter: true },
    { key: 'passingYards', label: 'Passing Yards', icon: '📊', category: 'sport_specific', higherIsBetter: true },
    { key: 'rushingYards', label: 'Rushing Yards', icon: '🏃', category: 'sport_specific', higherIsBetter: true },
    { key: 'receptions', label: 'Receptions', icon: '🤲', category: 'sport_specific', higherIsBetter: true },
    { key: 'sacks', label: 'Sacks', icon: '💥', category: 'defensive', higherIsBetter: true },
    { key: 'interceptions', label: 'INTs', icon: '✋', category: 'defensive', higherIsBetter: true },
    { key: 'fieldGoals', label: 'Field Goals', icon: '🎯', category: 'scoring', higherIsBetter: true },
  ],
  HOCKEY: [
    { key: 'goals', label: 'Goals', icon: '🏒', category: 'scoring', higherIsBetter: true },
    { key: 'assists', label: 'Assists', icon: '🎯', category: 'assists', higherIsBetter: true },
    { key: 'plusMinus', label: '+/-', icon: '📊', category: 'other', higherIsBetter: true },
    { key: 'penaltyMinutes', label: 'PIM', icon: '⏱️', category: 'disciplinary', higherIsBetter: false },
    { key: 'saves', label: 'Saves', icon: '🧤', category: 'defensive', higherIsBetter: true },
    { key: 'savePct', label: 'Save %', icon: '📊', category: 'defensive', unit: '%', higherIsBetter: true },
    { key: 'shots', label: 'Shots', icon: '🎯', category: 'sport_specific', higherIsBetter: true },
  ],
  NETBALL: [
    { key: 'goals', label: 'Goals', icon: '🏐', category: 'scoring', higherIsBetter: true },
    { key: 'goalAttempts', label: 'Goal Attempts', icon: '🎯', category: 'scoring', higherIsBetter: true },
    { key: 'goalPct', label: 'Goal %', icon: '📊', category: 'scoring', unit: '%', higherIsBetter: true },
    { key: 'feeds', label: 'Feeds', icon: '➡️', category: 'assists', higherIsBetter: true },
    { key: 'interceptions', label: 'Intercepts', icon: '✋', category: 'defensive', higherIsBetter: true },
    { key: 'rebounds', label: 'Rebounds', icon: '📊', category: 'sport_specific', higherIsBetter: true },
    { key: 'deflections', label: 'Deflections', icon: '🛡️', category: 'defensive', higherIsBetter: true },
  ],
  LACROSSE: [
    { key: 'goals', label: 'Goals', icon: '🥍', category: 'scoring', higherIsBetter: true },
    { key: 'assists', label: 'Assists', icon: '🎯', category: 'assists', higherIsBetter: true },
    { key: 'groundBalls', label: 'Ground Balls', icon: '⚽', category: 'sport_specific', higherIsBetter: true },
    { key: 'saves', label: 'Saves', icon: '🧤', category: 'defensive', higherIsBetter: true },
    { key: 'turnovers', label: 'Turnovers', icon: '❌', category: 'other', higherIsBetter: false },
  ],
  AUSTRALIAN_RULES: [
    { key: 'goals', label: 'Goals', icon: '⚽', category: 'scoring', higherIsBetter: true },
    { key: 'behinds', label: 'Behinds', icon: '🎯', category: 'scoring', higherIsBetter: true },
    { key: 'disposals', label: 'Disposals', icon: '📊', category: 'sport_specific', higherIsBetter: true },
    { key: 'marks', label: 'Marks', icon: '🤲', category: 'sport_specific', higherIsBetter: true },
    { key: 'tackles', label: 'Tackles', icon: '💪', category: 'defensive', higherIsBetter: true },
  ],
  GAELIC_FOOTBALL: [
    { key: 'goals', label: 'Goals', icon: '⚽', category: 'scoring', higherIsBetter: true },
    { key: 'points', label: 'Points', icon: '🎯', category: 'scoring', higherIsBetter: true },
    { key: 'tackles', label: 'Tackles', icon: '💪', category: 'defensive', higherIsBetter: true },
  ],
  FUTSAL: [
    { key: 'goals', label: 'Goals', icon: '⚽', category: 'scoring', higherIsBetter: true },
    { key: 'assists', label: 'Assists', icon: '🎯', category: 'assists', higherIsBetter: true },
    { key: 'saves', label: 'Saves', icon: '🧤', category: 'defensive', higherIsBetter: true },
    { key: 'fouls', label: 'Fouls', icon: '⚠️', category: 'disciplinary', higherIsBetter: false },
  ],
  BEACH_FOOTBALL: [
    { key: 'goals', label: 'Goals', icon: '⚽', category: 'scoring', higherIsBetter: true },
    { key: 'assists', label: 'Assists', icon: '🎯', category: 'assists', higherIsBetter: true },
    { key: 'saves', label: 'Saves', icon: '🧤', category: 'defensive', higherIsBetter: true },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get full sport configuration
 */
export function getSportConfig(sport: Sport): SportConfig {
  const squadConfig = SPORT_SQUAD_CONFIG[sport];
  const positions = SPORT_POSITIONS[sport];
  const eventTypes = SPORT_EVENT_TYPES[sport];
  const scoringEvents = SPORT_SCORING_EVENTS[sport];
  const disciplinaryEvents = SPORT_DISCIPLINARY_EVENTS[sport];
  const trainingCategories = SPORT_TRAINING_CATEGORIES[sport];
  const metrics = SPORT_METRICS[sport];
  const injuryPatterns = SPORT_INJURY_PATTERNS[sport];

  const sportNames: Record<Sport, { name: string; shortName: string; emoji: string }> = {
    FOOTBALL: { name: 'Football', shortName: 'Football', emoji: '⚽' },
    NETBALL: { name: 'Netball', shortName: 'Netball', emoji: '🏐' },
    RUGBY: { name: 'Rugby Union', shortName: 'Rugby', emoji: '🏉' },
    CRICKET: { name: 'Cricket', shortName: 'Cricket', emoji: '🏏' },
    AMERICAN_FOOTBALL: { name: 'American Football', shortName: 'NFL', emoji: '🏈' },
    BASKETBALL: { name: 'Basketball', shortName: 'Basketball', emoji: '🏀' },
    HOCKEY: { name: 'Ice Hockey', shortName: 'Hockey', emoji: '🏒' },
    LACROSSE: { name: 'Lacrosse', shortName: 'Lacrosse', emoji: '🥍' },
    AUSTRALIAN_RULES: { name: 'Australian Rules Football', shortName: 'AFL', emoji: '🏉' },
    GAELIC_FOOTBALL: { name: 'Gaelic Football', shortName: 'GAA', emoji: '☘️' },
    FUTSAL: { name: 'Futsal', shortName: 'Futsal', emoji: '⚽' },
    BEACH_FOOTBALL: { name: 'Beach Football', shortName: 'Beach', emoji: '🏖️' },
  };

  const matchConfig: Record<Sport, { periods: number; duration: number; extraTime: boolean; penalties: boolean; overtimes: boolean }> = {
    FOOTBALL: { periods: 2, duration: 45, extraTime: true, penalties: true, overtimes: false },
    NETBALL: { periods: 4, duration: 15, extraTime: true, penalties: false, overtimes: false },
    RUGBY: { periods: 2, duration: 40, extraTime: true, penalties: false, overtimes: false },
    CRICKET: { periods: 2, duration: 0, extraTime: false, penalties: false, overtimes: false },
    AMERICAN_FOOTBALL: { periods: 4, duration: 15, extraTime: false, penalties: false, overtimes: true },
    BASKETBALL: { periods: 4, duration: 12, extraTime: false, penalties: false, overtimes: true },
    HOCKEY: { periods: 3, duration: 20, extraTime: false, penalties: true, overtimes: true },
    LACROSSE: { periods: 4, duration: 15, extraTime: false, penalties: false, overtimes: true },
    AUSTRALIAN_RULES: { periods: 4, duration: 20, extraTime: true, penalties: false, overtimes: false },
    GAELIC_FOOTBALL: { periods: 2, duration: 35, extraTime: true, penalties: false, overtimes: false },
    FUTSAL: { periods: 2, duration: 20, extraTime: true, penalties: true, overtimes: false },
    BEACH_FOOTBALL: { periods: 3, duration: 12, extraTime: true, penalties: true, overtimes: false },
  };

  const sportInfo = sportNames[sport];
  const matchInfo = matchConfig[sport];

  return {
    name: sportInfo.name,
    shortName: sportInfo.shortName,
    icon: sportInfo.emoji,
    emoji: sportInfo.emoji,
    squadSize: squadConfig.startingSize,
    maxSubstitutes: squadConfig.maxSubstitutes,
    minPlayers: squadConfig.minPlayers,
    benchSize: squadConfig.benchSize,
    positions,
    formations: [], // Would be populated from database or config
    eventTypes,
    scoringEvents,
    disciplinaryEvents,
    periodCount: matchInfo.periods,
    periodDuration: matchInfo.duration,
    hasExtraTime: matchInfo.extraTime,
    hasPenalties: matchInfo.penalties,
    hasOvertimes: matchInfo.overtimes,
    trainingCategories,
    customTrainingCategories: trainingCategories
      .filter(tc => tc.category === 'CUSTOM')
      .map(tc => tc.customKey || ''),
    commonInjuryPatterns: injuryPatterns,
    metrics,
    primaryScoreLabel: sport === 'CRICKET' ? 'Runs' : sport === 'BASKETBALL' ? 'Points' : 'Goals',
    secondaryScoreLabel: sport === 'CRICKET' ? 'Wickets' : undefined,
  };
}

/**
 * Get training categories for a sport
 */
export function getTrainingCategoriesForSport(sport: Sport): TrainingCategoryConfig[] {
  return SPORT_TRAINING_CATEGORIES[sport] || [];
}

/**
 * Get custom training category keys for a sport
 */
export function getCustomCategoryKeys(sport: Sport): string[] {
  return SPORT_TRAINING_CATEGORIES[sport]
    .filter(tc => tc.category === 'CUSTOM' && tc.customKey)
    .map(tc => tc.customKey as string);
}

/**
 * Format position name for display
 */
export function formatPositionName(position: Position): string {
  return position
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace('Netball', '(Netball)')
    .replace('Basketball', '(Basketball)')
    .replace('Hockey', '(Hockey)')
    .replace('League', '(League)');
}

/**
 * Get positions for a sport
 */
export function getPositionsForSport(sport: Sport): Position[] {
  return SPORT_POSITIONS[sport] || [];
}

/**
 * Check if an event is a scoring event for the sport
 */
export function isScoringEvent(sport: Sport, eventType: MatchEventType): boolean {
  return SPORT_SCORING_EVENTS[sport].some(se => se.event === eventType);
}

/**
 * Get points for a scoring event
 */
export function getPointsForEvent(sport: Sport, eventType: MatchEventType): number {
  const scoringEvent = SPORT_SCORING_EVENTS[sport].find(se => se.event === eventType);
  return scoringEvent?.points || 0;
}

/**
 * Calculate disciplinary points
 */
export function calculateDisciplinaryPoints(yellowCards: number, redCards: number): number {
  return yellowCards + (redCards * 3);
}

/**
 * Get all sports as options for dropdowns
 */
export function getSportOptions(): { value: Sport; label: string; emoji: string }[] {
  return Object.values(Sport).map(sport => {
    const config = getSportConfig(sport as Sport);
    return {
      value: sport as Sport,
      label: config.name,
      emoji: config.emoji,
    };
  });
}

/**
 * Validate squad size for a sport
 */
export function validateSquadSize(sport: Sport, startingCount: number, subsCount: number): {
  valid: boolean;
  error?: string;
} {
  const config = SPORT_SQUAD_CONFIG[sport];
  
  if (startingCount < config.minPlayers) {
    return {
      valid: false,
      error: `Minimum ${config.minPlayers} players required for ${sport}`,
    };
  }
  
  if (startingCount > config.startingSize) {
    return {
      valid: false,
      error: `Maximum ${config.startingSize} starting players allowed for ${sport}`,
    };
  }
  
  if (subsCount > config.maxSubstitutes) {
    return {
      valid: false,
      error: `Maximum ${config.maxSubstitutes} substitutes allowed for ${sport}`,
    };
  }
  
  return { valid: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Sport,
  Position,
  MatchEventType,
  TrainingCategory,
  TrainingIntensity,
  FormationType,
};