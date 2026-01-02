/**
 * ============================================================================
 * JOIN REQUEST MANAGER - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade team join request management component.
 * Multi-sport position validation and assignment.
 * 
 * FEATURES:
 * - Request status management (PENDING, APPROVED, REJECTED, WITHDRAWN, EXPIRED)
 * - Sport-specific position selection
 * - Jersey number assignment
 * - Bulk actions (approve/reject multiple)
 * - Search and filter
 * - Stats dashboard
 * - Dark mode support
 * - Accessibility
 * 
 * @version 2.0.0
 * @path src/components/team/JoinRequestManager.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Check,
  X,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Users,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  Mail,
  Calendar,
  Hash,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SPORT_POSITIONS,
  getSportPositions,
  getPositionByCode,
  type Position,
} from '@/config/sport-positions-config';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';

export interface JoinRequest {
  id: string;
  userId: string;
  teamId: string;
  status: JoinRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  message?: string;
  reviewNotes?: string;
  welcomeMessage?: string;
  assignedJerseyNumber?: number;
  assignedPosition?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    phone?: string;
    dateOfBirth?: Date;
  };
  preferredPositions?: string[];
  preferredJerseyNumber?: number;
  experience?: string;
}

export interface JoinRequestManagerProps {
  /** Join requests to manage */
  requests: JoinRequest[];
  /** Sport context for position selection */
  sport: Sport;
  /** Team name for display */
  teamName: string;
  /** Already used jersey numbers */
  usedJerseyNumbers?: number[];
  /** Loading state */
  isLoading?: boolean;
  /** Handler for approving request */
  onApprove: (
    requestId: string,
    data: { jerseyNumber?: number; position?: string; welcomeMessage?: string }
  ) => Promise<void>;
  /** Handler for rejecting request */
  onReject: (requestId: string, reason?: string) => Promise<void>;
  /** Handler for bulk actions */
  onBulkAction?: (action: 'approve' | 'reject', requestIds: string[]) => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<JoinRequestStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-500', icon: UserMinus },
  EXPIRED: { label: 'Expired', color: 'bg-gray-400', icon: AlertCircle },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface RequestCardProps {
  request: JoinRequest;
  sport: Sport;
  usedJerseyNumbers: number[];
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
}

