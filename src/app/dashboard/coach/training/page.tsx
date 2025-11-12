/**
 * Training Planner Page
 * Create and manage training sessions
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Clock, Users, Target, Zap } from 'lucide-react';

const DRILLS = [
  { id: '1', name: 'Ball Control Circuits', duration: 20, intensity: 'HIGH', players: 22 },
  { id: '2', name: 'Possession Game', duration: 25, intensity: 'MEDIUM', players: 22 },
  { id: '3', name: 'Set Pieces Practice', duration: 15, intensity: 'HIGH', players: 18 },
  { id: '4', name: 'Defensive Shape Drills', duration: 20, intensity: 'MEDIUM', players: 22 },
  { id: '5', name: 'Finishing Drills', duration: 20, intensity: 'HIGH', players: 14 },
  { id: '6', name: 'Cool Down Stretching', duration: 10, intensity: 'LOW', players: 22 },
];

export default function TrainingPlannerPage() {
  const { user, isLoading } = useAuth();
  const [session, setSession] = useState([
    DRILLS[0],
    DRILLS[1],
    DRILLS[3],
    DRILLS[5],
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const totalDuration = session.reduce((sum, drill) => sum + drill.duration, 0);

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Training Planner</h1>
            <p className="text-foreground/70">Design and schedule training sessions</p>
          </div>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Builder (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Info */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Today's Training (Monday)</CardTitle>
                <CardDescription>Arsenal FC First Team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-foreground/60 text-sm mb-1">Total Duration</p>
                    <p className="text-3xl font-bold text-hero">{totalDuration}</p>
                    <p className="text-xs text-foreground/60">minutes</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-foreground/60 text-sm mb-1">Drills</p>
                    <p className="text-3xl font-bold text-hero">{session.length}</p>
                    <p className="text-xs text-foreground/60">exercises</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-foreground/60 text-sm mb-1">Players</p>
                    <p className="text-3xl font-bold text-hero">22</p>
                    <p className="text-xs text-foreground/60">available</p>
                  </div>
                </div>

                {/* Session Details */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Date & Time</p>
                    <p className="font-semibold">Monday, Nov 18 • 10:00 AM</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Location</p>
                    <p className="font-semibold">Emirates Training Ground</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Focus</p>
                    <p className="font-semibold">Tactical Preparation for Man City Match</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Drills in Session */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Training Drills</CardTitle>
                <CardDescription>Order and duration of exercises</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.map((drill, index) => (
                  <div key={drill.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="font-bold text-lg text-brand-gold w-8 h-8 flex items-center justify-center bg-muted rounded">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{drill.name}</p>
                      <div className="flex gap-4 text-xs text-foreground/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {drill.duration} min
                        </span>
                        <span className={`flex items-center gap-1 ${
                          drill.intensity === 'HIGH' ? 'text-red-600' :
                          drill.intensity === 'MEDIUM' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          <Zap className="w-3 h-3" />
                          {drill.intensity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {drill.players} players
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Remove</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Save Session */}
            <div className="flex gap-4">
              <Button className="btn-primary flex-1">Save Session</Button>
              <Button variant="outline" className="flex-1">Preview</Button>
              <Button variant="outline" className="flex-1">Share with Players</Button>
            </div>
          </div>

          {/* Drill Library (1/3) */}
          <Card className="glass sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Drill Library</CardTitle>
              <CardDescription>Available drills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DRILLS.map((drill) => (
                <div
                  key={drill.id}
                  className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => {
                    if (!session.find((d) => d.id === drill.id)) {
                      setSession([...session, drill]);
                    }
                  }}
                >
                  <p className="font-semibold text-sm">{drill.name}</p>
                  <div className="flex gap-2 text-xs text-foreground/60 mt-1">
                    <span>⏱️ {drill.duration}m</span>
                    <span>👥 {drill.players}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
