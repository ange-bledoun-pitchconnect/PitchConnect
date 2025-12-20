'use client';

/**
 * PitchConnect Team Announcements Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/announcements/page.tsx
 *
 * Features:
 * ✅ Create team announcements with title and content
 * ✅ View all team announcements in chronological order
 * ✅ Delete announcements with confirmation
 * ✅ Display creator and timestamp information
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Form validation
 * ✅ Loading and error states
 * ✅ Empty state handling
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  MessageSquare,
  Trash2,
  Calendar,
  User,
  Bell,
  Send,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface Team {
  id: string;
  name: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <Check className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// ANNOUNCEMENT CARD COMPONENT
// ============================================================================

const AnnouncementCard = ({
  announcement,
  onDelete,
}: {
  announcement: Announcement;
  onDelete: (id: string) => void;
}) => {
  const createdDate = new Date(announcement.createdAt);
  const formattedDate = createdDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = createdDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-bold text-charcoal-900 dark:text-white">
            {announcement.title}
          </h3>
          <p className="mb-4 whitespace-pre-wrap text-charcoal-700 dark:text-charcoal-300">
            {announcement.content}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-600 dark:text-charcoal-400">
            <span className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              {announcement.creator.firstName} {announcement.creator.lastName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {formattedDate} at {formattedTime}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(announcement.id)}
          className="rounded-lg bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          title="Delete announcement"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function AnnouncementsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State Management
  const [team, setTeam] = useState<Team | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchData();
  }, [clubId, teamId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teamRes, announcementsRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/announcements`),
      ]);

      if (!teamRes.ok) throw new Error('Failed to fetch team');
      if (!announcementsRes.ok)
        throw new Error('Failed to fetch announcements');

      const [teamData, announcementsData] = await Promise.all([
        teamRes.json(),
        announcementsRes.json(),
      ]);

      setTeam(teamData);
      setAnnouncements(announcementsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load announcements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an announcement title', 'error');
      return;
    }

    if (!content.trim()) {
      showToast('Please enter announcement content', 'error');
      return;
    }

    try {
      setIsCreating(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/announcements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create announcement');
      }

      const newAnnouncement = await response.json();
      setAnnouncements([newAnnouncement, ...announcements]);
      setTitle('');
      setContent('');
      showToast('Announcement posted successfully!', 'success');
    } catch (error) {
      console.error('Error creating announcement:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to create announcement',
        'error'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this announcement? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setIsDeleting(announcementId);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/announcements/${announcementId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete announcement');

      setAnnouncements(
        announcements.filter((a) => a.id !== announcementId)
      );
      showToast('Announcement deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast('Failed to delete announcement', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-teal-50/10 to-cyan-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-teal-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading announcements...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-teal-50/10 to-cyan-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 shadow-lg">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                Team Announcements
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                {team
                  ? `Communicate with your ${team.name}`
                  : 'Manage team announcements'}
              </p>
            </div>
          </div>
        </div>

        {/* CREATE ANNOUNCEMENT FORM */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
              New Announcement
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Post an important update to your team
            </p>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4 p-6">
            {/* Title Field */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
              >
                Announcement Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Match Schedule Updated, Practice Times Changed"
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-teal-500"
              />
            </div>

            {/* Content Field */}
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement here... You can include details, instructions, or important information for your team."
                rows={5}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all placeholder-charcoal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500 dark:focus:border-teal-500"
              />
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                {content.length} characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setContent('');
                }}
                className="rounded-lg border border-neutral-300 bg-white px-6 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isCreating || !title.trim() || !content.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 px-6 py-2 font-semibold text-white transition-all hover:from-teal-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Post Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ANNOUNCEMENTS LIST */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
              <MessageSquare className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
              <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
                No announcements yet
              </h3>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Post your first announcement to keep your team informed and
                engaged
              </p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="relative">
                {isDeleting === announcement.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 z-10">
                    <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-charcoal-800">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                    </div>
                  </div>
                )}
                <AnnouncementCard
                  announcement={announcement}
                  onDelete={handleDeleteAnnouncement}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
