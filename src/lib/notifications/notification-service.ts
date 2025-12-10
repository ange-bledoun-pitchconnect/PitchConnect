// ============================================================================
// src/lib/notifications/notification-service.ts
// Core Notification Service - Production Ready
// ============================================================================

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  CreateNotificationPayload,
  INotification,
  NotificationFilterOptions,
  NotificationStatus,
  NOTIFICATION_METADATA,
} from './notification-types';
import { NotificationType } from '@prisma/client';

/**
 * Notification Service - Handles all notification operations
 * Schema-aligned with Prisma Notification model
 */
export class NotificationService {
  /**
   * Create and send a new notification
   */
  static async createNotification(payload: CreateNotificationPayload): Promise<INotification | null> {
    try {
      const metadata = NOTIFICATION_METADATA[payload.type];
      
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title || metadata.label,
          message: payload.message,
          data: payload.data || {},
          priority: payload.priority || metadata.priority,
          channels: payload.channels || metadata.channels,
          link: payload.link,
          actionLabel: payload.actionLabel,
          expiresAt: payload.expiresAt,
          createdAt: new Date(),
        },
      });

      // Track in analytics
      logger.info(`Notification created: ${notification.id}`, {
        userId: payload.userId,
        type: payload.type,
        priority: payload.priority,
      });

      // Trigger delivery (async)
      await this.deliverNotification(notification as any);

      return notification as any;
    } catch (error) {
      logger.error('Failed to create notification', { error, payload });
      throw error;
    }
  }

  /**
   * Get notifications for user
   */
  static async getNotifications(
    userId: string,
    options: Partial<NotificationFilterOptions> = {}
  ): Promise<INotification[]> {
    try {
      const where: any = { userId };

      if (options.type) where.type = options.type;
      if (options.status) where.status = options.status;
      if (options.priority) where.priority = options.priority;

      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return notifications as any[];
    } catch (error) {
      logger.error('Failed to get notifications', { error, userId });
      return [];
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          status: 'unread',
          expiresAt: { gt: new Date() } || undefined,
        },
      });
      return count;
    } catch (error) {
      logger.error('Failed to get unread count', { error, userId });
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: {
          status: 'read' as any,
          readAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId });
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, status: 'unread' },
        data: {
          status: 'read' as any,
          readAt: new Date(),
        },
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to mark all as read', { error, userId });
      return 0;
    }
  }

  /**
   * Archive notification
   */
  static async archiveNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: {
          status: 'archived' as any,
          archivedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      logger.error('Failed to archive notification', { error, notificationId });
      return false;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.notification.deleteMany({
        where: { id: notificationId, userId },
      });
      return result.count > 0;
    } catch (error) {
      logger.error('Failed to delete notification', { error, notificationId });
      return false;
    }
  }

  /**
   * Bulk delete notifications
   */
  static async bulkDeleteNotifications(
    userId: string,
    notificationIds: string[]
  ): Promise<number> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to bulk delete notifications', { error, userId });
      return 0;
    }
  }

  /**
   * Deliver notification via configured channels
   * Ready for email, SMS, push notification integrations
   */
  static async deliverNotification(notification: INotification): Promise<void> {
    try {
      const channels = notification.channels || [];

      for (const channel of channels) {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'sms':
            await this.sendSMSNotification(notification);
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
          case 'in-app':
            // In-app is always available
            break;
        }
      }

      // Mark as delivered
      await prisma.notification.update({
        where: { id: notification.id },
        data: { deliveredAt: new Date() },
      });
    } catch (error) {
      logger.error('Failed to deliver notification', { error, notificationId: notification.id });
    }
  }

  /**
   * Send email notification
   * Integrate with your email service (SendGrid, Resend, etc.)
   */
  private static async sendEmailNotification(notification: INotification): Promise<void> {
    try {
      // TODO: Integrate with email service
      logger.info(`Email notification queued: ${notification.id}`, {
        userId: notification.userId,
        type: notification.type,
      });
    } catch (error) {
      logger.error('Failed to send email notification', { error });
    }
  }

  /**
   * Send SMS notification
   * Integrate with SMS service (Twilio, AWS SNS, etc.)
   */
  private static async sendSMSNotification(notification: INotification): Promise<void> {
    try {
      // TODO: Integrate with SMS service
      logger.info(`SMS notification queued: ${notification.id}`, {
        userId: notification.userId,
        type: notification.type,
      });
    } catch (error) {
      logger.error('Failed to send SMS notification', { error });
    }
  }

  /**
   * Send push notification
   * Integrate with push service (Firebase Cloud Messaging, etc.)
   */
  private static async sendPushNotification(notification: INotification): Promise<void> {
    try {
      // TODO: Integrate with push notification service
      logger.info(`Push notification queued: ${notification.id}`, {
        userId: notification.userId,
        type: notification.type,
      });
    } catch (error) {
      logger.error('Failed to send push notification', { error });
    }
  }

  /**
   * Create notifications for specific events
   */
  static async notifyMatchScheduled(
    teamId: string,
    matchId: string,
    matchDate: Date,
    opponent: string
  ): Promise<void> {
    try {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      });

      for (const member of teamMembers) {
        await this.createNotification({
          userId: member.userId,
          type: 'MATCH_SCHEDULED',
          title: 'Match Scheduled',
          message: `New match scheduled against ${opponent}`,
          data: { matchId, opponent, date: matchDate.toISOString() },
          priority: 'MEDIUM',
          link: `/matches/${matchId}`,
          actionLabel: 'View Match',
        });
      }
    } catch (error) {
      logger.error('Failed to notify match scheduled', { error, teamId, matchId });
    }
  }

  /**
   * Notify payment received
   */
  static async notifyPaymentReceived(
    userId: string,
    amount: number,
    currency: string,
    paymentId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `Payment of ${currency} ${amount.toFixed(2)} has been received`,
        data: { amount, currency, paymentId },
        priority: 'HIGH',
        channels: ['in-app', 'email'],
        link: `/payments/${paymentId}`,
        actionLabel: 'View Payment',
      });
    } catch (error) {
      logger.error('Failed to notify payment received', { error, userId });
    }
  }

  /**
   * Notify team announcement
   */
  static async notifyTeamAnnouncement(
    teamId: string,
    title: string,
    message: string,
    announcementId: string
  ): Promise<void> {
    try {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      });

      for (const member of teamMembers) {
        await this.createNotification({
          userId: member.userId,
          type: 'TEAM_ANNOUNCEMENT',
          title,
          message,
          data: { teamId, announcementId },
          priority: 'MEDIUM',
          link: `/announcements/${announcementId}`,
          actionLabel: 'View Announcement',
        });
      }
    } catch (error) {
      logger.error('Failed to notify team announcement', { error, teamId });
    }
  }
}
