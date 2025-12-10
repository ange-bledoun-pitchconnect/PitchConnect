// ============================================================================
// src/lib/notifications/notification-types.ts
// Notification Type Definitions & Enums - Schema Aligned
// ============================================================================

import { NotificationType } from '@prisma/client';

export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'push';
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationStatus = 'unread' | 'read' | 'archived';

/**
 * Notification type metadata with templates and defaults
 */
export const NOTIFICATION_METADATA: Record<
  NotificationType,
  {
    label: string;
    description: string;
    icon: string;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    template: string;
  }
> = {
  MATCH_SCHEDULED: {
    label: 'Match Scheduled',
    description: 'A new match has been scheduled',
    icon: 'calendar',
    priority: 'MEDIUM',
    channels: ['in-app', 'email', 'push'],
    template: '🗓️ {team} has a match on {date} vs {opponent}',
  },
  MATCH_REMINDER: {
    label: 'Match Reminder',
    description: 'Your match starts soon',
    icon: 'bell',
    priority: 'HIGH',
    channels: ['in-app', 'push', 'sms'],
    template: '⏰ Match starts in {minutes} minutes',
  },
  MATCH_LIVE_UPDATE: {
    label: 'Live Match Update',
    description: 'Live match event occurred',
    icon: 'activity',
    priority: 'HIGH',
    channels: ['in-app', 'push'],
    template: '⚽ GOAL! {team} {event}',
  },
  TRAINING_SESSION: {
    label: 'Training Session',
    description: 'New training session scheduled',
    icon: 'zap',
    priority: 'MEDIUM',
    channels: ['in-app', 'email', 'push'],
    template: '🏋️ Training session scheduled for {date}',
  },
  TEAM_MESSAGE: {
    label: 'Team Message',
    description: 'New team message',
    icon: 'message-square',
    priority: 'MEDIUM',
    channels: ['in-app', 'push'],
    template: '💬 New message from {sender}',
  },
  ACHIEVEMENT_UNLOCKED: {
    label: 'Achievement Unlocked',
    description: 'You unlocked a new achievement',
    icon: 'award',
    priority: 'LOW',
    channels: ['in-app', 'push'],
    template: '🏆 Achievement unlocked: {achievement}',
  },
  PAYMENT_RECEIVED: {
    label: 'Payment Received',
    description: 'Payment has been received',
    icon: 'check-circle',
    priority: 'HIGH',
    channels: ['in-app', 'email'],
    template: '💰 Payment of {amount} received',
  },
  PAYMENT_FAILED: {
    label: 'Payment Failed',
    description: 'Payment transaction failed',
    icon: 'alert-circle',
    priority: 'HIGH',
    channels: ['in-app', 'email', 'sms'],
    template: '❌ Payment of {amount} failed: {reason}',
  },
  PLAYER_STATS_UPDATE: {
    label: 'Stats Update',
    description: 'Your statistics have been updated',
    icon: 'bar-chart-2',
    priority: 'LOW',
    channels: ['in-app', 'email'],
    template: '📊 Your stats: {goals} goals, {assists} assists',
  },
  SYSTEM_ALERT: {
    label: 'System Alert',
    description: 'Important system notification',
    icon: 'alert-triangle',
    priority: 'HIGH',
    channels: ['in-app', 'email'],
    template: '⚠️ System alert: {message}',
  },
  UPGRADE_REQUEST_APPROVED: {
    label: 'Upgrade Approved',
    description: 'Your upgrade request was approved',
    icon: 'check-circle',
    priority: 'HIGH',
    channels: ['in-app', 'email'],
    template: '✅ Your upgrade to {role} has been approved',
  },
  UPGRADE_REQUEST_REJECTED: {
    label: 'Upgrade Rejected',
    description: 'Your upgrade request was rejected',
    icon: 'x-circle',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '❌ Your upgrade request was rejected: {reason}',
  },
  ROLE_CHANGED: {
    label: 'Role Changed',
    description: 'Your role has been updated',
    icon: 'user-check',
    priority: 'HIGH',
    channels: ['in-app', 'email'],
    template: '🔄 Your role has been changed to {role}',
  },
  ACCOUNT_SUSPENDED: {
    label: 'Account Suspended',
    description: 'Your account has been suspended',
    icon: 'lock',
    priority: 'HIGH',
    channels: ['in-app', 'email', 'sms'],
    template: '🔒 Your account has been suspended: {reason}',
  },
  MATCH_ATTENDANCE_REQUEST: {
    label: 'Attendance Request',
    description: 'Match attendance confirmation requested',
    icon: 'user-plus',
    priority: 'MEDIUM',
    channels: ['in-app', 'push', 'sms'],
    template: '👥 Please confirm your attendance for {match}',
  },
  TIMESHEET_APPROVED: {
    label: 'Timesheet Approved',
    description: 'Your timesheet has been approved',
    icon: 'check-circle',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '✅ Your timesheet for {period} has been approved',
  },
  TIMESHEET_REJECTED: {
    label: 'Timesheet Rejected',
    description: 'Your timesheet needs revision',
    icon: 'alert-circle',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '⚠️ Your timesheet needs revision: {reason}',
  },
  PAYMENT_PROCESSED: {
    label: 'Payment Processed',
    description: 'Payment has been processed',
    icon: 'credit-card',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '💳 Payment of {amount} processed',
  },
  JOIN_REQUEST: {
    label: 'Join Request',
    description: 'New player join request',
    icon: 'user-plus',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '{player} requested to join {team}',
  },
  LEAGUE_INVITATION: {
    label: 'League Invitation',
    description: 'Your team has been invited to a league',
    icon: 'mail',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '📧 {team} invited to join {league}',
  },
  PERFORMANCE_ALERT: {
    label: 'Performance Alert',
    description: 'Performance metric alert',
    icon: 'trending-down',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '📉 Performance alert: {message}',
  },
  INJURY_ALERT: {
    label: 'Injury Alert',
    description: 'Player injury notification',
    icon: 'alert-circle',
    priority: 'HIGH',
    channels: ['in-app', 'email', 'sms'],
    template: '🚑 {player} has been injured: {description}',
  },
  TEAM_ANNOUNCEMENT: {
    label: 'Team Announcement',
    description: 'New team announcement',
    icon: 'megaphone',
    priority: 'MEDIUM',
    channels: ['in-app', 'email'],
    template: '📢 {team} announcement: {message}',
  },
};

/**
 * Notification data structure
 */
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  
  // Delivery tracking
  deliveredAt?: Date;
  readAt?: Date;
  archivedAt?: Date;
  
  // Link
  link?: string;
  actionLabel?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

/**
 * Notification preference structure
 */
export interface NotificationPreferences {
  email: {
    matchScheduled: boolean;
    matchReminders: boolean;
    matchUpdates: boolean;
    trainingSession: boolean;
    teamMessages: boolean;
    payments: boolean;
    achievements: boolean;
    systemAlerts: boolean;
  };
  push: {
    matchScheduled: boolean;
    matchReminders: boolean;
    matchUpdates: boolean;
    trainingSession: boolean;
    teamMessages: boolean;
    payments: boolean;
    achievements: boolean;
  };
  sms: {
    matchReminders: boolean;
    matchUpdates: boolean;
    payments: boolean;
    urgentAlerts: boolean;
  };
  inApp: {
    all: boolean;
    doNotDisturb: { enabled: boolean; from?: string; to?: string };
  };
}

/**
 * Create notification payload
 */
export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  link?: string;
  actionLabel?: string;
  expiresAt?: Date;
}

/**
 * Notification filter options
 */
export interface NotificationFilterOptions {
  userId: string;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
