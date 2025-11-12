/**
 * Player Achievements Page
 * Badges, milestones, and gamification
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, Zap, Target, Users, TrendingUp } from 'lucide-react';

export default function PlayerAchievementsPage() {
  const { user, isLoading } = useAuth();

  const achievements = [
    {
      id: '1',
      name: 'First Goal',
      description: 'Score your first goal',
      icon: '⚽',
      unlocked: true,
      unlockedDate: '2024-08-15',
      rarity: 'common',
      points: 10,
    },
    {
      id: '2',
      name: 'Hat Trick',
      description: 'Score 3 goals in a match',
      icon: '🎩',
      unlocked: false,
      rarity: 'rare',
      points: 50,
    },
    {
      id: '3',
      name: 'Assist Master',
      description: 'Record 3+ assists in a match',
      icon: '🎯',
      unlocked: true,
      unlockedDate: '2024-09-22',
      rarity: 'uncommon',
      points: 25,
    },
    {
      id: '4',
      name: 'Clean Sheet',
      description: 'Keep a clean sheet',
      icon: '🛡️',
      unlocked: false,
      rarity: 'uncommon',
      points: 20,
    },
    {
      id: '5',
      name: 'Century Club',
      description: 'Play 100+ matches',
      icon: '💯',
      unlocked: false,
      rarity: 'legendary',
      points: 100,
    },
    {
      id: '6',
      name: 'Golden Boot Contender',
      description: 'Score 10+ goals in a season',
      icon: '👢',
      unlocked: false,
      rarity: 'epic',
      points: 75,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

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
          <h1 className="text-4xl font-bold mb-2">Achievements</h1>
          <p className="text-foreground/70">
            Unlock badges and climb the ranks
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-gold" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">{unlockedCount}/6</div>
              <p className="text-xs text-foreground/60 mt-2">
                {Math.round((unlockedCount / 6) * 100)}% Complete
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-brand-gold" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">{totalPoints}</div>
              <p className="text-xs text-foreground/60 mt-2">
                +{totalPoints > 0 ? '✓' : '0'} this season
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-gold" />
                Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">12</div>
              <div className="w-full bg-muted rounded-full h-2 mt-3">
                <div className="bg-gradient-to-r from-brand-gold to-brand-purple h-2 rounded-full" style={{ width: '65%' }} />
              </div>
              <p className="text-xs text-foreground/60 mt-2">Next level in 35 XP</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`glass transition-all ${achievement.unlocked ? 'border-brand-gold/50' : 'opacity-60'}`}
              >
                <CardContent className="p-6">
                  <div className="text-center space-y-3">
                    {/* Icon */}
                    <div className="text-5xl">{achievement.icon}</div>

                    {/* Badge */}
                    <div>
                      <h3 className="font-bold text-lg">{achievement.name}</h3>
                      <p className="text-xs text-foreground/60">{achievement.description}</p>
                    </div>

                    {/* Rarity */}
                    <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      achievement.rarity === 'common' ? 'bg-gray-500/10 text-gray-600' :
                      achievement.rarity === 'uncommon' ? 'bg-green-500/10 text-green-600' :
                      achievement.rarity === 'rare' ? 'bg-blue-500/10 text-blue-600' :
                      achievement.rarity === 'epic' ? 'bg-purple-500/10 text-purple-600' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {achievement.rarity.toUpperCase()}
                    </div>

                    {/* Status */}
                    {achievement.unlocked ? (
                      <div className="space-y-1">
                        <p className="text-sm text-brand-gold font-semibold">✓ Unlocked</p>
                        <p className="text-xs text-foreground/60">
                          {new Date(achievement.unlockedDate!).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-brand-gold">
                          <Star className="w-3 h-3" />
                          +{achievement.points} XP
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/60">Locked</p>
                        <div className="text-xs text-foreground/50">
                          Keep playing to unlock
                        </div>
                        <div className="text-xs text-foreground/60">
                          {achievement.points} XP reward
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-gold" />
              Top Performers (This Month)
            </CardTitle>
            <CardDescription>Players leading the achievement race</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Marcus Johnson', points: 245, achievements: 8 },
                { rank: 2, name: 'You', points: 185, achievements: 6 },
                { rank: 3, name: 'Alex Williams', points: 156, achievements: 5 },
              ].map((player) => (
                <div key={player.rank} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      player.rank === 1 ? 'bg-yellow-500/20 text-yellow-600' :
                      player.rank === 2 ? 'bg-gray-400/20 text-gray-600' :
                      'bg-orange-500/20 text-orange-600'
                    }`}>
                      {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-xs text-foreground/60">
                        {player.achievements} achievements
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-gold">{player.points}</p>
                    <p className="text-xs text-foreground/60">XP</p>
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
