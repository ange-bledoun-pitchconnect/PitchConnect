'use client';

// ============================================================================
// 👨‍👩‍👧 PITCHCONNECT - Parent Dashboard v7.5.0
// Path: app/(dashboard)/dashboard/parent/page.tsx
// ============================================================================
//
// Parent/Guardian dashboard for managing children's profiles, schedules,
// payments, and consent forms.
//
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  Bell,
  ChevronRight,
  Clock,
  MapPin,
  Trophy,
  Activity,
  Heart,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageCircle,
  Star,
  TrendingUp,
  Plus,
  Settings,
  CreditCard,
  AlertTriangle,
  Award,
  Target,
} from 'lucide-react';
import { type Sport, SPORT_CONFIGS, getStatLabels } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth: Date;
  age: number;
  teams: {
    id: string;
    name: string;
    clubName: string;
    sport: Sport;
  }[];
  position?: string;
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    rating?: number;
  };
  availability: 'FIT' | 'INJURED' | 'ILL' | 'UNAVAILABLE';
  nextEvent?: {
    type: 'MATCH' | 'TRAINING';
    title: string;
    datetime: Date;
    location?: string;
  };
  consentsRequired: number;
  pendingPayments: number;
}

interface UpcomingEvent {
  id: string;
  childId: string;
  childName: string;
  type: 'MATCH' | 'TRAINING';
  title: string;
  datetime: Date;
  location?: string;
  opponent?: string;
  requiresTransport: boolean;
}

interface Payment {
  id: string;
  childId: string;
  childName: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'PENDING' | 'OVERDUE' | 'PAID';
}

interface ConsentForm {
  id: string;
  childId: string;
  childName: string;
  title: string;
  description: string;
  expiryDate?: Date;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED';
  urgent: boolean;
}

interface CoachMessage {
  id: string;
  childId: string;
  childName: string;
  coachName: string;
  coachAvatar?: string;
  subject: string;
  preview: string;
  timestamp: Date;
  read: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockChildren: Child[] = [
  {
    id: 'child1',
    firstName: 'Emma',
    lastName: 'Smith',
    dateOfBirth: new Date('2012-05-15'),
    age: 12,
    teams: [
      { id: 'team1', name: 'U13 Girls', clubName: 'United FC', sport: 'FOOTBALL' },
    ],
    position: 'Midfielder',
    stats: { matchesPlayed: 18, goals: 5, assists: 8, rating: 7.2 },
    availability: 'FIT',
    nextEvent: {
      type: 'MATCH',
      title: 'vs Riverside FC',
      datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      location: 'Home Stadium',
    },
    consentsRequired: 1,
    pendingPayments: 0,
  },
  {
    id: 'child2',
    firstName: 'Jack',
    lastName: 'Smith',
    dateOfBirth: new Date('2015-09-22'),
    age: 9,
    teams: [
      { id: 'team2', name: 'U10 Boys', clubName: 'United FC', sport: 'FOOTBALL' },
    ],
    position: 'Striker',
    stats: { matchesPlayed: 12, goals: 8, assists: 3, rating: 7.5 },
    availability: 'FIT',
    nextEvent: {
      type: 'TRAINING',
      title: 'Team Training',
      datetime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      location: 'Training Ground',
    },
    consentsRequired: 0,
    pendingPayments: 1,
  },
];

const mockUpcomingEvents: UpcomingEvent[] = [
  { id: '1', childId: 'child1', childName: 'Emma', type: 'MATCH', title: 'League Match vs Riverside FC', datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), location: 'Home Stadium', opponent: 'Riverside FC', requiresTransport: false },
  { id: '2', childId: 'child2', childName: 'Jack', type: 'TRAINING', title: 'Team Training', datetime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), location: 'Training Ground', requiresTransport: true },
  { id: '3', childId: 'child1', childName: 'Emma', type: 'TRAINING', title: 'Team Training', datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), location: 'Training Ground', requiresTransport: true },
  { id: '4', childId: 'child2', childName: 'Jack', type: 'MATCH', title: 'Friendly vs Valley FC', datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), location: 'Away', opponent: 'Valley FC', requiresTransport: true },
];

const mockPayments: Payment[] = [
  { id: '1', childId: 'child2', childName: 'Jack', description: 'Monthly Subscription - January', amount: 45.00, currency: 'GBP', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'PENDING' },
  { id: '2', childId: 'child1', childName: 'Emma', description: 'Tournament Entry Fee', amount: 25.00, currency: 'GBP', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: 'PENDING' },
];

const mockConsentForms: ConsentForm[] = [
  { id: '1', childId: 'child1', childName: 'Emma', title: 'Away Match Transport Consent', description: 'Consent for coach-supervised transport to away matches', status: 'PENDING', urgent: true },
  { id: '2', childId: 'child1', childName: 'Emma', title: 'Photography & Video Consent', description: 'Consent for photos/videos at matches and events', expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), status: 'SIGNED', urgent: false },
  { id: '3', childId: 'child2', childName: 'Jack', title: 'Medical Treatment Consent', description: 'Emergency medical treatment authorization', expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), status: 'SIGNED', urgent: false },
];

