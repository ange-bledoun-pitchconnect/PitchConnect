/**
 * ============================================================================
 * ADD MEMBER MODAL - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade team member addition modal with:
 * - Role-based role selection (creator's role determines available roles)
 * - Multi-sport position assignment
 * - Jersey number assignment with conflict checking
 * - User search with autocomplete OR email invite
 * - Bulk member addition
 * 
 * SCHEMA ALIGNMENT:
 * - ClubMemberRole: OWNER, MANAGER, HEAD_COACH, ASSISTANT_COACH, PLAYER, etc.
 * - Position: Sport-specific from SPORT_POSITIONS config
 * - TeamPlayer: teamId, playerId, jerseyNumber, position, isCaptain, isViceCaptain
 * 
 * @version 2.0.0
 * @path src/components/teams/AddMemberModal.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  X,
  Check,
  Loader2,
  UserPlus,
  Mail,
  Shield,
  Search,
  Hash,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle2,
  Crown,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import {
  getSportPositions,
  getPositionsByCategory,
  type Position,
} from '@/config/sport-positions-config';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

/** Aligned with Prisma ClubMemberRole enum */
export type ClubMemberRole =
  | 'OWNER'
  | 'MANAGER'
  | 'HEAD_COACH'
  | 'ASSISTANT_COACH'
  | 'PLAYER'
  | 'STAFF'
  | 'TREASURER'
  | 'SCOUT'
  | 'ANALYST'
  | 'MEDICAL_STAFF'
  | 'PHYSIOTHERAPIST'
  | 'NUTRITIONIST'
  | 'PSYCHOLOGIST'
  | 'PERFORMANCE_COACH'
  | 'GOALKEEPING_COACH'
  | 'KIT_MANAGER'
  | 'MEDIA_OFFICER'
  | 'VIDEO_ANALYST';

/** Aligned with Prisma UserRole enum */
export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'PLAYER'
  | 'PLAYER_PRO'
  | 'COACH'
  | 'COACH_PRO'
  | 'MANAGER'
  | 'CLUB_MANAGER'
  | 'CLUB_OWNER'
  | 'TREASURER'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST'
  | 'PARENT'
  | 'GUARDIAN'
  | 'LEAGUE_ADMIN'
  | 'MEDICAL_STAFF'
  | 'MEDIA_MANAGER'
  | 'FAN';

export interface SearchableUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  currentRoles?: UserRole[];
}

export interface AddMemberModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Club ID */
  clubId: string;
  /** Team ID */
  teamId: string;
  /** Sport for position selection */
  sport: Sport;
  /** Current user's role (determines available role options) */
  creatorRole: UserRole;
  /** Already used jersey numbers (for conflict checking) */
  usedJerseyNumbers?: number[];
  /** Search users handler */
  onSearchUsers?: (query: string) => Promise<SearchableUser[]>;
  /** Success callback */
  onSuccess: () => void;
  /** Additional CSS classes */
  className?: string;
}

