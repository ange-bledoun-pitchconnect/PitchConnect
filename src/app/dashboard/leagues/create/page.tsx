'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Trophy,
  Loader2,
  CheckCircle,
  Calendar,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateLeaguePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leagueData, setLeagueData] = useState({
    name: '',
    code: '',
    country: 'United Kingdom',
    season: new Date().getFullYear(),
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
  });

  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leagueData.name || !leagueData.code) {
      toast.error('Please provide league name and code');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leagues/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leagueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create league');
      }

      const data = await response.json();
      toast.success('🏆 League created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/leagues/${data.leagueId}`);
      }, 1000);
    } catch (error) {
      console.error('League creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create league');
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
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Create New League</h1>
              <p className="text-charcoal-600">Set up a new football league</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              League Information
            </CardTitle>
            <CardDescription>Configure your league settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* League Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  League Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={leagueData.name}
                  onChange={(e) => setLeagueData({ ...leagueData, name: e.target.value })}
                  placeholder="e.g., Premier Sunday League"
                  required
                />
              </div>

              {/* League Code */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  League Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={leagueData.code}
                  onChange={(e) =>
                    setLeagueData({ ...leagueData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., PSL2024"
                  required
                  maxLength={20}
                />
                <p className="text-xs text-charcoal-600">
                  Unique identifier for your league (letters and numbers only)
                </p>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Country
                </Label>
                <Input
                  id="country"
                  value={leagueData.country}
                  onChange={(e) => setLeagueData({ ...leagueData, country: e.target.value })}
                  placeholder="e.g., United Kingdom"
                />
              </div>

              {/* Season */}
              <div className="space-y-2">
                <Label htmlFor="season" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Season
                </Label>
                <select
                  id="season"
                  value={leagueData.season}
                  onChange={(e) =>
                    setLeagueData({ ...leagueData, season: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {seasons.map((year) => (
                    <option key={year} value={year}>
                      {year}/{year + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Points System */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Points System</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pointsWin">Win</Label>
                    <Input
                      id="pointsWin"
                      type="number"
                      min="0"
                      max="10"
                      value={leagueData.pointsWin}
                      onChange={(e) =>
                        setLeagueData({ ...leagueData, pointsWin: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsDraw">Draw</Label>
                    <Input
                      id="pointsDraw"
                      type="number"
                      min="0"
                      max="10"
                      value={leagueData.pointsDraw}
                      onChange={(e) =>
                        setLeagueData({ ...leagueData, pointsDraw: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsLoss">Loss</Label>
                    <Input
                      id="pointsLoss"
                      type="number"
                      min="0"
                      max="10"
                      value={leagueData.pointsLoss}
                      onChange={(e) =>
                        setLeagueData({ ...leagueData, pointsLoss: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm text-charcoal-600 mb-2">Preview:</p>
                <div className="space-y-2">
                  <p className="font-bold text-lg text-charcoal-900">{leagueData.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                      {leagueData.code}
                    </Badge>
                    <Badge variant="outline">
                      {leagueData.season}/{leagueData.season + 1}
                    </Badge>
                    <Badge variant="outline">{leagueData.country}</Badge>
                  </div>
                  <p className="text-sm text-charcoal-600">
                    Points: Win {leagueData.pointsWin} • Draw {leagueData.pointsDraw} • Loss{' '}
                    {leagueData.pointsLoss}
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !leagueData.name || !leagueData.code}
                  className="bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create League
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
