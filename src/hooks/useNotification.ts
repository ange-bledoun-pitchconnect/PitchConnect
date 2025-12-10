// ============================================================================
// src/hooks/useNotifications.ts
// Custom Hook for Notification Management
// Production-ready with full CRUD operations
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  channels?: string[];
  createdAt: string;
  updatedAt: string;
  link?: string | null;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface UseNotificationsOptions {
  autoFetch?: boolean;
  pollInterval?: number; // in milliseconds
  limit?: number;
  onError?: (error: Error) => void;
}

/**
 * useNotifications Hook
 * Comprehensive notification management with real-time updates
 * 
 * Usage:
 * const {
 *   notifications,
 *   unreadCount,
 *   loading,
 *   error,
 *   fetchNotifications,
 *   markAsRead,
 *   markAllAsRead,
 *   deleteNotification,
 *   createNotification,
 * } = useNotifications();
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    autoFetch = true,
    pollInterval = 30000, // 30 seconds
    limit = 50,
    onError,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(
    async (options: any = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('limit', (options.limit || limit).toString());
        if (options.offset) params.append('offset', options.offset.toString());
        if (options.type) params.append('type', options.type);
        if (options.priority) params.append('priority', options.priority);
        if (options.unreadOnly) params.append('unreadOnly', 'true');

        const response = await fetch(`/api/notifications?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setNotifications([]);
            setUnreadCount(0);
            return;
          }
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          setTotalCount(data.totalCount || 0);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        if (onError) onError(error);
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [limit, onError]
  );

  /**
   * Initialize polling on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();

      // Set up polling
      if (pollInterval > 0) {
        pollIntervalRef.current = setInterval(
          () => fetchNotifications(),
          pollInterval
        );
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [autoFetch, fetchNotifications, pollInterval]);

  /**
   * Mark single notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read-all' }),
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      const data = await response.json();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success(`${data.count} notifications marked as read`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  }, []);

  /**
   * Delete single notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      const deletedNotification = notifications.find(
        (n) => n.id === notificationId
      );
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      toast.success('Notification deleted');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  /**
   * Archive notifications
   */
  const archiveNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          notificationIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to archive notifications');

      const data = await response.json();

      setNotifications((prev) =>
        prev.filter((n) => !notificationIds.includes(n.id))
      );

      const archivedUnread = notifications.filter(
        (n) => notificationIds.includes(n.id) && !n.read
      ).length;
      setUnreadCount((prev) => Math.max(0, prev - archivedUnread));

      toast.success(`${data.count} notifications archived`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Error archiving notifications:', error);
      toast.error('Failed to archive notifications');
    }
  }, [notifications]);

  /**
   * Create new notification (admin/system)
   */
  const createNotification = useCallback(
    async (payload: {
      userId: string;
      type: string;
      title: string;
      message: string;
      priority?: string;
      channels?: string[];
      link?: string;
      actionLabel?: string;
      metadata?: Record<string, any>;
    }) => {
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create notification');

        const data = await response.json();
        toast.success('Notification created');
        return data.notification;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Error creating notification:', error);
        toast.error('Failed to create notification');
        throw error;
      }
    },
    []
  );

  /**
   * Stop polling (cleanup)
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (pollInterval > 0 && !pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(
        () => fetchNotifications(),
        pollInterval
      );
    }
  }, [fetchNotifications, pollInterval]);

  return {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotifications,
    createNotification,
    stopPolling,
    startPolling,
  };
}

export default useNotifications;
