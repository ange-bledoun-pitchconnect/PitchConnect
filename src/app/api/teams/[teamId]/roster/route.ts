// Path: src/app/api/teams/[teamId]/roster/route.ts
// GET /api/teams/[teamId]/roster
// Returns current squad listing with positions and status

// Features:
// - All squad players with positions
// - Player status (active, injured, suspended)
// - Squad number assignment
// - Contract expiry dates
// - Squad filtering by position

// Query parameters:
// - position: Filter by position (GK, DEF, MID, FWD)
// - status: ACTIVE, INJURED, SUSPENDED
// - page: Pagination
// - limit: Results per page

// Response:
interface TeamRosterResponse {
  id: string;
  playerId: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
  };
  position: string;
  shirtNumber: number;
  joinDate: string;
  contractEndDate?: string;
  status: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'ON_LOAN' | 'INACTIVE';
  marketValue?: number;
  wages?: number;
}