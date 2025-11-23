'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TimesheetApproval {
  id: string;
  date: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  status: string;
  coach: {
    name: string;
    email: string;
  };
  session: {
    focus: string;
    team: {
      name: string;
    };
  } | null;
  description: string | null;
  createdAt: string;
}

interface Summary {
  totalPending: number;
  totalPendingAmount: number;
  approvedThisMonth: number;
  totalCoaches: number;
}

export default function ManagerTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<TimesheetApproval[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const response = await fetch('/api/manager/timesheets/pending');
      if (!response.ok) throw new Error('Failed to fetch timesheets');

      const data = await response.json();
      setTimesheets(data.timesheets);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to load timesheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (timesheetId: string) => {
    setProcessingId(timesheetId);

    try {
      const response = await fetch(`/api/manager/timesheets/${timesheetId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve timesheet');

      toast.success('✅ Timesheet approved!');
      fetchTimesheets(); // Refresh list
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast.error('Failed to approve timesheet');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (timesheetId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessingId(timesheetId);

    try {
      const response = await fetch(`/api/manager/timesheets/${timesheetId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to reject timesheet');

      toast.success('❌ Timesheet rejected');
      fetchTimesheets(); // Refresh list
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      toast.error('Failed to reject timesheet');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-purple-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading timesheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-purple-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Timesheet Approvals</h1>
              <p className="text-charcoal-600">Review and approve coach timesheets</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 mb-1">Pending Approvals</p>
                    <p className="text-3xl font-bold text-orange-600">{summary.totalPending}</p>
                    <p className="text-sm text-charcoal-500 mt-1">Awaiting review</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 mb-1">Pending Amount</p>
                    <p className="text-3xl font-bold text-blue-600">
                      £{summary.totalPendingAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-charcoal-500 mt-1">To be approved</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 mb-1">Approved This Month</p>
                    <p className="text-3xl font-bold text-green-600">{summary.approvedThisMonth}</p>
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Processing
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 mb-1">Active Coaches</p>
                    <p className="text-3xl font-bold text-purple-600">{summary.totalCoaches}</p>
                    <p className="text-sm text-charcoal-500 mt-1">With timesheets</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Timesheets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Pending Approvals ({timesheets.length})
            </CardTitle>
            <CardDescription>Review coach time entries</CardDescription>
          </CardHeader>
          <CardContent>
            {timesheets.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">All caught up!</h3>
                <p className="text-charcoal-600">No pending timesheets to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timesheets.map((timesheet) => (
                  <div
                    key={timesheet.id}
                    className="p-6 bg-neutral-50 rounded-lg border border-neutral-200 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Timesheet Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-charcoal-900">{timesheet.coach.name}</p>
                            <p className="text-sm text-charcoal-600">{timesheet.coach.email}</p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-charcoal-700">
                            <Calendar className="w-4 h-4" />
                            <span className="font-semibold">
                              {new Date(timesheet.date).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          {timesheet.session ? (
                            <div className="text-sm text-charcoal-600">
                              <span className="font-semibold">Session:</span> {timesheet.session.focus} -{' '}
                              {timesheet.session.team.name}
                            </div>
                          ) : (
                            <div className="text-sm text-charcoal-600">
                              <span className="font-semibold">Description:</span> {timesheet.description}
                            </div>
                          )}

                          <div className="text-xs text-charcoal-500">
                            Submitted {new Date(timesheet.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                      </div>

                      {/* Hours and Amount */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{timesheet.hours}h</p>
                          <p className="text-xs text-charcoal-600">Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-charcoal-600">£{timesheet.hourlyRate}/hr</p>
                          <p className="text-xs text-charcoal-500">Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            £{timesheet.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-charcoal-600">Total</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handleApprove(timesheet.id)}
                          disabled={processingId === timesheet.id}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          {processingId === timesheet.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(timesheet.id)}
                          disabled={processingId === timesheet.id}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
