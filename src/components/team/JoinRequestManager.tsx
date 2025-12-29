// ============================================================================
// 🤝 JOIN REQUEST MANAGER - PitchConnect v7.3.0
// ============================================================================
// Component for managing team join requests
// Supports viewing, approving, and rejecting requests
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

import {
  reviewJoinRequest,
  getJoinRequests,
  getJoinRequestStats,
} from '@/actions/join-request.actions';
import type {
  JoinRequestListItem,
  JoinRequestStats,
  JoinRequestStatus,
} from '@/types/join-request.types';

// ============================================================================
// TYPES
// ============================================================================

interface JoinRequestManagerProps {
  teamId: string;
  teamName: string;
  initialRequests?: JoinRequestListItem[];
  initialStats?: JoinRequestStats;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<
  JoinRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: <XCircle className="h-3 w-3" />,
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    icon: <Clock className="h-3 w-3" />,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function JoinRequestManager({
  teamId,
  teamName,
  initialRequests = [],
  initialStats,
}: JoinRequestManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState<JoinRequestListItem[]>(initialRequests);
  const [stats, setStats] = useState<JoinRequestStats | undefined>(initialStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<JoinRequestListItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<string>('');

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === '' ||
      `${request.player.user.firstName} ${request.player.user.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.player.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Load requests
  const loadRequests = async (status?: string) => {
    startTransition(async () => {
      const result = await getJoinRequests({
        teamId,
        status: status === 'ALL' ? undefined : (status as JoinRequestStatus),
      });

      if (result.success && result.data) {
        setRequests(result.data.data);
      }

      // Also refresh stats
      const statsResult = await getJoinRequestStats(teamId);
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    });
  };

  // Handle review
  const handleReview = async () => {
    if (!selectedRequest) return;

    startTransition(async () => {
      const result = await reviewJoinRequest({
        requestId: selectedRequest.id,
        status: reviewAction,
        reviewNotes: reviewNotes || undefined,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
      });

      if (result.success) {
        toast({
          title: reviewAction === 'APPROVED' ? 'Request approved' : 'Request rejected',
          description:
            reviewAction === 'APPROVED'
              ? `${selectedRequest.player.user.firstName} has been added to the team`
              : `Request from ${selectedRequest.player.user.firstName} has been rejected`,
        });

        setReviewDialogOpen(false);
        setSelectedRequest(null);
        setReviewNotes('');
        setJerseyNumber('');
        loadRequests(statusFilter);
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to process request',
          variant: 'destructive',
        });
      }
    });
  };

  // Open review dialog
  const openReviewDialog = (request: JoinRequestListItem, action: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.approvalRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Approval Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            loadRequests(value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Requests</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Request List */}
      <div className="space-y-4">
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No join requests</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'PENDING'
                  ? 'No pending requests to review'
                  : 'No requests match your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Player Info */}
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.player.user.avatar || undefined} />
                        <AvatarFallback>
                          {request.player.user.firstName[0]}
                          {request.player.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {request.player.user.firstName} {request.player.user.lastName}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={STATUS_CONFIG[request.status].color}
                          >
                            {STATUS_CONFIG[request.status].icon}
                            <span className="ml-1">{STATUS_CONFIG[request.status].label}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.player.user.email}
                          </span>
                          {request.position && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {request.position}
                            </span>
                          )}
                          {request.player.dateOfBirth && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(request.player.dateOfBirth), 'MMM yyyy')}
                            </span>
                          )}
                        </div>
                        {request.message && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{request.message}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Requested {formatDistanceToNow(new Date(request.createdAt))} ago
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'PENDING' && (
                    <div className="flex md:flex-col gap-2 p-4 md:p-6 border-t md:border-t-0 md:border-l bg-muted/30">
                      <Button
                        size="sm"
                        className="flex-1 md:flex-none"
                        onClick={() => openReviewDialog(request, 'APPROVED')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 md:flex-none"
                        onClick={() => openReviewDialog(request, 'REJECTED')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'APPROVED'
                ? `Add ${selectedRequest?.player.user.firstName} ${selectedRequest?.player.user.lastName} to ${teamName}`
                : `Reject the request from ${selectedRequest?.player.user.firstName} ${selectedRequest?.player.user.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Jersey Number (for approval) */}
            {reviewAction === 'APPROVED' && (
              <div className="space-y-2">
                <Label htmlFor="jerseyNumber">Jersey Number (Optional)</Label>
                <Input
                  id="jerseyNumber"
                  type="number"
                  min="1"
                  max="99"
                  placeholder="e.g., 10"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                />
              </div>
            )}

            {/* Review Notes */}
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">
                {reviewAction === 'APPROVED' ? 'Welcome Message (Optional)' : 'Reason (Optional)'}
              </Label>
              <Textarea
                id="reviewNotes"
                placeholder={
                  reviewAction === 'APPROVED'
                    ? 'Add a welcome message for the player...'
                    : 'Provide a reason for rejection...'
                }
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'APPROVED' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : reviewAction === 'APPROVED' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Add to Team
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JoinRequestManager;