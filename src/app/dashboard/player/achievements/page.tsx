/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Achievements v7.5.0 (Enterprise Multi-Sport)
 * Path: src/app/dashboard/player/achievements/page.tsx
 * ============================================================================
 *
 * FEATURES:
 * ✅ Multi-sport achievements (12 sports)
 * ✅ XP/Level progression system
 * ✅ Tiered achievements (Bronze → Diamond)
 * ✅ Sport-specific achievements
 * ✅ Universal achievements
 * ✅ Database-driven achievement tracking
 * ✅ Dark mode support
 *
 * AFFECTED USER TYPES:
 * - PLAYER: Full access to own achievements
 * - PARENT: Read-only access to children's achievements
 * - SCOUT: Read access for talent evaluation
 *
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Trophy,
  Star,
  Zap,
  TrendingUp,
  Award,
  Lock,
  CheckCircle,
  ArrowLeft,
  Target,
  Shield,
  Users,
  Clock,
  Flame,
  Crown,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string | null;
  icon: string | null;
  progress: number;
  tier: AchievementTier | null;
  unlockedAt: Date;
}

interface AchievementDefinition {
  type: string;
  title: string;
  description: string;
  icon: string;
  sports: Sport[] | 'ALL';
  tiers: Array<{
    tier: AchievementTier;
    requirement: number;
    xp: number;
    label: string;
  }>;
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS (Multi-Sport)
// ============================================================================

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ========== UNIVERSAL ACHIEVEMENTS ==========
  {
    type: 'FIRST_SCORE',
    title: 'First Blood',
    description: 'Score your first point/goal/try',
    icon: '🎯',
    sports: 'ALL',
    tiers: [{ tier: 'BRONZE', requirement: 1, xp: 10, label: 'First Score' }],
  },
  {
    type: 'IRON_PLAYER',
    title: 'Iron Player',
    description: 'Play matches consistently without missing',
    icon: '💪',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 25, xp: 30, label: '25 matches' },
      { tier: 'SILVER', requirement: 50, xp: 75, label: '50 matches' },
      { tier: 'GOLD', requirement: 100, xp: 150, label: '100 matches' },
      { tier: 'PLATINUM', requirement: 250, xp: 300, label: '250 matches' },
      { tier: 'DIAMOND', requirement: 500, xp: 500, label: '500 matches' },
    ],
  },
  {
    type: 'TEAM_PLAYER',
    title: 'Team Player',
    description: 'Be part of multiple teams',
    icon: '🤝',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 2, xp: 15, label: '2 teams' },
      { tier: 'SILVER', requirement: 5, xp: 50, label: '5 teams' },
      { tier: 'GOLD', requirement: 10, xp: 100, label: '10 teams' },
    ],
  },
  {
    type: 'PLAYMAKER',
    title: 'Playmaker',
    description: 'Record assists in matches',
    icon: '🎯',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 25, label: '5 assists' },
      { tier: 'SILVER', requirement: 25, xp: 75, label: '25 assists' },
      { tier: 'GOLD', requirement: 100, xp: 200, label: '100 assists' },
      { tier: 'PLATINUM', requirement: 250, xp: 400, label: '250 assists' },
    ],
  },
  {
    type: 'CAPTAIN_LEADER',
    title: 'Captain Leader',
    description: 'Lead your team as captain',
    icon: '👑',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 50, label: 'First captaincy' },
      { tier: 'SILVER', requirement: 10, xp: 100, label: '10 matches as captain' },
      { tier: 'GOLD', requirement: 50, xp: 250, label: '50 matches as captain' },
    ],
  },
  {
    type: 'TRAINING_DEDICATION',
    title: 'Training Dedication',
    description: 'Attend training sessions',
    icon: '🏋️',
    sports: 'ALL',
    tiers: [
      { tier: 'BRONZE', requirement: 10, xp: 20, label: '10 sessions' },
      { tier: 'SILVER', requirement: 50, xp: 75, label: '50 sessions' },
      { tier: 'GOLD', requirement: 200, xp: 200, label: '200 sessions' },
    ],
  },

  // ========== FOOTBALL / FUTSAL / BEACH FOOTBALL ==========
  {
    type: 'HAT_TRICK',
    title: 'Hat Trick Hero',
    description: 'Score 3 goals in a single match',
    icon: '🎩',
    sports: ['FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL', 'HOCKEY', 'NETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 50, label: '1 hat trick' },
      { tier: 'SILVER', requirement: 3, xp: 100, label: '3 hat tricks' },
      { tier: 'GOLD', requirement: 10, xp: 250, label: '10 hat tricks' },
      { tier: 'PLATINUM', requirement: 25, xp: 400, label: '25 hat tricks' },
    ],
  },
  {
    type: 'CLEAN_SHEET',
    title: 'Clean Sheet',
    description: 'Keep the opposition scoreless',
    icon: '🛡️',
    sports: ['FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL', 'HOCKEY', 'NETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 20, label: '5 clean sheets' },
      { tier: 'SILVER', requirement: 25, xp: 60, label: '25 clean sheets' },
      { tier: 'GOLD', requirement: 100, xp: 150, label: '100 clean sheets' },
    ],
  },
  {
    type: 'GOLDEN_BOOT',
    title: 'Golden Boot',
    description: 'Be top scorer in a season',
    icon: '👟',
    sports: ['FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 10, xp: 40, label: '10 goals' },
      { tier: 'SILVER', requirement: 25, xp: 100, label: '25 goals' },
      { tier: 'GOLD', requirement: 50, xp: 250, label: '50 goals' },
      { tier: 'PLATINUM', requirement: 100, xp: 500, label: '100 goals' },
    ],
  },

  // ========== RUGBY ==========
  {
    type: 'TRY_SCORER',
    title: 'Try Scorer',
    description: 'Score tries in matches',
    icon: '🏉',
    sports: ['RUGBY'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 25, label: '5 tries' },
      { tier: 'SILVER', requirement: 20, xp: 75, label: '20 tries' },
      { tier: 'GOLD', requirement: 50, xp: 200, label: '50 tries' },
      { tier: 'PLATINUM', requirement: 100, xp: 400, label: '100 tries' },
    ],
  },
  {
    type: 'TACKLER',
    title: 'Dominant Tackler',
    description: 'Make successful tackles',
    icon: '💥',
    sports: ['RUGBY', 'AMERICAN_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 50, xp: 30, label: '50 tackles' },
      { tier: 'SILVER', requirement: 150, xp: 80, label: '150 tackles' },
      { tier: 'GOLD', requirement: 400, xp: 200, label: '400 tackles' },
    ],
  },
  {
    type: 'LINEOUT_KING',
    title: 'Lineout King',
    description: 'Win lineouts consistently',
    icon: '📏',
    sports: ['RUGBY'],
    tiers: [
      { tier: 'BRONZE', requirement: 25, xp: 25, label: '25 lineout wins' },
      { tier: 'SILVER', requirement: 100, xp: 75, label: '100 lineout wins' },
      { tier: 'GOLD', requirement: 300, xp: 175, label: '300 lineout wins' },
    ],
  },

  // ========== CRICKET ==========
  {
    type: 'CENTURY',
    title: 'Century Maker',
    description: 'Score 100 runs in an innings',
    icon: '💯',
    sports: ['CRICKET'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 75, label: '1 century' },
      { tier: 'SILVER', requirement: 5, xp: 150, label: '5 centuries' },
      { tier: 'GOLD', requirement: 20, xp: 400, label: '20 centuries' },
      { tier: 'PLATINUM', requirement: 50, xp: 750, label: '50 centuries' },
    ],
  },
  {
    type: 'FIVE_WICKETS',
    title: '5-Wicket Haul',
    description: 'Take 5 wickets in an innings',
    icon: '🎳',
    sports: ['CRICKET'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 75, label: '1 five-fer' },
      { tier: 'SILVER', requirement: 5, xp: 150, label: '5 five-fers' },
      { tier: 'GOLD', requirement: 15, xp: 350, label: '15 five-fers' },
    ],
  },
  {
    type: 'DOUBLE_CENTURY',
    title: 'Double Century',
    description: 'Score 200 runs in an innings',
    icon: '🏏',
    sports: ['CRICKET'],
    tiers: [
      { tier: 'GOLD', requirement: 1, xp: 200, label: '1 double century' },
      { tier: 'PLATINUM', requirement: 5, xp: 500, label: '5 double centuries' },
    ],
  },
  {
    type: 'ALL_ROUNDER',
    title: 'All-Rounder',
    description: 'Score 50+ runs and take 3+ wickets in same match',
    icon: '⚡',
    sports: ['CRICKET'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 100, label: '1 all-round performance' },
      { tier: 'SILVER', requirement: 5, xp: 200, label: '5 all-round performances' },
      { tier: 'GOLD', requirement: 15, xp: 400, label: '15 all-round performances' },
    ],
  },

  // ========== AMERICAN FOOTBALL ==========
  {
    type: 'TOUCHDOWN_KING',
    title: 'Touchdown King',
    description: 'Score touchdowns',
    icon: '🏈',
    sports: ['AMERICAN_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 30, label: '5 TDs' },
      { tier: 'SILVER', requirement: 20, xp: 80, label: '20 TDs' },
      { tier: 'GOLD', requirement: 50, xp: 200, label: '50 TDs' },
      { tier: 'PLATINUM', requirement: 100, xp: 400, label: '100 TDs' },
    ],
  },
  {
    type: 'SACK_MASTER',
    title: 'Sack Master',
    description: 'Record quarterback sacks',
    icon: '💨',
    sports: ['AMERICAN_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 5, xp: 30, label: '5 sacks' },
      { tier: 'SILVER', requirement: 15, xp: 80, label: '15 sacks' },
      { tier: 'GOLD', requirement: 40, xp: 200, label: '40 sacks' },
    ],
  },
  {
    type: 'PASSING_YARDS',
    title: 'Air Attack',
    description: 'Accumulate passing yards',
    icon: '🎯',
    sports: ['AMERICAN_FOOTBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 1000, xp: 50, label: '1,000 yards' },
      { tier: 'SILVER', requirement: 5000, xp: 150, label: '5,000 yards' },
      { tier: 'GOLD', requirement: 15000, xp: 400, label: '15,000 yards' },
    ],
  },

  // ========== BASKETBALL ==========
  {
    type: 'TRIPLE_DOUBLE',
    title: 'Triple-Double',
    description: 'Record 10+ in 3 stat categories',
    icon: '🏀',
    sports: ['BASKETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 1, xp: 100, label: '1 triple-double' },
      { tier: 'SILVER', requirement: 5, xp: 250, label: '5 triple-doubles' },
      { tier: 'GOLD', requirement: 15, xp: 500, label: '15 triple-doubles' },
      { tier: 'PLATINUM', requirement: 50, xp: 1000, label: '50 triple-doubles' },
    ],
  },
  {
    type: 'DUNK_MASTER',
    title: 'Dunk Master',
    description: 'Score dunks in games',
    icon: '🔥',
    sports: ['BASKETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 10, xp: 30, label: '10 dunks' },
      { tier: 'SILVER', requirement: 50, xp: 80, label: '50 dunks' },
      { tier: 'GOLD', requirement: 200, xp: 200, label: '200 dunks' },
    ],
  },
  {
    type: 'THREE_POINT_SHOOTER',
    title: '3-Point Shooter',
    description: 'Make 3-point shots',
    icon: '🎯',
    sports: ['BASKETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 25, xp: 30, label: '25 threes' },
      { tier: 'SILVER', requirement: 100, xp: 80, label: '100 threes' },
      { tier: 'GOLD', requirement: 300, xp: 200, label: '300 threes' },
      { tier: 'PLATINUM', requirement: 750, xp: 400, label: '750 threes' },
    ],
  },

  // ========== HOCKEY ==========
  {
    type: 'SHUTOUT',
    title: 'Shutout',
    description: 'Goalie shutout performances',
    icon: '🧤',
    sports: ['HOCKEY'],
    tiers: [
      { tier: 'BRONZE', requirement: 3, xp: 30, label: '3 shutouts' },
      { tier: 'SILVER', requirement: 15, xp: 90, label: '15 shutouts' },
      { tier: 'GOLD', requirement: 40, xp: 225, label: '40 shutouts' },
    ],
  },

  // ========== NETBALL ==========
  {
    type: 'SHOOTING_STAR',
    title: 'Shooting Star',
    description: 'High shooting accuracy',
    icon: '⭐',
    sports: ['NETBALL'],
    tiers: [
      { tier: 'BRONZE', requirement: 10, xp: 30, label: '10 perfect games' },
      { tier: 'SILVER', requirement: 30, xp: 80, label: '30 perfect games' },
      { tier: 'GOLD', requirement: 75, xp: 180, label: '75 perfect games' },
    ],
  },

  // ========== GAELIC / AUSTRALIAN RULES ==========
  {
    type: 'POINTS_MACHINE',
    title: 'Points Machine',
    description: 'Score points consistently',
    icon: '🎯',
    sports: ['GAELIC_FOOTBALL', 'AUSTRALIAN_RULES'],
    tiers: [
      { tier: 'BRONZE', requirement: 50, xp: 30, label: '50 points' },
      { tier: 'SILVER', requirement: 200, xp: 90, label: '200 points' },
      { tier: 'GOLD', requirement: 500, xp: 225, label: '500 points' },
    ],
  },

  // ========== LACROSSE ==========
  {
    type: 'FACE_OFF_KING',
    title: 'Face-Off King',
    description: 'Win face-offs',
    icon: '🥍',
    sports: ['LACROSSE'],
    tiers: [
      { tier: 'BRONZE', requirement: 25, xp: 25, label: '25 wins' },
      { tier: 'SILVER', requirement: 100, xp: 75, label: '100 wins' },
      { tier: 'GOLD', requirement: 300, xp: 175, label: '300 wins' },
    ],
  },
];

