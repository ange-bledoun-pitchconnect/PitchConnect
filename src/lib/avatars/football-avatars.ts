/**
 * Football Player Avatar System
 * Deterministic avatar selection based on user email
 */

export const FOOTBALL_AVATAR_STYLES = {
  STRIKERS: [
    'avataaars?seed=striker-ronaldo&face=happy',
    'avataaars?seed=striker-messi&face=grinning',
    'avataaars?seed=striker-salah&face=smile',
    'avataaars?seed=striker-haaland&face=laughing',
    'avataaars?seed=striker-kane&face=satisfied',
  ],
  MIDFIELDERS: [
    'avataaars?seed=midfielder-kdb&face=dizzy',
    'avataaars?seed=midfielder-bruno&face=expressionless',
    'avataaars?seed=midfielder-pedri&face=concerned',
    'avataaars?seed=midfielder-foden&face=anguished',
  ],
  DEFENDERS: [
    'avataaars?seed=defender-vvd&face=grinning',
    'avataaars?seed=defender-ramos&face=grimacing',
    'avataaars?seed=defender-dias&face=kissing',
    'avataaars?seed=defender-cancelo&face=wink',
  ],
  GOALKEEPERS: [
    'avataaars?seed=goalkeeper-neuer&face=relaxed',
    'avataaars?seed=goalkeeper-allisson&face=relieved',
    'avataaars?seed=goalkeeper-ederson&face=sunglasses',
  ],
} as const;

export type PlayerPosition = 'FORWARD' | 'MIDFIELDER' | 'DEFENDER' | 'GOALKEEPER' | 'UNKNOWN';

export interface AvatarConfig {
  position?: PlayerPosition;
  seed: string;
  style: string;
}

/**
 * Hash function to create consistent integer from string
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
 * Get position-specific avatars or random from all
 */
function getAvatarPool(position?: PlayerPosition): string[] {
  if (!position || position === 'UNKNOWN') {
    return Object.values(FOOTBALL_AVATAR_STYLES).flat();
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
      return Object.values(FOOTBALL_AVATAR_STYLES).flat();
  }
}

/**
 * Generate deterministic avatar URL based on user email and position
 */
export function generateFootballAvatar(
  email: string,
  position?: PlayerPosition
): string {
  const pool = getAvatarPool(position);
  const hash = hashCode(email);
  const selectedStyle = pool[hash % pool.length];

  return `https://api.dicebear.com/7.x/${selectedStyle}`;
}

/**
 * Get avatar initials for fallback display
 */
export function getAvatarInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Color mapping for position-specific backgrounds
 */
export const POSITION_COLORS = {
  FORWARD: { bg: '#EF4444', text: '#FFFFFF' },
  MIDFIELDER: { bg: '#3B82F6', text: '#FFFFFF' },
  DEFENDER: { bg: '#10B981', text: '#FFFFFF' },
  GOALKEEPER: { bg: '#F59E0B', text: '#FFFFFF' },
  UNKNOWN: { bg: '#6B21A8', text: '#FFFFFF' },
} as const;

export function getPositionColor(position?: PlayerPosition) {
  if (!position) return POSITION_COLORS.UNKNOWN;
  return POSITION_COLORS[position] || POSITION_COLORS.UNKNOWN;
}
