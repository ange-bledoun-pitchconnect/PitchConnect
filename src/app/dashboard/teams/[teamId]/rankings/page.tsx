// ============================================================================
// 🏆 PITCHCONNECT - Team Rankings Page (Enterprise v7.7.0)
// ============================================================================
// Path: app/dashboard/teams/[teamId]/rankings/page.tsx
// Full multi-sport support with enterprise dark mode design
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getSportConfig, 
  getPositionsForSport,
  getRankingCategories,
  formatSportName,
  getSportIcon,
  calculateAge,
  type RankingCategory 
} from '@/lib/sports/sport-config';
import { Sport, Position } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface PageProps {
  params: { teamId: string };
  searchParams: { season?: string; category?: string };
}

interface PlayerRankingData {
  id: string;
  rank: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  primaryPosition: Position | null;
  jerseyNumber: number | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  statValue: number;
  previousRank?: number;
  trend: 'up' | 'down' | 'same';
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTeamWithClub(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId, deletedAt: null },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          logo: true,
          slug: true,
        },
      },
    },
  });
}

async function getTeamPlayers(teamId: string) {
  return prisma.teamPlayer.findMany({
    where: { teamId, isActive: true },
    include: {
      player: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          aggregateStats: true,
          statistics: {
            orderBy: { season: 'desc' },
            take: 1,
          },
        },
      },
    },
  });
}

async function getAvailableSeasons(teamId: string): Promise<number[]> {
  const stats = await prisma.playerStatistic.findMany({
    where: {
      teamId,
    },
    select: {
      season: true,
    },
    distinct: ['season'],
    orderBy: { season: 'desc' },
  });
  
  if (stats.length === 0) {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1];
  }
  
  return stats.map(s => s.season);
}

// ============================================================================
// RANKING CALCULATION
// ============================================================================

function calculateRankings(
  players: Awaited<ReturnType<typeof getTeamPlayers>>,
  category: RankingCategory,
  sport: Sport
): PlayerRankingData[] {
  const rankedPlayers = players
    .map(tp => {
      const stats = tp.player.statistics[0];
      const aggregateStats = tp.player.aggregateStats;
      
      let statValue = 0;
      
      // Get stat value based on category
      switch (category.statKey) {
        case 'goals':
          statValue = stats?.goals ?? aggregateStats?.seasonGoals ?? 0;
          break;
        case 'assists':
          statValue = stats?.assists ?? aggregateStats?.seasonAssists ?? 0;
          break;
        case 'cleanSheets':
          statValue = stats?.cleanSheets ?? aggregateStats?.totalCleanSheets ?? 0;
          break;
        case 'appearances':
          statValue = stats?.matches ?? aggregateStats?.seasonMatches ?? 0;
          break;
        case 'minutesPlayed':
          statValue = stats?.minutesPlayed ?? 0;
          break;
        case 'cards':
          statValue = (stats?.yellowCards ?? 0) + (stats?.redCards ?? 0) * 3;
          break;
        // Sport-specific stats from JSON
        default:
          if (stats?.sportSpecificStats) {
            const sportStats = stats.sportSpecificStats as Record<string, number>;
            statValue = sportStats[category.statKey] ?? 0;
          }
          break;
      }
      
      return {
        id: tp.player.id,
        user: tp.player.user,
        primaryPosition: tp.player.primaryPosition,
        jerseyNumber: tp.player.jerseyNumber,
        dateOfBirth: tp.player.dateOfBirth,
        nationality: tp.player.nationality,
        statValue,
      };
    })
    .filter(p => category.isHigherBetter ? p.statValue > 0 : true)
    .sort((a, b) => {
      if (category.isHigherBetter) {
        return b.statValue - a.statValue;
      }
      return a.statValue - b.statValue;
    });

  return rankedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
    trend: 'same' as const, // Would need historical data for real trends
  }));
}

// ============================================================================
// COMPONENTS
// ============================================================================

function SportBadge({ sport }: { sport: Sport }) {
  const config = getSportConfig(sport);
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
      style={{ 
        backgroundColor: `${config.color}20`,
        color: config.color,
      }}
    >
      <span>{config.icon}</span>
      {config.name}
    </span>
  );
}

