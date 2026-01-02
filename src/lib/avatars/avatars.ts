/**
 * ============================================================================
 * 🎭 PITCHCONNECT AVATARS - MULTI-SPORT AVATAR SYSTEM v7.10.1
 * ============================================================================
 * Enterprise avatar generation for all 12 sports
 * Deterministic sport-themed avatars with position-based variations
 * Priority: User Upload > Sport Avatar > Generic Avatar
 * ============================================================================
 */

// =============================================================================
// TYPES
// =============================================================================

export type Sport = 
  | 'FOOTBALL' | 'RUGBY' | 'CRICKET' | 'BASKETBALL' | 'AMERICAN_FOOTBALL'
  | 'NETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

export type PositionCategory = 
  | 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD'
  | 'ALL_ROUNDER' | 'SPECIALIST' | 'UTILITY' | 'UNKNOWN';

export interface AvatarConfig {
  sport?: Sport;
  positionCategory?: PositionCategory;
  seed: string;
  style: string;
  clubColors?: { primary: string; secondary: string };
}

export interface AvatarResult {
  url: string;
  fallbackInitials: string;
  backgroundColor: string;
  textColor: string;
  sport?: Sport;
  isCustomUpload: boolean;
}

// =============================================================================
// SPORT AVATAR CONFIGURATIONS
// =============================================================================

/**
 * Sport-specific avatar seeds and styles
 * Using DiceBear avatars with sport-themed seeds
 */
