'use client';

// ============================================================================
// 🏥 PITCHCONNECT - INJURIES CLIENT COMPONENT
// ============================================================================
// Full-featured injury management UI with medical privacy controls
// ============================================================================

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Heart,
  TrendingUp,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Sport, InjurySeverity, InjuryStatus } from '@prisma/client';
import {
  getSportConfig,
  getSeverityColor,
  SPORT_INJURY_PATTERNS,
} from '@/lib/sport-config';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface InjuriesClientProps {
  team: {
    id: string;
    name: string;
    club: {
      id: string;
      name: string;
      sport: Sport;
      settings: any;
    };
  };
  injuries: InjuryWithRelations[];
  teamPlayers: TeamPlayerWithRelations[];
  stats: InjuryStats;
  permissions: {
    canViewFullDetails: boolean;
    canViewLimitedDetails: boolean;
    canManageInjuries: boolean;
    userRole: string;
  };
  sport: Sport;
}

interface InjuryWithRelations {
  id: string;
  bodyPart: string | null;
  diagnosis: string | null;
  severity: InjurySeverity;
  status: InjuryStatus;
  injuryDate: Date;
  expectedReturnDate: Date | null;
  actualReturnDate: Date | null;
  treatmentPlan: string | null;
  notes: string | null;
  player: {
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    teamPlayers: {
      jerseyNumber: number | null;
      position: string | null;
    }[];
  };
  medicalRecords?: any[];
}

interface TeamPlayerWithRelations {
  id: string;
  jerseyNumber: number | null;
  position: string | null;
  player: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
}

