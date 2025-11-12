/**
 * Squad Management Page
 * View and manage team players, injuries, positions
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function SquadManagementPage() {
  const { user, isLoading } = useAuth();

  const squad = [
    { id: '1', name: 'John Smith', number: 7, position: 'CM', status: 'AVAILABLE', apps: 12, goals: 3 },
    { id: '2', name: 'Marcus Johnson', number: 9, position: 'ST', status: 'AVAILABLE', apps: 10, goals: 5 },
    { id: '3', name: 'Alex Williams', number: 4, position: 'RB', status: 'INJURED', apps: 9, goals: 0 },
    { id: '4', name: 'Sarah Brown', number: 1, position: 'GK', status: 'AVAILABLE', apps: 12, goals: 0 },
    { id: '5', name: 'James Wilson', number: 5, position: 'CB', status: 'AVAILABLE', apps: 12, goals: 1 },
    { id: '6', name: 'Emma Taylor', number: 12, position: 'LW', status: 'AVAILABLE', apps: 8, goals: 2 },
  ];

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

  const availablePlayers = squad.filter((p) => p.status === 'AVAILABLE').length;
  const injuredPlayers = squad.filter((p) => p.status === 'INJURED').length;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Squad Management</h1>
            <p className="text-foreground/70">Manage your team players</p>
          </div>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Player
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Squad Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-hero">{squad.length}</div>
              <p className="text-xs text-foreground/60 mt-2">Players total</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{availablePlayers}</div>
              <p className="text-xs text-foreground/60 mt-2">Ready to play</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Injured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{injuredPlayers}</div>
              <p className="text-xs text-foreground/60 mt-2">Out of action</p>
            </CardContent>
          </Card>
        </div>

        {/* Squad Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Squad List</CardTitle>
            <CardDescription>All players and their details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Position</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Apps</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Goals</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {squad.map((player) => (
                    <tr key={player.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                      <td className="py-3 px-4 font-bold text-brand-gold">#{player.number}</td>
                      <td className="py-3 px-4 font-semibold">{player.name}</td>
                      <td className="py-3 px-4 text-sm text-foreground/70">{player.position}</td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          player.status === 'AVAILABLE' 
                            ? 'bg-green-500/10 text-green-600' 
                            : 'bg-red-500/10 text-red-600'
                        }`}>
                          {player.status === 'AVAILABLE' ? '✓ Available' : '🩹 Injured'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{player.apps}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-brand-gold">{player.goals}</td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" className="text-xs">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Injuries */}
        {injuredPlayers > 0 && (
          <Card className="glass border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Player Injuries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {squad
                .filter((p) => p.status === 'INJURED')
                .map((player) => (
                  <div key={player.id} className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">#{player.number} {player.name}</p>
                        <p className="text-sm text-foreground/60">{player.position}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Update Status
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
