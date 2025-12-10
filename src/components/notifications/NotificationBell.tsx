// ============================================================================
// src/components/notifications/NotificationBell.tsx
// Notification Bell Icon with Badge - Production Ready
// ============================================================================

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  Calendar,
  Users,
  Trophy,
  Mail,
  AlertCircle,
  Zap,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  isRead?: boolean; // Backward compatibility
  createdAt: string;
  link: string | null;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  actionLabel?: string;
}

/**
 * NotificationBell Component
 * Displays unread notification count and dropdown with recent notifications
 * Auto-refreshes every 30 seconds, features real-time updates
 */
export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/notifications?limit=10&unreadOnly=false',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Cache: 'no-store',
          },
        }
      );

      if (!response.ok) {
        if (response.status !== 401) {
          console.error('Failed to fetch notifications:', response.status);
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize polling on mount
   */
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    pollIntervalRef.current = setInterval(fetchNotifications, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchNotifications]);

  /**
   * Mark individual notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      setIsMarking(true);
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'read' }),
          }
        );

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, read: true, isRead: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else {
          toast.error('Failed to mark notification as read');
        }
      } catch (error) {
        console.error('Error marking as read:', error);
        toast.error('Failed to mark notification as read');
      } finally {
        setIsMarking(false);
      }
    },
    []
  );

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );
          const deletedNotification = notifications.find(
            (n) => n.id === notificationId
          );
          if (deletedNotification && !deletedNotification.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          toast.success('Notification deleted');
        } else {
          toast.error('Failed to delete notification');
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
      }
    },
    [notifications]
  );

  /**
   * Handle notification click
   */
  const handleNotificationClick = useCallback(
    async (notification: NotificationItem) => {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      setIsOpen(false);
      if (notification.link) {
        router.push(notification.link);
      }
    },
    [markAsRead, router]
  );

  /**
   * Get notification icon based on type
   */
  const getNotificationIcon = (type: string) => {
    const iconProps = 'w-4 h-4';
    
    switch (type?.toUpperCase()) {
      case 'MATCH_SCHEDULED':
      case 'MATCH_REMINDER':
      case 'MATCH_LIVE_UPDATE':
        return <Trophy className={`${iconProps} text-amber-500`} />;
      
      case 'TRAINING_SESSION':
        return <Zap className={`${iconProps} text-green-500`} />;
      
      case 'TEAM_MESSAGE':
      case 'TEAM_ANNOUNCEMENT':
        return <Users className={`${iconProps} text-blue-500`} />;
      
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_PROCESSED':
        return <CheckCircle className={`${iconProps} text-green-600`} />;
      
      case 'PAYMENT_FAILED':
      case 'ACCOUNT_SUSPENDED':
      case 'INJURY_ALERT':
        return <AlertCircle className={`${iconProps} text-red-500`} />;
      
      case 'MESSAGE':
        return <Mail className={`${iconProps} text-purple-500`} />;
      
      default:
        return <Bell className={`${iconProps} text-blue-500`} />;
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-neutral-50 border-neutral-200';
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={`${unreadCount} unread notifications`}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-charcoal-700 dark:text-charcoal-200" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-charcoal-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-charcoal-600 dark:text-charcoal-300" />
              </button>
            </div>

            {/* Badge */}
            {unreadCount > 0 && (
              <div className="px-4 pt-3 pb-2">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300">
                  {unreadCount} {unreadCount === 1 ? 'notification' : 'notifications'} unread
                </Badge>
              </div>
            )}

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <p className="text-charcoal-600 dark:text-charcoal-300 mt-2">
                    Loading...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
                  <p className="text-charcoal-600 dark:text-charcoal-300">
                    No notifications
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {notifications.slice(0, 8).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer transition-colors border-l-4 ${
                        notification.read || notification.isRead
                          ? 'border-l-transparent hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                          : 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-neutral-100 dark:bg-neutral-700">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`text-sm font-semibold ${
                                notification.read || notification.isRead
                                  ? 'text-charcoal-700 dark:text-charcoal-300'
                                  : 'text-charcoal-900 dark:text-white'
                              }`}
                            >
                              {notification.title}
                            </p>
                            {notification.priority && (
                              <Badge
                                className={`text-xs ${getPriorityColor(
                                  notification.priority
                                )}`}
                              >
                                {notification.priority}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 line-clamp-2 mb-1">
                            {notification.message}
                          </p>

                          <p className="text-xs text-charcoal-500 dark:text-charcoal-500">
                            {new Date(notification.createdAt).toLocaleDateString(
                              'en-GB',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          {!notification.read && !notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-500"
                              title="Mark as read"
                              disabled={isMarking}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Link/Action */}
                      {notification.link && (
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {notification.actionLabel || 'View'} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/dashboard/notifications');
                  }}
                  className="w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  View All Notifications →
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
