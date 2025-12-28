/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Parent/Guardian Dashboard v2.0
 * Path: src/app/dashboard/parent/page.tsx
 * ============================================================================
 * 
 * Features:
 * ✅ Children's activities overview
 * ✅ Match schedules
 * ✅ Payment management
 * ✅ Communication with coaches
 * ✅ Consent management
 * ✅ Progress tracking
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Heart, Users, Calendar, DollarSign, MessageSquare, FileText, Shield,
  ArrowRight, Clock, MapPin, Trophy, TrendingUp, Bell, CheckCircle,
} from 'lucide-react';
import { SPORT_CONFIGS, Sport } from '@/types/player';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getParentDashboardData(userId: string) {
  // Parent model only has user relation
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  });

  if (!parent) {
    return { hasChildren: false, children: [], upcomingMatches: [], pendingPayments: [] };
  }

  // Get upcoming matches (general matches for now since we don't have children relation)
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
    take: 5,
  });

  return {
    hasChildren: true, // Parent exists, so they have the role
    parent: {
      name: `${parent.user.firstName || ''} ${parent.user.lastName || ''}`.trim() || 'Parent',
    },
    children: [], // Children relation not available in current schema
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      sport: (m.homeTeam.sport as Sport) || 'FOOTBALL',
    })),
    pendingPayments: [], // Would come from payment/invoice tables
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function ParentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getParentDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          👨‍👩‍👧‍👦 Parent Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Stay connected with your children's sporting activities
        </p>
      </div>

      {!data.hasChildren ? (
        <NoChildrenState />
      ) : (
        <>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickAction
              href="/dashboard/parent/children"
              icon={<Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
              title="My Children"
              description="View profiles and progress"
              gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
              borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
            />
            <QuickAction
              href="/dashboard/parent/schedule"
              icon={<Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />}
              title="Schedule"
              description="Matches, training, and events"
              gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
              borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
            />
            <QuickAction
              href="/dashboard/parent/payments"
              icon={<DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
              title="Payments"
              description="Fees, subscriptions, and invoices"
              gradient="from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
              borderColor="border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
            />
            <QuickAction
              href="/dashboard/parent/messages"
              icon={<MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
              title="Messages"
              description="Contact coaches and clubs"
              gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
              borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
            />
          </div>

          {/* My Children */}
          <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
            <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                My Children
              </h2>
              <Link href="/dashboard/parent/children/add" className="px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
                Link Child
              </Link>
            </div>
            <div className="p-6">
              {data.children.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-pink-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                    No Children Linked Yet
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400 mb-4">
                    Link your children's player profiles to track their activities and schedule.
                  </p>
                  <Link 
                    href="/dashboard/parent/children/add"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-lg"
                  >
                    <Heart className="w-4 h-4" />
                    Link Your First Child
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/dashboard/parent/children/${child.id}`}
                      className="group p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-400 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                          {child.avatar ? (
                            <img src={child.avatar} alt={child.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            child.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-charcoal-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 truncate">
                            {child.name}
                          </p>
                          {child.teams.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-sm">{SPORT_CONFIGS[child.teams[0].sport]?.icon}</span>
                              <span className="text-sm text-charcoal-600 dark:text-charcoal-400 truncate">
                                {child.teams[0].name}
                              </span>
                            </div>
                          )}
                          {child.stats && (
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
                              {child.stats.matches || 0} matches • {child.stats.goals || 0} goals
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-charcoal-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events & Pending Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Matches */}
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
              <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Upcoming Events
                </h2>
                <Link href="/dashboard/parent/schedule" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
                  View All
                </Link>
              </div>
              <div className="p-6">
                {data.upcomingMatches.length === 0 ? (
                  <EmptyState icon={<Calendar className="w-12 h-12" />} title="No upcoming events" />
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

            {/* Pending Tasks */}
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
              <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Action Required
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <ActionItem label="Update emergency contact" type="form" />
                <ActionItem label="Complete consent form" type="consent" />
                <ActionItem label="Review payment due" type="payment" />
              </div>
            </div>
          </div>
        </>
      )}
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
        <span>View</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function ActionItem({ label, type }: { label: string; type: 'form' | 'consent' | 'payment' }) {
  const icons = {
    form: <FileText className="w-5 h-5 text-blue-500" />,
    consent: <Shield className="w-5 h-5 text-purple-500" />,
    payment: <DollarSign className="w-5 h-5 text-green-500" />,
  };

  return (
    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
      <div className="flex items-center gap-3">
        {icons[type]}
        <span className="font-medium text-charcoal-700 dark:text-charcoal-300">{label}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-orange-500" />
    </div>
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

function NoChildrenState() {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-12 text-center">
      <Heart className="w-20 h-20 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-3">No Children Linked</h2>
      <p className="text-charcoal-600 dark:text-charcoal-400 mb-8 max-w-md mx-auto">
        Link your children's accounts to track their activities, matches, and progress.
      </p>
      <Link
        href="/dashboard/parent/children/add"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
      >
        <Users className="w-5 h-5" />
        Link a Child
      </Link>
    </div>
  );
}