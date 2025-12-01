'use client';

import { useTeamFilter } from '@/lib/dashboard/team-context';
import { TeamFilterDropdown } from '@/components/common/TeamFilterDropdown';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardHeaderProps {
  teams?: Array<{ id: string; name: string }>;
  onAddTeam?: () => void;
}

export function DashboardHeader({
  teams = [],
  onAddTeam,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const { selectedTeams, setSelectedTeams } = useTeamFilter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Refs for click outside detection
  const roleSwitcherRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect current dashboard context from URL
  const getCurrentRole = () => {
    if (pathname.startsWith('/dashboard/superadmin')) return 'superadmin';
    if (pathname.startsWith('/dashboard/league-admin')) return 'league-admin';
    if (pathname.startsWith('/dashboard/player')) return 'player';
    if (pathname.startsWith('/dashboard/coach')) return 'coach';
    if (pathname.startsWith('/dashboard/manager')) return 'manager';
    if (pathname.startsWith('/dashboard/overview')) return 'overview';
    return null;
  };

  const currentRole = getCurrentRole();
  const user = session?.user;
  const roles = (user?.roles as string[]) || [];

  // Get role display name with emoji
  const getRoleDisplay = (role: string) => {
    const displays: Record<string, string> = {
      overview: '📊 Overview',
      superadmin: '🛠️ Super Admin',
      'league-admin': '⚽ League Admin',
      player: '👤 Player',
      coach: '📋 Coach',
      manager: '👔 Manager',
    };
    return displays[role] || 'Dashboard';
  };

  // Handle role switching
  const handleRoleSwitch = (role: string) => {
    setShowRoleSwitcher(false);
    router.push(`/dashboard/${role}`);
  };

  // Check if user has multiple roles (including SuperAdmin)
  const hasMultipleRoles = () => {
    let availableRoles = 0;
    
    // Always count overview
    availableRoles++;
    
    if (user?.isSuperAdmin) availableRoles++;
    if (roles.includes('LEAGUE_ADMIN')) availableRoles++;
    if (roles.includes('PLAYER')) availableRoles++;
    if (roles.includes('COACH')) availableRoles++;
    if (roles.includes('MANAGER') || roles.includes('CLUB_MANAGER')) availableRoles++;
    
    return availableRoles > 1;
  };

  // Determine button text and action based on user role
  const getCreateButtonConfig = () => {
    const userType = session?.user?.userType || 'PLAYER';

    // SuperAdmin, League Admin, and Managers can create clubs
    if (['SUPERADMIN', 'LEAGUE_ADMIN', 'CLUB_MANAGER'].includes(userType)) {
      return {
        text: 'Create Club',
        action: () => router.push('/dashboard/clubs/create'),
      };
    }

    // Other users see "Add Team" (for joining teams)
    return {
      text: 'Add Team',
      action: onAddTeam || (() => router.push('/dashboard/teams/join')),
    };
  };

  const buttonConfig = getCreateButtonConfig();

  const handleNotificationClick = (): void => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
    setShowRoleSwitcher(false);
  };

  const handleSettingsClick = (): void => {
    router.push('/dashboard/settings');
    setShowProfileMenu(false);
  };

  const handleProfileMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
    setShowRoleSwitcher(false);
  };

  const handleRoleSwitcherToggle = () => {
    setShowRoleSwitcher(!showRoleSwitcher);
    setShowNotifications(false);
    setShowProfileMenu(false);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: Role Switcher + Team Filter */}
      <div className="flex items-center gap-3">
        {/* Role Switcher - only show if user has multiple roles and on a role dashboard */}
        {hasMultipleRoles() && currentRole && (
          <div className="relative" ref={roleSwitcherRef}>
            <button
              onClick={handleRoleSwitcherToggle}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors"
            >
              <span className="font-semibold text-sm text-charcoal-900 dark:text-white">
                {getRoleDisplay(currentRole)}
              </span>
              <ChevronDown className={`w-4 h-4 text-charcoal-600 dark:text-charcoal-400 transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} />
            </button>

            {showRoleSwitcher && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-charcoal-800 rounded-xl shadow-xl border border-neutral-200 dark:border-charcoal-700 z-50">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wide">
                    Switch Role
                  </div>
                  
                  <button
                    onClick={() => handleRoleSwitch('overview')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentRole === 'overview'
                        ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400 font-semibold'
                        : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                    }`}
                  >
                    📊 Dashboard Overview
                  </button>

                  {user?.isSuperAdmin && (
                    <button
                      onClick={() => handleRoleSwitch('superadmin')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentRole === 'superadmin'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold'
                          : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                      }`}
                    >
                      🛠️ Super Admin
                    </button>
                  )}

                  {roles.includes('LEAGUE_ADMIN') && (
                    <button
                      onClick={() => handleRoleSwitch('league-admin')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentRole === 'league-admin'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold'
                          : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                      }`}
                    >
                      ⚽ League Admin
                    </button>
                  )}

                  {roles.includes('PLAYER') && (
                    <button
                      onClick={() => handleRoleSwitch('player')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentRole === 'player'
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-semibold'
                          : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                      }`}
                    >
                      👤 Player
                    </button>
                  )}

                  {roles.includes('COACH') && (
                    <button
                      onClick={() => handleRoleSwitch('coach')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentRole === 'coach'
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold'
                          : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                      }`}
                    >
                      📋 Coach
                    </button>
                  )}

                  {(roles.includes('MANAGER') || roles.includes('CLUB_MANAGER')) && (
                    <button
                      onClick={() => handleRoleSwitch('manager')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentRole === 'manager'
                          ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 font-semibold'
                          : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                      }`}
                    >
                      👔 Team Manager
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Filter */}
        <TeamFilterDropdown
          teams={teams}
          selectedTeams={selectedTeams}
          onTeamsChange={setSelectedTeams}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Dynamic Create Club / Add Team Button */}
        <Button
          onClick={buttonConfig.action}
          size="sm"
          className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          {buttonConfig.text}
        </Button>

        {/* Notifications Button */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotificationClick}
            className="relative hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <Bell className="w-5 h-5 text-charcoal-700 dark:text-charcoal-300" />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-charcoal-800 rounded-xl shadow-xl border border-neutral-200 dark:border-charcoal-700 z-50 max-h-96 overflow-y-auto transition-colors duration-200">
              <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700">
                <h3 className="font-bold text-charcoal-900 dark:text-white">Notifications</h3>
              </div>
              <div className="p-2">
                {/* Sample Notification */}
                <div className="p-3 hover:bg-neutral-50 dark:hover:bg-charcoal-700 rounded-lg cursor-pointer transition-colors">
                  <p className="text-sm font-semibold text-charcoal-900 dark:text-white">
                    Welcome to PitchConnect!
                  </p>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                    Get started by creating your first club.
                  </p>
                  <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-2">Just now</p>
                </div>

                {/* Empty State */}
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-neutral-300 dark:text-charcoal-600 mx-auto mb-2" />
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">No new notifications</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSettingsClick}
          className="hover:bg-neutral-100 dark:hover:bg-charcoal-700"
        >
          <Settings className="w-5 h-5 text-charcoal-700 dark:text-charcoal-300" />
        </Button>

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProfileMenuToggle}
            className="hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <User className="w-5 h-5 text-charcoal-700 dark:text-charcoal-300" />
          </Button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-charcoal-800 rounded-xl shadow-xl border border-neutral-200 dark:border-charcoal-700 z-50 transition-colors duration-200">
              <div className="p-2">
                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left px-4 py-2 text-sm text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
