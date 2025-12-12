// Path: src/app/api/players/[playerId]/stats/route.ts
// GET /api/players/[playerId]/stats
// Returns career and seasonal statistics

// Features:
// - Season filtering (current, previous seasons)
// - Career statistics aggregation
// - Performance metrics (goals, assists, passes, tackles)
// - Comparison data vs league averages
// - Pagination for historical data

// Response:
interface PlayerStatsResponse {
  id: string;
  playerId: string;
  season: number;
  team: { id: string; name: string };
  appearances: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  passingAccuracy: number;
  tackles: number;
  interceptions: number;
  yellowCards: number;
  redCards: number;
  expectedGoals: number;
  expectedAssists: number;
  averageRating: number;
  marketValue: number;
}
