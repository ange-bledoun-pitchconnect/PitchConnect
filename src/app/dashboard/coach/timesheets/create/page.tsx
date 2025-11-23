'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Clock,
  Loader2,
  CheckCircle,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TrainingSession {
  id: string;
  date: string;
  duration: number;
  focus: string;
  team: {
    name: string;
  };
}

export default function CreateTimesheetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(25);

  const [formData, setFormData] = useState({
    sessionId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    manualEntry: false,
  });

  useEffect(() => {
    fetchSessions();
    fetchCoachRate();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/training/sessions?status=COMPLETED');
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load training sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchCoachRate = async () => {
    try {
      const response = await fetch('/api/coach/rate');
      if (!response.ok) throw new Error('Failed to fetch rate');

      const data = await response.json();
      setHourlyRate(data.hourlyRate || 25);
    } catch (error) {
      console.error('Error fetching coach rate:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      toast.error('Please enter valid hours');
      return;
    }

    if (!formData.manualEntry && !formData.sessionId) {
      toast.error('Please select a training session');
      return;
    }

    if (formData.manualEntry && !formData.description) {
      toast.error('Please add a description for manual entry');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/coach/timesheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: formData.manualEntry ? null : formData.sessionId,
          date: formData.date,
          hours: parseFloat(formData.hours),
          description: formData.manualEntry ? formData.description : null,
          hourlyRate: hourlyRate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create timesheet');
      }

      const data = await response.json();
      toast.success('⏰ Timesheet entry created successfully!');

      setTimeout(() => {
        router.push('/dashboard/coach/timesheets');
      }, 1000);
    } catch (error) {
      console.error('Create timesheet error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create timesheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const hours = parseFloat(formData.hours) || 0;
    return (hours * hourlyRate).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/coach/timesheets')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Timesheets
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Add Time Entry</h1>
              <p className="text-charcoal-600">Log your coaching hours</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entry Type */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Type</CardTitle>
              <CardDescription>Choose how to log your time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, manualEntry: false })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !formData.manualEntry
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold text-charcoal-900">From Session</p>
                  <p className="text-xs text-charcoal-600 mt-1">Link to training session</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, manualEntry: true, sessionId: '' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.manualEntry
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold text-charcoal-900">Manual Entry</p>
                  <p className="text-xs text-charcoal-600 mt-1">Enter details manually</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Session or Description */}
          <Card>
            <CardHeader>
              <CardTitle>
                {formData.manualEntry ? 'Description' : 'Select Training Session'}
              </CardTitle>
              <CardDescription>
                {formData.manualEntry
                  ? 'Describe the work performed'
                  : 'Choose a completed training session'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formData.manualEntry ? (
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Individual coaching session with U16 player"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-24"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="session">
                    Training Session <span className="text-red-500">*</span>
                  </Label>
                  {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    </div>
                  ) : (
                    <select
                      id="session"
                      value={formData.sessionId}
                      onChange={(e) => {
                        const session = sessions.find((s) => s.id === e.target.value);
                        setFormData({
                          ...formData,
                          sessionId: e.target.value,
                          date: session ? new Date(session.date).toISOString().split('T')[0] : formData.date,
                          hours: session ? (session.duration / 60).toString() : formData.hours,
                        });
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select a session...</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {new Date(session.date).toLocaleDateString('en-GB')} - {session.focus} ({session.team.name}) - {session.duration} mins
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date and Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Time Details</CardTitle>
              <CardDescription>Enter date and hours worked</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Hours */}
                <div className="space-y-2">
                  <Label htmlFor="hours">
                    Hours Worked <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    placeholder="e.g., 2.5"
                    required
                  />
                </div>
              </div>

              {/* Rate Display */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-charcoal-600">Your Hourly Rate</p>
                      <p className="text-2xl font-bold text-blue-600">£{hourlyRate}/hour</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-charcoal-600">Total Amount</p>
                    <p className="text-3xl font-bold text-green-600">£{calculateTotal()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/coach/timesheets')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
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
                  Submit Timesheet
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
