'use client';

// ============================================================================
// 🏠 PITCHCONNECT - Overview Dashboard v7.5.0
// Path: app/(dashboard)/dashboard/overview/page.tsx
// ============================================================================
//
// Main entry point dashboard with role-based content rendering.
// Supports all 19 user roles with personalized experience.
//
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  Users, 
  Trophy, 
  TrendingUp, 
  Bell, 
  Settings,
  ChevronRight,
  Star,
  Target,
  Clock,
  MapPin,
  Activity,
  Award,
  Briefcase,
  Heart,
  Shield,
  FileText,
  DollarSign,
  Video,
  BarChart3,
  UserCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { SPORT_CONFIGS, getStatLabels, type Sport } from '@/types/player';
import { type NotificationType, NOTIFICATION_TYPE_CONFIG } from '@/types/notification';

// ============================================================================
// TYPES
// ============================================================================

interface UserRole {
  role: string;
  label: string;
  icon: React.ElementType;
  color: string;
  dashboardCards: DashboardCard[];
}

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  stats?: { label: string; value: string | number }[];
}

interface RecentActivity {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface UpcomingEvent {
  id: string;
  type: 'MATCH' | 'TRAINING' | 'MEETING' | 'ASSESSMENT';
  title: string;
  datetime: Date;
  location?: string;
  opponent?: string;
}

interface UserStats {
  primaryStat: number;
  secondaryStat: number;
  matchesPlayed: number;
  teamsJoined: number;
  profileCompletion: number;
  rating?: number;
}

// ============================================================================
// ROLE CONFIGURATIONS
// ============================================================================

const ROLE_CONFIGS: Record<string, UserRole> = {
  PLAYER: {
    role: 'PLAYER',
    label: 'Player',
    icon: Users,
    color: 'emerald',
    dashboardCards: [
      { id: 'matches', title: 'My Matches', description: 'View upcoming and past matches', href: '/dashboard/matches', icon: Trophy, color: 'blue', stats: [{ label: 'Upcoming', value: 3 }] },
      { id: 'training', title: 'Training', description: 'Training sessions and schedule', href: '/dashboard/training', icon: Activity, color: 'green', stats: [{ label: 'This Week', value: 2 }] },
      { id: 'stats', title: 'My Stats', description: 'Performance statistics', href: '/dashboard/stats', icon: BarChart3, color: 'purple', stats: [{ label: 'Rating', value: '7.8' }] },
      { id: 'team', title: 'My Team', description: 'Team roster and info', href: '/dashboard/team', icon: Users, color: 'orange' },
    ],
  },
  COACH: {
    role: 'COACH',
    label: 'Coach',
    icon: Award,
    color: 'blue',
    dashboardCards: [
      { id: 'squad', title: 'Squad', description: 'Manage your players', href: '/dashboard/squad', icon: Users, color: 'blue', stats: [{ label: 'Players', value: 24 }] },
      { id: 'matches', title: 'Fixtures', description: 'Schedule and results', href: '/dashboard/matches', icon: Trophy, color: 'green' },
      { id: 'training', title: 'Training', description: 'Plan training sessions', href: '/dashboard/training', icon: Activity, color: 'orange' },
      { id: 'tactics', title: 'Tactics', description: 'Formations and strategies', href: '/dashboard/tactics', icon: Target, color: 'purple' },
      { id: 'medical', title: 'Availability', description: 'Squad fitness status', href: '/dashboard/medical', icon: Heart, color: 'red' },
    ],
  },
  MANAGER: {
    role: 'MANAGER',
    label: 'Manager',
    icon: Briefcase,
    color: 'violet',
    dashboardCards: [
      { id: 'overview', title: 'Club Overview', description: 'Club performance summary', href: '/dashboard/club', icon: BarChart3, color: 'blue' },
      { id: 'matches', title: 'Fixtures', description: 'All team fixtures', href: '/dashboard/matches', icon: Trophy, color: 'green' },
      { id: 'staff', title: 'Staff', description: 'Manage club staff', href: '/dashboard/staff', icon: Users, color: 'orange' },
      { id: 'finances', title: 'Finances', description: 'Budget and payments', href: '/dashboard/finances', icon: DollarSign, color: 'emerald' },
      { id: 'jobs', title: 'Recruitment', description: 'Job postings', href: '/dashboard/jobs', icon: Briefcase, color: 'purple' },
    ],
  },
  CLUB_OWNER: {
    role: 'CLUB_OWNER',
    label: 'Club Owner',
    icon: Shield,
    color: 'amber',
    dashboardCards: [
      { id: 'dashboard', title: 'Club Dashboard', description: 'Overview of all operations', href: '/dashboard/club', icon: BarChart3, color: 'blue' },
      { id: 'teams', title: 'Teams', description: 'All club teams', href: '/dashboard/teams', icon: Users, color: 'green' },
      { id: 'finances', title: 'Finances', description: 'Financial overview', href: '/dashboard/finances', icon: DollarSign, color: 'emerald' },
      { id: 'facilities', title: 'Facilities', description: 'Venue management', href: '/dashboard/facilities', icon: MapPin, color: 'orange' },
      { id: 'staff', title: 'Staff', description: 'All club staff', href: '/dashboard/staff', icon: Briefcase, color: 'purple' },
    ],
  },
  MEDICAL_STAFF: {
    role: 'MEDICAL_STAFF',
    label: 'Medical Staff',
    icon: Heart,
    color: 'red',
    dashboardCards: [
      { id: 'injuries', title: 'Active Injuries', description: 'Current injury list', href: '/dashboard/medical/injuries', icon: Heart, color: 'red', stats: [{ label: 'Active', value: 5 }] },
      { id: 'assessments', title: 'Assessments', description: 'Fitness assessments', href: '/dashboard/medical/assessments', icon: FileText, color: 'blue' },
      { id: 'availability', title: 'Squad Availability', description: 'Player fitness status', href: '/dashboard/medical', icon: UserCheck, color: 'green' },
      { id: 'rtp', title: 'Return to Play', description: 'RTP protocols', href: '/dashboard/medical/rtp', icon: Activity, color: 'orange' },
    ],
  },
  PARENT: {
    role: 'PARENT',
    label: 'Parent/Guardian',
    icon: Users,
    color: 'pink',
    dashboardCards: [
      { id: 'children', title: 'My Children', description: 'View your children\'s profiles', href: '/dashboard/parent/children', icon: Users, color: 'pink' },
      { id: 'schedule', title: 'Schedule', description: 'Matches and training', href: '/dashboard/parent/schedule', icon: Calendar, color: 'blue' },
      { id: 'payments', title: 'Payments', description: 'Fees and invoices', href: '/dashboard/parent/payments', icon: DollarSign, color: 'green' },
      { id: 'consent', title: 'Consent Forms', description: 'Required documents', href: '/dashboard/parent/consent', icon: FileText, color: 'orange' },
    ],
  },
  MEDIA_MANAGER: {
    role: 'MEDIA_MANAGER',
    label: 'Media Manager',
    icon: Video,
    color: 'purple',
    dashboardCards: [
      { id: 'gallery', title: 'Media Gallery', description: 'Photos and videos', href: '/dashboard/media', icon: Video, color: 'purple' },
      { id: 'social', title: 'Social Media', description: 'Connected accounts', href: '/dashboard/media/social', icon: Zap, color: 'blue' },
      { id: 'highlights', title: 'Highlights', description: 'Match highlights', href: '/dashboard/media/highlights', icon: Star, color: 'amber' },
      { id: 'analytics', title: 'Analytics', description: 'Engagement metrics', href: '/dashboard/media/analytics', icon: BarChart3, color: 'green' },
    ],
  },
  TREASURER: {
    role: 'TREASURER',
    label: 'Treasurer',
    icon: DollarSign,
    color: 'emerald',
    dashboardCards: [
      { id: 'overview', title: 'Financial Overview', description: 'Income and expenses', href: '/dashboard/finances', icon: BarChart3, color: 'emerald' },
      { id: 'payments', title: 'Payments', description: 'Manage payments', href: '/dashboard/finances/payments', icon: DollarSign, color: 'blue' },
      { id: 'invoices', title: 'Invoices', description: 'Invoice management', href: '/dashboard/finances/invoices', icon: FileText, color: 'orange' },
      { id: 'subscriptions', title: 'Subscriptions', description: 'Member subscriptions', href: '/dashboard/finances/subscriptions', icon: Users, color: 'purple' },
    ],
  },
  SCOUT: {
    role: 'SCOUT',
    label: 'Scout',
    icon: Target,
    color: 'cyan',
    dashboardCards: [
      { id: 'reports', title: 'Scouting Reports', description: 'Your reports', href: '/dashboard/scouting', icon: FileText, color: 'cyan' },
      { id: 'watchlist', title: 'Watchlist', description: 'Players to watch', href: '/dashboard/scouting/watchlist', icon: Star, color: 'amber' },
      { id: 'matches', title: 'Upcoming Matches', description: 'Matches to scout', href: '/dashboard/scouting/matches', icon: Trophy, color: 'green' },
    ],
  },
  ANALYST: {
    role: 'ANALYST',
    label: 'Analyst',
    icon: BarChart3,
    color: 'indigo',
    dashboardCards: [
      { id: 'analysis', title: 'Match Analysis', description: 'Performance analysis', href: '/dashboard/analysis', icon: BarChart3, color: 'indigo' },
      { id: 'players', title: 'Player Analytics', description: 'Individual stats', href: '/dashboard/analysis/players', icon: Users, color: 'blue' },
      { id: 'opposition', title: 'Opposition', description: 'Opposition analysis', href: '/dashboard/analysis/opposition', icon: Target, color: 'red' },
      { id: 'reports', title: 'Reports', description: 'Generate reports', href: '/dashboard/analysis/reports', icon: FileText, color: 'green' },
    ],
  },
  REFEREE: {
    role: 'REFEREE',
    label: 'Referee',
    icon: Shield,
    color: 'yellow',
    dashboardCards: [
      { id: 'assignments', title: 'My Assignments', description: 'Upcoming matches', href: '/dashboard/referee', icon: Calendar, color: 'yellow' },
      { id: 'availability', title: 'Availability', description: 'Set your availability', href: '/dashboard/referee/availability', icon: Clock, color: 'blue' },
      { id: 'history', title: 'Match History', description: 'Past assignments', href: '/dashboard/referee/history', icon: FileText, color: 'gray' },
    ],
  },
  FAN: {
    role: 'FAN',
    label: 'Fan',
    icon: Star,
    color: 'rose',
    dashboardCards: [
      { id: 'fixtures', title: 'Fixtures', description: 'Upcoming matches', href: '/dashboard/fixtures', icon: Calendar, color: 'blue' },
      { id: 'results', title: 'Results', description: 'Latest results', href: '/dashboard/results', icon: Trophy, color: 'green' },
      { id: 'standings', title: 'Standings', description: 'League tables', href: '/dashboard/standings', icon: BarChart3, color: 'purple' },
      { id: 'teams', title: 'Teams', description: 'Follow teams', href: '/dashboard/teams', icon: Users, color: 'orange' },
    ],
  },
};

// ============================================================================
// MOCK DATA (Replace with API calls)
// ============================================================================

const mockStats: UserStats = {
  primaryStat: 12,
  secondaryStat: 8,
  matchesPlayed: 24,
  teamsJoined: 2,
  profileCompletion: 85,
  rating: 7.8,
};

const mockUpcomingEvents: UpcomingEvent[] = [
  {
    id: '1',
    type: 'MATCH',
    title: 'League Match vs Riverside FC',
    datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    location: 'Home Stadium',
    opponent: 'Riverside FC',
  },
  {
    id: '2',
    type: 'TRAINING',
    title: 'Team Training Session',
    datetime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    location: 'Training Ground',
  },
  {
    id: '3',
    type: 'MATCH',
    title: 'Cup Quarterfinal',
    datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: 'Away',
    opponent: 'City United',
  },
];

const mockActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'MATCH_RESULT_APPROVED',
    title: 'Match result approved',
    description: 'Your team won 3-1 against Valley FC',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    link: '/dashboard/matches/123',
  },
  {
    id: '2',
    type: 'TRAINING_SCHEDULED',
    title: 'New training session',
    description: 'Training scheduled for tomorrow at 6pm',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    link: '/dashboard/training',
  },
  {
    id: '3',
    type: 'PLAYER_ACHIEVEMENT_UNLOCKED',
    title: 'Achievement unlocked!',
    description: 'You scored your 10th goal of the season',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color = 'blue',
  trend,
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-sm transition-all hover:border-neutral-700 hover:bg-neutral-900/70">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subValue && (
            <p className="mt-1 text-sm text-neutral-500">{subValue}</p>
          )}
        </div>
        <div className={`rounded-lg border p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp className={`h-4 w-4 ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400 rotate-180' : 'text-neutral-400'}`} />
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-neutral-400'}`}>
            {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'} from last month
          </span>
        </div>
      )}
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/5 to-transparent blur-2xl" />
    </div>
  );
}

