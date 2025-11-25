'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  Shield,
  Search,
  X,
  Check,
  Clock,
  Send,
  Trash2,
  UserPlus,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  category: string;
  club: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  isInLeague: boolean;
  joinedAt?: string;
}

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  message?: string;
}

interface League {
  id: string;
  name: string;
  code: string;
  sport: string;
  configuration?: {
    maxTeams?: number;
    registrationOpen: boolean;
  };
}

export default function TeamsManagementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagueData();
    fetchInvitations();
  }, [id]);

  const fetchLeagueData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch league details
      const leagueRes = await fetch(`/api/leagues/${id}`);
      if (!leagueRes.ok) throw new Error('Failed to fetch league');
      const leagueData = await leagueRes.json();
      setLeague(leagueData);

      // Fetch available teams (includes teams in league)
      const teamsRes = await fetch(`/api/leagues/${id}/available-teams`);
      if (!teamsRes.ok) throw new Error('Failed to fetch teams');
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams || []);
    } catch (error) {
      console.error('Error fetching league data:', error);
      toast.error('Failed to load league data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/leagues/${id}/invitations`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleOpenInviteModal = () => {
    setShowInviteModal(true);
  };

  const handleSendInvitation = async () => {
    if (!selectedTeam) return;

    setIsSendingInvite(true);
    try {
      const response = await fetch(`/api/leagues/${id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          message: invitationMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      toast.success(`✅ Invitation sent to ${selectedTeam.name}`);
      setShowInviteModal(false);
      setSelectedTeam(null);
      setInvitationMessage('');
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const response = await fetch(`/api/leagues/${id}/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel invitation');

      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to remove ${teamName} from the league?`)) return;

    setRemovingTeamId(teamId);
    try {
      const response = await fetch(`/api/leagues/${id}/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove team');

      toast.success(`${teamName} removed from league`);
      fetchLeagueData();
    } catch (error) {
      console.error('Error removing team:', error);
      toast.error('Failed to remove team');
    } finally {
      setRemovingTeamId(null);
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableTeams = filteredTeams.filter((t) => !t.isInLeague);
  const teamsInLeague = filteredTeams.filter((t) => t.isInLeague);

  const canAddMoreTeams = !league?.configuration?.maxTeams || 
    teamsInLeague.length < league.configuration.maxTeams;

  const registrationOpen = league?.configuration?.registrationOpen ?? true;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/leagues/${id}`)}
            className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to League
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white">Team Management</h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  {league?.name} • {teamsInLeague.length} team{teamsInLeague.length !== 1 ? 's' : ''}
                  {league?.configuration?.maxTeams && ` / ${league.configuration.maxTeams} max`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {registrationOpen && canAddMoreTeams && (
                <Button
                  onClick={handleOpenInviteModal}
                  className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Team
                </Button>
              )}
              {!registrationOpen && (
                <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  Registration Closed
                </Badge>
              )}
              {!canAddMoreTeams && (
                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                  League Full
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 dark:text-charcoal-500 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams by name, club, or city..."
                className="pl-10 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Teams in League</p>
                <p className="text-3xl font-bold text-gold-600 dark:text-gold-400">{teamsInLeague.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Pending Invitations</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{invitations.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Available Teams</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{availableTeams.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <Clock className="w-5 h-5 text-gold-500" />
                Pending Invitations ({invitations.length})
              </CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Teams you've invited that haven't responded yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900/30 rounded-lg flex items-center justify-center">
                        <Send className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-900 dark:text-white">
                          {invitation.teamName}
                        </p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          Invited {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-300">
                        {invitation.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams Already in League */}
        {teamsInLeague.length > 0 && (
          <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Teams in League ({teamsInLeague.length})
              </CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Teams currently participating in this league
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamsInLeague.map((team) => (
                  <Card
                    key={team.id}
                    className="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-charcoal-900 dark:text-white">{team.name}</p>
                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{team.club.name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeam(team.id, team.name)}
                          disabled={removingTeamId === team.id}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {removingTeamId === team.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-charcoal-500 dark:text-charcoal-400" />
                        <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          {team.club.city}, {team.club.country}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600">
                          {team.ageGroup}
                        </Badge>
                        <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                          {team.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Teams */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              <Plus className="w-5 h-5 text-gold-500" />
              Available Teams ({availableTeams.length})
            </CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Teams that can be invited to join this league
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">
                  No available teams
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  All teams have been added or invited to the league
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-200 dark:border-charcoal-600 hover:shadow-lg dark:hover:shadow-charcoal-900/30 hover:border-gold-300 dark:hover:border-gold-600 transition-all"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                          </div>
                          <div>
                            <p className="font-bold text-charcoal-900 dark:text-white">{team.name}</p>
                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{team.club.name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-charcoal-500 dark:text-charcoal-400" />
                        <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          {team.club.city}, {team.club.country}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600">
                          {team.ageGroup}
                        </Badge>
                        <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                          {team.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowInviteModal(true);
                        }}
                        disabled={!registrationOpen || !canAddMoreTeams}
                        className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite to League
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Team Modal */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-charcoal-900 dark:text-white">Invite Team</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedTeam(null);
                    setInvitationMessage('');
                  }}
                  className="text-charcoal-600 dark:text-charcoal-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Send an invitation to {selectedTeam.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Team Info */}
                <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal-900 dark:text-white">{selectedTeam.name}</p>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{selectedTeam.club.name}</p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-charcoal-700 dark:text-charcoal-300">
                    Invitation Message (Optional)
                  </Label>
                  <textarea
                    id="message"
                    value={invitationMessage}
                    onChange={(e) => setInvitationMessage(e.target.value)}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                    className="w-full mt-2 px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedTeam(null);
                      setInvitationMessage('');
                    }}
                    className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendInvitation}
                    disabled={isSendingInvite}
                    className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                  >
                    {isSendingInvite ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
