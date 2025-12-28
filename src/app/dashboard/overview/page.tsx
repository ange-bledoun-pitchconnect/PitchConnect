/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Dashboard Overview v2.0 (Multi-Sport)
 * Path: src/app/dashboard/overview/page.tsx
 * ============================================================================
 * 
 * MULTI-SPORT FEATURES:
 * ✅ Sport-specific stat labels and icons
 * ✅ Multi-sport team display
 * ✅ Role-based dashboard cards
 * ✅ Dynamic greeting
 * ✅ Profile completion tracking
 * ✅ Dark mode support
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Trophy, Target, Calendar, TrendingUp, Award, Activity, Users, Settings,
  Bell, HelpCircle, MessageSquare, Shield, Star, CheckCircle, ArrowRight,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS, getStatLabels } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardData {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
    roles: string[];
  };
  player?: {
    isVerified: boolean;
    overallRating: number | null;
    teamsCount: number;
    matchesPlayed: number;
    upcomingMatches: number;
    goals: number;
    assists: number;
    sports: Sport[];
    primarySport: Sport;
    recentAchievements: { title: string; icon: string | null; unlockedAt: Date }[];
  };
  profileCompletion: number;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getDashboardData(userId: string): Promise<DashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // NOTE: roles is a String[] scalar on User, NOT a relation - no include needed
      player: {
        include: {
          teamPlayers: {
            where: { isActive: true },
            include: { team: { include: { club: { select: { sport: true } } } } },
          },
          statistics: { orderBy: { season: 'desc' }, take: 1 },
          achievements: { orderBy: { unlockedAt: 'desc' }, take: 5 },
        },
      },
    },
  });

  if (!user) redirect('/auth/login');

  // roles is already a String[] on the user object
  const roles = user.roles || [];
  let profileCompletion = 30; // Base for having account

  // Calculate sports and primary sport
  const sports = [...new Set(user.player?.teamPlayers.map((tp) => tp.team.club.sport as Sport) || [])];
  const primarySport = sports[0] || 'FOOTBALL';

  // Calculate profile completion
  if (user.firstName && user.lastName) profileCompletion += 20;
  if (user.player) {
    profileCompletion += 10;
    if (user.player.teamPlayers.length > 0) profileCompletion += 20;
    if (user.player.statistics.length > 0) profileCompletion += 20;
  }

  // Get upcoming matches count
  const clubIds = user.player?.teamPlayers.map((tp) => tp.team.clubId) || [];
  const upcomingMatchesCount = clubIds.length > 0
    ? await prisma.match.count({
        where: {
          status: 'SCHEDULED',
          kickOffTime: { gte: new Date() },
          OR: [{ homeClubId: { in: clubIds } }, { awayClubId: { in: clubIds } }],
        },
      })
    : 0;

  const currentStats = user.player?.statistics[0];

  return {
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.avatar, // Field is 'avatar' in schema, not 'image'
      roles,
    },
    player: user.player
      ? {
          isVerified: user.player.isVerified,
          overallRating: user.player.overallRating,
          teamsCount: user.player.teamPlayers.length,
          matchesPlayed: currentStats?.matches || 0,
          upcomingMatches: upcomingMatchesCount,
          goals: currentStats?.goals || 0,
          assists: currentStats?.assists || 0,
          sports,
          primarySport,
          recentAchievements: user.player.achievements.map((a) => ({
            title: a.title,
            icon: a.icon,
            unlockedAt: a.unlockedAt,
          })),
        }
      : undefined,
    profileCompletion: Math.min(profileCompletion, 100),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const data = await getDashboardData(session.user.id);
  const firstName = data.user.firstName || 'there';
  const greeting = getGreeting();

  // Get sport config for primary sport
  const primarySport = data.player?.primarySport || 'FOOTBALL';
  const sportConfig = SPORT_CONFIGS[primarySport];
  const statLabels = getStatLabels(primarySport);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">
            Welcome back to your PitchConnect dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sports Badges */}
          {data.player?.sports && data.player.sports.length > 0 && (
            <div className="flex gap-1">
              {data.player.sports.map((sport) => {
                const config = SPORT_CONFIGS[sport];
                return (
                  <span key={sport} className="px-2 py-1 bg-neutral-100 dark:bg-charcoal-700 rounded-full text-sm" title={config.name}>
                    {config.icon}
                  </span>
                );
              })}
            </div>
          )}
          {data.player?.isVerified && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* PROFILE COMPLETION */}
      {data.profileCompletion < 100 && (
        <div className="bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 border border-gold-200 dark:border-gold-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gold-800 dark:text-gold-300">Complete Your Profile</span>
            <span className="text-sm font-bold text-gold-600 dark:text-gold-400">{data.profileCompletion}%</span>
          </div>
          <div className="w-full bg-gold-200 dark:bg-gold-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-gold-500 to-orange-400 h-2 rounded-full" style={{ width: `${data.profileCompletion}%` }} />
          </div>
          <Link href="/dashboard/player/profile" className="text-sm text-gold-700 dark:text-gold-400 hover:underline mt-2 inline-flex items-center gap-1">
            Complete now <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* STATS OVERVIEW - Sport Specific */}
      {data.player && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Teams Joined"
            value={data.player.teamsCount}
            icon={<Users className="w-8 h-8 text-blue-500" />}
            href="/dashboard/player/teams"
          />
          <StatCard
            label="Matches Played"
            value={data.player.matchesPlayed}
            icon={<Calendar className="w-8 h-8 text-purple-500" />}
            href="/dashboard/player/fixtures"
          />
          <StatCard
            label={statLabels.primaryStat}
            value={data.player.goals}
            icon={<Target className="w-8 h-8 text-green-500" />}
            href="/dashboard/player/stats"
          />
          <StatCard
            label={statLabels.secondaryStat}
            value={data.player.assists}
            icon={<Activity className="w-8 h-8 text-orange-500" />}
            href="/dashboard/player/stats"
          />
        </div>
      )}

      {/* ROLE-BASED CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Player Card - Always show for players */}
        {data.player && (
          <DashboardCard
            href="/dashboard/player"
            icon={<span className="text-3xl">{sportConfig.icon}</span>}
            title="Player Dashboard"
            description={`Track your ${sportConfig.name} performance and stats`}
            gradient="from-green-500 to-emerald-600"
          />
        )}

        {/* Role-specific cards */}
        {data.user.roles.includes('SUPER_ADMIN') && (
          <DashboardCard
            href="/dashboard/admin"
            icon={<Shield className="w-8 h-8 text-white" />}
            title="Admin Panel"
            description="Manage users, clubs, and system settings"
            gradient="from-red-500 to-pink-600"
          />
        )}

        {data.user.roles.includes('LEAGUE_ADMIN') && (
          <DashboardCard
            href="/dashboard/leagues"
            icon={<Trophy className="w-8 h-8 text-white" />}
            title="League Management"
            description="Manage leagues, fixtures, and standings"
            gradient="from-purple-500 to-indigo-600"
          />
        )}

        {(data.user.roles.includes('CLUB_OWNER') || data.user.roles.includes('MANAGER')) && (
          <DashboardCard
            href="/dashboard/club"
            icon={<Shield className="w-8 h-8 text-white" />}
            title="Club Management"
            description="Manage your club, teams, and members"
            gradient="from-blue-500 to-cyan-600"
          />
        )}

        {data.user.roles.includes('COACH') && (
          <DashboardCard
            href="/dashboard/coach"
            icon={<Users className="w-8 h-8 text-white" />}
            title="Coach Dashboard"
            description="Manage training, tactics, and team selection"
            gradient="from-orange-500 to-amber-600"
          />
        )}

        {data.user.roles.includes('TREASURER') && (
          <DashboardCard
            href="/dashboard/finance"
            icon={<TrendingUp className="w-8 h-8 text-white" />}
            title="Finance Dashboard"
            description="Manage payments, invoices, and reports"
            gradient="from-teal-500 to-green-600"
          />
        )}
      </div>

      {/* RECENT ACHIEVEMENTS */}
      {data.player && data.player.recentAchievements.length > 0 && (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-500" />
              Recent Achievements
            </h2>
            <Link href="/dashboard/player/achievements" className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {data.player.recentAchievements.map((achievement, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800 rounded-lg">
                  <span className="text-2xl">{achievement.icon || '🏆'}</span>
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-white text-sm">{achievement.title}</p>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUICK LINKS */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white">Quick Links</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-neutral-200 dark:divide-charcoal-700">
          <QuickLink href="/dashboard/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
          <QuickLink href="/dashboard/notifications" icon={<Bell className="w-5 h-5" />} label="Notifications" />
          <QuickLink href="/help" icon={<HelpCircle className="w-5 h-5" />} label="Help Center" />
          <QuickLink href="/feedback" icon={<MessageSquare className="w-5 h-5" />} label="Feedback" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon, href }: { label: string; value: number; icon: React.ReactNode; href?: string }) {
  const content = (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function DashboardCard({ href, icon, title, description, gradient }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string;
}) {
  return (
    <Link href={href} className="group">
      <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all h-full`}>
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-white/80">{description}</p>
        <div className="flex items-center gap-2 mt-4 text-white/90 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Open</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-center gap-2 p-4 hover:bg-neutral-50 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 transition-colors">
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}