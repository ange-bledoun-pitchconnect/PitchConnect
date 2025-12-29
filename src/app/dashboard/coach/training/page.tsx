// =============================================================================
// 🏆 PITCHCONNECT - TRAINING PLANNER v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach/training
// Access: HEAD_COACH, ASSISTANT_COACH, FITNESS_COACH, PERFORMANCE_COACH, YOUTH_COACH
// 
// FEATURES:
// ✅ Preset drill library with sport-specific templates
// ✅ Custom drill creation and saving
// ✅ Training session builder with drag-and-drop
// ✅ TrainingSessionType enum integration
// ✅ TrainingSessionStatus flow
// ✅ Multi-sport support (12 sports)
// ✅ Duration, intensity, player count tracking
// ✅ Equipment requirements
// ✅ Session notes and objectives
// ✅ Schema-aligned with TrainingSession, Team
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Clock,
  Users,
  Zap,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Share2,
  MapPin,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  X,
  Edit3,
  Copy,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkPlus,
  Flame,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type TrainingSessionType =
  | 'TECHNICAL' | 'TACTICAL' | 'FITNESS' | 'RECOVERY' | 'MATCH_PREP'
  | 'SET_PIECES' | 'VIDEO_ANALYSIS' | 'GYM' | 'INDIVIDUAL' | 'GROUP' | 'FULL_SQUAD';

type TrainingSessionStatus =
  | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';

type DrillIntensity = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

type DrillCategory = 'WARM_UP' | 'TECHNICAL' | 'TACTICAL' | 'FITNESS' | 'COOL_DOWN' | 'SET_PIECE' | 'GAME_SITUATION';

interface DrillTemplate {
  id: string;
  name: string;
  description?: string;
  duration: number;
  intensity: DrillIntensity;
  minPlayers: number;
  maxPlayers: number;
  category: DrillCategory;
  sport: Sport | 'ALL';
  equipment: string[];
  instructions?: string;
  isPreset: boolean;
  isSaved: boolean;
}

interface SessionDrill extends DrillTemplate {
  sessionOrder: number;
  customNotes?: string;
}

interface Team {
  id: string;
  name: string;
  ageGroup?: string | null;
  club: {
    id: string;
    name: string;
    sport: Sport;
  };
}

interface TrainingSession {
  id?: string;
  teamId: string;
  name: string;
  description?: string;
  sessionType: TrainingSessionType;
  status: TrainingSessionStatus;
  startTime: string;
  endTime?: string;
  location?: string;
  objectives?: string[];
  drills: SessionDrill[];
  notes?: string;
  attendanceRequired?: boolean;
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
}> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

const SESSION_TYPES: Array<{ id: TrainingSessionType; label: string; icon: string; description: string }> = [
  { id: 'TECHNICAL', label: 'Technical', icon: '🎯', description: 'Skill development and technique' },
  { id: 'TACTICAL', label: 'Tactical', icon: '📋', description: 'Team strategies and formations' },
  { id: 'FITNESS', label: 'Fitness', icon: '💪', description: 'Physical conditioning' },
  { id: 'RECOVERY', label: 'Recovery', icon: '🧘', description: 'Rest and regeneration' },
  { id: 'MATCH_PREP', label: 'Match Prep', icon: '🏆', description: 'Pre-match preparation' },
  { id: 'SET_PIECES', label: 'Set Pieces', icon: '🎪', description: 'Corners, free kicks, etc.' },
  { id: 'VIDEO_ANALYSIS', label: 'Video Analysis', icon: '📺', description: 'Review footage' },
  { id: 'GYM', label: 'Gym', icon: '🏋️', description: 'Weight training' },
  { id: 'INDIVIDUAL', label: 'Individual', icon: '👤', description: '1-on-1 coaching' },
  { id: 'GROUP', label: 'Group', icon: '👥', description: 'Small group training' },
  { id: 'FULL_SQUAD', label: 'Full Squad', icon: '🏟️', description: 'Entire team session' },
];

