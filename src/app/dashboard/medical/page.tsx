'use client';

// ============================================================================
// 🏥 PITCHCONNECT - Medical Dashboard v7.5.0
// Path: app/(dashboard)/dashboard/medical/page.tsx
// ============================================================================
//
// Medical staff dashboard for injury tracking, fitness assessments,
// and return-to-play protocols. Supports role-based access control.
//
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  TrendingUp,
  Shield,
  ArrowRight,
  RefreshCw,
  UserCheck,
  AlertCircle,
  XCircle,
  Stethoscope,
  Clipboard,
  ArrowUpRight,
} from 'lucide-react';
import {
  type Injury,
  type FitnessAssessment,
  type PlayerAvailabilityDetails,
  type SquadAvailability,
  INJURY_SEVERITY_CONFIG,
  INJURY_STATUS_CONFIG,
  FITNESS_ASSESSMENT_TYPE_CONFIG,
  RTP_PROTOCOL,
  getRTPProgress,
  getDaysSinceInjury,
  getDaysToReturn,
  MEDICAL_ACCESS_BY_ROLE,
} from '@/types/medical';
import { FITNESS_STATUS_CONFIG, type FitnessStatus, type InjurySeverity, type InjuryStatus } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface MedicalStats {
  totalPlayers: number;
  fitPlayers: number;
  injuredPlayers: number;
  pendingAssessments: number;
  clearedToday: number;
  rtpInProgress: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockStats: MedicalStats = {
  totalPlayers: 28,
  fitPlayers: 22,
  injuredPlayers: 4,
  pendingAssessments: 3,
  clearedToday: 1,
  rtpInProgress: 2,
};

const mockSquadAvailability: SquadAvailability = {
  total: 28,
  fit: 22,
  injured: 4,
  ill: 1,
  suspended: 0,
  international: 1,
  doubtful: 2,
  unavailable: 6,
};

const mockInjuries: Injury[] = [
  {
    id: '1',
    playerId: 'player1',
    type: 'HAMSTRING_STRAIN',
    severity: 'MODERATE',
    location: 'HAMSTRING_LEFT',
    dateFrom: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    estimatedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: 'Grade 2 hamstring strain sustained during training',
    treatment: 'Physiotherapy, progressive strengthening',
    status: 'RECOVERING',
    recoveryProgress: 65,
    createdAt: new Date(),
    updatedAt: new Date(),
    player: {
      id: 'player1',
      userId: 'user1',
      user: { firstName: 'Marcus', lastName: 'Johnson', avatar: null },
    },
  },
  {
    id: '2',
    playerId: 'player2',
    type: 'ANKLE_SPRAIN',
    severity: 'MINOR',
    location: 'ANKLE_RIGHT',
    dateFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    estimatedReturn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'RECOVERING',
    recoveryProgress: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
    player: {
      id: 'player2',
      userId: 'user2',
      user: { firstName: 'James', lastName: 'Williams', avatar: null },
    },
  },
  {
    id: '3',
    playerId: 'player3',
    type: 'CONCUSSION',
    severity: 'MODERATE',
    location: 'HEAD',
    dateFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    estimatedReturn: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'REHABILITATION',
    recoveryProgress: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    player: {
      id: 'player3',
      userId: 'user3',
      user: { firstName: 'David', lastName: 'Brown', avatar: null },
    },
  },
  {
    id: '4',
    playerId: 'player4',
    type: 'ACL_TEAR',
    severity: 'SEVERE',
    location: 'KNEE_LEFT',
    dateFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    estimatedReturn: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    status: 'REHABILITATION',
    recoveryProgress: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
    player: {
      id: 'player4',
      userId: 'user4',
      user: { firstName: 'Michael', lastName: 'Davis', avatar: null },
    },
  },
];

const mockAssessments: FitnessAssessment[] = [
  {
    id: '1',
    playerId: 'player1',
    assessorId: 'assessor1',
    type: 'RETURN_TO_PLAY',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'PENDING_REVIEW',
    isRTPAssessment: true,
    rtpStage: 3,
    rtpCleared: false,
    recommendations: ['Continue graduated return protocol', 'Monitor for any symptom recurrence'],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    player: {
      id: 'player1',
      userId: 'user1',
      user: { firstName: 'Marcus', lastName: 'Johnson', avatar: null },
    },
  },
  {
    id: '2',
    playerId: 'player5',
    assessorId: 'assessor1',
    type: 'PRE_SEASON',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'PENDING_REVIEW',
    overallScore: 85,
    isRTPAssessment: false,
    rtpCleared: false,
    recommendations: ['Excellent fitness level', 'Cleared for full training'],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    player: {
      id: 'player5',
      userId: 'user5',
      user: { firstName: 'Alex', lastName: 'Thompson', avatar: null },
    },
  },
];

const mockAvailability: PlayerAvailabilityDetails[] = [
  { playerId: 'p1', playerName: 'Marcus Johnson', position: 'Striker', status: 'UNAVAILABLE', reason: 'Hamstring Strain', expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), injuryDetails: { type: 'HAMSTRING_STRAIN', location: 'HAMSTRING_LEFT', severity: 'MODERATE' } },
  { playerId: 'p2', playerName: 'James Williams', position: 'Midfielder', status: 'DOUBTFUL', reason: 'Ankle Sprain', expectedReturn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), injuryDetails: { type: 'ANKLE_SPRAIN', location: 'ANKLE_RIGHT', severity: 'MINOR' } },
  { playerId: 'p3', playerName: 'David Brown', position: 'Defender', status: 'UNAVAILABLE', reason: 'Concussion Protocol', expectedReturn: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), injuryDetails: { type: 'CONCUSSION', location: 'HEAD', severity: 'MODERATE' } },
  { playerId: 'p4', playerName: 'Michael Davis', position: 'Goalkeeper', status: 'UNAVAILABLE', reason: 'ACL Reconstruction', expectedReturn: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), injuryDetails: { type: 'ACL_TEAR', location: 'KNEE_LEFT', severity: 'SEVERE' } },
  { playerId: 'p5', playerName: 'Chris Wilson', position: 'Winger', status: 'DOUBTFUL', reason: 'Illness', expectedReturn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
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
  href,
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  href?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const content = (
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
      {href && (
        <div className="absolute bottom-4 right-4">
          <ArrowUpRight className="h-4 w-4 text-neutral-600" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function InjuryCard({ injury }: { injury: Injury }) {
  const severityConfig = INJURY_SEVERITY_CONFIG[injury.severity as InjurySeverity];
  const statusConfig = INJURY_STATUS_CONFIG[injury.status as InjuryStatus];
  const daysSince = getDaysSinceInjury(injury.dateFrom);
  const daysToReturn = getDaysToReturn(injury.estimatedReturn);

  const getSeverityColor = (severity: InjurySeverity) => {
    const colors: Record<InjurySeverity, string> = {
      MINOR: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      MODERATE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      SEVERE: 'bg-red-500/10 text-red-400 border-red-500/20',
      CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
      CAREER_THREATENING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return colors[severity];
  };

  return (
    <Link
      href={`/dashboard/medical/injuries/${injury.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all hover:border-neutral-700 hover:bg-neutral-900/70"
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-lg">
              {injury.player?.user?.avatar ? (
                <img src={injury.player.user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span>{injury.player?.user?.firstName?.[0]}{injury.player?.user?.lastName?.[0]}</span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {injury.player?.user?.firstName} {injury.player?.user?.lastName}
              </h3>
              <p className="text-sm text-neutral-400">{injury.type.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getSeverityColor(injury.severity as InjurySeverity)}`}>
            {severityConfig?.label}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1 text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            {daysSince} days ago
          </span>
          {daysToReturn !== null && (
            <span className="flex items-center gap-1 text-neutral-400">
              <Calendar className="h-3.5 w-3.5" />
              {daysToReturn > 0 ? `${daysToReturn} days to return` : 'Due for clearance'}
            </span>
          )}
        </div>

        {injury.recoveryProgress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Recovery Progress</span>
              <span className="font-medium text-white">{injury.recoveryProgress}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                style={{ width: `${injury.recoveryProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900/30 px-5 py-3">
        <span className="flex items-center gap-1.5 text-sm text-neutral-400">
          {statusConfig?.icon} {statusConfig?.label}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-neutral-400" />
      </div>
    </Link>
  );
}

function AssessmentCard({ assessment }: { assessment: FitnessAssessment }) {
  const typeConfig = FITNESS_ASSESSMENT_TYPE_CONFIG[assessment.type];
  const statusConfig = FITNESS_STATUS_CONFIG[assessment.status];

  return (
    <Link
      href={`/dashboard/medical/assessments/${assessment.id}`}
      className="group flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all hover:border-neutral-700 hover:bg-neutral-900/70"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-xl">
        {typeConfig?.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white truncate">
            {assessment.player?.user?.firstName} {assessment.player?.user?.lastName}
          </h3>
          {assessment.isRTPAssessment && (
            <span className="shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-400">
              RTP Stage {assessment.rtpStage}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-neutral-400">{typeConfig?.label}</p>
      </div>
      <div className="text-right">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          statusConfig?.color === 'green' ? 'bg-emerald-500/10 text-emerald-400' :
          statusConfig?.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
          statusConfig?.color === 'red' ? 'bg-red-500/10 text-red-400' :
          statusConfig?.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
          'bg-neutral-500/10 text-neutral-400'
        }`}>
          {statusConfig?.icon} {statusConfig?.label}
        </span>
        <p className="mt-1 text-xs text-neutral-500">
          {new Date(assessment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-neutral-400" />
    </Link>
  );
}

function AvailabilityRow({ player }: { player: PlayerAvailabilityDetails }) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'FIT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DOUBTFUL':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'UNAVAILABLE':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const formatReturn = (date: Date | null | undefined) => {
    if (!date) return '-';
    const days = getDaysToReturn(date);
    if (days === null) return '-';
    if (days <= 0) return 'Ready';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <tr className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/20">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium text-neutral-300">
            {player.playerName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-medium text-white">{player.playerName}</p>
            <p className="text-xs text-neutral-500">{player.position}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyle(player.status)}`}>
          {player.status === 'FIT' && <CheckCircle2 className="h-3 w-3" />}
          {player.status === 'DOUBTFUL' && <AlertCircle className="h-3 w-3" />}
          {player.status === 'UNAVAILABLE' && <XCircle className="h-3 w-3" />}
          {player.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-neutral-400">{player.reason || '-'}</td>
      <td className="py-3 px-4 text-sm text-neutral-400">{formatReturn(player.expectedReturn)}</td>
      <td className="py-3 px-4">
        <Link
          href={`/dashboard/medical/players/${player.playerId}`}
          className="text-sm font-medium text-amber-400 hover:text-amber-300"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function RTPProgressCard({ injury }: { injury: Injury & { rtpStage?: number } }) {
  const stage = injury.rtpStage || 1;
  const progress = getRTPProgress(stage);
  const currentStageInfo = RTP_PROTOCOL.find(s => s.stage === stage);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium">
            {injury.player?.user?.firstName?.[0]}{injury.player?.user?.lastName?.[0]}
          </div>
          <div>
            <h4 className="font-semibold text-white">
              {injury.player?.user?.firstName} {injury.player?.user?.lastName}
            </h4>
            <p className="text-sm text-neutral-400">{injury.type.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-400">
          Stage {stage}/6
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">Return to Play Progress</span>
          <span className="font-medium text-white">{progress}%</span>
        </div>
        <div className="mt-2 flex gap-1">
          {RTP_PROTOCOL.map((s) => (
            <div
              key={s.stage}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s.stage <= stage ? 'bg-amber-500' : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
        {currentStageInfo && (
          <p className="mt-3 text-sm text-neutral-500">
            <span className="font-medium text-neutral-300">{currentStageInfo.name}:</span>{' '}
            {currentStageInfo.description}
          </p>
        )}
      </div>

      <Link
        href={`/dashboard/medical/rtp/${injury.id}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Manage RTP Protocol
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
        <Icon className="h-6 w-6 text-neutral-500" />
      </div>
      <h3 className="mt-4 font-medium text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400"
        >
          {action.label}
          <Plus className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MedicalDashboard() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'injuries' | 'assessments' | 'availability'>('overview');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Check access level (mock - would use actual role from session)
  const userRole = 'MEDICAL_STAFF';
  const accessConfig = MEDICAL_ACCESS_BY_ROLE[userRole];

  // Filter injuries
  const filteredInjuries = useMemo(() => {
    return mockInjuries.filter((injury) => {
      const matchesSearch = searchQuery === '' ||
        injury.player?.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        injury.player?.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        injury.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || injury.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // RTP in progress injuries
  const rtpInjuries = mockInjuries.filter(i => i.status === 'REHABILITATION').map(i => ({ ...i, rtpStage: 3 }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-red-500" />
          <p className="text-sm text-neutral-400">Loading medical dashboard...</p>
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
                <Heart className="h-8 w-8 text-red-400" />
                Medical Dashboard
              </h1>
              <p className="mt-1 text-neutral-400">
                Manage injuries, fitness assessments, and player availability
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                <RefreshCw className="h-4 w-4" />
                Sync Data
              </button>
              <Link
                href="/dashboard/medical/injuries/new"
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-400"
              >
                <Plus className="h-4 w-4" />
                Log Injury
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-neutral-800">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'injuries', label: 'Injuries', icon: Heart },
              { id: 'assessments', label: 'Assessments', icon: Clipboard },
              { id: 'availability', label: 'Availability', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Total Squad"
                value={mockStats.totalPlayers}
                subValue={`${mockStats.fitPlayers} fit for selection`}
                color="blue"
              />
              <StatCard
                icon={Heart}
                label="Active Injuries"
                value={mockStats.injuredPlayers}
                subValue={`${mockStats.rtpInProgress} in RTP protocol`}
                color="red"
                href="/dashboard/medical/injuries"
              />
              <StatCard
                icon={FileText}
                label="Pending Assessments"
                value={mockStats.pendingAssessments}
                subValue="Require review"
                color="orange"
                href="/dashboard/medical/assessments"
              />
              <StatCard
                icon={CheckCircle2}
                label="Cleared Today"
                value={mockStats.clearedToday}
                subValue="Ready for training"
                color="green"
              />
            </div>

            {/* Availability Overview */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Squad Availability</h2>
                <Link href="/dashboard/medical/availability" className="text-sm font-medium text-amber-400 hover:text-amber-300">
                  View Full Report
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: 'Fit', value: mockSquadAvailability.fit, color: 'emerald' },
                  { label: 'Doubtful', value: mockSquadAvailability.doubtful, color: 'yellow' },
                  { label: 'Injured', value: mockSquadAvailability.injured, color: 'red' },
                  { label: 'Ill', value: mockSquadAvailability.ill, color: 'orange' },
                  { label: 'Suspended', value: mockSquadAvailability.suspended, color: 'purple' },
                  { label: 'International', value: mockSquadAvailability.international, color: 'blue' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className={`text-3xl font-bold ${
                      item.color === 'emerald' ? 'text-emerald-400' :
                      item.color === 'yellow' ? 'text-yellow-400' :
                      item.color === 'red' ? 'text-red-400' :
                      item.color === 'orange' ? 'text-orange-400' :
                      item.color === 'purple' ? 'text-purple-400' :
                      'text-blue-400'
                    }`}>{item.value}</p>
                    <p className="mt-1 text-sm text-neutral-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Injuries & RTP */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Active Injuries */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Active Injuries</h2>
                  <Link href="/dashboard/medical/injuries" className="text-sm font-medium text-amber-400 hover:text-amber-300">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {mockInjuries.slice(0, 3).map((injury) => (
                    <InjuryCard key={injury.id} injury={injury} />
                  ))}
                </div>
              </div>

              {/* RTP Progress */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Return to Play Protocols</h2>
                  <Link href="/dashboard/medical/rtp" className="text-sm font-medium text-amber-400 hover:text-amber-300">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {rtpInjuries.length > 0 ? (
                    rtpInjuries.slice(0, 2).map((injury) => (
                      <RTPProgressCard key={injury.id} injury={injury} />
                    ))
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title="No active RTP protocols"
                      description="Players in rehabilitation will appear here"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pending Assessments */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Pending Assessments</h2>
                <Link href="/dashboard/medical/assessments/new" className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300">
                  <Plus className="h-4 w-4" />
                  New Assessment
                </Link>
              </div>
              <div className="space-y-3">
                {mockAssessments.map((assessment) => (
                  <AssessmentCard key={assessment.id} assessment={assessment} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'injuries' && (
          <div className="space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search injuries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 py-2 pl-10 pr-4 text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="RECOVERING">Recovering</option>
                  <option value="REHABILITATION">Rehabilitation</option>
                  <option value="CLEARED">Cleared</option>
                </select>
              </div>
            </div>

            {/* Injuries Grid */}
            {filteredInjuries.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredInjuries.map((injury) => (
                  <InjuryCard key={injury.id} injury={injury} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="No injuries found"
                description={searchQuery ? 'Try adjusting your search terms' : 'No active injuries to display'}
                action={{ label: 'Log New Injury', href: '/dashboard/medical/injuries/new' }}
              />
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 py-2 pl-10 pr-4 text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                />
              </div>
              <Link
                href="/dashboard/medical/assessments/new"
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-400"
              >
                <Plus className="h-4 w-4" />
                New Assessment
              </Link>
            </div>

            <div className="space-y-3">
              {mockAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                <p className="text-4xl font-bold text-emerald-400">{mockSquadAvailability.fit}</p>
                <p className="mt-1 text-sm text-neutral-400">Fit for Selection</p>
              </div>
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
                <p className="text-4xl font-bold text-yellow-400">{mockSquadAvailability.doubtful}</p>
                <p className="mt-1 text-sm text-neutral-400">Doubtful</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">
                <p className="text-4xl font-bold text-red-400">{mockSquadAvailability.unavailable}</p>
                <p className="mt-1 text-sm text-neutral-400">Unavailable</p>
              </div>
            </div>

            {/* Availability Table */}
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
              <table className="w-full">
                <thead className="border-b border-neutral-800 bg-neutral-900/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Player</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Reason</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Expected Return</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAvailability.map((player) => (
                    <AvailabilityRow key={player.playerId} player={player} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
