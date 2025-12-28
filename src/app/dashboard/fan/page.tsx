/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Fan Dashboard v2.0
 * Path: src/app/dashboard/fan/page.tsx
 * ============================================================================
 * 
 * Features:
 * ✅ Follow favorite teams and players
 * ✅ Match schedules and results
 * ✅ News and updates
 * ✅ Live scores
 * ✅ Community engagement
 * ✅ Merchandise/tickets (future)
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Heart, Users, Trophy, Calendar, Star, Bell, ArrowRight, Clock,
  TrendingUp, Activity, Flag, Search, Radio, Newspaper, MapPin,
} from 'lucide-react';
import { SPORT_CONFIGS, Sport } from '@/types/player';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getFanDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      following: {
        include: {
          following: true,
        },
        take: 10,
      },
    },
  });

  // Get upcoming matches across all leagues
  // Note: homeTeam and awayTeam ARE Club models directly
  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: 'SCHEDULED',
      kickOffTime: { gte: new Date() },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { kickOffTime: 'asc' },
    take: 10,
  });

  // Get recent results
  const recentResults = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { kickOffTime: 'desc' },
    take: 5,
  });

  return {
    followingCount: user?.following?.length || 0,
    favoriteTeams: [], // Would come from user preferences
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      sport: (m.homeTeam.sport as Sport) || 'FOOTBALL',
    })),
    recentResults: recentResults.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      sport: (m.homeTeam.sport as Sport) || 'FOOTBALL',
    })),
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function FanPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getFanDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          🎉 Fan Zone
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Follow your favorite teams, track matches, and stay connected
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction
          href="/dashboard/fan/discover"
          icon={<Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Discover Teams"
          description="Find and follow teams near you"
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
        />
        <QuickAction
          href="/dashboard/fan/following"
          icon={<Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />}
          title="Following"
          description={`${data.followingCount} teams and players`}
          gradient="from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20"
          borderColor="border-pink-200 dark:border-pink-800 hover:border-pink-400"
        />
        <QuickAction
          href="/dashboard/fan/live"
          icon={<Radio className="w-8 h-8 text-red-600 dark:text-red-400" />}
          title="Live Scores"
          description="Real-time match updates"
          gradient="from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
          borderColor="border-red-200 dark:border-red-800 hover:border-red-400"
        />
        <QuickAction
          href="/dashboard/fan/news"
          icon={<Newspaper className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="News & Updates"
          description="Latest from your teams"
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
        />
      </div>

      {/* Upcoming Matches & Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Matches
            </h2>
            <Link href="/dashboard/fan/fixtures" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            {data.upcomingMatches.length === 0 ? (
              <EmptyState icon={<Calendar className="w-12 h-12" />} title="No upcoming matches" />
            ) : (
              <div className="space-y-3">
                {data.upcomingMatches.slice(0, 5).map((match) => {
                  const sportConfig = SPORT_CONFIGS[match.sport] || SPORT_CONFIGS.FOOTBALL;
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{sportConfig.icon}</span>
                        <div>
                          <p className="font-semibold text-charcoal-900 dark:text-white text-sm">
                            {match.homeTeam.name} vs {match.awayTeam.name}
                          </p>
                          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(match.kickOffTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold-500" />
              Recent Results
            </h2>
            <Link href="/dashboard/fan/results" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            {data.recentResults.length === 0 ? (
              <EmptyState icon={<Trophy className="w-12 h-12" />} title="No recent results" />
            ) : (
              <div className="space-y-3">
                {data.recentResults.map((match) => {
                  const sportConfig = SPORT_CONFIGS[match.sport] || SPORT_CONFIGS.FOOTBALL;
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{sportConfig.icon}</span>
                        <p className="font-semibold text-charcoal-900 dark:text-white text-sm">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </p>
                      </div>
                      <span className="font-bold text-charcoal-900 dark:text-white bg-neutral-200 dark:bg-charcoal-600 px-3 py-1 rounded-lg">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Favorite Teams */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-gold-500" />
              Your Favorite Teams
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Teams you're following</p>
          </div>
          <Link
            href="/dashboard/fan/discover"
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm"
          >
            Find Teams
          </Link>
        </div>
        <div className="p-6">
          {data.favoriteTeams.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No teams followed yet</h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">
                Discover and follow teams to get updates on their matches and news
              </p>
              <Link
                href="/dashboard/fan/discover"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm"
              >
                <Search className="w-4 h-4" /> Discover Teams
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Favorite teams would be listed here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function QuickAction({ href, icon, title, description, gradient, borderColor }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string;
}) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Explore</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3">{icon}</div>
      <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">{title}</p>
    </div>
  );
}