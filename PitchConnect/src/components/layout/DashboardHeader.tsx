'use client';

import { useTeamFilter } from '@/lib/dashboard/team-context';
import { TeamFilterDropdown } from '@/components/common/TeamFilterDropdown';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Settings, LogOut, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
  };

  const handleSettingsClick = (): void => {
    router.push('/dashboard/settings');
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: Team Filter */}
      <div className="flex items-center gap-3">
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
        <div className="relative">
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
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
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
