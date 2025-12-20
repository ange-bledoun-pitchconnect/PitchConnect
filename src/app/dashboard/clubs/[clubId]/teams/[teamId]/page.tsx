'use client';

/**
 * PitchConnect Team Details Management Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/clubs/[clubId]/teams/[teamId]/page.tsx
 * 
 * Features:
 * ✅ Team overview with detailed statistics
 * ✅ Team members roster management (add/remove/change roles)
 * ✅ Member role assignments (Manager, Coach, Player, Staff)
 * ✅ Member status tracking (Active, Inactive, Invited)
 * ✅ Quick stats cards (Managers, Coaches, Players, Staff)
 * ✅ Member avatars with fallback initials
 * ✅ Dropdown menu for member actions
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Add member modal integration
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Comprehensive error handling
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Plus,
  Settings,
  Loader2,
  Mail,
  Shield,
  UserMinus,
  Trophy,
  Edit,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import AddMemberModal from '@/components/teams/AddMemberModal';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface TeamMember {
  id: string;
  role: 'MANAGER' | 'COACH' | 'PLAYER' | 'STAFF';
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  ageGroup?: string;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sport?: string;
  description?: string;
  members: TeamMember[];
  _count?: {
    members: number;
    players?: number;
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// ROLE LABELS & COLORS - FROM PRISMA SCHEMA
// ============================================================================

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Manager',
  COACH: 'Coach',
  PLAYER: 'Player',
  STAFF: 'Staff',
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MANAGER: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },
  COACH: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  PLAYER: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  STAFF: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
  },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: {
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  INACTIVE: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
  },
  INVITED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
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
// BADGE COMPONENT
// ============================================================================

const Badge = ({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning';
  className?: string;
}) => {
  const variants = {
    default: 'bg-neutral-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-300',
    outline:
      'border border-neutral-200 bg-white text-charcoal-700 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

const MemberAvatar = ({
  avatar,
  firstName,
  lastName,
}: {
  avatar?: string | null;
  firstName: string;
  lastName: string;
}) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={`${firstName} ${lastName}`}
        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-orange-500 font-bold text-white shadow-md">
      {initials}
    </div>
  );
};

// ============================================================================
// DROPDOWN MENU COMPONENT
// ============================================================================

const DropdownMenu = ({
  memberId,
  memberName,
  onChangeRole,
  onRemove,
}: {
  memberId: string;
  memberName: string;
  onChangeRole: (memberId: string, role: string) => void;
  onRemove: (memberId: string, memberName: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
      >
        <MoreVertical className="h-4 w-4 text-charcoal-600 dark:text-charcoal-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
          <button
            onClick={() => {
              onChangeRole(memberId, 'MANAGER');
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <Edit className="h-4 w-4" />
            Make Manager
          </button>
          <button
            onClick={() => {
              onChangeRole(memberId, 'COACH');
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <Edit className="h-4 w-4" />
            Make Coach
          </button>
          <button
            onClick={() => {
              onChangeRole(memberId, 'PLAYER');
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <Edit className="h-4 w-4" />
            Make Player
          </button>
          <button
            onClick={() => {
              onChangeRole(memberId, 'STAFF');
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <Edit className="h-4 w-4" />
            Make Staff
          </button>
          <div className="border-t border-neutral-200 dark:border-charcoal-700" />
          <button
            onClick={() => {
              onRemove(memberId, memberName);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <UserMinus className="h-4 w-4" />
            Remove from Team
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'purple' | 'blue' | 'green' | 'orange';
}) => {
  const colorClasses = {
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <p className="mb-2 text-sm font-medium text-charcoal-600 dark:text-charcoal-400">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State Management
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);

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

  const fetchTeamData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      setTeam(data.team || data);
    } catch (error) {
      console.error('Error fetching team:', error);
      showToast('Failed to load team data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId, showToast]);

  useEffect(() => {
    if (clubId && teamId) {
      fetchTeamData();
    }
  }, [clubId, teamId, fetchTeamData]);

  // ========================================================================
  // REMOVE MEMBER HANDLER
  // ========================================================================

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) {
      return;
    }

    try {
      setProcessingMemberId(memberId);

      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      setTeam((prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) }
          : null
      );

      showToast(`${memberName} removed from team`, 'success');
    } catch (error) {
      console.error('Error removing member:', error);
      showToast('Failed to remove member. Please try again.', 'error');
    } finally {
      setProcessingMemberId(null);
    }
  };

  // ========================================================================
  // CHANGE MEMBER ROLE HANDLER
  // ========================================================================

  const handleChangeMemberRole = async (memberId: string, newRole: string) => {
    try {
      setProcessingMemberId(memberId);

      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member role');
      }

      setTeam((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) =>
                m.id === memberId ? { ...m, role: newRole as TeamMember['role'] } : m
              ),
            }
          : null
      );

      showToast(`Member role updated to ${ROLE_LABELS[newRole]}`, 'success');
    } catch (error) {
      console.error('Error updating member:', error);
      showToast('Failed to update member role. Please try again.', 'error');
    } finally {
      setProcessingMemberId(null);
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-600 dark:text-gold-500" />
          <p className="font-medium text-charcoal-600 dark:text-charcoal-400">Loading team...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // NOT FOUND STATE
  // ========================================================================

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800">
        <div className="text-center">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
          <p className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
            Team not found
          </p>
          <p className="mb-6 text-charcoal-600 dark:text-charcoal-400">
            The team you're looking for doesn't exist or you don't have access
          </p>
          <Link href={`/dashboard/clubs/${clubId}`}>
            <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600">
              <ArrowLeft className="h-4 w-4" />
              Back to Club
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ========================================================================
  // CALCULATIONS
  // ========================================================================

  const memberStats = {
    managers: team.members.filter((m) => m.role === 'MANAGER').length,
    coaches: team.members.filter((m) => m.role === 'COACH').length,
    players: team.members.filter((m) => m.role === 'PLAYER').length,
    staff: team.members.filter((m) => m.role === 'STAFF').length,
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/clubs/${clubId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-200 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Club
            </button>
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* TEAM INFO */}
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-500 shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                    {team.name}
                  </h1>
                  {team.ageGroup && (
                    <Badge variant="default" className="bg-gold-100 text-gold-700">
                      {team.ageGroup}
                    </Badge>
                  )}
                  {team.category && (
                    <Badge variant="outline">{team.category.replace(/_/g, ' ')}</Badge>
                  )}
                  {team.status && (
                    <Badge
                      variant={team.status === 'ACTIVE' ? 'success' : 'default'}
                      className={
                        team.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : ''
                      }
                    >
                      {team.status}
                    </Badge>
                  )}
                </div>
                <p className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
                  <Users className="h-4 w-4" />
                  {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 shadow-md"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Managers" value={memberStats.managers} color="purple" />
          <StatCard label="Coaches" value={memberStats.coaches} color="blue" />
          <StatCard label="Players" value={memberStats.players} color="green" />
          <StatCard label="Staff" value={memberStats.staff} color="orange" />
        </div>

        {/* TEAM MEMBERS SECTION */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Users className="h-5 w-5 text-gold-600 dark:text-gold-400" />
              Team Members
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Manage your team roster and member roles
            </p>
          </div>

          <div className="p-6">
            {team.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
                  No members yet
                </h3>
                <p className="mb-6 text-charcoal-600 dark:text-charcoal-400">
                  Add members to build your team
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Add First Member
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 transition-all hover:border-gold-300 hover:shadow-md dark:border-charcoal-700 dark:hover:border-gold-500"
                  >
                    {/* MEMBER INFO */}
                    <div className="flex flex-1 items-center gap-4">
                      <MemberAvatar
                        avatar={member.user.avatar}
                        firstName={member.user.firstName}
                        lastName={member.user.lastName}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal-900 dark:text-white">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{member.user.email}</span>
                        </p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-500">
                          Joined{' '}
                          {new Date(member.joinedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* BADGES & ACTIONS */}
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <Badge
                        variant="default"
                        className={`${ROLE_COLORS[member.role].bg} ${ROLE_COLORS[member.role].text} border ${ROLE_COLORS[member.role].border}`}
                      >
                        {ROLE_LABELS[member.role]}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`${STATUS_COLORS[member.status].bg} ${STATUS_COLORS[member.status].text}`}
                      >
                        {member.status}
                      </Badge>

                      <DropdownMenu
                        memberId={member.id}
                        memberName={`${member.user.firstName} ${member.user.lastName}`}
                        onChangeRole={handleChangeMemberRole}
                        onRemove={handleRemoveMember}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD MEMBER MODAL */}
      {showInviteModal && (
        <AddMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          clubId={clubId}
          teamId={teamId}
          onSuccess={fetchTeamData}
        />
      )}

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
