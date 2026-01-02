/**
 * ============================================================================
 * 🎭 PITCHCONNECT AVATARS MODULE v7.10.1
 * ============================================================================
 * Multi-sport avatar generation system
 * Supports all 12 sports with position-based variations
 * Priority: User Upload > Sport Avatar > Generic Avatar
 * ============================================================================
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  Sport,
  PositionCategory,
  AvatarConfig,
  AvatarResult,
} from './avatars';

// =============================================================================
// FUNCTION EXPORTS
// =============================================================================

export {
  // Main avatar functions
  generateAvatar,
  generateAvatarResult,
  getInitials,
  
  // Sport helpers
  getSportIcon,
  getSportColors,
  
  // Position helpers
  getPositionCategory,
  getPositionColors,
  getPositionCategoryName,
  isValidPositionForSport,
  
  // Team/Org avatars
  generateTeamAvatar,
  generateOrgAvatar,
  
  // Constants
  SPORT_AVATAR_STYLES,
  POSITION_CATEGORY_COLORS,
} from './avatars';

// =============================================================================
// AVATAR SERVICE FACADE
// =============================================================================

import {
  generateAvatar,
  generateAvatarResult,
  getInitials,
  getSportIcon,
  getSportColors,
  getPositionCategory,
  getPositionColors,
  generateTeamAvatar,
  generateOrgAvatar,
} from './avatars';
import type { Sport, AvatarResult } from './avatars';

/**
 * Avatar Service - High-level API for avatar operations
 */
export const AvatarService = {
  /**
   * Generate player avatar URL
   */
  player: {
    generate: generateAvatar,
    generateWithFallback: generateAvatarResult,
    getInitials,
  },
  
  /**
   * Generate team/organization avatars
   */
  entity: {
    team: generateTeamAvatar,
    organization: generateOrgAvatar,
  },
  
  /**
   * Sport-related helpers
   */
  sport: {
    getIcon: getSportIcon,
    getColors: getSportColors,
  },
  
  /**
   * Position-related helpers
   */
  position: {
    getCategory: getPositionCategory,
    getColors: getPositionColors,
  },
};

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick avatar generation for common use cases
 */
export function quickAvatar(
  email: string,
  sport?: Sport,
  position?: string
): string {
  return generateAvatar(email, { sport, position });
}

/**
 * Generate avatar with full metadata
 */
export function fullAvatar(
  firstName: string,
  lastName: string,
  email: string,
  sport?: Sport,
  position?: string,
  customUrl?: string
): AvatarResult {
  return generateAvatarResult(firstName, lastName, email, {
    customAvatarUrl: customUrl,
    sport,
    position,
  });
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default AvatarService;
