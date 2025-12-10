// ============================================================================
// src/app/dashboard/matches/[matchId]/lineup/page.tsx
// Advanced Lineup Builder with Formation Selector & Tactical Positioning
// ============================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Loader2,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  club: string;
}

interface Formation {
  name: string;
  code: string;
  description: string;
  positions: string[];
}

interface LineupPlayer {
  id: string;
  number: number;
  name: string;
  position: string;
  slot: number;
}

interface Lineup {
  id: string;
  formation: string;
  players: LineupPlayer[];
  substitutes: LineupPlayer[];
  confirmed: boolean;
  lastUpdated: string;
}

interface Match {
  id: string;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  date: string;
  status: string;
  homeLineup?: Lineup;
  awayLineup?: Lineup;
}

const FORMATIONS: Formation[] = [
  {
    name: '4-3-3',
    code: '433',
    description: 'Balanced formation with 4 defenders, 3 midfielders, 3 attackers',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'LW', 'ST', 'RW'],
  },
  {
    name: '4-2-3-1',
    code: '4231',
    description: 'Defensive formation with 2 defensive midfielders',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LM', 'CM', 'RM', 'ST'],
  },
  {
    name: '3-5-2',
    code: '352',
    description: 'Attacking formation with 5 midfielders and 2 strikers',
    positions: ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'],
  },
  {
    name: '5-3-2',
    code: '532',
    description: 'Defensive formation with 5 defenders',
    positions: ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'ST', 'ST'],
  },
];

const generateMockPlayers = (): Player[] => [
  { id: '1', name: 'David Raya', number: 1, position: 'GK', club: 'Arsenal' },
  { id: '2', name: 'Oleksandr Zinchenko', number: 35, position: 'LB', club: 'Arsenal' },
  { id: '3', name: 'William Saliba', number: 2, position: 'CB', club: 'Arsenal' },
  { id: '4', name: 'Gabriel Magalhaes', number: 6, position: 'CB', club: 'Arsenal' },
  { id: '5', name: 'Ben White', number: 4, position: 'RB', club: 'Arsenal' },
  { id: '6', name: 'Thomas Partey', number: 5, position: 'CM', club: 'Arsenal' },
  { id: '7', name: 'Granit Xhaka', number: 34, position: 'CM', club: 'Arsenal' },
  { id: '8', name: 'Bukayo Saka', number: 7, position: 'RW', club: 'Arsenal' },
  { id: '9', name: 'Martin Odegaard', number: 8, position: 'CM', club: 'Arsenal' },
  { id: '10', name: 'Leandro Trossard', number: 19, position: 'LW', club: 'Arsenal' },
  { id: '11', name: 'Kai Havertz', number: 29, position: 'ST', club: 'Arsenal' },
  { id: '12', name: 'Jorginho', number: 5, position: 'CM', club: 'Arsenal' },
  { id: '13', name: 'Takehiro Tomiyasu', number: 16, position: 'RB', club: 'Arsenal' },
  { id: '14', name: 'Jakub Kiwior', number: 15, position: 'CB', club: 'Arsenal' },
  { id: '15', name: 'Albert Lokonga', number: 23, position: 'CM', club: 'Arsenal' },
];

