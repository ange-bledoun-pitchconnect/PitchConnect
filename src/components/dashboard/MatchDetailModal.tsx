/**
 * ============================================================================
 * MatchDetailModal Component
 * ============================================================================
 * 
 * Enterprise-grade match detail modal with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users viewing match details
 * - COACH: Lineup management
 * - REFEREE: Match officiating
 * - ANALYST: Match analysis
 * 
 * SCHEMA ALIGNMENT:
 * - Match/Fixture model
 * - Sport enum (all 12 sports)
 * - Team model
 * 
 * FEATURES:
 * - Sport-specific scoring display
 * - Dynamic terminology
 * - Lineup status
 * - Match info (venue, date, referee)
 * - Quick actions
 * - Keyboard accessible (Escape to close)
 * - Dark mode support
 * 
 * ============================================================================
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Calendar,
  Trophy,
  Activity,
  Whistle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getScoringTerm,
  type Sport,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MatchStatus = 
  | 'SCHEDULED' 
  | 'LIVE' 
  | 'HALF_TIME'
  | 'COMPLETED' 
  | 'FULL_TIME'
  | 'POSTPONED' 
  | 'CANCELLED';

export interface MatchTeam {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  clubId?: string;
}

export interface MatchDetail {
  id: string;
  sport: Sport;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  scheduledDate: string;
  venue?: string;
  city?: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  currentMinute?: number;
  currentPeriod?: number;
  attendance?: number;
  referee?: string;
  competition?: string;
  notes?: string;
  homeLineupConfirmed?: boolean;
  awayLineupConfirmed?: boolean;
}

export interface MatchDetailModalProps {
  /** Match data */
  match: MatchDetail | null;
  /** Modal open state */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Link prefix for match details page */
  linkPrefix?: string;
  /** Show lineup actions */
  showLineupActions?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get status badge configuration
 */
function getStatusBadge(status: MatchStatus) {
  switch (status) {
    case 'SCHEDULED':
      return {
        label: 'Scheduled',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: Calendar,
      };
    case 'LIVE':
      return {
        label: 'Live',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse',
        icon: Activity,
      };
    case 'HALF_TIME':
      return {
        label: 'Half Time',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: Clock,
      };
    case 'COMPLETED':
    case 'FULL_TIME':
      return {
        label: 'Full Time',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: Trophy,
      };
    case 'POSTPONED':
      return {
        label: 'Postponed',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        icon: AlertCircle,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
        icon: X,
      };
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-700',
        icon: Clock,
      };
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MatchDetailModal({
  match,
  isOpen,
  onClose,
  linkPrefix = '/dashboard/matches',
  showLineupActions = true,
  className,
}: MatchDetailModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  // Memoized sport config
  const sportConfig = useMemo(() => {
    if (!match) return null;
    return getSportConfig(match.sport);
  }, [match?.sport]);

  const scoringTerm = useMemo(() => {
    if (!match) return 'Score';
    return getScoringTerm(match.sport, false);
  }, [match?.sport]);

  if (!isOpen || !match || !sportConfig) return null;

  const statusBadge = getStatusBadge(match.status);
  const StatusIcon = statusBadge.icon;

  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';
  const isFinished = match.status === 'COMPLETED' || match.status === 'FULL_TIME';
  const isScheduled = match.status === 'SCHEDULED';
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-modal-title"
    >
      <Card
        className={cn('max-w-2xl w-full max-h-[90vh] overflow-y-auto', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{sportConfig.icon}</span>
            <h2 id="match-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Match Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Competition & Sport Badge */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline">
              {sportConfig.name}
            </Badge>
            {match.competition && (
              <Badge variant="secondary">
                {match.competition}
              </Badge>
            )}
          </div>

          {/* Teams & Score */}
          <div className="text-center space-y-4">
            {/* Home Team */}
            <div className="flex items-center justify-center gap-3">
              {match.homeTeam.logoUrl && (
                <img
                  src={match.homeTeam.logoUrl}
                  alt={match.homeTeam.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {match.homeTeam.name}
              </h3>
            </div>

            {/* Score */}
            {hasScore ? (
              <div>
                <p
                  className={cn(
                    'text-5xl font-bold',
                    isLive
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  )}
                >
                  {match.homeScore} - {match.awayScore}
                </p>
                {isLive && match.currentMinute !== undefined && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold mt-1 animate-pulse">
                    {match.currentMinute}' {match.currentPeriod && `(${sportConfig.periodName} ${match.currentPeriod})`}
                  </p>
                )}
                {isFinished && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Full Time
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-2xl text-gray-400 dark:text-gray-500">VS</p>
              </div>
            )}

            {/* Away Team */}
            <div className="flex items-center justify-center gap-3">
              {match.awayTeam.logoUrl && (
                <img
                  src={match.awayTeam.logoUrl}
                  alt={match.awayTeam.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {match.awayTeam.name}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={statusBadge.className}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {statusBadge.label}
            </Badge>
          </div>

          {/* Match Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Date */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatDate(match.scheduledDate)}
              </p>
            </div>

            {/* Time */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Time
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatTime(match.scheduledDate)}
              </p>
            </div>

            {/* Venue */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Venue
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {match.venue || 'TBD'}
                {match.city && `, ${match.city}`}
              </p>
            </div>

            {/* Status */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Status
              </p>
              <Badge className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
            </div>
          </div>

          {/* Additional Info (for finished matches) */}
          {isFinished && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {match.referee && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Whistle className="w-4 h-4" />
                    Referee
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {match.referee}
                  </p>
                </div>
              )}
              {match.attendance !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Attendance
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {match.attendance.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lineup Status */}
          {showLineupActions &&
            isScheduled &&
            (match.homeLineupConfirmed !== undefined ||
              match.awayLineupConfirmed !== undefined) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Lineup Status
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Home Lineup */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {match.homeTeam.shortName || match.homeTeam.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {match.homeLineupConfirmed ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Confirmed
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            Pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Away Lineup */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {match.awayTeam.shortName || match.awayTeam.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {match.awayLineupConfirmed ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Confirmed
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            Pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Notes */}
          {match.notes && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</p>
              <p className="text-gray-900 dark:text-white">{match.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
            <Link href={`${linkPrefix}/${match.id}`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-primary to-primary/80">
                <Eye className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            </Link>
            {showLineupActions && isScheduled && (
              <Link href={`${linkPrefix}/${match.id}/lineup`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Set Lineup
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

MatchDetailModal.displayName = 'MatchDetailModal';

export default MatchDetailModal;
