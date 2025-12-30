// ============================================================================
// 🏆 PITCHCONNECT SPORT CONFIGURATION v7.5.0
// ============================================================================
// Comprehensive multi-sport configuration for all 12 supported sports
// Includes positions, icons, colors, stat labels, and form fields
// ============================================================================

import {
  Dribbble,
  Target,
  Shield,
  Zap,
  Users,
  Circle,
  Hexagon,
  Triangle,
  Square,
  Star,
  Award,
  Activity,
} from 'lucide-react';

// ============================================================================
// SPORT ENUM (matches Prisma schema)
// ============================================================================

export type Sport =
  | 'FOOTBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'BASKETBALL'
  | 'AMERICAN_FOOTBALL'
  | 'HOCKEY'
  | 'NETBALL'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

// ============================================================================
// POSITION MAPPINGS BY SPORT
// ============================================================================

export const SPORT_POSITIONS: Record<Sport, { value: string; label: string }[]> = {
  FOOTBALL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper' },
    { value: 'LEFT_BACK', label: 'Left Back' },
    { value: 'CENTER_BACK', label: 'Center Back' },
    { value: 'RIGHT_BACK', label: 'Right Back' },
    { value: 'LEFT_WING_BACK', label: 'Left Wing Back' },
    { value: 'RIGHT_WING_BACK', label: 'Right Wing Back' },
    { value: 'DEFENSIVE_MIDFIELDER', label: 'Defensive Midfielder' },
    { value: 'CENTRAL_MIDFIELDER', label: 'Central Midfielder' },
    { value: 'LEFT_MIDFIELDER', label: 'Left Midfielder' },
    { value: 'RIGHT_MIDFIELDER', label: 'Right Midfielder' },
    { value: 'ATTACKING_MIDFIELDER', label: 'Attacking Midfielder' },
    { value: 'LEFT_WINGER', label: 'Left Winger' },
    { value: 'RIGHT_WINGER', label: 'Right Winger' },
    { value: 'STRIKER', label: 'Striker' },
    { value: 'CENTER_FORWARD', label: 'Center Forward' },
    { value: 'SECOND_STRIKER', label: 'Second Striker' },
  ],
  RUGBY: [
    { value: 'PROP', label: 'Prop' },
    { value: 'HOOKER', label: 'Hooker' },
    { value: 'LOCK', label: 'Lock' },
    { value: 'FLANKER', label: 'Flanker' },
    { value: 'NUMBER_8', label: 'Number 8' },
    { value: 'SCRUM_HALF', label: 'Scrum Half' },
    { value: 'FLY_HALF', label: 'Fly Half' },
    { value: 'INSIDE_CENTER', label: 'Inside Center' },
    { value: 'OUTSIDE_CENTER', label: 'Outside Center' },
    { value: 'WINGER', label: 'Winger' },
    { value: 'FULLBACK', label: 'Fullback' },
    { value: 'HOOKER_LEAGUE', label: 'Hooker (League)' },
    { value: 'PROP_LEAGUE', label: 'Prop (League)' },
    { value: 'SECOND_ROW', label: 'Second Row' },
    { value: 'LOOSE_FORWARD', label: 'Loose Forward' },
  ],
  CRICKET: [
    { value: 'BATSMAN', label: 'Batsman' },
    { value: 'BOWLER', label: 'Bowler' },
    { value: 'ALL_ROUNDER', label: 'All-Rounder' },
    { value: 'WICKET_KEEPER', label: 'Wicket Keeper' },
    { value: 'FIELDER', label: 'Fielder' },
  ],
  BASKETBALL: [
    { value: 'POINT_GUARD', label: 'Point Guard' },
    { value: 'SHOOTING_GUARD', label: 'Shooting Guard' },
    { value: 'SMALL_FORWARD', label: 'Small Forward' },
    { value: 'POWER_FORWARD', label: 'Power Forward' },
    { value: 'CENTER_BASKETBALL', label: 'Center' },
  ],
  AMERICAN_FOOTBALL: [
    { value: 'QUARTERBACK', label: 'Quarterback' },
    { value: 'RUNNING_BACK', label: 'Running Back' },
    { value: 'WIDE_RECEIVER', label: 'Wide Receiver' },
    { value: 'TIGHT_END', label: 'Tight End' },
    { value: 'LEFT_TACKLE', label: 'Left Tackle' },
    { value: 'LEFT_GUARD', label: 'Left Guard' },
    { value: 'CENTER_POSITION', label: 'Center' },
    { value: 'RIGHT_GUARD', label: 'Right Guard' },
    { value: 'RIGHT_TACKLE', label: 'Right Tackle' },
    { value: 'LINEBACKER', label: 'Linebacker' },
    { value: 'DEFENSIVE_END', label: 'Defensive End' },
    { value: 'DEFENSIVE_TACKLE', label: 'Defensive Tackle' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'CORNERBACK', label: 'Cornerback' },
    { value: 'PUNTER', label: 'Punter' },
    { value: 'KICKER', label: 'Kicker' },
  ],
  HOCKEY: [
    { value: 'GOALTENDER', label: 'Goaltender' },
    { value: 'DEFENSEMAN', label: 'Defenseman' },
    { value: 'WINGER', label: 'Winger' },
    { value: 'CENTER_HOCKEY', label: 'Center' },
  ],
  NETBALL: [
    { value: 'GOALKEEPER_NETBALL', label: 'Goalkeeper (GK)' },
    { value: 'GOAL_DEFENSE', label: 'Goal Defense (GD)' },
    { value: 'WING_DEFENSE', label: 'Wing Defense (WD)' },
    { value: 'CENTER', label: 'Center (C)' },
    { value: 'WING_ATTACK', label: 'Wing Attack (WA)' },
    { value: 'GOAL_ATTACK', label: 'Goal Attack (GA)' },
    { value: 'GOAL_SHOOTER', label: 'Goal Shooter (GS)' },
  ],
  LACROSSE: [
    { value: 'GOALKEEPER', label: 'Goalkeeper' },
    { value: 'DEFENSEMAN', label: 'Defenseman' },
    { value: 'MIDFIELDER', label: 'Midfielder' },
    { value: 'ATTACKER', label: 'Attacker' },
    { value: 'FACE_OFF_SPECIALIST', label: 'Face-Off Specialist' },
    { value: 'LONG_STICK_MIDFIELDER', label: 'Long Stick Midfielder' },
  ],
  AUSTRALIAN_RULES: [
    { value: 'FULL_BACK', label: 'Full Back' },
    { value: 'BACK_POCKET', label: 'Back Pocket' },
    { value: 'CENTRE_HALF_BACK', label: 'Centre Half Back' },
    { value: 'HALF_BACK_FLANK', label: 'Half Back Flank' },
    { value: 'WING', label: 'Wing' },
    { value: 'CENTRE', label: 'Centre' },
    { value: 'HALF_FORWARD_FLANK', label: 'Half Forward Flank' },
    { value: 'CENTRE_HALF_FORWARD', label: 'Centre Half Forward' },
    { value: 'FORWARD_POCKET', label: 'Forward Pocket' },
    { value: 'FULL_FORWARD', label: 'Full Forward' },
    { value: 'RUCKMAN', label: 'Ruckman' },
    { value: 'RUCK_ROVER', label: 'Ruck Rover' },
    { value: 'ROVER', label: 'Rover' },
  ],
  GAELIC_FOOTBALL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper' },
    { value: 'CORNER_BACK', label: 'Corner Back' },
    { value: 'FULL_BACK', label: 'Full Back' },
    { value: 'HALF_BACK', label: 'Half Back' },
    { value: 'MIDFIELDER', label: 'Midfielder' },
    { value: 'HALF_FORWARD', label: 'Half Forward' },
    { value: 'CORNER_FORWARD', label: 'Corner Forward' },
    { value: 'FULL_FORWARD', label: 'Full Forward' },
  ],
  FUTSAL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper' },
    { value: 'DEFENDER', label: 'Defender (Fixo)' },
    { value: 'WINGER', label: 'Winger (Ala)' },
    { value: 'PIVOT', label: 'Pivot' },
    { value: 'UNIVERSAL', label: 'Universal' },
  ],
  BEACH_FOOTBALL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper' },
    { value: 'DEFENDER', label: 'Defender' },
    { value: 'WINGER', label: 'Winger' },
    { value: 'STRIKER', label: 'Striker' },
  ],
};

