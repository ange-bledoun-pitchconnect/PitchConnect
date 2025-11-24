/**
 * ============================================================================
 * src/app/dashboard/admin/users/[userId]/page.tsx
 * User Details & Account Management Page
 * - View user details
 * - Upgrade/downgrade roles
 * - Manage SuperAdmin status
 * - Update user information
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Crown,
  Edit,
  Save,
  X,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

type UserRole = 'PLAYER' | 'COACH' | 'CLUB_MANAGER' | 'LEAGUE_ADMIN' | 'PARENT' | 'TREASURER';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING';

interface UserDetails {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  roles: UserRole[];
  status: UserStatus;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  subscription?: {
    tier: string;
    status: string;
    currentPeriodEnd: string;
  };
}

export default function UserDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('ACTIVE');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const allRoles: UserRole[] = ['PLAYER', 'COACH', 'CLUB_MANAGER', 'LEAGUE_ADMIN', 'PARENT', 'TREASURER'];
  const allStatuses: UserStatus[] = ['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING'];

  // Fetch user details
  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUser(data.user);
      
      // Set edit form values
      setFirstName(data.user.firstName || '');
      setLastName(data.user.lastName || '');
      setEmail(data.user.email || '');
      setPhoneNumber(data.user.phoneNumber || '');
      setSelectedRoles(data.user.roles || []);
      setSelectedStatus(data.user.status);
      setIsSuperAdmin(data.user.isSuperAdmin);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  // Save user changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phoneNumber,
          roles: selectedRoles,
          status: selectedStatus,
          isSuperAdmin,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const data = await response.json();
      setUser(data.user);
      setEditMode(false);
      alert('User updated successfully!');
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // Toggle role
  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Get status color
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'SUSPENDED':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'BANNED':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'PENDING':
        return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-charcoal-700 rounded animate-pulse"></div>
          <div className="h-10 w-64 bg-charcoal-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <div className="h-64 bg-charcoal-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => router.push('/dashboard/admin/users')}
          className="text-charcoal-400 hover:text-white"
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <div className="bg-red-950 border border-red-700 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-200 font-semibold mb-1">Failed to Load User</h3>
            <p className="text-red-300 text-sm">{error}</p>
            <Button
              onClick={fetchUserDetails}
              className="mt-3 bg-red-800 hover:bg-red-700 text-white"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/dashboard/admin/users')}
            className="text-charcoal-400 hover:text-white"
            variant="ghost"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold text-white">User Details</h1>
        </div>
        <div className="flex items-center gap-3">
          {!editMode ? (
            <Button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setEditMode(false);
                  // Reset form
                  setFirstName(user.firstName || '');
                  setLastName(user.lastName || '');
                  setEmail(user.email || '');
                  setPhoneNumber(user.phoneNumber || '');
                  setSelectedRoles(user.roles || []);
                  setSelectedStatus(user.status);
                  setIsSuperAdmin(user.isSuperAdmin);
                }}
                variant="outline"
                className="text-charcoal-400 hover:bg-charcoal-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gold-900/20 to-gold-800/20 border-b border-charcoal-700">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-white font-bold text-3xl">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span>{getUserInitials()}</span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-charcoal-400" />
                    <span className="text-charcoal-300">{user.email}</span>
                  </div>
                  {user.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-charcoal-400" />
                      <span className="text-charcoal-300">{user.phoneNumber}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                  {user.isSuperAdmin && (
                    <span className="px-3 py-1 bg-red-900 text-red-200 text-xs font-semibold rounded-full border border-red-700 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      SUPER ADMIN
                    </span>
                  )}
                </div>
              </div>

              {/* Roles */}
              <div className="flex flex-wrap gap-2 mt-4">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-blue-900 text-blue-200 text-xs font-semibold rounded-full border border-blue-700"
                  >
                    {role.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-charcoal-500 text-sm mb-1">Date of Birth</p>
            <p className="text-white font-medium">
              {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-charcoal-500 text-sm mb-1">Nationality</p>
            <p className="text-white font-medium">{user.nationality || 'Not set'}</p>
          </div>
          <div>
            <p className="text-charcoal-500 text-sm mb-1">Member Since</p>
            <p className="text-white font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editMode && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6 space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">Edit User Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-charcoal-900 border-charcoal-600 text-white"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-charcoal-900 border-charcoal-600 text-white"
                placeholder="Last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-charcoal-900 border-charcoal-600 text-white"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">
                Phone Number
              </label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-charcoal-900 border-charcoal-600 text-white"
                placeholder="+44 1234 567890"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-2">
              Account Status
            </label>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedStatus === status
                      ? 'bg-gold-600 text-white border-gold-500'
                      : 'bg-charcoal-900 text-charcoal-300 border-charcoal-600 hover:border-gold-500'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Roles Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-2">
              User Roles (Select Multiple)
            </label>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedRoles.includes(role)
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-charcoal-900 text-charcoal-300 border-charcoal-600 hover:border-blue-500'
                  }`}
                >
                  {role.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* SuperAdmin Toggle */}
          <div className="bg-red-950/20 border border-red-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-semibold">SuperAdmin Access</p>
                  <p className="text-charcoal-400 text-sm">
                    Grant full system access and administrative privileges
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSuperAdmin(!isSuperAdmin)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSuperAdmin ? 'bg-red-600' : 'bg-charcoal-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSuperAdmin ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Info */}
      {user.subscription && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Subscription</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-charcoal-500 text-sm mb-1">Plan</p>
              <p className="text-white font-semibold text-lg">{user.subscription.tier}</p>
            </div>
            <div>
              <p className="text-charcoal-500 text-sm mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                user.subscription.status === 'ACTIVE' 
                  ? 'bg-green-900 text-green-200' 
                  : 'bg-gray-900 text-gray-200'
              }`}>
                {user.subscription.status}
              </span>
            </div>
            <div>
              <p className="text-charcoal-500 text-sm mb-1">Current Period Ends</p>
              <p className="text-white font-medium">
                {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Info */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-charcoal-500 text-sm">Last Login</p>
              <p className="text-white font-medium">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-charcoal-500 text-sm">Last Updated</p>
              <p className="text-white font-medium">
                {new Date(user.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
