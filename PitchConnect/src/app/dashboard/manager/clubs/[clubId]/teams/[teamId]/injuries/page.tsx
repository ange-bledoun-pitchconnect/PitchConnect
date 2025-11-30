'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Stethoscope,
  Calendar,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Injury {
  id: string;
  player: {
    firstName: string;
    lastName: string;
  };
  type: string;
  severity: string;
  dateOccurred: string;
  estimatedReturnDate: string;
  status: 'ACTIVE' | 'RECOVERING' | 'CLEARED';
  notes?: string;
}

const INJURY_TYPES = [
  'Hamstring strain',
  'Muscle tear',
  'Ligament injury',
  'Fracture',
  'Concussion',
  'Sprain',
  'Contusion',
  'Inflammation',
  'Other',
];

const SEVERITY_LEVELS = [
  { value: 'MILD', label: 'Mild (1-2 weeks)', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 'MODERATE', label: 'Moderate (2-6 weeks)', color: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'SEVERE', label: 'Severe (6+ weeks)', color: 'bg-red-100 dark:bg-red-900/30' },
];

export default function InjuryManagementPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    playerId: '',
    type: '',
    severity: 'MILD',
    dateOccurred: new Date().toISOString().split('T')[0],
    estimatedReturnDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [injuriesRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/injuries`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (injuriesRes.ok) {
        const data = await injuriesRes.json();
        setInjuries(data);
      }

      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInjury = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerId) {
      toast.error('Please select a player');
      return;
    }

    if (!formData.type) {
      toast.error('Please select injury type');
      return;
    }

    try {
      setIsAdding(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/injuries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Failed to add injury');

      const newInjury = await response.json();
      setInjuries([newInjury, ...injuries]);
      setFormData({
        playerId: '',
        type: '',
        severity: 'MILD',
        dateOccurred: new Date().toISOString().split('T')[0],
        estimatedReturnDate: '',
        notes: '',
      });
      toast.success('Injury recorded successfully!');
    } catch (error) {
      console.error('Error adding injury:', error);
      toast.error('Failed to add injury');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClearInjury = async (injuryId: string) => {
    if (!confirm('Mark this injury as cleared?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/injuries/${injuryId}/clear`,
        { method: 'PATCH' }
      );

      if (!response.ok) throw new Error('Failed to clear injury');

      setInjuries(injuries.filter((i) => i.id !== injuryId));
      toast.success('Injury cleared');
    } catch (error) {
      console.error('Error clearing injury:', error);
      toast.error('Failed to clear injury');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-red-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading injury records...</p>
        </div>
      </div>
    );
  }

  const activeInjuries = injuries.filter((i) => i.status === 'ACTIVE');
  const recoveringInjuries = injuries.filter((i) => i.status === 'RECOVERING');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-red-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                Injury Management
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Track player injuries and recovery
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Injury Form */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Report Injury</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Record a new injury
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddInjury} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Player
                  </label>
                  <select
                    value={formData.playerId}
                    onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-700 transition-all"
                  >
                    <option value="">Select player...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user.firstName} {p.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Injury Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-700 transition-all"
                  >
                    <option value="">Select type...</option>
                    {INJURY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-700 transition-all"
                  >
                    {SEVERITY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Return Date
                  </label>
                  <Input
                    type="date"
                    value={formData.estimatedReturnDate}
                    onChange={(e) => setFormData({ ...formData, estimatedReturnDate: e.target.value })}
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-700 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isAdding}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-400 hover:from-red-600 hover:to-orange-500 text-white font-bold"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Record Injury
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Injuries List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Injuries */}
            {activeInjuries.length > 0 && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Active Injuries ({activeInjuries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeInjuries.map((injury) => (
                    <div
                      key={injury.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-charcoal-900 dark:text-white">
                            {injury.player.firstName} {injury.player.lastName}
                          </p>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                            {injury.type} - {injury.severity}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                            Since {new Date(injury.dateOccurred).toLocaleDateString()}
                          </p>
                          {injury.estimatedReturnDate && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Est. return: {new Date(injury.estimatedReturnDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleClearInjury(injury.id)}
                          className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                      {injury.notes && (
                        <p className="text-xs text-charcoal-700 dark:text-charcoal-300 mt-2 italic">
                          {injury.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recovering Injuries */}
            {recoveringInjuries.length > 0 && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 border-l-4 border-l-yellow-500">
                <CardHeader>
                  <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                    Recovering ({recoveringInjuries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recoveringInjuries.map((injury) => (
                    <div
                      key={injury.id}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-charcoal-900 dark:text-white">
                            {injury.player.firstName} {injury.player.lastName}
                          </p>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                            {injury.type}
                          </p>
                          {injury.estimatedReturnDate && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              Target return: {new Date(injury.estimatedReturnDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleClearInjury(injury.id)}
                          className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {injuries.length === 0 && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <Stethoscope className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    No injury records. Hopefully everyone stays healthy! ⚽
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