function RankingCategoryTabs({ 
  categories, 
  activeCategory,
  teamId,
  season,
}: { 
  categories: RankingCategory[];
  activeCategory: string;
  teamId: string;
  season: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isActive = cat.key === activeCategory;
        return (
          <Link
            key={cat.key}
            href={`/dashboard/teams/${teamId}/rankings?category=${cat.key}&season=${season}`}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 border
              ${isActive 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/25' 
                : 'bg-[#2a2a2a] text-gray-300 border-[#3a3a3a] hover:border-amber-500/50 hover:text-white'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SeasonSelector({ 
  seasons, 
  currentSeason,
  teamId,
  category,
}: { 
  seasons: number[];
  currentSeason: number;
  teamId: string;
  category: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm">Season:</span>
      <div className="flex gap-1">
        {seasons.slice(0, 5).map((season) => (
          <Link
            key={season}
            href={`/dashboard/teams/${teamId}/rankings?category=${category}&season=${season}`}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${season === currentSeason
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white border border-transparent hover:border-[#3a3a3a]'
              }
            `}
          >
            {season}/{(season + 1).toString().slice(-2)}
          </Link>
        ))}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <span className="text-white font-bold">🥇</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold">🥈</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold">🥉</span>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center">
      <span className="text-gray-300 font-semibold">{rank}</span>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'same' }) {
  if (trend === 'up') {
    return (
      <span className="text-green-400 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="text-red-400 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </span>
    );
  }
  return (
    <span className="text-gray-500 text-sm">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    </span>
  );
}

function PlayerRankingCard({ 
  player, 
  category,
  sport,
  positions,
}: { 
  player: PlayerRankingData;
  category: RankingCategory;
  sport: Sport;
  positions: ReturnType<typeof getPositionsForSport>;
}) {
  const positionInfo = positions.find(p => p.position === player.primaryPosition);
  const age = calculateAge(player.dateOfBirth);
  
  return (
    <div className={`
      group relative bg-[#2a2a2a] rounded-2xl border transition-all duration-300
      ${player.rank <= 3 
        ? 'border-amber-500/30 hover:border-amber-500/60' 
        : 'border-[#3a3a3a] hover:border-[#4a4a4a]'
      }
      hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5
    `}>
      {/* Top 3 Glow Effect */}
      {player.rank <= 3 && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 pointer-events-none" />
      )}
      
      <div className="relative p-4 flex items-center gap-4">
        {/* Rank */}
        <RankBadge rank={player.rank} />
        
        {/* Player Avatar */}
        <div className="relative">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#3a3a3a] ring-2 ring-[#4a4a4a] group-hover:ring-amber-500/30 transition-all">
            {player.user.avatar ? (
              <Image
                src={player.user.avatar}
                alt={`${player.user.firstName} ${player.user.lastName}`}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-semibold">
                {player.user.firstName[0]}{player.user.lastName[0]}
              </div>
            )}
          </div>
          {player.jerseyNumber && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] flex items-center justify-center">
              <span className="text-xs font-bold text-gray-300">{player.jerseyNumber}</span>
            </div>
          )}
        </div>
        
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <Link 
            href={`/dashboard/players/${player.id}`}
            className="font-semibold text-white hover:text-amber-400 transition-colors truncate block"
          >
            {player.user.firstName} {player.user.lastName}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            {positionInfo && (
              <span 
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ 
                  backgroundColor: `${positionInfo.color}20`,
                  color: positionInfo.color,
                }}
              >
                {positionInfo.shortName}
              </span>
            )}
            {age > 0 && (
              <span className="text-xs text-gray-500">{age} yrs</span>
            )}
            {player.nationality && (
              <span className="text-xs text-gray-500">{player.nationality}</span>
            )}
          </div>
        </div>
        
        {/* Stat Value */}
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {player.statValue}
            {category.unit && (
              <span className="text-sm text-gray-400 ml-1">{category.unit}</span>
            )}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <TrendIndicator trend={player.trend} />
            <span className="text-xs text-gray-500">{category.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ category, sport }: { category: RankingCategory; sport: Sport }) {
  const config = getSportConfig(sport);
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
        <span className="text-4xl">{category.icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No Rankings Yet</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        There are no {category.name.toLowerCase()} recorded for this {config.name.toLowerCase()} team yet. 
        Rankings will appear once match statistics are recorded.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-[#2a2a2a] rounded-2xl p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3a3a3a]" />
            <div className="w-14 h-14 rounded-xl bg-[#3a3a3a]" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-[#3a3a3a] rounded mb-2" />
              <div className="h-4 w-24 bg-[#3a3a3a] rounded" />
            </div>
            <div className="h-8 w-16 bg-[#3a3a3a] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function TeamRankingsPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const team = await getTeamWithClub(params.teamId);
  if (!team) {
    notFound();
  }

  const sport = team.club.sport;
  const sportConfig = getSportConfig(sport);
  const positions = getPositionsForSport(sport);
  const rankingCategories = getRankingCategories(sport);
  
  const seasons = await getAvailableSeasons(params.teamId);
  const currentSeason = searchParams.season ? parseInt(searchParams.season) : seasons[0] || new Date().getFullYear();
  const activeCategory = searchParams.category || rankingCategories[0]?.key || 'topScorers';
  
  const selectedCategory = rankingCategories.find(c => c.key === activeCategory) || rankingCategories[0];
  
  const teamPlayers = await getTeamPlayers(params.teamId);
  const rankings = calculateRankings(teamPlayers, selectedCategory, sport);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/dashboard/teams" className="text-gray-400 hover:text-white transition-colors">
              Teams
            </Link>
            <span className="text-gray-600">/</span>
            <Link 
              href={`/dashboard/teams/${team.id}`} 
              className="text-gray-400 hover:text-white transition-colors"
            >
              {team.name}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-amber-400">Rankings</span>
          </nav>

          {/* Title Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              {team.club.logo ? (
                <Image
                  src={team.club.logo}
                  alt={team.club.name}
                  width={64}
                  height={64}
                  className="rounded-xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-3xl">{sportConfig.icon}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {team.name} Rankings
                  </h1>
                  <SportBadge sport={sport} />
                </div>
                <p className="text-gray-400">
                  {team.club.name} • {teamPlayers.length} Players
                </p>
              </div>
            </div>
            
            <SeasonSelector 
              seasons={seasons}
              currentSeason={currentSeason}
              teamId={params.teamId}
              category={activeCategory}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="mb-8">
          <RankingCategoryTabs
            categories={rankingCategories}
            activeCategory={activeCategory}
            teamId={params.teamId}
            season={currentSeason.toString()}
          />
        </div>

        {/* Rankings List */}
        <div className="bg-[#1a1a1a] rounded-3xl border border-[#2a2a2a] overflow-hidden">
          <div className="p-6 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCategory.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
                <p className="text-sm text-gray-400">
                  {currentSeason}/{(currentSeason + 1).toString().slice(-2)} Season
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Suspense fallback={<LoadingSkeleton />}>
              {rankings.length > 0 ? (
                <div className="space-y-3">
                  {rankings.map((player) => (
                    <PlayerRankingCard
                      key={player.id}
                      player={player}
                      category={selectedCategory}
                      sport={sport}
                      positions={positions}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState category={selectedCategory} sport={sport} />
              )}
            </Suspense>
          </div>
        </div>

        {/* Quick Stats Summary */}
        {rankings.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="text-gray-400 text-sm mb-1">Total Players</div>
              <div className="text-2xl font-bold text-white">{rankings.length}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="text-gray-400 text-sm mb-1">Leader</div>
              <div className="text-lg font-semibold text-amber-400 truncate">
                {rankings[0]?.user.firstName} {rankings[0]?.user.lastName}
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="text-gray-400 text-sm mb-1">Top {selectedCategory.name}</div>
              <div className="text-2xl font-bold text-white">
                {rankings[0]?.statValue || 0}
                {selectedCategory.unit && <span className="text-sm text-gray-400 ml-1">{selectedCategory.unit}</span>}
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="text-gray-400 text-sm mb-1">Team Total</div>
              <div className="text-2xl font-bold text-white">
                {rankings.reduce((sum, p) => sum + p.statValue, 0)}
                {selectedCategory.unit && <span className="text-sm text-gray-400 ml-1">{selectedCategory.unit}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: PageProps) {
  const team = await getTeamWithClub(params.teamId);
  if (!team) return { title: 'Team Not Found' };
  
  return {
    title: `${team.name} Rankings | ${team.club.name} | PitchConnect`,
    description: `View player rankings and statistics for ${team.name}`,
  };
}