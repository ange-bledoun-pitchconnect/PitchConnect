// ============================================================================
// src/components/notifications/NotificationCard.tsx
// Individual Notification Card
// ============================================================================

'use client';

import { AlertCircle, Archive, Trash2, CheckCircle } from 'lucide-react';
import { INotification } from '@/lib/notifications/notification-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface NotificationCardProps {
  notification: INotification;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
}: NotificationCardProps) {
  const isUnread = notification.status === 'unread';
  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        isUnread
          ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
          : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-charcoal-900 dark:text-white">
              {notification.title}
            </h3>
            <Badge className={priorityColors[notification.priority]}>
              {notification.priority}
            </Badge>
            {isUnread && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>

          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-charcoal-500">
            <span>
              {new Date(notification.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {isUnread && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkAsRead?.(notification.id)}
              title="Mark as read"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}

          {notification.link && (
            <Link href={notification.link}>
              <Button size="sm" variant="default">
                {notification.actionLabel || 'View'}
              </Button>
            </Link>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onArchive?.(notification.id)}
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete?.(notification.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
