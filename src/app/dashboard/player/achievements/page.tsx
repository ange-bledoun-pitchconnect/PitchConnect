/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Achievements v2.0 (Multi-Sport)
 * Path: src/app/dashboard/player/achievements/page.tsx
 * ============================================================================
 * 
 * MULTI-SPORT FEATURES:
 * ✅ Sport-specific achievements (Hat Trick, Century, Triple-Double, etc.)
 * ✅ Universal achievements (Iron Player, Team Player)
 * ✅ XP/Level system
 * ✅ Leaderboard
 * ✅ Dark mode support
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Trophy, Star, Zap, TrendingUp, Award, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Sport, SPORT_CONFIGS } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string | null;
  icon: string | null;
  progress: number;
  tier: string | null;
  unlockedAt: Date;
}

interface AchievementDefinition {
  type: string;
  title: string;
  description: string;
  icon: string;
  sports: Sport[] | 'ALL';
  tiers: { tier: string; requirement: number; xp: number }[];
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS (Multi-Sport)
// ============================================================================

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Universal
  {
    type: 'FIRST_SCORE',
    title: 'First Score',
    description: 'Score your first point/goal/try',
    icon: '🎯',
    sports: 'ALL',
    tiers: [{ tier: 'BRONZE', requirement: 1, xp: 10 }],
  },
  {
    type: 'IRON_PLAYER',
    title: 'Iron Player',
    description: 'Play 100+ matches',
    icon: '💪',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 25, xp: 30 },
      { tier: 'SILVER', requirement: 50, xp: 75 },
      { tier: 'GOLD', requirement: 100, xp: 150 },
      { tier: 'PLATINUM', requirement: 250, xp: 300 },
    ],
  },
  {
    type: 'TEAM_PLAYER',
    title: 'Team Player',
    description: 'Be part of multiple teams',
    icon: '🤝',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 2, xp: 15 },
      { tier: 'SILVER', requirement: 5, xp: 50 },
    ],
  },
  {
    type: 'PLAYMAKER',
    title: 'Playmaker',
    description: 'Record assists in matches',
    icon: '🎯',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 25 },
      { tier: 'SILVER', requirement: 25, xp: 75 },
      { tier: 'GOLD', requirement: 100, xp: 200 },
    ],
  },
  // Football/Hockey/Netball
  {
    type: 'HAT_TRICK',
    title: 'Hat Trick Hero',
    description: 'Score 3 goals in a single match',
    icon: '🎩',
    sports: ['FOOTBALL', 'HOCKEY', 'NETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 50 },
      { tier: 'SILVER', requirement: 3, xp: 100 },
      { tier: 'GOLD', requirement: 10, xp: 250 },
    ],
  },
  {
    type: 'CLEAN_SHEET',
    title: 'Clean Sheet',
    description: 'Keep the opposition scoreless',
    icon: '🛡️',
    sports: ['FOOTBALL', 'HOCKEY', 'NETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 20 },
      { tier: 'SILVER', requirement: 25, xp: 60 },
      { tier: 'GOLD', requirement: 100, xp: 150 },
    ],
  },
  {
    type: 'GOLDEN_BOOT',
    title: 'Golden Boot',
    description: 'Top scorer achievements',
    icon: '👢',
    sports: ['FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 10, xp: 40 },
      { tier: 'SILVER', requirement: 25, xp: 100 },
      { tier: 'GOLD', requirement: 50, xp: 250 },
    ],
  },
  // Rugby
  {
    type: 'TRY_SCORER',
    title: 'Try Scorer',
    description: 'Score tries in matches',
    icon: '🏉',
    sports: ['RUGBY'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 25 },
      { tier: 'SILVER', requirement: 20, xp: 75 },
      { tier: 'GOLD', requirement: 50, xp: 200 },
    ],
  },
  {
    type: 'TACKLER',
    title: 'Dominant Tackler',
    description: 'Make successful tackles',
    icon: '💥',
    sports: ['RUGBY', 'AMERICAN_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 50, xp: 30 },
      { tier: 'SILVER', requirement: 150, xp: 80 },
      { tier: 'GOLD', requirement: 400, xp: 200 },
    ],
  },
  // Cricket
  {
    type: 'CENTURY',
    title: 'Century Maker',
    description: 'Score 100 runs in an innings',
    icon: '💯',
    sports: ['CRICKET'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 75 },
      { tier: 'SILVER', requirement: 5, xp: 150 },
      { tier: 'GOLD', requirement: 20, xp: 400 },
    ],
  },
  {
    type: 'FIVE_WICKETS',
    title: '5-Wicket Haul',
    description: 'Take 5 wickets in an innings',
    icon: '🎳',
    sports: ['CRICKET'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 75 },
      { tier: 'SILVER', requirement: 5, xp: 150 },
    ],
  },
  {
    type: 'DOUBLE_CENTURY',
    title: 'Double Century',
    description: 'Score 200 runs in an innings',
    icon: '🏏',
    sports: ['CRICKET'],
    tiers: [{ tier: 'GOLD', requirement: 1, xp: 200 }],
  },
  // American Football
  {
    type: 'TOUCHDOWN_KING',
    title: 'Touchdown King',
    description: 'Score touchdowns',
    icon: '🏈',
    sports: ['AMERICAN_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 30 },
      { tier: 'SILVER', requirement: 20, xp: 80 },
      { tier: 'GOLD', requirement: 50, xp: 200 },
    ],
  },
  {
    type: 'SACK_MASTER',
    title: 'Sack Master',
    description: 'Record quarterback sacks',
    icon: '💨',
    sports: ['AMERICAN_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 30 },
      { tier: 'SILVER', requirement: 15, xp: 80 },
    ],
  },
  // Basketball
  {
    type: 'TRIPLE_DOUBLE',
    title: 'Triple-Double',
    description: 'Record 10+ in 3 stat categories',
    icon: '🏀',
    sports: ['BASKETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 100 },
      { tier: 'SILVER', requirement: 5, xp: 250 },
      { tier: 'GOLD', requirement: 15, xp: 500 },
    ],
  },
  {
    type: 'DUNK_MASTER',
    title: 'Dunk Master',
    description: 'Score dunks in games',
    icon: '🔥',
    sports: ['BASKETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 10, xp: 30 },
      { tier: 'SILVER', requirement: 50, xp: 80 },
    ],
  },
  {
    type: 'THREE_POINT_SHOOTER',
    title: '3-Point Shooter',
    description: 'Make 3-point shots',
    icon: '🎯',
    sports: ['BASKETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 25, xp: 30 },
      { tier: 'SILVER', requirement: 100, xp: 80 },
      { tier: 'GOLD', requirement: 300, xp: 200 },
    ],
  },
  // Hockey
  {
    type: 'SHUTOUT',
    title: 'Shutout',
    description: 'Goalie shutout performance',
    icon: '🧤',
    sports: ['HOCKEY'],
    tiers: [
      { tier: 'BRONZE', requirement: 3, xp: 30 },
      { tier: 'SILVER', requirement: 15, xp: 90 },
    ],
  },
  // Netball
  {
    type: 'SHOOTING_STAR',
    title: 'Shooting Star',
    description: 'High shooting accuracy',
    icon: '⭐',
    sports: ['NETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 10, xp: 30 },
      { tier: 'SILVER', requirement: 30, xp: 80 },
    ],
  },
];

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  SILVER: 'bg-gray-200 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600',
  GOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-400 dark:border-yellow-600',
  PLATINUM: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-400 dark:border-cyan-600',
  DIAMOND: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-400 dark:border-purple-600',
};

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getAchievementsData(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      achievements: { orderBy: { unlockedAt: 'desc' } },
      teamPlayers: {
        where: { isActive: true },
        include: { team: { include: { club: { select: { sport: true } } } } },
      },
    },
  });

  if (!player) return { achievements: [], sports: [], totalXP: 0, level: 1 };

  // Get player's sports
  const sports = [...new Set(player.teamPlayers.map((tp) => tp.team.club.sport as Sport))];

  // Calculate XP
  let totalXP = 0;
  player.achievements.forEach((a) => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.type === a.type);
    if (def && a.tier) {
      const tierDef = def.tiers.find((t) => t.tier === a.tier);
      if (tierDef) totalXP += tierDef.xp;
    }
  });

  const level = Math.floor(totalXP / 100) + 1;
  const xpToNextLevel = 100 - (totalXP % 100);

  return {
    achievements: player.achievements,
    sports,
    totalXP,
    level,
    xpToNextLevel,
    xpProgress: totalXP % 100,
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerAchievementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const { achievements, sports, totalXP, level, xpToNextLevel, xpProgress } = await getAchievementsData(session.user.id);

  // Filter achievements relevant to player's sports
  const relevantAchievements = ACHIEVEMENT_DEFINITIONS.filter((def) => {
    if (def.sports === 'ALL') return true;
    return sports.some((s) => def.sports.includes(s));
  });

  const achievementMap = new Map<string, Achievement>();
  achievements.forEach((a) => achievementMap.set(`${a.type}-${a.tier}`, a));

  const unlockedCount = achievements.length;
  const totalPossible = relevantAchievements.reduce((acc, def) => acc + def.tiers.length, 0);

  // Group achievements by sport
  const universalAchievements = relevantAchievements.filter((d) => d.sports === 'ALL');
  const sportSpecificAchievements = relevantAchievements.filter((d) => d.sports !== 'ALL');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700">
          <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
        </Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">Achievements</h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">Unlock badges across all your sports</p>
        </div>
      </div>

      {/* Your Sports */}
      {sports.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400">Your Sports:</span>
          {sports.map((sport) => {
            const config = SPORT_CONFIGS[sport];
            return (
              <span key={sport} className="px-3 py-1 bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 rounded-full text-sm font-medium flex items-center gap-1">
                <span>{config.icon}</span> {config.name}
              </span>
            );
          })}
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900/30 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            </div>
            <span className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400">Achievements</span>
          </div>
          <p className="text-4xl font-bold text-charcoal-900 dark:text-white">{unlockedCount}<span className="text-lg text-charcoal-400">/{totalPossible}</span></p>
          <div className="mt-3 w-full bg-neutral-200 dark:bg-charcoal-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-gold-500 to-orange-400 h-2 rounded-full" style={{ width: `${(unlockedCount / totalPossible) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400">Total XP</span>
          </div>
          <p className="text-4xl font-bold text-charcoal-900 dark:text-white">{totalXP}</p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400">Level</span>
          </div>
          <p className="text-4xl font-bold text-charcoal-900 dark:text-white">{level}</p>
          <div className="mt-3 w-full bg-neutral-200 dark:bg-charcoal-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: `${xpProgress}%` }} />
          </div>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-2">{xpToNextLevel} XP to next level</p>
        </div>
      </div>

      {/* UNIVERSAL ACHIEVEMENTS */}
      <div>
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
          🏅 Universal Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universalAchievements.map((def) => (
            <AchievementCard key={def.type} def={def} achievementMap={achievementMap} />
          ))}
        </div>
      </div>

      {/* SPORT-SPECIFIC ACHIEVEMENTS */}
      {sports.map((sport) => {
        const config = SPORT_CONFIGS[sport];
        const sportAchievements = sportSpecificAchievements.filter((d) => 
          Array.isArray(d.sports) && d.sports.includes(sport)
        );
        
        if (sportAchievements.length === 0) return null;

        return (
          <div key={sport}>
            <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
              <span>{config.icon}</span> {config.name} Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sportAchievements.map((def) => (
                <AchievementCard key={def.type} def={def} achievementMap={achievementMap} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// ACHIEVEMENT CARD COMPONENT
// ============================================================================

function AchievementCard({ def, achievementMap }: { def: AchievementDefinition; achievementMap: Map<string, Achievement> }) {
  const unlockedTiers = def.tiers.filter((t) => achievementMap.has(`${def.type}-${t.tier}`));
  const highestTier = unlockedTiers.length > 0 ? unlockedTiers[unlockedTiers.length - 1] : null;
  const isUnlocked = highestTier !== null;
  const achievement = highestTier ? achievementMap.get(`${def.type}-${highestTier.tier}`) : null;

  return (
    <div className={`bg-white dark:bg-charcoal-800 rounded-xl border p-6 transition-all ${
      isUnlocked ? 'border-gold-300 dark:border-gold-700 shadow-md' : 'border-neutral-200 dark:border-charcoal-700 opacity-60'
    }`}>
      <div className="text-center space-y-3">
        <div className={`text-5xl ${!isUnlocked && 'grayscale opacity-50'}`}>{def.icon}</div>
        <div>
          <h3 className="font-bold text-lg text-charcoal-900 dark:text-white">{def.title}</h3>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{def.description}</p>
        </div>
        <div className="flex justify-center gap-1">
          {def.tiers.map((t) => {
            const tierUnlocked = achievementMap.has(`${def.type}-${t.tier}`);
            return (
              <span key={t.tier} className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                tierUnlocked ? TIER_COLORS[t.tier] : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-400 border-neutral-300 dark:border-charcoal-600'
              }`}>
                {t.tier}
              </span>
            );
          })}
        </div>
        {isUnlocked ? (
          <div className="space-y-1">
            <p className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" /> Unlocked
            </p>
            {achievement && (
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
            <div className="flex items-center justify-center gap-1 text-sm font-semibold text-gold-600 dark:text-gold-400">
              <Star className="w-3 h-3" /> +{highestTier?.xp} XP
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 flex items-center justify-center gap-1">
              <Lock className="w-4 h-4" /> Locked
            </p>
            <p className="text-xs text-charcoal-400">{def.tiers[0]?.xp} XP reward</p>
          </div>
        )}
      </div>
    </div>
  );
}