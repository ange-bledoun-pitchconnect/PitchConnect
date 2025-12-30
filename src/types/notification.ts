// ============================================================================
// 🔔 PITCHCONNECT - Notification Types v7.5.0
// Path: src/types/notification.ts
// ============================================================================
//
// Comprehensive notification type definitions for all user types.
// Supports in-app, email, push (FCM), and SMS notifications.
//
// ============================================================================

// ============================================================================
// NOTIFICATION TYPE CATEGORIES
// ============================================================================

export type NotificationType =
  // Match Related
  | 'MATCH_CREATED'
  | 'MATCH_REMINDER'
  | 'MATCH_LINEUP_PUBLISHED'
  | 'MATCH_KICKOFF'
  | 'MATCH_HALFTIME'
  | 'MATCH_FULLTIME'
  | 'MATCH_CANCELLED'
  | 'MATCH_POSTPONED'
  | 'MATCH_RESULT_PENDING'
  | 'MATCH_RESULT_APPROVED'
  | 'MATCH_RESULT_DISPUTED'
  
  // Training Related
  | 'TRAINING_SCHEDULED'
  | 'TRAINING_REMINDER'
  | 'TRAINING_CANCELLED'
  | 'TRAINING_LOCATION_CHANGED'
  | 'TRAINING_FEEDBACK'
  | 'TRAINING_ATTENDANCE_REQUIRED'
  
  // Team Related
  | 'TEAM_JOINED'
  | 'TEAM_LEFT'
  | 'TEAM_ROLE_CHANGED'
  | 'TEAM_ANNOUNCEMENT'
  | 'TEAM_INVITE'
  | 'TEAM_INVITE_ACCEPTED'
  | 'TEAM_INVITE_DECLINED'
  
  // Player Related
  | 'PLAYER_INJURY_REPORTED'
  | 'PLAYER_CLEARED_TO_PLAY'
  | 'PLAYER_ASSESSMENT_DUE'
  | 'PLAYER_ACHIEVEMENT_UNLOCKED'
  | 'PLAYER_MILESTONE'
  | 'PLAYER_RATING_UPDATED'
  | 'PLAYER_CONTRACT_EXPIRING'
  | 'PLAYER_TRANSFER_REQUEST'
  
  // Payment & Billing
  | 'PAYMENT_DUE'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_OVERDUE'
  | 'INVOICE_GENERATED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_CANCELLED'
  
  // Approval & Requests
  | 'JOIN_REQUEST_RECEIVED'
  | 'JOIN_REQUEST_APPROVED'
  | 'JOIN_REQUEST_REJECTED'
  | 'RESULT_APPROVAL_NEEDED'
  | 'RESULT_APPROVED'
  | 'RESULT_REJECTED'
  | 'DOCUMENT_APPROVAL_NEEDED'
  | 'DOCUMENT_APPROVED'
  | 'TIMESHEET_SUBMITTED'
  | 'TIMESHEET_APPROVED'
  | 'TIMESHEET_REJECTED'
  
  // Messaging
  | 'DIRECT_MESSAGE'
  | 'TEAM_MESSAGE'
  | 'CLUB_MESSAGE'
  | 'MENTION'
  | 'MESSAGE_REACTION'
  
  // Job & Career
  | 'JOB_POSTED'
  | 'JOB_APPLICATION_RECEIVED'
  | 'JOB_APPLICATION_STATUS'
  | 'JOB_APPLICATION_SHORTLISTED'
  | 'JOB_APPLICATION_REJECTED'
  | 'JOB_INTERVIEW_SCHEDULED'
  | 'JOB_OFFER_RECEIVED'
  
  // Media
  | 'MEDIA_UPLOADED'
  | 'MEDIA_TAGGED'
  | 'MEDIA_PROCESSED'
  | 'HIGHLIGHT_AVAILABLE'
  | 'MEDIA_SHARED'
  
  // Competition
  | 'COMPETITION_FIXTURE'
  | 'COMPETITION_RESULT'
  | 'COMPETITION_STANDING_UPDATE'
  | 'COMPETITION_REGISTRATION_OPEN'
  | 'COMPETITION_STARTED'
  | 'COMPETITION_ENDED'
  
  // Medical (Staff & Players)
  | 'MEDICAL_ASSESSMENT_DUE'
  | 'MEDICAL_CLEARANCE_EXPIRING'
  | 'MEDICAL_RECORD_ADDED'
  | 'FITNESS_ASSESSMENT_SCHEDULED'
  | 'FITNESS_ASSESSMENT_COMPLETE'
  | 'RTP_STAGE_UPDATED'
  | 'RTP_CLEARED'
  
  // Parent Specific
  | 'CHILD_MATCH_REMINDER'
  | 'CHILD_TRAINING_REMINDER'
  | 'CONSENT_REQUIRED'
  | 'CONSENT_EXPIRING'
  | 'CHILD_INJURY_REPORTED'
  | 'CHILD_CLEARED_TO_PLAY'
  | 'CHILD_ACHIEVEMENT'
  | 'CHILD_PAYMENT_DUE'
  | 'CHILD_ATTENDANCE_REPORT'
  
  // Social
  | 'NEW_FOLLOWER'
  | 'BADGE_EARNED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'LEADERBOARD_UPDATE'
  
  // System
  | 'SYSTEM_MAINTENANCE'
  | 'FEATURE_ANNOUNCEMENT'
  | 'SECURITY_ALERT'
  | 'ACCOUNT_VERIFIED'
  | 'PASSWORD_CHANGED'
  | 'TWO_FACTOR_ENABLED'
  | 'LOGIN_FROM_NEW_DEVICE'
  | 'PROFILE_INCOMPLETE'
  | 'WELCOME';

