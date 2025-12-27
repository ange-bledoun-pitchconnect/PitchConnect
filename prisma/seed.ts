/**
 * ============================================================================
 * 🌱 PITCHCONNECT - DATABASE SEED v2.0
 * ============================================================================
 * Path: /prisma/seed.ts
 *
 * Comprehensive database seeding for development and testing
 *
 * Run with: npx prisma db seed
 * Or: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 *
 * Features:
 * ✅ Prisma 7 compatible (explicit datasourceUrl)
 * ✅ Idempotent (safe to run multiple times)
 * ✅ Creates all user roles for testing
 * ✅ Sample clubs, teams, players, matches, leagues
 * ✅ Realistic test data
 * ✅ Password hashing with bcryptjs
 * ✅ E2E test accounts (matching Playwright config)
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// ============================================================================
// 🔧 CONFIGURATION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('');
  console.error('═'.repeat(60));
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('═'.repeat(60));
  process.exit(1);
}

// ============================================================================
// 🏭 PRISMA CLIENT (Prisma 7 compatible)
// ============================================================================

const prisma = new PrismaClient({
  // ✅ PRISMA 7 REQUIREMENT: Explicit datasource URL
  datasourceUrl: DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// ============================================================================
// 🔐 CONSTANTS
// ============================================================================

/** Default password for all test accounts */
const DEFAULT_PASSWORD = 'PitchConnect123!';
const HASH_ROUNDS = 12;

/** Domain for test emails */
const TEST_DOMAIN = 'getpitchconnect.com';
const LEGACY_DOMAIN = 'pitchconnect.io';

// ============================================================================
// 👤 TEST USER DEFINITIONS
// ============================================================================

interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isSuperAdmin?: boolean;
}

const TEST_USERS: TestUser[] = [
  // Primary test accounts
  {
    email: `superadmin@${TEST_DOMAIN}`,
    firstName: 'Super',
    lastName: 'Admin',
    roles: ['SUPERADMIN'],
    isSuperAdmin: true,
  },
  {
    email: `admin@${TEST_DOMAIN}`,
    firstName: 'Platform',
    lastName: 'Admin',
    roles: ['ADMIN'],
  },
  {
    email: `clubowner@${TEST_DOMAIN}`,
    firstName: 'James',
    lastName: 'Owner',
    roles: ['CLUB_OWNER'],
  },
  {
    email: `leagueadmin@${TEST_DOMAIN}`,
    firstName: 'Sarah',
    lastName: 'League',
    roles: ['LEAGUE_ADMIN'],
  },
  {
    email: `manager@${TEST_DOMAIN}`,
    firstName: 'Mike',
    lastName: 'Manager',
    roles: ['MANAGER'],
  },
  {
    email: `coach@${TEST_DOMAIN}`,
    firstName: 'David',
    lastName: 'Coach',
    roles: ['COACH'],
  },
  {
    email: `analyst@${TEST_DOMAIN}`,
    firstName: 'Emma',
    lastName: 'Analyst',
    roles: ['ANALYST'],
  },
  {
    email: `scout@${TEST_DOMAIN}`,
    firstName: 'Tom',
    lastName: 'Scout',
    roles: ['SCOUT'],
  },
  {
    email: `referee@${TEST_DOMAIN}`,
    firstName: 'Alex',
    lastName: 'Referee',
    roles: ['REFEREE'],
  },
  {
    email: `playerpro@${TEST_DOMAIN}`,
    firstName: 'Marcus',
    lastName: 'Pro',
    roles: ['PLAYER_PRO'],
  },
  {
    email: `player@${TEST_DOMAIN}`,
    firstName: 'John',
    lastName: 'Player',
    roles: ['PLAYER'],
  },
  {
    email: `guardian@${TEST_DOMAIN}`,
    firstName: 'Linda',
    lastName: 'Guardian',
    roles: ['GUARDIAN'],
  },
  {
    email: `parent@${TEST_DOMAIN}`,
    firstName: 'Robert',
    lastName: 'Parent',
    roles: ['PARENT'],
  },
  {
    email: `fan@${TEST_DOMAIN}`,
    firstName: 'Chris',
    lastName: 'Fan',
    roles: ['FAN'],
  },
  // E2E Test accounts (matching Playwright config)
  {
    email: `test@${TEST_DOMAIN}`,
    firstName: 'Test',
    lastName: 'User',
    roles: ['PLAYER'],
  },
  // Legacy accounts (for backward compatibility)
  {
    email: `superadmin@${LEGACY_DOMAIN}`,
    firstName: 'Legacy',
    lastName: 'SuperAdmin',
    roles: ['SUPERADMIN'],
    isSuperAdmin: true,
  },
  {
    email: `coach@${LEGACY_DOMAIN}`,
    firstName: 'Legacy',
    lastName: 'Coach',
    roles: ['COACH'],
  },
  {
    email: `player@${LEGACY_DOMAIN}`,
    firstName: 'Legacy',
    lastName: 'Player',
    roles: ['PLAYER'],
  },
];

