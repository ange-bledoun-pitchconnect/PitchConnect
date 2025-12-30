// ============================================================================
// 🏆 PITCHCONNECT - Create Training Session (Enterprise v7.7.0)
// ============================================================================
// Path: app/dashboard/training/create/page.tsx
// Full multi-sport support with drill library integration
// ============================================================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getSportConfig,
  getDrillCategories,
  formatDuration,
} from '@/lib/sports/sport-config';
import { 
  Sport, 
  TrainingIntensity, 
  TrainingCategory,
  DrillCategory,
  DrillIntensity,
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface ClubOption {
  id: string;
  name: string;
  sport: Sport;
  logo: string | null;
  teams: { id: string; name: string }[];
}

interface DrillOption {
  id: string;
  name: string;
  description: string | null;
  category: DrillCategory;
  intensity: DrillIntensity;
  defaultDuration: number;
  sport: Sport | null;
  equipment: string[];
}

interface SelectedDrill {
  drillId: string;
  drill: DrillOption;
  duration: number;
  order: number;
  notes: string;
}

interface FormData {
  name: string;
  description: string;
  clubId: string;
  teamId: string;
  startDate: string;
  startTime: string;
  duration: number;
  intensity: TrainingIntensity;
  category: TrainingCategory;
  location: string;
  maxParticipants: number | null;
  focusAreas: string[];
  equipment: string[];
  notes: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INTENSITY_OPTIONS: { value: TrainingIntensity; label: string; icon: string; color: string }[] = [
  { value: 'RECOVERY', label: 'Recovery', icon: '🧘', color: '#22c55e' },
  { value: 'LOW', label: 'Low', icon: '🚶', color: '#84cc16' },
  { value: 'MEDIUM', label: 'Medium', icon: '🏃', color: '#f59e0b' },
  { value: 'HIGH', label: 'High', icon: '🔥', color: '#ef4444' },
  { value: 'MAXIMUM', label: 'Maximum', icon: '💥', color: '#dc2626' },
  { value: 'COMPETITIVE', label: 'Match Intensity', icon: '🏆', color: '#8b5cf6' },
];

const CATEGORY_OPTIONS: { value: TrainingCategory; label: string }[] = [
  { value: 'PASSING', label: 'Passing' },
  { value: 'SHOOTING', label: 'Shooting' },
  { value: 'DEFENDING', label: 'Defending' },
  { value: 'POSSESSION', label: 'Possession' },
  { value: 'SET_PIECES', label: 'Set Pieces' },
  { value: 'DRIBBLING', label: 'Dribbling' },
  { value: 'CONDITIONING', label: 'Conditioning' },
  { value: 'STRENGTH_POWER', label: 'Strength & Power' },
  { value: 'SPEED_AGILITY', label: 'Speed & Agility' },
  { value: 'TACTICAL', label: 'Tactical' },
  { value: 'FORMATION_WORK', label: 'Formation Work' },
  { value: 'GAME_STRATEGY', label: 'Game Strategy' },
  { value: 'RECOVERY', label: 'Recovery Session' },
  { value: 'GOALKEEPER_SPECIFIC', label: 'Goalkeeper Specific' },
  { value: 'POSITION_SPECIFIC', label: 'Position Specific' },
  { value: 'SPORT_SPECIFIC', label: 'Sport Specific' },
  { value: 'MATCH_SIMULATION', label: 'Match Simulation' },
  { value: 'TEAM_BUILDING', label: 'Team Building' },
];

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

// ============================================================================
// CUSTOM TOAST COMPONENT
// ============================================================================

function Toast({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error' | 'info'; 
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[type]} animate-slide-up`}>
      <span className="text-lg">{icons[type]}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
        ✕
      </button>
    </div>
  );
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

function FormSection({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FormField({ 
  label, 
  required, 
  error, 
  children 
}: { 
  label: string; 
  required?: boolean; 
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-amber-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

function IntensitySelector({
  value,
  onChange,
}: {
  value: TrainingIntensity;
  onChange: (value: TrainingIntensity) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {INTENSITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            p-3 rounded-xl border text-center transition-all
            ${value === opt.value
              ? 'border-2 shadow-lg'
              : 'border-[#3a3a3a] hover:border-[#4a4a4a]'
            }
          `}
          style={value === opt.value ? {
            borderColor: opt.color,
            backgroundColor: `${opt.color}15`,
          } : undefined}
        >
          <div className="text-2xl mb-1">{opt.icon}</div>
          <div 
            className="text-sm font-medium"
            style={{ color: value === opt.value ? opt.color : '#9ca3af' }}
          >
            {opt.label}
          </div>
        </button>
      ))}
    </div>
  );
}

