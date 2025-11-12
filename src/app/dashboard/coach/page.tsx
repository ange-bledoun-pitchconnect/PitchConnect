/**
 * Coach Dashboard
 * Overview of team management, upcoming matches, training sessions
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3,
  Users,
  Calendar,
  Trophy,
  AlertCircle,
  Plus,
  Settings,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function CoachDashboard() {
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
            <h1 className="text-4xl font-bold">Coach Dashboard</h1>
            <p className="text-foreground/70 mt-2">Manage your teams and tactics</p>
          </div>
          <Link href="/dashboard/coach/team">
            <Button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Team
            </Button>
          </Link>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-xs text-foreground/60 mt-2">Arsenal FC, Power League</p>
            </CardContent>
          </Card>

          {/* Squad Size */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-gold" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">28</div>
              <p className="text-xs text-foreground/60 mt-2">Under management</p>
            </CardContent>
          </Card>

          {/* Upcoming Matches */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-gold" />
                Next Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">2</div>
              <p className="text-xs text-foreground/60 mt-2">days away</p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-gold" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">65%</div>
              <p className="text-xs text-foreground/60 mt-2">This season</p>
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
                <CardDescription>Next fixtures for your teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-brand-gold pl-4 py-3 hover:bg-muted/30 rounded cursor-pointer transition">
                  <p className="font-semibold">Arsenal FC vs Manchester City</p>
                  <p className="text-sm text-foreground/60">Wednesday, Nov 19 • 3:00 PM</p>
                  <div className="mt-2 flex gap-2">
                    <Link href="/dashboard/coach/tactics">
                      <Button size="sm" className="btn-primary text-xs">
                        Set Tactics
                      </Button>
                    </Link>
                    <Link href="/dashboard/coach/matches">
                      <Button size="sm" variant="outline" className="text-xs">
                        Lineup
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="border-l-4 border-brand-purple pl-4 py-3 hover:bg-muted/30 rounded cursor-pointer transition">
                  <p className="font-semibold">Power League vs City United</p>
                  <p className="text-sm text-foreground/60">Saturday, Nov 22 • 2:00 PM</p>
                  <div className="mt-2 flex gap-2">
                    <Link href="/dashboard/coach/tactics">
                      <Button size="sm" className="btn-primary text-xs">
                        Set Tactics
                      </Button>
                    </Link>
                    <Link href="/dashboard/coach/training">
                      <Button size="sm" variant="outline" className="text-xs">
                        Training
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Match Results */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>Latest match outcomes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { home: 'Arsenal FC', away: 'Tottenham', result: '3-1', date: '2 days ago', status: 'won' },
                  { home: 'Power League', away: 'City United', result: '2-2', date: '5 days ago', status: 'draw' },
                  { home: 'Liverpool', away: 'Arsenal FC', result: '1-2', date: '9 days ago', status: 'won' },
                ].map((match, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-semibold">{match.home} vs {match.away}</p>
                      <p className="text-xs text-foreground/60">{match.date}</p>
                    </div>
                    <div className={`text-lg font-bold ${
                      match.status === 'won' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {match.result}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/coach/tactics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    📊 Tactical Board
                  </Button>
                </Link>
                <Link href="/dashboard/coach/team" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    👥 Squad Management
                  </Button>
                </Link>
                <Link href="/dashboard/coach/training" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    🏋️ Training Planner
                  </Button>
                </Link>
                <Link href="/dashboard/coach/matches" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    ⚽ Match Events
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="glass border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-yellow-500/10 rounded text-yellow-700">
                  ⚠️ Player injury: Marcus Johnson (2 weeks)
                </div>
                <div className="p-2 bg-blue-500/10 rounded text-blue-700">
                  ℹ️ Training session scheduled for Monday
                </div>
              </CardContent>
            </Card>

            {/* Team Stats */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-gold" />
                  Season Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Played</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Won</span>
                  <span className="font-semibold text-green-600">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Drew</span>
                  <span className="font-semibold text-yellow-600">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Lost</span>
                  <span className="font-semibold text-red-600">2</span>
                </div>
                <div className="border-t border-border/50 pt-2 mt-2 flex justify-between font-bold">
                  <span>Points</span>
                  <span className="text-brand-gold">26</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