// ============================================================================
// SPORT CONFIGURATION (Icons, Colors, Names)
// ============================================================================

export interface SportConfig {
  name: string;
  shortName: string;
  icon: typeof Dribbble;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  primaryStat: string;
  secondaryStat: string;
  teamSize: number;
  matchDuration: string;
}

export const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  FOOTBALL: {
    name: 'Football',
    shortName: 'Football',
    icon: Dribbble,
    color: '#22c55e',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-500',
    borderColor: 'border-green-500/20',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    teamSize: 11,
    matchDuration: '90 min',
  },
  RUGBY: {
    name: 'Rugby',
    shortName: 'Rugby',
    icon: Shield,
    color: '#8b5cf6',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-500',
    borderColor: 'border-violet-500/20',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    primaryStat: 'Tries',
    secondaryStat: 'Conversions',
    teamSize: 15,
    matchDuration: '80 min',
  },
  CRICKET: {
    name: 'Cricket',
    shortName: 'Cricket',
    icon: Target,
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-500/20',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    primaryStat: 'Runs',
    secondaryStat: 'Wickets',
    teamSize: 11,
    matchDuration: 'Variable',
  },
  BASKETBALL: {
    name: 'Basketball',
    shortName: 'Basketball',
    icon: Circle,
    color: '#ef4444',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    borderColor: 'border-red-500/20',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-rose-600',
    primaryStat: 'Points',
    secondaryStat: 'Rebounds',
    teamSize: 5,
    matchDuration: '48 min',
  },
  AMERICAN_FOOTBALL: {
    name: 'American Football',
    shortName: 'NFL',
    icon: Hexagon,
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500/20',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
    primaryStat: 'Touchdowns',
    secondaryStat: 'Yards',
    teamSize: 11,
    matchDuration: '60 min',
  },
  HOCKEY: {
    name: 'Hockey',
    shortName: 'Hockey',
    icon: Zap,
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/20',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-teal-600',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    teamSize: 11,
    matchDuration: '70 min',
  },
  NETBALL: {
    name: 'Netball',
    shortName: 'Netball',
    icon: Users,
    color: '#ec4899',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-500',
    borderColor: 'border-pink-500/20',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    teamSize: 7,
    matchDuration: '60 min',
  },
  LACROSSE: {
    name: 'Lacrosse',
    shortName: 'Lacrosse',
    icon: Triangle,
    color: '#14b8a6',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-500',
    borderColor: 'border-teal-500/20',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-emerald-600',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    teamSize: 10,
    matchDuration: '60 min',
  },
  AUSTRALIAN_RULES: {
    name: 'Australian Rules',
    shortName: 'AFL',
    icon: Square,
    color: '#eab308',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-500',
    borderColor: 'border-yellow-500/20',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-amber-600',
    primaryStat: 'Goals',
    secondaryStat: 'Behinds',
    teamSize: 18,
    matchDuration: '80 min',
  },
  GAELIC_FOOTBALL: {
    name: 'Gaelic Football',
    shortName: 'GAA',
    icon: Star,
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/20',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-600',
    primaryStat: 'Goals',
    secondaryStat: 'Points',
    teamSize: 15,
    matchDuration: '70 min',
  },
  FUTSAL: {
    name: 'Futsal',
    shortName: 'Futsal',
    icon: Award,
    color: '#f97316',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-500',
    borderColor: 'border-orange-500/20',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-600',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    teamSize: 5,
    matchDuration: '40 min',
  },
  BEACH_FOOTBALL: {
    name: 'Beach Football',
    shortName: 'Beach',
    icon: Activity,
    color: '#0ea5e9',
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-500',
    borderColor: 'border-sky-500/20',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-blue-600',
    primaryStat: 'Goals',
    secondaryStat: 'Assists',
    teamSize: 5,
    matchDuration: '36 min',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get positions for a specific sport
 */
export function getPositionsForSport(sport: Sport): { value: string; label: string }[] {
  return SPORT_POSITIONS[sport] || [];
}

/**
 * Get sport configuration
 */
export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIGS[sport] || SPORT_CONFIGS.FOOTBALL;
}

