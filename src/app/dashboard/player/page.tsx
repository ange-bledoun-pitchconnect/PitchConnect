/**
 * Player Dashboard
 * Shows player stats, teams, achievements, upcoming matches
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, Users, Calendar, Settings } from 'lucide-react';

export default function PlayerDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.firstName}! ⚽
            </h1>
            <p className="text-foreground/70 mt-2">
              Here's your football journey
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Appearances */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-gold" />
                Appearances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">12</div>
              <p className="text-xs text-foreground/60 mt-2">+2 this month</p>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-gold" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">5</div>
              <p className="text-xs text-foreground/60 mt-2">3 assists</p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-gold" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">7</div>
              <p className="text-xs text-foreground/60 mt-2">Badges unlocked</p>
            </CardContent>
          </Card>

          {/* Teams */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-gold" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">2</div>
              <p className="text-xs text-foreground/60 mt-2">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Matches */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Upcoming Matches</CardTitle>
                <CardDescription>Your next fixtures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-brand-gold pl-4 py-3">
                  <p className="font-semibold">Arsenal FC vs Man City</p>
                  <p className="text-sm text-foreground/60">Saturday, Nov 16 • 3:00 PM</p>
                </div>
                <div className="border-l-4 border-brand-purple pl-4 py-3">
                  <p className="font-semibold">Power League Match</p>
                  <p className="text-sm text-foreground/60">Wednesday, Nov 19 • 7:30 PM</p>
                </div>
                <Button className="w-full btn-outline mt-4" asChild>
                  <a href="/dashboard/player/fixtures">View All Fixtures</a>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Performance */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
                <CardDescription>Last 5 matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm">Match {i}</span>
                      <span className="text-xs text-foreground/60">2 days ago</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* My Teams */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>My Teams</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/50 rounded cursor-pointer hover:bg-muted transition">
                  <p className="font-medium">Arsenal FC</p>
                  <p className="text-xs text-foreground/60">Midfielder • #7</p>
                </div>
                <div className="p-3 bg-muted/50 rounded cursor-pointer hover:bg-muted transition">
                  <p className="font-medium">Power League</p>
                  <p className="text-xs text-foreground/60">Forward • #9</p>
                </div>
                <Button className="w-full btn-outline" asChild>
                  <a href="/dashboard/player/teams">Manage Teams</a>
                </Button>
              </CardContent>
            </Card>

            {/* Achievements Preview */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {['🥇', '⚽', '🎯'].map((emoji, i) => (
                    <div key={i} className="text-3xl text-center p-3 bg-muted/50 rounded">
                      {emoji}
                    </div>
                  ))}
                </div>
                <Button className="w-full btn-outline mt-4" asChild>
                  <a href="/dashboard/player/achievements">View All</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
