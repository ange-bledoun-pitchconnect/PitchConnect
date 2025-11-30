/**
 * Football Player Avatar System
 * Deterministic avatar selection based on user email
 * @module football-avatars
 */

// ========================================
// CONSTANTS
// ========================================

export const FOOTBALL_AVATAR_STYLES = {
  STRIKERS: [
    'avataaars?seed=striker-ronaldo&face=happy',
    'avataaars?seed=striker-messi&face=grinning',
    'avataaars?seed=striker-salah&face=smile',
    'avataaars?seed=striker-haaland&face=laughing',
    'avataaars?seed=striker-kane&face=satisfied',
  ] as const,
  MIDFIELDERS: [
    'avataaars?seed=midfielder-kdb&face=dizzy',
    'avataaars?seed=midfielder-bruno&face=expressionless',
    'avataaars?seed=midfielder-pedri&face=concerned',
    'avataaars?seed=midfielder-foden&face=anguished',
  ] as const,
  DEFENDERS: [
    'avataaars?seed=defender-vvd&face=grinning',
    'avataaars?seed=defender-ramos&face=grimacing',
    'avataaars?seed=defender-dias&face=kissing',
    'avataaars?seed=defender-cancelo&face=wink',
  ] as const,
  GOALKEEPERS: [
    'avataaars?seed=goalkeeper-neuer&face=relaxed',
    'avataaars?seed=goalkeeper-allisson&face=relieved',
    'avataaars?seed=goalkeeper-ederson&face=sunglasses',
  ] as const,
} as const;

// ========================================
// TYPES
// ========================================

export type PlayerPosition =
  | 'FORWARD'
  | 'MIDFIELDER'
  | 'DEFENDER'
  | 'GOALKEEPER'
  | 'UNKNOWN';

export interface AvatarConfig {
  position?: PlayerPosition;
  seed: string;
  style: string;
}

export interface PositionColor {
  bg: string;
  text: string;
}

// ========================================
// COLOR MAPPING
// ========================================

export const POSITION_COLORS: Record<PlayerPosition, PositionColor> = {
  FORWARD: { bg: '#EF4444', text: '#FFFFFF' },
  MIDFIELDER: { bg: '#3B82F6', text: '#FFFFFF' },
  DEFENDER: { bg: '#10B981', text: '#FFFFFF' },
  GOALKEEPER: { bg: '#F59E0B', text: '#FFFFFF' },
  UNKNOWN: { bg: '#6B21A8', text: '#FFFFFF' },
} as const;

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Hash function to create consistent integer from string
 * Uses a simple hash algorithm for deterministic results
 * @param str - String to hash (typically email)
 * @returns Positive integer hash
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get position-specific avatar pool or all avatars if no position
 * @param position - Player position
 * @returns Array of avatar style strings
 */
function getAvatarPool(position?: PlayerPosition): readonly string[] {
  if (!position || position === 'UNKNOWN') {
    // Flatten all position-specific avatars into one array
    return [
      ...FOOTBALL_AVATAR_STYLES.STRIKERS,
      ...FOOTBALL_AVATAR_STYLES.MIDFIELDERS,
      ...FOOTBALL_AVATAR_STYLES.DEFENDERS,
      ...FOOTBALL_AVATAR_STYLES.GOALKEEPERS,
    ];
  }

  switch (position) {
    case 'FORWARD':
      return FOOTBALL_AVATAR_STYLES.STRIKERS;
    case 'MIDFIELDER':
      return FOOTBALL_AVATAR_STYLES.MIDFIELDERS;
    case 'DEFENDER':
      return FOOTBALL_AVATAR_STYLES.DEFENDERS;
    case 'GOALKEEPER':
      return FOOTBALL_AVATAR_STYLES.GOALKEEPERS;
    default:
      // Fallback to all avatars
      return [
        ...FOOTBALL_AVATAR_STYLES.STRIKERS,
        ...FOOTBALL_AVATAR_STYLES.MIDFIELDERS,
        ...FOOTBALL_AVATAR_STYLES.DEFENDERS,
        ...FOOTBALL_AVATAR_STYLES.GOALKEEPERS,
      ];
  }
}

// ========================================
// EXPORTED FUNCTIONS
// ========================================

/**
 * Generate deterministic avatar URL based on user email and position
 * The same email + position combination will always return the same avatar
 * @param email - User email address (used as seed)
 * @param position - Player position (optional)
 * @returns Full avatar URL from DiceBear API
 * @example
 * ```
 * const avatarUrl = generateFootballAvatar('player@example.com', 'FORWARD');
 * // Returns: https://api.dicebear.com/7.x/avataaars?seed=striker-ronaldo&face=happy
 * ```
 */
export function generateFootballAvatar(
  email: string,
  position?: PlayerPosition
): string {
  if (!email) {
    // Fallback for empty email
    return `https://api.dicebear.com/7.x/avataaars?seed=default-player&face=happy`;
  }

  const pool = getAvatarPool(position);
  const hash = hashCode(email);
  const selectedStyle = pool[hash % pool.length];

  return `https://api.dicebear.com/7.x/${selectedStyle}`;
}

/**
 * Get avatar initials for fallback display when image fails to load
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Two-character uppercase initials
 * @example
 * ```
 * getAvatarInitials('Cristiano', 'Ronaldo'); // Returns: 'CR'
 * ```
 */
export function getAvatarInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0) || '?';
  const lastInitial = lastName?.charAt(0) || '?';
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/**
 * Get color scheme for a player position
 * Used for badge backgrounds and fallback displays
 * @param position - Player position
 * @returns Object with background and text colors
 * @example
 * ```
 * const colors = getPositionColor('FORWARD');
 * // Returns: { bg: '#EF4444', text: '#FFFFFF' }
 * ```
 */
export function getPositionColor(position?: PlayerPosition): PositionColor {
  if (!position) return POSITION_COLORS.UNKNOWN;
  return POSITION_COLORS[position] || POSITION_COLORS.UNKNOWN;
}

/**
 * Validate if a string is a valid PlayerPosition
 * @param value - String to validate
 * @returns True if valid position
 */
export function isValidPosition(value: string): value is PlayerPosition {
  return ['FORWARD', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER', 'UNKNOWN'].includes(
    value
  );
}

/**
 * Get human-readable position name
 * @param position - Player position enum
 * @returns Formatted position name
 */
export function getPositionDisplayName(position: PlayerPosition): string {
  const displayNames: Record<PlayerPosition, string> = {
    FORWARD: 'Forward',
    MIDFIELDER: 'Midfielder',
    DEFENDER: 'Defender',
    GOALKEEPER: 'Goalkeeper',
    UNKNOWN: 'Unknown',
  };
  return displayNames[position] || 'Unknown';
}