// ============================================================================
// NOTIFICATION CATEGORY GROUPING
// ============================================================================

export type NotificationCategory =
  | 'MATCH'
  | 'TRAINING'
  | 'TEAM'
  | 'PLAYER'
  | 'PAYMENT'
  | 'APPROVAL'
  | 'MESSAGE'
  | 'JOB'
  | 'MEDIA'
  | 'COMPETITION'
  | 'MEDICAL'
  | 'PARENT'
  | 'SOCIAL'
  | 'SYSTEM';

export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, { label: string; icon: string; color: string }> = {
  MATCH: { label: 'Matches', icon: '⚽', color: 'green' },
  TRAINING: { label: 'Training', icon: '🏃', color: 'blue' },
  TEAM: { label: 'Team', icon: '👥', color: 'purple' },
  PLAYER: { label: 'Player', icon: '🧑', color: 'indigo' },
  PAYMENT: { label: 'Payments', icon: '💳', color: 'yellow' },
  APPROVAL: { label: 'Approvals', icon: '✅', color: 'orange' },
  MESSAGE: { label: 'Messages', icon: '💬', color: 'cyan' },
  JOB: { label: 'Jobs', icon: '💼', color: 'pink' },
  MEDIA: { label: 'Media', icon: '📸', color: 'violet' },
  COMPETITION: { label: 'Competitions', icon: '🏆', color: 'amber' },
  MEDICAL: { label: 'Medical', icon: '🏥', color: 'red' },
  PARENT: { label: 'Parent', icon: '👨‍👩‍👧', color: 'teal' },
  SOCIAL: { label: 'Social', icon: '🌟', color: 'rose' },
  SYSTEM: { label: 'System', icon: '⚙️', color: 'gray' },
};