function DrillSelector({
  drills,
  selectedDrills,
  onAdd,
  onRemove,
  onUpdate,
  sport,
}: {
  drills: DrillOption[];
  selectedDrills: SelectedDrill[];
  onAdd: (drill: DrillOption) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<SelectedDrill>) => void;
  sport: Sport | null;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DrillCategory | 'all'>('all');
  const sportDrillCategories = sport ? getDrillCategories(sport) : [];

  const filteredDrills = useMemo(() => {
    return drills.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      const matchesSport = !sport || !d.sport || d.sport === sport;
      const notSelected = !selectedDrills.find(sd => sd.drillId === d.id);
      return matchesSearch && matchesCategory && matchesSport && notSelected;
    });
  }, [drills, searchQuery, categoryFilter, sport, selectedDrills]);

  const totalDuration = selectedDrills.reduce((sum, d) => sum + d.duration, 0);

  const intensityColors: Record<DrillIntensity, string> = {
    RECOVERY: '#22c55e',
    LOW: '#84cc16',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    MAXIMUM: '#dc2626',
    VARIABLE: '#8b5cf6',
  };

  return (
    <div className="space-y-6">
      {/* Selected Drills */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">
            Selected Drills ({selectedDrills.length})
          </h3>
          <span className="text-sm text-gray-400">
            Total: {formatDuration(totalDuration)}
          </span>
        </div>
        
        {selectedDrills.length > 0 ? (
          <div className="space-y-3">
            {selectedDrills.map((sd, index) => (
              <div 
                key={`${sd.drillId}-${index}`}
                className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white truncate">{sd.drill.name}</h4>
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="number"
                        value={sd.duration}
                        onChange={(e) => onUpdate(index, { duration: parseInt(e.target.value) || 0 })}
                        className="w-20 px-3 py-1.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white text-sm"
                        min={1}
                        max={120}
                      />
                      <span className="text-sm text-gray-400">minutes</span>
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${intensityColors[sd.drill.intensity]}20`,
                          color: intensityColors[sd.drill.intensity],
                        }}
                      >
                        {sd.drill.intensity}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Add notes for this drill..."
                      value={sd.notes}
                      onChange={(e) => onUpdate(index, { notes: e.target.value })}
                      className="w-full mt-2 px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white text-sm placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-[#3a3a3a] rounded-xl">
            <p className="text-gray-400">No drills selected. Add drills from the library below.</p>
          </div>
        )}
      </div>

      {/* Drill Library */}
      <div>
        <h3 className="font-medium text-white mb-4">Drill Library</h3>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search drills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as DrillCategory | 'all')}
            className="px-4 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Categories</option>
            {sportDrillCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Drill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
          {filteredDrills.map((drill) => (
            <button
              key={drill.id}
              type="button"
              onClick={() => onAdd(drill)}
              className="text-left p-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl hover:border-amber-500/30 transition-all group"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-white group-hover:text-amber-400 transition-colors">
                  {drill.name}
                </h4>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{drill.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">{drill.defaultDuration} min</span>
                <span 
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: `${intensityColors[drill.intensity]}20`,
                    color: intensityColors[drill.intensity],
                  }}
                >
                  {drill.intensity}
                </span>
              </div>
            </button>
          ))}
          {filteredDrills.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-400">
              No drills found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateTrainingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Mock data - in real app, fetch from API
  const [clubs, setClubs] = useState<ClubOption[]>([
    {
      id: '1',
      name: 'Example FC',
      sport: 'FOOTBALL',
      logo: null,
      teams: [
        { id: '1', name: 'First Team' },
        { id: '2', name: 'U21s' },
      ],
    },
  ]);
  
  const [drills, setDrills] = useState<DrillOption[]>([
    {
      id: '1',
      name: 'Passing Triangles',
      description: 'Quick one-touch passing in triangle formation to improve first touch and awareness',
      category: 'PASSING',
      intensity: 'MEDIUM',
      defaultDuration: 15,
      sport: 'FOOTBALL',
      equipment: ['Balls', 'Cones'],
    },
    {
      id: '2',
      name: 'Shooting Drill - Box Work',
      description: 'Finishing practice from various angles inside the penalty area',
      category: 'SHOOTING',
      intensity: 'HIGH',
      defaultDuration: 20,
      sport: 'FOOTBALL',
      equipment: ['Balls', 'Goals'],
    },
    {
      id: '3',
      name: 'Defensive Shape',
      description: 'Team defensive positioning and communication drill',
      category: 'DEFENSIVE_SHAPE',
      intensity: 'MEDIUM',
      defaultDuration: 15,
      sport: 'FOOTBALL',
      equipment: ['Balls', 'Cones', 'Bibs'],
    },
    {
      id: '4',
      name: 'Dynamic Warm-Up',
      description: 'Full body activation with dynamic stretching and light movement',
      category: 'WARM_UP',
      intensity: 'LOW',
      defaultDuration: 10,
      sport: null,
      equipment: [],
    },
    {
      id: '5',
      name: 'Small-Sided Game 5v5',
      description: 'High-intensity small-sided game focusing on quick transitions',
      category: 'SMALL_SIDED_GAMES',
      intensity: 'HIGH',
      defaultDuration: 20,
      sport: 'FOOTBALL',
      equipment: ['Balls', 'Goals', 'Bibs'],
    },
  ]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    clubId: '',
    teamId: '',
    startDate: '',
    startTime: '',
    duration: 90,
    intensity: 'MEDIUM',
    category: 'TACTICAL',
    location: '',
    maxParticipants: null,
    focusAreas: [],
    equipment: [],
    notes: '',
  });

  const [selectedDrills, setSelectedDrills] = useState<SelectedDrill[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedClub = clubs.find(c => c.id === formData.clubId);
  const sportConfig = selectedClub ? getSportConfig(selectedClub.sport) : null;

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddDrill = (drill: DrillOption) => {
    setSelectedDrills(prev => [
      ...prev,
      {
        drillId: drill.id,
        drill,
        duration: drill.defaultDuration,
        order: prev.length,
        notes: '',
      },
    ]);
  };

  const handleRemoveDrill = (index: number) => {
    setSelectedDrills(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDrill = (index: number, updates: Partial<SelectedDrill>) => {
    setSelectedDrills(prev => prev.map((d, i) => i === index ? { ...d, ...updates } : d));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Session name is required';
    if (!formData.clubId) newErrors.clubId = 'Please select a club';
    if (!formData.startDate) newErrors.startDate = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setToast({ message: 'Training session created successfully!', type: 'success' });
      
      setTimeout(() => {
        router.push('/dashboard/training');
      }, 1500);
    } catch (error) {
      setToast({ message: 'Failed to create session. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/dashboard/training" className="text-gray-400 hover:text-white transition-colors">
              Training
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-amber-400">Create Session</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Create Training Session</h1>
              <p className="text-gray-400">Plan and schedule a new training session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Basic Info */}
        <FormSection title="Basic Information" description="Name and describe your training session">
          <div className="space-y-6">
            <FormField label="Session Name" required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Pre-Match Tactical Session"
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the goals and focus of this session..."
                rows={4}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Club" required error={errors.clubId}>
                <select
                  value={formData.clubId}
                  onChange={(e) => {
                    handleChange('clubId', e.target.value);
                    handleChange('teamId', '');
                  }}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select club...</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {getSportConfig(club.sport).icon} {club.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Team">
                <select
                  value={formData.teamId}
                  onChange={(e) => handleChange('teamId', e.target.value)}
                  disabled={!formData.clubId}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                >
                  <option value="">All Teams / Club-wide</option>
                  {selectedClub?.teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        </FormSection>

        {/* Schedule */}
        <FormSection title="Schedule" description="When and where will this session take place">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField label="Date" required error={errors.startDate}>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                />
              </FormField>

              <FormField label="Start Time" required error={errors.startTime}>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                />
              </FormField>

              <FormField label="Duration">
                <select
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{formatDuration(d)}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Location">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Training Ground - Pitch 1"
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </FormField>
          </div>
        </FormSection>

        {/* Intensity & Category */}
        <FormSection title="Session Type" description="Define the intensity and focus of this session">
          <div className="space-y-6">
            <FormField label="Intensity Level">
              <IntensitySelector
                value={formData.intensity}
                onChange={(value) => handleChange('intensity', value)}
              />
            </FormField>

            <FormField label="Category">
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value as TrainingCategory)}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:border-amber-500/50"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </FormSection>

        {/* Drills */}
        <FormSection title="Training Drills" description="Select drills from your library for this session">
          <DrillSelector
            drills={drills}
            selectedDrills={selectedDrills}
            onAdd={handleAddDrill}
            onRemove={handleRemoveDrill}
            onUpdate={handleUpdateDrill}
            sport={selectedClub?.sport || null}
          />
        </FormSection>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Session'
            )}
          </button>
        </div>
      </form>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}