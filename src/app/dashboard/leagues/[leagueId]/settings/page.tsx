'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LeagueSettingsPage() {
  const { leagueId } = useParams();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/leagues/${leagueId}/settings`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (leagueId) {
      fetchSettings();
    }
  }, [leagueId]);

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-8">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>League Settings</CardTitle>
          <CardDescription>Configure league parameters and rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Points Configuration */}
          <div className="border-b pb-6">
            <h3 className="font-semibold mb-4">Points Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Points for Win</label>
                <div className="mt-1 p-3 bg-green-50 rounded border text-center">
                  {settings?.pointsForWin || 3}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Points for Draw</label>
                <div className="mt-1 p-3 bg-yellow-50 rounded border text-center">
                  {settings?.pointsForDraw || 1}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Points for Loss</label>
                <div className="mt-1 p-3 bg-red-50 rounded border text-center">
                  {settings?.pointsForLoss || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Team Configuration */}
          <div className="border-b pb-6">
            <h3 className="font-semibold mb-4">Team Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Minimum Teams</label>
                <p className="mt-1 text-lg font-semibold">{settings?.minTeams || 2}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Maximum Teams</label>
                <p className="mt-1 text-lg font-semibold">{settings?.maxTeams || 'Unlimited'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Max Players per Team</label>
                <p className="mt-1 text-lg font-semibold">{settings?.maxPlayersPerTeam || '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Min Players per Match</label>
                <p className="mt-1 text-lg font-semibold">{settings?.minPlayersPerMatch || 7}</p>
              </div>
            </div>
          </div>

          {/* Tiebreaker Rules */}
          <div className="border-b pb-6">
            <h3 className="font-semibold mb-4">Tiebreaker Rules</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">1st Tiebreaker:</span> {settings?.tiebreaker1 || 'GOAL_DIFFERENCE'}
              </div>
              <div>
                <span className="font-medium">2nd Tiebreaker:</span> {settings?.tiebreaker2 || 'GOALS_SCORED'}
              </div>
              <div>
                <span className="font-medium">3rd Tiebreaker:</span> {settings?.tiebreaker3 || 'HEAD_TO_HEAD'}
              </div>
            </div>
          </div>

          {/* Registration */}
          <div>
            <h3 className="font-semibold mb-4">Registration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Registration Open</label>
                <p className="mt-1 text-lg font-semibold">
                  {settings?.registrationOpen ? 'Yes' : 'No'}
                </p>
              </div>
              {settings?.entryFee && (
                <div>
                  <label className="text-sm font-medium">Entry Fee</label>
                  <p className="mt-1 text-lg font-semibold">£{settings.entryFee}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button>Edit Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
