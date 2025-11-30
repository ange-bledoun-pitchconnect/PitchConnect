'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  Loader2,
  AlertCircle,
  Save,
  Plus,
  X,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  position: string;
  jerseyNumber?: number;
  isCaptain: boolean;
}

interface Lineup {
  id: string;
  formation: string;
  players: Array<{
    playerId: string;
    position: string;
    orderInFormation: number;
  }>;
}

const FORMATIONS = [
  '4-4-2',
  '4-3-3',
  '3-5-2',
  '5-3-2',
  '4-2-3-1',
  '3-4-3',
  'CUSTOM',
];

const POSITION_GROUPS = {
  Goalkeeper: ['Goalkeeper'],
  Defense: ['Defender'],
  Midfield: ['Midfielder', 'Winger'],
  Attack: ['Forward', 'Striker'],
};

export default function LineupPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;
  const matchId = params.matchId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [selectedFormation, setSelectedFormation] = useState('4-4-2');
  const [lineup, setLineup] = useState<Array<{ playerId: string; position: string }>>([]);
  const [substitutes, setSubstitutes] = useState<string[]>([]);

  useEffect(() => {
    fetchTeamPlayers();
    fetchMatchLineup();
  }, []);

  const fetchTeamPlayers = async () => {
    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/players`
      );
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setTeamPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load team players');
    }
  };

  const fetchMatchLineup = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/lineup`
      );
      if (response.ok) {
        const data = await response.json();
        setLineup(data.players || []);
        setSelectedFormation(data.formation || '4-4-2');
        setSubstitutes(data.substitutes || []);
      }
    } catch (error) {
      console.error('Error fetching lineup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFormationPositions = (formation: string) => {
    const formations: { [key: string]: string[] } = {
      '4-4-2': ['GK', 'CB', 'CB', 'CB', 'CB', 'MF', 'MF', 'MF', 'MF', 'ST', 'ST'],
      '4-3-3': ['GK', 'CB', 'CB', 'CB', 'CB', 'MF', 'MF', 'MF', 'ST', 'ST', 'ST'],
      '3-5-2': ['GK', 'CB', 'CB', 'CB', 'MF', 'MF', 'MF', 'MF', 'MF', 'ST', 'ST'],
      '5-3-2': ['GK', 'CB', 'CB', 'CB', 'CB', 'CB', 'MF', 'MF', 'MF', 'ST', 'ST'],
      '4-2-3-1': ['GK', 'CB', 'CB', 'CB', 'CB', 'MF', 'MF', 'MF', 'MF', 'MF', 'ST'],
      '3-4-3': ['GK', 'CB', 'CB', 'CB', 'MF', 'MF', 'MF', 'MF', 'ST', 'ST', 'ST'],
    };
    return formations[formation] || formations['4-4-2'];
  };

  const handleAddToLineup = (playerId: string, position: string) => {
    if (lineup.length >= 11) {
      toast.error('Starting XI is full (11 players max)');
      return;
    }
    setLineup([...lineup, { playerId, position }]);
    setSubstitutes(substitutes.filter((id) => id !== playerId));
  };

  const handleRemoveFromLineup = (playerId: string) => {
    setLineup(lineup.filter((p) => p.playerId !== playerId));
  };

  const handleAddToSubstitutes = (playerId: string) => {
    if (substitutes.length >= 7) {
      toast.error('Max 7 substitutes');
      return;
    }
    setSubstitutes([...substitutes, playerId]);
    setLineup(lineup.filter((p) => p.playerId !== playerId));
  };

  const handleRemoveFromSubstitutes = (playerId: string) => {
    setSubstitutes(substitutes.filter((id) => id !== playerId));
  };

  const handleSaveLineup = async () => {
    if (lineup.length !== 11) {
      toast.error('You must select exactly 11 players');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/lineup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formation: selectedFormation,
            players: lineup,
            substitutes,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save lineup');

      toast.success('Lineup saved successfully!');
      router.push(`/dashboard/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}`);
    } catch (error) {
      console.error('Error saving lineup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save lineup');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading lineup...</p>
        </div>
      </div>
    );
  }

  const availablePlayers = teamPlayers.filter(
    (p) => !lineup.some((l) => l.playerId === p.id) && !substitutes.includes(p.id)
  );

  const lineupPlayers = lineup.map((l) =>
    teamPlayers.find((p) => p.id === l.playerId)
  );

  const substitutePlayers = teamPlayers.filter((p) => substitutes.includes(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                Submit Lineup
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Select your starting XI and substitutes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Formation Selector */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white text-lg">
                Formation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {FORMATIONS.map((formation) => (
                <button
                  key={formation}
                  onClick={() => setSelectedFormation(formation)}
                  className={`w-full p-3 rounded-lg font-semibold transition-all ${
                    selectedFormation === formation
                      ? 'bg-gold-500 text-white dark:bg-gold-600'
                      : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                  }`}
                >
                  {formation}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Pitch & Lineup */}
          <div className="lg:col-span-3 space-y-6">
            {/* Starting XI */}
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">
                  Starting XI ({lineup.length}/11)
                </CardTitle>
                <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                  Formation: {selectedFormation}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lineup.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                    <p className="text-charcoal-600 dark:text-charcoal-400">
                      Select players from the available list below
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lineupPlayers.map((player) =>
                      player ? (
                        <div
                          key={player.id}
                          className="p-4 bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 rounded-lg border border-gold-200 dark:border-gold-800 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-charcoal-900 dark:text-white">
                              {player.user.firstName} {player.user.lastName}
                            </p>
                            <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                              {player.position}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromLineup(player.id)}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Substitutes */}
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">
                  Substitutes ({substitutes.length}/7)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {substitutes.length === 0 ? (
                  <p className="text-charcoal-600 dark:text-charcoal-400 text-center py-4">
                    No substitutes selected
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {substitutePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="p-4 bg-neutral-100 dark:bg-charcoal-700 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-charcoal-900 dark:text-white">
                            {player.user.firstName} {player.user.lastName}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                            {player.position}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromSubstitutes(player.id)}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Players */}
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">
                  Available Players ({availablePlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availablePlayers.length === 0 ? (
                  <p className="text-charcoal-600 dark:text-charcoal-400 text-center py-4">
                    All players selected
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availablePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600 hover:shadow-md dark:hover:shadow-charcoal-900/30 transition-all"
                      >
                        <div className="mb-3">
                          <p className="font-semibold text-charcoal-900 dark:text-white">
                            {player.user.firstName} {player.user.lastName}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                            {player.position}
                            {player.jerseyNumber && ` • #${player.jerseyNumber}`}
                          </p>
                          {player.isCaptain && (
                            <span className="inline-block mt-1 px-2 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 rounded text-xs font-semibold">
                              Captain
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {lineup.length < 11 && (
                            <button
                              onClick={() => handleAddToLineup(player.id, player.position || 'MF')}
                              className="flex-1 p-2 bg-gold-500 hover:bg-gold-600 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              XI
                            </button>
                          )}
                          {substitutes.length < 7 && (
                            <button
                              onClick={() => handleAddToSubstitutes(player.id)}
                              className="flex-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-colors"
                            >
                              Sub
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-4">
              <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleSaveLineup}
                disabled={isSaving || lineup.length !== 11}
                className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Lineup
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