/**
 * Get stat labels for a sport
 */
export function getStatLabels(sport: Sport): { primary: string; secondary: string } {
  const config = getSportConfig(sport);
  return {
    primary: config.primaryStat,
    secondary: config.secondaryStat,
  };
}

/**
 * Get all sports as options for select inputs
 */
export function getSportOptions(): { value: Sport; label: string }[] {
  return Object.entries(SPORT_CONFIGS).map(([value, config]) => ({
    value: value as Sport,
    label: config.name,
  }));
}

/**
 * Format position for display
 */
export function formatPosition(position: string, sport?: Sport): string {
  if (!sport) {
    // Try to find in any sport
    for (const positions of Object.values(SPORT_POSITIONS)) {
      const found = positions.find((p) => p.value === position);
      if (found) return found.label;
    }
    return position.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const positions = SPORT_POSITIONS[sport];
  const found = positions?.find((p) => p.value === position);
  return found?.label || position;
}

// ============================================================================
// STATUS CONFIGURATIONS
// ============================================================================

export const PLAYER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
  { value: 'INJURED', label: 'Injured', color: 'red' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'orange' },
  { value: 'ON_LOAN', label: 'On Loan', color: 'blue' },
  { value: 'TRIAL', label: 'Trial', color: 'purple' },
] as const;

