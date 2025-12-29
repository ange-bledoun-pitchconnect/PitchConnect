// =============================================================================
// 🏢 PITCHCONNECT - CREATE CLUB WIZARD v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/clubs/create
// Access: Any authenticated user (becomes CLUB_OWNER on creation)
// 
// FEATURES:
// ✅ Multi-sport support with sport-first selection
// ✅ Team type selection (Professional → School)
// ✅ Multi-step wizard with progress tracking
// ✅ Logo upload with validation
// ✅ Color picker with brand preview
// ✅ Optional first team creation
// ✅ Schema-aligned with Club, Team, ClubMember models
// ✅ Dark mode + responsive design
// ✅ Enterprise-grade validation
// =============================================================================

'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Upload,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Users,
  MapPin,
  Palette,
  FileText,
  Camera,
  AlertCircle,
  X,
  Globe,
  Building2,
  Star,
  Zap,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL'
  | 'NETBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

type TeamType =
  | 'PROFESSIONAL'
  | 'SEMI_PROFESSIONAL'
  | 'AMATEUR'
  | 'ACADEMY'
  | 'YOUTH'
  | 'RECREATIONAL'
  | 'UNIVERSITY'
  | 'SCHOOL';

interface ClubFormData {
  // Step 1: Sport
  sport: Sport | '';
  
  // Step 2: Basic Info
  name: string;
  shortName: string;
  description: string;
  
  // Step 3: Location
  city: string;
  state: string;
  country: string;
  address: string;
  postcode: string;
  venue: string;
  venueCapacity: string;
  
  // Step 4: Branding
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  website: string;
  
  // Step 5: Organisation Type
  teamType: TeamType;
  foundedYear: string;
  
  // Settings
  isPublic: boolean;
  acceptingPlayers: boolean;
  acceptingStaff: boolean;
}

