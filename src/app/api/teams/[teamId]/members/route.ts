// Path: src/app/api/teams/[teamId]/members/route.ts
// POST /api/teams/[teamId]/members
// Add player or staff member to team

// Features:
// - Add existing players to roster
// - Set position and shirt number
// - Role assignment (player, staff, management)
// - Contract auto-generation

// Request body:
interface AddTeamMemberPayload {
  userId: string; // Existing user
  role: 'PLAYER' | 'COACH' | 'MANAGER' | 'MEDICAL_STAFF' | 'ANALYST';
  position?: string; // For players
  shirtNumber?: number; // For players
  salary?: number;
  currency?: string;
  contractType?: string;
  startDate: string;
  endDate: string;
}