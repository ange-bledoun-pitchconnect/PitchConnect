'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Users,
  Plus,
  Loader2,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CreateTrainingPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:30',
    location: '',
    focusAreas: '',
    intensity: 'MEDIUM',
    type: 'REGULAR_SESSION',
  });

  const intensityLevels = [
    { value: 'LOW', label: 'Low - Recovery/Light Work' },
    { value: 'MEDIUM', label: 'Medium - Standard Training' },
    { value: 'HIGH', label: 'High - Intense Session' },
  ];

  const sessionTypes = [
    { value: 'REGULAR_SESSION', label: 'Regular Session' },
    { value: 'TACTICAL_DRILL', label: 'Tactical Drill' },
    { value: 'PHYSICAL_TRAINING', label: 'Physical Training' },
    { value: 'SKILLS_DEVELOPMENT', label: 'Skills Development' },
    { value: 'SET_PIECES', label: 'Set Pieces' },
    { value: 'FRIENDLY_MATCH', label: 'Friendly Match' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Training title is required');
      return;
    }

    if (!formData.date) {
      toast.error('Date is required');
      return;
    }

    if (new Date(formData.date) < new Date(new Date().toISOString().split('T')[0])) {
      toast.error('Cannot create training in the past');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/training`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create training');
      }

      const data = await response.json();
      toast.success('Training session created successfully!');
      router.push(`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training/${data.id}`);
    } catch (error) {
      console.error('Error creating training:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create training');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">
                Schedule Training
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Create a new training session for your team
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Session Details</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Basic information about the training session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Session Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Pre-Match Preparation"
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Session Type *
                </Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-all"
                >
                  {sessionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what will be covered in this session..."
                  rows={4}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Location */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Schedule & Location</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                When and where the training will take place
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="date" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date *
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Pitch"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="startTime" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start Time *
                  </Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endTime" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    End Time *
                  </Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Details */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Training Focus</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                What will be the focus of this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="intensity" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Session Intensity
                </Label>
                <select
                  id="intensity"
                  name="intensity"
                  value={formData.intensity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-all"
                >
                  {intensityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="focusAreas" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Focus Areas
                </Label>
                <textarea
                  id="focusAreas"
                  name="focusAreas"
                  value={formData.focusAreas}
                  onChange={handleInputChange}
                  placeholder="e.g., Passing drills, Defensive positioning, Set pieces"
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`} className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Schedule Training
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
