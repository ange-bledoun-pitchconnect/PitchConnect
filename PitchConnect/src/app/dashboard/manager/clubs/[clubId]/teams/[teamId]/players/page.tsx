'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Edit3,
  Crown,
  ShirtIcon,
  Mail,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  userId: string;
  position?: string;
  jerseyNumber?: number;
  isCaptain: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  _count: {
    players: number;
    coaches: number;
  };
}

export default function TeamPlayersPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');

  const positions = [
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward',
    'Winger',
    'Striker',
  ];

  useEffect(() => {
    fetchTeamAndPlayers();
  }, []);

  const fetchTeamAndPlayers = async () => {
    try {
      setIsLoading(true);
      const [teamRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (!teamRes.ok) throw new Error('Failed to fetch team');
      if (!playersRes.ok) throw new Error('Failed to fetch players');

      const teamData = await teamRes.json();
      const playersData = await playersRes.json();

      setTeam(teamData);
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPlayerEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setIsAddingPlayer(true);

      // First, find user by email
      const userRes = await fetch(`/api/users/search?email=${encodeURIComponent(newPlayerEmail)}`);
      if (!userRes.ok) {
        toast.error('User not found with that email');
        return;
      }

      const userData = await userRes.json();

      // Add player to team
      const response = await fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          position: selectedPosition || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add player');
      }

      const newPlayer = await response.json();
      setPlayers([newPlayer, ...players]);
      setNewPlayerEmail('');
      setSelectedPosition('');
      toast.success('Player added successfully!');
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add player');
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to remove this player from the team?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/players/${playerId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove player');

      setPlayers(players.filter((p) => p.id !== playerId));
      toast.success('Player removed successfully');
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove player');
    }
  };

  const handleToggleCaptain = async (playerId: string, isCaptain: boolean) => {
    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/players/${playerId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCaptain: !isCaptain }),
        }
      );

      if (!response.ok) throw new Error('Failed to update player');

      const updatedPlayer = await response.json();
      setPlayers(players.map((p) => (p.id === playerId ? updatedPlayer : p)));
      toast.success(isCaptain ? 'Removed captain' : 'Made captain');
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    }
  };

  const filteredPlayers = players.filter((p) =>
    `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Club
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                {team?.name} - Roster
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Manage your team's players
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Player Form */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Add Player</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Find and add players to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPlayer} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Player Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPlayerEmail}
                    onChange={(e) => setNewPlayerEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="position" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Position
                  </Label>
                  <select
                    id="position"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all"
                  >
                    <option value="">Select position...</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isAddingPlayer}
                  className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold"
                >
                  {isAddingPlayer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Player
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Players List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-charcoal-400 dark:text-charcoal-500" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 text-charcoal-900 dark:text-white"
              />
            </div>

            {/* Players Grid */}
            {filteredPlayers.length === 0 ? (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                    No players yet
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    Add your first player to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlayers.map((player) => (
                  <Card
                    key={player.id}
                    className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-charcoal-900 dark:text-white">
                              {player.user.firstName} {player.user.lastName}
                            </h3>
                            {player.isCaptain && (
                              <Crown className="w-4 h-4 text-gold-500" title="Captain" />
                            )}
                          </div>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {player.user.email}
                          </p>
                        </div>
                      </div>

                      {player.position && (
                        <div className="mb-4 p-2 bg-neutral-100 dark:bg-charcoal-700 rounded-lg">
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 uppercase font-semibold">
                            Position
                          </p>
                          <p className="text-sm font-medium text-charcoal-900 dark:text-white">
                            {player.position}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCaptain(player.id, player.isCaptain)}
                          className="text-gold-600 dark:text-gold-400 hover:bg-gold-100 dark:hover:bg-gold-900/30"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          {player.isCaptain ? 'Remove' : 'Make'} Captain
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Stats */}
            <Card className="bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/10 dark:to-orange-900/10 border-neutral-200 dark:border-charcoal-700">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Total Players</p>
                    <p className="text-2xl font-bold text-gold-600 dark:text-gold-400">
                      {players.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Captains</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {players.filter((p) => p.isCaptain).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">With Position</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {players.filter((p) => p.position).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