interface InjuryStats {
  total: number;
  active: number;
  recovering: number;
  cleared: number;
  byBodyPart: Record<string, number>;
  bySeverity: Record<string, number>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InjuriesClient({
  team,
  injuries,
  teamPlayers,
  stats,
  permissions,
  sport,
}: InjuriesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sportConfig = getSportConfig(sport);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InjuryStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<InjurySeverity | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInjury, setSelectedInjury] = useState<InjuryWithRelations | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filtered injuries
  const filteredInjuries = useMemo(() => {
    return injuries.filter(injury => {
      // Search filter
      const playerName = `${injury.player.user.firstName} ${injury.player.user.lastName}`.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        playerName.includes(searchQuery.toLowerCase()) ||
        injury.bodyPart?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        injury.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || injury.status === statusFilter;

      // Severity filter
      const matchesSeverity = severityFilter === 'ALL' || injury.severity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [injuries, searchQuery, statusFilter, severityFilter]);

  // Toggle row expansion
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Get status badge styling
  const getStatusBadge = (status: InjuryStatus) => {
    const styles: Record<InjuryStatus, string> = {
      ACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      RECOVERING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CLEARED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CHRONIC: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Calculate recovery progress
  const getRecoveryProgress = (injury: InjuryWithRelations) => {
    if (!injury.expectedReturnDate) return null;
    const totalDays = differenceInDays(new Date(injury.expectedReturnDate), new Date(injury.injuryDate));
    const daysPassed = differenceInDays(new Date(), new Date(injury.injuryDate));
    const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
    return { progress, daysRemaining: totalDays - daysPassed };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Injury Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {team.name} • {sportConfig.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Privacy indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {permissions.canViewFullDetails ? 'Full Access' : 'Limited View'}
            </span>
          </div>

          {permissions.canManageInjuries && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Report Injury
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Injuries"
          value={stats.active}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          subtitle={`${stats.total} total recorded`}
        />
        <StatCard
          title="Recovering"
          value={stats.recovering}
          icon={<TrendingUp className="w-5 h-5" />}
          color="yellow"
          subtitle="In rehabilitation"
        />
        <StatCard
          title="Cleared"
          value={stats.cleared}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          subtitle="Ready to play"
        />
        <StatCard
          title="Availability"
          value={`${Math.round(((teamPlayers.length - stats.active) / teamPlayers.length) * 100)}%`}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
          subtitle={`${teamPlayers.length - stats.active}/${teamPlayers.length} available`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by player, body part, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InjuryStatus | 'ALL')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RECOVERING">Recovering</option>
          <option value="CLEARED">Cleared</option>
          <option value="CHRONIC">Chronic</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as InjurySeverity | 'ALL')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="ALL">All Severities</option>
          <option value="MINOR">Minor</option>
          <option value="MODERATE">Moderate</option>
          <option value="SEVERE">Severe</option>
          <option value="CRITICAL">Critical</option>
          <option value="CAREER_THREATENING">Career Threatening</option>
        </select>

        {/* Export */}
        {permissions.canViewFullDetails && (
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {/* Injuries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredInjuries.length === 0 ? (
          <div className="p-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL'
                ? 'No injuries match your filters'
                : 'No injuries recorded'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'All players are currently fit and healthy'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="w-8 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Injury
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recovery
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInjuries.map((injury) => {
                  const isExpanded = expandedRows.has(injury.id);
                  const recovery = getRecoveryProgress(injury);
                  const playerInfo = injury.player.teamPlayers[0];

                  return (
                    <>
                      <tr
                        key={injury.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => toggleRow(injury.id)}
                      >
                        <td className="px-4 py-4">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {injury.player.user.avatarUrl ? (
                                <img
                                  src={injury.player.user.avatarUrl}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-500" />
                                </div>
                              )}
                              {injury.status === 'ACTIVE' && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {injury.player.user.firstName} {injury.player.user.lastName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                #{playerInfo?.jerseyNumber || '—'} • {playerInfo?.position?.replace(/_/g, ' ') || 'No position'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {injury.bodyPart || 'Unspecified'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {permissions.canViewFullDetails
                                ? (injury.diagnosis || 'No diagnosis')
                                : (
                                  <span className="flex items-center gap-1">
                                    <EyeOff className="w-3 h-3" />
                                    Restricted
                                  </span>
                                )}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getSeverityColor(injury.severity)}`}>
                            {injury.severity.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(injury.status)}`}>
                            {injury.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {recovery ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                  {recovery.daysRemaining > 0
                                    ? `${recovery.daysRemaining} days left`
                                    : 'Overdue'}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {Math.round(recovery.progress)}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    recovery.progress >= 100
                                      ? 'bg-green-500'
                                      : recovery.progress >= 75
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(recovery.progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              No return date set
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {permissions.canManageInjuries && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInjury(injury);
                                    setShowEditModal(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {injury.status === 'RECOVERING' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle clear injury
                                    }}
                                    className="p-2 text-green-500 hover:text-green-600"
                                    title="Mark as Cleared"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-900/30">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-8">
                              {/* Injury Details */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Injury Details
                                </h4>
                                <dl className="space-y-2 text-sm">
                                  <div>
                                    <dt className="text-gray-500 dark:text-gray-400">Injury Date</dt>
                                    <dd className="text-gray-900 dark:text-white">
                                      {format(new Date(injury.injuryDate), 'PPP')}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500 dark:text-gray-400">Expected Return</dt>
                                    <dd className="text-gray-900 dark:text-white">
                                      {injury.expectedReturnDate
                                        ? format(new Date(injury.expectedReturnDate), 'PPP')
                                        : 'Not set'}
                                    </dd>
                                  </div>
                                  {injury.actualReturnDate && (
                                    <div>
                                      <dt className="text-gray-500 dark:text-gray-400">Actual Return</dt>
                                      <dd className="text-gray-900 dark:text-white">
                                        {format(new Date(injury.actualReturnDate), 'PPP')}
                                      </dd>
                                    </div>
                                  )}
                                </dl>
                              </div>

                              {/* Treatment Plan (if authorized) */}
                              {permissions.canViewFullDetails && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Treatment Plan
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {injury.treatmentPlan || 'No treatment plan recorded'}
                                  </p>
                                </div>
                              )}

                              {/* Notes */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Notes
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {injury.notes || 'No additional notes'}
                                </p>
                              </div>
                            </div>

                            {/* Medical Records (if authorized) */}
                            {permissions.canViewFullDetails && injury.medicalRecords && injury.medicalRecords.length > 0 && (
                              <div className="mt-4 pl-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                  <Shield className="w-4 h-4" />
                                  Medical Records
                                </h4>
                                <div className="space-y-2">
                                  {injury.medicalRecords.map((record: any) => (
                                    <div
                                      key={record.id}
                                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {record.type}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          {format(new Date(record.createdAt), 'PPP')}
                                        </p>
                                      </div>
                                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                        View
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Body Part Distribution */}
      {Object.keys(stats.byBodyPart).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Injury Distribution by Body Part
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(stats.byBodyPart)
              .sort((a, b) => b[1] - a[1])
              .map(([bodyPart, count]) => (
                <div
                  key={bodyPart}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center"
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {count}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {bodyPart}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Common Injury Types for this Sport */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          Common {sportConfig.name} Injuries
        </h4>
        <div className="flex flex-wrap gap-2">
          {SPORT_INJURY_PATTERNS[sport]?.slice(0, 8).map((pattern) => (
            <span
              key={pattern}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full"
            >
              {pattern}
            </span>
          ))}
        </div>
      </div>

      {/* Add/Edit Modals would go here */}
      {showAddModal && (
        <AddInjuryModal
          teamPlayers={teamPlayers}
          sport={sport}
          onClose={() => setShowAddModal(false)}
          onSubmit={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'red' | 'yellow' | 'green' | 'blue';
  subtitle?: string;
}) {
  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADD INJURY MODAL
// ============================================================================

function AddInjuryModal({
  teamPlayers,
  sport,
  onClose,
  onSubmit,
}: {
  teamPlayers: TeamPlayerWithRelations[];
  sport: Sport;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [formData, setFormData] = useState({
    playerId: '',
    bodyPart: '',
    diagnosis: '',
    severity: 'MODERATE' as InjurySeverity,
    injuryDate: format(new Date(), 'yyyy-MM-dd'),
    expectedReturnDate: '',
    treatmentPlan: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonInjuries = SPORT_INJURY_PATTERNS[sport] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSubmit();
      }
    } catch (error) {
      console.error('Failed to create injury:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Report New Injury
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player *
              </label>
              <select
                required
                value={formData.playerId}
                onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select player...</option>
                {teamPlayers.map((tp) => (
                  <option key={tp.id} value={tp.player.id}>
                    #{tp.jerseyNumber || '—'} {tp.player.user.firstName} {tp.player.user.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Body Part */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Body Part / Area *
              </label>
              <input
                type="text"
                required
                list="body-parts"
                value={formData.bodyPart}
                onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Hamstring, Ankle, Knee"
              />
              <datalist id="body-parts">
                {['Head', 'Neck', 'Shoulder', 'Arm', 'Elbow', 'Wrist', 'Hand', 'Back', 'Hip', 'Groin', 'Thigh', 'Hamstring', 'Quadriceps', 'Knee', 'Calf', 'Ankle', 'Foot'].map((part) => (
                  <option key={part} value={part} />
                ))}
              </datalist>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Diagnosis
              </label>
              <input
                type="text"
                list="common-injuries"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Grade 2 Hamstring Strain"
              />
              <datalist id="common-injuries">
                {commonInjuries.map((injury) => (
                  <option key={injury} value={injury} />
                ))}
              </datalist>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity *
              </label>
              <select
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as InjurySeverity })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="MINOR">Minor (1-3 days)</option>
                <option value="MODERATE">Moderate (1-3 weeks)</option>
                <option value="SEVERE">Severe (1-3 months)</option>
                <option value="CRITICAL">Critical (3-6 months)</option>
                <option value="CAREER_THREATENING">Career Threatening (6+ months)</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Injury Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.injuryDate}
                  onChange={(e) => setFormData({ ...formData, injuryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expected Return
                </label>
                <input
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Treatment Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Treatment Plan
              </label>
              <textarea
                rows={3}
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="Rehabilitation steps, physio schedule, etc."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Report Injury'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}