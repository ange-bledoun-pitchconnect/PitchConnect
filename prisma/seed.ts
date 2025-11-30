import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // ============================================================================
    // Create SuperAdmin User
    // ============================================================================
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@pitchconnect.io' },
      update: {},
      create: {
        email: 'superadmin@pitchconnect.io',
        firstName: 'Super',
        lastName: 'Admin',
        password: 'hashed_password_here',
        roles: ['SUPERADMIN'],
        status: 'ACTIVE',
        isSuperAdmin: true,
      },
    });

    console.log('✅ SuperAdmin created:', superAdmin.email);

    // ============================================================================
    // Create Test Player User
    // ============================================================================
    const testPlayer = await prisma.user.upsert({
      where: { email: 'player@pitchconnect.io' },
      update: {},
      create: {
        email: 'player@pitchconnect.io',
        firstName: 'John',
        lastName: 'Player',
        roles: ['PLAYER'],
        status: 'ACTIVE',
      },
    });

    console.log('✅ Test Player created:', testPlayer.email);

    // ============================================================================
    // Create Test Coach User
    // ============================================================================
    const testCoach = await prisma.user.upsert({
      where: { email: 'coach@pitchconnect.io' },
      update: {},
      create: {
        email: 'coach@pitchconnect.io',
        firstName: 'Mike',
        lastName: 'Coach',
        roles: ['COACH'],
        status: 'ACTIVE',
      },
    });

    console.log('✅ Test Coach created:', testCoach.email);

    // ============================================================================
    // Create Test Club (NO 'code' field)
    // ============================================================================
    let testClub = await prisma.club.findFirst({
      where: { name: 'Arsenal FC' },
    });

    if (!testClub) {
      testClub = await prisma.club.create({
        data: {
          name: 'Arsenal FC',
          city: 'London',
          country: 'United Kingdom',
          foundedYear: 1886,
          ownerId: superAdmin.id,
          primaryColor: '#EF0107',
          secondaryColor: '#FFFFFF',
        },
      });
      console.log('✅ Test Club created:', testClub.name);
    } else {
      console.log('ℹ️  Test Club already exists:', testClub.name);
    }

    // ============================================================================
    // Create Test Team
    // ============================================================================
    let testTeam = await prisma.team.findFirst({
      where: {
        clubId: testClub.id,
        name: 'Arsenal - First Team',
      },
    });

    if (!testTeam) {
      testTeam = await prisma.team.create({
        data: {
          name: 'Arsenal - First Team',
          clubId: testClub.id,
          category: 'FIRST_TEAM',
        },
      });
      console.log('✅ Test Team created:', testTeam.name);
    } else {
      console.log('ℹ️  Test Team already exists:', testTeam.name);
    }

    // ============================================================================
    // Create Test League Admin User
    // ============================================================================
    const leagueAdminUser = await prisma.user.upsert({
      where: { email: 'leagueadmin@pitchconnect.io' },
      update: {},
      create: {
        email: 'leagueadmin@pitchconnect.io',
        firstName: 'Sarah',
        lastName: 'Admin',
        roles: ['LEAGUE_ADMIN'],
        status: 'ACTIVE',
      },
    });

    console.log('✅ League Admin User created:', leagueAdminUser.email);

    // ============================================================================
    // Create League Admin Profile
    // ============================================================================
    const leagueAdmin = await prisma.leagueAdmin.findFirst({
      where: { userId: leagueAdminUser.id },
    });

    if (!leagueAdmin) {
      await prisma.leagueAdmin.create({
        data: {
          userId: leagueAdminUser.id,
        },
      });
      console.log('✅ League Admin profile created');
    } else {
      console.log('ℹ️  League Admin profile already exists');
    }

    // ============================================================================
    // Create Test League
    // ============================================================================
    let testLeague = await prisma.league.findFirst({
      where: { code: 'PL2024' },
    });

    if (!testLeague) {
      const foundLeagueAdmin = await prisma.leagueAdmin.findFirst({
        where: { userId: leagueAdminUser.id },
      });

      if (foundLeagueAdmin) {
        testLeague = await prisma.league.create({
          data: {
            name: 'Premier Test League 2024',
            code: 'PL2024',
            country: 'United Kingdom',
            season: 2024,
            adminId: foundLeagueAdmin.id,
            pointsWin: 3,
            pointsDraw: 1,
            pointsLoss: 0,
          },
        });
        console.log('✅ Test League created:', testLeague.name);
      }
    } else {
      console.log('ℹ️  Test League already exists:', testLeague.name);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('   SuperAdmin:   superadmin@pitchconnect.io');
    console.log('   Coach:        coach@pitchconnect.io');
    console.log('   Player:       player@pitchconnect.io');
    console.log('   League Admin: leagueadmin@pitchconnect.io');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
