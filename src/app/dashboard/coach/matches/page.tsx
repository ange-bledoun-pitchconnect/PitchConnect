// =============================================================================
// 🏆 PITCHCONNECT - COACH MATCH MANAGEMENT v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach/matches
// Access: HEAD_COACH, ASSISTANT_COACH, MANAGER, ANALYST
// 
// FEATURES:
// ✅ View all club matches with team filtering
// ✅ Sport-specific event types (Goal, Try, Touchdown, Wicket, etc.)
// ✅ Live match event recording
// ✅ MatchStatus flow management
// ✅ Score tracking and attendance
// ✅ Schema-aligned with Match, MatchEvent, MatchEventType, MatchStatus
// ✅ Real-time match minute tracking
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Play,
  Pause,
  Flag,
  Clock,
  Users,
  Trophy,
  Calendar,
  MapPin,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
  Edit,
  Eye,
  Activity,
  Target,
  Shield,
  Zap,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type MatchStatus =
  | 'SCHEDULED' | 'WARMUP' | 'LIVE' | 'HALFTIME' | 'SECOND_HALF'
  | 'EXTRA_TIME_FIRST' | 'EXTRA_TIME_SECOND' | 'PENALTIES'
  | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'ABANDONED'
  | 'REPLAY_SCHEDULED' | 'VOIDED' | 'DELAYED' | 'SUSPENDED';

type MatchEventType =
  | 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'SECOND_YELLOW' | 'RED_CARD'
  | 'SUBSTITUTION_ON' | 'SUBSTITUTION_OFF' | 'INJURY' | 'INJURY_TIME'
  | 'FULLTIME' | 'HALFTIME' | 'KICKOFF' | 'PENALTY_SCORED' | 'PENALTY_MISSED'
  | 'PENALTY_SAVED' | 'OWN_GOAL' | 'VAR_REVIEW' | 'VAR_DECISION'
  | 'TRY' | 'CONVERSION' | 'PENALTY_GOAL' | 'DROP_GOAL' | 'SCRUM' | 'LINEOUT'
  | 'TOUCHDOWN' | 'FIELD_GOAL' | 'SAFETY_SCORE' | 'INTERCEPTION' | 'FUMBLE' | 'SACK'
  | 'THREE_POINTER' | 'FAST_BREAK' | 'TURNOVER' | 'OFFENSIVE_FOUL' | 'TRAVEL'
  | 'WICKET' | 'BOUNDARY' | 'MAIDEN_OVER' | 'WIDE' | 'NO_BALL' | 'BYE'
  | 'CENTER_PASS' | 'OBSTRUCTION' | 'INTERCEPT' | 'REBOUND'
  | 'TIMEOUT' | 'CHALLENGE_REVIEW' | 'HAT_TRICK' | 'CAPTAIN_CHANGE';

interface Team {
  id: string;
  name: string;
  clubId: string;
  ageGroup?: string | null;
}

interface Club {
  id: string;
  name: string;
  shortName?: string | null;
  logo?: string | null;
  sport: Sport;
  primaryColor?: string | null;
}

interface MatchEvent {
  id: string;
  matchId: string;
  playerId?: string | null;
  eventType: MatchEventType;
  minute: number;
  secondaryMinute?: number | null;
  period?: string | null;
  relatedPlayerId?: string | null;
  assistPlayerId?: string | null;
  details?: Record<string, unknown> | null;
  playerName?: string;
  teamSide?: 'home' | 'away';
}

