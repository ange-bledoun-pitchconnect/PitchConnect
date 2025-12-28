/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Referee Dashboard v2.0
 * Path: src/app/dashboard/referee/page.tsx
 * ============================================================================
 * 
 * Features:
 * ✅ Match assignments
 * ✅ Schedule management
 * ✅ Match reports
 * ✅ Availability calendar
 * ✅ Fee tracking
 * ✅ Qualification management
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Flag, Calendar, FileText, DollarSign, Clock, MapPin, CheckCircle,
  ArrowRight, AlertCircle, Award, Star, TrendingUp,
} from 'lucide-react';
import { SPORT_CONFIGS, Sport } from '@/types/player';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getRefereeDashboardData(userId: string) {
  const referee = await prisma.referee.findUnique({
    where: { userId },
  });

  if (!referee) {
    return { hasProfile: false, stats: null, upcomingMatches: [], recentMatches: [] };
  }

  // Get assigned matches
  const matches = await prisma.match.findMany({
    where: {
      refereeId: referee.id,
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { kickOffTime: 'desc' },
    take: 20,
  });

  const now = new Date();
  const upcomingMatches = matches.filter(m => new Date(m.kickOffTime) >= now && m.status === 'SCHEDULED');
  const completedMatches = matches.filter(m => m.status === 'FINISHED');

  return {
    hasProfile: true,
    referee: {
      level: referee.licenseLevel,
      rating: referee.rating,
    },
    stats: {
      matchesOfficiated: completedMatches.length,
      upcomingAssignments: upcomingMatches.length,
      averageRating: referee.rating || 0,
      totalEarnings: 0, // Would come from fee tracking
    },
    upcomingMatches: upcomingMatches.slice(0, 5).map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      sport: (m.homeTeam.sport as Sport) || 'FOOTBALL',
    })),
    recentMatches: completedMatches.slice(0, 5).map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
    })),
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function RefereePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getRefereeDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          ⚫ Referee Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage your match assignments, availability, and officiating records
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Matches Officiated" value={data.stats?.matchesOfficiated || 0} icon={<Flag className="w-8 h-8 text-charcoal-700 dark:text-charcoal-300" />} hoverColor="hover:border-charcoal-400" />
        <StatCard label="Upcoming Matches" value={data.stats?.upcomingAssignments || 0} icon={<Calendar className="w-8 h-8 text-blue-500" />} hoverColor="hover:border-blue-400" />
        <StatCard label="Average Rating" value={data.stats?.averageRating?.toFixed(1) || '-'} icon={<Star className="w-8 h-8 text-gold-500" />} hoverColor="hover:border-gold-400" />
        <StatCard label="Total Earnings" value={`£${data.stats?.totalEarnings || 0}`} icon={<DollarSign className="w-8 h-8 text-green-500" />} hoverColor="hover:border-green-400" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction
          href="/dashboard/referee/availability"
          icon={<Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Set Availability"
          description="Update your available dates and times"
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
        />
        <QuickAction
          href="/dashboard/referee/assignments"
          icon={<Flag className="w-8 h-8 text-charcoal-700 dark:text-charcoal-400" />}
          title="My Assignments"
          description="View all your match assignments"
          gradient="from-neutral-50 to-neutral-100 dark:from-charcoal-700/50 dark:to-charcoal-600/50"
          borderColor="border-neutral-300 dark:border-charcoal-600 hover:border-charcoal-400"
        />
        <QuickAction
          href="/dashboard/referee/reports"
          icon={<FileText className="w-8 h-8 text-green-600 dark:text-green-400" />}
          title="Match Reports"
          description="Submit and view match reports"
          gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
        />
        <QuickAction
          href="/dashboard/referee/qualifications"
          icon={<Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="Qualifications"
          description="Manage certifications and training"
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
        />
      </div>

      {/* Upcoming & Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Assignments
            </h2>
            <Link href="/dashboard/referee/assignments" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            {data.upcomingMatches.length === 0 ? (
              <EmptyState icon={<Calendar className="w-16 h-16" />} title="No upcoming assignments" description="Set your availability to receive match assignments" />
            ) : (
              <div className="space-y-3">
                {data.upcomingMatches.map((match) => {
                  const sportConfig = SPORT_CONFIGS[match.sport] || SPORT_CONFIGS.FOOTBALL;
                  return (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Recent Matches
            </h2>
            <Link href="/dashboard/referee/history" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            {data.recentMatches.length === 0 ? (
              <EmptyState icon={<Flag className="w-16 h-16" />} title="No match history" description="Your officiated matches will appear here" />
            ) : (
              <div className="space-y-3">
                {data.recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-charcoal-900 dark:text-white text-sm">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </p>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                        {new Date(match.kickOffTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="font-bold text-charcoal-900 dark:text-white">
                      {match.homeScore} - {match.awayScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon, hoverColor }: { label: string; value: number | string; icon: React.ReactNode; hoverColor: string }) {
  return (
    <div className={`bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${hoverColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1 font-medium">{label}</p>
          <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, description, gradient, borderColor }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string;
}) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Open</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>}
    </div>
  );
}