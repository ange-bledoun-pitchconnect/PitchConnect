'use client';

/**
 * Profile Settings Page
 * Path: /dashboard/settings/profile
 * 
 * Core Features:
 * - User profile editing (first name, last name, email, bio, phone)
 * - Profile picture upload with preview
 * - Player-specific information (position, jersey number, preferred foot)
 * - Account status display
 * - Real-time session updates
 * - Image validation and optimization
 * 
 * Schema Aligned: User, Player, Role models from Prisma
 * Session: Uses roles array for role-based conditionals
 * 
 * Business Logic:
 * - Show player-specific fields only for users with PLAYER role
 * - Avatar upload with validation (5MB max, image type)
 * - Form validation and error handling
 * - Session refresh after updates
 */

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Loader2,
  Upload,
  ArrowLeft,
  PhoneIcon,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  isSuperAdmin?: boolean;
  roles?: Array<
    | 'SUPERADMIN'
    | 'PLAYER'
    | 'PLAYER_PRO'
    | 'COACH'
    | 'CLUB_MANAGER'
    | 'CLUB_OWNER'
    | 'LEAGUE_ADMIN'
    | 'PARENT'
    | 'TREASURER'
    | 'REFEREE'
    | 'SCOUT'
    | 'ANALYST'
  >;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  phone?: string;
  position?: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD' | 'WINGER' | 'STRIKER' | '';
  jerseyNumber?: string;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  url?: string;
}

// ============================================================================
// CONSTANTS - Schema Aligned
// ============================================================================

const PLAYER_POSITIONS = [
  { id: 'GOALKEEPER', label: 'Goalkeeper' },
  { id: 'DEFENDER', label: 'Defender' },
  { id: 'MIDFIELDER', label: 'Midfielder' },
  { id: 'FORWARD', label: 'Forward' },
  { id: 'WINGER', label: 'Winger' },
  { id: 'STRIKER', label: 'Striker' },
];

const PREFERRED_FEET = [
  { id: 'LEFT', label: 'Left' },
  { id: 'RIGHT', label: 'Right' },
  { id: 'BOTH', label: 'Both' },
];

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  PLAYER: 'Player',
  PLAYER_PRO: 'Pro Player',
  COACH: 'Coach',
  CLUB_MANAGER: 'Club Manager',
  CLUB_OWNER: 'Club Owner',
  LEAGUE_ADMIN: 'League Admin',
  PARENT: 'Parent',
  TREASURER: 'Treasurer',
  REFEREE: 'Referee',
  SCOUT: 'Scout',
  ANALYST: 'Analyst',
};

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PLAYER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PLAYER_PRO: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400',
  COACH: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CLUB_MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CLUB_OWNER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  LEAGUE_ADMIN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PARENT: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  TREASURER: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  REFEREE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SCOUT: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ANALYST: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

const PHOTO_CONSTRAINTS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  minWidth: 200,
  minHeight: 200,
};

