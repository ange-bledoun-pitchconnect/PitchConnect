/**
 * ============================================================================
 * 🏆 PITCHCONNECT - NOTIFICATION TYPES & TEMPLATES v8.0.0
 * ============================================================================
 * Path: src/lib/notifications/notification-types.ts
 *
 * FIXES:
 * ✅ Fixed Unicode encoding issues (proper emoji rendering)
 * ✅ Multi-sport notification templates
 * ✅ Aligned with NotificationType enum from Prisma schema
 * ✅ Type-safe notification preferences
 * ✅ Channel-specific templates (in-app, email, push, SMS)
 *
 * SCHEMA ALIGNMENT:
 * ✅ Uses NotificationType enum (all types from schema)
 * ✅ Compatible with Notification model
 * ✅ Compatible with NotificationPreference model
 * ============================================================================
 */

import type { NotificationType } from '@prisma/client';
import type { Sport } from '@prisma/client';
import { getSportConfig } from '@/lib/sports';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationTemplate {
  /** Notification type from Prisma enum */
  type: NotificationType;
  /** Display title template */
  title: string;
  /** Message body template */
  message: string;
  /** Emoji icon */
  icon: string;
  /** Default priority */
  priority: NotificationPriority;
  /** Channels this notification uses by default */
  defaultChannels: NotificationChannel[];
  /** Category for grouping */
  category: NotificationCategory;
  /** Whether notification can be batched */
  batchable: boolean;
  /** Time-to-live in hours (0 = no expiry) */
  ttlHours: number;
}

export type NotificationCategory =
  | 'SYSTEM'
  | 'MATCH'
  | 'TEAM'
  | 'TRAINING'
  | 'PLAYER'
  | 'COACH'
  | 'FINANCIAL'
  | 'ADMIN'
  | 'COMMUNICATION'
  | 'JOB'
  | 'SCOUTING'
  | 'ACHIEVEMENT'
  | 'DEVELOPMENT'
  | 'MEDICAL'
  | 'VIDEO';