interface Match {
  id: string;
  leagueId?: string | null;
  homeClubId: string;
  awayClubId: string;
  homeTeam: Club;
  awayTeam: Club;
  title?: string | null;
  kickOffTime: string;
  status: MatchStatus;
  venue?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homeHalftimeScore?: number | null;
  awayHalftimeScore?: number | null;
  attendance?: number | null;
  actualDuration?: number | null;
  injuryTimeFirst?: number | null;
  injuryTimeSecond?: number | null;
  events: MatchEvent[];
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, {
  label: string;
  icon: string;
  color: string;
  scoreLabel: string;
  periodLabel: string;
}> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600', scoreLabel: 'Goals', periodLabel: 'Half' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600', scoreLabel: 'Goals', periodLabel: 'Quarter' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600', scoreLabel: 'Points', periodLabel: 'Half' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600', scoreLabel: 'Points', periodLabel: 'Quarter' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600', scoreLabel: 'Runs', periodLabel: 'Innings' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600', scoreLabel: 'Goals', periodLabel: 'Period' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600', scoreLabel: 'Points', periodLabel: 'Quarter' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600', scoreLabel: 'Goals', periodLabel: 'Quarter' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600', scoreLabel: 'Points', periodLabel: 'Quarter' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600', scoreLabel: 'Points', periodLabel: 'Half' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600', scoreLabel: 'Goals', periodLabel: 'Half' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500', scoreLabel: 'Goals', periodLabel: 'Period' },
};