// ============================================================================
// 🏟️ SAMPLE DATA DEFINITIONS
// ============================================================================

interface ClubData {
  name: string;
  slug: string;
  city: string;
  country: string;
  foundedYear: number;
  sport: string;
  teamType: string;
  website?: string;
  primaryColor: string;
  secondaryColor: string;
}

const SAMPLE_CLUBS: ClubData[] = [
  {
    name: 'Arsenal FC',
    slug: 'arsenal-fc',
    city: 'London',
    country: 'United Kingdom',
    foundedYear: 1886,
    sport: 'FOOTBALL',
    teamType: 'PROFESSIONAL',
    website: 'https://arsenal.com',
    primaryColor: '#EF0107',
    secondaryColor: '#FFFFFF',
  },
  {
    name: 'Manchester United',
    slug: 'manchester-united',
    city: 'Manchester',
    country: 'United Kingdom',
    foundedYear: 1878,
    sport: 'FOOTBALL',
    teamType: 'PROFESSIONAL',
    website: 'https://manutd.com',
    primaryColor: '#DA291C',
    secondaryColor: '#FBE122',
  },
  {
    name: 'Chelsea FC',
    slug: 'chelsea-fc',
    city: 'London',
    country: 'United Kingdom',
    foundedYear: 1905,
    sport: 'FOOTBALL',
    teamType: 'PROFESSIONAL',
    website: 'https://chelseafc.com',
    primaryColor: '#034694',
    secondaryColor: '#FFFFFF',
  },
  {
    name: 'London Wasps RFC',
    slug: 'london-wasps',
    city: 'London',
    country: 'United Kingdom',
    foundedYear: 1867,
    sport: 'RUGBY',
    teamType: 'PROFESSIONAL',
    primaryColor: '#000000',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Surrey Stars',
    slug: 'surrey-stars',
    city: 'Guildford',
    country: 'United Kingdom',
    foundedYear: 2017,
    sport: 'CRICKET',
    teamType: 'SEMI_PROFESSIONAL',
    primaryColor: '#8B4513',
    secondaryColor: '#FFFFFF',
  },
];

// ============================================================================
// 🌱 SEED FUNCTIONS
// ============================================================================

/**
 * Hash password for test accounts
 */
async function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_ROUNDS);
}

/**
 * Seed test users
 */