export interface NotificationData {
  /** Notification type */
  type: NotificationType;
  /** Recipient user ID */
  userId: string;
  /** Title (supports template variables) */
  title: string;
  /** Message body (supports template variables) */
  message: string;
  /** Template variables */
  data?: Record<string, any>;
  /** Deep link URL */
  link?: string;
  /** Priority override */
  priority?: NotificationPriority;
  /** Channel overrides */
  channels?: NotificationChannel[];
  /** Sport type for sport-specific formatting */
  sport?: Sport;
  /** Expiration date */
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  matchReminders: boolean;
  trainingReminders: boolean;
  teamUpdates: boolean;
  performanceAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  disabledTypes: NotificationType[];
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

/**
 * All notification templates mapped by type
 * Uses proper Unicode emoji characters (not encoded)
 */
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  SYSTEM_ALERT: {
    type: 'SYSTEM_ALERT',
    title: '🔔 System Alert',
    message: '{{message}}',
    icon: '🔔',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'SYSTEM',
    batchable: false,
    ttlHours: 168, // 1 week
  },
  SYSTEM_MAINTENANCE: {
    type: 'SYSTEM_MAINTENANCE',
    title: '🔧 Scheduled Maintenance',
    message: 'PitchConnect will be undergoing maintenance on {{date}} from {{startTime}} to {{endTime}}.',
    icon: '🔧',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'SYSTEM',
    batchable: false,
    ttlHours: 72,
  },
  SYSTEM_UPDATE: {
    type: 'SYSTEM_UPDATE',
    title: '✨ New Features Available',
    message: "We've added new features to PitchConnect! {{description}}",
    icon: '✨',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'SYSTEM',
    batchable: true,
    ttlHours: 168,
  },
  ACCOUNT_UPDATE: {
    type: 'ACCOUNT_UPDATE',
    title: '👤 Account Updated',
    message: 'Your account settings have been updated.',
    icon: '👤',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'SYSTEM',
    batchable: false,
    ttlHours: 72,
  },
  PASSWORD_CHANGED: {
    type: 'PASSWORD_CHANGED',
    title: '🔐 Password Changed',
    message: 'Your password was successfully changed. If you did not make this change, please contact support immediately.',
    icon: '🔐',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'SYSTEM',
    batchable: false,
    ttlHours: 168,
  },
  EMAIL_VERIFIED: {
    type: 'EMAIL_VERIFIED',
    title: '✅ Email Verified',
    message: 'Your email address has been verified successfully.',
    icon: '✅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'SYSTEM',
    batchable: false,
    ttlHours: 24,
  },
  PROFILE_UPDATE: {
    type: 'PROFILE_UPDATE',
    title: '👤 Profile Updated',
    message: 'Your profile has been updated successfully.',
    icon: '👤',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'SYSTEM',
    batchable: false,
    ttlHours: 24,
  },
  SETTINGS_CHANGED: {
    type: 'SETTINGS_CHANGED',
    title: '⚙️ Settings Changed',
    message: 'Your {{settingName}} settings have been updated.',
    icon: '⚙️',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'SYSTEM',
    batchable: true,
    ttlHours: 24,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MATCH NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  MATCH_SCHEDULED: {
    type: 'MATCH_SCHEDULED',
    title: '📅 Match Scheduled',
    message: '{{homeTeam}} vs {{awayTeam}} has been scheduled for {{date}} at {{time}}.',
    icon: '📅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'MATCH',
    batchable: true,
    ttlHours: 168,
  },
  MATCH_REMINDER: {
    type: 'MATCH_REMINDER',
    title: '⏰ Match Reminder',
    message: 'Reminder: {{homeTeam}} vs {{awayTeam}} starts in {{timeUntil}}.',
    icon: '⏰',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 24,
  },
  MATCH_STARTING: {
    type: 'MATCH_STARTING',
    title: '🏟️ Match Starting Soon',
    message: '{{homeTeam}} vs {{awayTeam}} is about to begin!',
    icon: '🏟️',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 2,
  },
  MATCH_LIVE: {
    type: 'MATCH_LIVE',
    title: '🔴 Match Live',
    message: '{{homeTeam}} vs {{awayTeam}} is now live! Current score: {{homeScore}} - {{awayScore}}',
    icon: '🔴',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 4,
  },
  MATCH_HALFTIME: {
    type: 'MATCH_HALFTIME',
    title: '⏸️ Half Time',
    message: 'Half time: {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}',
    icon: '⏸️',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 2,
  },
  MATCH_FULLTIME: {
    type: 'MATCH_FULLTIME',
    title: '🏁 Full Time',
    message: 'Full time: {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}',
    icon: '🏁',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 24,
  },
  MATCH_CANCELLED: {
    type: 'MATCH_CANCELLED',
    title: '❌ Match Cancelled',
    message: 'The match {{homeTeam}} vs {{awayTeam}} on {{date}} has been cancelled. Reason: {{reason}}',
    icon: '❌',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 168,
  },
  MATCH_POSTPONED: {
    type: 'MATCH_POSTPONED',
    title: '📆 Match Postponed',
    message: 'The match {{homeTeam}} vs {{awayTeam}} has been postponed. {{newDate}}',
    icon: '📆',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 168,
  },
  MATCH_RESULT: {
    type: 'MATCH_RESULT',
    title: '📊 Match Result',
    message: 'Final result: {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}',
    icon: '📊',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'MATCH',
    batchable: true,
    ttlHours: 168,
  },
  MATCH_LINEUP_ANNOUNCED: {
    type: 'MATCH_LINEUP_ANNOUNCED',
    title: '📋 Lineup Announced',
    message: 'The lineup for {{homeTeam}} vs {{awayTeam}} has been announced.',
    icon: '📋',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 24,
  },
  MATCH_SQUAD_SELECTED: {
    type: 'MATCH_SQUAD_SELECTED',
    title: '✅ You\'re in the Squad!',
    message: 'Congratulations! You have been selected for {{homeTeam}} vs {{awayTeam}} on {{date}}.',
    icon: '✅',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 168,
  },
  MATCH_NOT_SELECTED: {
    type: 'MATCH_NOT_SELECTED',
    title: '📝 Squad Update',
    message: 'You have not been selected for {{homeTeam}} vs {{awayTeam}} on {{date}}.',
    icon: '📝',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'MATCH',
    batchable: false,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TEAM NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  TEAM_JOINED: {
    type: 'TEAM_JOINED',
    title: '🎉 Welcome to the Team!',
    message: 'You have successfully joined {{teamName}}.',
    icon: '🎉',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'TEAM',
    batchable: false,
    ttlHours: 168,
  },
  TEAM_LEFT: {
    type: 'TEAM_LEFT',
    title: '👋 Left Team',
    message: 'You have left {{teamName}}.',
    icon: '👋',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'TEAM',
    batchable: false,
    ttlHours: 72,
  },
  TEAM_INVITE: {
    type: 'TEAM_INVITE',
    title: '📨 Team Invitation',
    message: 'You have been invited to join {{teamName}} by {{inviterName}}.',
    icon: '📨',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'TEAM',
    batchable: false,
    ttlHours: 168,
  },
  TEAM_REMOVED: {
    type: 'TEAM_REMOVED',
    title: '🚫 Removed from Team',
    message: 'You have been removed from {{teamName}}.',
    icon: '🚫',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'TEAM',
    batchable: false,
    ttlHours: 168,
  },
  TEAM_UPDATE: {
    type: 'TEAM_UPDATE',
    title: '📢 Team Update',
    message: '{{teamName}}: {{message}}',
    icon: '📢',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'TEAM',
    batchable: true,
    ttlHours: 72,
  },
  TEAM_ANNOUNCEMENT: {
    type: 'TEAM_ANNOUNCEMENT',
    title: '📣 Team Announcement',
    message: '{{teamName}}: {{title}}',
    icon: '📣',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'TEAM',
    batchable: false,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TRAINING NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  TRAINING_SCHEDULED: {
    type: 'TRAINING_SCHEDULED',
    title: '🏋️ Training Scheduled',
    message: 'Training session scheduled for {{date}} at {{time}} - {{venue}}.',
    icon: '🏋️',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'TRAINING',
    batchable: true,
    ttlHours: 168,
  },
  TRAINING_REMINDER: {
    type: 'TRAINING_REMINDER',
    title: '⏰ Training Reminder',
    message: 'Training session starts in {{timeUntil}} at {{venue}}.',
    icon: '⏰',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'TRAINING',
    batchable: false,
    ttlHours: 24,
  },
  TRAINING_CANCELLED: {
    type: 'TRAINING_CANCELLED',
    title: '❌ Training Cancelled',
    message: 'Training on {{date}} has been cancelled. Reason: {{reason}}',
    icon: '❌',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'TRAINING',
    batchable: false,
    ttlHours: 72,
  },
  TRAINING_UPDATED: {
    type: 'TRAINING_UPDATED',
    title: '📝 Training Updated',
    message: 'Training details for {{date}} have been updated.',
    icon: '📝',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'TRAINING',
    batchable: false,
    ttlHours: 72,
  },
  TRAINING_ATTENDANCE_REQUIRED: {
    type: 'TRAINING_ATTENDANCE_REQUIRED',
    title: '📋 RSVP Required',
    message: 'Please confirm your attendance for training on {{date}}.',
    icon: '📋',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'TRAINING',
    batchable: false,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYER NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  PLAYER_INJURED: {
    type: 'PLAYER_INJURED',
    title: '🏥 Injury Reported',
    message: '{{playerName}} has been reported injured: {{injuryType}}',
    icon: '🏥',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'PLAYER',
    batchable: false,
    ttlHours: 168,
  },
  PLAYER_RECOVERED: {
    type: 'PLAYER_RECOVERED',
    title: '💪 Player Recovered',
    message: '{{playerName}} has recovered and is available for selection.',
    icon: '💪',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'PLAYER',
    batchable: true,
    ttlHours: 72,
  },
  PLAYER_CLEARED: {
    type: 'PLAYER_CLEARED',
    title: '✅ Medical Clearance',
    message: '{{playerName}} has been medically cleared to play.',
    icon: '✅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'PLAYER',
    batchable: false,
    ttlHours: 72,
  },
  PLAYER_MILESTONE: {
    type: 'PLAYER_MILESTONE',
    title: '🏆 Milestone Reached!',
    message: 'Congratulations! {{playerName}} reached {{milestone}}!',
    icon: '🏆',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'PLAYER',
    batchable: true,
    ttlHours: 168,
  },
  PLAYER_ACHIEVEMENT: {
    type: 'PLAYER_ACHIEVEMENT',
    title: '🌟 Achievement Unlocked!',
    message: '{{playerName}} unlocked: {{achievementName}}',
    icon: '🌟',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'PLAYER',
    batchable: true,
    ttlHours: 168,
  },
  PLAYER_TRANSFER: {
    type: 'PLAYER_TRANSFER',
    title: '🔄 Transfer Update',
    message: '{{playerName}} has been transferred to {{newTeam}}.',
    icon: '🔄',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'PLAYER',
    batchable: false,
    ttlHours: 168,
  },
  PLAYER_CONTRACT: {
    type: 'PLAYER_CONTRACT',
    title: '📝 Contract Update',
    message: 'Contract update for {{playerName}}: {{details}}',
    icon: '📝',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'PLAYER',
    batchable: false,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COACH NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  COACH_ASSIGNED: {
    type: 'COACH_ASSIGNED',
    title: '👨‍🏫 Coach Assigned',
    message: '{{coachName}} has been assigned as {{role}} for {{teamName}}.',
    icon: '👨‍🏫',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'COACH',
    batchable: false,
    ttlHours: 168,
  },
  COACH_UNASSIGNED: {
    type: 'COACH_UNASSIGNED',
    title: '📋 Coach Update',
    message: '{{coachName}} is no longer assigned to {{teamName}}.',
    icon: '📋',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'COACH',
    batchable: false,
    ttlHours: 72,
  },
  COACH_REVIEW: {
    type: 'COACH_REVIEW',
    title: '⭐ New Review',
    message: 'You have received a new review from {{reviewerName}}.',
    icon: '⭐',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'COACH',
    batchable: true,
    ttlHours: 168,
  },
  COACH_CERTIFICATION_EXPIRING: {
    type: 'COACH_CERTIFICATION_EXPIRING',
    title: '⚠️ Certification Expiring',
    message: 'Your {{certificationName}} certification expires on {{expiryDate}}.',
    icon: '⚠️',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'COACH',
    batchable: false,
    ttlHours: 336, // 2 weeks
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCIAL NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  PAYMENT_RECEIVED: {
    type: 'PAYMENT_RECEIVED',
    title: '💰 Payment Received',
    message: 'Payment of {{amount}} has been received for {{description}}.',
    icon: '💰',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 720, // 30 days
  },
  PAYMENT_DUE: {
    type: 'PAYMENT_DUE',
    title: '📅 Payment Due',
    message: 'Payment of {{amount}} for {{description}} is due on {{dueDate}}.',
    icon: '📅',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 336,
  },
  PAYMENT_OVERDUE: {
    type: 'PAYMENT_OVERDUE',
    title: '⚠️ Payment Overdue',
    message: 'Payment of {{amount}} for {{description}} is overdue.',
    icon: '⚠️',
    priority: 'URGENT',
    defaultChannels: ['IN_APP', 'EMAIL', 'SMS'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 720,
  },
  PAYMENT_FAILED: {
    type: 'PAYMENT_FAILED',
    title: '❌ Payment Failed',
    message: 'Payment of {{amount}} failed. Please update your payment method.',
    icon: '❌',
    priority: 'URGENT',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 168,
  },
  SUBSCRIPTION_RENEWED: {
    type: 'SUBSCRIPTION_RENEWED',
    title: '✅ Subscription Renewed',
    message: 'Your {{planName}} subscription has been renewed.',
    icon: '✅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 168,
  },
  SUBSCRIPTION_EXPIRING: {
    type: 'SUBSCRIPTION_EXPIRING',
    title: '⏰ Subscription Expiring',
    message: 'Your {{planName}} subscription expires on {{expiryDate}}.',
    icon: '⏰',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 336,
  },
  SUBSCRIPTION_CANCELLED: {
    type: 'SUBSCRIPTION_CANCELLED',
    title: '📝 Subscription Cancelled',
    message: 'Your {{planName}} subscription has been cancelled.',
    icon: '📝',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 168,
  },
  INVOICE_GENERATED: {
    type: 'INVOICE_GENERATED',
    title: '📄 Invoice Generated',
    message: 'Invoice #{{invoiceNumber}} for {{amount}} has been generated.',
    icon: '📄',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 720,
  },
  REFUND_PROCESSED: {
    type: 'REFUND_PROCESSED',
    title: '💵 Refund Processed',
    message: 'Refund of {{amount}} has been processed to your account.',
    icon: '💵',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'FINANCIAL',
    batchable: false,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  USER_REGISTERED: {
    type: 'USER_REGISTERED',
    title: '👤 New User Registered',
    message: '{{userName}} has registered with {{email}}.',
    icon: '👤',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'ADMIN',
    batchable: true,
    ttlHours: 72,
  },
  USER_SUSPENDED: {
    type: 'USER_SUSPENDED',
    title: '⚠️ Account Suspended',
    message: 'Your account has been suspended. Reason: {{reason}}',
    icon: '⚠️',
    priority: 'URGENT',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 720,
  },
  USER_BANNED: {
    type: 'USER_BANNED',
    title: '🚫 Account Banned',
    message: 'Your account has been banned. Reason: {{reason}}',
    icon: '🚫',
    priority: 'URGENT',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 0,
  },
  USER_UNBANNED: {
    type: 'USER_UNBANNED',
    title: '✅ Account Restored',
    message: 'Your account has been restored.',
    icon: '✅',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 168,
  },
  UPGRADE_REQUEST_SUBMITTED: {
    type: 'UPGRADE_REQUEST_SUBMITTED',
    title: '📤 Upgrade Request Submitted',
    message: 'Your upgrade request to {{planName}} has been submitted.',
    icon: '📤',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 168,
  },
  UPGRADE_REQUEST_APPROVED: {
    type: 'UPGRADE_REQUEST_APPROVED',
    title: '✅ Upgrade Approved',
    message: 'Your upgrade to {{planName}} has been approved!',
    icon: '✅',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 168,
  },
  UPGRADE_REQUEST_REJECTED: {
    type: 'UPGRADE_REQUEST_REJECTED',
    title: '❌ Upgrade Request Rejected',
    message: 'Your upgrade request has been rejected. Reason: {{reason}}',
    icon: '❌',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 168,
  },
  ROLE_CHANGED: {
    type: 'ROLE_CHANGED',
    title: '🔄 Role Updated',
    message: 'Your role has been changed to {{newRole}}.',
    icon: '🔄',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 168,
  },
  PERMISSION_CHANGED: {
    type: 'PERMISSION_CHANGED',
    title: '🔐 Permissions Updated',
    message: 'Your permissions have been updated.',
    icon: '🔐',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'ADMIN',
    batchable: false,
    ttlHours: 72,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMUNICATION NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  NEW_MESSAGE: {
    type: 'NEW_MESSAGE',
    title: '💬 New Message',
    message: '{{senderName}}: {{preview}}',
    icon: '💬',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'COMMUNICATION',
    batchable: true,
    ttlHours: 72,
  },
  MESSAGE_MENTION: {
    type: 'MESSAGE_MENTION',
    title: '📢 You were mentioned',
    message: '{{senderName}} mentioned you in {{channelName}}',
    icon: '📢',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'COMMUNICATION',
    batchable: false,
    ttlHours: 72,
  },
  ANNOUNCEMENT_POSTED: {
    type: 'ANNOUNCEMENT_POSTED',
    title: '📣 New Announcement',
    message: '{{title}}',
    icon: '📣',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'COMMUNICATION',
    batchable: false,
    ttlHours: 168,
  },
  COMMENT_RECEIVED: {
    type: 'COMMENT_RECEIVED',
    title: '💭 New Comment',
    message: '{{commenterName}} commented: {{preview}}',
    icon: '💭',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'COMMUNICATION',
    batchable: true,
    ttlHours: 72,
  },
  FEEDBACK_RECEIVED: {
    type: 'FEEDBACK_RECEIVED',
    title: '📝 Feedback Received',
    message: 'You received feedback from {{senderName}}.',
    icon: '📝',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'COMMUNICATION',
    batchable: true,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // JOB NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  JOB_POSTED: {
    type: 'JOB_POSTED',
    title: '💼 New Job Posted',
    message: '{{clubName}} is hiring: {{jobTitle}}',
    icon: '💼',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'JOB',
    batchable: true,
    ttlHours: 336,
  },
  JOB_APPLICATION_RECEIVED: {
    type: 'JOB_APPLICATION_RECEIVED',
    title: '📥 Application Received',
    message: 'New application for {{jobTitle}} from {{applicantName}}.',
    icon: '📥',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'JOB',
    batchable: true,
    ttlHours: 168,
  },
  JOB_APPLICATION_REVIEWED: {
    type: 'JOB_APPLICATION_REVIEWED',
    title: '👀 Application Reviewed',
    message: 'Your application for {{jobTitle}} has been reviewed.',
    icon: '👀',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'JOB',
    batchable: false,
    ttlHours: 168,
  },
  JOB_APPLICATION_ACCEPTED: {
    type: 'JOB_APPLICATION_ACCEPTED',
    title: '🎉 Application Accepted!',
    message: 'Congratulations! Your application for {{jobTitle}} has been accepted.',
    icon: '🎉',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'JOB',
    batchable: false,
    ttlHours: 336,
  },
  JOB_APPLICATION_REJECTED: {
    type: 'JOB_APPLICATION_REJECTED',
    title: '📝 Application Update',
    message: 'Your application for {{jobTitle}} was not successful.',
    icon: '📝',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'JOB',
    batchable: false,
    ttlHours: 168,
  },
  JOB_INTERVIEW_SCHEDULED: {
    type: 'JOB_INTERVIEW_SCHEDULED',
    title: '📅 Interview Scheduled',
    message: 'Interview for {{jobTitle}} scheduled for {{date}} at {{time}}.',
    icon: '📅',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL', 'PUSH'],
    category: 'JOB',
    batchable: false,
    ttlHours: 336,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCOUTING NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  SCOUTING_REPORT_SUBMITTED: {
    type: 'SCOUTING_REPORT_SUBMITTED',
    title: '🔍 Scouting Report Submitted',
    message: 'New scouting report for {{playerName}} by {{scoutName}}.',
    icon: '🔍',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'SCOUTING',
    batchable: true,
    ttlHours: 168,
  },
  WATCHLIST_PLAYER_ADDED: {
    type: 'WATCHLIST_PLAYER_ADDED',
    title: '⭐ Player Added to Watchlist',
    message: '{{playerName}} has been added to your watchlist.',
    icon: '⭐',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'SCOUTING',
    batchable: true,
    ttlHours: 72,
  },
  WATCHLIST_ALERT: {
    type: 'WATCHLIST_ALERT',
    title: '🔔 Watchlist Alert',
    message: '{{playerName}} from your watchlist: {{alertMessage}}',
    icon: '🔔',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'SCOUTING',
    batchable: false,
    ttlHours: 168,
  },
  PLAYER_RECOMMENDED: {
    type: 'PLAYER_RECOMMENDED',
    title: '💡 Player Recommendation',
    message: '{{scoutName}} recommends {{playerName}} for your consideration.',
    icon: '💡',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'SCOUTING',
    batchable: true,
    ttlHours: 336,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACHIEVEMENT & GAMIFICATION NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  BADGE_EARNED: {
    type: 'BADGE_EARNED',
    title: '🏅 Badge Earned!',
    message: 'You earned the {{badgeName}} badge!',
    icon: '🏅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: true,
    ttlHours: 168,
  },
  ACHIEVEMENT_UNLOCKED: {
    type: 'ACHIEVEMENT_UNLOCKED',
    title: '🏆 Achievement Unlocked!',
    message: 'You unlocked: {{achievementName}}!',
    icon: '🏆',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: true,
    ttlHours: 168,
  },
  ACHIEVEMENT_PROGRESS: {
    type: 'ACHIEVEMENT_PROGRESS',
    title: '📈 Achievement Progress',
    message: "You're {{percentage}}% of the way to {{achievementName}}!",
    icon: '📈',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'ACHIEVEMENT',
    batchable: true,
    ttlHours: 72,
  },
  ACHIEVEMENT_TIER_UNLOCKED: {
    type: 'ACHIEVEMENT_TIER_UNLOCKED',
    title: '⬆️ Tier Unlocked!',
    message: 'You reached {{tierName}} tier for {{achievementName}}!',
    icon: '⬆️',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 168,
  },
  MILESTONE_REACHED: {
    type: 'MILESTONE_REACHED',
    title: '🎯 Milestone Reached!',
    message: 'Congratulations! You reached {{milestoneName}}!',
    icon: '🎯',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 168,
  },
  MILESTONE_APPROACHING: {
    type: 'MILESTONE_APPROACHING',
    title: '🎯 Milestone Approaching',
    message: "You're close to reaching {{milestoneName}}!",
    icon: '🎯',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'ACHIEVEMENT',
    batchable: true,
    ttlHours: 72,
  },
  LEVEL_UP: {
    type: 'LEVEL_UP',
    title: '🆙 Level Up!',
    message: 'Congratulations! You reached Level {{level}}!',
    icon: '🆙',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 168,
  },
  XP_EARNED: {
    type: 'XP_EARNED',
    title: '✨ XP Earned',
    message: 'You earned {{xpAmount}} XP for {{action}}!',
    icon: '✨',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'ACHIEVEMENT',
    batchable: true,
    ttlHours: 24,
  },
  XP_BONUS: {
    type: 'XP_BONUS',
    title: '🎁 XP Bonus!',
    message: 'You received a {{multiplier}}x XP bonus!',
    icon: '🎁',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 24,
  },
  PRESTIGE_UNLOCKED: {
    type: 'PRESTIGE_UNLOCKED',
    title: '👑 Prestige Unlocked!',
    message: 'You unlocked Prestige Level {{prestigeLevel}}!',
    icon: '👑',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 336,
  },
  STREAK_MILESTONE: {
    type: 'STREAK_MILESTONE',
    title: '🔥 Streak Milestone!',
    message: "Amazing! You've maintained your {{streakType}} streak for {{days}} days!",
    icon: '🔥',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 168,
  },
  STREAK_AT_RISK: {
    type: 'STREAK_AT_RISK',
    title: '⚠️ Streak at Risk!',
    message: "Don't lose your {{days}}-day {{streakType}} streak! Complete today's activity.",
    icon: '⚠️',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 24,
  },
  STREAK_LOST: {
    type: 'STREAK_LOST',
    title: '💔 Streak Lost',
    message: 'Your {{streakType}} streak has ended at {{days}} days.',
    icon: '💔',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 72,
  },
  STREAK_RESTORED: {
    type: 'STREAK_RESTORED',
    title: '🔄 Streak Restored!',
    message: 'Your {{streakType}} streak has been restored!',
    icon: '🔄',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 72,
  },
  STREAK_RECORD: {
    type: 'STREAK_RECORD',
    title: '🏆 New Streak Record!',
    message: 'New personal best! {{days}}-day {{streakType}} streak!',
    icon: '🏆',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 168,
  },
  LEADERBOARD_POSITION_CHANGED: {
    type: 'LEADERBOARD_POSITION_CHANGED',
    title: '📊 Leaderboard Update',
    message: "You're now ranked #{{position}} on the {{leaderboardName}} leaderboard!",
    icon: '📊',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'ACHIEVEMENT',
    batchable: true,
    ttlHours: 72,
  },
  CHALLENGE_STARTED: {
    type: 'CHALLENGE_STARTED',
    title: '🎮 Challenge Started!',
    message: 'The {{challengeName}} challenge has begun!',
    icon: '🎮',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 168,
  },
  CHALLENGE_COMPLETED: {
    type: 'CHALLENGE_COMPLETED',
    title: '✅ Challenge Complete!',
    message: 'You completed the {{challengeName}} challenge!',
    icon: '✅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 168,
  },
  CHALLENGE_REWARD_CLAIMED: {
    type: 'CHALLENGE_REWARD_CLAIMED',
    title: '🎁 Reward Claimed!',
    message: 'You claimed {{rewardName}} for completing {{challengeName}}!',
    icon: '🎁',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'ACHIEVEMENT',
    batchable: false,
    ttlHours: 72,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEVELOPMENT NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  DEVELOPMENT_PLAN_CREATED: {
    type: 'DEVELOPMENT_PLAN_CREATED',
    title: '📋 Development Plan Created',
    message: 'A new development plan has been created for you.',
    icon: '📋',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'DEVELOPMENT',
    batchable: false,
    ttlHours: 168,
  },
  MILESTONE_COMPLETED: {
    type: 'MILESTONE_COMPLETED',
    title: '✅ Milestone Completed',
    message: 'You completed the {{milestoneName}} milestone!',
    icon: '✅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'DEVELOPMENT',
    batchable: false,
    ttlHours: 168,
  },
  SKILL_ASSESSED: {
    type: 'SKILL_ASSESSED',
    title: '📊 Skill Assessment',
    message: 'Your {{skillName}} skill has been assessed: {{rating}}/10',
    icon: '📊',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'DEVELOPMENT',
    batchable: true,
    ttlHours: 168,
  },
  MENTORSHIP_STARTED: {
    type: 'MENTORSHIP_STARTED',
    title: '🤝 Mentorship Started',
    message: '{{mentorName}} is now your mentor!',
    icon: '🤝',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'DEVELOPMENT',
    batchable: false,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MEDICAL/WELLNESS NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  FITNESS_ASSESSMENT_DUE: {
    type: 'FITNESS_ASSESSMENT_DUE',
    title: '🏋️ Fitness Assessment Due',
    message: 'Your fitness assessment is due on {{dueDate}}.',
    icon: '🏋️',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'MEDICAL',
    batchable: false,
    ttlHours: 168,
  },
  WELLNESS_CHECK_REQUIRED: {
    type: 'WELLNESS_CHECK_REQUIRED',
    title: '❤️ Wellness Check Required',
    message: 'Please complete your daily wellness check.',
    icon: '❤️',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'MEDICAL',
    batchable: false,
    ttlHours: 24,
  },
  RECOVERY_PHASE_CHANGED: {
    type: 'RECOVERY_PHASE_CHANGED',
    title: '🔄 Recovery Update',
    message: 'Your recovery phase has changed to: {{phase}}',
    icon: '🔄',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'MEDICAL',
    batchable: false,
    ttlHours: 168,
  },
  MEDICAL_CLEARANCE_REQUIRED: {
    type: 'MEDICAL_CLEARANCE_REQUIRED',
    title: '⚕️ Medical Clearance Required',
    message: 'Medical clearance is required before you can participate.',
    icon: '⚕️',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'MEDICAL',
    batchable: false,
    ttlHours: 168,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VIDEO & MEDIA NOTIFICATIONS (v7.10.1)
  // ─────────────────────────────────────────────────────────────────────────
  VIDEO_COMMENT_RECEIVED: {
    type: 'VIDEO_COMMENT_RECEIVED',
    title: '💬 New Comment on Your Video',
    message: '{{commenterName}} commented on "{{videoTitle}}"',
    icon: '💬',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'VIDEO',
    batchable: true,
    ttlHours: 72,
  },
  VIDEO_COMMENT_REPLY: {
    type: 'VIDEO_COMMENT_REPLY',
    title: '↩️ Reply to Your Comment',
    message: '{{replierName}} replied to your comment on "{{videoTitle}}"',
    icon: '↩️',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'VIDEO',
    batchable: true,
    ttlHours: 72,
  },
  VIDEO_COMMENT_MENTION: {
    type: 'VIDEO_COMMENT_MENTION',
    title: '📢 You Were Mentioned',
    message: '{{mentionerName}} mentioned you in a comment on "{{videoTitle}}"',
    icon: '📢',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'VIDEO',
    batchable: false,
    ttlHours: 72,
  },
  VIDEO_LIKED: {
    type: 'VIDEO_LIKED',
    title: '❤️ Video Liked',
    message: '{{likerName}} liked your video "{{videoTitle}}"',
    icon: '❤️',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'VIDEO',
    batchable: true,
    ttlHours: 48,
  },
  VIDEO_SHARED: {
    type: 'VIDEO_SHARED',
    title: '🔗 Video Shared',
    message: '{{sharerName}} shared your video "{{videoTitle}}"',
    icon: '🔗',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'VIDEO',
    batchable: true,
    ttlHours: 72,
  },
  VIDEO_BOOKMARKED: {
    type: 'VIDEO_BOOKMARKED',
    title: '🔖 Video Bookmarked',
    message: '{{bookmarkerName}} bookmarked your video "{{videoTitle}}"',
    icon: '🔖',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'VIDEO',
    batchable: true,
    ttlHours: 48,
  },
  VIDEO_DOWNLOADED: {
    type: 'VIDEO_DOWNLOADED',
    title: '⬇️ Video Downloaded',
    message: '{{downloaderName}} downloaded your video "{{videoTitle}}"',
    icon: '⬇️',
    priority: 'LOW',
    defaultChannels: ['IN_APP'],
    category: 'VIDEO',
    batchable: true,
    ttlHours: 48,
  },
  VIDEO_MILESTONE_VIEWS: {
    type: 'VIDEO_MILESTONE_VIEWS',
    title: '👀 View Milestone!',
    message: 'Your video "{{videoTitle}}" reached {{viewCount}} views!',
    icon: '👀',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'VIDEO',
    batchable: false,
    ttlHours: 168,
  },
  VIDEO_TRENDING: {
    type: 'VIDEO_TRENDING',
    title: '🔥 Your Video is Trending!',
    message: '"{{videoTitle}}" is trending in {{category}}!',
    icon: '🔥',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'PUSH'],
    category: 'VIDEO',
    batchable: false,
    ttlHours: 72,
  },
  VIDEO_PROCESSING_COMPLETE: {
    type: 'VIDEO_PROCESSING_COMPLETE',
    title: '✅ Video Ready',
    message: 'Your video "{{videoTitle}}" is ready to watch!',
    icon: '✅',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'VIDEO',
    batchable: false,
    ttlHours: 72,
  },
  VIDEO_PROCESSING_FAILED: {
    type: 'VIDEO_PROCESSING_FAILED',
    title: '❌ Video Processing Failed',
    message: 'Failed to process "{{videoTitle}}". Please try uploading again.',
    icon: '❌',
    priority: 'HIGH',
    defaultChannels: ['IN_APP', 'EMAIL'],
    category: 'VIDEO',
    batchable: false,
    ttlHours: 168,
  },
  VIDEO_UPLOAD_COMPLETE: {
    type: 'VIDEO_UPLOAD_COMPLETE',
    title: '📤 Upload Complete',
    message: '"{{videoTitle}}" uploaded successfully and is now processing.',
    icon: '📤',
    priority: 'NORMAL',
    defaultChannels: ['IN_APP'],
    category: 'VIDEO',
    batchable: false,
    ttlHours: 24,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SPORT-SPECIFIC NOTIFICATIONS (Placeholders - implement per sport)
  // ─────────────────────────────────────────────────────────────────────────
  // Football
  FOOTBALL_GOAL_SCORED: { type: 'FOOTBALL_GOAL_SCORED', title: '⚽ GOAL!', message: '{{playerName}} scores! {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '⚽', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  FOOTBALL_ASSIST: { type: 'FOOTBALL_ASSIST', title: '🅰️ Assist', message: '{{playerName}} with the assist!', icon: '🅰️', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  FOOTBALL_CARD_ISSUED: { type: 'FOOTBALL_CARD_ISSUED', title: '🟨 Card Issued', message: '{{cardType}} card for {{playerName}}', icon: '🟨', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  FOOTBALL_SUBSTITUTION: { type: 'FOOTBALL_SUBSTITUTION', title: '🔄 Substitution', message: '{{playerOut}} off, {{playerIn}} on', icon: '🔄', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  FOOTBALL_PENALTY: { type: 'FOOTBALL_PENALTY', title: '⚠️ Penalty!', message: 'Penalty awarded to {{team}}!', icon: '⚠️', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  FOOTBALL_VAR_REVIEW: { type: 'FOOTBALL_VAR_REVIEW', title: '📺 VAR Review', message: 'VAR checking {{incident}}', icon: '📺', priority: 'HIGH', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 12 },
  FOOTBALL_OFFSIDE: { type: 'FOOTBALL_OFFSIDE', title: '🚩 Offside', message: '{{playerName}} caught offside', icon: '🚩', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  FOOTBALL_CORNER: { type: 'FOOTBALL_CORNER', title: '📐 Corner', message: 'Corner kick to {{team}}', icon: '📐', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  FOOTBALL_FREE_KICK: { type: 'FOOTBALL_FREE_KICK', title: '⚽ Free Kick', message: 'Free kick in a dangerous position for {{team}}', icon: '⚽', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  
  // Rugby
  RUGBY_TRY_SCORED: { type: 'RUGBY_TRY_SCORED', title: '🏉 TRY!', message: '{{playerName}} scores a try! {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '🏉', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  RUGBY_CONVERSION: { type: 'RUGBY_CONVERSION', title: '🎯 Conversion', message: '{{playerName}} {{result}} the conversion', icon: '🎯', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  RUGBY_PENALTY_KICK: { type: 'RUGBY_PENALTY_KICK', title: '🎯 Penalty Kick', message: '{{playerName}} {{result}} the penalty kick', icon: '🎯', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  RUGBY_DROP_GOAL: { type: 'RUGBY_DROP_GOAL', title: '🏉 Drop Goal!', message: '{{playerName}} with a drop goal!', icon: '🏉', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  RUGBY_SIN_BIN: { type: 'RUGBY_SIN_BIN', title: '🟨 Sin Bin', message: '{{playerName}} sent to the sin bin', icon: '🟨', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  RUGBY_RED_CARD: { type: 'RUGBY_RED_CARD', title: '🟥 Red Card!', message: '{{playerName}} sent off!', icon: '🟥', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  RUGBY_SCRUM: { type: 'RUGBY_SCRUM', title: '🏉 Scrum', message: 'Scrum to {{team}}', icon: '🏉', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  RUGBY_LINEOUT: { type: 'RUGBY_LINEOUT', title: '🏉 Lineout', message: 'Lineout to {{team}}', icon: '🏉', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  RUGBY_TMO_REVIEW: { type: 'RUGBY_TMO_REVIEW', title: '📺 TMO Review', message: 'TMO checking {{incident}}', icon: '📺', priority: 'HIGH', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 12 },

  // Basketball
  BASKETBALL_QUARTER_END: { type: 'BASKETBALL_QUARTER_END', title: '⏱️ Quarter {{quarter}} End', message: '{{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '⏱️', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  BASKETBALL_TIMEOUT: { type: 'BASKETBALL_TIMEOUT', title: '⏸️ Timeout', message: 'Timeout called by {{team}}', icon: '⏸️', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  BASKETBALL_FOUL: { type: 'BASKETBALL_FOUL', title: '🏀 Foul', message: 'Foul on {{playerName}} ({{foulCount}} fouls)', icon: '🏀', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  BASKETBALL_THREE_POINTER: { type: 'BASKETBALL_THREE_POINTER', title: '🎯 Three Pointer!', message: '{{playerName}} hits from downtown!', icon: '🎯', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  BASKETBALL_DUNK: { type: 'BASKETBALL_DUNK', title: '💪 Dunk!', message: '{{playerName}} with a powerful dunk!', icon: '💪', priority: 'NORMAL', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  BASKETBALL_FAST_BREAK: { type: 'BASKETBALL_FAST_BREAK', title: '⚡ Fast Break', message: '{{team}} on the fast break!', icon: '⚡', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  BASKETBALL_TECHNICAL_FOUL: { type: 'BASKETBALL_TECHNICAL_FOUL', title: '🟥 Technical Foul', message: 'Technical foul on {{playerName}}', icon: '🟥', priority: 'HIGH', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },

  // Cricket
  CRICKET_WICKET: { type: 'CRICKET_WICKET', title: '🎳 WICKET!', message: '{{batsmanName}} is out! {{dismissalType}}', icon: '🎳', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  CRICKET_BOUNDARY: { type: 'CRICKET_BOUNDARY', title: '4️⃣ FOUR!', message: '{{batsmanName}} finds the boundary!', icon: '4️⃣', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  CRICKET_SIX: { type: 'CRICKET_SIX', title: '6️⃣ SIX!', message: '{{batsmanName}} hits it out of the park!', icon: '6️⃣', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  CRICKET_OVER_COMPLETE: { type: 'CRICKET_OVER_COMPLETE', title: '🏏 Over Complete', message: 'End of over {{overNumber}}: {{score}}/{{wickets}}', icon: '🏏', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  CRICKET_INNINGS_END: { type: 'CRICKET_INNINGS_END', title: '🏏 Innings End', message: '{{team}} {{score}}/{{wickets}} ({{overs}} overs)', icon: '🏏', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  CRICKET_DRINKS_BREAK: { type: 'CRICKET_DRINKS_BREAK', title: '🥤 Drinks Break', message: 'Drinks break - {{score}}/{{wickets}}', icon: '🥤', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  CRICKET_RAIN_DELAY: { type: 'CRICKET_RAIN_DELAY', title: '🌧️ Rain Delay', message: 'Play suspended due to rain', icon: '🌧️', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  CRICKET_DRS_REVIEW: { type: 'CRICKET_DRS_REVIEW', title: '📺 DRS Review', message: '{{team}} reviewing {{decision}}', icon: '📺', priority: 'HIGH', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 12 },

  // American Football
  AMERICAN_FOOTBALL_TOUCHDOWN: { type: 'AMERICAN_FOOTBALL_TOUCHDOWN', title: '🏈 TOUCHDOWN!', message: '{{playerName}} scores! {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '🏈', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  AMERICAN_FOOTBALL_FIELD_GOAL: { type: 'AMERICAN_FOOTBALL_FIELD_GOAL', title: '🎯 Field Goal', message: '{{playerName}} {{result}} the field goal from {{distance}} yards', icon: '🎯', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  AMERICAN_FOOTBALL_SAFETY: { type: 'AMERICAN_FOOTBALL_SAFETY', title: '🛡️ Safety!', message: '{{team}} scores a safety!', icon: '🛡️', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  AMERICAN_FOOTBALL_TWO_POINT: { type: 'AMERICAN_FOOTBALL_TWO_POINT', title: '2️⃣ Two-Point Conversion', message: '{{team}} {{result}} the two-point conversion', icon: '2️⃣', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  AMERICAN_FOOTBALL_QUARTER_END: { type: 'AMERICAN_FOOTBALL_QUARTER_END', title: '⏱️ Quarter {{quarter}} End', message: '{{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '⏱️', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  AMERICAN_FOOTBALL_TURNOVER: { type: 'AMERICAN_FOOTBALL_TURNOVER', title: '🔄 Turnover', message: '{{type}} by {{playerName}}!', icon: '🔄', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  AMERICAN_FOOTBALL_SACK: { type: 'AMERICAN_FOOTBALL_SACK', title: '💥 Sack!', message: '{{playerName}} sacks the quarterback!', icon: '💥', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },

  // Hockey
  HOCKEY_GOAL: { type: 'HOCKEY_GOAL', title: '🏒 GOAL!', message: '{{playerName}} scores! {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '🏒', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  HOCKEY_PENALTY: { type: 'HOCKEY_PENALTY', title: '🟨 Penalty', message: '{{penaltyType}} on {{playerName}} ({{minutes}} min)', icon: '🟨', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  HOCKEY_PERIOD_END: { type: 'HOCKEY_PERIOD_END', title: '⏱️ Period {{period}} End', message: '{{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '⏱️', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  HOCKEY_SHOOTOUT: { type: 'HOCKEY_SHOOTOUT', title: '🎯 Shootout!', message: 'Game heading to a shootout!', icon: '🎯', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  HOCKEY_POWER_PLAY: { type: 'HOCKEY_POWER_PLAY', title: '⚡ Power Play', message: '{{team}} on the power play!', icon: '⚡', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  HOCKEY_HAT_TRICK: { type: 'HOCKEY_HAT_TRICK', title: '🎩 HAT TRICK!', message: '{{playerName}} completes the hat trick!', icon: '🎩', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },

  // Netball
  NETBALL_GOAL: { type: 'NETBALL_GOAL', title: '🥅 Goal!', message: '{{playerName}} scores! {{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '🥅', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  NETBALL_QUARTER_END: { type: 'NETBALL_QUARTER_END', title: '⏱️ Quarter {{quarter}} End', message: '{{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '⏱️', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  NETBALL_CENTER_PASS: { type: 'NETBALL_CENTER_PASS', title: '🏐 Center Pass', message: '{{team}} with the center pass', icon: '🏐', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },
  NETBALL_OBSTRUCTION: { type: 'NETBALL_OBSTRUCTION', title: '⚠️ Obstruction', message: 'Obstruction called against {{team}}', icon: '⚠️', priority: 'LOW', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 12 },

  // Other/Generic
  GENERAL_SCORE_UPDATE: { type: 'GENERAL_SCORE_UPDATE', title: '📊 Score Update', message: '{{homeTeam}} {{homeScore}} - {{awayScore}} {{awayTeam}}', icon: '📊', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
  PERIOD_END: { type: 'PERIOD_END', title: '⏱️ Period End', message: 'End of {{periodName}} {{periodNumber}}', icon: '⏱️', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: false, ttlHours: 24 },
  OVERTIME_START: { type: 'OVERTIME_START', title: '⏰ Overtime!', message: 'The match is going to overtime!', icon: '⏰', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  MATCH_DELAYED: { type: 'MATCH_DELAYED', title: '⏳ Match Delayed', message: '{{homeTeam}} vs {{awayTeam}} has been delayed. Reason: {{reason}}', icon: '⏳', priority: 'HIGH', defaultChannels: ['IN_APP', 'PUSH'], category: 'MATCH', batchable: false, ttlHours: 24 },
  WEATHER_UPDATE: { type: 'WEATHER_UPDATE', title: '🌤️ Weather Update', message: '{{message}}', icon: '🌤️', priority: 'NORMAL', defaultChannels: ['IN_APP'], category: 'MATCH', batchable: true, ttlHours: 24 },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get notification template by type
 */
export function getNotificationTemplate(type: NotificationType): NotificationTemplate {
  return NOTIFICATION_TEMPLATES[type];
}

/**
 * Render notification with template variables
 */
export function renderNotification(
  type: NotificationType,
  variables: Record<string, any>,
  sport?: Sport
): { title: string; message: string; icon: string } {
  const template = NOTIFICATION_TEMPLATES[type];
  
  // Use sport-specific emoji if available
  let icon = template.icon;
  if (sport) {
    const sportConfig = getSportConfig(sport);
    if (template.category === 'MATCH' && type.includes('GOAL') || type.includes('SCORED')) {
      icon = sportConfig.emoji;
    }
  }

  const renderTemplate = (str: string): string => {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
    });
  };

  return {
    title: renderTemplate(template.title),
    message: renderTemplate(template.message),
    icon,
  };
}

/**
 * Get notifications by category
 */
export function getNotificationsByCategory(category: NotificationCategory): NotificationType[] {
  return Object.entries(NOTIFICATION_TEMPLATES)
    .filter(([_, template]) => template.category === category)
    .map(([type]) => type as NotificationType);
}

/**
 * Get default notification preferences
 */
export function getDefaultNotificationPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    matchReminders: true,
    trainingReminders: true,
    teamUpdates: true,
    performanceAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Europe/London',
    disabledTypes: [],
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  NotificationChannel,
  NotificationPriority,
  NotificationTemplate,
  NotificationCategory,
  NotificationData,
  NotificationPreferences,
};