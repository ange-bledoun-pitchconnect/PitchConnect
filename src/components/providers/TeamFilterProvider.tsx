'use client';

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { TeamFilterContext, TeamFilterContextType } from '@/lib/dashboard/team-context';

interface Team {
  id: string;
  name: string;
}

interface TeamFilterProviderProps {
  children: ReactNode;
  initialTeams: Team[];
}

const STORAGE_KEY = 'pitchconnect_selected_teams';

export function TeamFilterProvider({
  children,
  initialTeams,
}: TeamFilterProviderProps) {
  const [selectedTeams, setSelectedTeamsState] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const validTeams = parsed.filter((id: string) =>
          initialTeams.some(t => t.id === id)
        );
        if (validTeams.length > 0) {
          setSelectedTeamsState(validTeams);
        } else {
          setSelectedTeamsState(initialTeams.map(t => t.id));
        }
      } catch (error) {
        console.error('Failed to parse stored teams:', error);
        setSelectedTeamsState(initialTeams.map(t => t.id));
      }
    } else {
      // Default to all teams on first load
      setSelectedTeamsState(initialTeams.map(t => t.id));
    }
    setIsHydrated(true);
  }, [initialTeams]);

  // Persist to localStorage whenever selection changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTeams));
    }
  }, [selectedTeams, isHydrated]);

  const setSelectedTeams = useCallback((teamIds: string[]) => {
    if (teamIds.length === 0) {
      // Don't allow empty selection - revert to all teams
      setSelectedTeamsState(initialTeams.map(t => t.id));
    } else {
      setSelectedTeamsState(teamIds);
    }
  }, [initialTeams]);

  const addTeam = useCallback((teamId: string) => {
    setSelectedTeamsState(prev => {
      if (prev.includes(teamId)) return prev;
      return [...prev, teamId];
    });
  }, []);

  const removeTeam = useCallback((teamId: string) => {
    setSelectedTeamsState(prev => {
      const filtered = prev.filter(id => id !== teamId);
      // Don't allow empty selection
      return filtered.length === 0 ? prev : filtered;
    });
  }, []);

  const resetToAll = useCallback(() => {
    setSelectedTeamsState(initialTeams.map(t => t.id));
  }, [initialTeams]);

  const isSingleTeam = selectedTeams.length === 1;

  const selectedTeamNames = selectedTeams
    .map(id => initialTeams.find(t => t.id === id)?.name)
    .filter(Boolean) as string[];

  const value: TeamFilterContextType = {
    selectedTeams,
    allTeams: initialTeams,
    setSelectedTeams,
    addTeam,
    removeTeam,
    resetToAll,
    isSingleTeam,
    selectedTeamNames,
  };

  return (
    <TeamFilterContext.Provider value={value}>
      {children}
    </TeamFilterContext.Provider>
  );
}
