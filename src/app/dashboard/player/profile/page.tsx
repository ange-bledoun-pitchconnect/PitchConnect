/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Profile v2.0 (Multi-Sport)
 * Path: src/app/dashboard/player/profile/page.tsx
 * ============================================================================
 * 
 * MULTI-SPORT FEATURES:
 * ✅ Sport-specific positions (Football, Netball, Rugby, etc.)
 * ✅ Dynamic "Preferred Foot/Hand" label based on sport
 * ✅ Sport context from player's team/club
 * ✅ All Position enum values from schema
 * ✅ PreferredFoot enum (LEFT/RIGHT/BOTH)
 * ✅ Custom toast system (no external deps)
 * ✅ Dark mode support
 * 
 * ============================================================================
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  User, Edit, Save, X, Loader2, Trophy, MapPin, Calendar, Shield, Activity,
  AlertCircle, Check, Info, Zap, Shirt, Footprints, Weight, Ruler, ArrowLeft, Star,
} from 'lucide-react';
import {
  Sport, Position, PreferredFoot,
  SPORT_CONFIGS, POSITION_LABELS, getPositionsForSport,
} from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerProfile {
  id: string;
  userId: string;
  height: number | null;
  weight: number | null;
  dateOfBirth: string | null;
  nationality: string | null;
  secondNationality: string | null;
  jerseyNumber: number | null;
  preferredFoot: PreferredFoot | null;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  tertiaryPosition: Position | null;
  overallRating: number | null;
  formRating: number | null;
  availabilityStatus: string;
  isActive: boolean;
  isVerified: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  };
  _count: { teamPlayers: number; statistics: number };
  stats?: { matches: number; goals: number; assists: number };
  sport: Sport; // Derived from player's primary team/club
}

// ============================================================================
// TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info';
interface ToastMessage { id: string; type: ToastType; message: string }

const Toast = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
  const icons = { success: <Check className="w-5 h-5" />, error: <AlertCircle className="w-5 h-5" />, info: <Info className="w-5 h-5" /> };
  return (
    <div className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      {icons[type]}<span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X className="w-4 h-4" /></button>
    </div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const add = useCallback((message: string, type: ToastType) => {
    setToasts((p) => [...p, { id: `${Date.now()}`, message, type }]);
  }, []);
  const remove = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, success: (m: string) => add(m, 'success'), error: (m: string) => add(m, 'error'), remove };
};

// ============================================================================
// HELPERS
// ============================================================================

const PREFERRED_SIDE_OPTIONS: { value: PreferredFoot; label: string }[] = [
  { value: 'LEFT', label: 'Left' },
  { value: 'RIGHT', label: 'Right' },
  { value: 'BOTH', label: 'Both' },
];

