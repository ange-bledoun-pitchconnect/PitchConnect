/**
 * ============================================================================
 * PitchConnect - User Roles & Job Configuration
 * ============================================================================
 * 
 * Central configuration for user roles, permissions, and job categories.
 * Aligned with Prisma Schema v7.10.1
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * ============================================================================
 */

import {
  Shield,
  User,
  Users,
  Trophy,
  Briefcase,
  Building2,
  Wallet,
  Whistle,
  Search,
  BarChart3,
  Heart,
  Baby,
  Award,
  Stethoscope,
  Camera,
  Star,
  UserCog,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// USER ROLE ENUM (Aligned with Prisma Schema)
// =============================================================================

export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'PLAYER'
  | 'PLAYER_PRO'
  | 'COACH'
  | 'COACH_PRO'
  | 'MANAGER'
  | 'CLUB_MANAGER'
  | 'CLUB_OWNER'
  | 'TREASURER'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST'
  | 'PARENT'
  | 'GUARDIAN'
  | 'LEAGUE_ADMIN'
  | 'MEDICAL_STAFF'
  | 'MEDIA_MANAGER'
  | 'FAN';

// =============================================================================
// ROLE CONFIGURATION
// =============================================================================

export interface RoleConfig {
  id: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  permissions: string[];
  dashboardPath: string;
  tier: 'admin' | 'professional' | 'staff' | 'user';
}

export const USER_ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  SUPERADMIN: {
    id: 'SUPERADMIN',
    label: 'Super Administrator',
    shortLabel: 'Super Admin',
    description: 'Full system access and control',
    icon: Shield,
    emoji: '🛡️',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-500',
    permissions: ['*'],
    dashboardPath: '/dashboard/superadmin',
    tier: 'admin',
  },
  ADMIN: {
    id: 'ADMIN',
    label: 'Administrator',
    shortLabel: 'Admin',
    description: 'System administration and management',
    icon: UserCog,
    emoji: '⚙️',
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-purple-500',
    permissions: ['admin:read', 'admin:write', 'users:manage'],
    dashboardPath: '/dashboard/admin',
    tier: 'admin',
  },
  PLAYER: {
    id: 'PLAYER',
    label: 'Player',
    shortLabel: 'Player',
    description: 'Amateur or recreational player',
    icon: User,
    emoji: '👤',
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-500',
    permissions: ['player:read', 'player:write', 'matches:view', 'training:view'],
    dashboardPath: '/dashboard/player',
    tier: 'user',
  },
  PLAYER_PRO: {
    id: 'PLAYER_PRO',
    label: 'Professional Player',
    shortLabel: 'Pro Player',
    description: 'Professional or semi-professional player',
    icon: Star,
    emoji: '⭐',
    color: 'amber',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-amber-500',
    permissions: ['player:read', 'player:write', 'matches:view', 'training:view', 'analytics:view', 'contracts:view'],
    dashboardPath: '/dashboard/player',
    tier: 'professional',
  },
  COACH: {
    id: 'COACH',
    label: 'Coach',
    shortLabel: 'Coach',
    description: 'Team coach or trainer',
    icon: GraduationCap,
    emoji: '📋',
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    gradientFrom: 'from-green-600',
    gradientTo: 'to-green-500',
    permissions: ['coach:read', 'coach:write', 'players:manage', 'training:manage', 'matches:manage'],
    dashboardPath: '/dashboard/coach',
    tier: 'staff',
  },
  COACH_PRO: {
    id: 'COACH_PRO',
    label: 'Professional Coach',
    shortLabel: 'Pro Coach',
    description: 'Licensed professional coach',
    icon: Trophy,
    emoji: '🏆',
    color: 'emerald',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-emerald-500',
    permissions: ['coach:read', 'coach:write', 'players:manage', 'training:manage', 'matches:manage', 'analytics:full', 'tactics:manage'],
    dashboardPath: '/dashboard/coach',
    tier: 'professional',
  },
  MANAGER: {
    id: 'MANAGER',
    label: 'Team Manager',
    shortLabel: 'Manager',
    description: 'Team operations manager',
    icon: Briefcase,
    emoji: '👔',
    color: 'indigo',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-indigo-500',
    permissions: ['manager:read', 'manager:write', 'team:manage', 'players:view', 'matches:manage'],
    dashboardPath: '/dashboard/manager',
    tier: 'staff',
  },
  CLUB_MANAGER: {
    id: 'CLUB_MANAGER',
    label: 'Club Manager',
    shortLabel: 'Club Mgr',
    description: 'Club-wide operations manager',
    icon: Building2,
    emoji: '🏢',
    color: 'cyan',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-cyan-500',
    permissions: ['club:read', 'club:write', 'teams:manage', 'staff:manage', 'finances:view'],
    dashboardPath: '/dashboard/club-manager',
    tier: 'professional',
  },
  CLUB_OWNER: {
    id: 'CLUB_OWNER',
    label: 'Club Owner',
    shortLabel: 'Owner',
    description: 'Club owner with full club access',
    icon: Award,
    emoji: '👑',
    color: 'yellow',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    gradientFrom: 'from-yellow-600',
    gradientTo: 'to-yellow-500',
    permissions: ['club:*', 'finances:full', 'staff:full', 'transfers:manage'],
    dashboardPath: '/dashboard/owner',
    tier: 'professional',
  },
  TREASURER: {
    id: 'TREASURER',
    label: 'Treasurer',
    shortLabel: 'Treasurer',
    description: 'Financial management and reporting',
    icon: Wallet,
    emoji: '💰',
    color: 'teal',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    textColor: 'text-teal-700 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800',
    gradientFrom: 'from-teal-600',
    gradientTo: 'to-teal-500',
    permissions: ['finances:read', 'finances:write', 'reports:financial'],
    dashboardPath: '/dashboard/treasurer',
    tier: 'staff',
  },
  REFEREE: {
    id: 'REFEREE',
    label: 'Referee',
    shortLabel: 'Referee',
    description: 'Match official',
    icon: Whistle,
    emoji: '🎯',
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    gradientFrom: 'from-orange-600',
    gradientTo: 'to-orange-500',
    permissions: ['matches:officiate', 'events:create', 'cards:issue'],
    dashboardPath: '/dashboard/referee',
    tier: 'staff',
  },
  SCOUT: {
    id: 'SCOUT',
    label: 'Scout',
    shortLabel: 'Scout',
    description: 'Talent scout and recruitment',
    icon: Search,
    emoji: '🔍',
    color: 'violet',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    textColor: 'text-violet-700 dark:text-violet-400',
    borderColor: 'border-violet-200 dark:border-violet-800',
    gradientFrom: 'from-violet-600',
    gradientTo: 'to-violet-500',
    permissions: ['scouting:read', 'scouting:write', 'players:view', 'reports:scouting'],
    dashboardPath: '/dashboard/scout',
    tier: 'staff',
  },
  ANALYST: {
    id: 'ANALYST',
    label: 'Analyst',
    shortLabel: 'Analyst',
    description: 'Performance and data analyst',
    icon: BarChart3,
    emoji: '📊',
    color: 'sky',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20',
    textColor: 'text-sky-700 dark:text-sky-400',
    borderColor: 'border-sky-200 dark:border-sky-800',
    gradientFrom: 'from-sky-600',
    gradientTo: 'to-sky-500',
    permissions: ['analytics:read', 'analytics:write', 'reports:analytics', 'data:export'],
    dashboardPath: '/dashboard/analyst',
    tier: 'staff',
  },
  PARENT: {
    id: 'PARENT',
    label: 'Parent',
    shortLabel: 'Parent',
    description: 'Parent of youth player',
    icon: Heart,
    emoji: '❤️',
    color: 'pink',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    textColor: 'text-pink-700 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800',
    gradientFrom: 'from-pink-600',
    gradientTo: 'to-pink-500',
    permissions: ['child:view', 'matches:view', 'training:view', 'communications:view'],
    dashboardPath: '/dashboard/parent',
    tier: 'user',
  },
  GUARDIAN: {
    id: 'GUARDIAN',
    label: 'Guardian',
    shortLabel: 'Guardian',
    description: 'Legal guardian of youth player',
    icon: Baby,
    emoji: '👶',
    color: 'rose',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    textColor: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-800',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-rose-500',
    permissions: ['child:view', 'child:consent', 'matches:view', 'training:view'],
    dashboardPath: '/dashboard/guardian',
    tier: 'user',
  },
  LEAGUE_ADMIN: {
    id: 'LEAGUE_ADMIN',
    label: 'League Administrator',
    shortLabel: 'League Admin',
    description: 'League management and oversight',
    icon: Trophy,
    emoji: '🏅',
    color: 'fuchsia',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    textColor: 'text-fuchsia-700 dark:text-fuchsia-400',
    borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
    gradientFrom: 'from-fuchsia-600',
    gradientTo: 'to-fuchsia-500',
    permissions: ['league:read', 'league:write', 'fixtures:manage', 'standings:manage', 'clubs:view'],
    dashboardPath: '/dashboard/league-admin',
    tier: 'professional',
  },
  MEDICAL_STAFF: {
    id: 'MEDICAL_STAFF',
    label: 'Medical Staff',
    shortLabel: 'Medical',
    description: 'Physio, doctor, or medical personnel',
    icon: Stethoscope,
    emoji: '🏥',
    color: 'lime',
    bgColor: 'bg-lime-50 dark:bg-lime-900/20',
    textColor: 'text-lime-700 dark:text-lime-400',
    borderColor: 'border-lime-200 dark:border-lime-800',
    gradientFrom: 'from-lime-600',
    gradientTo: 'to-lime-500',
    permissions: ['medical:read', 'medical:write', 'injuries:manage', 'players:medical'],
    dashboardPath: '/dashboard/medical',
    tier: 'staff',
  },
  MEDIA_MANAGER: {
    id: 'MEDIA_MANAGER',
    label: 'Media Manager',
    shortLabel: 'Media',
    description: 'Communications and media management',
    icon: Camera,
    emoji: '📸',
    color: 'slate',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    textColor: 'text-slate-700 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-800',
    gradientFrom: 'from-slate-600',
    gradientTo: 'to-slate-500',
    permissions: ['media:read', 'media:write', 'content:manage', 'social:manage'],
    dashboardPath: '/dashboard/media',
    tier: 'staff',
  },
  FAN: {
    id: 'FAN',
    label: 'Fan',
    shortLabel: 'Fan',
    description: 'Supporter and follower',
    icon: Users,
    emoji: '🙌',
    color: 'neutral',
    bgColor: 'bg-neutral-50 dark:bg-neutral-900/20',
    textColor: 'text-neutral-700 dark:text-neutral-400',
    borderColor: 'border-neutral-200 dark:border-neutral-800',
    gradientFrom: 'from-neutral-600',
    gradientTo: 'to-neutral-500',
    permissions: ['public:view', 'matches:view', 'news:view'],
    dashboardPath: '/dashboard/fan',
    tier: 'user',
  },
};

