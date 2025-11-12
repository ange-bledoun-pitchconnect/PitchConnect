/**
 * Profile Settings Page
 * Edit user profile with user type badge
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, User, Shield, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    firstName: 'Demo',
    lastName: 'Player',
    email: session?.user?.email || '',
    bio: 'Football enthusiast and player',
  });

  const handleSave = async () => {
    toast.success('Profile updated successfully!');
  };

  // Determine user type from session
  const userType = (session?.user as any)?.type || 'PLAYER';
  const isCoach = userType === 'COACH';

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header with User Type Badge */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">Profile Settings</h1>
            {/* USER TYPE BADGE */}
            <Badge className={isCoach ? 'bg-purple-500/20 text-purple-700' : 'bg-blue-500/20 text-blue-700'}>
              {isCoach ? '🏅 Coach Account' : '⚽ Player Account'}
            </Badge>
          </div>
          <p className="text-foreground/70">Edit your profile information</p>
        </div>

        {/* User Type Information Card */}
        <Card className="glass border-brand-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-gold" />
              Account Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-brand-gold/10 to-brand-purple/10 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  {isCoach ? (
                    <>
                      <Trophy className="w-6 h-6 text-purple-600" />
                      <span className="text-lg font-bold text-purple-700">Coach</span>
                    </>
                  ) : (
                    <>
                      <User className="w-6 h-6 text-blue-600" />
                      <span className="text-lg font-bold text-blue-700">Player</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-foreground/70">
                  {isCoach
                    ? 'You have access to coaching tools, team management, and tactical features.'
                    : 'You have access to player statistics, team participation, and personal performance tracking.'}
                </p>
              </div>

              {isCoach && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Coach Features:</h4>
                  <ul className="text-sm text-foreground/70 space-y-1">
                    <li>✓ Manage multiple teams</li>
                    <li>✓ Create tactical formations</li>
                    <li>✓ Plan training sessions</li>
                    <li>✓ Track player performance</li>
                    <li>✓ Manage match lineups</li>
                  </ul>
                </div>
              )}

              {!isCoach && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Player Features:</h4>
                  <ul className="text-sm text-foreground/70 space-y-1">
                    <li>✓ Track personal statistics</li>
                    <li>✓ View upcoming fixtures</li>
                    <li>✓ Manage team participation</li>
                    <li>✓ View achievements</li>
                    <li>✓ Connect with coaches</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-foreground/60">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <Button onClick={handleSave} className="w-full btn-primary">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm">Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/60">Status</span>
              <span className="font-semibold text-green-600">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Verification</span>
              <span className="font-semibold text-green-600">✓ Verified</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Account Type</span>
              <Badge variant="outline">{userType}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
