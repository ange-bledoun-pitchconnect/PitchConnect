'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Edit,
  Save,
  X,
  Loader2,
  Trophy,
  MapPin,
  Calendar,
  Shield,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlayerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  preferredFoot: string;
  height: number | null;
  weight: number | null;
  jerseyNumber: number | null;
  bio: string | null;
  status: string;
  stats: {
    totalTeams: number;
    totalMatches: number;
    totalGoals: number;
  };
}

export default function PlayerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<PlayerProfile>>({});

  const positions = [
    'GOALKEEPER',
    'DEFENDER',
    'MIDFIELDER',
    'FORWARD',
    'STRIKER',
    'WINGER',
    'CENTER_BACK',
    'FULL_BACK',
  ];

  const preferredFeet = ['LEFT', 'RIGHT', 'BOTH'];

  useEffect(() => {
    fetchPlayerProfile();
  }, []);

  const fetchPlayerProfile = async () => {
    try {
      const response = await fetch('/api/player/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setProfile(data.profile);
      setEditData(data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/player/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      setProfile(data.profile);
      setIsEditing(false);
      toast.success('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile || {});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <User className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 mb-2">Profile not found</p>
          <p className="text-charcoal-600 mb-6">Unable to load your player profile</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>

              <div>
                <h1 className="text-4xl font-bold text-charcoal-900 mb-2">
                  {profile.firstName} {profile.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    {profile.position.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">{profile.preferredFoot} FOOTED</Badge>
                  {profile.jerseyNumber && <Badge>#{profile.jerseyNumber}</Badge>}
                  <Badge
                    className={
                      profile.status === 'ACTIVE'
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : ''
                    }
                  >
                    {profile.status}
                  </Badge>
                </div>
              </div>
            </div>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Teams</p>
                  <p className="text-3xl font-bold text-charcoal-900">{profile.stats.totalTeams}</p>
                </div>
                <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Matches</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {profile.stats.totalMatches}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Goals</p>
                  <p className="text-3xl font-bold text-charcoal-900">{profile.stats.totalGoals}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gold-500" />
              Profile Information
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update your player profile details'
                : 'Your player profile information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={editData.firstName || ''}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  />
                ) : (
                  <p className="text-charcoal-900 font-medium">{profile.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={editData.lastName || ''}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  />
                ) : (
                  <p className="text-charcoal-900 font-medium">{profile.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                {isEditing ? (
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editData.dateOfBirth?.split('T')[0] || ''}
                    onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                  />
                ) : (
                  <p className="text-charcoal-900 font-medium">
                    {new Date(profile.dateOfBirth).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Nationality
                </Label>
                {isEditing ? (
                  <Input
                    id="nationality"
                    value={editData.nationality || ''}
                    onChange={(e) => setEditData({ ...editData, nationality: e.target.value })}
                  />
                ) : (
                  <p className="text-charcoal-900 font-medium">{profile.nationality}</p>
                )}
              </div>
            </div>

            {/* Playing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                {isEditing ? (
                  <select
                    id="position"
                    value={editData.position || ''}
                    onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-charcoal-900 font-medium">
                    {profile.position.replace('_', ' ')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredFoot">Preferred Foot</Label>
                {isEditing ? (
                  <select
                    id="preferredFoot"
                    value={editData.preferredFoot || ''}
                    onChange={(e) => setEditData({ ...editData, preferredFoot: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    {preferredFeet.map((foot) => (
                      <option key={foot} value={foot}>
                        {foot}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-charcoal-900 font-medium">{profile.preferredFoot}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jerseyNumber">Jersey Number</Label>
                {isEditing ? (
                  <Input
                    id="jerseyNumber"
                    type="number"
                    min="1"
                    max="99"
                    value={editData.jerseyNumber || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, jerseyNumber: parseInt(e.target.value) })
                    }
                  />
                ) : (
                  <p className="text-charcoal-900 font-medium">
                    {profile.jerseyNumber || 'Not set'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                {isEditing ? (
                  <Input
                    id="height"
                    type="number"
                    value={editData.height || ''}
                    onChange={(e) => setEditData({ ...editData, height: parseInt(e.target.value) })}
                  />
                ) : (
                  <p className="text-charcoal-900 font-medium">{profile.height || 'Not set'} cm</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                {isEditing ? (
                  <Input
                    id="weight"
                    type="number"
                    value={editData.weight || ''}
                    onChange={(e) => setEditData({ ...editData, weight: parseInt(e.target.value) })}
                  />
                ) : (
                  <p className="text-charcoal-900 font-medium">{profile.weight || 'Not set'} kg</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <textarea
                  id="bio"
                  value={editData.bio || ''}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-charcoal-700 leading-relaxed">
                  {profile.bio || 'No bio added yet.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
