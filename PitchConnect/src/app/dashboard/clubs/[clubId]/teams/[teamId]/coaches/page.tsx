'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Users,
  Trash2,
  Edit3,
  Award,
  Mail,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Coach {
  id: string;
  role: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  _count: {
    players: number;
    coaches: number;
  };
}

const COACH_ROLES = [
  'Head Coach',
  'Assistant Coach',
  'Goalkeeper Coach',
  'Fitness Coach',
  'Strength & Conditioning',
  'Physiotherapist',
  'Sports Psychologist',
];

export default function TeamCoachesPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Assistant Coach');
  const [isAddingCoach, setIsAddingCoach] = useState(false);

  useEffect(() => {
    fetchTeamAndCoaches();
  }, []);

  const fetchTeamAndCoaches = async () => {
    try {
      setIsLoading(true);
      const [teamRes, coachesRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/coaches`),
      ]);

      if (!teamRes.ok) throw new Error('Failed to fetch team');
      if (!coachesRes.ok) throw new Error('Failed to fetch coaches');

      const [teamData, coachesData] = await Promise.all([
        teamRes.json(),
        coachesRes.json(),
      ]);

      setTeam(teamData);
      setCoaches(coachesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCoachEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!selectedRole) {
      toast.error('Role is required');
      return;
    }

    try {
      setIsAddingCoach(true);

      // Search for user by email
      const userRes = await fetch(`/api/users/search?email=${encodeURIComponent(newCoachEmail)}`);
      if (!userRes.ok) {
        toast.error('User not found with that email');
        return;
      }

      const userData = await userRes.json();

      // Add coach to team
      const response = await fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/coaches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add coach');
      }

      const newCoach = await response.json();
      setCoaches([newCoach, ...coaches]);
      setNewCoachEmail('');
      setSelectedRole('Assistant Coach');
      toast.success('Coach added successfully!');
    } catch (error) {
      console.error('Error adding coach:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add coach');
    } finally {
      setIsAddingCoach(false);
    }
  };

  const handleRemoveCoach = async (coachId: string) => {
    if (!confirm('Are you sure you want to remove this coach?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/coaches/${coachId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove coach');

      setCoaches(coaches.filter((c) => c.id !== coachId));
      toast.success('Coach removed successfully');
    } catch (error) {
      console.error('Error removing coach:', error);
      toast.error('Failed to remove coach');
    }
  };

  const filteredCoaches = coaches.filter((c) =>
    `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-amber-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading coaches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-amber-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                {team?.name} - Coaching Staff
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Manage your team's coaching staff
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Coach Form */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Add Coach</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Assign coaches to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCoach} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Coach Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCoachEmail}
                    onChange={(e) => setNewCoachEmail(e.target.value)}
                    placeholder="coach@example.com"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Role
                  </Label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-700 transition-all"
                  >
                    {COACH_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isAddingCoach}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white font-bold"
                >
                  {isAddingCoach ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Coach
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Coaches List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-charcoal-400 dark:text-charcoal-500" />
              <Input
                type="text"
                placeholder="Search coaches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 text-charcoal-900 dark:text-white"
              />
            </div>

            {/* Coaches Grid */}
            {filteredCoaches.length === 0 ? (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                    No coaches yet
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    Add your first coach to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCoaches.map((coach) => (
                  <Card
                    key={coach.id}
                    className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 hover:shadow-lg dark:hover:shadow-charcoal-900/30 transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold mb-3">
                            {coach.user.firstName[0]}{coach.user.lastName[0]}
                          </div>
                          <h3 className="font-bold text-charcoal-900 dark:text-white mb-1">
                            {coach.user.firstName} {coach.user.lastName}
                          </h3>
                          <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold mb-2">
                            {coach.role}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {coach.user.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveCoach(coach.id)}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