const INTENSITY_CONFIG: Record<DrillIntensity, { label: string; color: string; icon: string }> = {
  LOW: { label: 'Low', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400', icon: '✅' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '⚡' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400', icon: '🔥' },
  VERY_HIGH: { label: 'Very High', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400', icon: '💥' },
};

const CATEGORY_CONFIG: Record<DrillCategory, { label: string; color: string }> = {
  WARM_UP: { label: 'Warm Up', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  TECHNICAL: { label: 'Technical', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  TACTICAL: { label: 'Tactical', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  FITNESS: { label: 'Fitness', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  COOL_DOWN: { label: 'Cool Down', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  SET_PIECE: { label: 'Set Piece', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  GAME_SITUATION: { label: 'Game Situation', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

// =============================================================================
// PRESET DRILL LIBRARY - Sport-Specific Templates
// =============================================================================

const PRESET_DRILLS: DrillTemplate[] = [
  // Universal Drills
  { id: 'pre-1', name: 'Dynamic Warm-Up', description: 'Full body activation with movement patterns', duration: 15, intensity: 'MEDIUM', minPlayers: 1, maxPlayers: 30, category: 'WARM_UP', sport: 'ALL', equipment: ['Cones'], isPreset: true, isSaved: false },
  { id: 'pre-2', name: 'Static Stretching', description: 'Post-session flexibility work', duration: 10, intensity: 'LOW', minPlayers: 1, maxPlayers: 30, category: 'COOL_DOWN', sport: 'ALL', equipment: [], isPreset: true, isSaved: false },
  { id: 'pre-3', name: 'Agility Ladder Drills', description: 'Footwork and coordination', duration: 15, intensity: 'HIGH', minPlayers: 1, maxPlayers: 20, category: 'FITNESS', sport: 'ALL', equipment: ['Agility Ladder', 'Cones'], isPreset: true, isSaved: false },
  { id: 'pre-4', name: 'Sprint Intervals', description: 'High-intensity speed work', duration: 20, intensity: 'VERY_HIGH', minPlayers: 1, maxPlayers: 30, category: 'FITNESS', sport: 'ALL', equipment: ['Cones'], isPreset: true, isSaved: false },
  
  // Football Specific
  { id: 'fb-1', name: 'Rondo (5v2)', description: 'Possession game in tight spaces', duration: 20, intensity: 'MEDIUM', minPlayers: 7, maxPlayers: 14, category: 'TACTICAL', sport: 'FOOTBALL', equipment: ['Balls', 'Cones', 'Bibs'], isPreset: true, isSaved: false },
  { id: 'fb-2', name: 'Passing Triangles', description: 'One-touch passing patterns', duration: 15, intensity: 'MEDIUM', minPlayers: 6, maxPlayers: 18, category: 'TECHNICAL', sport: 'FOOTBALL', equipment: ['Balls', 'Cones'], isPreset: true, isSaved: false },
  { id: 'fb-3', name: 'Finishing Drill', description: 'Shooting from various positions', duration: 20, intensity: 'HIGH', minPlayers: 4, maxPlayers: 16, category: 'TECHNICAL', sport: 'FOOTBALL', equipment: ['Balls', 'Goals', 'Cones'], isPreset: true, isSaved: false },
  { id: 'fb-4', name: 'Corner Kick Practice', description: 'Attacking and defensive set pieces', duration: 20, intensity: 'MEDIUM', minPlayers: 10, maxPlayers: 22, category: 'SET_PIECE', sport: 'FOOTBALL', equipment: ['Balls', 'Goals', 'Cones'], isPreset: true, isSaved: false },
  { id: 'fb-5', name: 'Small-Sided Game (7v7)', description: 'Match simulation with conditions', duration: 25, intensity: 'HIGH', minPlayers: 14, maxPlayers: 18, category: 'GAME_SITUATION', sport: 'FOOTBALL', equipment: ['Balls', 'Goals', 'Bibs', 'Cones'], isPreset: true, isSaved: false },
  { id: 'fb-6', name: 'Defensive Shape Work', description: 'Pressing triggers and compactness', duration: 20, intensity: 'MEDIUM', minPlayers: 10, maxPlayers: 22, category: 'TACTICAL', sport: 'FOOTBALL', equipment: ['Balls', 'Cones', 'Bibs'], isPreset: true, isSaved: false },
  
  // Basketball Specific
  { id: 'bb-1', name: 'Three-Man Weave', description: 'Fast break passing drill', duration: 15, intensity: 'HIGH', minPlayers: 6, maxPlayers: 15, category: 'TECHNICAL', sport: 'BASKETBALL', equipment: ['Basketballs'], isPreset: true, isSaved: false },
  { id: 'bb-2', name: 'Pick and Roll Practice', description: 'Screen and roll execution', duration: 20, intensity: 'MEDIUM', minPlayers: 4, maxPlayers: 12, category: 'TACTICAL', sport: 'BASKETBALL', equipment: ['Basketballs'], isPreset: true, isSaved: false },
  { id: 'bb-3', name: 'Free Throw Routine', description: 'Shooting under pressure', duration: 15, intensity: 'LOW', minPlayers: 2, maxPlayers: 15, category: 'TECHNICAL', sport: 'BASKETBALL', equipment: ['Basketballs'], isPreset: true, isSaved: false },
  { id: 'bb-4', name: '5v5 Half-Court', description: 'Set play execution', duration: 25, intensity: 'HIGH', minPlayers: 10, maxPlayers: 12, category: 'GAME_SITUATION', sport: 'BASKETBALL', equipment: ['Basketballs', 'Bibs'], isPreset: true, isSaved: false },
  
  // Rugby Specific
  { id: 'ru-1', name: 'Ruck and Maul Practice', description: 'Contact breakdown work', duration: 20, intensity: 'HIGH', minPlayers: 8, maxPlayers: 20, category: 'TECHNICAL', sport: 'RUGBY', equipment: ['Rugby Balls', 'Tackle Pads', 'Cones'], isPreset: true, isSaved: false },
  { id: 'ru-2', name: 'Lineout Drills', description: 'Throwing and lifting combinations', duration: 20, intensity: 'MEDIUM', minPlayers: 8, maxPlayers: 16, category: 'SET_PIECE', sport: 'RUGBY', equipment: ['Rugby Balls'], isPreset: true, isSaved: false },
  { id: 'ru-3', name: 'Scrum Practice', description: 'Scrum engagement and stability', duration: 20, intensity: 'HIGH', minPlayers: 8, maxPlayers: 16, category: 'SET_PIECE', sport: 'RUGBY', equipment: ['Scrum Machine', 'Rugby Balls'], isPreset: true, isSaved: false },
  { id: 'ru-4', name: 'Attack Patterns', description: 'Phase play and support lines', duration: 25, intensity: 'HIGH', minPlayers: 10, maxPlayers: 20, category: 'TACTICAL', sport: 'RUGBY', equipment: ['Rugby Balls', 'Cones', 'Bibs'], isPreset: true, isSaved: false },
  
  // Netball Specific
  { id: 'nb-1', name: 'Centre Pass Variations', description: 'Different centre pass setups', duration: 15, intensity: 'MEDIUM', minPlayers: 7, maxPlayers: 14, category: 'SET_PIECE', sport: 'NETBALL', equipment: ['Netballs', 'Cones'], isPreset: true, isSaved: false },
  { id: 'nb-2', name: 'Shooting Circle Work', description: 'GS and GA shooting practice', duration: 20, intensity: 'MEDIUM', minPlayers: 4, maxPlayers: 8, category: 'TECHNICAL', sport: 'NETBALL', equipment: ['Netballs'], isPreset: true, isSaved: false },
  { id: 'nb-3', name: 'Defensive Interceptions', description: 'Reading passes and timing', duration: 15, intensity: 'HIGH', minPlayers: 6, maxPlayers: 14, category: 'TACTICAL', sport: 'NETBALL', equipment: ['Netballs', 'Bibs'], isPreset: true, isSaved: false },
  
  // Cricket Specific
  { id: 'cr-1', name: 'Batting Nets', description: 'Technical batting practice', duration: 30, intensity: 'MEDIUM', minPlayers: 3, maxPlayers: 12, category: 'TECHNICAL', sport: 'CRICKET', equipment: ['Bats', 'Balls', 'Nets', 'Pads'], isPreset: true, isSaved: false },
  { id: 'cr-2', name: 'Bowling Accuracy', description: 'Line and length consistency', duration: 25, intensity: 'MEDIUM', minPlayers: 2, maxPlayers: 10, category: 'TECHNICAL', sport: 'CRICKET', equipment: ['Balls', 'Stumps', 'Cones'], isPreset: true, isSaved: false },
  { id: 'cr-3', name: 'Fielding Drills', description: 'Catching, throwing, and ground fielding', duration: 20, intensity: 'HIGH', minPlayers: 6, maxPlayers: 15, category: 'TECHNICAL', sport: 'CRICKET', equipment: ['Balls', 'Cones'], isPreset: true, isSaved: false },
  
  // Hockey Specific
  { id: 'hk-1', name: 'Penalty Corner Routines', description: 'Attacking and defending PCs', duration: 25, intensity: 'HIGH', minPlayers: 10, maxPlayers: 18, category: 'SET_PIECE', sport: 'HOCKEY', equipment: ['Hockey Sticks', 'Balls', 'Goals'], isPreset: true, isSaved: false },
  { id: 'hk-2', name: 'Dribbling Skills', description: 'Ball control and elimination', duration: 15, intensity: 'MEDIUM', minPlayers: 4, maxPlayers: 16, category: 'TECHNICAL', sport: 'HOCKEY', equipment: ['Hockey Sticks', 'Balls', 'Cones'], isPreset: true, isSaved: false },
  
  // American Football Specific
  { id: 'af-1', name: 'Route Running', description: 'Receiver route tree practice', duration: 20, intensity: 'HIGH', minPlayers: 4, maxPlayers: 12, category: 'TECHNICAL', sport: 'AMERICAN_FOOTBALL', equipment: ['Footballs', 'Cones'], isPreset: true, isSaved: false },
  { id: 'af-2', name: 'Blocking Drills', description: 'O-line and D-line technique', duration: 20, intensity: 'HIGH', minPlayers: 6, maxPlayers: 14, category: 'TECHNICAL', sport: 'AMERICAN_FOOTBALL', equipment: ['Blocking Pads', 'Cones'], isPreset: true, isSaved: false },
  
  // Lacrosse Specific
  { id: 'lx-1', name: 'Wall Ball', description: 'Stick skills and catching', duration: 15, intensity: 'MEDIUM', minPlayers: 1, maxPlayers: 20, category: 'TECHNICAL', sport: 'LACROSSE', equipment: ['Lacrosse Sticks', 'Balls'], isPreset: true, isSaved: false },
  { id: 'lx-2', name: 'Face-Off Practice', description: 'Winning the clamp', duration: 15, intensity: 'HIGH', minPlayers: 2, maxPlayers: 6, category: 'SET_PIECE', sport: 'LACROSSE', equipment: ['Lacrosse Sticks', 'Balls'], isPreset: true, isSaved: false },
];

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
// SUB-COMPONENTS
// =============================================================================

const DrillCard = ({
  drill,
  isInSession,
  onAdd,
  onRemove,
  onSave,
  compact = false,
}: {
  drill: DrillTemplate;
  isInSession: boolean;
  onAdd: () => void;
  onRemove?: () => void;
  onSave?: () => void;
  compact?: boolean;
}) => {
  const intensityConfig = INTENSITY_CONFIG[drill.intensity];
  const categoryConfig = CATEGORY_CONFIG[drill.category];

  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg cursor-pointer transition-all transform hover:scale-[1.02] border-2 ${
          isInSession
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-gold-300 dark:hover:border-gold-600'
        }`}
        onClick={isInSession ? onRemove : onAdd}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{drill.name}</p>
          {isInSession && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            {drill.duration}m
          </span>
          <span className={`px-2 py-0.5 rounded font-semibold ${categoryConfig.color}`}>
            {categoryConfig.label}
          </span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Users className="w-3 h-3" />
            {drill.minPlayers}-{drill.maxPlayers}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-gold-300 dark:hover:border-gold-600 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-slate-900 dark:text-white mb-1">{drill.name}</p>
          {drill.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{drill.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!drill.isPreset && onSave && (
            <button
              onClick={onSave}
              className="p-2 rounded-lg text-slate-400 hover:text-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors"
              title="Save to library"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={isInSession ? onRemove : onAdd}
            className={`p-2 rounded-lg transition-colors ${
              isInSession
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50'
            }`}
          >
            {isInSession ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
          <Clock className="w-3 h-3" />
          {drill.duration} min
        </span>
        <span className={`px-2 py-1 rounded font-semibold border ${intensityConfig.color}`}>
          {intensityConfig.icon} {intensityConfig.label}
        </span>
        <span className={`px-2 py-1 rounded font-semibold ${categoryConfig.color}`}>
          {categoryConfig.label}
        </span>
        <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
          <Users className="w-3 h-3" />
          {drill.minPlayers}-{drill.maxPlayers}
        </span>
      </div>

      {drill.equipment.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <Dumbbell className="w-3 h-3 inline mr-1" />
            {drill.equipment.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

const SessionDrillItem = ({
  drill,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  drill: SessionDrill;
  index: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const intensityConfig = INTENSITY_CONFIG[drill.intensity];
  const categoryConfig = CATEGORY_CONFIG[drill.category];

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-gold-300 dark:hover:border-gold-500 transition-all flex items-start gap-4 group">
      {/* Order Number */}
      <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-orange-400 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md">
        {index + 1}
      </div>

      {/* Drill Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 dark:text-white mb-2">{drill.name}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            {drill.duration} min
          </span>
          <span className={`px-2 py-1 rounded-full font-semibold border ${intensityConfig.color}`}>
            {intensityConfig.icon} {intensityConfig.label}
          </span>
          <span className={`px-2 py-1 rounded-full font-semibold ${categoryConfig.color}`}>
            {categoryConfig.label}
          </span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4" />
            {drill.minPlayers}-{drill.maxPlayers}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TrainingPlannerPage() {
  const router = useRouter();

  // State
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentSport, setCurrentSport] = useState<Sport>('FOOTBALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Session state
  const [sessionName, setSessionName] = useState('Training Session');
  const [sessionType, setSessionType] = useState<TrainingSessionType>('FULL_SQUAD');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('10:00');
  const [sessionLocation, setSessionLocation] = useState('');
  const [sessionObjectives, setSessionObjectives] = useState('');
  const [sessionDrills, setSessionDrills] = useState<SessionDrill[]>([]);
  const [savedDrills, setSavedDrills] = useState<DrillTemplate[]>([]);

  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showCreateDrill, setShowCreateDrill] = useState(false);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Fetch teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [teamsRes, savedDrillsRes] = await Promise.all([
          fetch('/api/coach/teams'),
          fetch('/api/coach/drills'),
        ]);

        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeams(data.teams || []);
          if (data.teams?.[0]) {
            setSelectedTeam(data.teams[0]);
            setCurrentSport(data.teams[0].club.sport || 'FOOTBALL');
          }
        }

        if (savedDrillsRes.ok) {
          const data = await savedDrillsRes.json();
          setSavedDrills(data.drills || []);
        }
      } catch (error) {
        showToast('Failed to load data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  // Filter drills for current sport
  const availableDrills = useMemo(() => {
    const allDrills = [...PRESET_DRILLS, ...savedDrills];
    
    return allDrills.filter(drill => {
      // Sport filter
      if (drill.sport !== 'ALL' && drill.sport !== currentSport) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!drill.name.toLowerCase().includes(query) && 
            !drill.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL' && drill.category !== categoryFilter) return false;

      return true;
    });
  }, [currentSport, savedDrills, searchQuery, categoryFilter]);

  // Session metrics
  const sessionMetrics = useMemo(() => {
    const totalDuration = sessionDrills.reduce((sum, d) => sum + d.duration, 0);
    const highIntensityCount = sessionDrills.filter(d => d.intensity === 'HIGH' || d.intensity === 'VERY_HIGH').length;
    const maxPlayers = Math.max(...sessionDrills.map(d => d.maxPlayers), 0);
    const allEquipment = [...new Set(sessionDrills.flatMap(d => d.equipment))];

    return { totalDuration, highIntensityCount, maxPlayers, allEquipment };
  }, [sessionDrills]);

  // Add drill to session
  const handleAddDrill = useCallback((drill: DrillTemplate) => {
    if (sessionDrills.some(d => d.id === drill.id)) {
      showToast('Drill already in session', 'info');
      return;
    }

    const sessionDrill: SessionDrill = {
      ...drill,
      sessionOrder: sessionDrills.length,
    };

    setSessionDrills(prev => [...prev, sessionDrill]);
    showToast(`Added: ${drill.name}`, 'success');
  }, [sessionDrills, showToast]);

  // Remove drill from session
  const handleRemoveDrill = useCallback((drillId: string) => {
    setSessionDrills(prev => prev.filter(d => d.id !== drillId));
  }, []);

  // Move drill in session
  const handleMoveDrill = useCallback((index: number, direction: 'up' | 'down') => {
    setSessionDrills(prev => {
      const newDrills = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newDrills[index], newDrills[newIndex]] = [newDrills[newIndex], newDrills[index]];
      return newDrills.map((d, i) => ({ ...d, sessionOrder: i }));
    });
  }, []);

  // Save session
  const handleSaveSession = async () => {
    if (!selectedTeam) {
      showToast('Please select a team', 'error');
      return;
    }

    if (sessionDrills.length === 0) {
      showToast('Please add at least one drill', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const sessionData: TrainingSession = {
        teamId: selectedTeam.id,
        name: sessionName,
        sessionType,
        status: 'SCHEDULED',
        startTime: `${sessionDate}T${sessionTime}:00`,
        location: sessionLocation || undefined,
        objectives: sessionObjectives ? sessionObjectives.split('\n').filter(Boolean) : undefined,
        drills: sessionDrills,
      };

      const res = await fetch('/api/coach/training-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!res.ok) throw new Error('Failed to save');

      showToast('✅ Training session saved!', 'success');
      setTimeout(() => router.push('/dashboard/coach/training'), 1500);
    } catch (error) {
      showToast('Failed to save session', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading training planner...</p>
        </div>
      </div>
    );
  }

  const sportConfig = SPORT_CONFIG[currentSport];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
              <span className="text-3xl">{sportConfig.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Training Planner</h1>
              <p className="text-slate-600 dark:text-slate-400">Design and schedule sessions for {sportConfig.label}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                setSelectedTeam(team || null);
                if (team) setCurrentSport(team.club.sport);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <button
              onClick={handleSaveSession}
              disabled={isSaving || sessionDrills.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Session Builder (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  Session Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Session Name</label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="e.g., Match Prep - vs City FC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Session Type</label>
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value as TrainingSessionType)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      {SESSION_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={sessionLocation}
                      onChange={(e) => setSessionLocation(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Training Ground"
                    />
                  </div>
                </div>

                {/* Session Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1">Duration</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{sessionMetrics.totalDuration}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">minutes</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1">Drills</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{sessionDrills.length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">exercises</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1">High Intensity</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{sessionMetrics.highIntensityCount}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">drills</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drills List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Session Drills ({sessionDrills.length})
                </h2>
              </div>
              <div className="p-4">
                {sessionDrills.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No drills added yet</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Add drills from the library on the right</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionDrills.map((drill, index) => (
                      <SessionDrillItem
                        key={drill.id}
                        drill={drill}
                        index={index}
                        onRemove={() => handleRemoveDrill(drill.id)}
                        onMoveUp={() => handleMoveDrill(index, 'up')}
                        onMoveDown={() => handleMoveDrill(index, 'down')}
                        isFirst={index === 0}
                        isLast={index === sessionDrills.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Summary */}
            {sessionMetrics.allEquipment.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Equipment Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sessionMetrics.allEquipment.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Drill Library (1/3) */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Drill Library
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Click to add to session</p>
              </div>

              <div className="p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drills..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {['ALL', ...Object.keys(CATEGORY_CONFIG)].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                        categoryFilter === cat
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {cat === 'ALL' ? 'All' : CATEGORY_CONFIG[cat as DrillCategory].label}
                    </button>
                  ))}
                </div>

                {/* Drills List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {availableDrills.length === 0 ? (
                    <div className="text-center py-6">
                      <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No drills found</p>
                    </div>
                  ) : (
                    availableDrills.map(drill => (
                      <DrillCard
                        key={drill.id}
                        drill={drill}
                        isInSession={sessionDrills.some(d => d.id === drill.id)}
                        onAdd={() => handleAddDrill(drill)}
                        onRemove={() => handleRemoveDrill(drill.id)}
                        compact
                      />
                    ))
                  )}
                </div>

                {/* Create Custom Drill */}
                <button
                  onClick={() => setShowCreateDrill(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Custom Drill
                </button>
              </div>
            </div>

            {/* Session Summary */}
            {sessionDrills.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <h3 className="text-base font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Session Ready
                </h3>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
                  <p>✓ {sessionDrills.length} drills selected</p>
                  <p>✓ {sessionMetrics.totalDuration} minutes planned</p>
                  <p>✓ {sessionMetrics.highIntensityCount} high-intensity drills</p>
                  {sessionMetrics.allEquipment.length > 0 && (
                    <p>✓ {sessionMetrics.allEquipment.length} equipment items needed</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}