// =============================================================================
// ROLE HELPERS
// =============================================================================

export function getRoleConfig(role: UserRole): RoleConfig {
  return USER_ROLE_CONFIG[role] || USER_ROLE_CONFIG.FAN;
}

export function getRoleLabel(role: UserRole): string {
  return USER_ROLE_CONFIG[role]?.label || role;
}

export function getRolesByTier(tier: RoleConfig['tier']): UserRole[] {
  return Object.values(USER_ROLE_CONFIG)
    .filter((config) => config.tier === tier)
    .map((config) => config.id);
}

export function getAdminRoles(): UserRole[] {
  return getRolesByTier('admin');
}

export function getProfessionalRoles(): UserRole[] {
  return getRolesByTier('professional');
}

export function getStaffRoles(): UserRole[] {
  return getRolesByTier('staff');
}

export function getUserRoles(): UserRole[] {
  return getRolesByTier('user');
}

export function hasPermission(userRoles: UserRole[], permission: string): boolean {
  for (const role of userRoles) {
    const config = USER_ROLE_CONFIG[role];
    if (!config) continue;
    
    // Super admin has all permissions
    if (config.permissions.includes('*')) return true;
    
    // Check exact match
    if (config.permissions.includes(permission)) return true;
    
    // Check wildcard (e.g., 'club:*' matches 'club:read')
    const [category] = permission.split(':');
    if (config.permissions.includes(`${category}:*`)) return true;
    if (config.permissions.includes(`${category}:full`)) return true;
  }
  
  return false;
}

