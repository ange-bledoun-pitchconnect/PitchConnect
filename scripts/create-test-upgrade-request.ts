/**
 * Create Test Upgrade Request
 * Run: npx ts-node scripts/create-test-upgrade-request.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestRequest() {
  try {
    console.log('🔍 Finding test user...\n');

    // Get the first PLAYER or COACH user
    const testUser = await prisma.user.findFirst({
      where: {
        OR: [
          { roles: { has: 'PLAYER' } },
          { roles: { has: 'COACH' } },
        ],
        NOT: {
          roles: { has: 'SUPERADMIN' },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true,
      },
    });

    if (!testUser) {
      console.log('❌ No suitable test user found. Please create a regular user first.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Current roles: ${testUser.roles.join(', ')}\n`);

    // Determine current role
    const roleHierarchy = ['PLAYER', 'PLAYER_PRO', 'COACH', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];
    const currentRole = testUser.roles
      .map(role => roleHierarchy.indexOf(role))
      .sort((a, b) => b - a)
      .map(index => roleHierarchy[index])[0] || 'PLAYER';

    // Request next role up
    const currentIndex = roleHierarchy.indexOf(currentRole);
    const requestedRole = roleHierarchy[currentIndex + 1] || 'COACH';

    console.log(`📝 Creating upgrade request...`);
    console.log(`   From: ${currentRole}`);
    console.log(`   To: ${requestedRole}\n`);

    // Create upgrade request
    const request = await prisma.upgradeRequest.create({
      data: {
        userId: testUser.id,
        currentRole,
        requestedRole,
        reason: `I would like to upgrade to ${requestedRole} to access advanced features and manage my team more effectively. I have been actively using the platform and believe I'm ready for increased responsibilities.`,
        status: 'PENDING',
      },
    });

    console.log('✅ Test upgrade request created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 REQUEST DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 User: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`📊 From Role: ${currentRole}`);
    console.log(`🎯 To Role: ${requestedRole}`);
    console.log(`⏰ Status: PENDING`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚀 Now visit: http://localhost:3000/dashboard/superadmin');
    console.log('   Go to the "Requests" tab to see this request!\n');

  } catch (error) {
    console.error('❌ Error creating test request:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestRequest()
  .then(() => {
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
