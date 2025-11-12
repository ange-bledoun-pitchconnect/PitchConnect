/**
 * Coach Dashboard
 * Coach-focused overview with team management, tactics, training
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Trophy,
  AlertCircle,
  Plus,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  Clock,
} from 'lucide-react';

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
            <p className="text-foreground/70 mt-2">Manage teams, tactics & training</p>
          </div>
          <Link href="/dashboard/coach/team">
            <Button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Team
            </Button>
          </Link>
        </div>

        {/* Key Stats - Coach Focused */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Teams Under Management */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-gold" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">2</div>
              <p className="text-xs text-foreground/60 mt-2">Managing</p>
            </CardContent>
          </Card>

          {/* Total Squad Size */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-gold" />
                Squad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">28</div>
              <p className="text-xs text-foreground/60 mt-2">Total players</p>
            </CardContent>
          </Card>

          {/* Upcoming Matches */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-gold" />
                Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">4</div>
              <p className="text-xs text-foreground/60 mt-2">Next 30 days</p>
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
              <div className="text-3xl font-bold text-hero">67%</div>
              <p className="text-xs text-foreground/60 mt-2">Season performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Matches for Coaching */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>🏆 Upcoming Matches (Coaching Focus)</CardTitle>
                <CardDescription>Prepare tactics and line-ups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-brand-gold pl-4 py-3 hover:bg-muted/30 rounded cursor-pointer transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Arsenal FC vs Manchester City</p>
                      <p className="text-sm text-foreground/60">Wednesday, Nov 19 • 3:00 PM</p>
                    </div>
                    <span className="bg-yellow-500/20 text-yellow-700 text-xs px-2 py-1 rounded">
                      2 days away
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href="/dashboard/coach/tactics">
                      <Button size="sm" className="btn-primary text-xs">
                        📊 Set Tactics
                      </Button>
                    </Link>
                    <Link href="/dashboard/coach/team">
                      <Button size="sm" variant="outline" className="text-xs">
                        👥 Select Lineup
                      </Button>
                    </Link>
                    <Link href="/dashboard/coach/training">
                      <Button size="sm" variant="outline" className="text-xs">
                        🏋️ Plan Training
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="border-l-4 border-brand-purple pl-4 py-3 hover:bg-muted/30 rounded cursor-pointer transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Power League vs City United</p>
                      <p className="text-sm text-foreground/60">Saturday, Nov 22 • 2:00 PM</p>
                    </div>
                    <span className="bg-blue-500/20 text-blue-700 text-xs px-2 py-1 rounded">
                      5 days away
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href="/dashboard/coach/tactics">
                      <Button size="sm" className="btn-primary text-xs">
                        📊 Set Tactics
                      </Button>
                    </Link>
                    <Link href="/dashboard/coach/team">
                      <Button size="sm" variant="outline" className="text-xs">
                        👥 Select Lineup
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Match Analysis */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>📊 Recent Match Analysis</CardTitle>
                <CardDescription>Performance metrics from last 3 matches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    match: 'Arsenal FC 3 - 1 Tottenham',
                    date: '2 days ago',
                    possession: '62%',
                    shots: '18',
                    shotsOnTarget: '8',
                    passingAcc: '87%',
                    trend: '📈 Win',
                  },
                  {
                    match: 'Power League 2 - 2 City United',
                    date: '5 days ago',
                    possession: '48%',
                    shots: '12',
                    shotsOnTarget: '4',
                    passingAcc: '81%',
                    trend: '🟡 Draw',
                  },
                  {
                    match: 'Liverpool 1 - 2 Arsenal FC',
                    date: '9 days ago',
                    possession: '45%',
                    shots: '10',
                    shotsOnTarget: '5',
                    passingAcc: '84%',
                    trend: '📈 Win',
                  },
                ].map((match, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-sm">{match.match}</p>
                      <span className="text-sm font-bold">{match.trend}</span>
                    </div>
                    <p className="text-xs text-foreground/60 mb-2">{match.date}</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-foreground/60">Possession</p>
                        <p className="font-semibold text-brand-gold">{match.possession}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Shots</p>
                        <p className="font-semibold text-brand-gold">{match.shots}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">On Target</p>
                        <p className="font-semibold text-brand-gold">{match.shotsOnTarget}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Passing</p>
                        <p className="font-semibold text-brand-gold">{match.passingAcc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Training This Week */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>🏋️ Training Sessions This Week</CardTitle>
                <CardDescription>Scheduled preparation sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { day: 'Monday', time: '10:00 AM', focus: 'Ball Control & Passing', players: 22 },
                  { day: 'Tuesday', time: '10:00 AM', focus: 'Defensive Shapes', players: 20 },
                  { day: 'Wednesday', time: '3:00 PM', focus: 'Match Preview (Live)', players: 18 },
                  { day: 'Thursday', time: '10:00 AM', focus: 'Set Pieces Practice', players: 22 },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <p className="font-semibold text-sm">{session.day}</p>
                      <p className="text-xs text-foreground/60">{session.focus}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{session.time}</p>
                      <p className="text-xs text-foreground/60">{session.players} players</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Quick Actions - Coach Specific */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">⚙️ Quick Actions</CardTitle>
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
                <Button variant="outline" className="w-full justify-start">
                  📋 Player Injuries
                </Button>
              </CardContent>
            </Card>

            {/* Team Performance */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-gold" />
                  Team Performance
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

            {/* Key Alerts */}
            <Card className="glass border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  Coaching Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-red-500/10 rounded text-red-700">
                  🩹 Injury: Marcus Johnson (2 weeks out)
                </div>
                <div className="p-2 bg-yellow-500/10 rounded text-yellow-700">
                  ⚠️ Form: Player #7 (0 goals, 3 games)
                </div>
                <div className="p-2 bg-blue-500/10 rounded text-blue-700">
                  ℹ️ Suspension: Player #3 (1 game ban)
                </div>
              </CardContent>
            </Card>

            {/* Player Stats for Selection */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-gold" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Marcus Johnson (ST)</span>
                  <span className="font-semibold">5 goals</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>John Smith (CM)</span>
                  <span className="font-semibold">3 assists</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>James Wilson (CB)</span>
                  <span className="font-semibold">12 tackles</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
