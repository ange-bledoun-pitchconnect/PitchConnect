// =============================================================================
// 🏆 PITCHCONNECT - TEAM ANALYTICS v3.0 (Enterprise Edition)
// =============================================================================
// Path: src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/analytics/page.tsx
// Purpose: Team performance analytics with sport-specific metrics
//
// FEATURES:
// ✅ Server-side rendering with auth check
// ✅ Sport-specific metrics (Goals/Tries/Runs/Points)
// ✅ Sport-specific positions from schema
// ✅ Player statistics with filtering/sorting
// ✅ Team aggregate stats
// ✅ CSV report download
// ✅ Schema-aligned data models
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import TeamAnalyticsClient from './TeamAnalyticsClient';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type Position = 
  // Football
  | 'GOALKEEPER' | 'LEFT_BACK' | 'CENTER_BACK' | 'RIGHT_BACK' | 'LEFT_WING_BACK' | 'RIGHT_WING_BACK'
  | 'DEFENSIVE_MIDFIELDER' | 'CENTRAL_MIDFIELDER' | 'LEFT_MIDFIELDER' | 'RIGHT_MIDFIELDER'
  | 'ATTACKING_MIDFIELDER' | 'LEFT_WINGER' | 'RIGHT_WINGER' | 'STRIKER' | 'CENTER_FORWARD' | 'SECOND_STRIKER'
  // Netball
  | 'GOALKEEPER_NETBALL' | 'GOAL_ATTACK' | 'WING_ATTACK' | 'CENTER' | 'WING_DEFENSE' | 'GOAL_DEFENSE' | 'GOAL_SHOOTER'
  // Rugby
  | 'PROP' | 'HOOKER' | 'LOCK' | 'FLANKER' | 'NUMBER_8' | 'SCRUM_HALF' | 'FLY_HALF'
  | 'INSIDE_CENTER' | 'OUTSIDE_CENTER' | 'FULLBACK' | 'HOOKER_LEAGUE' | 'PROP_LEAGUE' | 'SECOND_ROW' | 'LOOSE_FORWARD'
  // American Football
  | 'QUARTERBACK' | 'RUNNING_BACK' | 'WIDE_RECEIVER' | 'TIGHT_END' | 'LEFT_TACKLE' | 'LEFT_GUARD'
  | 'CENTER_POSITION' | 'RIGHT_GUARD' | 'RIGHT_TACKLE' | 'LINEBACKER' | 'DEFENSIVE_END' | 'DEFENSIVE_TACKLE'
  | 'SAFETY' | 'CORNERBACK' | 'PUNTER' | 'KICKER'
  // Basketball
  | 'POINT_GUARD' | 'SHOOTING_GUARD' | 'SMALL_FORWARD' | 'POWER_FORWARD' | 'CENTER_BASKETBALL'
  // Cricket
  | 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'FIELDER' | 'WICKET_KEEPER'
  // Hockey
  | 'GOALTENDER' | 'DEFENSEMAN' | 'WINGER' | 'CENTER_HOCKEY'
  // Generic
  | 'UTILITY' | 'SUBSTITUTE';

interface TeamData {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  sport: Sport;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  position: Position | null;
  jerseyNumber: number | null;
  matches: number;
  starts: number;
  minutesPlayed: number;
  // Sport-agnostic scoring (mapped to sport-specific labels in client)
  scoringActions: number; // Goals/Tries/Runs/Points/Touchdowns
  assistActions: number;  // Assists/Try Assists/etc.
  // Cards/Penalties
  yellowCards: number;
  redCards: number;
  // Calculated
  scoringPerGame: number;
  assistsPerGame: number;
  // Sport-specific extras
  cleanSheets?: number;
  saves?: number;
  tackles?: number;
  interceptions?: number;
}

interface TeamStats {
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalScored: number;
  totalConceded: number;
  winRate: number;
  scoringPerGame: number;
  cleanSheets: number;
}

// =============================================================================
// SPORT-SPECIFIC CONFIGURATION
// =============================================================================