export const SPORT_AVATAR_STYLES: Record<Sport, {
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  positions: Record<string, string[]>;
}> = {
  FOOTBALL: {
    icon: '⚽',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    positions: {
      GOALKEEPER: ['avataaars?seed=gk-buffon', 'avataaars?seed=gk-neuer', 'avataaars?seed=gk-casillas'],
      DEFENDER: ['avataaars?seed=def-ramos', 'avataaars?seed=def-maldini', 'avataaars?seed=def-silva'],
      MIDFIELDER: ['avataaars?seed=mid-xavi', 'avataaars?seed=mid-modric', 'avataaars?seed=mid-zidane'],
      FORWARD: ['avataaars?seed=fwd-ronaldo', 'avataaars?seed=fwd-messi', 'avataaars?seed=fwd-henry'],
    },
  },
  RUGBY: {
    icon: '🏉',
    primaryColor: '#7C3AED',
    secondaryColor: '#6D28D9',
    positions: {
      FORWARD: ['avataaars?seed=rugby-prop', 'avataaars?seed=rugby-hooker', 'avataaars?seed=rugby-lock'],
      SPECIALIST: ['avataaars?seed=rugby-flyhalf', 'avataaars?seed=rugby-scrumhalf'],
      DEFENDER: ['avataaars?seed=rugby-fullback', 'avataaars?seed=rugby-winger'],
      UTILITY: ['avataaars?seed=rugby-centre', 'avataaars?seed=rugby-flanker'],
    },
  },
  CRICKET: {
    icon: '🏏',
    primaryColor: '#0EA5E9',
    secondaryColor: '#0284C7',
    positions: {
      SPECIALIST: ['avataaars?seed=cricket-batter', 'avataaars?seed=cricket-bowler'],
      ALL_ROUNDER: ['avataaars?seed=cricket-allrounder', 'avataaars?seed=cricket-captain'],
      GOALKEEPER: ['avataaars?seed=cricket-keeper'],
      UTILITY: ['avataaars?seed=cricket-fielder'],
    },
  },
  BASKETBALL: {
    icon: '🏀',
    primaryColor: '#F97316',
    secondaryColor: '#EA580C',
    positions: {
      FORWARD: ['avataaars?seed=bball-sf', 'avataaars?seed=bball-pf'],
      MIDFIELDER: ['avataaars?seed=bball-pg', 'avataaars?seed=bball-sg'],
      DEFENDER: ['avataaars?seed=bball-center'],
      UTILITY: ['avataaars?seed=bball-combo'],
    },
  },
  AMERICAN_FOOTBALL: {
    icon: '🏈',
    primaryColor: '#DC2626',
    secondaryColor: '#B91C1C',
    positions: {
      SPECIALIST: ['avataaars?seed=nfl-qb', 'avataaars?seed=nfl-kicker'],
      FORWARD: ['avataaars?seed=nfl-rb', 'avataaars?seed=nfl-wr', 'avataaars?seed=nfl-te'],
      DEFENDER: ['avataaars?seed=nfl-lb', 'avataaars?seed=nfl-cb', 'avataaars?seed=nfl-safety'],
      UTILITY: ['avataaars?seed=nfl-lineman', 'avataaars?seed=nfl-de'],
    },
  },
  NETBALL: {
    icon: '🏐',
    primaryColor: '#EC4899',
    secondaryColor: '#DB2777',
    positions: {
      FORWARD: ['avataaars?seed=netball-gs', 'avataaars?seed=netball-ga'],
      MIDFIELDER: ['avataaars?seed=netball-wa', 'avataaars?seed=netball-c', 'avataaars?seed=netball-wd'],
      DEFENDER: ['avataaars?seed=netball-gd', 'avataaars?seed=netball-gk'],
      UTILITY: ['avataaars?seed=netball-utility'],
    },
  },
  HOCKEY: {
    icon: '🏑',
    primaryColor: '#14B8A6',
    secondaryColor: '#0D9488',
    positions: {
      GOALKEEPER: ['avataaars?seed=hockey-gk'],
      DEFENDER: ['avataaars?seed=hockey-def', 'avataaars?seed=hockey-sweeper'],
      MIDFIELDER: ['avataaars?seed=hockey-mid', 'avataaars?seed=hockey-halfback'],
      FORWARD: ['avataaars?seed=hockey-striker', 'avataaars?seed=hockey-inside'],
    },
  },
  LACROSSE: {
    icon: '🥍',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    positions: {
      GOALKEEPER: ['avataaars?seed=lacrosse-goalie'],
      DEFENDER: ['avataaars?seed=lacrosse-def', 'avataaars?seed=lacrosse-lsm'],
      MIDFIELDER: ['avataaars?seed=lacrosse-mid', 'avataaars?seed=lacrosse-fogo'],
      FORWARD: ['avataaars?seed=lacrosse-attack'],
    },
  },
  AUSTRALIAN_RULES: {
    icon: '🏉',
    primaryColor: '#FBBF24',
    secondaryColor: '#F59E0B',
    positions: {
      FORWARD: ['avataaars?seed=afl-fullforward', 'avataaars?seed=afl-forward'],
      MIDFIELDER: ['avataaars?seed=afl-mid', 'avataaars?seed=afl-ruck', 'avataaars?seed=afl-rover'],
      DEFENDER: ['avataaars?seed=afl-fullback', 'avataaars?seed=afl-halfback'],
      UTILITY: ['avataaars?seed=afl-utility', 'avataaars?seed=afl-wing'],
    },
  },
  GAELIC_FOOTBALL: {
    icon: '🏐',
    primaryColor: '#22C55E',
    secondaryColor: '#16A34A',
    positions: {
      GOALKEEPER: ['avataaars?seed=gaa-gk'],
      DEFENDER: ['avataaars?seed=gaa-fullback', 'avataaars?seed=gaa-halfback'],
      MIDFIELDER: ['avataaars?seed=gaa-mid'],
      FORWARD: ['avataaars?seed=gaa-halfforward', 'avataaars?seed=gaa-fullforward'],
    },
  },
  FUTSAL: {
    icon: '⚽',
    primaryColor: '#6366F1',
    secondaryColor: '#4F46E5',
    positions: {
      GOALKEEPER: ['avataaars?seed=futsal-gk', 'avataaars?seed=futsal-flyingkeeper'],
      DEFENDER: ['avataaars?seed=futsal-fixo'],
      MIDFIELDER: ['avataaars?seed=futsal-ala'],
      FORWARD: ['avataaars?seed=futsal-pivot'],
    },
  },
  BEACH_FOOTBALL: {
    icon: '🏖️',
    primaryColor: '#F472B6',
    secondaryColor: '#EC4899',
    positions: {
      GOALKEEPER: ['avataaars?seed=beach-gk'],
      DEFENDER: ['avataaars?seed=beach-def'],
      FORWARD: ['avataaars?seed=beach-striker', 'avataaars?seed=beach-pivot'],
      UTILITY: ['avataaars?seed=beach-outfield'],
    },
  },
};

// =============================================================================
// POSITION CATEGORY COLORS
// =============================================================================