interface TeamFormData {
  name: string;
  ageGroup: string;
  gender: string;
  description: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// SPORT CONFIGURATION - Multi-Sport Support
// =============================================================================

const SPORTS: Array<{
  value: Sport;
  label: string;
  icon: string;
  description: string;
  color: string;
}> = [
  { value: 'FOOTBALL', label: 'Football', icon: '⚽', description: 'Association Football / Soccer', color: 'from-green-500 to-emerald-600' },
  { value: 'NETBALL', label: 'Netball', icon: '🏐', description: 'Court-based team sport', color: 'from-pink-500 to-rose-600' },
  { value: 'RUGBY', label: 'Rugby', icon: '🏉', description: 'Rugby Union & League', color: 'from-red-500 to-orange-600' },
  { value: 'BASKETBALL', label: 'Basketball', icon: '🏀', description: 'Indoor/outdoor basketball', color: 'from-orange-500 to-amber-600' },
  { value: 'CRICKET', label: 'Cricket', icon: '🏏', description: 'Bat-and-ball sport', color: 'from-yellow-500 to-lime-600' },
  { value: 'HOCKEY', label: 'Hockey', icon: '🏒', description: 'Field & Ice Hockey', color: 'from-blue-500 to-cyan-600' },
  { value: 'AMERICAN_FOOTBALL', label: 'American Football', icon: '🏈', description: 'Gridiron football', color: 'from-indigo-500 to-purple-600' },
  { value: 'LACROSSE', label: 'Lacrosse', icon: '🥍', description: 'Field & Box Lacrosse', color: 'from-violet-500 to-purple-600' },
  { value: 'AUSTRALIAN_RULES', label: 'Australian Rules', icon: '🦘', description: 'AFL / Aussie Rules', color: 'from-yellow-500 to-red-600' },
  { value: 'GAELIC_FOOTBALL', label: 'Gaelic Football', icon: '☘️', description: 'Irish Gaelic Games', color: 'from-green-500 to-yellow-600' },
  { value: 'FUTSAL', label: 'Futsal', icon: '⚽', description: 'Indoor 5-a-side football', color: 'from-teal-500 to-green-600' },
  { value: 'BEACH_FOOTBALL', label: 'Beach Football', icon: '🏖️', description: 'Beach soccer', color: 'from-amber-400 to-orange-500' },
];

const TEAM_TYPES: Array<{
  value: TeamType;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { value: 'PROFESSIONAL', label: 'Professional', description: 'Full-time paid athletes', icon: Star },
  { value: 'SEMI_PROFESSIONAL', label: 'Semi-Professional', description: 'Part-time paid athletes', icon: Zap },
  { value: 'AMATEUR', label: 'Amateur', description: 'Non-paid competitive club', icon: Trophy },
  { value: 'ACADEMY', label: 'Academy', description: 'Player development pathway', icon: Users },
  { value: 'YOUTH', label: 'Youth', description: 'Youth/Junior club', icon: Users },
  { value: 'RECREATIONAL', label: 'Recreational', description: 'Social/casual play', icon: Globe },
  { value: 'UNIVERSITY', label: 'University', description: 'Higher education club', icon: Building2 },
  { value: 'SCHOOL', label: 'School', description: 'Primary/Secondary school', icon: Building2 },
];

const COUNTRIES = [
  'United Kingdom', 'Ireland', 'Spain', 'Germany', 'France', 'Italy',
  'Netherlands', 'Portugal', 'Belgium', 'Austria', 'Switzerland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Greece', 'Turkey',
  'Poland', 'Czech Republic', 'Croatia', 'Serbia',
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina',
  'Australia', 'New Zealand', 'Japan', 'South Korea', 'China',
  'India', 'South Africa', 'Nigeria', 'Egypt', 'Other',
] as const;

const AGE_GROUPS = [
  { value: 'SENIOR', label: 'Senior (18+)' },
  { value: 'U23', label: 'Under 23' },
  { value: 'U21', label: 'Under 21' },
  { value: 'U19', label: 'Under 19' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U14', label: 'Under 14' },
  { value: 'U12', label: 'Under 12' },
  { value: 'U10', label: 'Under 10' },
  { value: 'U8', label: 'Under 8' },
  { value: 'MASTERS', label: 'Masters (35+)' },
  { value: 'VETERANS', label: 'Veterans (40+)' },
] as const;

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'MIXED', label: 'Mixed' },
] as const;

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const typeClasses = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <AlertCircle className="h-5 w-5" />,
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }: { toasts: ToastMessage[]; onRemove: (id: string) => void }) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => onRemove(toast.id)} />
    ))}
  </div>
);

// =============================================================================
// PROGRESS INDICATOR
// =============================================================================