// Map notification types to categories
export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  // Match
  MATCH_CREATED: 'MATCH',
  MATCH_REMINDER: 'MATCH',
  MATCH_LINEUP_PUBLISHED: 'MATCH',
  MATCH_KICKOFF: 'MATCH',
  MATCH_HALFTIME: 'MATCH',
  MATCH_FULLTIME: 'MATCH',
  MATCH_CANCELLED: 'MATCH',
  MATCH_POSTPONED: 'MATCH',
  MATCH_RESULT_PENDING: 'MATCH',
  MATCH_RESULT_APPROVED: 'MATCH',
  MATCH_RESULT_DISPUTED: 'MATCH',
  
  // Training
  TRAINING_SCHEDULED: 'TRAINING',
  TRAINING_REMINDER: 'TRAINING',
  TRAINING_CANCELLED: 'TRAINING',
  TRAINING_LOCATION_CHANGED: 'TRAINING',
  TRAINING_FEEDBACK: 'TRAINING',
  TRAINING_ATTENDANCE_REQUIRED: 'TRAINING',
  
  // Team
  TEAM_JOINED: 'TEAM',
  TEAM_LEFT: 'TEAM',
  TEAM_ROLE_CHANGED: 'TEAM',
  TEAM_ANNOUNCEMENT: 'TEAM',
  TEAM_INVITE: 'TEAM',
  TEAM_INVITE_ACCEPTED: 'TEAM',
  TEAM_INVITE_DECLINED: 'TEAM',
  
  // Player
  PLAYER_INJURY_REPORTED: 'PLAYER',
  PLAYER_CLEARED_TO_PLAY: 'PLAYER',
  PLAYER_ASSESSMENT_DUE: 'PLAYER',
  PLAYER_ACHIEVEMENT_UNLOCKED: 'PLAYER',
  PLAYER_MILESTONE: 'PLAYER',
  PLAYER_RATING_UPDATED: 'PLAYER',
  PLAYER_CONTRACT_EXPIRING: 'PLAYER',
  PLAYER_TRANSFER_REQUEST: 'PLAYER',
  
  // Payment
  PAYMENT_DUE: 'PAYMENT',
  PAYMENT_REMINDER: 'PAYMENT',
  PAYMENT_RECEIVED: 'PAYMENT',
  PAYMENT_FAILED: 'PAYMENT',
  PAYMENT_OVERDUE: 'PAYMENT',
  INVOICE_GENERATED: 'PAYMENT',
  SUBSCRIPTION_EXPIRING: 'PAYMENT',
  SUBSCRIPTION_RENEWED: 'PAYMENT',
  SUBSCRIPTION_CANCELLED: 'PAYMENT',
  
  // Approval
  JOIN_REQUEST_RECEIVED: 'APPROVAL',
  JOIN_REQUEST_APPROVED: 'APPROVAL',
  JOIN_REQUEST_REJECTED: 'APPROVAL',
  RESULT_APPROVAL_NEEDED: 'APPROVAL',
  RESULT_APPROVED: 'APPROVAL',
  RESULT_REJECTED: 'APPROVAL',
  DOCUMENT_APPROVAL_NEEDED: 'APPROVAL',
  DOCUMENT_APPROVED: 'APPROVAL',
  TIMESHEET_SUBMITTED: 'APPROVAL',
  TIMESHEET_APPROVED: 'APPROVAL',
  TIMESHEET_REJECTED: 'APPROVAL',
  
  // Message
  DIRECT_MESSAGE: 'MESSAGE',
  TEAM_MESSAGE: 'MESSAGE',
  CLUB_MESSAGE: 'MESSAGE',
  MENTION: 'MESSAGE',
  MESSAGE_REACTION: 'MESSAGE',
  
  // Job
  JOB_POSTED: 'JOB',
  JOB_APPLICATION_RECEIVED: 'JOB',
  JOB_APPLICATION_STATUS: 'JOB',
  JOB_APPLICATION_SHORTLISTED: 'JOB',
  JOB_APPLICATION_REJECTED: 'JOB',
  JOB_INTERVIEW_SCHEDULED: 'JOB',
  JOB_OFFER_RECEIVED: 'JOB',
  
  // Media
  MEDIA_UPLOADED: 'MEDIA',
  MEDIA_TAGGED: 'MEDIA',
  MEDIA_PROCESSED: 'MEDIA',
  HIGHLIGHT_AVAILABLE: 'MEDIA',
  MEDIA_SHARED: 'MEDIA',
  
  // Competition
  COMPETITION_FIXTURE: 'COMPETITION',
  COMPETITION_RESULT: 'COMPETITION',
  COMPETITION_STANDING_UPDATE: 'COMPETITION',
  COMPETITION_REGISTRATION_OPEN: 'COMPETITION',
  COMPETITION_STARTED: 'COMPETITION',
  COMPETITION_ENDED: 'COMPETITION',
  
  // Medical
  MEDICAL_ASSESSMENT_DUE: 'MEDICAL',
  MEDICAL_CLEARANCE_EXPIRING: 'MEDICAL',
  MEDICAL_RECORD_ADDED: 'MEDICAL',
  FITNESS_ASSESSMENT_SCHEDULED: 'MEDICAL',
  FITNESS_ASSESSMENT_COMPLETE: 'MEDICAL',
  RTP_STAGE_UPDATED: 'MEDICAL',
  RTP_CLEARED: 'MEDICAL',
  
  // Parent
  CHILD_MATCH_REMINDER: 'PARENT',
  CHILD_TRAINING_REMINDER: 'PARENT',
  CONSENT_REQUIRED: 'PARENT',
  CONSENT_EXPIRING: 'PARENT',
  CHILD_INJURY_REPORTED: 'PARENT',
  CHILD_CLEARED_TO_PLAY: 'PARENT',
  CHILD_ACHIEVEMENT: 'PARENT',
  CHILD_PAYMENT_DUE: 'PARENT',
  CHILD_ATTENDANCE_REPORT: 'PARENT',
  
  // Social
  NEW_FOLLOWER: 'SOCIAL',
  BADGE_EARNED: 'SOCIAL',
  ACHIEVEMENT_UNLOCKED: 'SOCIAL',
  LEADERBOARD_UPDATE: 'SOCIAL',
  
  // System
  SYSTEM_MAINTENANCE: 'SYSTEM',
  FEATURE_ANNOUNCEMENT: 'SYSTEM',
  SECURITY_ALERT: 'SYSTEM',
  ACCOUNT_VERIFIED: 'SYSTEM',
  PASSWORD_CHANGED: 'SYSTEM',
  TWO_FACTOR_ENABLED: 'SYSTEM',
  LOGIN_FROM_NEW_DEVICE: 'SYSTEM',
  PROFILE_INCOMPLETE: 'SYSTEM',
  WELCOME: 'SYSTEM',
};

