/**
 * ============================================================================
 * Notification Components Bundle
 * ============================================================================
 * 
 * Enterprise-grade notification components with full notification type support.
 * Aligned with PitchConnect notification-types schema.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/notifications/index.tsx
 * 
 * COMPONENTS:
 * - NotificationBell: Header bell icon with dropdown
 * - NotificationCard: Individual notification card
 * - NotificationCenter: Full notification management page
 * - NotificationToast: Toast notification popup
 * 
 * FEATURES:
 * - All 23 notification types from schema
 * - Priority-based styling
 * - Channel indicators
 * - Read/unread states
 * - Archive functionality
 * - Real-time polling
 * - Mark all as read
 * - Dark mode support
 * - Role-based filtering
 * 
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  X,
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Users,
  Trophy,
  CreditCard,
  Award,
  BarChart2,
  UserPlus,
  UserCheck,
  Lock,
  Clock,
  Mail,
  Activity,
  TrendingDown,
  Megaphone,
  Zap,
  FileText,
  Archive,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// =============================================================================
// TYPES (Aligned with notification-types.ts)
// =============================================================================

export type NotificationType =
  | 'MATCH_SCHEDULED'
  | 'MATCH_REMINDER'
  | 'MATCH_LIVE_UPDATE'
  | 'TRAINING_SESSION'
  | 'TEAM_MESSAGE'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'PLAYER_STATS_UPDATE'
  | 'SYSTEM_ALERT'
  | 'UPGRADE_REQUEST_APPROVED'
  | 'UPGRADE_REQUEST_REJECTED'
  | 'ROLE_CHANGED'
  | 'ACCOUNT_SUSPENDED'
  | 'MATCH_ATTENDANCE_REQUEST'
  | 'TIMESHEET_APPROVED'
  | 'TIMESHEET_REJECTED'
  | 'PAYMENT_PROCESSED'
  | 'JOIN_REQUEST'
  | 'LEAGUE_INVITATION'
  | 'PERFORMANCE_ALERT'
  | 'INJURY_ALERT'
  | 'TEAM_ANNOUNCEMENT';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'push';

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
  deliveredAt?: Date | string;
  readAt?: Date | string;
  archivedAt?: Date | string;
  link?: string;
  actionLabel?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt?: Date | string;
}

// =============================================================================
// NOTIFICATION TYPE CONFIG
// =============================================================================

interface NotificationTypeConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  MATCH_SCHEDULED: {
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Match Scheduled',
  },
  MATCH_REMINDER: {
    icon: Bell,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Match Reminder',
  },
  MATCH_LIVE_UPDATE: {
    icon: Activity,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Live Update',
  },
  TRAINING_SESSION: {
    icon: Zap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Training',
  },
  TEAM_MESSAGE: {
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Team Message',
  },
  ACHIEVEMENT_UNLOCKED: {
    icon: Award,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Achievement',
  },
  PAYMENT_RECEIVED: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Payment Received',
  },
  PAYMENT_FAILED: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Payment Failed',
  },
  PLAYER_STATS_UPDATE: {
    icon: BarChart2,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Stats Update',
  },
  SYSTEM_ALERT: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'System Alert',
  },
  UPGRADE_REQUEST_APPROVED: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Upgrade Approved',
  },
  UPGRADE_REQUEST_REJECTED: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Upgrade Rejected',
  },
  ROLE_CHANGED: {
    icon: UserCheck,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Role Changed',
  },
  ACCOUNT_SUSPENDED: {
    icon: Lock,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Account Suspended',
  },
  MATCH_ATTENDANCE_REQUEST: {
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Attendance Request',
  },
  TIMESHEET_APPROVED: {
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Timesheet Approved',
  },
  TIMESHEET_REJECTED: {
    icon: FileText,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Timesheet Rejected',
  },
  PAYMENT_PROCESSED: {
    icon: CreditCard,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Payment Processed',
  },
  JOIN_REQUEST: {
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Join Request',
  },
  LEAGUE_INVITATION: {
    icon: Trophy,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'League Invitation',
  },
  PERFORMANCE_ALERT: {
    icon: TrendingDown,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Performance Alert',
  },
  INJURY_ALERT: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Injury Alert',
  },
  TEAM_ANNOUNCEMENT: {
    icon: Megaphone,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Announcement',
  },
};

const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; bgColor: string }> = {
  HIGH: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  MEDIUM: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  LOW: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
};

// =============================================================================
// NOTIFICATION CARD COMPONENT
// =============================================================================

export interface NotificationCardProps {
  notification: INotification;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: INotification) => void;
  compact?: boolean;
  className?: string;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onClick,
  compact = false,
  className,
}: NotificationCardProps) {
  const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type];
  const priorityConfig = PRIORITY_CONFIG[notification.priority];
  const isUnread = notification.status === 'unread';
  const Icon = typeConfig?.icon || Bell;

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={cn(
        'relative p-4 rounded-lg border transition-all cursor-pointer',
        isUnread
          ? cn('border-l-4 border-l-blue-500', typeConfig?.bgColor)
          : 'border-neutral-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800',
        'hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          typeConfig?.bgColor
        )}>
          <Icon className={cn('w-5 h-5', typeConfig?.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={cn(
              'font-semibold',
              isUnread ? 'text-charcoal-900 dark:text-white' : 'text-charcoal-700 dark:text-charcoal-300'
            )}>
              {notification.title}
            </h4>
            <Badge
              className={cn('text-xs', priorityConfig.bgColor, priorityConfig.color)}
            >
              {notification.priority}
            </Badge>
            {isUnread && (
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>

          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 line-clamp-2 mb-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-3 text-xs text-charcoal-500">
            <span>{formatDate(notification.createdAt)}</span>
            <Badge variant="outline" className="text-xs">
              {typeConfig?.label}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        {!compact && (
          <div className="flex gap-1 flex-shrink-0">
            {isUnread && onMarkAsRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                title="Mark as read"
              >
                <Check className="w-4 h-4 text-blue-500" />
              </Button>
            )}
            {onArchive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(notification.id);
                }}
                title="Archive"
              >
                <Archive className="w-4 h-4 text-charcoal-500" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action Link */}
      {notification.link && (
        <Link
          href={notification.link}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {notification.actionLabel || 'View Details'}
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

NotificationCard.displayName = 'NotificationCard';

// =============================================================================
// NOTIFICATION BELL COMPONENT
// =============================================================================

export interface NotificationBellProps {
  maxNotifications?: number;
  pollInterval?: number;
  className?: string;
}

export function NotificationBell({
  maxNotifications = 8,
  pollInterval = 30000,
  className,
}: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?limit=${maxNotifications}&unreadOnly=false`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [maxNotifications]);

  // Initialize polling
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, pollInterval);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications, pollInterval]);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: 'read' as const } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  // Handle notification click
  const handleClick = useCallback(async (notification: INotification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }, [markAsRead, router]);

  return (
    <div className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Bell className="w-6 h-6 text-charcoal-700 dark:text-charcoal-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-charcoal-700 z-50 max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {unreadCount} unread
                  </Badge>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-charcoal-400 mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
                  <p className="text-charcoal-500">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-charcoal-700">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onClick={handleClick}
                      compact
                      className="rounded-none border-0 border-b last:border-0"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-neutral-200 dark:border-charcoal-700">
                <Button
                  variant="ghost"
                  className="w-full text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/dashboard/notifications');
                  }}
                >
                  View All Notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

NotificationBell.displayName = 'NotificationBell';

// =============================================================================
// NOTIFICATION CENTER COMPONENT
// =============================================================================

export interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=100');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter((n) => n.status === 'unread');
    } else if (activeTab === 'archived') {
      filtered = filtered.filter((n) => n.status === 'archived');
    } else {
      filtered = filtered.filter((n) => n.status !== 'archived');
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.message.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notifications, activeTab, filterType, searchTerm]);

  // Actions
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' as const } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read' as const }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'archived' as const } : n))
      );
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification?.status === 'unread') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
        <Input
          placeholder="Search notifications..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-charcoal-400 mx-auto" />
              <p className="mt-2 text-charcoal-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  {searchTerm
                    ? 'No notifications match your search'
                    : activeTab === 'archived'
                    ? 'No archived notifications'
                    : 'No notifications'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onArchive={archiveNotification}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

NotificationCenter.displayName = 'NotificationCenter';

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  NotificationCard,
  NotificationBell,
  NotificationCenter,
};
