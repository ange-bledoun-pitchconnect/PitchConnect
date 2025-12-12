// Path: src/app/api/players/[playerId]/injuries/route.ts
// GET /api/players/[playerId]/injuries
// Returns injury history and current status

// Features:
// - Current injuries with severity
// - Estimated return dates
// - Recovery history
// - Injury trends analysis
// - Medical notes (for authorized users)

// Response:
interface PlayerInjuryResponse {
  id: string;
  playerId: string;
  type: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  dateFrom: string;
  dateTo?: string;
  estimatedReturn?: string;
  status: 'ACTIVE' | 'RECOVERING' | 'CLEARED';
  description?: string;
  medicalNotes?: string; // Restricted access
  treatmentPlan?: string;
}