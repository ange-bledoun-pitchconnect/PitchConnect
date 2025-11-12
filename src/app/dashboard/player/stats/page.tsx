/**
 * Player Stats Page
 * Comprehensive performance tracking and analytics
 * Shows all player statistics with charts and trends
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Goal,
  TrendingUp,
  Zap,
  Users,
  Target
} from 'lucide-react';

export default function PlayerStatsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
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
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Statistics & Performance
          </h1>
          <p className="text-foreground/70">
            2024/25 Season Statistics
          </p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Appearances */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-gold" />
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
                <Goal className="w-4 h-4 text-brand-gold" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">5</div>
              <p className="text-xs text-foreground/60 mt-2">0.42 per game</p>
            </CardContent>
          </Card>

          {/* Assists */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-gold" />
                Assists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">3</div>
              <p className="text-xs text-foreground/60 mt-2">0.25 per game</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attacking Stats */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-gold" />
                Attacking
              </CardTitle>
              <CardDescription>Goal-scoring metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Shots</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-brand-gold h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Shots on Target</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-brand-purple h-2 rounded-full" style={{ width: '33%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Expected Goals (xG)</span>
                  <span className="font-semibold">4.2</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-brand-gold h-2 rounded-full" style={{ width: '84%' }} />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground/60">
                  ✅ Performing above expectations (xG: 4.2 vs Goals: 5)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Defensive Stats */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-gold" />
                Defensive
              </CardTitle>
              <CardDescription>Defensive contributions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tackles</span>
                  <span className="font-semibold">45</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-brand-gold h-2 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Interceptions</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-brand-purple h-2 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Passing Accuracy</span>
                  <span className="font-semibold">87.5%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-brand-gold h-2 rounded-full" style={{ width: '87.5%' }} />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground/60">
                  ✅ Strong defensive presence with high passing accuracy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Physical Stats */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-brand-gold" />
              Physical Performance
            </CardTitle>
            <CardDescription>Distance & speed metrics</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-foreground/60 mb-2">Distance Covered (Per Match)</p>
              <p className="text-2xl font-bold text-hero">10.2 km</p>
              <p className="text-xs text-foreground/60 mt-1">Above average</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60 mb-2">Top Speed</p>
              <p className="text-2xl font-bold text-hero">32.4 km/h</p>
              <p className="text-xs text-foreground/60 mt-1">Excellent fitness</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60 mb-2">Sprints (Per Match)</p>
              <p className="text-2xl font-bold text-hero">18</p>
              <p className="text-xs text-foreground/60 mt-1">High intensity play</p>
            </div>
          </CardContent>
        </Card>

        {/* Season Comparison */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Season Comparison</CardTitle>
            <CardDescription>2023/24 vs 2024/25</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-foreground/60 mb-2">Metric</p>
                </div>
                <div className="text-center">
                  <p className="text-foreground/60 mb-2">2023/24</p>
                </div>
                <div className="text-center">
                  <p className="text-foreground/60 mb-2">2024/25</p>
                </div>
              </div>

              {[
                { metric: 'Appearances', prev: 10, curr: 12, trend: 'up' },
                { metric: 'Goals', prev: 3, curr: 5, trend: 'up' },
                { metric: 'Assists', prev: 1, curr: 3, trend: 'up' },
                { metric: 'Avg. Rating', prev: 6.8, curr: 7.2, trend: 'up' },
              ].map((stat) => (
                <div key={stat.metric} className="grid grid-cols-3 gap-4 items-center text-sm py-2 border-b border-border/50">
                  <div className="font-medium">{stat.metric}</div>
                  <div className="text-center text-foreground/60">{stat.prev}</div>
                  <div className="text-center font-semibold text-brand-gold flex items-center justify-center gap-1">
                    {stat.curr}
                    <span>↑</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