// ============================================================================
// NOTIFICATION PRIORITY
// ============================================================================

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export const NOTIFICATION_PRIORITY_CONFIG: Record<NotificationPriority, { label: string; color: string; icon: string }> = {
  LOW: { label: 'Low', color: 'gray', icon: '◯' },
  NORMAL: { label: 'Normal', color: 'blue', icon: '●' },
  HIGH: { label: 'High', color: 'orange', icon: '◉' },
  URGENT: { label: 'Urgent', color: 'red', icon: '🔴' },
};

// Get default priority for notification type
export function getNotificationPriority(type: NotificationType): NotificationPriority {
  const urgentTypes: NotificationType[] = [
    'SECURITY_ALERT',
    'CHILD_INJURY_REPORTED',
    'PLAYER_INJURY_REPORTED',
    'MATCH_CANCELLED',
    'PAYMENT_FAILED',
    'LOGIN_FROM_NEW_DEVICE',
  ];
  
  const highTypes: NotificationType[] = [
    'MATCH_REMINDER',
    'MATCH_KICKOFF',
    'CONSENT_REQUIRED',
    'PAYMENT_DUE',
    'PAYMENT_OVERDUE',
    'RESULT_APPROVAL_NEEDED',
    'MEDICAL_ASSESSMENT_DUE',
    'RTP_CLEARED',
    'JOB_INTERVIEW_SCHEDULED',
  ];
  
  const lowTypes: NotificationType[] = [
    'NEW_FOLLOWER',
    'BADGE_EARNED',
    'LEADERBOARD_UPDATE',
    'MEDIA_PROCESSED',
    'FEATURE_ANNOUNCEMENT',
  ];
  
  if (urgentTypes.includes(type)) return 'URGENT';
  if (highTypes.includes(type)) return 'HIGH';
  if (lowTypes.includes(type)) return 'LOW';
  return 'NORMAL';
}

// ============================================================================
// NOTIFICATION DELIVERY CHANNELS
// ============================================================================

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';

export interface NotificationChannelConfig {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// Default channel configuration per notification type
export const DEFAULT_CHANNEL_CONFIG: Record<NotificationCategory, NotificationChannelConfig> = {
  MATCH: { inApp: true, email: true, push: true, sms: false },
  TRAINING: { inApp: true, email: true, push: true, sms: false },
  TEAM: { inApp: true, email: true, push: true, sms: false },
  PLAYER: { inApp: true, email: true, push: true, sms: false },
  PAYMENT: { inApp: true, email: true, push: true, sms: true },
  APPROVAL: { inApp: true, email: true, push: true, sms: false },
  MESSAGE: { inApp: true, email: false, push: true, sms: false },
  JOB: { inApp: true, email: true, push: true, sms: false },
  MEDIA: { inApp: true, email: false, push: false, sms: false },
  COMPETITION: { inApp: true, email: true, push: true, sms: false },
  MEDICAL: { inApp: true, email: true, push: true, sms: true },
  PARENT: { inApp: true, email: true, push: true, sms: true },
  SOCIAL: { inApp: true, email: false, push: false, sms: false },
  SYSTEM: { inApp: true, email: true, push: false, sms: false },
};

// ============================================================================
// NOTIFICATION INTERFACE
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  
  title: string;
  message: string;
  
  read: boolean;
  readAt?: Date | null;
  
  link?: string | null;
  metadata?: NotificationMetadata | null;
  
  // Delivery tracking
  emailSent: boolean;
  pushSent: boolean;
  smsSent?: boolean;
  
  // Scheduling
  scheduledFor?: Date | null;
  
  createdAt: Date;
}

export interface NotificationMetadata {
  // Entity references
  matchId?: string;
  teamId?: string;
  clubId?: string;
  playerId?: string;
  trainingId?: string;
  competitionId?: string;
  jobId?: string;
  mediaId?: string;
  invoiceId?: string;
  
