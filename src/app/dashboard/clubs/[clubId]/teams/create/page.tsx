'use client';

/**
 * PitchConnect Create Team Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/clubs/[clubId]/teams/create/page.tsx
 * 
 * Features:
 * ✅ Create new team with name, age group, and category
 * ✅ Age group selection (Senior, U21, U18, U16, U14, U12, U10)
 * ✅ Team category selection with icons (First Team, Reserves, Youth, Women's)
 * ✅ Interactive category selection with visual feedback
 * ✅ Real-time preview of team configuration
 * ✅ Form validation and error handling
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Automatic redirect on successful creation
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Loading states and disabled buttons
 */

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Trophy,
  Calendar,
  Loader2,
  CheckCircle,
  Shield,
  AlertCircle,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface TeamFormData {
  name: string;
  ageGroup: string;
  category: string;
  description?: string;
  sport?: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// AGE GROUPS & CATEGORIES - FROM PRISMA SCHEMA
// ============================================================================

const AGE_GROUPS = [
  { value: 'SENIOR', label: 'Senior (18+)' },
  { value: 'U21', label: 'Under 21' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U14', label: 'Under 14' },
  { value: 'U12', label: 'Under 12' },
  { value: 'U10', label: 'Under 10' },
] as const;

const TEAM_CATEGORIES = [
  { value: 'FIRST_TEAM', label: 'First Team', icon: Trophy, description: 'Primary competitive team' },
  { value: 'RESERVES', label: 'Reserves', icon: Users, description: 'Reserve/backup players' },
  { value: 'YOUTH', label: 'Youth/Academy', icon: Calendar, description: 'Youth development squad' },
  { value: 'WOMENS', label: "Women's Team", icon: Shield, description: 'Women\'s competitive team' },
] as const;

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
// BADGE COMPONENT
// ============================================================================

const Badge = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
}) => {
  const variants = {
    default: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400',
    outline:
      'border border-neutral-200 bg-white text-charcoal-700 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300',
  };

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// ============================================================================
// CATEGORY CARD COMPONENT
// ============================================================================

const CategoryCard = ({
  category,
  isSelected,
  onSelect,
}: {
  category: (typeof TEAM_CATEGORIES)[number];
  isSelected: boolean;
  onSelect: (value: string) => void;
}) => {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(category.value)}
      className={`group rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? 'border-gold-500 bg-gold-50 dark:border-gold-500 dark:bg-gold-900/20'
          : 'border-neutral-200 hover:border-gold-300 dark:border-charcoal-700 dark:hover:border-gold-500'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-5 w-5 transition-colors ${
            isSelected
              ? 'text-gold-600 dark:text-gold-400'
              : 'text-charcoal-400 group-hover:text-gold-500 dark:text-charcoal-500'
          }`}
        />
        <div className="text-left">
          <p className="font-semibold text-sm text-charcoal-900 dark:text-white">
            {category.label}
          </p>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
            {category.description}
          </p>
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CreateTeamPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  // State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    ageGroup: 'SENIOR',
    category: 'FIRST_TEAM',
    description: '',
  });

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
  // FORM HANDLERS
  // ========================================================================

  const handleInputChange = (field: keyof TeamFormData, value: string) => {
    setTeamData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!teamData.name.trim()) {
      showToast('Please provide a team name', 'error');
      return;
    }

    if (teamData.name.trim().length < 2) {
      showToast('Team name must be at least 2 characters', 'error');
      return;
    }

    if (!teamData.ageGroup) {
      showToast('Please select an age group', 'error');
      return;
    }

    if (!teamData.category) {
      showToast('Please select a team category', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamData.name.trim(),
          ageGroup: teamData.ageGroup,
          category: teamData.category,
          description: teamData.description?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || 'Failed to create team. Please try again.'
        );
      }

      const data = await response.json();
      showToast('🎉 Team created successfully!', 'success');

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/clubs/${clubId}/teams/${data.teamId}`);
      }, 1200);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create team. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Team creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/clubs/${clubId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-200 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Club
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-500 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white">
                Create New Team
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">Add a team to your club</p>
            </div>
          </div>
        </div>

        {/* FORM CARD */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Users className="h-5 w-5 text-gold-600 dark:text-gold-400" />
              Team Information
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Set up your team details
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TEAM NAME */}
              <div className="space-y-2">
                <label
                  htmlFor="teamName"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., First Team, U21 Squad, Arsenal Academy"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                />
                <p className="text-xs text-charcoal-500 dark:text-charcoal-500">
                  {teamData.name.length}/50 characters
                </p>
              </div>

              {/* AGE GROUP */}
              <div className="space-y-2">
                <label
                  htmlFor="ageGroup"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Age Group <span className="text-red-500">*</span>
                </label>
                <select
                  id="ageGroup"
                  value={teamData.ageGroup}
                  onChange={(e) => handleInputChange('ageGroup', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                >
                  {AGE_GROUPS.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TEAM CATEGORY */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Team Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {TEAM_CATEGORIES.map((category) => (
                    <CategoryCard
                      key={category.value}
                      category={category}
                      isSelected={teamData.category === category.value}
                      onSelect={(value) => handleInputChange('category', value)}
                    />
                  ))}
                </div>
              </div>

              {/* DESCRIPTION (Optional) */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Description <span className="text-xs text-charcoal-500">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  value={teamData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add notes about this team (e.g., training schedule, goals, focus areas)"
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                />
              </div>

              {/* PREVIEW */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-charcoal-700 dark:bg-charcoal-700/50">
                <p className="mb-3 text-sm font-medium text-charcoal-600 dark:text-charcoal-400">
                  Preview:
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{teamData.ageGroup || 'Select Age Group'}</Badge>
                    <Badge variant="outline">
                      {teamData.category?.replace(/_/g, ' ') || 'Select Category'}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-charcoal-900 dark:text-white">
                    {teamData.name || 'Team Name'}
                  </p>
                  {teamData.description && (
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      {teamData.description}
                    </p>
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-neutral-200 pt-6 dark:border-charcoal-700">
                <Link href={`/dashboard/clubs/${clubId}`}>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="rounded-lg border border-neutral-200 px-6 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 disabled:opacity-50 dark:border-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !teamData.name.trim()}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-gold-600 dark:to-orange-500 dark:hover:from-gold-700 dark:hover:to-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Team
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* HELPFUL TIPS */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">💡 Tip:</span> You can add members and coaches to your
            team after creation. Teams can be customized with team rules, training schedules, and more.
          </p>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
