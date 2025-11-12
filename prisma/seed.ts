/**
 * Prisma Seed Script
 * Populates database with demo data for testing
 * Run with: npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts
 * Or: npm run prisma:seed
 */

import { PrismaClient, UserRole, Position, PreferredFoot, MatchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================================
  // DEMO USERS & AUTHENTICATION
  // ============================================================================

  // Hash password for demo users
  const demoPassword = await bcrypt.hash('Demo123456!', 10);

  // Demo Player 1
  const player1 = await prisma.user.create({
    data: {
      email: 'demo.player@pitchconnect.com',
      password: demoPassword,
      firstName: 'John',
      lastName: 'Smith',
      roles: [UserRole.PLAYER],
      status: 'ACTIVE',
      preferences: {
        create: {},
      },
    },
  });

  console.log('✅ Created demo player 1:', player1.email);

  // Create player profile
  await prisma.player.create({
    data: {
      userId: player1.id,
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('2000-05-15'),
      nationality: 'England',
      height: 185,
      weight: 78,
      position: Position.MIDFIELDER,
      preferredFoot: PreferredFoot.RIGHT,
      shirtNumber: 7,
      status: 'ACTIVE',
    },
  });

  // Demo Player 2
  const player2 = await prisma.user.create({
    data: {
      email: 'demo.striker@pitchconnect.com',
      password: demoPassword,
      firstName: 'Marcus',
      lastName: 'Johnson',
      roles: [UserRole.PLAYER],
      status: 'ACTIVE',
      preferences: {
        create: {},
      },
    },
  });

  console.log('✅ Created demo player 2:', player2.email);

  await prisma.player.create({
    data: {
      userId: player2.id,
      firstName: 'Marcus',
      lastName: 'Johnson',
      dateOfBirth: new Date('1998-08-22'),
      nationality: 'England',
      height: 188,
      weight: 82,
      position: Position.FORWARD,
      preferredFoot: PreferredFoot.LEFT,
      shirtNumber: 9,
      status: 'ACTIVE',
    },
  });

  // Demo Player 3
  const player3 = await prisma.user.create({
    data: {
      email: 'demo.defender@pitchconnect.com',
      password: demoPassword,
      firstName: 'Alex',
      lastName: 'Williams',
      roles: [UserRole.PLAYER],
      status: 'ACTIVE',
      preferences: {
        create: {},
      },
    },
  });

  console.log('✅ Created demo player 3:', player3.email);

  await prisma.player.create({
    data: {
      userId: player3.id,
      firstName: 'Alex',
      lastName: 'Williams',
      dateOfBirth: new Date('1999-03-10'),
      nationality: 'England',
      height: 190,
      weight: 85,
      position: Position.DEFENDER,
      preferredFoot: PreferredFoot.RIGHT,
      shirtNumber: 4,
      status: 'ACTIVE',
    },
  });

  // Demo Coach
  const coach = await prisma.user.create({
    data: {
      email: 'demo.coach@pitchconnect.com',
      password: demoPassword,
      firstName: 'David',
      lastName: 'Brown',
      roles: [UserRole.COACH],
      status: 'ACTIVE',
      preferences: {
        create: {},
      },
    },
  });

  console.log('✅ Created demo coach:', coach.email);

  await prisma.coach.create({
    data: {
      userId: coach.id,
      bio: 'Experienced coach with 10+ years in grassroots and semi-professional football',
      yearsExperience: 10,
      qualifications: ['UEFA B', 'Level 2 Coaching'],
      specializations: ['Tactical Development', 'Youth Development'],
    },
  });

  // Demo Club Manager
  const clubManager = await prisma.user.create({
    data: {
      email: 'demo.manager@pitchconnect.com',
      password: demoPassword,
      firstName: 'Sarah',
      lastName: 'Davis',
      roles: [UserRole.CLUB_MANAGER],
      status: 'ACTIVE',
      preferences: {
        create: {},
      },
    },
  });

  console.log('✅ Created demo club manager:', clubManager.email);

  await prisma.clubManager.create({
    data: {
      userId: clubManager.id,
    },
  });

  // Demo League Admin
  const leagueAdmin = await prisma.user.create({
    data: {
      email: 'demo.admin@pitchconnect.com',
      password: demoPassword,
      firstName: 'Michael',
      lastName: 'Green',
      roles: [UserRole.LEAGUE_ADMIN],
      status: 'ACTIVE',
      preferences: {
        create: {},
      },
    },
  });

  console.log('✅ Created demo league admin:', leagueAdmin.email);

  await prisma.leagueAdmin.create({
    data: {
      userId: leagueAdmin.id,
    },
  });

  // ============================================================================
  // CLUBS & TEAMS
  // ============================================================================

  const club = await prisma.club.create({
    data: {
      name: 'Demo Football Club',
      code: 'DFC',
      city: 'London',
      country: 'England',
      teamType: 'AMATEUR',
      status: 'ACTIVE',
      email: 'info@demofootballclub.com',
      managerId: clubManager.id,
    },
  });

  console.log('✅ Created demo club:', club.name);

  const team = await prisma.team.create({
    data: {
      clubId: club.id,
      name: 'Demo FC First Team',
      category: 'First Team',
      season: 2025,
      status: 'ACTIVE',
      coachId: coach.id,
    },
  });

  console.log('✅ Created demo team:', team.name);

  // Add players to team
  await prisma.teamPlayer.create({
    data: {
      teamId: team.id,
      playerId: (await prisma.player.findUnique({ where: { userId: player1.id } }))!.id,
      isCaptain: true,
    },
  });

  await prisma.teamPlayer.create({
    data: {
      teamId: team.id,
      playerId: (await prisma.player.findUnique({ where: { userId: player2.id } }))!.id,
      isCaptain: false,
    },
  });

  await prisma.teamPlayer.create({
    data: {
      teamId: team.id,
      playerId: (await prisma.player.findUnique({ where: { userId: player3.id } }))!.id,
      isCaptain: false,
    },
  });

  // ============================================================================
  // PLAYER STATS
  // ============================================================================

  const player1Profile = await prisma.player.findUnique({ where: { userId: player1.id } });

  if (player1Profile) {
    await prisma.playerStats.create({
      data: {
        playerId: player1Profile.id,
        season: 2025,
        appearances: 12,
        goals: 3,
        assists: 5,
        minutesPlayed: 1080,
        passingAccuracy: 87.5,
        tackles: 45,
        interceptions: 12,
        shotsOnTarget: 8,
      },
    });
  }

  // ============================================================================
  // MATCHES & FIXTURES
  // ============================================================================

  const league = await prisma.league.create({
    data: {
      name: 'Demo Football League',
      code: 'DFL',
      country: 'England',
      season: 2025,
      status: 'ACTIVE',
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      adminId: leagueAdmin.id,
    },
  });

  console.log('✅ Created demo league:', league.name);

  // Add team to league
  await prisma.leagueTeam.create({
    data: {
      leagueId: league.id,
      teamId: team.id,
    },
  });

  // Create another team for matches
  const opposingClub = await prisma.club.create({
    data: {
      name: 'Opposing FC',
      code: 'OFC',
      city: 'Manchester',
      country: 'England',
      teamType: 'AMATEUR',
      status: 'ACTIVE',
      managerId: clubManager.id,
    },
  });

  const opposingTeam = await prisma.team.create({
    data: {
      clubId: opposingClub.id,
      name: 'Opposing FC First Team',
      category: 'First Team',
      season: 2025,
      status: 'ACTIVE',
      coachId: coach.id,
    },
  });

  // Create fixture
  const fixture = await prisma.fixture.create({
    data: {
      leagueId: league.id,
      matchweek: 1,
      season: 2025,
      status: 'COMPLETED',
    },
  });

  // Create matches
  const upcomingMatch = await prisma.match.create({
    data: {
      fixtureId: fixture.id,
      homeTeamId: team.id,
      awayTeamId: opposingTeam.id,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      venue: 'Demo Stadium',
      status: MatchStatus.SCHEDULED,
    },
  });

  console.log('✅ Created upcoming match');

  // Create completed match with stats
  const completedMatch = await prisma.match.create({
    data: {
      fixtureId: fixture.id,
      homeTeamId: team.id,
      awayTeamId: opposingTeam.id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      venue: 'Demo Stadium',
      status: MatchStatus.FINISHED,
      homeGoals: 3,
      awayGoals: 1,
      attendance: 250,
      stats: {
        create: {
          homeTeamId: team.id,
          awayTeamId: opposingTeam.id,
          homePossession: 65,
          homeShots: 18,
          homeShotsOnTarget: 7,
          homePasses: 485,
          homePassAccuracy: 82.5,
          homeTackles: 42,
          homeFouls: 8,
          homeCorners: 6,
          awayPossession: 35,
          awayShots: 8,
          awayShotsOnTarget: 2,
          awayPasses: 210,
          awayPassAccuracy: 76.2,
          awayTackles: 38,
          awayFouls: 12,
          awayCorners: 2,
        },
      },
    },
  });

  console.log('✅ Created completed match with stats');

  // Add match events
  await prisma.matchEvent.create({
    data: {
      matchId: completedMatch.id,
      type: 'GOAL',
      playerId: player1Profile?.id,
      minute: 15,
    },
  });

  await prisma.matchEvent.create({
    data: {
      matchId: completedMatch.id,
      type: 'GOAL',
      playerId: (await prisma.player.findUnique({ where: { userId: player2.id } }))?.id,
      minute: 42,
    },
  });

  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================

  const achievement1 = await prisma.achievement.create({
    data: {
      name: 'First Goal',
      description: 'Score your first goal',
      criterion: 'GOALS',
      threshold: 1,
      points: 10,
    },
  });

  const achievement2 = await prisma.achievement.create({
    data: {
      name: 'Hat Trick',
      description: 'Score 3 goals in a match',
      criterion: 'GOALS',
      threshold: 3,
      points: 50,
    },
  });

  // Award achievements
  await prisma.playerAchievement.create({
    data: {
      playerId: player1Profile!.id,
      achievementId: achievement1.id,
    },
  });

  console.log('✅ Created achievements');

  // ============================================================================
  // TRAINING SESSIONS
  // ============================================================================

  const trainingSession = await prisma.trainingSession.create({
    data: {
      teamId: team.id,
      coachId: coach.id,
      date: new Date(),
      duration: 90,
      location: 'Demo Training Ground',
      focus: 'Tactical Preparation',
      notes: 'Focus on defensive shape and set pieces',
    },
  });

  console.log('✅ Created training session');

  // ============================================================================
  // TACTICS
  // ============================================================================

  const tactic = await prisma.tactic.create({
    data: {
      coachId: coach.id,
      teamId: team.id,
      name: '4-3-3 Possession',
      formation: 'FOUR_THREE_THREE',
      description: 'High possession-based attacking play',
      playStyle: 'POSSESSION',
      defensiveShape: 'COMPACT',
      pressType: 'HIGH_PRESS',
      playerPositions: {
        create: [
          {
            playerId: player1Profile!.id,
            position: Position.MIDFIELDER,
            role: 'Central Midfielder',
          },
          {
            playerId: (await prisma.player.findUnique({ where: { userId: player2.id } }))!.id,
            position: Position.FORWARD,
            role: 'Centre Forward',
          },
        ],
      },
    },
  });

  console.log('✅ Created tactic');

  // ============================================================================
  // SCOUTING
  // ============================================================================

  await prisma.scoutingProfile.create({
    data: {
      playerId: player1Profile!.id,
      createdBy: coach.id,
      rating: 8,
      strengths: ['Passing', 'Positioning', 'Leadership'],
      weaknesses: ['Physical strength', 'Sprint speed'],
      potential: 9,
      notes: 'Excellent midfielder with great vision. Could play at higher level.',
      comparablePlayer: 'Bruno Fernandes type player',
    },
  });

  console.log('✅ Created scouting profile');

  // ============================================================================
  // STANDINGS
  // ============================================================================

  await prisma.standings.create({
    data: {
      leagueId: league.id,
      teamId: team.id,
      position: 1,
      played: 1,
      won: 1,
      drawn: 0,
      lost: 0,
      goalsFor: 3,
      goalsAgainst: 1,
      goalDifference: 2,
      points: 3,
    },
  });

  console.log('✅ Created standings');

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📝 DEMO CREDENTIALS:');
  console.log('────────────────────────────────────────');
  console.log('Player:        demo.player@pitchconnect.com / Demo123456!');
  console.log('Coach:         demo.coach@pitchconnect.com / Demo123456!');
  console.log('Club Manager:  demo.manager@pitchconnect.com / Demo123456!');
  console.log('League Admin:  demo.admin@pitchconnect.com / Demo123456!');
  console.log('────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