export interface MemberFormData {
  userEmail: string;
  userId?: string;
  role: ClubMemberRole;
  position?: string;
  jerseyNumber?: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

// =============================================================================
// ROLE CONFIGURATION
// =============================================================================

interface RoleConfig {
  value: ClubMemberRole;
  label: string;
  description: string;
  icon: string;
  color: string;
  /** Which user roles can assign this club role */
  allowedCreators: UserRole[];
}

const CLUB_MEMBER_ROLES: RoleConfig[] = [
  {
    value: 'OWNER',
    label: 'Owner',
    description: 'Full ownership and control',
    icon: '👑',
    color: 'bg-amber-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN'],
  },
  {
    value: 'MANAGER',
    label: 'Manager',
    description: 'Team and club management',
    icon: '💼',
    color: 'bg-purple-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER'],
  },
  {
    value: 'HEAD_COACH',
    label: 'Head Coach',
    description: 'Lead coaching and tactics',
    icon: '🎯',
    color: 'bg-blue-600',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER'],
  },
  {
    value: 'ASSISTANT_COACH',
    label: 'Assistant Coach',
    description: 'Support coaching staff',
    icon: '📋',
    color: 'bg-blue-400',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
  },
  {
    value: 'PLAYER',
    label: 'Player',
    description: 'Active team player',
    icon: '⚡',
    color: 'bg-green-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
  },
  {
    value: 'GOALKEEPER_COACH',
    label: 'Goalkeeper Coach',
    description: 'Specialist goalkeeper training',
    icon: '🧤',
    color: 'bg-yellow-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
  },
  {
    value: 'PERFORMANCE_COACH',
    label: 'Performance Coach',
    description: 'Physical conditioning and fitness',
    icon: '💪',
    color: 'bg-orange-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
  },
  {
    value: 'ANALYST',
    label: 'Analyst',
    description: 'Performance and match analysis',
    icon: '📊',
    color: 'bg-indigo-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER'],
  },
  {
    value: 'VIDEO_ANALYST',
    label: 'Video Analyst',
    description: 'Video review and breakdown',
    icon: '🎬',
    color: 'bg-indigo-400',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'ANALYST'],
  },
  {
    value: 'SCOUT',
    label: 'Scout',
    description: 'Talent identification',
    icon: '🔍',
    color: 'bg-cyan-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER'],
  },
  {
    value: 'MEDICAL_STAFF',
    label: 'Medical Staff',
    description: 'Injury management and care',
    icon: '🏥',
    color: 'bg-red-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER'],
  },
  {
    value: 'PHYSIOTHERAPIST',
    label: 'Physiotherapist',
    description: 'Physical therapy and rehab',
    icon: '🩺',
    color: 'bg-red-400',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'MEDICAL_STAFF'],
  },
  {
    value: 'NUTRITIONIST',
    label: 'Nutritionist',
    description: 'Diet and nutrition planning',
    icon: '🥗',
    color: 'bg-green-400',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'MEDICAL_STAFF'],
  },
  {
    value: 'PSYCHOLOGIST',
    label: 'Psychologist',
    description: 'Mental performance support',
    icon: '🧠',
    color: 'bg-pink-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'MEDICAL_STAFF'],
  },
  {
    value: 'TREASURER',
    label: 'Treasurer',
    description: 'Financial management',
    icon: '💰',
    color: 'bg-emerald-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER'],
  },
  {
    value: 'MEDIA_OFFICER',
    label: 'Media Officer',
    description: 'Communications and media',
    icon: '📱',
    color: 'bg-violet-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER'],
  },
  {
    value: 'KIT_MANAGER',
    label: 'Kit Manager',
    description: 'Equipment and kit management',
    icon: '👕',
    color: 'bg-gray-500',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER'],
  },
  {
    value: 'STAFF',
    label: 'General Staff',
    description: 'General team support',
    icon: '👥',
    color: 'bg-gray-400',
    allowedCreators: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getAvailableRoles(creatorRole: UserRole): RoleConfig[] {
  return CLUB_MEMBER_ROLES.filter(role => role.allowedCreators.includes(creatorRole));
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectUser: (user: SearchableUser) => void;
  selectedUser?: SearchableUser | null;
  onClearUser: () => void;
  onSearchUsers?: (query: string) => Promise<SearchableUser[]>;
  disabled?: boolean;
}

function UserSearchInput({
  value,
  onChange,
  onSelectUser,
  selectedUser,
  onClearUser,
  onSearchUsers,
  disabled,
}: UserSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<SearchableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(value, 300);
  
  // Search users when query changes
  useEffect(() => {
    if (!onSearchUsers || debouncedQuery.length < 2 || selectedUser) {
      setUsers([]);
      return;
    }
    
    const search = async () => {
      setIsSearching(true);
      try {
        const results = await onSearchUsers(debouncedQuery);
        setUsers(results);
      } catch (error) {
        console.error('User search error:', error);
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    search();
  }, [debouncedQuery, onSearchUsers, selectedUser]);
  
  if (selectedUser) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold">
          {selectedUser.firstName[0]}{selectedUser.lastName[0]}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">
            {selectedUser.firstName} {selectedUser.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedUser.email}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearUser}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search existing user or enter email to invite..."
          className="pl-10"
          disabled={disabled}
        />
      </div>
      
      {/* Search Results Dropdown */}
      {isOpen && users.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {users.map(user => (
              <button
                key={user.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors"
                onClick={() => {
                  onSelectUser(user);
                  setIsOpen(false);
                }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

interface PositionSelectProps {
  sport: Sport;
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

function PositionSelect({ sport, value, onChange, disabled }: PositionSelectProps) {
  const sportConfig = getSportPositions(sport);
  
  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? undefined : val)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select position (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No position (assign later)</SelectItem>
        {sportConfig.categories.map(category => (
          <React.Fragment key={category.category}>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {category.name}
            </div>
            {getPositionsByCategory(sport, category.category).map(pos => (
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
          </React.Fragment>
        ))}
      </SelectContent>
    </Select>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AddMemberModal({
  isOpen,
  onClose,
  clubId,
  teamId,
  sport,
  creatorRole,
  usedJerseyNumbers = [],
  onSearchUsers,
  onSuccess,
  className,
}: AddMemberModalProps) {
  // Form state
  const [formData, setFormData] = useState<MemberFormData>({
    userEmail: '',
    role: 'PLAYER',
    isCaptain: false,
    isViceCaptain: false,
  });
  const [selectedUser, setSelectedUser] = useState<SearchableUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MemberFormData, string>>>({});
  
  // Get available roles based on creator's role
  const availableRoles = useMemo(() => {
    return getAvailableRoles(creatorRole);
  }, [creatorRole]);
  
  // Check if jersey number is taken
  const isJerseyTaken = useMemo(() => {
    if (!formData.jerseyNumber) return false;
    return usedJerseyNumbers.includes(formData.jerseyNumber);
  }, [formData.jerseyNumber, usedJerseyNumbers]);
  
  // Show position/jersey fields only for PLAYER role
  const showPlayerFields = formData.role === 'PLAYER';
  
  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      userEmail: '',
      role: 'PLAYER',
      isCaptain: false,
      isViceCaptain: false,
    });
    setSelectedUser(null);
    setErrors({});
  }, []);
  
  // Handle close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof MemberFormData, string>> = {};
    
    // Email validation (if no selected user)
    if (!selectedUser) {
      if (!formData.userEmail.trim()) {
        newErrors.userEmail = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
        newErrors.userEmail = 'Please enter a valid email address';
      }
    }
    
    // Jersey number validation
    if (showPlayerFields && formData.jerseyNumber && isJerseyTaken) {
      newErrors.jerseyNumber = 'This jersey number is already taken';
    }
    
    // Captain/Vice-Captain conflict
    if (formData.isCaptain && formData.isViceCaptain) {
      newErrors.isCaptain = 'Cannot be both captain and vice-captain';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedUser, showPlayerFields, isJerseyTaken]);
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser?.id,
          userEmail: selectedUser ? undefined : formData.userEmail,
          role: formData.role,
          position: showPlayerFields ? formData.position : undefined,
          jerseyNumber: showPlayerFields ? formData.jerseyNumber : undefined,
          isCaptain: showPlayerFields ? formData.isCaptain : false,
          isViceCaptain: showPlayerFields ? formData.isViceCaptain : false,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }
      
      toast({
        title: 'Member Added',
        description: selectedUser
          ? `${selectedUser.firstName} ${selectedUser.lastName} has been added to the team.`
          : `An invitation has been sent to ${formData.userEmail}.`,
      });
      
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Add member error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add member',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle field change
  const handleFieldChange = useCallback(<K extends keyof MemberFormData>(
    field: K,
    value: MemberFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn('sm:max-w-lg', className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold-100 dark:bg-gold-900/30">
              <UserPlus className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            </div>
            <div>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Search existing users or invite by email
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* User Search / Email */}
          <div className="space-y-2">
            <Label>
              <Mail className="inline h-4 w-4 mr-2" />
              User
            </Label>
            <UserSearchInput
              value={formData.userEmail}
              onChange={(value) => handleFieldChange('userEmail', value)}
              onSelectUser={(user) => {
                setSelectedUser(user);
                handleFieldChange('userEmail', user.email);
              }}
              selectedUser={selectedUser}
              onClearUser={() => {
                setSelectedUser(null);
                handleFieldChange('userEmail', '');
              }}
              onSearchUsers={onSearchUsers}
              disabled={isSubmitting}
            />
            {errors.userEmail && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.userEmail}
              </p>
            )}
            {!selectedUser && formData.userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail) && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                New user - an invitation will be sent to this email
              </p>
            )}
          </div>
          
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>
              <Shield className="inline h-4 w-4 mr-2" />
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleFieldChange('role', value as ClubMemberRole)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <span className="flex items-center gap-2">
                      <span>{role.icon}</span>
                      <span>{role.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableRoles.find(r => r.value === formData.role)?.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {availableRoles.find(r => r.value === formData.role)?.description}
              </p>
            )}
          </div>
          
          {/* Player-specific Fields */}
          {showPlayerFields && (
            <>
              {/* Position */}
              <div className="space-y-2">
                <Label>
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Position (Optional)
                </Label>
                <PositionSelect
                  sport={sport}
                  value={formData.position}
                  onChange={(value) => handleFieldChange('position', value)}
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Jersey Number */}
              <div className="space-y-2">
                <Label>
                  <Hash className="inline h-4 w-4 mr-2" />
                  Jersey Number (Optional)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.jerseyNumber || ''}
                  onChange={(e) => handleFieldChange(
                    'jerseyNumber',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )}
                  placeholder="e.g., 10"
                  className={cn(isJerseyTaken && 'border-red-500')}
                  disabled={isSubmitting}
                />
                {isJerseyTaken && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    This jersey number is already taken
                  </p>
                )}
              </div>
              
              {/* Captain / Vice-Captain */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isCaptain"
                    checked={formData.isCaptain}
                    onCheckedChange={(checked) => {
                      handleFieldChange('isCaptain', !!checked);
                      if (checked) handleFieldChange('isViceCaptain', false);
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isCaptain" className="flex items-center gap-1 cursor-pointer">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Captain
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isViceCaptain"
                    checked={formData.isViceCaptain}
                    onCheckedChange={(checked) => {
                      handleFieldChange('isViceCaptain', !!checked);
                      if (checked) handleFieldChange('isCaptain', false);
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isViceCaptain" className="flex items-center gap-1 cursor-pointer">
                    <Star className="h-4 w-4 text-blue-500" />
                    Vice-Captain
                  </Label>
                </div>
              </div>
            </>
          )}
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isJerseyTaken}
            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AddMemberModal;