/**
 * Tactical Board
 * Simple formation builder and tactical setup
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FORMATIONS = [
  { id: '442', name: '4-4-2', formation: [[1], [4], [4], [2]] },
  { id: '433', name: '4-3-3', formation: [[1], [4], [3], [3]] },
  { id: '352', name: '3-5-2', formation: [[1], [3], [5], [2]] },
  { id: '532', name: '5-3-2', formation: [[1], [5], [3], [2]] },
  { id: '343', name: '3-4-3', formation: [[1], [3], [4], [3]] },
];

export default function TacticalBoardPage() {
  const { user, isLoading } = useAuth();
  const [selectedFormation, setSelectedFormation] = useState(FORMATIONS[1]); // 4-3-3 default

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

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Tactical Board</h1>
          <p className="text-foreground/70">Design your team's formation and tactics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Formations */}
          <div>
            <Card className="glass sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Formations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {FORMATIONS.map((formation) => (
                  <Button
                    key={formation.id}
                    onClick={() => setSelectedFormation(formation)}
                    variant={selectedFormation.id === formation.id ? 'default' : 'outline'}
                    className={`w-full justify-start ${
                      selectedFormation.id === formation.id ? 'btn-primary' : ''
                    }`}
                  >
                    {formation.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Field Visualization */}
          <div className="lg:col-span-3">
            <Card className="glass">
              <CardHeader>
                <CardTitle>{selectedFormation.name} Formation</CardTitle>
                <CardDescription>
                  Drag and drop players to adjust positioning
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Football Pitch */}
                <div className="bg-gradient-to-b from-green-700 to-green-600 rounded-lg p-8 aspect-video flex flex-col justify-between relative overflow-hidden">
                  {/* Field Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Center Line */}
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/30 -translate-x-1/2" />
                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 w-1/4 h-1/3 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    {/* Goal Areas */}
                    <div className="absolute top-0 left-0 right-0 h-1/4 border-2 border-white/30 border-t-0" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 border-2 border-white/30 border-b-0" />
                  </div>

                  {/* Players for Each Row */}
                  <div className="relative z-10 space-y-4">
                    {/* GK */}
                    <div className="flex justify-center">
                      <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg">
                        GK
                      </div>
                    </div>

                    {/* Formation Rows */}
                    {selectedFormation.formation.slice(1).map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-center gap-8">
                        {Array.from({ length: row[0] }).map((_, playerIndex) => (
                          <div
                            key={playerIndex}
                            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg cursor-move hover:scale-110 transition-transform"
                          >
                            {playerIndex + 1}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Player List */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="glass border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Starting XI</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { name: 'John Smith', pos: 'CM', num: 7 },
                        { name: 'Marcus Johnson', pos: 'ST', num: 9 },
                        { name: 'Alex Williams', pos: 'RB', num: 4 },
                      ].map((player) => (
                        <div key={player.num} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="font-semibold">#{player.num} {player.name}</span>
                          <span className="text-xs text-foreground/60">{player.pos}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="glass border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tactical Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-foreground/60">Play Style</p>
                        <p className="font-semibold">Possession-Based</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Defensive Line</p>
                        <p className="font-semibold">Medium</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Press Type</p>
                        <p className="font-semibold">High Press</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                  <Button className="btn-primary flex-1">Save Tactic</Button>
                  <Button variant="outline" className="flex-1">Preview</Button>
                  <Button variant="outline" className="flex-1">Share</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
