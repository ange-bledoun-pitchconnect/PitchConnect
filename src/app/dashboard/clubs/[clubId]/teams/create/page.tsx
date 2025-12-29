// =============================================================================
// 🏆 PITCHCONNECT - CREATE TEAM PAGE v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/clubs/[clubId]/teams/create
// Access: CLUB_OWNER, MANAGER
// 
// FEATURES:
// ✅ Inherits sport from parent club
// ✅ Age group selection with comprehensive options
// ✅ Gender selection (MALE, FEMALE, MIXED)
// ✅ Squad size configuration
// ✅ Join request settings
// ✅ Schema-aligned with Team model
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Trophy,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Shield,
  Settings,
  UserPlus,
  Calendar,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface Club {
  id: string;
  name: string;
  sport: Sport;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

interface TeamFormData {
  name: string;
  description: string;
  ageGroup: string;
  gender: string;
  minPlayers: string;
  maxPlayers: string;
  acceptingJoinRequests: boolean;
  requiresApproval: boolean;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, { 
  label: string; 
  icon: string; 
  color: string;
  defaultMinPlayers: number;
  defaultMaxPlayers: number;
}> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600', defaultMinPlayers: 11, defaultMaxPlayers: 25 },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600', defaultMinPlayers: 7, defaultMaxPlayers: 12 },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600', defaultMinPlayers: 15, defaultMaxPlayers: 30 },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600', defaultMinPlayers: 5, defaultMaxPlayers: 15 },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600', defaultMinPlayers: 11, defaultMaxPlayers: 18 },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600', defaultMinPlayers: 11, defaultMaxPlayers: 20 },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600', defaultMinPlayers: 11, defaultMaxPlayers: 53 },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600', defaultMinPlayers: 10, defaultMaxPlayers: 23 },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600', defaultMinPlayers: 18, defaultMaxPlayers: 40 },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600', defaultMinPlayers: 15, defaultMaxPlayers: 30 },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600', defaultMinPlayers: 5, defaultMaxPlayers: 14 },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500', defaultMinPlayers: 5, defaultMaxPlayers: 12 },
};

const AGE_GROUPS = [
  { value: 'OPEN', label: 'Open (All Ages)' },
  { value: 'SENIOR', label: 'Senior (18+)' },
  { value: 'U23', label: 'Under 23' },
  { value: 'U21', label: 'Under 21' },
  { value: 'U19', label: 'Under 19' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U17', label: 'Under 17' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U15', label: 'Under 15' },
  { value: 'U14', label: 'Under 14' },
  { value: 'U13', label: 'Under 13' },
  { value: 'U12', label: 'Under 12' },
  { value: 'U11', label: 'Under 11' },
  { value: 'U10', label: 'Under 10' },
  { value: 'U9', label: 'Under 9' },
  { value: 'U8', label: 'Under 8' },
  { value: 'U7', label: 'Under 7' },
  { value: 'MASTERS', label: 'Masters (35+)' },
  { value: 'VETERANS', label: 'Veterans (40+)' },
  { value: 'SUPER_VETERANS', label: 'Super Veterans (50+)' },
] as const;

