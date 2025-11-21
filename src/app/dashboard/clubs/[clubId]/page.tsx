'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Shield,
  Users,
  Trophy,
  Plus,
  Settings,
  MapPin,
  Calendar,
  TrendingUp,
  Activity,
  Edit,
  Loader2,
  ChevronLeft,
  UserPlus,
  Briefcase,
  Target,
  Clock,
  Award,
} from 'lucide-react';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================

interface Club {
  id: string;
  name: string;
  city: string;
  country: string;
  foundedYear: number | null;
  description: string | null;
  stadiumName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  status: string;
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  teams: Array<{
    id: string;
    name: string;
    ageGroup: string;
    category: string;
    status: string;
    _count: {
      members: number;
    };
  }>;
  members: Array<{
    id: string;
    role: string;
    status: string;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
  stats: {
    totalTeams: number;
    totalMembers: number;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClubDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const clubId = params?.clubId as string;

  const [club, setClub] = useState<Club | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch club data
  const fetchClubData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/clubs/${clubId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch club data');
      }

      const data = await response.json();
      setClub(data.club);
      setUserRole(data.userRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching club:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) {
      fetchClubData();
    }
  }, [clubId, fetchClubData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/20 to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-charcoal-700 font-bold text-lg">Loading club...</p>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Club Not Found</h1>
          <p className="text-charcoal-600 mb-6">{error || 'This club does not exist'}</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-gold-500 hover:bg-gold-600">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = userRole === 'OWNER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Club Header */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: `linear-gradient(135deg, ${club.primaryColor} 0%, ${club.secondaryColor} 100%)`,
            }}
          />

          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Club Logo */}
              <div
                className="w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border-4 border-white"
                style={{
                  background: `linear-gradient(135deg, ${club.primaryColor} 0%, ${club.secondaryColor} 100%)`,
                }}
              >
                {club.logoUrl ? (
                  <Image
                    src={club.logoUrl}
                    alt={club.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-16 h-16 text-white" />
                )}
              </div>

              {/* Club Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-charcoal-900 mb-2">{club.name}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        className="px-3 py-1"
                        style={{
                          background: `linear-gradient(135deg, ${club.primaryColor} 0%, ${club.secondaryColor} 100%)`,
                          color: 'white',
                        }}
                      >
                        {club.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-charcoal-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{club.city}, {club.country}</span>
                      </div>
                      {club.foundedYear && (
                        <div className="flex items-center gap-1 text-charcoal-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Est. {club.foundedYear}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <Button
                      onClick={() => router.push(`/dashboard/clubs/${clubId}/settings`)}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  )}
                </div>

                {club.description && (
                  <p className="text-charcoal-600 leading-relaxed mb-4">{club.description}</p>
                )}

                {club.stadiumName && (
                  <div className="flex items-center gap-2 text-charcoal-600">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-medium">Home: {club.stadiumName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-gold-500" />
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900">{club.stats.totalTeams}</h3>
              <p className="text-sm text-charcoal-600">Active Teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-purple-500" />
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900">{club.stats.totalMembers}</h3>
              <p className="text-sm text-charcoal-600">Total Members</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-8 h-8 text-orange-500" />
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900">0</h3>
              <p className="text-sm text-charcoal-600">Championships</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="w-8 h-8 text-green-500" />
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900">0</h3>
              <p className="text-sm text-charcoal-600">Open Positions</p>
            </CardContent>
          </Card>
        </div>

        {/* Teams Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold-500" />
                  Teams
                </CardTitle>
                <CardDescription>Manage your club's teams</CardDescription>
              </div>
              {isOwner && (
                <Button
                  onClick={() => router.push(`/dashboard/clubs/${clubId}/teams/create`)}
                  className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {club.teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-charcoal-900 mb-2">No teams yet</h3>
                <p className="text-charcoal-600 mb-6">Create your first team to get started</p>
                {isOwner && (
                  <Button
                    onClick={() => router.push(`/dashboard/clubs/${clubId}/teams/create`)}
                    className="bg-gold-500 hover:bg-gold-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {club.teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 border border-neutral-200 rounded-xl hover:border-gold-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-charcoal-900">{team.name}</h3>
                        <p className="text-sm text-charcoal-600">{team.ageGroup}</p>
                      </div>
                      <Badge variant="outline">{team.category.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-charcoal-600">
                      <Users className="w-4 h-4" />
                      <span>{team._count.members} members</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff & Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold-500" />
                  Staff & Members
                </CardTitle>
                <CardDescription>Club management and members</CardDescription>
              </div>
              {isOwner && (
                <Button
                  onClick={() => router.push(`/dashboard/clubs/${clubId}/members/invite`)}
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {club.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-orange-100 rounded-full flex items-center justify-center font-bold text-gold-600">
                      {member.user.firstName?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-charcoal-900">
                        {member.user.firstName && member.user.lastName
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : member.user.email}
                      </p>
                      <p className="text-xs text-charcoal-500">{member.user.email}</p>
                    </div>
                  </div>
                  <Badge
                    className={member.role === 'OWNER' ? 'bg-gold-500 text-white' : ''}
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
