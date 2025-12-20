'use client';

/**
 * PitchConnect Team Coaches Management Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/clubs/[clubId]/teams/[teamId]/coaches/page.tsx
 * 
 * Features:
 * ✅ Manage coaching staff for teams
 * ✅ Add/remove coaches by email
 * ✅ Multiple coach roles (Head Coach, Assistant, Specialized Coaches)
 * ✅ Real-time search and filtering
 * ✅ Coach avatars with initials
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Error handling and validation
 */

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Users,
  Trash2,
  Mail,
  Search,
  Award,
  CheckCircle,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Coach {
  id: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  description?: string;
  _count?: {
    players: number;
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// COACH ROLES - FROM PRISMA SCHEMA
// ============================================================================

const COACH_ROLES = [
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'GOALKEEPER_COACH',
  'FITNESS_COACH',
  'STRENGTH_AND_CONDITIONING',
  'PHYSIOTHERAPIST',
  'SPORTS_PSYCHOLOGIST',
  'PERFORMANCE_COACH',
  'GOALKEEPING_COACH',
] as const;

const COACH_ROLE_LABELS: Record<string, string> = {
  HEAD_COACH: 'Head Coach',
  ASSISTANT_COACH: 'Assistant Coach',
  GOALKEEPER_COACH: 'Goalkeeper Coach',
  FITNESS_COACH: 'Fitness Coach',
  STRENGTH_AND_CONDITIONING: 'Strength & Conditioning',
  PHYSIOTHERAPIST: 'Physiotherapist',
  SPORTS_PSYCHOLOGIST: 'Sports Psychologist',
  PERFORMANCE_COACH: 'Performance Coach',
  GOALKEEPING_COACH: 'Goalkeeping Coach',
};

// ============================================================================
// TOAST COMPONENT (No External Dependency)
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
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
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
// AVATAR COMPONENT
// ============================================================================

const CoachAvatar = ({
  firstName,
  lastName,
  avatar,
}: {
  firstName: string;
  lastName: string;
  avatar?: string;
}) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={`${firstName} ${lastName}`}
        className="w-12 h-12 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
      {firstName[0]}
      {lastName[0]}
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TeamCoachesPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State Management
  const [team, setTeam] = useState<Team | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form State
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('HEAD_COACH');
  const [isAddingCoach, setIsAddingCoach] = useState(false);
  const [deletingCoachId, setDeletingCoachId] = useState<string | null>(null);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const fetchTeamAndCoaches = useCallback(async () => {
    try {
      setIsLoading(true);
      const [teamRes, coachesRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/coaches`),
      ]);

      if (!teamRes.ok) throw new Error('Failed to fetch team');
      if (!coachesRes.ok) throw new Error('Failed to fetch coaches');

      const [teamData, coachesData] = await Promise.all([teamRes.json(), coachesRes.json()]);

      setTeam(teamData);
      setCoaches(coachesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load team and coaches data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId, showToast]);

  useEffect(() => {
    if (clubId && teamId) {
      fetchTeamAndCoaches();
    }
  }, [clubId, teamId, fetchTeamAndCoaches]);

  // ========================================================================
  // ADD COACH HANDLER
  // ========================================================================

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newCoachEmail.trim()) {
      showToast('Please enter a coach email address', 'error');
      return;
    }

    if (!selectedRole) {
      showToast('Please select a role', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCoachEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      setIsAddingCoach(true);

      // Step 1: Search for user by email
      const userRes = await fetch(`/api/users/search?email=${encodeURIComponent(newCoachEmail)}`);

      if (!userRes.ok) {
        showToast('User not found with that email address', 'error');
        return;
      }

      const userData = await userRes.json();

      if (!userData?.id) {
        showToast('Invalid user data received', 'error');
        return;
      }

      // Step 2: Add coach to team
      const response = await fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/coaches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to add coach');
      }

      const newCoach = await response.json();
      setCoaches((prev) => [newCoach, ...prev]);
      setNewCoachEmail('');
      setSelectedRole('HEAD_COACH');

      showToast(`${userData.firstName || 'Coach'} added successfully!`, 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add coach. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Error adding coach:', error);
    } finally {
      setIsAddingCoach(false);
    }
  };

  // ========================================================================
  // REMOVE COACH HANDLER
  // ========================================================================

  const handleRemoveCoach = async (coachId: string, coachName: string) => {
    if (!confirm(`Are you sure you want to remove ${coachName} from the team?`)) {
      return;
    }

    try {
      setDeletingCoachId(coachId);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/coaches/${coachId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove coach');
      }

      setCoaches((prev) => prev.filter((c) => c.id !== coachId));
      showToast(`${coachName} removed from coaching staff`, 'success');
    } catch (error) {
      console.error('Error removing coach:', error);
      showToast('Failed to remove coach. Please try again.', 'error');
    } finally {
      setDeletingCoachId(null);
    }
  };

  // ========================================================================
  // FILTERING
  // ========================================================================

  const filteredCoaches = coaches.filter((c) =>
    `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold-600 dark:text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">Loading coaches...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <button className="mb-4 flex items-center gap-2 px-4 py-2 text-charcoal-700 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-200 dark:hover:bg-charcoal-700">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-500 shadow-lg">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="mb-1 text-3xl font-bold text-charcoal-900 dark:text-white">
                {team?.name} - Coaching Staff
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Build and manage your team's coaching staff
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ADD COACH FORM */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 lg:col-span-1">
            <h2 className="mb-1 text-lg font-bold text-charcoal-900 dark:text-white">Add Coach</h2>
            <p className="mb-6 text-sm text-charcoal-600 dark:text-charcoal-400">
              Assign coaches to your team
            </p>

            <form onSubmit={handleAddCoach} className="space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Coach Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={newCoachEmail}
                  onChange={(e) => setNewCoachEmail(e.target.value)}
                  placeholder="coach@example.com"
                  disabled={isAddingCoach}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                />
              </div>

              {/* Role Select */}
              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isAddingCoach}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                >
                  {COACH_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {COACH_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAddingCoach}
                className="w-full rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-3 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed dark:from-gold-600 dark:to-orange-500 dark:hover:from-gold-700 dark:hover:to-orange-600 flex items-center justify-center gap-2"
              >
                {isAddingCoach ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Coach
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COACHES LIST */}
          <div className="space-y-6 lg:col-span-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-500" />
              <input
                type="text"
                placeholder="Search coaches by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white pl-12 pr-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white dark:placeholder-charcoal-500"
              />
            </div>

            {/* Empty State */}
            {filteredCoaches.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
                <Users className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
                  {searchQuery ? 'No coaches found' : 'No coaches yet'}
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Add your first coach using the form on the left'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCoaches.map((coach) => (
                  <div
                    key={coach.id}
                    className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-1 gap-4">
                        <CoachAvatar
                          firstName={coach.user.firstName}
                          lastName={coach.user.lastName}
                          avatar={coach.user.avatar}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-1 font-bold text-charcoal-900 dark:text-white">
                            {coach.user.firstName} {coach.user.lastName}
                          </h3>
                          <p className="mb-2 text-sm font-semibold text-gold-600 dark:text-gold-400">
                            {COACH_ROLE_LABELS[coach.role] || coach.role}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-charcoal-600 dark:text-charcoal-400">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{coach.user.email}</span>
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() =>
                          handleRemoveCoach(
                            coach.id,
                            `${coach.user.firstName} ${coach.user.lastName}`
                          )
                        }
                        disabled={deletingCoachId === coach.id}
                        className="flex-shrink-0 rounded-lg bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        title="Remove coach"
                      >
                        {deletingCoachId === coach.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            {coaches.length > 0 && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                  <span className="font-semibold text-charcoal-900 dark:text-white">
                    {coaches.length}
                  </span>{' '}
                  {coaches.length === 1 ? 'coach' : 'coaches'} assigned to this team
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
