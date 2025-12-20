'use client';

/**
 * PitchConnect Team Join Requests Management Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/clubs/[clubId]/teams/[teamId]/join-requests/page.tsx
 * 
 * Features:
 * ✅ Review and manage team join requests
 * ✅ Approve/reject player requests with confirmation
 * ✅ Display player profile information (position, foot, jersey, nationality)
 * ✅ Real-time request status updates
 * ✅ Separate pending and processed request sections
 * ✅ Player avatars with fallback initials
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Comprehensive action logging
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Advanced error handling
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  AlertCircle,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface PlayerProfile {
  id?: string;
  position?: string;
  preferredFoot?: string;
  jerseyNumber?: number | null;
  nationality?: string;
  height?: number;
  weight?: number;
}

interface JoinRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  playerProfile?: PlayerProfile;
}

interface Team {
  id: string;
  name: string;
  clubId: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// POSITION LABELS - FROM PRISMA SCHEMA
// ============================================================================

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: 'Goalkeeper',
  DEFENDER: 'Defender',
  MIDFIELDER: 'Midfielder',
  FORWARD: 'Forward',
  LEFT_BACK: 'Left Back',
  RIGHT_BACK: 'Right Back',
  CENTER_BACK: 'Center Back',
  DEFENSIVE_MIDFIELDER: 'Defensive Midfielder',
  CENTRAL_MIDFIELDER: 'Central Midfielder',
  ATTACKING_MIDFIELDER: 'Attacking Midfielder',
  LEFT_WINGER: 'Left Winger',
  RIGHT_WINGER: 'Right Winger',
  STRIKER: 'Striker',
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
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'pending' | 'rejected' | 'outline';
}) => {
  const variants = {
    default: 'bg-neutral-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
// AVATAR COMPONENT
// ============================================================================

const PlayerAvatar = ({
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
        className="h-14 w-14 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-orange-500 font-bold text-white shadow-md">
      {initials}
    </div>
  );
};

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="pending">Pending</Badge>;
    case 'APPROVED':
      return <Badge variant="success">✓ Approved</Badge>;
    case 'REJECTED':
      return <Badge variant="rejected">✗ Rejected</Badge>;
    case 'CANCELLED':
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TeamJoinRequestsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State Management
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const fetchJoinRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/join-requests`);

      if (!response.ok) {
        throw new Error('Failed to fetch join requests');
      }

      const data = await response.json();
      setRequests(data.joinRequests || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      showToast('Failed to load join requests', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId, showToast]);

  useEffect(() => {
    if (clubId && teamId) {
      fetchJoinRequests();
    }
  }, [clubId, teamId, fetchJoinRequests]);

  // ========================================================================
  // APPROVE REQUEST HANDLER
  // ========================================================================

  const handleApprove = async (requestId: string, playerName: string) => {
    try {
      setProcessingId(requestId);

      const response = await fetch(
        `/api/clubs/${clubId}/teams/${teamId}/join-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'APPROVE' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to approve request');
      }

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'APPROVED' as const } : req
        )
      );

      showToast(`✓ ${playerName} approved and added to team!`, 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to approve request. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Error approving request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================================================
  // REJECT REQUEST HANDLER
  // ========================================================================

  const handleReject = async (requestId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to reject ${playerName}'s join request?`)) {
      return;
    }

    try {
      setProcessingId(requestId);

      const response = await fetch(
        `/api/clubs/${clubId}/teams/${teamId}/join-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'REJECT' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to reject request');
      }

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'REJECTED' as const } : req
        )
      );

      showToast(`Request from ${playerName} rejected`, 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reject request. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Error rejecting request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================================================
  // FILTERING
  // ========================================================================

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const processedRequests = requests.filter((r) => r.status !== 'PENDING');

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-600 dark:text-gold-500" />
          <p className="font-medium text-charcoal-600 dark:text-charcoal-400">Loading join requests...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-200 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-500 shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-charcoal-900 dark:text-white">
                Join Requests
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                {pendingRequests.length} pending{' '}
                {pendingRequests.length === 1 ? 'request' : 'requests'}
              </p>
            </div>
          </div>
        </div>

        {/* PENDING REQUESTS SECTION */}
        <div className="mb-6 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Users className="h-5 w-5 text-gold-600 dark:text-gold-400" />
              Pending Requests
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Review and approve or reject player join requests
            </p>
          </div>

          <div className="p-6">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserPlus className="mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
                  No pending requests
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  All join requests have been processed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4 transition-all hover:border-gold-300 hover:shadow-md dark:border-charcoal-700 dark:hover:border-gold-500 md:flex-row md:items-center md:justify-between"
                  >
                    {/* PLAYER INFO */}
                    <div className="flex flex-1 gap-4">
                      <PlayerAvatar
                        avatar={request.user.avatar}
                        firstName={request.user.firstName}
                        lastName={request.user.lastName}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white">
                          {request.user.firstName} {request.user.lastName}
                        </h3>

                        {/* Email & Date */}
                        <div className="mt-2 space-y-1">
                          <p className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{request.user.email}</span>
                          </p>
                          <p className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            Requested{' '}
                            {new Date(request.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* PLAYER PROFILE BADGES */}
                        {request.playerProfile && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {request.playerProfile.position && (
                              <Badge variant="default">
                                {POSITION_LABELS[request.playerProfile.position] ||
                                  request.playerProfile.position.replace(/_/g, ' ')}
                              </Badge>
                            )}
                            {request.playerProfile.preferredFoot && (
                              <Badge variant="outline">
                                {request.playerProfile.preferredFoot} Footed
                              </Badge>
                            )}
                            {request.playerProfile.jerseyNumber && (
                              <Badge variant="default">
                                #{request.playerProfile.jerseyNumber}
                              </Badge>
                            )}
                            {request.playerProfile.nationality && (
                              <Badge variant="outline">{request.playerProfile.nationality}</Badge>
                            )}
                            {request.playerProfile.height && (
                              <Badge variant="outline">
                                {request.playerProfile.height} cm
                              </Badge>
                            )}
                            {request.playerProfile.weight && (
                              <Badge variant="outline">
                                {request.playerProfile.weight} kg
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 md:flex-shrink-0">
                      <button
                        onClick={() =>
                          handleApprove(
                            request.id,
                            `${request.user.firstName} ${request.user.lastName}`
                          )
                        }
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-600 px-4 py-2 font-semibold text-white transition-all hover:from-green-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:from-green-600 dark:to-green-600 dark:hover:from-green-700 dark:hover:to-green-700"
                      >
                        {processingId === request.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Processing</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Approve</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          handleReject(
                            request.id,
                            `${request.user.firstName} ${request.user.lastName}`
                          )
                        }
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-charcoal-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PROCESSED REQUESTS SECTION */}
        {processedRequests.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                <Shield className="h-5 w-5 text-charcoal-600 dark:text-charcoal-400" />
                Request History
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Previously processed join requests
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-charcoal-700"
                  >
                    {/* PLAYER INFO */}
                    <div className="flex items-center gap-4">
                      <PlayerAvatar
                        avatar={request.user.avatar}
                        firstName={request.user.firstName}
                        lastName={request.user.lastName}
                      />
                      <div>
                        <p className="font-semibold text-charcoal-900 dark:text-white">
                          {request.user.firstName} {request.user.lastName}
                        </p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          {request.user.email}
                        </p>
                      </div>
                    </div>

                    {/* STATUS & DATE */}
                    <div className="flex items-center gap-4">
                      <p className="hidden text-sm text-charcoal-600 dark:text-charcoal-400 sm:block">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <StatusBadge status={request.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE - NO REQUESTS AT ALL */}
        {requests.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <UserPlus className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
            <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
              No join requests
            </h3>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              Players will appear here when they request to join your team
            </p>
          </div>
        )}
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
