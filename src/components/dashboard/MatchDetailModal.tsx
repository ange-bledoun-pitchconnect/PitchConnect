// ============================================================================
// src/components/dashboard/MatchDetailModal.tsx
// Reusable Match Detail Modal Component
// ============================================================================

'use client';

import {
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Edit,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Match {
  id: string;
  homeTeam: {
    name: string;
    club: string;
  };
  awayTeam: {
    name: string;
    club: string;
  };
  date: string;
  venue: string | null;
  city?: string;
  status: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  attendance?: number;
  referee?: string;
  competition?: string;
  notes?: string;
  homeLineupConfirmed?: boolean;
  awayLineupConfirmed?: boolean;
}

interface MatchDetailModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchDetailModal({ match, isOpen, onClose }: MatchDetailModalProps) {
  if (!isOpen || !match) return null;

  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'LIVE';
  const isScheduled = match.status === 'SCHEDULED';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case 'LIVE':
        return <Badge className="bg-green-100 text-green-700 animate-pulse">Live</Badge>;
      case 'FINISHED':
        return <Badge className="bg-gray-100 text-gray-700">Finished</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-h-screen">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-neutral-200 bg-white">
          <h2 className="text-2xl font-bold text-charcoal-900">Match Details</h2>
          <button
            onClick={onClose}
            className="text-charcoal-500 hover:text-charcoal-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* TEAMS & SCORE */}
          <div className="text-center border-b border-neutral-200 pb-6">
            <p className="text-sm text-charcoal-600 mb-4">{match.competition || 'Match'}</p>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-charcoal-900">
                {match.homeTeam.name}
              </h3>
              {isFinished ? (
                <p className="text-4xl font-bold text-charcoal-900">
                  {match.homeGoals} - {match.awayGoals}
                </p>
              ) : isLive ? (
                <p className="text-4xl font-bold text-red-600">
                  {match.homeGoals} - {match.awayGoals}
                </p>
              ) : (
                <p className="text-lg text-charcoal-600">VS</p>
              )}
              <h3 className="text-2xl font-bold text-charcoal-900">
                {match.awayTeam.name}
              </h3>
            </div>
          </div>

          {/* MATCH INFO */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-charcoal-600 mb-2">Date</p>
              <p className="font-semibold text-charcoal-900">
                {new Date(match.date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-charcoal-600 mb-2">Time</p>
              <p className="font-semibold text-charcoal-900">
                {new Date(match.date).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-charcoal-600 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Venue
              </p>
              <p className="font-semibold text-charcoal-900">
                {match.venue || 'TBD'}
              </p>
            </div>
            <div>
              <p className="text-sm text-charcoal-600 mb-2">Status</p>
              <div>{getStatusBadge(match.status)}</div>
            </div>
          </div>

          {/* ADDITIONAL INFO */}
          {isFinished && (
            <div className="grid grid-cols-2 gap-6 border-t border-neutral-200 pt-6">
              {match.referee && (
                <div>
                  <p className="text-sm text-charcoal-600 mb-2">Referee</p>
                  <p className="font-semibold text-charcoal-900">{match.referee}</p>
                </div>
              )}
              {match.attendance && (
                <div>
                  <p className="text-sm text-charcoal-600 mb-2 flex items-center gap-1">
                    <Users className="w-4 h-4" /> Attendance
                  </p>
                  <p className="font-semibold text-charcoal-900">
                    {match.attendance.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LINEUP STATUS */}
          {isScheduled && (match.homeLineupConfirmed !== undefined || match.awayLineupConfirmed !== undefined) && (
            <div className="border-t border-neutral-200 pt-6">
              <h3 className="font-semibold text-charcoal-900 mb-3">Lineup Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-charcoal-600 mb-2">{match.homeTeam.name}</p>
                  <div className="flex items-center gap-2">
                    {match.homeLineupConfirmed ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Confirmed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-charcoal-600 mb-2">{match.awayTeam.name}</p>
                  <div className="flex items-center gap-2">
                    {match.awayLineupConfirmed ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Confirmed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTES */}
          {match.notes && (
            <div className="border-t border-neutral-200 pt-6">
              <p className="text-sm text-charcoal-600 mb-2">Notes</p>
              <p className="text-charcoal-900">{match.notes}</p>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="border-t border-neutral-200 pt-6 flex gap-3">
            <Link href={`/dashboard/matches/${match.id}`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white">
                <Eye className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            </Link>
            {isScheduled && (
              <Link href={`/dashboard/matches/${match.id}/lineup`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Set Lineup
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
