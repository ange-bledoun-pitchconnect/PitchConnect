import { createContext, useContext } from 'react';

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
