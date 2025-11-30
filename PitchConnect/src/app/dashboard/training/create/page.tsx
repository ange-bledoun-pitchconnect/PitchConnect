'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Zap,
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  club: {
    name: string;
  };
}

interface Drill {
  id: string;
  name: string;
  description: string;
  duration: number;
  intensity: string;
  category: string;
}

export default function CreateTrainingSessionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableDrills, setAvailableDrills] = useState<Drill[]>([]);
  const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingDrills, setIsLoadingDrills] = useState(true);

  const [sessionData, setSessionData] = useState({
    teamId: '',
    date: '',
    time: '',
    duration: 90,
    location: '',
    focus: '',
    notes: '',
  });

  useEffect(() => {
    fetchTeams();
    fetchDrills();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchDrills = async () => {
    try {
      const response = await fetch('/api/training/drills');
      if (!response.ok) throw new Error('Failed to fetch drills');

      const data = await response.json();
      setAvailableDrills(data.drills || []);
    } catch (error) {
      console.error('Error fetching drills:', error);
      toast.error('Failed to load drills');
    } finally {
      setIsLoadingDrills(false);
    }
  };

  const handleAddDrill = (drillId: string) => {
    if (!selectedDrills.includes(drillId)) {
      setSelectedDrills([...selectedDrills, drillId]);
    }
  };

  const handleRemoveDrill = (drillId: string) => {
    setSelectedDrills(selectedDrills.filter((id) => id !== drillId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionData.teamId || !sessionData.date || !sessionData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionDateTime = new Date(`${sessionData.date}T${sessionData.time}`);

      const response = await fetch('/api/training/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: sessionData.teamId,
          date: sessionDateTime.toISOString(),
          duration: sessionData.duration,
          location: sessionData.location || null,
          focus: sessionData.focus,
          notes: sessionData.notes || null,
          drills: selectedDrills,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create training session');
      }

      const data = await response.json();
      toast.success('⚡ Training session created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/training/${data.sessionId}`);
      }, 1000);
    } catch (error) {
      console.error('Training session creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDrillDuration = selectedDrills.reduce((total, drillId) => {
    const drill = availableDrills.find((d) => d.id === drillId);
    return total + (drill?.duration || 0);
  }, 0);

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-700 border-red-300">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Low</Badge>;
      default:
        return <Badge variant="outline">{intensity}</Badge>;
    }
  };

  if (isLoadingTeams || isLoadingDrills) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/training')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Training
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Create Training Session</h1>
              <p className="text-charcoal-600">Schedule a new training session with drills</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Session Details
              </CardTitle>
              <CardDescription>Basic information about the training session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Selection */}
              <div className="space-y-2">
                <Label htmlFor="team">
                  Team <span className="text-red-500">*</span>
                </Label>
                <select
                  id="team"
                  value={sessionData.teamId}
                  onChange={(e) => setSessionData({ ...sessionData, teamId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.club.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">
                    Start Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={sessionData.time}
                    onChange={(e) => setSessionData({ ...sessionData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Duration & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="30"
                    max="180"
                    value={sessionData.duration}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, duration: parseInt(e.target.value) || 90 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={sessionData.location}
                    onChange={(e) => setSessionData({ ...sessionData, location: e.target.value })}
                    placeholder="e.g., Training Ground A"
                  />
                </div>
              </div>

              {/* Focus */}
              <div className="space-y-2">
                <Label htmlFor="focus">
                  Training Focus <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="focus"
                  value={sessionData.focus}
                  onChange={(e) => setSessionData({ ...sessionData, focus: e.target.value })}
                  placeholder="e.g., Passing & Movement"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  value={sessionData.notes}
                  onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
                  placeholder="Additional notes about the session..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Drill Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    Training Drills
                  </CardTitle>
                  <CardDescription>
                    Select drills for this session ({selectedDrills.length} selected, {totalDrillDuration} min total)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Selected Drills */}
              {selectedDrills.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-charcoal-900 mb-3">Selected Drills</h3>
                  <div className="space-y-2">
                    {selectedDrills.map((drillId, index) => {
                      const drill = availableDrills.find((d) => d.id === drillId);
                      if (!drill) return null;

                      return (
                        <div
                          key={drillId}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-charcoal-900">{drill.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{drill.duration} min</Badge>
                                {getIntensityBadge(drill.intensity)}
                                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                  {drill.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDrill(drillId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Drills */}
              <div>
                <h3 className="font-semibold text-charcoal-900 mb-3">Available Drills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableDrills
                    .filter((drill) => !selectedDrills.includes(drill.id))
                    .map((drill) => (
                      <Card
                        key={drill.id}
                        className="hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleAddDrill(drill.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-charcoal-900">{drill.name}</h4>
                            <Button type="button" size="sm" variant="ghost">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-charcoal-600 mb-3">{drill.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{drill.duration} min</Badge>
                            {getIntensityBadge(drill.intensity)}
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              {drill.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/training')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !sessionData.teamId || !sessionData.date}
              className="bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
