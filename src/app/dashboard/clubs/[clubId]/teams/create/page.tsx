'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  Trophy,
  Calendar,
  Loader2,
  CheckCircle,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateTeamPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamData, setTeamData] = useState({
    name: '',
    ageGroup: 'SENIOR',
    category: 'FIRST_TEAM',
  });

  const ageGroups = [
    { value: 'SENIOR', label: 'Senior (18+)' },
    { value: 'U21', label: 'Under 21' },
    { value: 'U18', label: 'Under 18' },
    { value: 'U16', label: 'Under 16' },
    { value: 'U14', label: 'Under 14' },
    { value: 'U12', label: 'Under 12' },
    { value: 'U10', label: 'Under 10' },
  ];

  const categories = [
    { value: 'FIRST_TEAM', label: 'First Team', icon: Trophy },
    { value: 'RESERVES', label: 'Reserves', icon: Users },
    { value: 'YOUTH', label: 'Youth/Academy', icon: Calendar },
    { value: 'WOMENS', label: "Women's Team", icon: Shield },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamData.name) {
      toast.error('Please provide a team name');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const data = await response.json();
      toast.success('🎉 Team created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/clubs/${clubId}/teams/${data.teamId}`);
      }, 1000);
    } catch (error) {
      console.error('Team creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/clubs/${clubId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Club
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Create New Team</h1>
              <p className="text-charcoal-600">Add a team to your club</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              Team Information
            </CardTitle>
            <CardDescription>Set up your team details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">
                  Team Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="teamName"
                  value={teamData.name}
                  onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                  placeholder="e.g., First Team, U21 Squad, Women's Team"
                  required
                />
              </div>

              {/* Age Group */}
              <div className="space-y-2">
                <Label htmlFor="ageGroup">Age Group</Label>
                <select
                  id="ageGroup"
                  value={teamData.ageGroup}
                  onChange={(e) => setTeamData({ ...teamData, ageGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {ageGroups.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team Category */}
              <div className="space-y-2">
                <Label>Team Category</Label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setTeamData({ ...teamData, category: category.value })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          teamData.category === category.value
                            ? 'border-gold-500 bg-gold-50'
                            : 'border-neutral-200 hover:border-gold-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-5 h-5 ${
                              teamData.category === category.value
                                ? 'text-gold-600'
                                : 'text-charcoal-400'
                            }`}
                          />
                          <span className="font-semibold text-sm">{category.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-sm text-charcoal-600 mb-2">Preview:</p>
                <div className="flex items-center gap-3">
                  <Badge>{teamData.ageGroup}</Badge>
                  <Badge variant="outline">{teamData.category.replace('_', ' ')}</Badge>
                  <p className="font-semibold text-charcoal-900">
                    {teamData.name || 'Team Name'}
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/clubs/${clubId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !teamData.name}
                  className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Team
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