export function canAccessDashboard(userRoles: UserRole[], dashboardPath: string): boolean {
  for (const role of userRoles) {
    const config = USER_ROLE_CONFIG[role];
    if (!config) continue;
    
    // Super admin can access everything
    if (config.permissions.includes('*')) return true;
    
    // Check if role's dashboard path matches or is a parent of the target
    if (dashboardPath.startsWith(config.dashboardPath)) return true;
  }
  
  return false;
}

// =============================================================================
// JOB DEPARTMENT CONFIGURATION
// =============================================================================

export type JobDepartment =
  | 'COACHING'
  | 'MEDICAL'
  | 'MANAGEMENT'
  | 'ANALYSIS'
  | 'SUPPORT'
  | 'ADMINISTRATION'
  | 'MEDIA'
  | 'YOUTH_DEVELOPMENT'
  | 'SCOUTING'
  | 'COMMERCIAL';

export interface JobDepartmentConfig {
  id: JobDepartment;
  label: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  color: string;
  bgColor: string;
  textColor: string;
  positions: string[];
}

export const JOB_DEPARTMENT_CONFIG: Record<JobDepartment, JobDepartmentConfig> = {
  COACHING: {
    id: 'COACHING',
    label: 'Coaching',
    description: 'Technical and tactical coaching roles',
    icon: GraduationCap,
    emoji: '📋',
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-400',
    positions: [
      'Head Coach',
      'Assistant Coach',
      'First Team Coach',
      'Youth Coach',
      'Academy Coach',
      'Goalkeeping Coach',
      'Fitness Coach',
      'Strength & Conditioning Coach',
      'Skills Coach',
      'Set-Piece Coach',
    ],
  },
  MEDICAL: {
    id: 'MEDICAL',
    label: 'Medical',
    description: 'Medical and sports science roles',
    icon: Stethoscope,
    emoji: '🏥',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
    positions: [
      'Club Doctor',
      'Head Physiotherapist',
      'Physiotherapist',
      'Sports Therapist',
      'Sports Scientist',
      'Nutritionist',
      'Sports Psychologist',
      'Rehabilitation Specialist',
      'Massage Therapist',
    ],
  },
  MANAGEMENT: {
    id: 'MANAGEMENT',
    label: 'Management',
    description: 'Club and team management roles',
    icon: Briefcase,
    emoji: '👔',
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    positions: [
      'General Manager',
      'Club Manager',
      'Team Manager',
      'Operations Manager',
      'Football Director',
      'Technical Director',
      'Academy Director',
      'Facilities Manager',
      'Event Manager',
    ],
  },
  ANALYSIS: {
    id: 'ANALYSIS',
    label: 'Analysis',
    description: 'Performance and data analysis roles',
    icon: BarChart3,
    emoji: '📊',
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-400',
    positions: [
      'Performance Analyst',
      'Video Analyst',
      'Data Analyst',
      'Opposition Analyst',
      'First Team Analyst',
      'Academy Analyst',
      'Sports Data Scientist',
      'Tracking Data Analyst',
    ],
  },
  SUPPORT: {
    id: 'SUPPORT',
    label: 'Support',
    description: 'Operational support roles',
    icon: Users,
    emoji: '🤝',
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    positions: [
      'Kit Manager',
      'Equipment Manager',
      'Groundskeeper',
      'Stadium Manager',
      'Match Day Coordinator',
      'Travel Coordinator',
      'Player Liaison',
      'Hospitality Manager',
    ],
  },
  ADMINISTRATION: {
    id: 'ADMINISTRATION',
    label: 'Administration',
    description: 'Administrative and office roles',
    icon: Building2,
    emoji: '🏢',
    color: 'slate',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    textColor: 'text-slate-700 dark:text-slate-400',
    positions: [
      'Club Secretary',
      'Office Manager',
      'HR Manager',
      'Finance Manager',
      'Accountant',
      'Administrative Assistant',
      'Receptionist',
      'Legal Counsel',
    ],
  },
  MEDIA: {
    id: 'MEDIA',
    label: 'Media & Communications',
    description: 'Media and communications roles',
    icon: Camera,
    emoji: '📸',
    color: 'pink',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    textColor: 'text-pink-700 dark:text-pink-400',
    positions: [
      'Media Manager',
      'Press Officer',
      'Social Media Manager',
      'Content Creator',
      'Videographer',
      'Photographer',
      'Graphic Designer',
      'Communications Director',
    ],
  },
  YOUTH_DEVELOPMENT: {
    id: 'YOUTH_DEVELOPMENT',
    label: 'Youth Development',
    description: 'Youth and academy roles',
    icon: Baby,
    emoji: '🌱',
    color: 'lime',
    bgColor: 'bg-lime-50 dark:bg-lime-900/20',
    textColor: 'text-lime-700 dark:text-lime-400',
    positions: [
      'Academy Director',
      'Youth Development Manager',
      'Under-18 Coach',
      'Under-16 Coach',
      'Under-14 Coach',
      'Youth Coordinator',
      'Education & Welfare Officer',
      'Youth Scout',
    ],
  },
  SCOUTING: {
    id: 'SCOUTING',
    label: 'Scouting & Recruitment',
    description: 'Talent scouting and recruitment roles',
    icon: Search,
    emoji: '🔍',
    color: 'violet',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    textColor: 'text-violet-700 dark:text-violet-400',
    positions: [
      'Chief Scout',
      'Head of Recruitment',
      'First Team Scout',
      'Regional Scout',
      'International Scout',
      'Opposition Scout',
      'Recruitment Analyst',
      'Player Identification Specialist',
    ],
  },
  COMMERCIAL: {
    id: 'COMMERCIAL',
    label: 'Commercial',
    description: 'Commercial and business roles',
    icon: Wallet,
    emoji: '💼',
    color: 'amber',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    positions: [
      'Commercial Director',
      'Sponsorship Manager',
      'Partnerships Manager',
      'Ticket Sales Manager',
      'Merchandise Manager',
      'Business Development Manager',
      'Marketing Manager',
      'Fan Engagement Manager',
    ],
  },
};