const GENDERS = [
  { value: 'MALE', label: 'Male', description: 'Men\'s team' },
  { value: 'FEMALE', label: 'Female', description: 'Women\'s team' },
  { value: 'MIXED', label: 'Mixed', description: 'Co-ed / Mixed gender team' },
] as const;

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 ${typeClasses[type]}`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CreateTeamPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  // State
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    ageGroup: 'SENIOR',
    gender: 'MALE',
    minPlayers: '',
    maxPlayers: '',
    acceptingJoinRequests: true,
    requiresApproval: true,
  });

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch club data to get sport
  useEffect(() => {
    const fetchClub = async () => {
      try {
        const response = await fetch(`/api/clubs/${clubId}`);
        if (!response.ok) throw new Error('Failed to fetch club');
        const data = await response.json();
        const clubData = data.club || data;
        setClub(clubData);
        
        // Set default squad sizes based on sport
        const sportConfig = SPORT_CONFIG[clubData.sport as Sport];
        if (sportConfig) {
          setFormData(prev => ({
            ...prev,
            minPlayers: sportConfig.defaultMinPlayers.toString(),
            maxPlayers: sportConfig.defaultMaxPlayers.toString(),
          }));
        }
      } catch (error) {
        showToast('Failed to load club data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (clubId) fetchClub();
  }, [clubId, showToast]);

  // Get sport config
  const sportConfig = club ? SPORT_CONFIG[club.sport] : null;

  // Validation
  const isValid = formData.name.trim().length >= 2;

  // Handle input change
  const handleChange = (field: keyof TeamFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please provide a team name', 'error');
      return;
    }

    if (formData.name.trim().length < 2) {
      showToast('Team name must be at least 2 characters', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clubs/${clubId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          ageGroup: formData.ageGroup,
          gender: formData.gender,
          minPlayers: formData.minPlayers ? parseInt(formData.minPlayers) : undefined,
          maxPlayers: formData.maxPlayers ? parseInt(formData.maxPlayers) : undefined,
          acceptingJoinRequests: formData.acceptingJoinRequests,
          requiresApproval: formData.requiresApproval,
          status: 'ACTIVE',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create team');
      }

      const data = await response.json();
      showToast('🎉 Team created successfully!', 'success');

      setTimeout(() => {
        router.push(`/dashboard/clubs/${clubId}/teams/${data.team?.id || data.teamId || data.id}`);
      }, 1200);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create team', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading club data...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Club Not Found</h1>
          <Link href="/dashboard/clubs" className="text-gold-400 hover:text-gold-300">Back to Clubs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/clubs/${clubId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to {club.name}
          </Link>

          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${sportConfig?.color || 'from-gold-500 to-orange-500'} shadow-lg`}>
              <span className="text-3xl">{sportConfig?.icon || '🏆'}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Team</h1>
              <p className="text-slate-400">
                {club.name} • {sportConfig?.label || 'Sport'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gold-400" />
              Team Information
            </h2>

            <div className="space-y-4">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={`e.g., ${club.name} First Team, U18 Squad`}
                  maxLength={50}
                  disabled={isSubmitting}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">{formData.name.length}/50 characters</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Notes about training schedule, goals, focus areas..."
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50 resize-none"
                />
              </div>

              {/* Age Group & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Age Group
                  </label>
                  <select
                    value={formData.ageGroup}
                    onChange={(e) => handleChange('ageGroup', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50"
                  >
                    {AGE_GROUPS.map(group => (
                      <option key={group.value} value={group.value}>{group.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50"
                  >
                    {GENDERS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Squad Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Squad Settings
            </h2>

            <div className="space-y-4">
              {/* Squad Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Minimum Players
                  </label>
                  <input
                    type="number"
                    value={formData.minPlayers}
                    onChange={(e) => handleChange('minPlayers', e.target.value)}
                    placeholder={sportConfig?.defaultMinPlayers.toString()}
                    min="1"
                    max="100"
                    disabled={isSubmitting}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Maximum Players
                  </label>
                  <input
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => handleChange('maxPlayers', e.target.value)}
                    placeholder={sportConfig?.defaultMaxPlayers.toString()}
                    min="1"
                    max="100"
                    disabled={isSubmitting}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Default for {sportConfig?.label}: {sportConfig?.defaultMinPlayers} - {sportConfig?.defaultMaxPlayers} players
              </p>
            </div>
          </div>

          {/* Join Request Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-400" />
              Join Request Settings
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 cursor-pointer hover:bg-slate-700 transition-colors">
                <div>
                  <p className="font-medium text-white">Accept Join Requests</p>
                  <p className="text-sm text-slate-400">Allow players to request to join this team</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.acceptingJoinRequests}
                  onChange={(e) => handleChange('acceptingJoinRequests', e.target.checked)}
                  disabled={isSubmitting}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-gold-600 focus:ring-gold-500"
                />
              </label>

              {formData.acceptingJoinRequests && (
                <label className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 cursor-pointer hover:bg-slate-700 transition-colors">
                  <div>
                    <p className="font-medium text-white">Require Approval</p>
                    <p className="text-sm text-slate-400">Join requests must be approved by team management</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => handleChange('requiresApproval', e.target.checked)}
                    disabled={isSubmitting}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-gold-600 focus:ring-gold-500"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gold-500/30 p-6">
            <h2 className="text-sm font-medium text-gold-400 mb-4">Preview</h2>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${sportConfig?.color || 'from-gold-500 to-orange-500'} flex items-center justify-center`}>
                <span className="text-2xl">{sportConfig?.icon || '🏆'}</span>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{formData.name || 'Team Name'}</p>
                <p className="text-sm text-slate-400">
                  {AGE_GROUPS.find(g => g.value === formData.ageGroup)?.label} • {GENDERS.find(g => g.value === formData.gender)?.label}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {formData.acceptingJoinRequests && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      Accepting Players
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Link
              href={`/dashboard/clubs/${clubId}`}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Create Team
                </>
              )}
            </button>
          </div>
        </form>

        {/* Helpful Tips */}
        <div className="mt-6 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
          <p className="text-sm text-blue-400">
            <span className="font-semibold">💡 Tip:</span> After creating the team, you can add players, set up formations, and configure training schedules from the team management page.
          </p>
        </div>
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}