async function seedUsers(): Promise<Map<string, string>> {
  console.log('\n📝 Seeding users...');

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  const userIdMap = new Map<string, string>();

  for (const userData of TEST_USERS) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          roles: userData.roles,
          isSuperAdmin: userData.isSuperAdmin || false,
          status: 'ACTIVE',
          emailVerified: new Date(),
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
        },
        create: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: hashedPassword,
          roles: userData.roles,
          isSuperAdmin: userData.isSuperAdmin || false,
          status: 'ACTIVE',
          emailVerified: new Date(),
          failedLoginAttempts: 0,
        },
      });

      // Store first role as key for easy lookup
      userIdMap.set(userData.roles[0], user.id);
      userIdMap.set(userData.email, user.id);

      console.log(`   ✅ ${userData.roles[0].padEnd(15)} → ${userData.email}`);
    } catch (error) {
      console.error(`   ❌ Failed to create ${userData.email}:`, error);
    }
  }

  return userIdMap;
}

/**
 * Seed sample clubs
 */
async function seedClubs(userIdMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n🏟️  Seeding clubs...');

  const clubIdMap = new Map<string, string>();
  const ownerId = userIdMap.get('CLUB_OWNER') || userIdMap.get('SUPERADMIN');
  const managerId = userIdMap.get('MANAGER') || ownerId;

  if (!ownerId) {
    console.log('   ⚠️  No owner found, skipping clubs');
    return clubIdMap;
  }

  for (const clubData of SAMPLE_CLUBS) {
    try {
      let club = await prisma.club.findFirst({
        where: { slug: clubData.slug },
      });

      if (!club) {
        club = await prisma.club.create({
          data: {
            name: clubData.name,
            slug: clubData.slug,
            city: clubData.city,
            country: clubData.country,
            foundedYear: clubData.foundedYear,
            sport: clubData.sport,
            teamType: clubData.teamType,
            website: clubData.website,
            primaryColor: clubData.primaryColor,
            secondaryColor: clubData.secondaryColor,
            ownerId: ownerId,
            managerId: managerId,
            status: 'ACTIVE',
          },
        });
        console.log(`   ✅ Created: ${club.name}`);
      } else {
        console.log(`   ℹ️  Exists:  ${club.name}`);
      }

      clubIdMap.set(clubData.slug, club.id);
    } catch (error) {
      console.error(`   ❌ Failed to create ${clubData.name}:`, error);
    }
  }

  return clubIdMap;
}

/**
 * Seed sample teams
 */
async function seedTeams(clubIdMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n👥 Seeding teams...');

  const teamIdMap = new Map<string, string>();
  const arsenalId = clubIdMap.get('arsenal-fc');

  if (!arsenalId) {
    console.log('   ⚠️  No clubs found, skipping teams');
    return teamIdMap;
  }

  const teams = [
    { name: 'Arsenal - First Team', clubId: arsenalId, ageGroup: 'SENIOR' },
    { name: 'Arsenal - U23', clubId: arsenalId, ageGroup: 'U23' },
    { name: 'Arsenal - U18', clubId: arsenalId, ageGroup: 'U18' },
    { name: 'Arsenal - U16', clubId: arsenalId, ageGroup: 'U16' },
    { name: 'Arsenal - Women', clubId: arsenalId, ageGroup: 'SENIOR' },
  ];

  for (const teamData of teams) {
    try {
      let team = await prisma.team.findFirst({
        where: {
          clubId: teamData.clubId,
          name: teamData.name,
        },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: teamData.name,
            clubId: teamData.clubId,
            ageGroup: teamData.ageGroup,
            status: 'ACTIVE',
          },
        });
        console.log(`   ✅ Created: ${team.name}`);
      } else {
        console.log(`   ℹ️  Exists:  ${team.name}`);
      }

      teamIdMap.set(teamData.name, team.id);
    } catch (error) {
      console.error(`   ❌ Failed to create ${teamData.name}:`, error);
    }
  }

  return teamIdMap;
}

/**
 * Seed sample leagues
 */
