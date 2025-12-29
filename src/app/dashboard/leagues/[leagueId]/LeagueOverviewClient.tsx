// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE OVERVIEW CLIENT COMPONENT
// =============================================================================
// Interactive client component for league overview dashboard
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Settings,
  BarChart3,
  Plus,
  Trash2,
  Shield,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Loader2,
  Check,
  X,
  AlertCircle,
  MapPin,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface LeagueOverviewData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  country: string;
  status: string;
  format: string;
  visibility: string;
  logo: string | null;
  description: string | null;
  configuration: {
    pointsForWin: number;
    pointsForDraw: number;
    pointsForLoss: number;
    bonusPointsEnabled: boolean;
    bonusPointsConfig: Record<string, number> | null;
    minTeams: number;
    maxTeams: number | null;
    registrationOpen: boolean;
  } | null;
  currentSeason: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date | null;
  } | null;
  stats: {
    totalTeams: number;
    totalMatches: number;
    completedMatches: number;
    upcomingMatches: number;
    pendingInvitations: number;
  };
  standingsPreview: Array<{
    position: number;
    teamId: string;
    teamName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
    goalDifference: number;
  }>;
  teams: Array<{
    id: string;
    name: string;
    ageGroup: string | null;
    category: string;
    club: {
      name: string;
      city: string | null;
    } | null;
  }>;
  recentResults: Array<{
    id: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
    homeScore: number | null;
    awayScore: number | null;
    kickOffTime: Date;
  }>;
  admin: {
    firstName: string;
    lastName: string;
  } | null;
}

interface SportConfig {
  label: string;
  icon: string;
  color: string;
  scoringLabel: string;
  defaultPoints: { win: number; draw: number; loss: number };
}