export default function LineupBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [selectedFormation, setSelectedFormation] = useState<string>('433');
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [homeLineup, setHomeLineup] = useState<Lineup | null>(null);
  const [awayLineup, setAwayLineup] = useState<Lineup | null>(null);
  const [selectedPlayerSlot, setSelectedPlayerSlot] = useState<number | null>(null);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  useEffect(() => {
    fetchMatchAndLineup();
  }, [matchId]);

  const fetchMatchAndLineup = async () => {
    try {
      const mockMatch: Match = {
        id: matchId,
        homeTeam: { id: '1', name: 'Arsenal' },
        awayTeam: { id: '2', name: 'Manchester City' },
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        homeLineup: undefined,
        awayLineup: undefined,
      };

      setMatch(mockMatch);
      setAvailablePlayers(generateMockPlayers());

      const formation = FORMATIONS.find((f) => f.code === selectedFormation)!;
      const emptyLineup: Lineup = {
        id: `lineup-${Date.now()}`,
        formation: selectedFormation,
        players: formation.positions.map((pos, idx) => ({
          id: `empty-${idx}`,
          number: 0,
          name: pos,
          position: pos,
          slot: idx,
        })),
        substitutes: [],
        confirmed: false,
        lastUpdated: new Date().toISOString(),
      };

      setHomeLineup(emptyLineup);
      setAwayLineup(emptyLineup);
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormationChange = (formationCode: string) => {
    setSelectedFormation(formationCode);
    const formation = FORMATIONS.find((f) => f.code === formationCode)!;

    const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup;
    if (currentLineup) {
      const updatedLineup: Lineup = {
        ...currentLineup,
        formation: formationCode,
        players: formation.positions.map((pos, idx) => ({
          id: `empty-${idx}`,
          number: 0,
          name: pos,
          position: pos,
          slot: idx,
        })),
      };

      if (activeTeam === 'home') {
        setHomeLineup(updatedLineup);
      } else {
        setAwayLineup(updatedLineup);
      }
    }

    toast.success(`Formation changed to ${FORMATIONS.find((f) => f.code === formationCode)?.name}`);
  };

  const handleSelectPlayer = (player: Player, slot: number) => {
    const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup;
    if (!currentLineup) return;

    const updatedPlayers = [...currentLineup.players];
    updatedPlayers[slot] = {
      id: player.id,
      number: player.number,
      name: player.name,
      position: player.position,
      slot: slot,
    };

    const updatedLineup = {
      ...currentLineup,
      players: updatedPlayers,
    };

    if (activeTeam === 'home') {
      setHomeLineup(updatedLineup);
    } else {
      setAwayLineup(updatedLineup);
    }

    setShowPlayerPicker(false);
    setSelectedPlayerSlot(null);
    toast.success(`${player.name} added to lineup`);
  };

  const handleRemovePlayer = (slot: number) => {
    const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup;
    if (!currentLineup) return;

    const formation = FORMATIONS.find((f) => f.code === selectedFormation)!;
    const updatedPlayers = [...currentLineup.players];
    updatedPlayers[slot] = {
      id: `empty-${slot}`,
      number: 0,
      name: formation.positions[slot],
      position: formation.positions[slot],
      slot: slot,
    };

    const updatedLineup = {
      ...currentLineup,
      players: updatedPlayers,
    };

    if (activeTeam === 'home') {
      setHomeLineup(updatedLineup);
    } else {
      setAwayLineup(updatedLineup);
    }

    toast.success('Player removed from lineup');
  };

  const handleConfirmLineup = async () => {
    const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup;
    if (!currentLineup) return;

    const emptySlots = currentLineup.players.filter((p) => p.id.startsWith('empty'));
    if (emptySlots.length > 0) {
      toast.error(`Please fill all ${emptySlots.length} position(s)`);
      return;
    }

    setIsSaving(true);
    try {
      const updatedLineup = {
        ...currentLineup,
        confirmed: true,
        lastUpdated: new Date().toISOString(),
      };

      if (activeTeam === 'home') {
        setHomeLineup(updatedLineup);
      } else {
        setAwayLineup(updatedLineup);
      }

      toast.success(`${activeTeam === 'home' ? match?.homeTeam.name : match?.awayTeam.name} lineup confirmed!`);
    } catch (error) {
      console.error('Error confirming lineup:', error);
      toast.error('Failed to confirm lineup');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLineup = async () => {
    await handleConfirmLineup();
  };

  const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup;
  const formation = FORMATIONS.find((f) => f.code === selectedFormation);
  const filledSlots = currentLineup?.players.filter((p) => !p.id.startsWith('empty')).length || 0;
  const totalSlots = currentLineup?.players.length || 11;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading lineup builder...</p>
        </div>
      </div>
    );
  }

  if (!match || !currentLineup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900">Error loading lineup</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href={`/dashboard/matches/${matchId}`}>
            <Button variant="ghost" className="mb-4 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Match
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 mb-2">
                Lineup Builder
              </h1>
              <p className="text-charcoal-600">
                {match.homeTeam.name} vs {match.awayTeam.name} • {new Date(match.date).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSaveLineup}
                disabled={isSaving || filledSlots < totalSlots}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white"
                onClick={handleConfirmLineup}
                disabled={isSaving || filledSlots < totalSlots}
              >
                {currentLineup.confirmed ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Lineup
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-4 border-b border-neutral-200">
            <button
              onClick={() => setActiveTeam('home')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTeam === 'home'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              {match.homeTeam.name}
            </button>
            <button
              onClick={() => setActiveTeam('away')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTeam === 'away'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              {match.awayTeam.name}
            </button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Formation</CardTitle>
            <CardDescription>Choose your tactical setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {FORMATIONS.map((form) => (
                <button
                  key={form.code}
                  onClick={() => handleFormationChange(form.code)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedFormation === form.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-bold text-charcoal-900 text-lg">{form.name}</p>
                  <p className="text-sm text-charcoal-600 mt-1">{form.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-charcoal-900">
              Lineup Completion
            </p>
            <Badge>
              {filledSlots}/{totalSlots} players
            </Badge>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-400 h-2 rounded-full transition-all"
              style={{ width: `${(filledSlots / totalSlots) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Shield className="w-5 h-5 inline mr-2" />
                  Pitch Positioning
                </CardTitle>
                <CardDescription>{formation?.name} Formation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-green-100 rounded-lg p-8 min-h-[600px] relative">
                  <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ pointerEvents: 'none' }}
                  >
                    <line
                      x1="0"
                      y1="50%"
                      x2="100%"
                      y2="50%"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="80"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>

                  <div className="relative z-10 space-y-6">
                    {formation?.positions.map((pos, idx) => {
                      const player = currentLineup.players[idx];
                      const isOccupied = !player.id.startsWith('empty');

                      return (
                        <div key={idx} className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedPlayerSlot(idx);
                              setShowPlayerPicker(true);
                            }}
                            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all font-bold text-white ${
                              isOccupied
                                ? 'bg-blue-600 border-blue-800 hover:bg-blue-700'
                                : 'bg-neutral-400 border-neutral-500 hover:bg-neutral-500'
                            }`}
                          >
                            {isOccupied ? (
                              <>
                                <span className="text-sm">{player.name}</span>
                                <span className="text-lg">#{player.number}</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-6 h-6" />
                                <span className="text-xs mt-1">{pos}</span>
                              </>
                            )}
                          </button>

                          {isOccupied && (
                            <button
                              onClick={() => handleRemovePlayer(idx)}
                              className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lineup Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Formation</p>
                  <Badge className="bg-blue-100 text-blue-700">
                    {formation?.name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Completion</p>
                  <Badge
                    className={
                      filledSlots === totalSlots
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {filledSlots}/{totalSlots} players
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Confirmation</p>
                  <Badge
                    className={
                      currentLineup.confirmed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {currentLineup.confirmed ? '✓ Confirmed' : '⊘ Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Squad Roster</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availablePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        if (selectedPlayerSlot !== null) {
                          handleSelectPlayer(player, selectedPlayerSlot);
                        }
                      }}
                      className="w-full text-left p-2 hover:bg-blue-50 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-charcoal-900">#{player.number} {player.name}</p>
                          <p className="text-xs text-charcoal-600">{player.position}</p>
                        </div>
                        {selectedPlayerSlot !== null && (
                          <Plus className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showPlayerPicker && selectedPlayerSlot !== null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <h2 className="text-2xl font-bold text-charcoal-900">
                  Select Player
                </h2>
                <button
                  onClick={() => {
                    setShowPlayerPicker(false);
                    setSelectedPlayerSlot(null);
                  }}
                  className="text-charcoal-500 hover:text-charcoal-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {availablePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectPlayer(player, selectedPlayerSlot)}
                      className="p-4 border border-neutral-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                    >
                      <p className="font-bold text-charcoal-900">
                        #{player.number} {player.name}
                      </p>
                      <p className="text-sm text-charcoal-600 mt-1">
                        {player.position}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
