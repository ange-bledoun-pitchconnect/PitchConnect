'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface TeamSelection {
  selectedTeamIds: string[];
  allTeams: { id: string; name: string }[];
}

export interface TeamFilterContextType {
  selectedTeams: string[];
  allTeams: { id: string; name: string }[];
  setSelectedTeams: (teamIds: string[]) => void;
  addTeam: (teamId: string) => void;
  removeTeam: (teamId: string) => void;
  resetToAll: () => void;
  isSingleTeam: boolean;
  selectedTeamNames: string[];
}

export const TeamFilterContext = createContext<TeamFilterContextType | undefined>(undefined);

export function useTeamFilter(): TeamFilterContextType {
  const context = useContext(TeamFilterContext);
  if (!context) {
    throw new Error('useTeamFilter must be used within TeamFilterProvider');
  }
  return context;
}

interface TeamFilterProviderProps {
  children: ReactNode;
  initialTeams?: { id: string; name: string }[];
}

export function TeamFilterProvider({
  children,
  initialTeams = [],
}: TeamFilterProviderProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    initialTeams.map((t) => t.id)
  );
  const [allTeams] = useState<{ id: string; name: string }[]>(initialTeams);

  const addTeam = (teamId: string): void => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev : [...prev, teamId]
    );
  };

  const removeTeam = (teamId: string): void => {
    setSelectedTeams((prev) => prev.filter((id) => id !== teamId));
  };

  const resetToAll = (): void => {
    setSelectedTeams(allTeams.map((t) => t.id));
  };

  const isSingleTeam = selectedTeams.length === 1;

  const selectedTeamNames = useMemo(() => {
    return allTeams
      .filter((team) => selectedTeams.includes(team.id))
      .map((team) => team.name);
  }, [allTeams, selectedTeams]);

  const value: TeamFilterContextType = {
    selectedTeams,
    allTeams,
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