const ERROR_MESSAGES = {
  invalidFileType: 'Please upload a JPG, PNG, or WebP image',
  fileTooLarge: 'Image must be less than 5MB',
  uploadFailed: 'Failed to upload photo',
  saveFailed: 'Failed to update profile',
  nameRequired: 'First and last name are required',
  emailRequired: 'Email is required',
  saveMissing: 'Profile fields are missing',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || '');
  const [formData, setFormData] = useState<FormData>({
    firstName: session?.user?.name?.split(' ')[0] || '',
    lastName: session?.user?.name?.split(' ')[1] || '',
    email: session?.user?.email || '',
    bio: '',
    phone: '',
    position: '',
    jerseyNumber: '',
    preferredFoot: 'RIGHT',
  });

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      const userRoles = (session?.user as SessionUser)?.roles || [];
      return userRoles.includes(role as any);
    },
    [session]
  );

  /**
   * Get primary role for display
   */
  const getPrimaryRole = useCallback((): string => {
    const userRoles = (session?.user as SessionUser)?.roles || [];
    if (userRoles.length === 0) return 'User';
    return ROLE_LABELS[userRoles[0]] || userRoles[0];
  }, [session]);

  /**
   * Validate image file with proper error handling
   */
  const validateImageFile = useCallback((file: File): ValidationResult => {
    // Check file type
    if (!PHOTO_CONSTRAINTS.acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: ERROR_MESSAGES.invalidFileType,
      };
    }

    // Check file size
    if (file.size > PHOTO_CONSTRAINTS.maxSize) {
      return {
        valid: false,
        error: ERROR_MESSAGES.fileTooLarge,
      };
    }

    return { valid: true };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Save profile changes
   */
  const handleSave = useCallback(async () => {
    try {
      // Validate form
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error(ERROR_MESSAGES.nameRequired);
        return;
      }

      if (!formData.email.trim()) {
        toast.error(ERROR_MESSAGES.emailRequired);
        return;
      }

      setIsSaving(true);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || ERROR_MESSAGES.saveFailed);
      }

      const result: ApiResponse = await response.json();

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
        },
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);

      console.log('✅ Profile updated:', result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.saveFailed;
      console.error('❌ Save error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [formData, session, update]);

  /**
   * Handle photo upload with proper error handling
   */
  const handlePhotoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        // Use provided error message with fallback
        toast.error(validation.error || ERROR_MESSAGES.invalidFileType);
        return;
      }

      setIsUploadingPhoto(true);

      try {
        // Create FormData
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        // Upload to API
        const response = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || ERROR_MESSAGES.uploadFailed);
        }

        const data: ApiResponse<{ url: string }> = await response.json();
        const newAvatarUrl = data.data?.url || data.url || '';

        if (!newAvatarUrl) {
          throw new Error('No avatar URL returned from server');
        }

        setAvatarUrl(newAvatarUrl);

        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            image: newAvatarUrl,
          },
        });

        toast.success('Photo uploaded successfully!');
        console.log('✅ Avatar uploaded');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.uploadFailed;
        console.error('❌ Upload error:', errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsUploadingPhoto(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [validateImageFile, session, update]
  );

  /**
   * Trigger file input
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Cancel editing
   */
  const handleCancel = useCallback(() => {
    setFormData({
      firstName: session?.user?.name?.split(' ')[0] || '',
      lastName: session?.user?.name?.split(' ')[1] || '',
      email: session?.user?.email || '',
      bio: '',
      phone: '',
      position: '',
      jerseyNumber: '',
      preferredFoot: 'RIGHT',
    });
    setIsEditing(false);
  }, [session]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/settings')}
          className="mb-6 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Manage your personal information and profile details
          </p>
        </div>

        <div className="space-y-6">
          {/* PROFILE PICTURE CARD */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent dark:from-gold-900/20 dark:to-transparent pb-4">
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <Camera className="w-5 h-5 text-gold-500" />
                Profile Picture
              </CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Upload a profile photo (JPG, PNG, WebP - max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                {/* Avatar Display */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30 flex items-center justify-center overflow-hidden border-4 border-white dark:border-charcoal-700 shadow-lg">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        priority
                      />
                    ) : (
                      <User className="w-12 h-12 text-gold-600 dark:text-gold-400" />
                    )}
                  </div>
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Section */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                  <Button
                    onClick={triggerFileInput}
                    disabled={isUploadingPhoto}
                    className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-2">
                    Recommended: Square image, at least 200×200px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PERSONAL INFORMATION CARD */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <User className="w-5 h-5 text-blue-500" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                    Your basic profile information
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-charcoal-700 dark:text-charcoal-300"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-charcoal-700 dark:text-charcoal-300 font-medium"
                  >
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="John"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-charcoal-700 dark:text-charcoal-300 font-medium"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="Doe"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-charcoal-700 dark:text-charcoal-300 font-medium"
                >
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  placeholder="your@email.com"
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white disabled:opacity-50"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-charcoal-700 dark:text-charcoal-300 font-medium"
                >
                  <PhoneIcon className="w-4 h-4 text-blue-500" />
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+44 7700 900000"
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white disabled:opacity-50"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label
                  htmlFor="bio"
                  className="flex items-center gap-2 text-charcoal-700 dark:text-charcoal-300 font-medium"
                >
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Bio
                </Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                  className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-charcoal-900 dark:text-white dark:bg-charcoal-700 disabled:bg-neutral-50 dark:disabled:bg-charcoal-800 disabled:text-charcoal-500 dark:disabled:text-charcoal-400"
                />
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-charcoal-700">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold disabled:opacity-50"
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
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="text-charcoal-700 dark:text-charcoal-300 border-neutral-300 dark:border-charcoal-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PLAYER INFORMATION CARD - Only for players */}
          {hasRole('PLAYER') && (
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent pb-4">
                <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                  <Trophy className="w-5 h-5 text-green-500" />
                  Player Information
                </CardTitle>
                <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                  Your football-specific details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Position */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="position"
                      className="text-charcoal-700 dark:text-charcoal-300 font-medium"
                    >
                      Position
                    </Label>
                    <select
                      id="position"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          position: e.target.value as FormData['position'],
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-charcoal-900 dark:text-white dark:bg-charcoal-700 disabled:bg-neutral-50 dark:disabled:bg-charcoal-800 disabled:opacity-50"
                    >
                      <option value="">Select Position</option>
                      {PLAYER_POSITIONS.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jersey Number */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="jerseyNumber"
                      className="text-charcoal-700 dark:text-charcoal-300 font-medium"
                    >
                      Jersey Number
                    </Label>
                    <Input
                      id="jerseyNumber"
                      type="number"
                      value={formData.jerseyNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, jerseyNumber: e.target.value })
                      }
                      disabled={!isEditing}
                      placeholder="7"
                      min="1"
                      max="99"
                      className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Preferred Foot */}
                <div className="space-y-2">
                  <Label
                    htmlFor="preferredFoot"
                    className="text-charcoal-700 dark:text-charcoal-300 font-medium"
                  >
                    Preferred Foot
                  </Label>
                  <select
                    id="preferredFoot"
                    value={formData.preferredFoot || 'RIGHT'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredFoot: e.target.value as FormData['preferredFoot'],
                      })
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-charcoal-900 dark:text-white dark:bg-charcoal-700 disabled:bg-neutral-50 dark:disabled:bg-charcoal-800 disabled:opacity-50"
                  >
                    {PREFERRED_FEET.map((foot) => (
                      <option key={foot.id} value={foot.id}>
                        {foot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ACCOUNT STATUS CARD */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent pb-4">
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <Shield className="w-5 h-5 text-purple-500" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Roles */}
              <div className="flex items-start justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600">
                <div>
                  <p className="font-bold text-charcoal-900 dark:text-white mb-2">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {((session?.user as SessionUser)?.roles || []).map((role) => (
                      <Badge
                        key={role}
                        className={ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'}
                      >
                        {ROLE_LABELS[role] || role}
                      </Badge>
                    ))}
                    {((session?.user as SessionUser)?.roles || []).length === 0 && (
                      <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        No roles assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Status */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600">
                <div>
                  <p className="font-bold text-charcoal-900 dark:text-white">Email Verified</p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    {session?.user?.email}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              </div>

              {/* Account Status */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600">
                <div>
                  <p className="font-bold text-charcoal-900 dark:text-white">Account Status</p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Your account is active
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700/30">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

ProfileSettingsPage.displayName = 'ProfileSettingsPage';