// =============================================================================
// JOB TYPE CONFIGURATION
// =============================================================================

export type JobType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'VOLUNTEER'
  | 'SEASONAL'
  | 'TEMPORARY'
  | 'FREELANCE'
  | 'APPRENTICESHIP';

export interface JobTypeConfig {
  id: JobType;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const JOB_TYPE_CONFIG: Record<JobType, JobTypeConfig> = {
  FULL_TIME: {
    id: 'FULL_TIME',
    label: 'Full-time',
    shortLabel: 'FT',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-300',
  },
  PART_TIME: {
    id: 'PART_TIME',
    label: 'Part-time',
    shortLabel: 'PT',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-300',
  },
  CONTRACT: {
    id: 'CONTRACT',
    label: 'Contract',
    shortLabel: 'Contract',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-800 dark:text-purple-300',
  },
  INTERNSHIP: {
    id: 'INTERNSHIP',
    label: 'Internship',
    shortLabel: 'Intern',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-300',
  },
  VOLUNTEER: {
    id: 'VOLUNTEER',
    label: 'Volunteer',
    shortLabel: 'Vol',
    color: 'pink',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    textColor: 'text-pink-800 dark:text-pink-300',
  },
  SEASONAL: {
    id: 'SEASONAL',
    label: 'Seasonal',
    shortLabel: 'Season',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-800 dark:text-amber-300',
  },
  TEMPORARY: {
    id: 'TEMPORARY',
    label: 'Temporary',
    shortLabel: 'Temp',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-800 dark:text-gray-300',
  },
  FREELANCE: {
    id: 'FREELANCE',
    label: 'Freelance',
    shortLabel: 'Free',
    color: 'cyan',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-800 dark:text-cyan-300',
  },
  APPRENTICESHIP: {
    id: 'APPRENTICESHIP',
    label: 'Apprenticeship',
    shortLabel: 'Appr',
    color: 'teal',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-800 dark:text-teal-300',
  },
};

// =============================================================================
// EXPERIENCE LEVEL CONFIGURATION
// =============================================================================

export type ExperienceLevel =
  | 'ENTRY'
  | 'JUNIOR'
  | 'MID'
  | 'SENIOR'
  | 'LEAD'
  | 'MANAGER'
  | 'DIRECTOR'
  | 'EXECUTIVE';

export interface ExperienceLevelConfig {
  id: ExperienceLevel;
  label: string;
  yearsRange: string;
  order: number;
}

export const EXPERIENCE_LEVEL_CONFIG: Record<ExperienceLevel, ExperienceLevelConfig> = {
  ENTRY: { id: 'ENTRY', label: 'Entry Level', yearsRange: '0-1 years', order: 1 },
  JUNIOR: { id: 'JUNIOR', label: 'Junior', yearsRange: '1-2 years', order: 2 },
  MID: { id: 'MID', label: 'Mid Level', yearsRange: '2-5 years', order: 3 },
  SENIOR: { id: 'SENIOR', label: 'Senior', yearsRange: '5-8 years', order: 4 },
  LEAD: { id: 'LEAD', label: 'Lead', yearsRange: '8-10 years', order: 5 },
  MANAGER: { id: 'MANAGER', label: 'Manager', yearsRange: '10+ years', order: 6 },
  DIRECTOR: { id: 'DIRECTOR', label: 'Director', yearsRange: '12+ years', order: 7 },
  EXECUTIVE: { id: 'EXECUTIVE', label: 'Executive', yearsRange: '15+ years', order: 8 },
};

// =============================================================================
// EXPORT FILE TYPES
// =============================================================================

export type ExportFileType =
  | 'players'
  | 'teams'
  | 'clubs'
  | 'leagues'
  | 'standings'
  | 'matches'
  | 'fixtures'
  | 'events'
  | 'training'
  | 'analytics'
  | 'injuries'
  | 'transfers'
  | 'contracts'
  | 'finances';

export interface ExportFileTypeConfig {
  id: ExportFileType;
  label: string;
  description: string;
  icon: LucideIcon;
  requiredRoles: UserRole[];
}

export const EXPORT_FILE_TYPE_CONFIG: Record<ExportFileType, ExportFileTypeConfig> = {
  players: {
    id: 'players',
    label: 'Player Statistics',
    description: 'Player profiles, stats, and performance data',
    icon: User,
    requiredRoles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
  },
  teams: {
    id: 'teams',
    label: 'Team Data',
    description: 'Team rosters, formations, and statistics',
    icon: Users,
    requiredRoles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
  },
  clubs: {
    id: 'clubs',
    label: 'Club Information',
    description: 'Club profiles, facilities, and staff',
    icon: Building2,
    requiredRoles: ['CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
  },
  leagues: {
    id: 'leagues',
    label: 'League Data',
    description: 'League structures, rules, and participants',
    icon: Trophy,
    requiredRoles: ['LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
  },
  standings: {
    id: 'standings',
    label: 'League Standings',
    description: 'Current league tables and rankings',
    icon: BarChart3,
    requiredRoles: ['COACH', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
  },
  matches: {
    id: 'matches',
    label: 'Match Results',
    description: 'Completed match details and outcomes',
    icon: Trophy,
    requiredRoles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
  },
  fixtures: {
    id: 'fixtures',
    label: 'Fixtures',
    description: 'Upcoming match schedules',
    icon: Trophy,
    requiredRoles: ['COACH', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
  },
  events: {
    id: 'events',
    label: 'Match Events',
    description: 'Goals, cards, substitutions, and other events',
    icon: Trophy,
    requiredRoles: ['COACH', 'COACH_PRO', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
  },
  training: {
    id: 'training',
    label: 'Training Sessions',
    description: 'Training plans, attendance, and performance',
    icon: GraduationCap,
    requiredRoles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'ADMIN', 'SUPERADMIN'],
  },
  analytics: {
    id: 'analytics',
    label: 'Performance Reports',
    description: 'Advanced analytics and performance metrics',
    icon: BarChart3,
    requiredRoles: ['COACH_PRO', 'ANALYST', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
  injuries: {
    id: 'injuries',
    label: 'Injury Reports',
    description: 'Injury records and rehabilitation progress',
    icon: Stethoscope,
    requiredRoles: ['MEDICAL_STAFF', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'ADMIN', 'SUPERADMIN'],
  },
  transfers: {
    id: 'transfers',
    label: 'Transfer History',
    description: 'Player transfers and loan records',
    icon: Users,
    requiredRoles: ['CLUB_MANAGER', 'CLUB_OWNER', 'SCOUT', 'ADMIN', 'SUPERADMIN'],
  },
  contracts: {
    id: 'contracts',
    label: 'Contracts',
    description: 'Player and staff contract details',
    icon: Briefcase,
    requiredRoles: ['CLUB_MANAGER', 'CLUB_OWNER', 'TREASURER', 'ADMIN', 'SUPERADMIN'],
  },
  finances: {
    id: 'finances',
    label: 'Financial Reports',
    description: 'Budget, expenses, and revenue data',
    icon: Wallet,
    requiredRoles: ['TREASURER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getJobDepartmentConfig(department: JobDepartment): JobDepartmentConfig {
  return JOB_DEPARTMENT_CONFIG[department];
}

export function getJobTypeConfig(type: JobType): JobTypeConfig {
  return JOB_TYPE_CONFIG[type];
}

export function getExperienceLevelConfig(level: ExperienceLevel): ExperienceLevelConfig {
  return EXPERIENCE_LEVEL_CONFIG[level];
}

export function getExportFileTypeConfig(fileType: ExportFileType): ExportFileTypeConfig {
  return EXPORT_FILE_TYPE_CONFIG[fileType];
}

export function canExportFileType(userRoles: UserRole[], fileType: ExportFileType): boolean {
  const config = EXPORT_FILE_TYPE_CONFIG[fileType];
  if (!config) return false;
  
  return userRoles.some((role) => config.requiredRoles.includes(role));
}

export function getAvailableExportTypes(userRoles: UserRole[]): ExportFileType[] {
  return Object.keys(EXPORT_FILE_TYPE_CONFIG).filter((fileType) =>
    canExportFileType(userRoles, fileType as ExportFileType)
  ) as ExportFileType[];
}

// =============================================================================
// ALL USER ROLES (for iteration)
// =============================================================================

export const ALL_USER_ROLES: UserRole[] = Object.keys(USER_ROLE_CONFIG) as UserRole[];

export const ALL_JOB_DEPARTMENTS: JobDepartment[] = Object.keys(JOB_DEPARTMENT_CONFIG) as JobDepartment[];

export const ALL_JOB_TYPES: JobType[] = Object.keys(JOB_TYPE_CONFIG) as JobType[];

export const ALL_EXPERIENCE_LEVELS: ExperienceLevel[] = Object.values(EXPERIENCE_LEVEL_CONFIG)
  .sort((a, b) => a.order - b.order)
  .map((config) => config.id);

export const ALL_EXPORT_FILE_TYPES: ExportFileType[] = Object.keys(EXPORT_FILE_TYPE_CONFIG) as ExportFileType[];