export const POSITION_CATEGORY_COLORS: Record<PositionCategory, { bg: string; text: string }> = {
  GOALKEEPER: { bg: '#F59E0B', text: '#FFFFFF' },
  DEFENDER: { bg: '#10B981', text: '#FFFFFF' },
  MIDFIELDER: { bg: '#3B82F6', text: '#FFFFFF' },
  FORWARD: { bg: '#EF4444', text: '#FFFFFF' },
  ALL_ROUNDER: { bg: '#8B5CF6', text: '#FFFFFF' },
  SPECIALIST: { bg: '#EC4899', text: '#FFFFFF' },
  UTILITY: { bg: '#6B7280', text: '#FFFFFF' },
  UNKNOWN: { bg: '#6B21A8', text: '#FFFFFF' },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Hash function for deterministic selection
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Map position string to category
 */
export function getPositionCategory(position: string, sport?: Sport): PositionCategory {
  const upper = position.toUpperCase();
  
  // Goalkeeper variations
  if (upper.includes('GOALKEEPER') || upper.includes('KEEPER') || upper === 'GK') {
    return 'GOALKEEPER';
  }
  
  // Defender variations
  if (upper.includes('BACK') || upper.includes('DEFENDER') || upper.includes('DEFENCE') ||
      upper.includes('FIXO') || upper.includes('SWEEPER')) {
    return 'DEFENDER';
  }
  
  // Midfielder variations
  if (upper.includes('MIDFIELDER') || upper.includes('MIDFIELD') || upper.includes('CENTRE') ||
      upper.includes('ALA') || upper.includes('WING') && !upper.includes('WINGER')) {
    return 'MIDFIELDER';
  }
  
  // Forward variations
  if (upper.includes('FORWARD') || upper.includes('STRIKER') || upper.includes('WINGER') ||
      upper.includes('ATTACK') || upper.includes('PIVOT')) {
    return 'FORWARD';
  }
  
  // All-rounder (cricket, etc.)
  if (upper.includes('ALL_ROUNDER') || upper.includes('ALLROUNDER')) {
    return 'ALL_ROUNDER';
  }
  
  // Specialist positions
  if (upper.includes('QUARTERBACK') || upper.includes('FLY_HALF') || upper.includes('SCRUM_HALF') ||
      upper.includes('KICKER') || upper.includes('PUNTER') || upper.includes('BOWLER') ||
      upper.includes('BATTER') || upper.includes('OPENER')) {
    return 'SPECIALIST';
  }
  
  // Utility
  if (upper.includes('UTILITY') || upper.includes('SUBSTITUTE') || upper.includes('RESERVE')) {
    return 'UTILITY';
  }
  
  return 'UNKNOWN';
}

/**
 * Get avatar pool for sport and position
 */
function getAvatarPool(sport?: Sport, positionCategory?: PositionCategory): string[] {
  if (!sport) {
    // Return generic pool from all sports
    return Object.values(SPORT_AVATAR_STYLES)
      .flatMap(s => Object.values(s.positions).flat());
  }
  
  const sportConfig = SPORT_AVATAR_STYLES[sport];
  if (!sportConfig) {
    return ['avataaars?seed=default-player'];
  }
  
  if (positionCategory && sportConfig.positions[positionCategory]) {
    return sportConfig.positions[positionCategory];
  }
  
  // Return all positions for the sport
  return Object.values(sportConfig.positions).flat();
}

// =============================================================================
// MAIN AVATAR FUNCTIONS
// =============================================================================

/**
 * Generate deterministic avatar URL based on user info
 * The same combination will always return the same avatar
 */
export function generateAvatar(
  identifier: string,
  options?: {
    sport?: Sport;
    position?: string;
    clubColors?: { primary: string; secondary: string };
  }
): string {
  if (!identifier) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=default-player`;
  }
  
  const positionCategory = options?.position 
    ? getPositionCategory(options.position, options.sport)
    : undefined;
  
  const pool = getAvatarPool(options?.sport, positionCategory);
  const hash = hashCode(identifier);
  const selectedStyle = pool[hash % pool.length];
  
  // Build URL with optional parameters
  let url = `https://api.dicebear.com/7.x/${selectedStyle}`;
  
  // Add club colors if provided
  if (options?.clubColors) {
    const bgColor = options.clubColors.primary.replace('#', '');
    url += `&backgroundColor=${bgColor}`;
  }
  
  return url;
}

/**
 * Generate complete avatar result with fallbacks
 */
export function generateAvatarResult(
  firstName: string,
  lastName: string,
  email: string,
  options?: {
    customAvatarUrl?: string;
    sport?: Sport;
    position?: string;
    clubColors?: { primary: string; secondary: string };
  }
): AvatarResult {
  // Priority 1: Custom upload
  if (options?.customAvatarUrl) {
    return {
      url: options.customAvatarUrl,
      fallbackInitials: getInitials(firstName, lastName),
      backgroundColor: POSITION_CATEGORY_COLORS.UNKNOWN.bg,
      textColor: POSITION_CATEGORY_COLORS.UNKNOWN.text,
      sport: options.sport,
      isCustomUpload: true,
    };
  }
  
  // Priority 2: Sport-themed avatar
  const positionCategory = options?.position
    ? getPositionCategory(options.position, options.sport)
    : 'UNKNOWN';
  
  const colors = options?.sport
    ? {
        bg: SPORT_AVATAR_STYLES[options.sport].primaryColor,
        text: '#FFFFFF',
      }
    : POSITION_CATEGORY_COLORS[positionCategory];
  
  return {
    url: generateAvatar(email, {
      sport: options?.sport,
      position: options?.position,
      clubColors: options?.clubColors,
    }),
    fallbackInitials: getInitials(firstName, lastName),
    backgroundColor: colors.bg,
    textColor: colors.text,
    sport: options?.sport,
    isCustomUpload: false,
  };
}

/**
 * Get initials for fallback display
 */
export function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0) || '?';
  const lastInitial = lastName?.charAt(0) || '?';
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/**
 * Get sport icon
 */