const mockMessages: CoachMessage[] = [
  { id: '1', childId: 'child1', childName: 'Emma', coachName: 'Coach Williams', subject: 'Great performance last weekend!', preview: 'Emma played exceptionally well in the match against...', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false },
  { id: '2', childId: 'child2', childName: 'Jack', coachName: 'Coach Thompson', subject: 'Training schedule update', preview: 'Hi, I wanted to let you know about some changes to...', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), read: true },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function ChildCard({ child }: { child: Child }) {
  const sportConfig = child.teams[0] ? SPORT_CONFIGS[child.teams[0].sport] : SPORT_CONFIGS.FOOTBALL;
  const statLabels = child.teams[0] ? getStatLabels(child.teams[0].sport) : { primaryStat: 'Goals', secondaryStat: 'Assists' };

  const getAvailabilityBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      FIT: { label: 'Fit', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
      INJURED: { label: 'Injured', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: Heart },
      ILL: { label: 'Ill', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: AlertCircle },
      UNAVAILABLE: { label: 'Unavailable', color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20', icon: XCircle },
    };
    return config[status] || config.UNAVAILABLE;
  };

  const availability = getAvailabilityBadge(child.availability);
  const AvailabilityIcon = availability.icon;

  return (
    <Link
      href={`/dashboard/parent/children/${child.id}`}
      className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all hover:border-neutral-700 hover:bg-neutral-900/70"
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-lg font-bold text-white">
              {child.firstName[0]}{child.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{child.firstName} {child.lastName}</h3>
              <p className="text-sm text-neutral-400">Age {child.age} • {child.position}</p>
              {child.teams[0] && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  <span>{sportConfig.emoji}</span>
                  {child.teams[0].name} • {child.teams[0].clubName}
                </p>
              )}
            </div>
          </div>
          <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${availability.color}`}>
            <AvailabilityIcon className="h-3 w-3" />
            {availability.label}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
            <p className="text-xl font-bold text-white">{child.stats.matchesPlayed}</p>
            <p className="text-xs text-neutral-500">Matches</p>
          </div>
          <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
            <p className="text-xl font-bold text-amber-400">{child.stats.goals}</p>
            <p className="text-xs text-neutral-500">{statLabels.primaryStat}</p>
          </div>
          <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
            <p className="text-xl font-bold text-blue-400">{child.stats.assists}</p>
            <p className="text-xs text-neutral-500">{statLabels.secondaryStat}</p>
          </div>
          <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
            <p className="text-xl font-bold text-purple-400">{child.stats.rating || '-'}</p>
            <p className="text-xs text-neutral-500">Rating</p>
          </div>
        </div>

        {/* Next Event */}
        {child.nextEvent && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
            <div className={`rounded-lg p-2 ${child.nextEvent.type === 'MATCH' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {child.nextEvent.type === 'MATCH' ? <Trophy className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{child.nextEvent.title}</p>
              <p className="text-xs text-neutral-500">
                {child.nextEvent.datetime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} • {child.nextEvent.location}
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {(child.consentsRequired > 0 || child.pendingPayments > 0) && (
          <div className="mt-4 flex gap-2">
            {child.consentsRequired > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400">
                <FileText className="h-3 w-3" />
                {child.consentsRequired} consent{child.consentsRequired > 1 ? 's' : ''} needed
              </span>
            )}
            {child.pendingPayments > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                <DollarSign className="h-3 w-3" />
                {child.pendingPayments} payment{child.pendingPayments > 1 ? 's' : ''} due
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900/30 px-5 py-3">
        <span className="text-sm text-neutral-400">View profile & progress</span>
        <ChevronRight className="h-4 w-4 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-neutral-400" />
      </div>
    </Link>
  );
}

function EventCard({ event }: { event: UpcomingEvent }) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return date.toLocaleDateString('en-GB', { weekday: 'long' });
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-900/50">
      <div className={`rounded-lg p-2.5 ${event.type === 'MATCH' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
        {event.type === 'MATCH' ? <Trophy className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300">{event.childName}</span>
        </div>
        <p className="mt-1 font-medium text-white truncate">{event.title}</p>
        <div className="mt-1 flex items-center gap-3 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(event.datetime)} • {event.datetime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
      {event.requiresTransport && (
        <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
          Transport needed
        </span>
      )}
    </div>
  );
}

function PaymentCard({ payment }: { payment: Payment }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OVERDUE': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PENDING': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'PAID': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const daysUntilDue = Math.ceil((payment.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 transition-colors hover:border-neutral-700">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-white">{payment.description}</p>
          <p className="mt-0.5 text-sm text-neutral-400">
            {payment.childName} • Due {payment.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {daysUntilDue <= 3 && daysUntilDue > 0 && <span className="ml-2 text-orange-400">({daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left)</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-lg font-bold text-white">£{payment.amount.toFixed(2)}</p>
        <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-400">
          Pay Now
        </button>
      </div>
    </div>
  );
}

function ConsentCard({ consent }: { consent: ConsentForm }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED': return { color: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle2, label: 'Signed' };
      case 'PENDING': return { color: 'bg-orange-500/10 text-orange-400', icon: AlertCircle, label: 'Pending' };
      case 'EXPIRED': return { color: 'bg-red-500/10 text-red-400', icon: XCircle, label: 'Expired' };
      default: return { color: 'bg-neutral-500/10 text-neutral-400', icon: FileText, label: status };
    }
  };

  const statusConfig = getStatusBadge(consent.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`flex items-center justify-between rounded-lg border ${consent.urgent && consent.status === 'PENDING' ? 'border-orange-500/50 bg-orange-500/5' : 'border-neutral-800 bg-neutral-900/30'} p-4 transition-colors hover:border-neutral-700`}>
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-2.5 ${consent.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{consent.title}</p>
            {consent.urgent && consent.status === 'PENDING' && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">Urgent</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-neutral-400">{consent.childName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </span>
        {consent.status === 'PENDING' && (
          <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400">
            Sign Now
          </button>
        )}
      </div>
    </div>
  );
}

function MessageCard({ message }: { message: CoachMessage }) {
  return (
    <Link
      href={`/dashboard/parent/messages/${message.id}`}
      className={`block rounded-lg border ${!message.read ? 'border-amber-500/30 bg-amber-500/5' : 'border-neutral-800 bg-neutral-900/30'} p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-900/50`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-sm font-medium text-blue-400">
          {message.coachName.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-medium ${!message.read ? 'text-white' : 'text-neutral-300'}`}>{message.coachName}</p>
            <span className="text-xs text-neutral-500">
              {message.timestamp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-xs text-neutral-500">Re: {message.childName}</p>
          <p className={`mt-1 text-sm ${!message.read ? 'text-white' : 'text-neutral-400'}`}>{message.subject}</p>
          <p className="mt-0.5 text-xs text-neutral-500 truncate">{message.preview}</p>
        </div>
        {!message.read && (
          <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ParentDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const pendingConsents = mockConsentForms.filter(c => c.status === 'PENDING').length;
  const pendingPayments = mockPayments.filter(p => p.status !== 'PAID').length;
  const unreadMessages = mockMessages.filter(m => !m.read).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-pink-500" />
          <p className="text-sm text-neutral-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
                <Users className="h-8 w-8 text-pink-400" />
                Parent Dashboard
              </h1>
              <p className="mt-1 text-neutral-400">
                Manage your children's activities and stay updated
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/parent/children/link"
                className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Link Child
              </Link>
              <Link
                href="/dashboard/parent/settings"
                className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-2.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Alerts */}
        {(pendingConsents > 0 || pendingPayments > 0) && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {pendingConsents > 0 && (
              <div className="flex items-center gap-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
                <div className="rounded-lg bg-orange-500/10 p-2.5 text-orange-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{pendingConsents} consent form{pendingConsents > 1 ? 's' : ''} need your attention</p>
                  <p className="text-sm text-neutral-400">Please review and sign required documents</p>
                </div>
                <Link href="#consents" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-400">
                  Review
                </Link>
              </div>
            )}
            {pendingPayments > 0 && (
              <div className="flex items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{pendingPayments} payment{pendingPayments > 1 ? 's' : ''} due</p>
                  <p className="text-sm text-neutral-400">Keep subscriptions and fees up to date</p>
                </div>
                <Link href="#payments" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-400">
                  Pay Now
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Children */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Children</h2>
            <Link href="/dashboard/parent/children" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              View All
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {mockChildren.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Upcoming Schedule</h2>
              <Link href="/dashboard/parent/schedule" className="text-sm font-medium text-amber-400 hover:text-amber-300">
                View Calendar
              </Link>
            </div>
            <div className="space-y-3">
              {mockUpcomingEvents.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>

          {/* Coach Messages */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                Coach Messages
                {unreadMessages > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                    {unreadMessages}
                  </span>
                )}
              </h2>
              <Link href="/dashboard/parent/messages" className="text-sm font-medium text-amber-400 hover:text-amber-300">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {mockMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div id="payments" className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Pending Payments</h2>
            <Link href="/dashboard/parent/payments" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              View History
            </Link>
          </div>
          <div className="space-y-3">
            {mockPayments.filter(p => p.status !== 'PAID').length > 0 ? (
              mockPayments.filter(p => p.status !== 'PAID').map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 py-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="mt-2 font-medium text-white">All payments up to date!</p>
                <p className="mt-1 text-sm text-neutral-500">No pending payments at this time</p>
              </div>
            )}
          </div>
        </div>

        {/* Consent Forms Section */}
        <div id="consents" className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Consent Forms</h2>
            <Link href="/dashboard/parent/consent" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {mockConsentForms.slice(0, 3).map((consent) => (
              <ConsentCard key={consent.id} consent={consent} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