interface LeagueOverviewClientProps {
  league: LeagueOverviewData;
  sportConfig: SportConfig;
  pointsSystem: { win: number; draw: number; loss: number };
  isAdmin: boolean;
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function LeagueOverviewClient({
  league,
  sportConfig,
  pointsSystem,
  isAdmin,
}: LeagueOverviewClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleDeleteLeague = async () => {
    if (!confirm(`Are you sure you want to delete "${league.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete league');

      showToast('League deleted successfully', 'success');
      setTimeout(() => router.push('/dashboard/leagues'), 1000);
    } catch (error) {
      showToast('Failed to delete league', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Quick Actions (Admin Only) */}
      {isAdmin && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/leagues/${league.id}/teams`}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Manage Teams
          </Link>
          <Link
            href={`/dashboard/leagues/${league.id}/fixtures`}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Fixtures
          </Link>
          <Link
            href={`/dashboard/leagues/${league.id}/settings`}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <Link
            href={`/dashboard/leagues/${league.id}/analytics`}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <button
            onClick={handleDeleteLeague}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Teams"
          value={league.stats.totalTeams}
          subtext={league.configuration?.maxTeams ? `Max: ${league.configuration.maxTeams}` : undefined}
          icon={<Shield className="w-6 h-6 text-amber-500" />}
          href={`/dashboard/leagues/${league.id}/teams`}
        />
        <StatCard
          label="Matches"
          value={league.stats.totalMatches}
          subtext={`${league.stats.completedMatches} completed`}
          icon={<Calendar className="w-6 h-6 text-blue-500" />}
          href={`/dashboard/leagues/${league.id}/fixtures`}
        />
        <StatCard
          label="Format"
          value={league.format.replace(/_/g, ' ')}
          icon={<Target className="w-6 h-6 text-purple-500" />}
        />
        <StatCard
          label="Registration"
          value={league.configuration?.registrationOpen ? 'Open' : 'Closed'}
          subtext={league.stats.pendingInvitations > 0 ? `${league.stats.pendingInvitations} pending` : undefined}
          icon={league.configuration?.registrationOpen 
            ? <CheckCircle className="w-6 h-6 text-green-500" /> 
            : <XCircle className="w-6 h-6 text-red-500" />
          }
        />
      </div>

      {/* Points System */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Points System
          </h2>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <PointsBadge label="Win" value={pointsSystem.win} color="green" />
            <PointsBadge label="Draw" value={pointsSystem.draw} color="amber" />
            <PointsBadge label="Loss" value={pointsSystem.loss} color="red" />
            {league.configuration?.bonusPointsEnabled && (
              <>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Bonus Points Enabled
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Standings Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Standings
            </h2>
            <Link
              href={`/dashboard/leagues/${league.id}/standings`}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            >
              View Full Table →
            </Link>
          </div>
          <div className="p-5">
            {league.standingsPreview.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
                title="No standings yet"
                description="Add teams and play matches to generate standings"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 font-semibold">#</th>
                      <th className="text-left py-2 font-semibold">Team</th>
                      <th className="text-center py-2 font-semibold">P</th>
                      <th className="text-center py-2 font-semibold">W</th>
                      <th className="text-center py-2 font-semibold">D</th>
                      <th className="text-center py-2 font-semibold">L</th>
                      <th className="text-center py-2 font-semibold">GD</th>
                      <th className="text-center py-2 font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {league.standingsPreview.map((s) => (
                      <tr key={s.teamId} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{s.position}</td>
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">{s.teamName}</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-400">{s.played}</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-400">{s.won}</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-400">{s.drawn}</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-400">{s.lost}</td>
                        <td className={`py-3 text-center font-semibold ${
                          s.goalDifference > 0 ? 'text-green-600 dark:text-green-400' :
                          s.goalDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {s.goalDifference > 0 ? '+' : ''}{s.goalDifference}
                        </td>
                        <td className="py-3 text-center font-bold text-amber-600 dark:text-amber-400">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Recent Results
            </h2>
            <Link
              href={`/dashboard/leagues/${league.id}/fixtures`}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            >
              View All →
            </Link>
          </div>
          <div className="p-5">
            {league.recentResults.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
                title="No results yet"
                description="Play matches to see results here"
              />
            ) : (
              <div className="space-y-3">
                {league.recentResults.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm truncate flex-1">
                      {match.homeTeam.name}
                    </span>
                    <span className="px-3 py-1 bg-slate-200 dark:bg-slate-600 rounded text-sm font-bold text-slate-900 dark:text-white mx-2">
                      {match.homeScore} - {match.awayScore}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm truncate flex-1 text-right">
                      {match.awayTeam.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Teams
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {league.stats.totalTeams} teams in this league
            </p>
          </div>
          <Link
            href={`/dashboard/leagues/${league.id}/teams`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
          >
            {isAdmin ? <Plus className="w-4 h-4" /> : null}
            {isAdmin ? 'Manage Teams' : 'View All'}
          </Link>
        </div>
        <div className="p-5">
          {league.teams.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
              title="No teams yet"
              description="Add teams to start your league competition"
              action={isAdmin ? {
                label: 'Add Teams',
                href: `/dashboard/leagues/${league.id}/teams`,
              } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {league.teams.map((team) => (
                <TeamCard key={team.id} team={team} sportIcon={sportConfig.icon} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({
  label,
  value,
  subtext,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
        </div>
        {icon}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function PointsBadge({ label, value, color }: { label: string; value: number; color: 'green' | 'amber' | 'red' }) {
  const colors = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <span className="text-lg font-bold">{value}</span>
      </div>
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  );
}

function TeamCard({ team, sportIcon }: { team: any; sportIcon: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
          <span className="text-lg">{sportIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{team.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{team.club?.name || 'Independent'}</p>
        </div>
      </div>
      {team.club?.city && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <MapPin className="w-3 h-3" />
          {team.club.city}
        </div>
      )}
      <div className="flex items-center gap-2">
        {team.ageGroup && (
          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-semibold">
            {team.ageGroup}
          </span>
        )}
        <span className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 rounded text-xs font-semibold">
          {team.category.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </Link>
      )}
    </div>
  );
}