const ProgressSteps = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const steps = [
    { step: 1, label: 'Sport' },
    { step: 2, label: 'Details' },
    { step: 3, label: 'Location' },
    { step: 4, label: 'Branding' },
    { step: 5, label: 'Type' },
    { step: 6, label: 'Team' },
    { step: 7, label: 'Review' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.slice(0, totalSteps).map((item, index) => (
          <div key={item.step} className="flex-1 flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              currentStep > item.step 
                ? 'bg-emerald-500 text-white' 
                : currentStep === item.step 
                  ? 'bg-gradient-to-r from-gold-500 to-orange-500 text-white' 
                  : 'bg-slate-700 text-slate-400'
            }`}>
              {currentStep > item.step ? <CheckCircle className="h-4 w-4" /> : item.step}
            </div>
            {index < totalSteps - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${
                currentStep > item.step ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-1">
        {steps.slice(0, totalSteps).map((item) => (
          <span key={item.step} className={`text-xs ${
            currentStep >= item.step ? 'text-slate-300' : 'text-slate-500'
          }`}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// SPORT SELECTION CARD
// =============================================================================

const SportCard = ({
  sport,
  isSelected,
  onSelect,
}: {
  sport: typeof SPORTS[number];
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group relative p-4 rounded-xl border-2 transition-all text-left ${
      isSelected
        ? 'border-gold-500 bg-gold-500/10'
        : 'border-slate-700 hover:border-gold-500/50 bg-slate-800/50'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="text-3xl">{sport.icon}</span>
      <div>
        <p className="font-bold text-white">{sport.label}</p>
        <p className="text-xs text-slate-400">{sport.description}</p>
      </div>
    </div>
    {isSelected && (
      <div className="absolute top-2 right-2">
        <CheckCircle className="h-5 w-5 text-gold-500" />
      </div>
    )}
  </button>
);

// =============================================================================
// TEAM TYPE CARD
// =============================================================================

const TeamTypeCard = ({
  type,
  isSelected,
  onSelect,
}: {
  type: typeof TEAM_TYPES[number];
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group p-4 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? 'border-gold-500 bg-gold-500/10'
          : 'border-slate-700 hover:border-gold-500/50 bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 ${isSelected ? 'text-gold-500' : 'text-slate-400'}`} />
        <div>
          <p className="font-bold text-white">{type.label}</p>
          <p className="text-xs text-slate-400">{type.description}</p>
        </div>
      </div>
    </button>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CreateClubPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [createFirstTeam, setCreateFirstTeam] = useState(true);

  const [clubData, setClubData] = useState<ClubFormData>({
    sport: '',
    name: '',
    shortName: '',
    description: '',
    city: '',
    state: '',
    country: 'United Kingdom',
    address: '',
    postcode: '',
    venue: '',
    venueCapacity: '',
    primaryColor: '#FFD700',
    secondaryColor: '#1A1A2E',
    logo: '',
    website: '',
    teamType: 'AMATEUR',
    foundedYear: new Date().getFullYear().toString(),
    isPublic: true,
    acceptingPlayers: true,
    acceptingStaff: true,
  });

  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    ageGroup: 'SENIOR',
    gender: 'MALE',
    description: '',
  });

  const totalSteps = 7;

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Get sport config
  const selectedSport = useMemo(() => 
    SPORTS.find(s => s.value === clubData.sport),
    [clubData.sport]
  );

  // Validation
  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return !!clubData.sport;
      case 2: return clubData.name.trim().length >= 2;
      case 3: return clubData.city.trim().length >= 2 && !!clubData.country;
      case 4: return true; // Branding is optional
      case 5: return !!clubData.teamType;
      case 6: return !createFirstTeam || teamData.name.trim().length >= 2;
      case 7: return true;
      default: return false;
    }
  }, [step, clubData, teamData, createFirstTeam]);

  // Logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo must be less than 5MB', 'error');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/clubs/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setClubData(prev => ({ ...prev, logo: data.url }));
      showToast('Logo uploaded!', 'success');
    } catch (error) {
      showToast('Failed to upload logo', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!clubData.sport) {
      showToast('Please select a sport', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Club data
          name: clubData.name.trim(),
          shortName: clubData.shortName.trim() || undefined,
          description: clubData.description.trim() || undefined,
          sport: clubData.sport,
          teamType: clubData.teamType,
          city: clubData.city.trim(),
          state: clubData.state.trim() || undefined,
          country: clubData.country,
          address: clubData.address.trim() || undefined,
          postcode: clubData.postcode.trim() || undefined,
          venue: clubData.venue.trim() || undefined,
          venueCapacity: clubData.venueCapacity ? parseInt(clubData.venueCapacity) : undefined,
          primaryColor: clubData.primaryColor,
          secondaryColor: clubData.secondaryColor,
          logo: clubData.logo || undefined,
          website: clubData.website.trim() || undefined,
          foundedYear: clubData.foundedYear ? parseInt(clubData.foundedYear) : undefined,
          isPublic: clubData.isPublic,
          acceptingPlayers: clubData.acceptingPlayers,
          acceptingStaff: clubData.acceptingStaff,
          // First team (optional)
          firstTeam: createFirstTeam ? {
            name: teamData.name.trim(),
            ageGroup: teamData.ageGroup,
            gender: teamData.gender,
            description: teamData.description.trim() || undefined,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create club');
      }

      const data = await response.json();
      showToast('🎉 Club created successfully!', 'success');
      
      setTimeout(() => {
        router.push(`/dashboard/clubs/${data.club?.id || data.clubId}`);
      }, 1200);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create club', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const goNext = () => setStep(s => Math.min(s + 1, totalSteps));
  const goBack = () => setStep(s => Math.max(s - 1, 1));

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
              selectedSport 
                ? `bg-gradient-to-br ${selectedSport.color}` 
                : 'bg-gradient-to-br from-gold-500 to-orange-500'
            }`}>
              {selectedSport ? (
                <span className="text-3xl">{selectedSport.icon}</span>
              ) : (
                <Shield className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Your Club</h1>
              <p className="text-slate-400">
                {selectedSport ? `${selectedSport.label} Club` : 'Multi-sport management platform'}
              </p>
            </div>
          </div>

          <ProgressSteps currentStep={step} totalSteps={totalSteps} />
        </div>

        {/* Step 1: Sport Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Globe className="h-5 w-5 text-gold-400" />
                Select Your Sport
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Choose the primary sport for your club. This determines positions, statistics, and features.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SPORTS.map((sport) => (
                  <SportCard
                    key={sport.value}
                    sport={sport}
                    isSelected={clubData.sport === sport.value}
                    onSelect={() => setClubData(prev => ({ ...prev, sport: sport.value }))}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                Next: Club Details
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5 text-gold-400" />
                Club Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Club Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={clubData.name}
                    onChange={(e) => setClubData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`e.g., Manchester United ${selectedSport?.label || ''} Club`}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Short Name <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={clubData.shortName}
                    onChange={(e) => setClubData(prev => ({ ...prev, shortName: e.target.value.slice(0, 10) }))}
                    placeholder="e.g., MUFC"
                    maxLength={10}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">{clubData.shortName.length}/10 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description <span className="text-slate-500">(Optional)</span>
                  </label>
                  <textarea
                    value={clubData.description}
                    onChange={(e) => setClubData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell us about your club's history, values, and achievements..."
                    rows={4}
                    maxLength={500}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">{clubData.description.length}/500 characters</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                Next: Location
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold-400" />
                Location & Venue
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={clubData.city}
                    onChange={(e) => setClubData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Manchester"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={clubData.country}
                    onChange={(e) => setClubData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    State/Region <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={clubData.state}
                    onChange={(e) => setClubData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., Greater Manchester"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Postcode <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={clubData.postcode}
                    onChange={(e) => setClubData(prev => ({ ...prev, postcode: e.target.value }))}
                    placeholder="e.g., M16 0RA"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Venue / Stadium Name <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={clubData.venue}
                    onChange={(e) => setClubData(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="e.g., Old Trafford"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Venue Capacity <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={clubData.venueCapacity}
                    onChange={(e) => setClubData(prev => ({ ...prev, venueCapacity: e.target.value }))}
                    placeholder="e.g., 75000"
                    min="0"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                Next: Branding
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Branding */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Palette className="h-5 w-5 text-gold-400" />
                Branding & Identity
              </h2>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Club Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl border-4 border-slate-600 bg-slate-700 overflow-hidden">
                      {clubData.logo ? (
                        <Image src={clubData.logo} alt="Logo" width={96} height={96} className="object-cover" />
                      ) : (
                        <Camera className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </button>
                      <p className="text-xs text-slate-500 mt-2">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={clubData.primaryColor}
                        onChange={(e) => setClubData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="h-12 w-12 rounded-lg border-2 border-slate-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={clubData.primaryColor}
                        onChange={(e) => setClubData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#FFD700"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={clubData.secondaryColor}
                        onChange={(e) => setClubData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="h-12 w-12 rounded-lg border-2 border-slate-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={clubData.secondaryColor}
                        onChange={(e) => setClubData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        placeholder="#1A1A2E"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-xl border border-slate-600" style={{ background: `linear-gradient(135deg, ${clubData.primaryColor}20, ${clubData.secondaryColor}40)` }}>
                  <p className="text-sm text-slate-400 mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: clubData.primaryColor }}>
                      {clubData.logo ? (
                        <Image src={clubData.logo} alt="Logo" width={40} height={40} className="rounded object-cover" />
                      ) : (
                        <span className="text-2xl">{selectedSport?.icon || '🏆'}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{clubData.name || 'Your Club Name'}</p>
                      <p className="text-sm" style={{ color: clubData.primaryColor }}>{selectedSport?.label || 'Sport'}</p>
                    </div>
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website <span className="text-slate-500">(Optional)</span></label>
                  <input
                    type="url"
                    value={clubData.website}
                    onChange={(e) => setClubData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourclub.com"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 text-white font-semibold rounded-xl transition-all"
              >
                Next: Organisation Type
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Organisation Type */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gold-400" />
                Organisation Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {TEAM_TYPES.map((type) => (
                  <TeamTypeCard
                    key={type.value}
                    type={type}
                    isSelected={clubData.teamType === type.value}
                    onSelect={() => setClubData(prev => ({ ...prev, teamType: type.value }))}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Founded Year</label>
                  <input
                    type="number"
                    value={clubData.foundedYear}
                    onChange={(e) => setClubData(prev => ({ ...prev, foundedYear: e.target.value }))}
                    placeholder="2024"
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-sm font-medium text-slate-300 mb-4">Club Settings</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clubData.isPublic}
                      onChange={(e) => setClubData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-slate-300">Public club (visible in search)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clubData.acceptingPlayers}
                      onChange={(e) => setClubData(prev => ({ ...prev, acceptingPlayers: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-slate-300">Accepting player registrations</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clubData.acceptingStaff}
                      onChange={(e) => setClubData(prev => ({ ...prev, acceptingStaff: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-slate-300">Accepting staff applications</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                Next: First Team
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: First Team */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-gold-400" />
                Create First Team
              </h2>

              {/* Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gold-500/30 bg-gold-500/10 mb-6">
                <div>
                  <p className="font-semibold text-white">Create first team now?</p>
                  <p className="text-sm text-slate-400">You can add more teams later</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={createFirstTeam} onChange={(e) => setCreateFirstTeam(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-checked:bg-gold-500 rounded-full peer transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                </label>
              </div>

              {createFirstTeam && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Team Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={teamData.name}
                      onChange={(e) => setTeamData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={`e.g., ${clubData.name || 'Club'} First Team`}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Age Group</label>
                      <select
                        value={teamData.ageGroup}
                        onChange={(e) => setTeamData(prev => ({ ...prev, ageGroup: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      >
                        {AGE_GROUPS.map((group) => (
                          <option key={group.value} value={group.value}>{group.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                      <select
                        value={teamData.gender}
                        onChange={(e) => setTeamData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      >
                        {GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description <span className="text-slate-500">(Optional)</span>
                    </label>
                    <textarea
                      value={teamData.description}
                      onChange={(e) => setTeamData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Notes about this team..."
                      rows={3}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                Next: Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {step === 7 && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gold-400" />
                Review Your Club
              </h2>

              {/* Club Summary */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-700/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: clubData.primaryColor }}>
                      {clubData.logo ? (
                        <Image src={clubData.logo} alt="Logo" width={56} height={56} className="rounded-lg object-cover" />
                      ) : (
                        <span className="text-3xl">{selectedSport?.icon}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{clubData.name}</p>
                      <p className="text-sm text-slate-400">{selectedSport?.label} • {TEAM_TYPES.find(t => t.value === clubData.teamType)?.label}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Location</p>
                      <p className="text-white">{clubData.city}, {clubData.country}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Founded</p>
                      <p className="text-white">{clubData.foundedYear}</p>
                    </div>
                    {clubData.venue && (
                      <div>
                        <p className="text-slate-400">Venue</p>
                        <p className="text-white">{clubData.venue}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400">Visibility</p>
                      <p className="text-white">{clubData.isPublic ? 'Public' : 'Private'}</p>
                    </div>
                  </div>
                </div>

                {createFirstTeam && teamData.name && (
                  <div className="p-4 rounded-xl border border-gold-500/30 bg-gold-500/10">
                    <p className="text-sm text-gold-400 mb-2">First Team</p>
                    <p className="font-bold text-white">{teamData.name}</p>
                    <p className="text-sm text-slate-400">
                      {AGE_GROUPS.find(g => g.value === teamData.ageGroup)?.label} • {GENDERS.find(g => g.value === teamData.gender)?.label}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-emerald-400" />
                    <div>
                      <p className="font-bold text-white">You will be the Club Owner</p>
                      <p className="text-sm text-slate-400">Full control over club settings, teams, and members</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold-600 to-orange-500 hover:from-gold-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Create Club
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}