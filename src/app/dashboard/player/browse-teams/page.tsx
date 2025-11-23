'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Users,
  MapPin,
  Shield,
  Loader2,
  UserPlus,
  CheckCircle,
  Clock,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  category: string;
  status: string;
  club: {
    id: string;
    name: string;
    city: string;
    country: string;
    logoUrl: string | null;
  };
  _count: {
    members: number;
  };
  hasJoinRequest?: boolean;
  isMember?: boolean;
}

export default function BrowseTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const ageGroups = ['ALL', 'SENIOR', 'U21', 'U18', 'U16', 'U14', 'U12', 'U10'];
  const categories = ['ALL', 'FIRST_TEAM', 'RESERVES', 'YOUTH', 'WOMENS'];

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/player/browse-teams');
      if (!response.ok) throw new Error('Failed to fetch teams');

      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async (teamId: string, teamName: string) => {
    try {
      const response = await fetch('/api/player/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send join request');
      }

      toast.success(`✅ Join request sent to ${teamName}!`);
      fetchTeams(); // Refresh to update button states
    } catch (error) {
      console.error('Error sending join request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send join request');
    }
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAgeGroup = filterAgeGroup === 'ALL' || team.ageGroup === filterAgeGroup;
    const matchesCategory = filterCategory === 'ALL' || team.category === filterCategory;

    return matchesSearch && matchesAgeGroup && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FIRST_TEAM':
        return Trophy;
      case 'RESERVES':
        return Users;
      case 'YOUTH':
        return Shield;
      case 'WOMENS':
        return Shield;
      default:
        return Users;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Browse Teams</h1>
              <p className="text-charcoal-600">Find and join teams in your area</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-4 h-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teams, clubs, cities..."
                    className="pl-10"
                  />
                </div>

                {/* Age Group Filter */}
                <select
                  value={filterAgeGroup}
                  onChange={(e) => setFilterAgeGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {ageGroups.map((group) => (
                    <option key={group} value={group}>
                      {group === 'ALL' ? 'All Age Groups' : group}
                    </option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'All Categories' : cat.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-charcoal-600">
            {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} found
          </p>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No teams found</h3>
                <p className="text-charcoal-600 mb-6">Try adjusting your search filters</p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterAgeGroup('ALL');
                    setFilterCategory('ALL');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const CategoryIcon = getCategoryIcon(team.category);
              return (
                <Card
                  key={team.id}
                  className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-gold-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center">
                        <CategoryIcon className="w-7 h-7 text-gold-600" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className="bg-gold-100 text-gold-700 border-gold-300">
                          {team.ageGroup}
                        </Badge>
                        <Badge variant="outline">{team.category.replace('_', ' ')}</Badge>
                      </div>
                    </div>

                    <CardTitle className="text-xl mb-2">{team.name}</CardTitle>
                    <CardDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-charcoal-700">
                          <Shield className="w-4 h-4" />
                          <span className="font-semibold">{team.club.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {team.club.city}, {team.club.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{team._count.members} members</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {team.isMember ? (
                      <Button disabled className="w-full bg-green-100 text-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Already a Member
                      </Button>
                    ) : team.hasJoinRequest ? (
                      <Button disabled className="w-full bg-orange-100 text-orange-700">
                        <Clock className="w-4 h-4 mr-2" />
                        Request Pending
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinRequest(team.id, team.name)}
                        className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Request to Join
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