function QuickActionCard({ card }: { card: DashboardCard }) {
  const colorClasses: Record<string, string> = {
    blue: 'group-hover:border-blue-500/50 group-hover:bg-blue-500/5',
    green: 'group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5',
    purple: 'group-hover:border-purple-500/50 group-hover:bg-purple-500/5',
    orange: 'group-hover:border-orange-500/50 group-hover:bg-orange-500/5',
    red: 'group-hover:border-red-500/50 group-hover:bg-red-500/5',
    amber: 'group-hover:border-amber-500/50 group-hover:bg-amber-500/5',
    emerald: 'group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5',
    pink: 'group-hover:border-pink-500/50 group-hover:bg-pink-500/5',
    cyan: 'group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5',
    indigo: 'group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5',
    yellow: 'group-hover:border-yellow-500/50 group-hover:bg-yellow-500/5',
    gray: 'group-hover:border-neutral-500/50 group-hover:bg-neutral-500/5',
  };

  const iconColorClasses: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    red: 'text-red-400 bg-red-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    pink: 'text-pink-400 bg-pink-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    indigo: 'text-indigo-400 bg-indigo-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    gray: 'text-neutral-400 bg-neutral-500/10',
  };

  return (
    <Link
      href={card.href}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-black/20 ${colorClasses[card.color]}`}
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${iconColorClasses[card.color]}`}>
          <card.icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-neutral-400" />
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-white">{card.title}</h3>
        <p className="mt-1 text-sm text-neutral-400">{card.description}</p>
      </div>
      {card.stats && (
        <div className="mt-4 flex gap-4">
          {card.stats.map((stat, idx) => (
            <div key={idx}>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

function UpcomingEventCard({ event }: { event: UpcomingEvent }) {
  const typeConfig = {
    MATCH: { icon: Trophy, color: 'amber', label: 'Match' },
    TRAINING: { icon: Activity, color: 'green', label: 'Training' },
    MEETING: { icon: Users, color: 'blue', label: 'Meeting' },
    ASSESSMENT: { icon: FileText, color: 'purple', label: 'Assessment' },
  };

  const config = typeConfig[event.type];
  const Icon = config.icon;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return date.toLocaleDateString('en-GB', { weekday: 'long' });
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-900/50">
      <div className={`rounded-lg p-2.5 ${config.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : config.color === 'green' ? 'bg-emerald-500/10 text-emerald-400' : config.color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{event.title}</p>
        <div className="mt-1 flex items-center gap-3 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(event.datetime)} • {formatTime(event.datetime)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${config.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : config.color === 'green' ? 'bg-emerald-500/10 text-emerald-400' : config.color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
        {config.label}
      </span>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const config = NOTIFICATION_TYPE_CONFIG[activity.type];
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-neutral-800/30 ${!activity.read ? 'bg-amber-500/5' : ''}`}>
      <span className="mt-0.5 text-xl">{config?.icon || '📌'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!activity.read ? 'font-medium text-white' : 'text-neutral-300'}`}>
          {activity.title}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 truncate">{activity.description}</p>
      </div>
      <span className="shrink-0 text-xs text-neutral-500">{formatTime(activity.timestamp)}</span>
    </div>
  );
}

function ProfileCompletionCard({ completion }: { completion: number }) {
  const getCompletionColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-400';
    if (pct >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getCompletionBg = (pct: number) => {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const tasks = [
    { label: 'Add profile photo', done: true },
    { label: 'Complete personal info', done: true },
    { label: 'Add playing positions', done: true },
    { label: 'Join a team', done: true },
    { label: 'Add emergency contact', done: false },
    { label: 'Complete medical info', done: false },
  ];

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Profile Completion</h3>
        <span className={`text-2xl font-bold ${getCompletionColor(completion)}`}>{completion}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800">
        <div 
          className={`h-full transition-all duration-500 ${getCompletionBg(completion)}`}
          style={{ width: `${completion}%` }}
        />
      </div>
      <div className="mt-4 space-y-2">
        {tasks.slice(0, 4).map((task, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {task.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-neutral-600" />
            )}
            <span className={task.done ? 'text-neutral-400 line-through' : 'text-neutral-300'}>
              {task.label}
            </span>
          </div>
        ))}
      </div>
      {completion < 100 && (
        <Link
          href="/dashboard/profile"
          className="mt-4 flex items-center justify-center gap-1 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          Complete Profile
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OverviewDashboard() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [sport, setSport] = useState<Sport>('FOOTBALL');
  const [userRole, setUserRole] = useState<string>('PLAYER');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Get user info
  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] || 'there';
  
  // Get role config
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.PLAYER;
  
  // Get sport-specific stat labels
  const statLabels = getStatLabels(sport);
  const sportConfig = SPORT_CONFIGS[sport];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-500" />
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
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {getGreeting()}, {firstName}! 
                <span className="ml-2">{sportConfig.emoji}</span>
              </h1>
              <p className="mt-1 text-neutral-400">
                Here's what's happening with your {sportConfig.name.toLowerCase()} today
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/notifications"
                className="relative rounded-lg border border-neutral-700 bg-neutral-800/50 p-2.5 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                  3
                </span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-2.5 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Trophy}
            label={statLabels.primaryStat}
            value={mockStats.primaryStat}
            subValue="This season"
            color="gold"
            trend="up"
          />
          <StatCard
            icon={Target}
            label={statLabels.secondaryStat}
            value={mockStats.secondaryStat}
            subValue="This season"
            color="blue"
          />
          <StatCard
            icon={Activity}
            label="Matches Played"
            value={mockStats.matchesPlayed}
            subValue="Across all competitions"
            color="green"
          />
          <StatCard
            icon={Star}
            label="Average Rating"
            value={mockStats.rating || '-'}
            subValue="Last 5 matches"
            color="purple"
          />
        </div>

        {/* Quick Actions & Sidebar */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                <span className="flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300">
                  <roleConfig.icon className="h-3.5 w-3.5" />
                  {roleConfig.label}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {roleConfig.dashboardCards.map((card) => (
                  <QuickActionCard key={card.id} card={card} />
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Upcoming</h2>
                <Link href="/dashboard/calendar" className="text-sm font-medium text-amber-400 hover:text-amber-300">
                  View Calendar
                </Link>
              </div>
              <div className="space-y-3">
                {mockUpcomingEvents.length > 0 ? (
                  mockUpcomingEvents.map((event) => (
                    <UpcomingEventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-8 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-neutral-600" />
                    <p className="mt-3 text-neutral-400">No upcoming events</p>
                    <p className="mt-1 text-sm text-neutral-500">Check back later or add events to your calendar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <ProfileCompletionCard completion={mockStats.profileCompletion} />

            {/* Recent Activity */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent Activity</h3>
                <Link href="/dashboard/notifications" className="text-xs font-medium text-amber-400 hover:text-amber-300">
                  View All
                </Link>
              </div>
              <div className="mt-4 -mx-3 space-y-1">
                {mockActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
              <h3 className="font-semibold text-white">Quick Links</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: 'Profile', href: '/dashboard/profile', icon: Users },
                  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
                  { label: 'Help', href: '/help', icon: AlertCircle },
                  { label: 'Feedback', href: '/feedback', icon: Star },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/30 px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-800/50 hover:text-white"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
