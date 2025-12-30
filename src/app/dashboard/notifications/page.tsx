'use client';

// ============================================================================
// 🔔 PITCHCONNECT - Notifications Page v7.5.0
// Path: app/(dashboard)/dashboard/notifications/page.tsx
// ============================================================================
//
// Comprehensive notification center with filtering, marking, and preferences.
// Supports 70+ notification types across all platform features.
//
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  ChevronRight,
  X,
  Calendar,
  Trophy,
  Activity,
  Users,
  Heart,
  DollarSign,
  FileText,
  Briefcase,
  Video,
  MessageCircle,
  Shield,
  Star,
  AlertCircle,
  Clock,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import {
  type Notification,
  type NotificationCategory,
  type NotificationType,
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_CATEGORIES,
  getNotificationConfig,
  getUnreadCount,
} from '@/types/notification';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationGroup {
  date: string;
  dateLabel: string;
  notifications: Notification[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockNotifications: Notification[] = [
  // Today
  { id: '1', userId: 'user1', type: 'MATCH_REMINDER', title: 'Match Tomorrow', message: 'League match vs Riverside FC kicks off at 3:00 PM', read: false, readAt: null, link: '/dashboard/matches/123', emailSent: true, pushSent: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', userId: 'user1', type: 'TRAINING_SCHEDULED', title: 'Training Session Added', message: 'New training session scheduled for Thursday at 6:00 PM', read: false, readAt: null, link: '/dashboard/training', emailSent: true, pushSent: true, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { id: '3', userId: 'user1', type: 'TEAM_ANNOUNCEMENT', title: 'Team Announcement', message: 'Important update regarding next week\'s fixtures', read: true, readAt: new Date(Date.now() - 1 * 60 * 60 * 1000), link: '/dashboard/team', emailSent: true, pushSent: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  
  // Yesterday
  { id: '4', userId: 'user1', type: 'MATCH_FULLTIME', title: 'Full Time: 3-1 Victory!', message: 'Congratulations on your win against Valley FC', read: true, readAt: new Date(), link: '/dashboard/matches/122', emailSent: true, pushSent: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '5', userId: 'user1', type: 'PLAYER_RATING_UPDATED', title: 'Rating Updated', message: 'Your match rating: 7.8', read: true, readAt: new Date(), link: '/dashboard/stats', emailSent: false, pushSent: false, createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) },
  { id: '6', userId: 'user1', type: 'PLAYER_ACHIEVEMENT_UNLOCKED', title: 'Achievement Unlocked!', message: 'You scored your 10th goal of the season', read: false, readAt: null, link: '/dashboard/achievements', emailSent: true, pushSent: true, createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000) },

  // This Week
  { id: '7', userId: 'user1', type: 'JOIN_REQUEST_APPROVED', title: 'Welcome to the Team!', message: 'Your join request for U21 Development Squad has been approved', read: true, readAt: new Date(), link: '/dashboard/team', emailSent: true, pushSent: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: '8', userId: 'user1', type: 'TRAINING_FEEDBACK', title: 'Training Feedback', message: 'Coach Williams has left feedback on your training performance', read: true, readAt: new Date(), link: '/dashboard/training/feedback', emailSent: true, pushSent: true, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
  { id: '9', userId: 'user1', type: 'MEDIA_UPLOADED', title: 'New Match Highlights', message: 'Highlights from last Saturday\'s match are now available', read: true, readAt: new Date(), link: '/dashboard/media', emailSent: false, pushSent: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: '10', userId: 'user1', type: 'PAYMENT_RECEIVED', title: 'Payment Confirmed', message: 'Your payment of £45.00 has been received', read: true, readAt: new Date(), emailSent: true, pushSent: false, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },

  // Older
  { id: '11', userId: 'user1', type: 'COMPETITION_FIXTURE', title: 'Cup Draw Released', message: 'View your team\'s cup fixtures for the season', read: true, readAt: new Date(), link: '/dashboard/competitions', emailSent: true, pushSent: true, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
  { id: '12', userId: 'user1', type: 'WELCOME', title: 'Welcome to PitchConnect!', message: 'Get started by completing your profile', read: true, readAt: new Date(), link: '/dashboard/profile', emailSent: true, pushSent: false, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const CATEGORY_CONFIG: Record<NotificationCategory, { icon: React.ElementType; color: string; label: string }> = {
  MATCH: { icon: Trophy, color: 'text-amber-400 bg-amber-500/10', label: 'Matches' },
  TRAINING: { icon: Activity, color: 'text-emerald-400 bg-emerald-500/10', label: 'Training' },
  TEAM: { icon: Users, color: 'text-blue-400 bg-blue-500/10', label: 'Team' },
  PLAYER: { icon: Star, color: 'text-purple-400 bg-purple-500/10', label: 'Player' },
  PAYMENT: { icon: DollarSign, color: 'text-green-400 bg-green-500/10', label: 'Payments' },
  APPROVAL: { icon: FileText, color: 'text-orange-400 bg-orange-500/10', label: 'Approvals' },
  MESSAGE: { icon: MessageCircle, color: 'text-sky-400 bg-sky-500/10', label: 'Messages' },
  JOB: { icon: Briefcase, color: 'text-violet-400 bg-violet-500/10', label: 'Jobs' },
  MEDIA: { icon: Video, color: 'text-pink-400 bg-pink-500/10', label: 'Media' },
  COMPETITION: { icon: Trophy, color: 'text-yellow-400 bg-yellow-500/10', label: 'Competitions' },
  MEDICAL: { icon: Heart, color: 'text-red-400 bg-red-500/10', label: 'Medical' },
  PARENT: { icon: Users, color: 'text-pink-400 bg-pink-500/10', label: 'Parent' },
  SOCIAL: { icon: Star, color: 'text-indigo-400 bg-indigo-500/10', label: 'Social' },
  SYSTEM: { icon: Shield, color: 'text-neutral-400 bg-neutral-500/10', label: 'System' },
};

function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete,
  isSelected,
  onSelect,
}: { 
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type];
  const categoryConfig = CATEGORY_CONFIG[config?.category || 'SYSTEM'];
  const CategoryIcon = categoryConfig.icon;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const content = (
    <div className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-all ${
      !notification.read 
        ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' 
        : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-900/50'
    } ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
    >
      {/* Selection checkbox */}
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(notification.id); }}
        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          isSelected 
            ? 'border-amber-500 bg-amber-500 text-black' 
            : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
        }`}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </button>

      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${categoryConfig.color}`}>
        <span className="text-lg">{config?.icon || '📌'}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`font-medium ${!notification.read ? 'text-white' : 'text-neutral-300'}`}>
              {notification.title}
            </p>
            <p className={`mt-0.5 text-sm ${!notification.read ? 'text-neutral-300' : 'text-neutral-500'}`}>
              {notification.message}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-neutral-500">{formatTime(notification.createdAt)}</span>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {!notification.read && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(notification.id); }}
              className="flex items-center gap-1 rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
            >
              <Check className="h-3 w-3" />
              Mark Read
            </button>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notification.id); }}
            className="flex items-center gap-1 rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-red-500/20 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </div>

      {notification.link && (
        <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-neutral-600" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}

function CategoryFilter({ 
  category, 
  isActive, 
  count, 
  onClick 
}: { 
  category: NotificationCategory | 'all'; 
  isActive: boolean; 
  count: number;
  onClick: () => void;
}) {
  if (category === 'all') {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-amber-500/10 text-amber-400' 
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <Bell className="h-4 w-4" />
        All
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs">{count}</span>
      </button>
    );
  }

  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-amber-500/10 text-amber-400' 
          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {config.label}
      {count > 0 && (
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs">{count}</span>
      )}
    </button>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800">
        <BellOff className="h-7 w-7 text-neutral-500" />
      </div>
      <h3 className="mt-4 font-medium text-white">No notifications</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">
        {filter === 'unread' 
          ? "You're all caught up! No unread notifications."
          : filter === 'all'
          ? "You don't have any notifications yet."
          : `No ${filter.toLowerCase()} notifications.`}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const config = NOTIFICATION_TYPE_CONFIG[n.type];
      const matchesCategory = categoryFilter === 'all' || config?.category === categoryFilter;

      // Read filter
      const matchesRead = readFilter === 'all' ||
        (readFilter === 'unread' && !n.read) ||
        (readFilter === 'read' && n.read);

      return matchesSearch && matchesCategory && matchesRead;
    });
  }, [notifications, searchQuery, categoryFilter, readFilter]);

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: NotificationGroup[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayItems: Notification[] = [];
    const yesterdayItems: Notification[] = [];
    const thisWeekItems: Notification[] = [];
    const olderItems: Notification[] = [];

    filteredNotifications.forEach((n) => {
      const date = new Date(n.createdAt);
      if (date >= today) {
        todayItems.push(n);
      } else if (date >= yesterday) {
        yesterdayItems.push(n);
      } else if (date >= weekAgo) {
        thisWeekItems.push(n);
      } else {
        olderItems.push(n);
      }
    });

    if (todayItems.length > 0) groups.push({ date: 'today', dateLabel: 'Today', notifications: todayItems });
    if (yesterdayItems.length > 0) groups.push({ date: 'yesterday', dateLabel: 'Yesterday', notifications: yesterdayItems });
    if (thisWeekItems.length > 0) groups.push({ date: 'thisWeek', dateLabel: 'This Week', notifications: thisWeekItems });
    if (olderItems.length > 0) groups.push({ date: 'older', dateLabel: 'Older', notifications: olderItems });

    return groups;
  }, [filteredNotifications]);

  // Counts
  const unreadCount = getUnreadCount(notifications);
  const categoryCounts = useMemo(() => {
    const counts: Record<NotificationCategory | 'all', number> = {
      all: notifications.length,
      MATCH: 0, TRAINING: 0, TEAM: 0, PLAYER: 0, PAYMENT: 0,
      APPROVAL: 0, MESSAGE: 0, JOB: 0, MEDIA: 0, COMPETITION: 0,
      MEDICAL: 0, PARENT: 0, SOCIAL: 0, SYSTEM: 0,
    };
    notifications.forEach((n) => {
      const config = NOTIFICATION_TYPE_CONFIG[n.type];
      if (config?.category) {
        counts[config.category]++;
      }
    });
    return counts;
  }, [notifications]);

  // Handlers
  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true, readAt: new Date() } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
    setSelectedIds(new Set());
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-500" />
          <p className="text-sm text-neutral-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
                <Bell className="h-8 w-8 text-amber-400" />
                Notifications
                {unreadCount > 0 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-black">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="mt-1 text-neutral-400">
                Stay updated with your latest activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark All Read
                </button>
              )}
              <Link
                href="/dashboard/settings/notifications"
                className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-2.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 py-2 pl-10 pr-4 text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as typeof readFilter)}
              className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-800 pb-4">
          <CategoryFilter
            category="all"
            isActive={categoryFilter === 'all'}
            count={categoryCounts.all}
            onClick={() => setCategoryFilter('all')}
          />
          {Object.keys(CATEGORY_CONFIG).slice(0, 6).map((cat) => {
            const category = cat as NotificationCategory;
            if (categoryCounts[category] === 0) return null;
            return (
              <CategoryFilter
                key={category}
                category={category}
                isActive={categoryFilter === category}
                count={categoryCounts[category]}
                onClick={() => setCategoryFilter(category)}
              />
            );
          })}
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <span className="text-sm font-medium text-amber-400">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  selectedIds.forEach(id => handleMarkRead(id));
                  setSelectedIds(new Set());
                }}
                className="flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
              >
                <Check className="h-4 w-4" />
                Mark Read
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Select All */}
        {filteredNotifications.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0
                  ? 'border-amber-500 bg-amber-500 text-black'
                  : 'border-neutral-700 bg-neutral-800'
              }`}>
                {selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0 && (
                  <Check className="h-3 w-3" />
                )}
              </div>
              Select all
            </button>
          </div>
        )}

        {/* Notifications List */}
        {groupedNotifications.length > 0 ? (
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <div key={group.date}>
                <h3 className="mb-3 text-sm font-medium text-neutral-400">{group.dateLabel}</h3>
                <div className="space-y-3">
                  {group.notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                      isSelected={selectedIds.has(notification.id)}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState filter={categoryFilter === 'all' ? readFilter : categoryFilter} />
        )}
      </div>
    </div>
  );
}
