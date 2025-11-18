/**
 * Profile Settings Page
 * Edit user profile with comprehensive account management
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  User,
  Shield,
  Trophy,
  Camera,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SessionUser {
  email?: string;
  userType?: string;
  name?: string;
  image?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  phone?: string;
}

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: 'Demo',
    lastName: 'Player',
    email: session?.user?.email || '',
    bio: 'Football enthusiast and competitive player',
    phone: '+44 123 456 7890',
  });

  const sessionUser = session?.user as SessionUser | undefined;
  const userType = sessionUser?.userType || 'PLAYER';
  const isCoach = userType === 'COACH';
  const isManager = userType === 'MANAGER';
  const isLeagueAdmin = userType === 'LEAGUE_ADMIN';
  const isSuperAdmin = userType === 'SUPERADMIN';

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Profile updated successfully!');
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getUserTypeInfo = () => {
    switch (userType) {
      case 'COACH':
        return {
          label: 'Coach Account',
          color: 'from-purple-600 to-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-300',
          icon: Trophy,
          features: [
            '✓ Manage multiple teams',
            '✓ Create tactical formations',
            '✓ Plan training sessions',
            '✓ Track player performance',
            '✓ Manage match lineups',
          ],
        };
      case 'MANAGER':
        return {
          label: 'Manager Account',
          color: 'from-blue-600 to-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          icon: Users,
          features: [
            '✓ Manage clubs',
            '✓ Oversee multiple teams',
            '✓ Access club analytics',
            '✓ Manage budgets',
            '✓ Player approvals',
          ],
        };
      case 'LEAGUE_ADMIN':
        return {
          label: 'League Admin Account',
          color: 'from-green-600 to-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          icon: Shield,
          features: [
            '✓ Manage competitions',
            '✓ Update standings',
            '✓ Schedule matches',
            '✓ Moderate teams',
            '✓ Generate reports',
          ],
        };
      case 'SUPERADMIN':
        return {
          label: 'Super Admin Account',
          color: 'from-red-600 to-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          icon: Shield,
          features: [
            '✓ Full system access',
            '✓ User management',
            '✓ Role assignments',
            '✓ System settings',
            '✓ Audit logs',
          ],
        };
      default:
        return {
          label: 'Player Account',
          color: 'from-blue-600 to-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          icon: User,
          features: [
            '✓ Track personal statistics',
            '✓ View upcoming fixtures',
            '✓ Manage team participation',
            '✓ View achievements',
            '✓ Connect with coaches',
          ],
        };
    }
  };

  const userTypeInfo = getUserTypeInfo();
  const IconComponent = userTypeInfo.icon;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-4xl font-bold text-charcoal-900">Profile Settings</h1>
          <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 bg-gradient-to-r ${userTypeInfo.color} text-white shadow-md`}>
            <IconComponent className="w-5 h-5" />
            {userTypeInfo.label}
          </div>
        </div>
        <p className="text-charcoal-600">Manage your account and personal information</p>
      </div>

      {/* ACCOUNT TYPE CARD */}
      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className={`bg-gradient-to-r ${userTypeInfo.color} text-white pb-4`}>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Account Type & Features
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className={`p-6 bg-gradient-to-br ${userTypeInfo.bgColor} border-2 ${userTypeInfo.borderColor} rounded-xl`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${userTypeInfo.color} rounded-xl flex items-center justify-center text-white`}>
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <p className="text-lg font-bold text-charcoal-900">{userTypeInfo.label}</p>
                <p className="text-sm text-charcoal-600">Account verified and active</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <p className="text-sm font-bold text-charcoal-700 uppercase tracking-wider mb-3">Available Features</p>
            <div className="grid md:grid-cols-2 gap-3">
              {userTypeInfo.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-gold-300 transition-all">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-charcoal-700 font-medium">{feature.substring(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PROFILE INFORMATION */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-6 h-6 text-gold-600" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-gold-300 text-gold-600 hover:bg-gold-50 font-semibold"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {/* Profile Picture Section */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <p className="text-xs text-charcoal-700 font-bold uppercase tracking-wider mb-4">Profile Picture</p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-orange-400 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {formData.firstName.charAt(0)}
              </div>
              {isEditing && (
                <Button
                  variant="outline"
                  className="border-gold-300 text-gold-600 hover:bg-gold-50 font-semibold"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-charcoal-700 font-semibold">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                className={`${!isEditing ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed' : 'border-gold-300 focus:border-gold-500'}`}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-charcoal-700 font-semibold">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                className={`${!isEditing ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed' : 'border-gold-300 focus:border-gold-500'}`}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-charcoal-700 font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold-500" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-neutral-50 border-neutral-200 cursor-not-allowed"
            />
            <p className="text-xs text-charcoal-500">Email cannot be changed. Contact support if needed.</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-charcoal-700 font-semibold">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className={`${!isEditing ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed' : 'border-gold-300 focus:border-gold-500'}`}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-charcoal-700 font-semibold">
              Bio
            </Label>
            <textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              className={`w-full p-3 rounded-lg border-2 focus:outline-none transition-all resize-none h-24 ${
                !isEditing
                  ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed'
                  : 'border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200'
              }`}
            />
            <p className="text-xs text-charcoal-500">{formData.bio.length}/500 characters</p>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACCOUNT STATUS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm text-charcoal-700 font-medium">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="font-bold text-green-600">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-charcoal-700 font-medium">Verification</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-600">Verified</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gold-50 rounded-lg border border-gold-200">
              <span className="text-sm text-charcoal-700 font-medium">Account Type</span>
              <span className="font-bold text-gold-600">{userType}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-sm text-charcoal-700 font-medium">Member Since</span>
              <span className="font-bold text-charcoal-900">Jan 15, 2024</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DANGER ZONE */}
      <Card className="bg-white border border-red-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-red-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-6 h-6" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-medium mb-3">Account Actions</p>
            <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 font-semibold">
              <AlertCircle className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
            <p className="text-xs text-red-600 mt-2">Once you delete your account, there is no going back. Please be certain.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