export function getSportIcon(sport: Sport): string {
  return SPORT_AVATAR_STYLES[sport]?.icon ?? '🏃';
}

/**
 * Get sport colors
 */
export function getSportColors(sport: Sport): { primary: string; secondary: string } {
  const config = SPORT_AVATAR_STYLES[sport];
  return {
    primary: config?.primaryColor ?? '#6B7280',
    secondary: config?.secondaryColor ?? '#4B5563',
  };
}

/**
 * Get position category colors
 */
export function getPositionColors(
  position: string,
  sport?: Sport
): { bg: string; text: string } {
  const category = getPositionCategory(position, sport);
  return POSITION_CATEGORY_COLORS[category];
}

/**
 * Check if position is valid for sport
 */
export function isValidPositionForSport(position: string, sport: Sport): boolean {
  const category = getPositionCategory(position, sport);
  const sportConfig = SPORT_AVATAR_STYLES[sport];
  return category !== 'UNKNOWN' && sportConfig?.positions[category] !== undefined;
}

/**
 * Get human-readable position category name
 */
export function getPositionCategoryName(category: PositionCategory): string {
  const names: Record<PositionCategory, string> = {
    GOALKEEPER: 'Goalkeeper',
    DEFENDER: 'Defender',
    MIDFIELDER: 'Midfielder',
    FORWARD: 'Forward',
    ALL_ROUNDER: 'All-Rounder',
    SPECIALIST: 'Specialist',
    UTILITY: 'Utility',
    UNKNOWN: 'Unknown',
  };
  return names[category];
}

// =============================================================================
// TEAM AVATAR FUNCTIONS
// =============================================================================

/**
 * Generate team/club avatar
 */
export function generateTeamAvatar(
  teamName: string,
  sport: Sport,
  clubColors?: { primary: string; secondary: string }
): string {
  const hash = hashCode(teamName);
  const bgColor = clubColors?.primary?.replace('#', '') ?? 
                  SPORT_AVATAR_STYLES[sport].primaryColor.replace('#', '');
  
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=${bgColor}`;
}

/**
 * Generate organization avatar
 */
export function generateOrgAvatar(
  orgName: string,
  brandColor?: string
): string {
  const bgColor = brandColor?.replace('#', '') ?? '6366F1';
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(orgName)}&backgroundColor=${bgColor}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  generateAvatar,
  generateAvatarResult,
  getInitials,
  getSportIcon,
  getSportColors,
  getPositionColors,
  getPositionCategory,
  getPositionCategoryName,
  isValidPositionForSport,
  generateTeamAvatar,
  generateOrgAvatar,
  SPORT_AVATAR_STYLES,
  POSITION_CATEGORY_COLORS,
};