  // Actor info
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  
  // Additional context
  sport?: string;
  amount?: number;
  currency?: string;
  deadline?: string;
  location?: string;
  
  // Child info (for parent notifications)
  childId?: string;
  childName?: string;
  
  // Action buttons
  actions?: NotificationAction[];
  
  // Custom data
  [key: string]: unknown;
}

export interface NotificationAction {
  label: string;
  url: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export interface NotificationPreferences {
  id: string;
  userId: string;
  
  // Email preferences
  emailMatches: boolean;
  emailTeam: boolean;
  emailCoach: boolean;
  emailTraining: boolean;
  emailNews: boolean;
  emailMarketing: boolean;
  emailJobs: boolean;
  emailMedia: boolean;
  emailMedical: boolean;
  emailPayments: boolean;
  
  // Push preferences
  pushMatches: boolean;
  pushTeam: boolean;
  pushTraining: boolean;
  pushChat: boolean;
  pushJobs: boolean;
  pushMedia: boolean;
  pushMedical: boolean;
  pushPayments: boolean;
  
  // SMS preferences (urgent only)
  smsMatches: boolean;
  smsUrgent: boolean;
  smsMedical: boolean;
  smsPayments: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "07:00"
  
  // Digest settings
  digestEnabled: boolean;
  digestFrequency: 'DAILY' | 'WEEKLY' | 'NEVER';
  digestTime?: string; // "09:00"
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NOTIFICATION FILTER OPTIONS
// ============================================================================

export interface NotificationFilters {
  type?: NotificationType[];
  category?: NotificationCategory[];
  read?: boolean;
  priority?: NotificationPriority[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface NotificationSortOptions {
  field: 'createdAt' | 'priority' | 'read';
  direction: 'asc' | 'desc';
}

// ============================================================================
// FCM PUSH NOTIFICATION PAYLOAD
// ============================================================================

export interface FCMNotificationPayload {
  notification: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    click_action?: string;
  };
  data: {
    type: NotificationType;
    notificationId: string;
    link?: string;
    [key: string]: string | undefined;
  };
  tokens: string[]; // FCM device tokens
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category for a notification type
 */
export function getCategoryForType(type: NotificationType): NotificationCategory {
  return NOTIFICATION_TYPE_CATEGORY[type];
}

/**
 * Get icon for notification type
 */
export function getNotificationIcon(type: NotificationType): string {
  const category = NOTIFICATION_TYPE_CATEGORY[type];
  return NOTIFICATION_CATEGORIES[category].icon;
}

/**
 * Get color for notification type
 */
export function getNotificationColor(type: NotificationType): string {
  const category = NOTIFICATION_TYPE_CATEGORY[type];
  return NOTIFICATION_CATEGORIES[category].color;
}

/**
 * Format notification for display
 */
export function formatNotificationTitle(type: NotificationType): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if notification should use SMS
 */
export function shouldUseSMS(type: NotificationType): boolean {
  const smsTypes: NotificationType[] = [
    'SECURITY_ALERT',
    'CHILD_INJURY_REPORTED',
    'PAYMENT_FAILED',
    'CONSENT_REQUIRED',
    'MEDICAL_ASSESSMENT_DUE',
  ];
  return smsTypes.includes(type);
}

/**
 * Get all notification types for a category
 */
export function getTypesForCategory(category: NotificationCategory): NotificationType[] {
  return (Object.entries(NOTIFICATION_TYPE_CATEGORY) as [NotificationType, NotificationCategory][])
    .filter(([_, cat]) => cat === category)
    .map(([type]) => type);
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  notifications.forEach(notification => {
    const dateStr = new Date(notification.createdAt).toDateString();
    let groupKey: string;
    
    if (dateStr === today) {
      groupKey = 'Today';
    } else if (dateStr === yesterday) {
      groupKey = 'Yesterday';
    } else {
      groupKey = new Date(notification.createdAt).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });
  
  return groups;
}

/**
 * Get unread count by category
 */
export function getUnreadCountByCategory(notifications: Notification[]): Record<NotificationCategory, number> {
  const counts = {} as Record<NotificationCategory, number>;
  
  Object.keys(NOTIFICATION_CATEGORIES).forEach(category => {
    counts[category as NotificationCategory] = 0;
  });
  
  notifications
    .filter(n => !n.read)
    .forEach(n => {
      counts[n.category]++;
    });
  
  return counts;
}