async function seedLeagues(clubIdMap: Map<string, string>): Promise<void> {
  console.log('\n🏆 Seeding leagues...');

  const arsenalId = clubIdMap.get('arsenal-fc');

  if (!arsenalId) {
    console.log('   ⚠️  No clubs found, skipping leagues');
    return;
  }

  const leagues = [
    {
      name: 'Premier League 2024/25',
      clubId: arsenalId,
      season: 2024,
      startDate: new Date('2024-08-17'),
      endDate: new Date('2025-05-25'),
      format: 'ROUND_ROBIN',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    },
    {
      name: 'FA Cup 2024/25',
      clubId: arsenalId,
      season: 2024,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-05-17'),
      format: 'KNOCKOUT',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    },
    {
      name: 'Champions League 2024/25',
      clubId: arsenalId,
      season: 2024,
      startDate: new Date('2024-09-17'),
      endDate: new Date('2025-05-31'),
      format: 'GROUP_KNOCKOUT',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    },
    {
      name: 'Youth Development League',
      clubId: arsenalId,
      season: 2024,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      format: 'ROUND_ROBIN',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
    },
  ];

  for (const leagueData of leagues) {
    try {
      let league = await prisma.league.findFirst({
        where: {
          clubId: leagueData.clubId,
          name: leagueData.name,
        },
      });

      if (!league) {
        league = await prisma.league.create({
          data: leagueData,
        });
        console.log(`   ✅ Created: ${league.name}`);
      } else {
        console.log(`   ℹ️  Exists:  ${league.name}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create ${leagueData.name}:`, error);
    }
  }
}

/**
 * Seed sample players
 */
async function seedPlayers(
  userIdMap: Map<string, string>,
  teamIdMap: Map<string, string>,
  clubIdMap: Map<string, string>
): Promise<void> {
  console.log('\n⚽ Seeding players...');

  const playerId = userIdMap.get('PLAYER');
  const playerProId = userIdMap.get('PLAYER_PRO');
  const firstTeamId = teamIdMap.get('Arsenal - First Team');
  const arsenalId = clubIdMap.get('arsenal-fc');

  if (!firstTeamId || !arsenalId) {
    console.log('   ⚠️  No team found, skipping players');
    return;
  }

  const players = [
    {
      userId: playerProId,
      teamId: firstTeamId,
      clubId: arsenalId,
      position: 'FORWARD',
      shirtNumber: 7,
      preferredFoot: 'RIGHT',
      height: 180,
      weight: 75,
      nationality: 'England',
      status: 'ACTIVE',
    },
    {
      userId: playerId,
      teamId: firstTeamId,
      clubId: arsenalId,
      position: 'MIDFIELDER',
      shirtNumber: 8,
      preferredFoot: 'LEFT',
      height: 175,
      weight: 70,
      nationality: 'England',
      status: 'ACTIVE',
    },
  ];

  for (const playerData of players) {
    if (!playerData.userId) continue;

    try {
      let player = await prisma.player.findFirst({
        where: { userId: playerData.userId },
      });

      if (!player) {
        player = await prisma.player.create({
          data: playerData,
        });
        console.log(`   ✅ Created player: #${player.shirtNumber} (${playerData.position})`);
      } else {
        console.log(`   ℹ️  Exists player: #${player.shirtNumber || 'N/A'}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create player:`, error);
    }
  }
}

/**
 * Seed sample coaches
 */
async function seedCoaches(
  userIdMap: Map<string, string>,
  teamIdMap: Map<string, string>,
  clubIdMap: Map<string, string>
): Promise<void> {
  console.log('\n🎯 Seeding coaches...');

  const coachId = userIdMap.get('COACH');
  const managerId = userIdMap.get('MANAGER');
  const firstTeamId = teamIdMap.get('Arsenal - First Team');
  const arsenalId = clubIdMap.get('arsenal-fc');

  if (!firstTeamId || !arsenalId) {
    console.log('   ⚠️  No team found, skipping coaches');
    return;
  }

  const coaches = [
    {
      userId: managerId,
      teamId: firstTeamId,
      clubId: arsenalId,
      coachType: 'HEAD_COACH',
      yearsExperience: 15,
      qualifications: ['UEFA Pro License', 'FA Level 4'],
      specializations: ['Tactics', 'Match Preparation'],
      status: 'ACTIVE',
    },
    {
      userId: coachId,
      teamId: firstTeamId,
      clubId: arsenalId,
      coachType: 'ASSISTANT_COACH',
      yearsExperience: 8,
      qualifications: ['UEFA A License', 'FA Level 3'],
      specializations: ['Fitness', 'Youth Development'],
      status: 'ACTIVE',
    },
  ];

  for (const coachData of coaches) {
    if (!coachData.userId) continue;

    try {
      let coach = await prisma.coach.findFirst({
        where: { userId: coachData.userId },
      });

      if (!coach) {
        coach = await prisma.coach.create({
          data: coachData,
        });
        console.log(`   ✅ Created: ${coachData.coachType}`);
      } else {
        console.log(`   ℹ️  Exists:  ${coach.coachType || 'Coach'}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create ${coachData.coachType}:`, error);
    }
  }
}

/**
 * Update user associations with clubs and teams
 */
async function updateUserAssociations(
  userIdMap: Map<string, string>,
  clubIdMap: Map<string, string>,
  teamIdMap: Map<string, string>
): Promise<void> {
  console.log('\n🔗 Updating user associations...');

  const arsenalId = clubIdMap.get('arsenal-fc');
  const firstTeamId = teamIdMap.get('Arsenal - First Team');

  if (!arsenalId || !firstTeamId) {
    console.log('   ⚠️  No club/team found, skipping associations');
    return;
  }

  const usersToAssociate = [
    'CLUB_OWNER',
    'MANAGER',
    'COACH',
    'ANALYST',
    'SCOUT',
    'PLAYER',
    'PLAYER_PRO',
  ];

  for (const role of usersToAssociate) {
    const userId = userIdMap.get(role);
    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            clubId: arsenalId,
            teamId: firstTeamId,
          },
        });
        console.log(`   ✅ Associated ${role} with Arsenal FC`);
      } catch (error) {
        console.error(`   ❌ Failed to associate ${role}:`, error);
      }
    }
  }
}