// Sport-specific event types
const SPORT_EVENTS: Record<Sport, Array<{ type: MatchEventType; label: string; icon: string; category: 'scoring' | 'discipline' | 'play' | 'other' }>> = {
  FOOTBALL: [
    { type: 'GOAL', label: 'Goal', icon: '⚽', category: 'scoring' },
    { type: 'ASSIST', label: 'Assist', icon: '👟', category: 'scoring' },
    { type: 'OWN_GOAL', label: 'Own Goal', icon: '😬', category: 'scoring' },
    { type: 'PENALTY_SCORED', label: 'Penalty Scored', icon: '🎯', category: 'scoring' },
    { type: 'PENALTY_MISSED', label: 'Penalty Missed', icon: '❌', category: 'scoring' },
    { type: 'PENALTY_SAVED', label: 'Penalty Saved', icon: '🧤', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'discipline' },
    { type: 'SECOND_YELLOW', label: 'Second Yellow', icon: '🟨🟨', category: 'discipline' },
    { type: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'discipline' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
    { type: 'SUBSTITUTION_OFF', label: 'Sub Off', icon: '🔽', category: 'play' },
    { type: 'INJURY', label: 'Injury', icon: '🩹', category: 'other' },
    { type: 'VAR_REVIEW', label: 'VAR Review', icon: '📺', category: 'other' },
  ],
  RUGBY: [
    { type: 'TRY', label: 'Try', icon: '🏉', category: 'scoring' },
    { type: 'CONVERSION', label: 'Conversion', icon: '🥅', category: 'scoring' },
    { type: 'PENALTY_GOAL', label: 'Penalty Goal', icon: '🎯', category: 'scoring' },
    { type: 'DROP_GOAL', label: 'Drop Goal', icon: '👢', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'discipline' },
    { type: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'discipline' },
    { type: 'SCRUM', label: 'Scrum', icon: '🤼', category: 'play' },
    { type: 'LINEOUT', label: 'Lineout', icon: '📏', category: 'play' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
    { type: 'INJURY', label: 'Injury', icon: '🩹', category: 'other' },
  ],
  BASKETBALL: [
    { type: 'GOAL', label: '2-Point', icon: '🏀', category: 'scoring' },
    { type: 'THREE_POINTER', label: '3-Point', icon: '🎯', category: 'scoring' },
    { type: 'PENALTY_SCORED', label: 'Free Throw', icon: '✅', category: 'scoring' },
    { type: 'PENALTY_MISSED', label: 'Free Throw Miss', icon: '❌', category: 'scoring' },
    { type: 'OFFENSIVE_FOUL', label: 'Offensive Foul', icon: '🚫', category: 'discipline' },
    { type: 'TURNOVER', label: 'Turnover', icon: '🔄', category: 'play' },
    { type: 'FAST_BREAK', label: 'Fast Break', icon: '⚡', category: 'play' },
    { type: 'TRAVEL', label: 'Travel', icon: '🚶', category: 'discipline' },
    { type: 'TIMEOUT', label: 'Timeout', icon: '⏸️', category: 'other' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
  ],
  AMERICAN_FOOTBALL: [
    { type: 'TOUCHDOWN', label: 'Touchdown', icon: '🏈', category: 'scoring' },
    { type: 'FIELD_GOAL', label: 'Field Goal', icon: '🥅', category: 'scoring' },
    { type: 'SAFETY_SCORE', label: 'Safety', icon: '🛡️', category: 'scoring' },
    { type: 'CONVERSION', label: 'Extra Point', icon: '➕', category: 'scoring' },
    { type: 'INTERCEPTION', label: 'Interception', icon: '🤚', category: 'play' },
    { type: 'FUMBLE', label: 'Fumble', icon: '🫳', category: 'play' },
    { type: 'SACK', label: 'Sack', icon: '💥', category: 'play' },
    { type: 'TIMEOUT', label: 'Timeout', icon: '⏸️', category: 'other' },
    { type: 'CHALLENGE_REVIEW', label: 'Challenge', icon: '🚩', category: 'other' },
  ],
  CRICKET: [
    { type: 'WICKET', label: 'Wicket', icon: '🏏', category: 'scoring' },
    { type: 'BOUNDARY', label: 'Boundary (4)', icon: '4️⃣', category: 'scoring' },
    { type: 'GOAL', label: 'Six', icon: '6️⃣', category: 'scoring' },
    { type: 'MAIDEN_OVER', label: 'Maiden Over', icon: '🎯', category: 'play' },
    { type: 'WIDE', label: 'Wide', icon: '↔️', category: 'play' },
    { type: 'NO_BALL', label: 'No Ball', icon: '🚫', category: 'discipline' },
    { type: 'BYE', label: 'Bye', icon: '🏃', category: 'play' },
  ],
  NETBALL: [
    { type: 'GOAL', label: 'Goal', icon: '🏐', category: 'scoring' },
    { type: 'CENTER_PASS', label: 'Center Pass', icon: '⭕', category: 'play' },
    { type: 'INTERCEPT', label: 'Intercept', icon: '🤚', category: 'play' },
    { type: 'REBOUND', label: 'Rebound', icon: '🔄', category: 'play' },
    { type: 'OBSTRUCTION', label: 'Obstruction', icon: '🚫', category: 'discipline' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
    { type: 'INJURY', label: 'Injury', icon: '🩹', category: 'other' },
  ],
  HOCKEY: [
    { type: 'GOAL', label: 'Goal', icon: '🏒', category: 'scoring' },
    { type: 'ASSIST', label: 'Assist', icon: '👟', category: 'scoring' },
    { type: 'PENALTY_SCORED', label: 'Penalty Goal', icon: '🎯', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Green Card', icon: '🟩', category: 'discipline' },
    { type: 'SECOND_YELLOW', label: 'Yellow Card', icon: '🟨', category: 'discipline' },
    { type: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'discipline' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
  ],
  LACROSSE: [
    { type: 'GOAL', label: 'Goal', icon: '🥍', category: 'scoring' },
    { type: 'ASSIST', label: 'Assist', icon: '👟', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Penalty', icon: '🟨', category: 'discipline' },
    { type: 'TURNOVER', label: 'Turnover', icon: '🔄', category: 'play' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
  ],
  AUSTRALIAN_RULES: [
    { type: 'GOAL', label: 'Goal (6pts)', icon: '🦘', category: 'scoring' },
    { type: 'ASSIST', label: 'Behind (1pt)', icon: '1️⃣', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Free Kick', icon: '🚩', category: 'play' },
    { type: 'SUBSTITUTION_ON', label: 'Interchange', icon: '🔼', category: 'play' },
  ],
  GAELIC_FOOTBALL: [
    { type: 'GOAL', label: 'Goal (3pts)', icon: '☘️', category: 'scoring' },
    { type: 'ASSIST', label: 'Point (1pt)', icon: '1️⃣', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'discipline' },
    { type: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'discipline' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
  ],
  FUTSAL: [
    { type: 'GOAL', label: 'Goal', icon: '⚽', category: 'scoring' },
    { type: 'ASSIST', label: 'Assist', icon: '👟', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'discipline' },
    { type: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'discipline' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
    { type: 'TIMEOUT', label: 'Timeout', icon: '⏸️', category: 'other' },
  ],
  BEACH_FOOTBALL: [
    { type: 'GOAL', label: 'Goal', icon: '🏖️', category: 'scoring' },
    { type: 'YELLOW_CARD', label: 'Yellow Card', icon: '🟨', category: 'discipline' },
    { type: 'RED_CARD', label: 'Red Card', icon: '🟥', category: 'discipline' },
    { type: 'SUBSTITUTION_ON', label: 'Sub On', icon: '🔼', category: 'play' },
  ],
};

const MATCH_STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bgColor: string; canEdit: boolean }> = {
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', canEdit: true },
  WARMUP: { label: 'Warm Up', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', canEdit: true },
  LIVE: { label: '🔴 LIVE', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', canEdit: true },
  HALFTIME: { label: 'Half Time', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', canEdit: true },
  SECOND_HALF: { label: '2nd Half', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', canEdit: true },
  EXTRA_TIME_FIRST: { label: 'ET 1st', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', canEdit: true },
  EXTRA_TIME_SECOND: { label: 'ET 2nd', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', canEdit: true },
  PENALTIES: { label: 'Penalties', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30', canEdit: true },
  FINISHED: { label: 'Finished', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', canEdit: false },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-900/30', canEdit: false },
  POSTPONED: { label: 'Postponed', color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-900/30', canEdit: true },
  ABANDONED: { label: 'Abandoned', color: 'text-red-700', bgColor: 'bg-red-200 dark:bg-red-900/50', canEdit: false },
  REPLAY_SCHEDULED: { label: 'Replay', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', canEdit: true },
  VOIDED: { label: 'Voided', color: 'text-slate-500', bgColor: 'bg-slate-200 dark:bg-slate-800', canEdit: false },
  DELAYED: { label: 'Delayed', color: 'text-amber-700', bgColor: 'bg-amber-200 dark:bg-amber-900/50', canEdit: true },
  SUSPENDED: { label: 'Suspended', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', canEdit: true },
};

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 ${typeClasses[type]}`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const StatCard = ({ label, value, icon: Icon, color, pulse = false }: { label: string; value: number; icon: React.ElementType; color: string; pulse?: boolean }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-all group">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {pulse && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
    </div>
    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</p>
    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const MatchCard = ({ match, sport, onSelect, isSelected }: { match: Match; sport: Sport; onSelect: () => void; isSelected: boolean }) => {
  const sportConfig = SPORT_CONFIG[sport];
  const statusConfig = MATCH_STATUS_CONFIG[match.status];
  const isLive = ['LIVE', 'HALFTIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES'].includes(match.status);
  const isFinished = match.status === 'FINISHED';

  return (
    <div
      onClick={onSelect}
      className={`bg-white dark:bg-slate-800 border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-gold-500 shadow-lg' : 'border-slate-200 dark:border-slate-700 hover:border-gold-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <span className="text-lg">{sportConfig.icon}</span>
      </div>

      {/* Score */}
      <div className="grid grid-cols-3 gap-4 items-center mb-4 py-4 border-y border-slate-200 dark:border-slate-700">
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-2">
            {match.homeTeam.logo && (
              <Image src={match.homeTeam.logo} alt="" width={24} height={24} className="rounded" />
            )}
            <p className="font-bold text-slate-900 dark:text-white text-sm">{match.homeTeam.shortName || match.homeTeam.name}</p>
          </div>
          {(isLive || isFinished) && (
            <p className="text-3xl font-bold text-gold-600">{match.homeScore ?? 0}</p>
          )}
        </div>

        <div className="text-center">
          {isLive ? (
            <div className="space-y-1">
              <p className="text-xl font-bold text-red-600">{match.actualDuration || 0}'</p>
              <p className="text-xs text-red-500 font-semibold animate-pulse">LIVE</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {new Date(match.kickOffTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(match.kickOffTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold text-slate-900 dark:text-white text-sm">{match.awayTeam.shortName || match.awayTeam.name}</p>
            {match.awayTeam.logo && (
              <Image src={match.awayTeam.logo} alt="" width={24} height={24} className="rounded" />
            )}
          </div>
          {(isLive || isFinished) && (
            <p className="text-3xl font-bold text-orange-500">{match.awayScore ?? 0}</p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        {match.venue && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {match.venue}
          </span>
        )}
        {match.attendance && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {match.attendance.toLocaleString()}
          </span>
        )}
      </div>

      {/* Events Preview */}
      {match.events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Recent Events</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {match.events.slice(-3).map((event, idx) => {
              const eventConfig = SPORT_EVENTS[sport]?.find(e => e.type === event.eventType);
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gold-600">{event.minute}'</span>
                  <span>{eventConfig?.icon || '•'}</span>
                  <span className="text-slate-700 dark:text-slate-300">{event.playerName || eventConfig?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const EventRecorder = ({ match, sport, onRecordEvent }: { match: Match; sport: Sport; onRecordEvent: (eventType: MatchEventType, team: 'home' | 'away') => void }) => {
  const events = SPORT_EVENTS[sport] || SPORT_EVENTS.FOOTBALL;
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [selectedCategory, setSelectedCategory] = useState<'scoring' | 'discipline' | 'play' | 'other'>('scoring');

  const filteredEvents = events.filter(e => e.category === selectedCategory);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">Record Event</h3>
        
        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setSelectedTeam('home')}
            className={`p-3 rounded-lg text-sm font-semibold transition-all ${
              selectedTeam === 'home' 
                ? 'bg-gold-500 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {match.homeTeam.shortName || match.homeTeam.name}
          </button>
          <button
            onClick={() => setSelectedTeam('away')}
            className={`p-3 rounded-lg text-sm font-semibold transition-all ${
              selectedTeam === 'away' 
                ? 'bg-orange-500 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {match.awayTeam.shortName || match.awayTeam.name}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {(['scoring', 'discipline', 'play', 'other'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-slate-800 dark:bg-slate-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Event Buttons */}
      <div className="p-4 grid grid-cols-2 gap-2">
        {filteredEvents.map(event => (
          <button
            key={event.type}
            onClick={() => onRecordEvent(event.type, selectedTeam)}
            className={`p-3 rounded-lg text-left transition-all hover:scale-105 ${
              event.category === 'scoring' ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100' :
              event.category === 'discipline' ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100' :
              'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl mb-1 block">{event.icon}</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{event.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CoachMatchManagementPage() {
  const router = useRouter();

  // State
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentSport, setCurrentSport] = useState<Sport>('FOOTBALL');

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [matchesRes, teamsRes] = await Promise.all([
          fetch('/api/coach/matches'),
          fetch('/api/coach/teams'),
        ]);

        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData.matches || []);
          // Set sport from first match
          if (matchesData.matches?.[0]?.homeTeam?.sport) {
            setCurrentSport(matchesData.matches[0].homeTeam.sport);
          }
        }

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.teams || []);
        }
      } catch (error) {
        showToast('Failed to load matches', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // Status filter
      if (statusFilter === 'LIVE') {
        const liveStatuses: MatchStatus[] = ['LIVE', 'HALFTIME', 'SECOND_HALF', 'WARMUP', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES'];
        if (!liveStatuses.includes(match.status)) return false;
      } else if (statusFilter === 'UPCOMING') {
        if (match.status !== 'SCHEDULED') return false;
      } else if (statusFilter === 'FINISHED') {
        if (match.status !== 'FINISHED') return false;
      }

      // Team filter
      if (teamFilter !== 'ALL') {
        const teamClubIds = teams.filter(t => t.id === teamFilter).map(t => t.clubId);
        if (!teamClubIds.includes(match.homeClubId) && !teamClubIds.includes(match.awayClubId)) return false;
      }

      return true;
    });
  }, [matches, statusFilter, teamFilter, teams]);

  // Stats
  const liveCount = matches.filter(m => ['LIVE', 'HALFTIME', 'SECOND_HALF'].includes(m.status)).length;
  const upcomingCount = matches.filter(m => m.status === 'SCHEDULED').length;
  const finishedCount = matches.filter(m => m.status === 'FINISHED').length;

  // Selected match data
  const selectedMatchData = selectedMatch ? matches.find(m => m.id === selectedMatch) : null;

  // Record event handler
  const handleRecordEvent = async (eventType: MatchEventType, team: 'home' | 'away') => {
    if (!selectedMatchData) return;

    try {
      const response = await fetch(`/api/matches/${selectedMatchData.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          minute: selectedMatchData.actualDuration || 0,
          teamSide: team,
        }),
      });

      if (!response.ok) throw new Error('Failed to record event');

      const eventConfig = SPORT_EVENTS[currentSport]?.find(e => e.type === eventType);
      showToast(`${eventConfig?.icon} ${eventConfig?.label} recorded!`, 'success');

      // Refresh matches
      const refreshRes = await fetch('/api/coach/matches');
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      showToast('Failed to record event', 'error');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gold-50/10 to-orange-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading matches...</p>
        </div>
      </div>
    );
  }

  const sportConfig = SPORT_CONFIG[currentSport];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gold-50/10 to-orange-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
              <span className="text-3xl">{sportConfig.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Match Management</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage matches and record live events</p>
            </div>
          </div>

          <Link href="/dashboard/coach/matches/create" className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all">
            <Plus className="w-5 h-5" />
            New Match
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Live Now" value={liveCount} icon={Play} color="bg-gradient-to-br from-red-500 to-red-600" pulse={liveCount > 0} />
          <StatCard label="Upcoming" value={upcomingCount} icon={Calendar} color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatCard label="Finished" value={finishedCount} icon={Trophy} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'LIVE', 'UPCOMING', 'FINISHED'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      statusFilter === status
                        ? 'bg-gold-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'LIVE' && liveCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2 animate-pulse" />}
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Filter */}
            <div className="md:w-64">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Team</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Matches Found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Adjust filters or create a new match</p>
                <Link href="/dashboard/coach/matches/create" className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl transition-all">
                  <Plus className="w-5 h-5" />
                  Create Match
                </Link>
              </div>
            ) : (
              filteredMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  sport={match.homeTeam.sport || currentSport}
                  onSelect={() => setSelectedMatch(match.id)}
                  isSelected={selectedMatch === match.id}
                />
              ))
            )}
          </div>

          {/* Event Tracker Sidebar */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {selectedMatchData && MATCH_STATUS_CONFIG[selectedMatchData.status].canEdit ? (
              <EventRecorder
                match={selectedMatchData}
                sport={selectedMatchData.homeTeam.sport || currentSport}
                onRecordEvent={handleRecordEvent}
              />
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Event Recorder</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select a live or upcoming match to record events
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/dashboard/coach/tactics" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tactical Board</span>
                </Link>
                <Link href="/dashboard/coach/team" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Squad Management</span>
                </Link>
                <Link href="/dashboard/coach/training" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Training Sessions</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}