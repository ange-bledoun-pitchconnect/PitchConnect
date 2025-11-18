'use client';

import { useTeamFilter } from '@/lib/dashboard/team-context';
import { TeamFilterDropdown } from '@/components/common/TeamFilterDropdown';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Settings, LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface DashboardHeaderProps {
  teams?: Array<{ id: string; name: string }>;
  onAddTeam?: () => void;
}

export function DashboardHeader({
  teams = [],
  onAddTeam,
}: DashboardHeaderProps) {
  const { selectedTeams, setSelectedTeams } = useTeamFilter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleAddTeam = (): void => {
    if (onAddTeam) {
      onAddTeam();
    } else {
      console.log('Add team clicked');
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: Team Filter */}
      <div className="flex items-center gap-3">
        <TeamFilterDropdown
          teams={teams}
          selectedTeams={selectedTeams}
          onChange={setSelectedTeams}
        />

        <Button
          className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          onClick={handleAddTeam}
          aria-label="Add new team"
        >
          <Plus size={16} />
          Add Team
        </Button>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-charcoal-600 hover:text-gold-500 hover:bg-gold-50 rounded-lg transition-all">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full"></span>
        </button>

        {/* Settings */}
        <a
          href="/dashboard/settings"
          className="p-2 text-charcoal-600 hover:text-gold-500 hover:bg-gold-50 rounded-lg transition-all"
        >
          <Settings size={20} />
        </a>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-2 text-charcoal-600 hover:text-gold-500 hover:bg-gold-50 rounded-lg transition-all"
          >
            <User size={20} />
            <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
              PC
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 z-50">
              <a href="/dashboard/settings/profile" className="block px-4 py-2 text-charcoal-700 hover:bg-gold-50 text-sm">
                Profile Settings
              </a>
              <a href="/dashboard/settings/account" className="block px-4 py-2 text-charcoal-700 hover:bg-gold-50 text-sm">
                Account
              </a>
              <hr className="my-2 border-neutral-200" />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left px-4 py-2 text-charcoal-700 hover:bg-red-50 text-sm flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

DashboardHeader.displayName = 'DashboardHeader';
