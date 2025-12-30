'use client';

// ============================================================================
// 🏆 PITCHCONNECT PLAYER PROFILE v7.5.0
// ============================================================================
// Comprehensive player profile with stats, bio, and edit functionality
// ============================================================================

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Ruler,
  Weight,
  Shield,
  Star,
  Edit,
  Camera,
  Save,
  X,
  ChevronRight,
  Award,
  Activity,
  TrendingUp,
  Target,
  Zap,
  Heart,
  Clock,
  Flag,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sport,
  SPORT_CONFIGS,
  formatPosition,
  getPlayerPermissions,
  PREFERRED_FOOT_OPTIONS,
} from '@/lib/sport-config';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerProfile {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    dateOfBirth?: string;
    nationality?: string;
    language?: string;
    timezone?: string;
  };
  height?: number;
  weight?: number;
  nationality?: string;
  secondNationality?: string;
  jerseyNumber?: number;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  primaryPosition?: string;
  secondaryPosition?: string;
  tertiaryPosition?: string;
  isActive: boolean;
  isVerified: boolean;
  hasCompletedProfile: boolean;
  isAcademy: boolean;
  isYouth: boolean;
  youthCategory?: string;
  overallRating?: number;
  formRating?: number;
  availabilityStatus: string;
  marketValue?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  teamPlayers: {
    team: {
      id: string;
      name: string;
      club: {
        id: string;
        name: string;
        sport: Sport;
        logo?: string;
      };
    };
    jerseyNumber?: number;
    position?: string;
    isActive: boolean;
    isCaptain: boolean;
    isViceCaptain: boolean;
    joinedAt: string;
  }[];
  aggregateStats?: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalMinutes: number;
    avgRating: number;
  };
  analytics?: {
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
    mental?: number;
    strengths: string[];
    weaknesses: string[];
  };
  achievements: {
    id: string;
    type: string;
    title: string;
    tier?: string;
    unlockedAt: string;
  }[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PLAYER: PlayerProfile = {
  id: 'player-1',
  userId: 'user-1',
  user: {
    id: 'user-1',
    firstName: 'Marcus',
    lastName: 'Rashford',
    email: 'marcus.rashford@example.com',
    phone: '+44 7123 456789',
    bio: 'Professional footballer with a passion for making a difference on and off the pitch. Academy graduate, proud to represent my hometown club.',
    dateOfBirth: '1997-10-31',
    nationality: 'British',
    language: 'English',
    timezone: 'Europe/London',
  },
  height: 180,
  weight: 70,
  nationality: 'English',
  secondNationality: undefined,
  jerseyNumber: 10,
  preferredFoot: 'RIGHT',
  primaryPosition: 'LEFT_WINGER',
  secondaryPosition: 'STRIKER',
  tertiaryPosition: 'RIGHT_WINGER',
  isActive: true,
  isVerified: true,
  hasCompletedProfile: true,
  isAcademy: false,
  isYouth: false,
  overallRating: 85,
  formRating: 82,
  availabilityStatus: 'AVAILABLE',
  marketValue: 55000000,
  currency: 'GBP',
  createdAt: '2020-01-15T00:00:00Z',
  updatedAt: '2024-12-15T00:00:00Z',
  teamPlayers: [
    {
      team: {
        id: 't1',
        name: 'First Team',
        club: { id: 'c1', name: 'Manchester United FC', sport: 'FOOTBALL', logo: '/clubs/mufc.png' },
      },
      jerseyNumber: 10,
      position: 'LEFT_WINGER',
      isActive: true,
      isCaptain: false,
      isViceCaptain: true,
      joinedAt: '2020-01-15T00:00:00Z',
    },
  ],
  aggregateStats: {
    totalMatches: 287,
    totalGoals: 89,
    totalAssists: 52,
    totalMinutes: 19450,
    avgRating: 7.2,
  },
  analytics: {
    pace: 92,
    shooting: 83,
    passing: 77,
    dribbling: 85,
    defending: 42,
    physical: 74,
    mental: 78,
    strengths: ['Pace', 'Finishing', 'Dribbling', 'Off the Ball Movement'],
    weaknesses: ['Defensive Contribution', 'Aerial Duels'],
  },
  achievements: [
    { id: 'a1', type: 'MATCHES', title: '100 Club Appearances', tier: 'GOLD', unlockedAt: '2023-04-15T00:00:00Z' },
    { id: 'a2', type: 'GOALS', title: '50 Career Goals', tier: 'GOLD', unlockedAt: '2023-08-20T00:00:00Z' },
    { id: 'a3', type: 'ASSISTS', title: 'Playmaker (25 Assists)', tier: 'SILVER', unlockedAt: '2023-02-10T00:00:00Z' },
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlayerProfilePage() {
  const { data: session } = useSession();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user permissions
  const userRole = (session?.user?.roles?.[0] || 'PLAYER') as any;
  const permissions = getPlayerPermissions(userRole);
  const isOwnProfile = session?.user?.id === player?.userId;
  const canEdit = isOwnProfile || permissions.canEdit;

  // Fetch player profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPlayer(MOCK_PLAYER);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Calculate age
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get player's primary sport
  const sport = player?.teamPlayers[0]?.team.club.sport || 'FOOTBALL';
  const sportConfig = SPORT_CONFIGS[sport];

  // Format market value
  const formatMarketValue = (value?: number, currency = 'GBP') => {
    if (!value) return 'Not set';
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    if (value >= 1000000) {
      return `${formatter.format(value / 1000000)}M`;
    }
    if (value >= 1000) {
      return `${formatter.format(value / 1000)}K`;
    }
    return formatter.format(value);
  };

  // Render attribute bar
  const renderAttributeBar = (label: string, value: number) => {
    const getColor = (v: number) => {
      if (v >= 85) return 'bg-green-500';
      if (v >= 70) return 'bg-blue-500';
      if (v >= 55) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">{label}</span>
          <span className="font-bold text-white">{value}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getColor(value))}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !player) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Player not found'}</p>
          <Link href="/dashboard/player" className="px-4 py-2 bg-zinc-800 text-white rounded-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const age = calculateAge(player.user.dateOfBirth);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
        {player.user.banner && (
          <Image src={player.user.banner} alt="" fill className="object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

        {/* Edit banner button */}
        {canEdit && (
          <button className="absolute top-4 right-4 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <Camera className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Profile header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl bg-zinc-800 border-4 border-zinc-950 overflow-hidden shadow-2xl">
              {player.user.avatar ? (
                <Image
                  src={player.user.avatar}
                  alt={`${player.user.firstName} ${player.user.lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-zinc-500">
                    {player.user.firstName[0]}
                    {player.user.lastName[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Jersey number badge */}
            {player.jerseyNumber && (
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">{player.jerseyNumber}</span>
              </div>
            )}

            {/* Edit avatar button */}
            {canEdit && (
              <button className="absolute bottom-0 left-0 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                {/* Name & badges */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {player.user.firstName} {player.user.lastName}
                  </h1>
                  {player.isVerified && (
                    <Shield className="h-6 w-6 text-blue-400" title="Verified Player" />
                  )}
                  {player.teamPlayers.some((tp) => tp.isCaptain) && (
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-sm font-bold rounded">
                      CAPTAIN
                    </span>
                  )}
                  {player.teamPlayers.some((tp) => tp.isViceCaptain) && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-sm font-bold rounded">
                      VICE-CAPTAIN
                    </span>
                  )}
                </div>

                {/* Position & Team */}
                <div className="flex items-center gap-4 text-zinc-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {formatPosition(player.primaryPosition || '', sport)}
                  </span>
                  {player.teamPlayers[0] && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-2">
                        {player.teamPlayers[0].team.club.logo && (
                          <Image
                            src={player.teamPlayers[0].team.club.logo}
                            alt=""
                            width={20}
                            height={20}
                            className="rounded"
                          />
                        )}
                        {player.teamPlayers[0].team.club.name}
                      </span>
                    </>
                  )}
                </div>

                {/* Sport badge */}
                <div
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    sportConfig.bgColor,
                    sportConfig.textColor
                  )}
                >
                  <sportConfig.icon className="h-4 w-4" />
                  {sportConfig.name}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </button>
                )}
                <Link
                  href="/dashboard/player/stats"
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium transition-all hover:shadow-lg flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  View Stats
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {player.aggregateStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{player.aggregateStats.totalMatches}</p>
              <p className="text-sm text-zinc-400">Matches</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{player.aggregateStats.totalGoals}</p>
              <p className="text-sm text-zinc-400">{sportConfig.primaryStat}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{player.aggregateStats.totalAssists}</p>
              <p className="text-sm text-zinc-400">{sportConfig.secondaryStat}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{player.aggregateStats.avgRating.toFixed(1)}</p>
              <p className="text-sm text-zinc-400">Avg Rating</p>
            </div>
          </div>
        )}

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 pb-12">
          {/* Left column - Bio & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {player.user.bio && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-zinc-400" />
                  About
                </h2>
                <p className="text-zinc-300 leading-relaxed">{player.user.bio}</p>
              </div>
            )}

            {/* Personal Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-400" />
                Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {age && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Age</p>
                      <p className="text-white font-medium">{age} years old</p>
                    </div>
                  </div>
                )}
                {player.nationality && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <Globe className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Nationality</p>
                      <p className="text-white font-medium">
                        {player.nationality}
                        {player.secondNationality && ` / ${player.secondNationality}`}
                      </p>
                    </div>
                  </div>
                )}
                {player.height && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <Ruler className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Height</p>
                      <p className="text-white font-medium">{player.height} cm</p>
                    </div>
                  </div>
                )}
                {player.weight && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <Weight className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Weight</p>
                      <p className="text-white font-medium">{player.weight} kg</p>
                    </div>
                  </div>
                )}
                {player.preferredFoot && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <Zap className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Preferred Foot</p>
                      <p className="text-white font-medium">
                        {PREFERRED_FOOT_OPTIONS.find((f) => f.value === player.preferredFoot)?.label}
                      </p>
                    </div>
                  </div>
                )}
                {player.marketValue && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Market Value</p>
                      <p className="text-white font-medium">
                        {formatMarketValue(player.marketValue, player.currency)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Positions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-zinc-400" />
                Positions
              </h2>
              <div className="flex flex-wrap gap-2">
                {player.primaryPosition && (
                  <span className="px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                    {formatPosition(player.primaryPosition, sport)}
                    <span className="ml-2 text-green-500/50 text-xs">Primary</span>
                  </span>
                )}
                {player.secondaryPosition && (
                  <span className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                    {formatPosition(player.secondaryPosition, sport)}
                    <span className="ml-2 text-blue-500/50 text-xs">Secondary</span>
                  </span>
                )}
                {player.tertiaryPosition && (
                  <span className="px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">
                    {formatPosition(player.tertiaryPosition, sport)}
                    <span className="ml-2 text-zinc-500 text-xs">Tertiary</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Attributes & Achievements */}
          <div className="space-y-6">
            {/* Rating Card */}
            <div className={cn('bg-gradient-to-br rounded-xl p-6 text-white', sportConfig.gradientFrom, sportConfig.gradientTo)}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm opacity-80">Overall Rating</span>
                <Star className="h-5 w-5 opacity-80" />
              </div>
              <div className="text-5xl font-bold mb-2">{player.overallRating || '—'}</div>
              <div className="flex items-center gap-2 text-sm opacity-80">
                <Activity className="h-4 w-4" />
                Form: {player.formRating || '—'}
              </div>
            </div>

            {/* Attributes */}
            {player.analytics && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-zinc-400" />
                  Attributes
                </h2>
                <div className="space-y-4">
                  {player.analytics.pace && renderAttributeBar('Pace', player.analytics.pace)}
                  {player.analytics.shooting && renderAttributeBar('Shooting', player.analytics.shooting)}
                  {player.analytics.passing && renderAttributeBar('Passing', player.analytics.passing)}
                  {player.analytics.dribbling && renderAttributeBar('Dribbling', player.analytics.dribbling)}
                  {player.analytics.defending && renderAttributeBar('Defending', player.analytics.defending)}
                  {player.analytics.physical && renderAttributeBar('Physical', player.analytics.physical)}
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            {player.analytics && (player.analytics.strengths.length > 0 || player.analytics.weaknesses.length > 0) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-zinc-400" />
                  Traits
                </h2>
                {player.analytics.strengths.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-zinc-400 mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {player.analytics.strengths.map((strength) => (
                        <span
                          key={strength}
                          className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-sm"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {player.analytics.weaknesses.length > 0 && (
                  <div>
                    <p className="text-sm text-zinc-400 mb-2">Areas to Improve</p>
                    <div className="flex flex-wrap gap-2">
                      {player.analytics.weaknesses.map((weakness) => (
                        <span
                          key={weakness}
                          className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-sm"
                        >
                          {weakness}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Achievements */}
            {player.achievements.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-zinc-400" />
                    Achievements
                  </h2>
                  <Link
                    href="/dashboard/player/achievements"
                    className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {player.achievements.slice(0, 3).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{achievement.title}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {achievement.tier && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-bold',
                            achievement.tier === 'GOLD'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : achievement.tier === 'SILVER'
                              ? 'bg-zinc-400/10 text-zinc-300'
                              : 'bg-amber-700/10 text-amber-600'
                          )}
                        >
                          {achievement.tier}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
