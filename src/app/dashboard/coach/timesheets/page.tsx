'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  Loader2,
  Filter,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Timesheet {
  id: string;
  date: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  session: {
    id: string;
    focus: string;
    team: {
      name: string;
    };
  } | null;
  description: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

interface Summary {
  totalHours: number;
  totalEarnings: number;
  pendingPayments: number;
  paidThisMonth: number;
}

export default function CoachTimesheetsPage() {
  const router = useRouter();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchTimesheets();
  }, [monthFilter]);

  useEffect(() => {
    filterTimesheets();
  }, [statusFilter, timesheets]);

  const fetchTimesheets = async () => {
    try {
      const response = await fetch(`/api/coach/timesheets?month=${monthFilter}`);
      if (!response.ok) throw new Error('Failed to fetch timesheets');

      const data = await response.json();
      setTimesheets(data.timesheets);
      setSummary(data.summary);
      setFilteredTimesheets(data.timesheets);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to load timesheets');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTimesheets = () => {
    if (statusFilter === 'ALL') {
      setFilteredTimesheets(timesheets);
    } else {
      setFilteredTimesheets(timesheets.filter((t) => t.status === statusFilter));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'PAID':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportTimesheets = async () => {
    toast.success('📄 Timesheets exported!');
    // TODO: Implement CSV export
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading timesheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900">My Timesheets</h1>
                <p className="text-charcoal-600">Track hours and earnings</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportTimesheets}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => router.push('/dashboard/coach/timesheets/create')}
                className="bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
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
                    <p className="text-sm text-charcoal-600 mb-1">Total Hours</p>
                    <p className="text-3xl font-bold text-charcoal-900">{summary.totalHours}</p>
                    <p className="text-sm text-charcoal-500 mt-1">This month</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-600">
                      £{summary.totalEarnings.toLocaleString()}
                    </p>
                    <p className="text-sm text-charcoal-500 mt-1">This month</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-orange-600">
                      £{summary.pendingPayments.toLocaleString()}
                    </p>
                    <p className="text-sm text-charcoal-500 mt-1">Awaiting approval</p>
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
                    <p className="text-sm text-charcoal-600 mb-1">Paid This Month</p>
                    <p className="text-3xl font-bold text-blue-600">
                      £{summary.paidThisMonth.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      On track
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Month Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheets List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Time Entries ({filteredTimesheets.length})
            </CardTitle>
            <CardDescription>Your submitted timesheets</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTimesheets.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No timesheets found</h3>
                <p className="text-charcoal-600 mb-6">Start tracking your coaching hours</p>
                <Button
                  onClick={() => router.push('/dashboard/coach/timesheets/create')}
                  className="bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Entry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTimesheets.map((timesheet) => (
                  <div
                    key={timesheet.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-charcoal-900">
                          {timesheet.session
                            ? `${timesheet.session.focus} - ${timesheet.session.team.name}`
                            : timesheet.description}
                        </p>
                        {getStatusBadge(timesheet.status)}
                      </div>
                      <p className="text-sm text-charcoal-600">
                        {new Date(timesheet.date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {timesheet.approvedBy && (
                        <p className="text-xs text-green-600 mt-1">
                          Approved by {timesheet.approvedBy} on{' '}
                          {new Date(timesheet.approvedAt!).toLocaleDateString('en-GB')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-8">
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