function RequestCard({
  request,
  sport,
  usedJerseyNumbers,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onViewDetails,
}: RequestCardProps) {
  const statusConfig = STATUS_CONFIG[request.status];
  const StatusIcon = statusConfig.icon;
  const isPending = request.status === 'PENDING';
  
  // Get position display
  const preferredPositionDisplay = useMemo(() => {
    if (!request.preferredPositions?.length) return null;
    return request.preferredPositions.map(code => {
      const pos = getPositionByCode(sport, code);
      return pos?.name || code;
    }).join(', ');
  }, [request.preferredPositions, sport]);
  
  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all',
        isPending
          ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-charcoal-900',
        isSelected && 'ring-2 ring-gold-500'
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {isPending && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}
          
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {request.user.avatar ? (
              <img
                src={request.user.avatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold">
                {request.user.firstName[0]}{request.user.lastName[0]}
              </div>
            )}
            <div
              className={cn(
                'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white',
                statusConfig.color
              )}
            >
              <StatusIcon className="h-3 w-3" />
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {request.user.firstName} {request.user.lastName}
              </h4>
              <Badge
                className={cn('text-[10px] text-white', statusConfig.color)}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {request.user.email}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(request.requestedAt, { addSuffix: true })}
              </span>
              {request.preferredJerseyNumber && (
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Wants #{request.preferredJerseyNumber}
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Users className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {isPending && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onApprove}
                    className="text-green-600 dark:text-green-400"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onReject}
                    className="text-red-600 dark:text-red-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Details */}
        {(preferredPositionDisplay || request.message) && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {preferredPositionDisplay && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  Preferred: {preferredPositionDisplay}
                </span>
              </div>
            )}
            {request.message && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                "{request.message}"
              </p>
            )}
          </div>
        )}
        
        {/* Quick Actions for Pending */}
        {isPending && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={onApprove}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
              onClick={onReject}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ApprovalDialogProps {
  request: JoinRequest | null;
  sport: Sport;
  usedJerseyNumbers: number[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { jerseyNumber?: number; position?: string; welcomeMessage?: string }) => void;
  isSubmitting?: boolean;
}

function ApprovalDialog({
  request,
  sport,
  usedJerseyNumbers,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: ApprovalDialogProps) {
  const [jerseyNumber, setJerseyNumber] = useState<string>(
    request?.preferredJerseyNumber?.toString() || ''
  );
  const [position, setPosition] = useState<string>(
    request?.preferredPositions?.[0] || ''
  );
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  const sportConfig = getSportPositions(sport);
  
  const isJerseyTaken = useMemo(() => {
    const num = parseInt(jerseyNumber);
    return !isNaN(num) && usedJerseyNumbers.includes(num);
  }, [jerseyNumber, usedJerseyNumbers]);
  
  const handleConfirm = () => {
    const num = parseInt(jerseyNumber);
    onConfirm({
      jerseyNumber: isNaN(num) ? undefined : num,
      position: position || undefined,
      welcomeMessage: welcomeMessage || undefined,
    });
  };
  
  if (!request) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Join Request</DialogTitle>
          <DialogDescription>
            Approve {request.user.firstName} {request.user.lastName} to join the team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Position Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Assign Position
            </label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select position..." />
              </SelectTrigger>
              <SelectContent>
                {sportConfig.positions.map(pos => (
                  <SelectItem key={pos.code} value={pos.code}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: pos.color }}
                      />
                      {pos.name} ({pos.abbreviation})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Jersey Number */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Jersey Number
            </label>
            <Input
              type="number"
              min={1}
              max={99}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="e.g., 10"
              className={cn(isJerseyTaken && 'border-red-500')}
            />
            {isJerseyTaken && (
              <p className="text-xs text-red-500 mt-1">
                This jersey number is already taken
              </p>
            )}
          </div>
          
          {/* Welcome Message */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Welcome Message (optional)
            </label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome to the team!"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || isJerseyTaken}
            className="bg-green-500 hover:bg-green-600"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function JoinRequestManager({
  requests,
  sport,
  teamName,
  usedJerseyNumbers = [],
  isLoading = false,
  onApprove,
  onReject,
  onBulkAction,
  className,
}: JoinRequestManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JoinRequestStatus | 'ALL'>('PENDING');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvalRequest, setApprovalRequest] = useState<JoinRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        `${r.user.firstName} ${r.user.lastName}`.toLowerCase().includes(query) ||
        r.user.email.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [requests, statusFilter, searchQuery]);
  
  // Stats
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  }), [requests]);
  
  // Selection handlers
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const pendingIds = filteredRequests
        .filter(r => r.status === 'PENDING')
        .map(r => r.id);
      setSelectedIds(new Set(pendingIds));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredRequests]);
  
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);
  
  // Action handlers
  const handleApprove = async (
    requestId: string,
    data: { jerseyNumber?: number; position?: string; welcomeMessage?: string }
  ) => {
    setIsSubmitting(true);
    try {
      await onApprove(requestId, data);
      setApprovalRequest(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReject = async (requestId: string) => {
    setIsSubmitting(true);
    try {
      await onReject(requestId);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (!onBulkAction || selectedIds.size === 0) return;
    
    setIsSubmitting(true);
    try {
      await onBulkAction(action, Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const pendingSelected = filteredRequests.filter(r => r.status === 'PENDING' && selectedIds.has(r.id)).length;
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Join Requests
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage requests to join {teamName}
          </p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-charcoal-800 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <p className="text-sm text-green-600 dark:text-green-400">Approved</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <p className="text-sm text-red-600 dark:text-red-400">Rejected</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as JoinRequestStatus | 'ALL')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
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
      
      {/* Bulk Actions */}
      {selectedIds.size > 0 && onBulkAction && (
        <div className="flex items-center gap-3 p-3 bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-700 rounded-lg">
          <Checkbox
            checked={pendingSelected === filteredRequests.filter(r => r.status === 'PENDING').length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-gold-700 dark:text-gold-300">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600"
            onClick={() => handleBulkAction('approve')}
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleBulkAction('reject')}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-1" />
            Reject All
          </Button>
        </div>
      )}
      
      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserPlus className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No requests match your filters'
              : 'No join requests yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              sport={sport}
              usedJerseyNumbers={usedJerseyNumbers}
              isSelected={selectedIds.has(request.id)}
              onSelect={(selected) => handleSelect(request.id, selected)}
              onApprove={() => setApprovalRequest(request)}
              onReject={() => handleReject(request.id)}
              onViewDetails={() => {}}
            />
          ))}
        </div>
      )}
      
      {/* Approval Dialog */}
      <ApprovalDialog
        request={approvalRequest}
        sport={sport}
        usedJerseyNumbers={usedJerseyNumbers}
        isOpen={!!approvalRequest}
        onClose={() => setApprovalRequest(null)}
        onConfirm={(data) => approvalRequest && handleApprove(approvalRequest.id, data)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default JoinRequestManager;