const TIER_CONFIG: Record<AchievementTier, { color: string; bgColor: string; borderColor: string; label: string }> = {
  BRONZE: {
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300 dark:border-amber-700',
    label: 'Bronze',
  },
  SILVER: {
    color: 'text-charcoal-500 dark:text-charcoal-300',
    bgColor: 'bg-charcoal-200 dark:bg-charcoal-700/50',
    borderColor: 'border-charcoal-400 dark:border-charcoal-600',
    label: 'Silver',
  },
  GOLD: {
    color: 'text-gold-700 dark:text-gold-400',
    bgColor: 'bg-gold-100 dark:bg-gold-900/30',
    borderColor: 'border-gold-400 dark:border-gold-600',
    label: 'Gold',
  },
  PLATINUM: {
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-400 dark:border-cyan-600',
    label: 'Platinum',
  },
  DIAMOND: {
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-400 dark:border-purple-600',
    label: 'Diamond',
  },
};

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getAchievementsData(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      achievements: {
        orderBy: { unlockedAt: 'desc' },
      },
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              club: { select: { sport: true } },
            },
          },
        },
      },
    },
  });

  if (!player) {
    return { achievements: [], sports: [] as Sport[], totalXP: 0, level: 1, xpProgress: 0, xpToNextLevel: 100 };
  }

  // Get unique sports the player is involved in
  const sports = [...new Set(
    player.teamPlayers.map((tp) => tp.team.club.sport as Sport)
  )];

  // Calculate total XP from achievements
  let totalXP = 0;
  player.achievements.forEach((a) => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.type === a.type);
    if (def && a.tier) {
      const tierDef = def.tiers.find((t) => t.tier === a.tier);
      if (tierDef) totalXP += tierDef.xp;
    }
  });

  // Level calculation: 100 XP per level, with increasing thresholds
  const level = Math.floor(totalXP / 100) + 1;
  const xpProgress = totalXP % 100;
  const xpToNextLevel = 100 - xpProgress;

  return {
    achievements: player.achievements as Achievement[],
    sports,
    totalXP,
    level,
    xpProgress,
    xpToNextLevel,
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function AchievementsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="h-12 bg-charcoal-200 dark:bg-charcoal-700 rounded-lg w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  progress,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subValue?: string;
  color: string;
  progress?: { current: number; max: number };
}) {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400">{label}</span>
      </div>
      <p className="text-4xl font-bold text-charcoal-900 dark:text-white">
        {value}
        {subValue && <span className="text-lg text-charcoal-400">/{subValue}</span>}
      </p>
      {progress && (
        <div className="mt-3">
          <div className="w-full bg-charcoal-200 dark:bg-charcoal-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-gold-500 to-orange-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AchievementCard({
  def,
  achievementMap,
}: {
  def: AchievementDefinition;
  achievementMap: Map<string, Achievement>;
}) {
  const unlockedTiers = def.tiers.filter((t) => achievementMap.has(`${def.type}-${t.tier}`));
  const highestTier = unlockedTiers.length > 0 ? unlockedTiers[unlockedTiers.length - 1] : null;
  const isUnlocked = highestTier !== null;
  const achievement = highestTier ? achievementMap.get(`${def.type}-${highestTier.tier}`) : null;

  const tierConfig = highestTier ? TIER_CONFIG[highestTier.tier] : null;

  return (
    <div
      className={`bg-white dark:bg-charcoal-800 rounded-xl border p-6 transition-all hover:shadow-lg ${
        isUnlocked
          ? `${tierConfig?.borderColor} border-2 shadow-md`
          : 'border-charcoal-200 dark:border-charcoal-700 opacity-60'
      }`}
    >
      <div className="text-center space-y-3">
        {/* Icon */}
        <div className={`text-5xl ${!isUnlocked && 'grayscale opacity-50'}`}>{def.icon}</div>

        {/* Title & Description */}
        <div>
          <h3 className="font-bold text-lg text-charcoal-900 dark:text-white">{def.title}</h3>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{def.description}</p>
        </div>

        {/* Tier Progress */}
        <div className="flex justify-center gap-1 flex-wrap">
          {def.tiers.map((t) => {
            const tierUnlocked = achievementMap.has(`${def.type}-${t.tier}`);
            const config = TIER_CONFIG[t.tier];
            return (
              <span
                key={t.tier}
                className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  tierUnlocked
                    ? `${config.bgColor} ${config.color} ${config.borderColor}`
                    : 'bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-400 border-charcoal-300 dark:border-charcoal-600'
                }`}
                title={t.label}
              >
                {config.label}
              </span>
            );
          })}
        </div>

        {/* Status */}
        {isUnlocked ? (
          <div className="space-y-1">
            <p className="text-sm text-success-600 dark:text-success-400 font-semibold flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" /> Unlocked
            </p>
            {achievement && (
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                {new Date(achievement.unlockedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
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

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerAchievementsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { achievements, sports, totalXP, level, xpProgress, xpToNextLevel } = await getAchievementsData(
    session.user.id
  );

  // Create map for quick lookup
  const achievementMap = new Map<string, Achievement>();
  achievements.forEach((a) => achievementMap.set(`${a.type}-${a.tier}`, a));

  // Filter achievements relevant to player's sports
  const relevantAchievements = ACHIEVEMENT_DEFINITIONS.filter((def) => {
    if (def.sports === 'ALL') return true;
    if (sports.length === 0) return def.sports === 'ALL'; // Show universal if no sports
    return sports.some((s) => def.sports.includes(s));
  });

  const unlockedCount = achievements.length;
  const totalPossible = relevantAchievements.reduce((acc, def) => acc + def.tiers.length, 0);

  // Group achievements
  const universalAchievements = relevantAchievements.filter((d) => d.sports === 'ALL');
  const sportSpecificAchievements = relevantAchievements.filter((d) => d.sports !== 'ALL');

  return (
    <Suspense fallback={<AchievementsSkeleton />}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard/player"
            className="p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">
              Achievements
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              Unlock badges and earn XP across all your sports
            </p>
          </div>
        </div>

        {/* Your Sports */}
        {sports.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400">
              Your Sports:
            </span>
            {sports.map((sport) => {
              const config = SPORT_CONFIGS[sport];
              return (
                <span
                  key={sport}
                  className="px-3 py-1 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 rounded-full text-sm font-medium flex items-center gap-1"
                >
                  <span>{config.icon}</span> {config.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Trophy}
            label="Achievements"
            value={unlockedCount}
            subValue={totalPossible.toString()}
            color="bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400"
            progress={{ current: unlockedCount, max: totalPossible }}
          />

          <StatCard
            icon={Star}
            label="Total XP"
            value={totalXP.toLocaleString()}
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          />

          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-info-100 dark:bg-info/20 text-info-600 dark:text-info-400 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400">Level</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-charcoal-900 dark:text-white">{level}</p>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-charcoal-500 dark:text-charcoal-400 mb-1">
                  <span>{xpProgress} XP</span>
                  <span>{xpToNextLevel} XP to next level</span>
                </div>
                <div className="w-full bg-charcoal-200 dark:bg-charcoal-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-info-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Universal Achievements */}
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

        {/* Sport-Specific Achievements */}
        {sports.map((sport) => {
          const config = SPORT_CONFIGS[sport];
          const sportAchievements = sportSpecificAchievements.filter(
            (d) => Array.isArray(d.sports) && d.sports.includes(sport)
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

        {/* Empty State if no sports */}
        {sports.length === 0 && (
          <div className="bg-charcoal-50 dark:bg-charcoal-800/50 border border-dashed border-charcoal-300 dark:border-charcoal-700 rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
              Join a team to unlock sport-specific achievements
            </h3>
            <p className="text-charcoal-600 dark:text-charcoal-400 mb-4">
              Browse and join teams to start earning achievements in your favourite sports
            </p>
            <Link
              href="/dashboard/player/browse-teams"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" /> Browse Teams
            </Link>
          </div>
        )}
      </div>
    </Suspense>
  );
}
