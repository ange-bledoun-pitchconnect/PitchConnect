'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  Plus,
  Settings,
  Loader2,
  Mail,
  Shield,
  UserMinus,
  Trophy,
  Edit,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddMemberModal from '@/components/teams/AddMemberModal';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  ageGroup: string;
  category: string;
  status: string;
  members: TeamMember[];
  _count: {
    members: number;
  };
}

export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}`);
      if (!response.ok) throw new Error('Failed to fetch team');

      const data = await response.json();
      setTeam(data.team);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) return;

    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');

      toast.success('✅ Member removed successfully');
      fetchTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleChangeMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update member role');

      toast.success('✅ Member role updated');
      fetchTeamData();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member role');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'COACH':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'PLAYER':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'STAFF':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 mb-2">Team not found</p>
          <p className="text-charcoal-600 mb-6">
            The team you're looking for doesn't exist or you don't have access
          </p>
          <Button
            onClick={() => router.push(`/dashboard/clubs/${clubId}`)}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Club
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/clubs/${clubId}`)}
            className="mb-4 hover:bg-gold-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Club
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900">
                    {team.name}
                  </h1>
                  <Badge className="bg-gold-100 text-gold-700 border-gold-300">
                    {team.ageGroup}
                  </Badge>
                  <Badge variant="outline">{team.category.replace('_', ' ')}</Badge>
                  <Badge
                    variant={team.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={
                      team.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-300' : ''
                    }
                  >
                    {team.status}
                  </Badge>
                </div>
                <p className="text-charcoal-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {team._count.members} {team._count.members === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowInviteModal(true)}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
              <Button variant="outline" className="hover:bg-gold-50">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 mb-1">Managers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {team.members.filter((m) => m.role === 'MANAGER').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 mb-1">Coaches</p>
                <p className="text-2xl font-bold text-blue-600">
                  {team.members.filter((m) => m.role === 'COACH').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 mb-1">Players</p>
                <p className="text-2xl font-bold text-green-600">
                  {team.members.filter((m) => m.role === 'PLAYER').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 mb-1">Staff</p>
                <p className="text-2xl font-bold text-orange-600">
                  {team.members.filter((m) => m.role === 'STAFF').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              Team Members
            </CardTitle>
            <CardDescription>Manage your team roster and member roles</CardDescription>
          </CardHeader>
          <CardContent>
            {team.members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No members yet</h3>
                <p className="text-charcoal-600 mb-6">Add members to build your team</p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:border-gold-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-full flex items-center justify-center font-bold text-gold-700">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={`${member.user.firstName} ${member.user.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(member.user.firstName, member.user.lastName)
                        )}
                      </div>

                      {/* Member Info */}
                      <div>
                        <p className="font-semibold text-charcoal-900">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-charcoal-600">
                          <Mail className="w-3 h-3" />
                          {member.user.email}
                        </div>
                        <p className="text-xs text-charcoal-500 mt-1">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleBadgeColor(member.role)}>{member.role}</Badge>
                      <Badge
                        variant="outline"
                        className={
                          member.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : ''
                        }
                      >
                        {member.status}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleChangeMemberRole(member.id, 'MANAGER')}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Make Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChangeMemberRole(member.id, 'COACH')}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Make Coach
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChangeMemberRole(member.id, 'PLAYER')}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Make Player
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChangeMemberRole(member.id, 'STAFF')}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Make Staff
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRemoveMember(
                                member.id,
                                `${member.user.firstName} ${member.user.lastName}`
                              )
                            }
                            className="text-red-600"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Member Modal */}
      {showInviteModal && (
        <AddMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          clubId={clubId}
          teamId={teamId}
          onSuccess={fetchTeamData}
        />
      )}
    </div>
  );
}