export const SPORT_POSITIONS: Record<Sport, { value: Position; label: string; category: string }[]> = {
  FOOTBALL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper', category: 'Goalkeeper' },
    { value: 'LEFT_BACK', label: 'Left Back', category: 'Defence' },
    { value: 'CENTER_BACK', label: 'Centre Back', category: 'Defence' },
    { value: 'RIGHT_BACK', label: 'Right Back', category: 'Defence' },
    { value: 'LEFT_WING_BACK', label: 'Left Wing Back', category: 'Defence' },
    { value: 'RIGHT_WING_BACK', label: 'Right Wing Back', category: 'Defence' },
    { value: 'DEFENSIVE_MIDFIELDER', label: 'Defensive Midfielder', category: 'Midfield' },
    { value: 'CENTRAL_MIDFIELDER', label: 'Central Midfielder', category: 'Midfield' },
    { value: 'LEFT_MIDFIELDER', label: 'Left Midfielder', category: 'Midfield' },
    { value: 'RIGHT_MIDFIELDER', label: 'Right Midfielder', category: 'Midfield' },
    { value: 'ATTACKING_MIDFIELDER', label: 'Attacking Midfielder', category: 'Midfield' },
    { value: 'LEFT_WINGER', label: 'Left Winger', category: 'Attack' },
    { value: 'RIGHT_WINGER', label: 'Right Winger', category: 'Attack' },
    { value: 'STRIKER', label: 'Striker', category: 'Attack' },
    { value: 'CENTER_FORWARD', label: 'Centre Forward', category: 'Attack' },
    { value: 'SECOND_STRIKER', label: 'Second Striker', category: 'Attack' },
  ],
  NETBALL: [
    { value: 'GOAL_SHOOTER', label: 'Goal Shooter (GS)', category: 'Shooters' },
    { value: 'GOAL_ATTACK', label: 'Goal Attack (GA)', category: 'Shooters' },
    { value: 'WING_ATTACK', label: 'Wing Attack (WA)', category: 'Centre Court' },
    { value: 'CENTER', label: 'Centre (C)', category: 'Centre Court' },
    { value: 'WING_DEFENSE', label: 'Wing Defence (WD)', category: 'Centre Court' },
    { value: 'GOAL_DEFENSE', label: 'Goal Defence (GD)', category: 'Defence' },
    { value: 'GOALKEEPER_NETBALL', label: 'Goalkeeper (GK)', category: 'Defence' },
  ],
  RUGBY: [
    { value: 'PROP', label: 'Prop', category: 'Forwards' },
    { value: 'HOOKER', label: 'Hooker', category: 'Forwards' },
    { value: 'LOCK', label: 'Lock', category: 'Forwards' },
    { value: 'FLANKER', label: 'Flanker', category: 'Forwards' },
    { value: 'NUMBER_8', label: 'Number 8', category: 'Forwards' },
    { value: 'SCRUM_HALF', label: 'Scrum Half', category: 'Backs' },
    { value: 'FLY_HALF', label: 'Fly Half', category: 'Backs' },
    { value: 'INSIDE_CENTER', label: 'Inside Centre', category: 'Backs' },
    { value: 'OUTSIDE_CENTER', label: 'Outside Centre', category: 'Backs' },
    { value: 'LEFT_WINGER', label: 'Left Wing', category: 'Backs' },
    { value: 'RIGHT_WINGER', label: 'Right Wing', category: 'Backs' },
    { value: 'FULLBACK', label: 'Fullback', category: 'Backs' },
  ],
  CRICKET: [
    { value: 'BATSMAN', label: 'Batsman', category: 'Batting' },
    { value: 'BOWLER', label: 'Bowler', category: 'Bowling' },
    { value: 'ALL_ROUNDER', label: 'All-Rounder', category: 'All-Round' },
    { value: 'WICKET_KEEPER', label: 'Wicket Keeper', category: 'Keeping' },
    { value: 'FIELDER', label: 'Fielder', category: 'Fielding' },
  ],
  BASKETBALL: [
    { value: 'POINT_GUARD', label: 'Point Guard (PG)', category: 'Guards' },
    { value: 'SHOOTING_GUARD', label: 'Shooting Guard (SG)', category: 'Guards' },
    { value: 'SMALL_FORWARD', label: 'Small Forward (SF)', category: 'Forwards' },
    { value: 'POWER_FORWARD', label: 'Power Forward (PF)', category: 'Forwards' },
    { value: 'CENTER_BASKETBALL', label: 'Center (C)', category: 'Center' },
  ],
  AMERICAN_FOOTBALL: [
    { value: 'QUARTERBACK', label: 'Quarterback (QB)', category: 'Offense' },
    { value: 'RUNNING_BACK', label: 'Running Back (RB)', category: 'Offense' },
    { value: 'WIDE_RECEIVER', label: 'Wide Receiver (WR)', category: 'Offense' },
    { value: 'TIGHT_END', label: 'Tight End (TE)', category: 'Offense' },
    { value: 'LEFT_TACKLE', label: 'Left Tackle (LT)', category: 'O-Line' },
    { value: 'LEFT_GUARD', label: 'Left Guard (LG)', category: 'O-Line' },
    { value: 'CENTER_POSITION', label: 'Center (C)', category: 'O-Line' },
    { value: 'RIGHT_GUARD', label: 'Right Guard (RG)', category: 'O-Line' },
    { value: 'RIGHT_TACKLE', label: 'Right Tackle (RT)', category: 'O-Line' },
    { value: 'LINEBACKER', label: 'Linebacker (LB)', category: 'Defense' },
    { value: 'DEFENSIVE_END', label: 'Defensive End (DE)', category: 'D-Line' },
    { value: 'DEFENSIVE_TACKLE', label: 'Defensive Tackle (DT)', category: 'D-Line' },
    { value: 'CORNERBACK', label: 'Cornerback (CB)', category: 'Secondary' },
    { value: 'SAFETY', label: 'Safety (S)', category: 'Secondary' },
    { value: 'KICKER', label: 'Kicker (K)', category: 'Special Teams' },
    { value: 'PUNTER', label: 'Punter (P)', category: 'Special Teams' },
  ],
  HOCKEY: [
    { value: 'GOALTENDER', label: 'Goaltender', category: 'Goalie' },
    { value: 'DEFENSEMAN', label: 'Defenseman', category: 'Defense' },
    { value: 'CENTER_HOCKEY', label: 'Center', category: 'Forwards' },
    { value: 'WINGER', label: 'Winger', category: 'Forwards' },
  ],
  LACROSSE: [
    { value: 'GOALKEEPER', label: 'Goalkeeper', category: 'Goalie' },
    { value: 'DEFENSEMAN', label: 'Defenseman', category: 'Defense' },
    { value: 'CENTRAL_MIDFIELDER', label: 'Midfielder', category: 'Midfield' },
    { value: 'STRIKER', label: 'Attackman', category: 'Attack' },
  ],
  AUSTRALIAN_RULES: [
    { value: 'FULLBACK', label: 'Full Back', category: 'Defence' },
    { value: 'CENTER_BACK', label: 'Centre Half Back', category: 'Defence' },
    { value: 'CENTER', label: 'Centre', category: 'Midfield' },
    { value: 'CENTER_FORWARD', label: 'Centre Half Forward', category: 'Forward' },
    { value: 'STRIKER', label: 'Full Forward', category: 'Forward' },
  ],
  GAELIC_FOOTBALL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper', category: 'Goalie' },
    { value: 'CENTER_BACK', label: 'Full Back', category: 'Defence' },
    { value: 'CENTRAL_MIDFIELDER', label: 'Midfielder', category: 'Midfield' },
    { value: 'CENTER_FORWARD', label: 'Half Forward', category: 'Forward' },
    { value: 'STRIKER', label: 'Full Forward', category: 'Forward' },
  ],
  FUTSAL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper', category: 'Goalkeeper' },
    { value: 'DEFENSEMAN', label: 'Fixo (Defender)', category: 'Defence' },
    { value: 'WINGER', label: 'Ala (Winger)', category: 'Midfield' },
    { value: 'STRIKER', label: 'Pivô (Pivot)', category: 'Attack' },
  ],
  BEACH_FOOTBALL: [
    { value: 'GOALKEEPER', label: 'Goalkeeper', category: 'Goalkeeper' },
    { value: 'DEFENSEMAN', label: 'Defender', category: 'Defence' },
    { value: 'STRIKER', label: 'Forward', category: 'Attack' },
  ],
};