export const PREFERRED_FOOT_OPTIONS = [
  { value: 'LEFT', label: 'Left' },
  { value: 'RIGHT', label: 'Right' },
  { value: 'BOTH', label: 'Both' },
] as const;

export const AGE_GROUP_OPTIONS = [
  { value: 'U8', label: 'Under 8' },
  { value: 'U9', label: 'Under 9' },
  { value: 'U10', label: 'Under 10' },
  { value: 'U11', label: 'Under 11' },
  { value: 'U12', label: 'Under 12' },
  { value: 'U13', label: 'Under 13' },
  { value: 'U14', label: 'Under 14' },
  { value: 'U15', label: 'Under 15' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U17', label: 'Under 17' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U19', label: 'Under 19' },
  { value: 'U21', label: 'Under 21' },
  { value: 'U23', label: 'Under 23' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'VETERAN', label: 'Veteran (35+)' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'MIXED', label: 'Mixed' },
] as const;

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'PLAYER'
  | 'COACH'
  | 'MANAGER'
  | 'SCOUT'
  | 'ANALYST'
  | 'PARENT'
  | 'MEDICAL_STAFF';

export interface PlayerPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: 'own' | 'children' | 'squad' | 'club' | 'all';
}

/**
 * Get player permissions based on user role
 */
export function getPlayerPermissions(role: UserRole): PlayerPermissions {
  const permissions: Record<UserRole, PlayerPermissions> = {
    SUPERADMIN: { canView: true, canAdd: true, canEdit: true, canDelete: true, scope: 'all' },
    ADMIN: { canView: true, canAdd: true, canEdit: true, canDelete: true, scope: 'all' },
    MANAGER: { canView: true, canAdd: true, canEdit: true, canDelete: true, scope: 'club' },
    COACH: { canView: true, canAdd: true, canEdit: true, canDelete: false, scope: 'squad' },
    SCOUT: { canView: true, canAdd: true, canEdit: false, canDelete: false, scope: 'all' },
    ANALYST: { canView: true, canAdd: false, canEdit: false, canDelete: false, scope: 'all' },
    PARENT: { canView: true, canAdd: true, canEdit: false, canDelete: false, scope: 'children' },
    PLAYER: { canView: true, canAdd: false, canEdit: true, canDelete: false, scope: 'own' },
    MEDICAL_STAFF: { canView: true, canAdd: false, canEdit: true, canDelete: false, scope: 'club' },
  };

  return permissions[role] || { canView: false, canAdd: false, canEdit: false, canDelete: false, scope: 'own' };
}
