/**
 * Profile Settings Page
 * Edit user and player profile information
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Save, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'demo.player@pitchconnect.com',
    phone: '+44 7911 123456',
    dateOfBirth: '2000-05-15',
    nationality: 'England',
    position: 'Midfielder',
    height: '185',
    weight: '78',
    preferredFoot: 'Right',
    bio: 'Professional footballer - Arsenal FC',
  });

  async function handleSave() {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
          <p className="text-foreground/70">Update your personal information</p>
        </div>

        {/* Profile Picture */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-gold to-brand-purple flex items-center justify-center text-3xl font-bold text-white">
                JS
              </div>

              {/* Upload Button */}
              <div className="space-y-2">
                <Button className="btn-primary flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Change Picture
                </Button>
                <p className="text-xs text-foreground/60">
                  Max size: 5MB (JPG, PNG)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Contact Info */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled
              />
              <p className="text-xs text-foreground/60">
                Email cannot be changed. Contact support to update.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="nationality" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Nationality
              </Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-foreground/60">
                Max 500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Football Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Football Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <select
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option>Goalkeeper</option>
                <option>Defender</option>
                <option>Midfielder</option>
                <option>Forward</option>
              </select>
            </div>

            {/* Physical Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>

            {/* Preferred Foot */}
            <div className="space-y-2">
              <Label htmlFor="foot">Preferred Foot</Label>
              <select
                id="foot"
                value={formData.preferredFoot}
                onChange={(e) => setFormData({ ...formData, preferredFoot: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option>Left</option>
                <option>Right</option>
                <option>Both</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button 
            className="btn-primary flex items-center gap-2 flex-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="glass border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full text-red-600 hover:bg-red-500/10">
              Delete Account
            </Button>
            <p className="text-xs text-foreground/60">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