export const SPORT_METRICS: Record<Sport, {
  scoringLabel: string;
  scoringLabelPlural: string;
  assistLabel: string;
  assistLabelPlural: string;
  cleanSheetLabel: string;
  additionalMetrics: { key: string; label: string }[];
}> = {
  FOOTBALL: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Assist', assistLabelPlural: 'Assists',
    cleanSheetLabel: 'Clean Sheets',
    additionalMetrics: [
      { key: 'tackles', label: 'Tackles' },
      { key: 'interceptions', label: 'Interceptions' },
      { key: 'saves', label: 'Saves' },
    ],
  },
  RUGBY: {
    scoringLabel: 'Try', scoringLabelPlural: 'Tries',
    assistLabel: 'Try Assist', assistLabelPlural: 'Try Assists',
    cleanSheetLabel: 'Clean Sheets',
    additionalMetrics: [
      { key: 'tackles', label: 'Tackles' },
      { key: 'lineBreaks', label: 'Line Breaks' },
      { key: 'conversions', label: 'Conversions' },
    ],
  },
  CRICKET: {
    scoringLabel: 'Run', scoringLabelPlural: 'Runs',
    assistLabel: 'Wicket', assistLabelPlural: 'Wickets',
    cleanSheetLabel: 'Maidens',
    additionalMetrics: [
      { key: 'catches', label: 'Catches' },
      { key: 'stumpings', label: 'Stumpings' },
      { key: 'runOuts', label: 'Run Outs' },
    ],
  },
  BASKETBALL: {
    scoringLabel: 'Point', scoringLabelPlural: 'Points',
    assistLabel: 'Assist', assistLabelPlural: 'Assists',
    cleanSheetLabel: 'Blocks',
    additionalMetrics: [
      { key: 'rebounds', label: 'Rebounds' },
      { key: 'steals', label: 'Steals' },
      { key: 'threePointers', label: '3-Pointers' },
    ],
  },
  NETBALL: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Goal Assist', assistLabelPlural: 'Goal Assists',
    cleanSheetLabel: 'Intercepts',
    additionalMetrics: [
      { key: 'rebounds', label: 'Rebounds' },
      { key: 'deflections', label: 'Deflections' },
      { key: 'centrePassReceives', label: 'Centre Pass Receives' },
    ],
  },
  HOCKEY: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Assist', assistLabelPlural: 'Assists',
    cleanSheetLabel: 'Shutouts',
    additionalMetrics: [
      { key: 'saves', label: 'Saves' },
      { key: 'hits', label: 'Hits' },
      { key: 'blocks', label: 'Blocked Shots' },
    ],
  },
  AMERICAN_FOOTBALL: {
    scoringLabel: 'Touchdown', scoringLabelPlural: 'Touchdowns',
    assistLabel: 'Pass TD', assistLabelPlural: 'Passing TDs',
    cleanSheetLabel: 'Sacks',
    additionalMetrics: [
      { key: 'rushingYards', label: 'Rushing Yards' },
      { key: 'passingYards', label: 'Passing Yards' },
      { key: 'interceptions', label: 'INTs' },
    ],
  },
  LACROSSE: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Assist', assistLabelPlural: 'Assists',
    cleanSheetLabel: 'Saves',
    additionalMetrics: [
      { key: 'groundBalls', label: 'Ground Balls' },
      { key: 'faceOffs', label: 'Face-Off Wins' },
    ],
  },
  AUSTRALIAN_RULES: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Behind', assistLabelPlural: 'Behinds',
    cleanSheetLabel: 'Marks',
    additionalMetrics: [
      { key: 'disposals', label: 'Disposals' },
      { key: 'tackles', label: 'Tackles' },
      { key: 'clearances', label: 'Clearances' },
    ],
  },
  GAELIC_FOOTBALL: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Point', assistLabelPlural: 'Points',
    cleanSheetLabel: 'Clean Sheets',
    additionalMetrics: [
      { key: 'marks', label: 'Marks' },
      { key: 'kickOuts', label: 'Kick-Outs Won' },
    ],
  },
  FUTSAL: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Assist', assistLabelPlural: 'Assists',
    cleanSheetLabel: 'Clean Sheets',
    additionalMetrics: [
      { key: 'saves', label: 'Saves' },
      { key: 'fouls', label: 'Fouls' },
    ],
  },
  BEACH_FOOTBALL: {
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals',
    assistLabel: 'Assist', assistLabelPlural: 'Assists',
    cleanSheetLabel: 'Clean Sheets',
    additionalMetrics: [
      { key: 'saves', label: 'Saves' },
      { key: 'bicycleKicks', label: 'Bicycle Kicks' },
    ],
  },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getTeamAnalyticsData(
  clubId: string,
  teamId: string,
  userId: string
): Promise<{
  team: TeamData;
  teamStats: TeamStats;
  playerStats: PlayerStats[];
} | null> {
  // Verify user has access to this club/team
  const club = await prisma.club.findFirst({
    where: {
      id: clubId,
      deletedAt: null,
      OR: [
        { managerId: userId },
        { ownerId: userId },
        { members: { some: { userId, isActive: true } } },
      ],
    },
    select: {
      id: true,
      name: true,
      sport: true,
    },
  });

  if (!club) return null;

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      clubId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!team) return null;

  // Get team aggregate stats
  const aggregateStats = await prisma.teamAggregateStats.findUnique({
    where: { clubId },
  });

  // Get player statistics for this team
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId,
      isActive: true,
    },
    include: {
      player: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          statistics: {
            where: { teamId },
            orderBy: { season: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  const playerStats: PlayerStats[] = teamPlayers.map(tp => {
    const stats = tp.player.statistics[0];
    const matches = stats?.matches || 0;
    
    return {
      playerId: tp.player.id,
      playerName: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
      position: tp.position as Position | null,
      jerseyNumber: tp.jerseyNumber,
      matches,
      starts: stats?.starts || 0,
      minutesPlayed: stats?.minutesPlayed || 0,
      scoringActions: stats?.goals || 0,
      assistActions: stats?.assists || 0,
      yellowCards: stats?.yellowCards || 0,
      redCards: stats?.redCards || 0,
      scoringPerGame: matches > 0 ? (stats?.goals || 0) / matches : 0,
      assistsPerGame: matches > 0 ? (stats?.assists || 0) / matches : 0,
      cleanSheets: stats?.cleanSheets || 0,
      saves: stats?.saves || 0,
      tackles: stats?.tackles || 0,
      interceptions: stats?.interceptions || 0,
    };
  });

  const teamStats: TeamStats = {
    totalMatches: aggregateStats?.totalMatches || 0,
    totalWins: aggregateStats?.totalWins || 0,
    totalDraws: aggregateStats?.totalDraws || 0,
    totalLosses: aggregateStats?.totalLosses || 0,
    totalScored: aggregateStats?.totalGoalsFor || 0,
    totalConceded: aggregateStats?.totalGoalsAgainst || 0,
    winRate: aggregateStats?.winRate || 0,
    scoringPerGame: aggregateStats?.totalMatches 
      ? (aggregateStats?.totalGoalsFor || 0) / aggregateStats.totalMatches 
      : 0,
    cleanSheets: aggregateStats?.cleanSheets || 0,
  };

  return {
    team: {
      id: team.id,
      name: team.name,
      clubId: club.id,
      clubName: club.name,
      sport: club.sport as Sport,
    },
    teamStats,
    playerStats,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

interface PageProps {
  params: Promise<{ clubId: string; teamId: string }>;
}

export default async function TeamAnalyticsPage({ params }: PageProps) {
  const { clubId, teamId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const data = await getTeamAnalyticsData(clubId, teamId, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <TeamAnalyticsClient
      team={data.team}
      teamStats={data.teamStats}
      playerStats={data.playerStats}
      sportPositions={SPORT_POSITIONS[data.team.sport]}
      sportMetrics={SPORT_METRICS[data.team.sport]}
    />
  );
}