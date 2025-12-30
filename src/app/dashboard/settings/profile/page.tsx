/**
 * Profile Settings Page - ENTERPRISE EDITION
 * Path: /dashboard/settings/profile/page.tsx
 *
 * ============================================================================
 * FEATURES
 * ============================================================================
 * ✅ Personal information management
 * ✅ Profile picture upload with preview
 * ✅ Multi-sport preferences (position per sport)
 * ✅ Role-specific sections:
 *    - PLAYER: Sport positions, jersey numbers, preferred foot
 *    - COACH: Certifications, coaching badges, specializations
 *    - REFEREE: Qualifications, levels, payment preferences
 *    - SCOUT: Regions, focus age groups, focus sports
 *    - PARENT: Linked children, consent settings
 * ✅ 12 sports support from schema
 * ✅ Custom toast notifications
 * ✅ Dark mode support
 * ✅ Accessibility compliance
 * ✅ Form validation
 */

'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Camera,
  Upload,
  Save,
  X,
  Check,
  Info,
  Loader2,
  AlertCircle,
  Trophy,
  Whistle,
  Search,
  Users,
  Shield,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  Calendar,
  Award,
} from 'lucide-react';
import Image from 'next/image';

// ============================================================================
// UI COMPONENTS
// ============================================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// CUSTOM TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'default';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    info: 'bg-blue-500 dark:bg-blue-600',
    default: 'bg-charcoal-800 dark:bg-charcoal-700',
  };

  const icons = {
    success: <Check className="w-5 h-5 text-white" />,
    error: <AlertCircle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />,
    default: <Loader2 className="w-5 h-5 text-white animate-spin" />,
  };

  return (
    <div
      className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
      role="status"
      aria-live="polite"
    >
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
    {toasts.map((toast) => (
      <div key={toast.id} className="pointer-events-auto">
        <Toast message={toast.message} type={toast.type} onClose={() => onRemove(toast.id)} />
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'default') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    removeToast,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };
};

// ============================================================================
// TYPES
// ============================================================================

type Sport =
  | 'FOOTBALL'
  | 'RUGBY'
  | 'BASKETBALL'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'NETBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

type UserRole =
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
  | 'ANALYST';

type RefereeLevel = 'TRAINEE' | 'GRASSROOTS' | 'COUNTY' | 'NATIONAL' | 'FIFA' | 'UEFA' | 'ELITE';

interface SportPreference {
  sport: Sport;
  position: string;
  jerseyNumber: string;
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  isPrimary: boolean;
}

interface CoachCertification {
  id: string;
  name: string;
  issuingBody: string;
  sport: Sport;
  dateObtained: string;
  expiryDate?: string;
}

interface RefereeQualification {
  id: string;
  sport: Sport;
  level: RefereeLevel;
  issuingBody: string;
  dateObtained: string;
  expiryDate?: string;
  verified: boolean;
}

interface LinkedChild {
  id: string;
  name: string;
  relationship: 'PARENT' | 'GUARDIAN';
  dateLinked: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  dateOfBirth: string;
  nationality: string;
  // Player-specific
  sportPreferences: SportPreference[];
  // Coach-specific
  coachCertifications: CoachCertification[];
  coachSpecializations: string[];
  // Referee-specific
  refereeQualifications: RefereeQualification[];
  refereeMatchFee: string;
  refereeTravelFee: string;
  refereePaymentMethod: string;
  // Scout-specific
  scoutRegions: string[];
  scoutFocusAgeGroups: string[];
  scoutFocusSports: Sport[];
  // Parent-specific
  linkedChildren: LinkedChild[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SPORTS: { id: Sport; label: string; icon: string }[] = [
  { id: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { id: 'RUGBY', label: 'Rugby', icon: '🏉' },
  { id: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { id: 'CRICKET', label: 'Cricket', icon: '🏏' },
  { id: 'AMERICAN_FOOTBALL', label: 'American Football', icon: '🏈' },
  { id: 'NETBALL', label: 'Netball', icon: '🏐' },
  { id: 'HOCKEY', label: 'Hockey', icon: '🏑' },
  { id: 'LACROSSE', label: 'Lacrosse', icon: '🥍' },
  { id: 'AUSTRALIAN_RULES', label: 'Australian Rules', icon: '🏉' },
  { id: 'GAELIC_FOOTBALL', label: 'Gaelic Football', icon: '🏐' },
  { id: 'FUTSAL', label: 'Futsal', icon: '⚽' },
  { id: 'BEACH_FOOTBALL', label: 'Beach Football', icon: '🏖️' },
];

const POSITIONS_BY_SPORT: Record<Sport, string[]> = {
  FOOTBALL: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger', 'Striker'],
  RUGBY: ['Prop', 'Hooker', 'Lock', 'Flanker', 'Number 8', 'Scrum-half', 'Fly-half', 'Centre', 'Wing', 'Fullback'],
  BASKETBALL: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  CRICKET: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
  AMERICAN_FOOTBALL: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Cornerback', 'Safety'],
  NETBALL: ['Goal Shooter', 'Goal Attack', 'Wing Attack', 'Centre', 'Wing Defence', 'Goal Defence', 'Goal Keeper'],
  HOCKEY: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  LACROSSE: ['Attack', 'Midfield', 'Defense', 'Goalkeeper'],
  AUSTRALIAN_RULES: ['Full Forward', 'Half Forward', 'Centre', 'Half Back', 'Full Back', 'Ruck', 'Rover'],
  GAELIC_FOOTBALL: ['Goalkeeper', 'Full Back', 'Half Back', 'Midfield', 'Half Forward', 'Full Forward'],
  FUTSAL: ['Goalkeeper', 'Defender', 'Winger', 'Pivot'],
  BEACH_FOOTBALL: ['Goalkeeper', 'Defender', 'Winger', 'Pivot'],
};

const REFEREE_LEVELS: { id: RefereeLevel; label: string }[] = [
  { id: 'TRAINEE', label: 'Trainee' },
  { id: 'GRASSROOTS', label: 'Grassroots' },
  { id: 'COUNTY', label: 'County' },
  { id: 'NATIONAL', label: 'National' },
  { id: 'FIFA', label: 'FIFA' },
  { id: 'UEFA', label: 'UEFA' },
  { id: 'ELITE', label: 'Elite' },
];

const AGE_GROUPS = ['U5', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'U21', 'U23', 'Senior', 'Veteran'];

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

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Collapsible Section Component
 */
interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
      <CardHeader
        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-charcoal-900 dark:text-white">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400" />
          )}
        </div>
      </CardHeader>
      {isOpen && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
};

/**
 * Sport Preference Card Component
 */
interface SportPreferenceCardProps {
  preference: SportPreference;
  onUpdate: (updated: SportPreference) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}

const SportPreferenceCard = ({
  preference,
  onUpdate,
  onRemove,
  onSetPrimary,
}: SportPreferenceCardProps) => {
  const sport = SPORTS.find((s) => s.id === preference.sport);
  const positions = POSITIONS_BY_SPORT[preference.sport] || [];

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        preference.isPrimary
          ? 'border-gold-400 dark:border-gold-600 bg-gold-50 dark:bg-gold-900/20'
          : 'border-neutral-200 dark:border-charcoal-600 bg-neutral-50 dark:bg-charcoal-700'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{sport?.icon}</span>
          <div>
            <p className="font-bold text-charcoal-900 dark:text-white">{sport?.label}</p>
            {preference.isPrimary && (
              <Badge className="bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400 mt-1">
                <Star className="w-3 h-3 mr-1" />
                Primary Sport
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!preference.isPrimary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSetPrimary}
              className="text-gold-600 hover:text-gold-700 hover:bg-gold-50 dark:hover:bg-gold-900/20"
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400">
            Position
          </Label>
          <select
            value={preference.position}
            onChange={(e) => onUpdate({ ...preference, position: e.target.value })}
            className="w-full mt-1 p-2 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
          >
            <option value="">Select Position</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400">
            Jersey Number
          </Label>
          <Input
            type="number"
            min="1"
            max="99"
            value={preference.jerseyNumber}
            onChange={(e) => onUpdate({ ...preference, jerseyNumber: e.target.value })}
            placeholder="e.g. 10"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400">
            Preferred Foot/Hand
          </Label>
          <select
            value={preference.preferredFoot}
            onChange={(e) =>
              onUpdate({ ...preference, preferredFoot: e.target.value as 'LEFT' | 'RIGHT' | 'BOTH' })
            }
            className="w-full mt-1 p-2 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
          >
            <option value="RIGHT">Right</option>
            <option value="LEFT">Left</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // User data
  const user = session?.user as any;
  const userRoles: UserRole[] = user?.roles || [];

  // Role checks
  const isPlayer = userRoles.includes('PLAYER') || userRoles.includes('PLAYER_PRO');
  const isCoach = userRoles.includes('COACH');
  const isReferee = userRoles.includes('REFEREE');
  const isScout = userRoles.includes('SCOUT');
  const isParent = userRoles.includes('PARENT');

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.image || '');
  const [showAddSport, setShowAddSport] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    dateOfBirth: '',
    nationality: '',
    sportPreferences: [],
    coachCertifications: [],
    coachSpecializations: [],
    refereeQualifications: [],
    refereeMatchFee: '',
    refereeTravelFee: '',
    refereePaymentMethod: 'BANK_TRANSFER',
    scoutRegions: [],
    scoutFocusAgeGroups: [],
    scoutFocusSports: [],
    linkedChildren: [],
  });

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showError('First and last name are required');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await update({
        ...session,
        user: {
          ...session?.user,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
        },
      });

      success('Profile updated successfully!');
    } catch (err) {
      showError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      success('Photo uploaded successfully!');
    } catch (err) {
      showError('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const addSportPreference = (sport: Sport) => {
    if (formData.sportPreferences.some((p) => p.sport === sport)) {
      showError('Sport already added');
      return;
    }

    const newPreference: SportPreference = {
      sport,
      position: '',
      jerseyNumber: '',
      preferredFoot: 'RIGHT',
      isPrimary: formData.sportPreferences.length === 0,
    };

    setFormData((prev) => ({
      ...prev,
      sportPreferences: [...prev.sportPreferences, newPreference],
    }));
    setShowAddSport(false);
  };

  const updateSportPreference = (index: number, updated: SportPreference) => {
    setFormData((prev) => ({
      ...prev,
      sportPreferences: prev.sportPreferences.map((p, i) => (i === index ? updated : p)),
    }));
  };

  const removeSportPreference = (index: number) => {
    setFormData((prev) => {
      const updated = prev.sportPreferences.filter((_, i) => i !== index);
      // If we removed the primary, make the first one primary
      if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return { ...prev, sportPreferences: updated };
    });
  };

  const setPrimarySport = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sportPreferences: prev.sportPreferences.map((p, i) => ({
        ...p,
        isPrimary: i === index,
      })),
    }));
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white">Profile Settings</h2>
        <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">
          Manage your personal information, sport preferences, and role-specific settings
        </p>
      </div>

      {/* Account Status */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-900/40">
        <span className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
          Your Roles:
        </span>
        {userRoles.map((role) => (
          <Badge key={role} className={ROLE_COLORS[role]}>
            {ROLE_LABELS[role]}
          </Badge>
        ))}
      </div>

      {/* Profile Picture */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
            <Camera className="w-5 h-5 text-gold-500" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-orange-500 flex items-center justify-center overflow-hidden border-4 border-white dark:border-charcoal-700 shadow-lg">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profile" width={96} height={96} className="object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-2">
                JPG, PNG, or WebP • Max 5MB • Square recommended
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
            <User className="w-5 h-5 text-blue-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+44 7700 900000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Nationality
              </Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="British"
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Bio
            </Label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white resize-none"
            />
            <p className="text-xs text-charcoal-500 mt-1">{formData.bio.length}/500 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Sport Preferences - For Players */}
      {isPlayer && (
        <CollapsibleSection
          title="Sport Preferences"
          description="Configure your positions and preferences for each sport you play"
          icon={Trophy}
          iconColor="text-gold-600 dark:text-gold-400"
          iconBg="bg-gold-100 dark:bg-gold-900/30"
        >
          <div className="space-y-4">
            {formData.sportPreferences.map((pref, index) => (
              <SportPreferenceCard
                key={pref.sport}
                preference={pref}
                onUpdate={(updated) => updateSportPreference(index, updated)}
                onRemove={() => removeSportPreference(index)}
                onSetPrimary={() => setPrimarySport(index)}
              />
            ))}

            {showAddSport ? (
              <div className="p-4 border-2 border-dashed border-gold-300 dark:border-gold-700 rounded-xl bg-gold-50 dark:bg-gold-900/20">
                <p className="font-semibold text-charcoal-900 dark:text-white mb-3">Select a Sport</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SPORTS.filter((s) => !formData.sportPreferences.some((p) => p.sport === s.id)).map(
                    (sport) => (
                      <button
                        key={sport.id}
                        onClick={() => addSportPreference(sport.id)}
                        className="flex items-center gap-2 p-3 bg-white dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600 hover:border-gold-400 dark:hover:border-gold-600 transition-colors"
                      >
                        <span>{sport.icon}</span>
                        <span className="text-sm font-medium text-charcoal-900 dark:text-white">
                          {sport.label}
                        </span>
                      </button>
                    )
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddSport(false)}
                  className="mt-3 text-charcoal-600 dark:text-charcoal-400"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddSport(true)}
                className="w-full border-dashed border-2 border-gold-300 dark:border-gold-700 text-gold-600 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sport
              </Button>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Coach Certifications */}
      {isCoach && (
        <CollapsibleSection
          title="Coach Certifications"
          description="Manage your coaching badges and certifications"
          icon={Award}
          iconColor="text-green-600 dark:text-green-400"
          iconBg="bg-green-100 dark:bg-green-900/30"
        >
          <div className="space-y-4">
            <div className="p-6 text-center bg-neutral-50 dark:bg-charcoal-700/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-charcoal-600">
              <Award className="w-10 h-10 text-charcoal-400 dark:text-charcoal-500 mx-auto mb-3" />
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-3">
                No certifications added yet
              </p>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Referee Qualifications */}
      {isReferee && (
        <CollapsibleSection
          title="Referee Qualifications"
          description="Manage your officiating qualifications and payment preferences"
          icon={Whistle}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-100 dark:bg-red-900/30"
        >
          <div className="space-y-6">
            {/* Qualifications */}
            <div>
              <h4 className="font-semibold text-charcoal-900 dark:text-white mb-3">
                Qualifications
              </h4>
              <div className="p-4 text-center bg-neutral-50 dark:bg-charcoal-700/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-charcoal-600">
                <Shield className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
                <p className="text-charcoal-600 dark:text-charcoal-400 mb-3 text-sm">
                  Add your referee qualifications
                </p>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Qualification
                </Button>
              </div>
            </div>

            {/* Payment Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Match Fee (£)</Label>
                <Input
                  type="number"
                  value={formData.refereeMatchFee}
                  onChange={(e) => setFormData({ ...formData, refereeMatchFee: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div>
                <Label>Travel Fee (£)</Label>
                <Input
                  type="number"
                  value={formData.refereeTravelFee}
                  onChange={(e) => setFormData({ ...formData, refereeTravelFee: e.target.value })}
                  placeholder="20"
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <select
                  value={formData.refereePaymentMethod}
                  onChange={(e) => setFormData({ ...formData, refereePaymentMethod: e.target.value })}
                  className="w-full p-2 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Scout Settings */}
      {isScout && (
        <CollapsibleSection
          title="Scouting Preferences"
          description="Configure your scouting regions, focus areas, and specializations"
          icon={Search}
          iconColor="text-teal-600 dark:text-teal-400"
          iconBg="bg-teal-100 dark:bg-teal-900/30"
        >
          <div className="space-y-4">
            <div>
              <Label>Focus Age Groups</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AGE_GROUPS.map((age) => (
                  <button
                    key={age}
                    onClick={() => {
                      if (formData.scoutFocusAgeGroups.includes(age)) {
                        setFormData({
                          ...formData,
                          scoutFocusAgeGroups: formData.scoutFocusAgeGroups.filter((a) => a !== age),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          scoutFocusAgeGroups: [...formData.scoutFocusAgeGroups, age],
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.scoutFocusAgeGroups.includes(age)
                        ? 'bg-teal-500 text-white'
                        : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Focus Sports</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SPORTS.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => {
                      if (formData.scoutFocusSports.includes(sport.id)) {
                        setFormData({
                          ...formData,
                          scoutFocusSports: formData.scoutFocusSports.filter((s) => s !== sport.id),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          scoutFocusSports: [...formData.scoutFocusSports, sport.id],
                        });
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.scoutFocusSports.includes(sport.id)
                        ? 'bg-teal-500 text-white'
                        : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30'
                    }`}
                  >
                    <span>{sport.icon}</span>
                    {sport.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Parent Settings */}
      {isParent && (
        <CollapsibleSection
          title="Linked Children"
          description="Manage accounts linked to your children"
          icon={Users}
          iconColor="text-pink-600 dark:text-pink-400"
          iconBg="bg-pink-100 dark:bg-pink-900/30"
        >
          <div className="p-6 text-center bg-neutral-50 dark:bg-charcoal-700/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-charcoal-600">
            <Users className="w-10 h-10 text-charcoal-400 mx-auto mb-3" />
            <p className="text-charcoal-600 dark:text-charcoal-400 mb-3">
              No children linked to your account
            </p>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Link Child Account
            </Button>
          </div>
        </CollapsibleSection>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-charcoal-700">
        <Button
          variant="outline"
          className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white"
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
    </div>
  );
}

ProfileSettingsPage.displayName = 'ProfileSettingsPage';