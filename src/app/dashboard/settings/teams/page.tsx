/**
 * Teams Settings Page
 * Manage team memberships, roles, and team-related settings
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Clock,
  Crown,
  AlertCircle,
  CheckCircle,
  Search,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'CAPTAIN' | 'MANAGER' | 'PLAYER';
  position?: string;
  joinedDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

interface Team {
  id: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'COACH' | 'PLAYER';
  members: number;
  joinedDate: string;
  status: 'ACTIVE' | 'LEFT' | 'PENDING';
}

export default function TeamsSettingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>('1');

  const teams: Team[] = [
    {
      id: '1',
      name: 'Arsenal FC',
      role: 'PLAYER',
      members: 25,
      joinedDate: '2024-01-15',
      status: 'ACTIVE',
    },
    {
      id: '2',
      name: 'Power League',
      role: 'MANAGER',
      members: 18,
      joinedDate: '2024-03-20',
      status: 'ACTIVE',
    },
    {
      id: '3',
      name: 'Youth Academy',
      role: 'PLAYER',
      members: 30,
      joinedDate: '2023-09-10',
      status: 'ACTIVE',
    },
  ];

  const teamMembers: Record<string, TeamMember[]> = {
    '1': [
      {
        id: '1',
        name: 'John Smith',
        email: 'john@arsenal.com',
        role: 'CAPTAIN',
        position: 'Midfielder',
        joinedDate: '2024-01-15',
        status: 'ACTIVE',
      },
      {
        id: '2',
        name: 'Sarah Brown',
        email: 'sarah@arsenal.com',
        role: 'PLAYER',
        position: 'Goalkeeper',
        joinedDate: '2024-02-20',
        status: 'ACTIVE',
      },
      {
        id: '3',
        name: 'Marcus Johnson',
        email: 'marcus@arsenal.com',
        role: 'MANAGER',
        joinedDate: '2024-01-10',
        status: 'ACTIVE',
      },
      {
        id: '4',
        name: 'Emma Wilson',
        email: 'emma@arsenal.com',
        role: 'PLAYER',
        position: 'Forward',
        joinedDate: '2024-03-15',
        status: 'PENDING',
      },
    ],
    '2': [
      {
        id: '5',
        name: 'You',
        email: 'user@example.com',
        role: 'MANAGER',
        joinedDate: '2024-03-20',
        status: 'ACTIVE',
      },
    ],
    '3': [
      {
        id: '6',
        name: 'Alex Taylor',
        email: 'alex@academy.com',
        role: 'PLAYER',
        position: 'Defender',
        joinedDate: '2023-09-10',
        status: 'ACTIVE',
      },
    ],
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const members = selectedTeamId ? teamMembers[selectedTeamId] || [] : [];
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveTeam = (teamId: string) => {
    toast.success('You have left the team');
  };

  const handleRemoveMember = (memberId: string) => {
    toast.success('Member removed from team');
  };

  const handlePromoteMember = (memberId: string) => {
    toast.success('Member promoted');
  };

  const handleResendInvite = (memberId: string) => {
    toast.success('Invitation sent');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4 text-gold-600" />;
      case 'CAPTAIN':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'MANAGER':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'COACH':
        return <UserCheck className="w-4 h-4 text-orange-600" />;
      default:
        return <Users className="w-4 h-4 text-charcoal-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-gold-100 text-gold-700 border-gold-300';
      case 'CAPTAIN':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'COACH':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Team Management</h1>
        <p className="text-charcoal-600">Manage your teams and team memberships</p>
      </div>

      {/* MY TEAMS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            My Teams
          </CardTitle>
          <CardDescription>Teams you are a member of</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-101 ${
                  selectedTeamId === team.id
                    ? 'border-gold-500 bg-gold-50 shadow-md'
                    : 'border-neutral-200 bg-neutral-50 hover:border-gold-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-charcoal-900 text-lg">{team.name}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getRoleColor(
                          team.role
                        )}`}
                      >
                        {getRoleIcon(team.role)}
                        {team.role}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(team.status)}`}>
                        {team.status}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Joined {new Date(team.joinedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-charcoal-900">{team.members}</p>
                    <p className="text-xs text-charcoal-600">members</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Join Team
          </Button>
        </CardContent>
      </Card>

      {/* TEAM MEMBERS */}
      {selectedTeam && (
        <Card className="bg-white border border-neutral-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-gold-600" />
                  Team Members
                </CardTitle>
                <CardDescription>{selectedTeam.name}</CardDescription>
              </div>
              {selectedTeam.role === 'MANAGER' || selectedTeam.role === 'OWNER' ? (
                <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-charcoal-400" />
              <Input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 border-gold-300 focus:border-gold-500"
              />
            </div>

            {/* Members List */}
            <div className="space-y-3">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-gold-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-charcoal-900">{member.name}</p>
                            <p className="text-xs text-charcoal-600">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs mt-2">
                          <span
                            className={`px-2 py-1 rounded-full font-semibold border flex items-center gap-1 ${getRoleColor(
                              member.role
                            )}`}
                          >
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>
                          {member.position && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {member.position}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full font-semibold ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                          <span className="px-2 py-1 bg-neutral-200 text-neutral-700 rounded-full">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(member.joinedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {member.status === 'PENDING' ? (
                          <Button
                            onClick={() => handleResendInvite(member.id)}
                            size="sm"
                            variant="outline"
                            className="border-gold-300 text-gold-600 hover:bg-gold-50 font-semibold"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        ) : null}

                        {(selectedTeam.role === 'MANAGER' || selectedTeam.role === 'OWNER') &&
                        member.role !== 'CAPTAIN' ? (
                          <Button
                            onClick={() => handlePromoteMember(member.id)}
                            size="sm"
                            variant="outline"
                            className="border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold"
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                        ) : null}

                        {(selectedTeam.role === 'MANAGER' || selectedTeam.role === 'OWNER') &&
                        member.email !== 'user@example.com' ? (
                          <Button
                            onClick={() => handleRemoveMember(member.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8">
                  <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-charcoal-600 font-medium">No members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TEAM SETTINGS */}
      {selectedTeam && (
        <Card className="bg-white border border-neutral-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Team Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {selectedTeam.role === 'MANAGER' || selectedTeam.role === 'OWNER' ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-bold text-charcoal-900 mb-2">Team Permissions</p>
                  <div className="space-y-2 text-sm text-charcoal-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      Allow members to edit team info
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      Allow members to invite others
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      Make team searchable
                    </label>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-gold-300 text-gold-600 hover:bg-gold-50 font-semibold"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Team Info
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-charcoal-600">
                  You are a {selectedTeam.role.toLowerCase()} in this team. Team settings are managed by team
                  managers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LEAVE TEAM */}
      {selectedTeam && selectedTeam.role !== 'OWNER' && (
        <Card className="bg-white border border-red-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-red-50 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-6 h-6" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
              <p className="text-sm text-red-700 font-medium">
                Leaving this team will remove you from all team activities and communications.
              </p>
            </div>
            <Button
              onClick={() => handleRemoveTeam(selectedTeam.id)}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 font-semibold"
            >
              <UserX className="w-4 h-4 mr-2" />
              Leave Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
