'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  Plus,
  Settings,
  Trophy,
  Calendar,
  MapPin,
  Shield,
  Loader2,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  category: string;
  status: string;
  _count: {
    members: number;
  };
}

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
    firstName: string;
    lastName: string;
  };
  teams: Team[];
  members: any[];
  stats: {
    totalTeams: number;
    totalMembers: number;
  };
}

export default function ClubDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchClubData();
  }, [clubId]);

  const fetchClubData = async () => {
    try {
      const response = await fetch(`/api/clubs/${clubId}`);
      if (!response.ok) throw new Error('Failed to fetch club');

      const data = await response.json();
      setClub(data.club);
      setUserRole(data.userRole);
    } catch (error) {
      console.error('Error fetching club:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FIRST_TEAM':
        return Trophy;
      case 'RESERVES':
        return Users;
      case 'YOUTH':
        return Calendar;
      case 'WOMENS':
        return Shield;
      default:
        return Users;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-charcoal-600">Club not found</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Club Logo */}
              <div className="w-24 h-24 bg-gradient-to-br from-gold-100 to-orange-100 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {club.logoUrl ? (
                  <Image
                    src={club.logoUrl}
                    alt={club.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-12 h-12 text-gold-600" />
                )}
              </div>

              {/* Club Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-charcoal-900">{club.name}</h1>
                  <Badge>{club.status}</Badge>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
                <div className="flex items-center gap-4 text-charcoal-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {club.city}, {club.country}
                    </span>
                  </div>
                  {club.foundedYear && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Founded {club.foundedYear}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {(userRole === 'OWNER' || userRole === 'ADMIN') && (
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Club Settings
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600">Total Teams</p>
                  <p className="text-3xl font-bold text-charcoal-900">{club.stats.totalTeams}</p>
                </div>
                <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600">Total Members</p>
                  <p className="text-3xl font-bold text-charcoal-900">{club.stats.totalMembers}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600">Active Players</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {club.teams.reduce((sum, team) => sum + team._count.members, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
              </div>
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
              {(userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'ADMIN') && (
                <Link href={`/dashboard/clubs/${clubId}/teams/create`}>
                  <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {club.teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No teams yet</h3>
                <p className="text-charcoal-600 mb-6">Create your first team to get started</p>
                {(userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'ADMIN') && (
                  <Link href={`/dashboard/clubs/${clubId}/teams/create`}>
                    <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Team
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {club.teams.map((team) => {
                  const CategoryIcon = getCategoryIcon(team.category);
                  return (
                    <Link key={team.id} href={`/dashboard/clubs/${clubId}/teams/${team.id}`}>
                      <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-gold-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center">
                              <CategoryIcon className="w-6 h-6 text-gold-600" />
                            </div>
                            <Badge>{team.ageGroup}</Badge>
                          </div>

                          <h3 className="text-lg font-bold text-charcoal-900 mb-2">
                            {team.name}
                          </h3>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-charcoal-600">
                              {team.category.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-1 text-charcoal-600">
                              <Users className="w-4 h-4" />
                              <span>{team._count.members} members</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Club Description */}
        {club.description && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-charcoal-700 leading-relaxed">{club.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