const AVAILABILITY_STATUS = [
  { value: 'AVAILABLE', label: 'Available', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'INJURED', label: 'Injured', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'UNAVAILABLE', label: 'Unavailable', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
];

function getPositionLabel(pos: Position | null): string {
  if (!pos) return 'Not set';
  return POSITION_LABELS[pos] || pos.replace(/_/g, ' ');
}

function getPreferredSideLabel(sport: Sport): string {
  return SPORT_CONFIGS[sport]?.preferredSideLabel || 'Preferred Foot';
}

function calculateCompletion(profile: PlayerProfile): number {
  const fields = [
    profile.height, profile.weight, profile.dateOfBirth, profile.nationality,
    profile.primaryPosition, profile.preferredFoot, profile.jerseyNumber,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerProfilePage() {
  const { toasts, success, error: showError, remove } = useToast();

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<PlayerProfile>>({});

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/player/profile');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProfile(data.profile);
      setEditData(data.profile);
    } catch {
      showError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/player/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: editData.height,
          weight: editData.weight,
          dateOfBirth: editData.dateOfBirth,
          nationality: editData.nationality,
          secondNationality: editData.secondNationality,
          jerseyNumber: editData.jerseyNumber,
          preferredFoot: editData.preferredFoot,
          primaryPosition: editData.primaryPosition,
          secondaryPosition: editData.secondaryPosition,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      setProfile(data.profile);
      setEditData(data.profile);
      setIsEditing(false);
      success('Profile updated successfully!');
    } catch {
      showError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => { setEditData(profile || {}); setIsEditing(false); };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <User className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mb-4" />
        <p className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">Profile not found</p>
        <button onClick={fetchProfile} className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-semibold">Try Again</button>
      </div>
    );
  }

  // Get sport-specific config
  const sport = profile.sport || 'FOOTBALL';
  const sportConfig = SPORT_CONFIGS[sport];
  const positions = getPositionsForSport(sport);
  const preferredSideLabel = getPreferredSideLabel(sport);
  const completion = calculateCompletion(profile);
  const availStatus = AVAILABILITY_STATUS.find((s) => s.value === profile.availabilityStatus);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />)}
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">{profile.user.firstName?.charAt(0)}{profile.user.lastName?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-white">{profile.user.firstName} {profile.user.lastName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Sport Badge */}
                <span className="px-3 py-1 bg-gradient-to-r from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30 text-gold-700 dark:text-gold-400 text-xs font-semibold rounded-full flex items-center gap-1">
                  <span>{sportConfig.icon}</span> {sportConfig.name}
                </span>
                {profile.primaryPosition && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Shirt className="w-3 h-3" /> {getPositionLabel(profile.primaryPosition)}
                  </span>
                )}
                {profile.jerseyNumber && (
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">#{profile.jerseyNumber}</span>
                )}
                {availStatus && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${availStatus.color}`}>{availStatus.label}</span>
                )}
                {profile.isVerified && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg flex items-center gap-2">
            <Edit className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="px-4 py-2 border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
          <Shield className="w-6 h-6 text-gold-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{profile._count.teamPlayers}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Teams</p>
        </div>
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
          <Trophy className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{profile.stats?.matches || 0}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Matches</p>
        </div>
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
          <Zap className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{profile.stats?.goals || 0}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{sportConfig.statLabels.primaryStat}</p>
        </div>
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-4 text-center">
          <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{profile.overallRating?.toFixed(1) || '-'}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Rating</p>
        </div>
      </div>

      {/* PROFILE COMPLETION */}
      {completion < 100 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Profile Completion</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{completion}%</span>
          </div>
          <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" style={{ width: `${completion}%` }} />
          </div>
        </div>
      )}

      {/* PROFILE INFO */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-gold-500" /> Profile Information
          </h2>
        </div>
        <div className="p-6 space-y-8">
          {/* Personal */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-gold-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Date of Birth" icon={<Calendar className="w-4 h-4" />} isEditing={isEditing}
                value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}
                editElement={<input type="date" value={editData.dateOfBirth?.split('T')[0] || ''} onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })} className="input-field" />}
              />
              <FormField label="Nationality" icon={<MapPin className="w-4 h-4" />} isEditing={isEditing}
                value={profile.nationality || 'Not set'}
                editElement={<input value={editData.nationality || ''} onChange={(e) => setEditData({ ...editData, nationality: e.target.value })} placeholder="e.g., English" className="input-field" />}
              />
            </div>
          </div>

          {/* Playing - Sport Specific */}
          <div className="pt-6 border-t border-neutral-200 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-lg">{sportConfig.icon}</span> {sportConfig.name} Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Primary Position" icon={<Shirt className="w-4 h-4" />} isEditing={isEditing}
                value={getPositionLabel(profile.primaryPosition)}
                editElement={
                  <select value={editData.primaryPosition || ''} onChange={(e) => setEditData({ ...editData, primaryPosition: e.target.value as Position })} className="input-field">
                    <option value="">Select position</option>
                    {positions.map((p) => <option key={p.value} value={p.value}>{p.label} ({p.abbr})</option>)}
                  </select>
                }
              />
              <FormField label="Secondary Position" icon={<Shirt className="w-4 h-4" />} isEditing={isEditing}
                value={getPositionLabel(profile.secondaryPosition)}
                editElement={
                  <select value={editData.secondaryPosition || ''} onChange={(e) => setEditData({ ...editData, secondaryPosition: e.target.value as Position })} className="input-field">
                    <option value="">Select position</option>
                    {positions.map((p) => <option key={p.value} value={p.value}>{p.label} ({p.abbr})</option>)}
                  </select>
                }
              />
              {/* Dynamic label based on sport */}
              <FormField label={preferredSideLabel} icon={<Footprints className="w-4 h-4" />} isEditing={isEditing}
                value={profile.preferredFoot ? PREFERRED_SIDE_OPTIONS.find(f => f.value === profile.preferredFoot)?.label || 'Not set' : 'Not set'}
                editElement={
                  <select value={editData.preferredFoot || ''} onChange={(e) => setEditData({ ...editData, preferredFoot: e.target.value as PreferredFoot })} className="input-field">
                    <option value="">Select preference</option>
                    {PREFERRED_SIDE_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                }
              />
              <FormField label="Jersey Number" icon={<Shirt className="w-4 h-4" />} isEditing={isEditing}
                value={profile.jerseyNumber ? `#${profile.jerseyNumber}` : 'Not set'}
                editElement={<input type="number" min="1" max="99" value={editData.jerseyNumber || ''} onChange={(e) => setEditData({ ...editData, jerseyNumber: e.target.value ? parseInt(e.target.value) : null })} placeholder="7" className="input-field" />}
              />
            </div>
          </div>

          {/* Physical */}
          <div className="pt-6 border-t border-neutral-200 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold-500" /> Physical Attributes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Height (cm)" icon={<Ruler className="w-4 h-4" />} isEditing={isEditing}
                value={profile.height ? `${profile.height} cm` : 'Not set'}
                editElement={<input type="number" value={editData.height || ''} onChange={(e) => setEditData({ ...editData, height: e.target.value ? parseInt(e.target.value) : null })} placeholder="180" className="input-field" />}
              />
              <FormField label="Weight (kg)" icon={<Weight className="w-4 h-4" />} isEditing={isEditing}
                value={profile.weight ? `${profile.weight} kg` : 'Not set'}
                editElement={<input type="number" value={editData.weight || ''} onChange={(e) => setEditData({ ...editData, weight: e.target.value ? parseInt(e.target.value) : null })} placeholder="75" className="input-field" />}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #f9fafb;
          color: #111827;
          font-size: 0.875rem;
        }
        .input-field:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
        :global(.dark) .input-field {
          background: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

function FormField({ label, icon, value, isEditing, editElement }: {
  label: string;
  icon: React.ReactNode;
  value: string;
  isEditing: boolean;
  editElement: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm text-charcoal-600 dark:text-charcoal-400 flex items-center gap-2 mb-2">
        {icon} {label}
      </label>
      {isEditing ? editElement : (
        <p className="font-medium text-charcoal-900 dark:text-white">{value}</p>
      )}
    </div>
  );
}