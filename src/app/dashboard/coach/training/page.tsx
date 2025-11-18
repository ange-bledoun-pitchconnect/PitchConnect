/**
 * Training Planner Page
 * Create and manage training sessions with drill builder
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';

interface Drill {
  id: string;
  name: string;
  duration: number;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
  players: number;
  category: 'WARM_UP' | 'TECHNICAL' | 'TACTICAL' | 'COOL_DOWN';
}

const DRILLS: Drill[] = [
  {
    id: '1',
    name: 'Ball Control Circuits',
    duration: 20,
    intensity: 'HIGH',
    players: 22,
    category: 'TECHNICAL',
  },
  {
    id: '2',
    name: 'Possession Game',
    duration: 25,
    intensity: 'MEDIUM',
    players: 22,
    category: 'TACTICAL',
  },
  {
    id: '3',
    name: 'Set Pieces Practice',
    duration: 15,
    intensity: 'HIGH',
    players: 18,
    category: 'TECHNICAL',
  },
  {
    id: '4',
    name: 'Defensive Shape Drills',
    duration: 20,
    intensity: 'MEDIUM',
    players: 22,
    category: 'TACTICAL',
  },
  {
    id: '5',
    name: 'Finishing Drills',
    duration: 20,
    intensity: 'HIGH',
    players: 14,
    category: 'TECHNICAL',
  },
  {
    id: '6',
    name: 'Cool Down Stretching',
    duration: 10,
    intensity: 'LOW',
    players: 22,
    category: 'COOL_DOWN',
  },
  {
    id: '7',
    name: 'Dynamic Warm-Up',
    duration: 15,
    intensity: 'MEDIUM',
    players: 22,
    category: 'WARM_UP',
  },
  {
    id: '8',
    name: 'Transition Play',
    duration: 20,
    intensity: 'HIGH',
    players: 22,
    category: 'TACTICAL',
  },
];

const DEFAULT_SESSION: Drill[] = [DRILLS[6]!, DRILLS[0]!, DRILLS[1]!, DRILLS[4]!, DRILLS[5]!];

export default function TrainingPlannerPage() {
  const { isLoading } = useAuth();
  const [session, setSession] = useState<Drill[]>(DEFAULT_SESSION);
  const [filter, setFilter] = useState<string>('ALL');

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalDuration = session.reduce((sum, drill) => sum + (drill?.duration ?? 0), 0);
  const totalIntensity = session.filter((d) => d.intensity === 'HIGH').length;

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getIntensityIcon = (intensity: string) => {
    switch (intensity) {
      case 'HIGH':
        return '🔥';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return '✅';
      default:
        return '•';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'WARM_UP':
        return 'bg-orange-100 text-orange-700';
      case 'TECHNICAL':
        return 'bg-blue-100 text-blue-700';
      case 'TACTICAL':
        return 'bg-purple-100 text-purple-700';
      case 'COOL_DOWN':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddDrill = (drill: Drill): void => {
    if (!session.find((d) => d.id === drill.id)) {
      setSession([...session, drill]);
    }
  };

  const handleRemoveDrill = (drillId: string): void => {
    setSession(session.filter((d) => d.id !== drillId));
  };

  const filteredDrills =
    filter === 'ALL' ? DRILLS : DRILLS.filter((d) => d.category === filter);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Training Planner</h1>
          <p className="text-charcoal-600">Design and schedule training sessions for your team</p>
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          New Session
        </Button>
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: SESSION BUILDER (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SESSION INFO CARD */}
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-6 h-6 text-gold-600" />
                Today's Training Session
              </CardTitle>
              <CardDescription>Arsenal FC First Team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SESSION METRICS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-gold-50 to-orange-50 rounded-xl border border-gold-200">
                  <p className="text-charcoal-600 text-xs font-semibold mb-2">Duration</p>
                  <p className="text-3xl font-bold text-gold-600">{totalDuration}</p>
                  <p className="text-xs text-charcoal-500 mt-1">minutes</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-charcoal-600 text-xs font-semibold mb-2">Drills</p>
                  <p className="text-3xl font-bold text-blue-600">{session.length}</p>
                  <p className="text-xs text-charcoal-500 mt-1">exercises</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-charcoal-600 text-xs font-semibold mb-2">Intensity</p>
                  <p className="text-3xl font-bold text-purple-600">{totalIntensity}</p>
                  <p className="text-xs text-charcoal-500 mt-1">high-intensity</p>
                </div>
              </div>

              {/* SESSION DETAILS */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gold-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">DATE & TIME</p>
                    <p className="font-bold text-charcoal-900">Monday, Nov 18 • 10:00 AM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">LOCATION</p>
                    <p className="font-bold text-charcoal-900">Emirates Training Ground</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-gold-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">FOCUS</p>
                    <p className="font-bold text-charcoal-900">Tactical Prep for Man City</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TRAINING DRILLS */}
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                Training Drills
              </CardTitle>
              <CardDescription>Order of exercises with details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.length > 0 ? (
                <div className="space-y-3">
                  {session.map((drill, index) => (
                    <div
                      key={drill.id}
                      className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-gold-300 transition-all flex items-start gap-4 group"
                    >
                      {/* Order Number */}
                      <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-orange-400 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Drill Info */}
                      <div className="flex-1">
                        <p className="font-bold text-charcoal-900 mb-2">{drill.name}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 text-charcoal-600">
                            <Clock className="w-4 h-4" />
                            {drill.duration} min
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full font-semibold ${getIntensityColor(
                              drill.intensity
                            )}`}
                          >
                            {getIntensityIcon(drill.intensity)} {drill.intensity}
                          </span>
                          <span className={`px-2 py-1 rounded-full font-semibold ${getCategoryColor(drill.category)}`}>
                            {drill.category.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1 text-charcoal-600">
                            <Users className="w-4 h-4" />
                            {drill.players}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                          <GripVertical className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveDrill(drill.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-charcoal-600 font-medium">No drills added yet</p>
                  <p className="text-charcoal-500 text-sm">Add drills from the library on the right</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md">
              <Save className="w-5 h-5 mr-2" />
              Save Session
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50"
            >
              <Eye className="w-5 h-5 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* RIGHT: DRILL LIBRARY (1/3) */}
        <div className="lg:sticky lg:top-20 space-y-6">
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Drill Library
              </CardTitle>
              <CardDescription>Click to add to session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 pb-3 border-b border-neutral-200">
                {['ALL', 'WARM_UP', 'TECHNICAL', 'TACTICAL', 'COOL_DOWN'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      filter === cat
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-neutral-100 text-charcoal-700 hover:bg-neutral-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Drills List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredDrills.map((drill) => (
                  <div
                    key={drill.id}
                    onClick={() => handleAddDrill(drill)}
                    className={`p-3 rounded-lg cursor-pointer transition-all transform hover:scale-102 border-2 ${
                      session.find((d) => d.id === drill.id)
                        ? 'border-green-400 bg-green-50'
                        : 'border-neutral-200 bg-neutral-50 hover:border-gold-300'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleAddDrill(drill);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-charcoal-900 text-sm">{drill.name}</p>
                      {session.find((d) => d.id === drill.id) && (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="flex items-center gap-1 text-charcoal-600">
                        <Clock className="w-3 h-3" />
                        {drill.duration}m
                      </span>
                      <span className={`px-2 py-0.5 rounded font-semibold ${getCategoryColor(drill.category)}`}>
                        {drill.category.split('_')[0]}
                      </span>
                      <span className="flex items-center gap-1 text-charcoal-600">
                        <Users className="w-3 h-3" />
                        {drill.players}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SESSION SUMMARY */}
          <Card className="bg-gradient-to-br from-green-50 to-transparent border border-green-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Session Ready
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-charcoal-600">
                ✓ {session.length} drills selected
              </p>
              <p className="text-charcoal-600">
                ✓ {totalDuration} minutes planned
              </p>
              <p className="text-charcoal-600">
                ✓ {totalIntensity} high-intensity drills
              </p>
              <p className="text-charcoal-600 font-semibold mt-3 pt-3 border-t border-green-200">
                Ready to save and share!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
