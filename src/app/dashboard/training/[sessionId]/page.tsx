'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Zap,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface TrainingSession {
  id: string;
  date: string;
  duration: number;
  location: string | null;
  focus: string;
  notes: string | null;
  status: string;
  team: {
    id: string;
    name: string;
    club: {
      name: string;
    };
  };
  drills: Array<{
    id: string;
    name: string;
    duration: number;
    category: string;
    order: number;
  }>;
  attendance: {
    present: number;
    absent: number;
    pending: number;
  };
}

export default function TrainingSessionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session');

      const data = await response.json();
      setSession(data.session);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load training session');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10">
        <div className="text-center">
          <Zap className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 mb-2">Session not found</p>
          <Button onClick={() => router.push('/dashboard/training')}>Back to Training</Button>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(session.date);
  const totalDrillDuration = session.drills.reduce((total, drill) => total + drill.duration, 0);
  const totalPlayers = session.attendance.present + session.attendance.absent + session.attendance.pending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/training')}
            className="mb-4 hover:bg-green-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Training
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900">
                  {session.focus}
                </h1>
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  {session.status}
                </Badge>
              </div>
              <p className="text-charcoal-600">
                {session.team.name} • {session.team.club.name}
              </p>
            </div>

            <Link href={`/dashboard/training/${sessionId}/attendance`}>
              <Button className="bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Manage Attendance
              </Button>
            </Link>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Date & Time</p>
                  <p className="text-lg font-bold text-charcoal-900">
                    {sessionDate.toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-charcoal-600">
                    {sessionDate.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Duration</p>
                  <p className="text-lg font-bold text-charcoal-900">{session.duration} min</p>
                  <p className="text-sm text-charcoal-600">Drills: {totalDrillDuration} min</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Location</p>
                  <p className="text-lg font-bold text-charcoal-900">
                    {session.location || 'TBD'}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Attendance</p>
                  <p className="text-lg font-bold text-charcoal-900">{totalPlayers} players</p>
                  <p className="text-sm text-green-600">{session.attendance.present} present</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drills */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              Training Drills ({session.drills.length})
            </CardTitle>
            <CardDescription>Exercises for this session</CardDescription>
          </CardHeader>
          <CardContent>
            {session.drills.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-charcoal-600">No drills planned for this session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {session.drills.map((drill, index) => (
                  <div
                    key={drill.id}
                    className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal-900">{drill.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{drill.duration} min</Badge>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                          {drill.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Player Attendance
            </CardTitle>
            <CardDescription>Attendance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {session.attendance.present}
                </p>
                <p className="text-sm text-charcoal-600 mt-1">Present</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {session.attendance.pending}
                </p>
                <p className="text-sm text-charcoal-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {session.attendance.absent}
                </p>
                <p className="text-sm text-charcoal-600 mt-1">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {session.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-charcoal-700 whitespace-pre-wrap">{session.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