// ============================================================================
// 🚀 MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('');
  console.log('═'.repeat(60));
  console.log('🌱 PITCHCONNECT DATABASE SEED v2.0');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📍 Environment:', process.env.NODE_ENV || 'development');
  console.log('📍 Database:', DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  console.log('📍 Timestamp:', new Date().toISOString());

  try {
    // Seed in order of dependencies
    const userIdMap = await seedUsers();
    const clubIdMap = await seedClubs(userIdMap);
    const teamIdMap = await seedTeams(clubIdMap);
    await seedLeagues(clubIdMap);
    await seedPlayers(userIdMap, teamIdMap, clubIdMap);
    await seedCoaches(userIdMap, teamIdMap, clubIdMap);
    await updateUserAssociations(userIdMap, clubIdMap, teamIdMap);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('═'.repeat(60));
    console.log(`🎉 SEEDING COMPLETED SUCCESSFULLY (${elapsed}s)`);
    console.log('═'.repeat(60));
    console.log('');
    console.log('📋 Test Accounts (password: PitchConnect123!)');
    console.log('─'.repeat(60));
    console.log('');
    console.log('   Primary Accounts:');
    TEST_USERS.slice(0, 14).forEach((u) => {
      console.log(`   ${u.roles[0].padEnd(15)} → ${u.email}`);
    });
    console.log('');
    console.log('   E2E Test Account:');
    console.log(`   ${'TEST'.padEnd(15)} → test@${TEST_DOMAIN}`);
    console.log('');
  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ SEEDING FAILED');
    console.error('═'.repeat(60));
    console.error('');
    console.error('Error:', error);
    throw error;
  }
}

// ============================================================================
// 🔌 CLEANUP & EXECUTION
// ============================================================================

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✅ Disconnected');
    console.log('');
  });