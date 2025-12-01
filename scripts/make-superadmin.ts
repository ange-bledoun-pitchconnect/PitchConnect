import prisma from '../src/lib/prisma';

async function makeSuperAdmin() {
  const email = 'ange@getpitchconnect.com';

  try {
    console.log('🔍 Looking for user:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log('✅ Found user:', user.email);

    // Roles to add
    const rolesToAdd = ['SUPERADMIN', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];

    for (const role of rolesToAdd) {
      const hasRole = user.userRoles.some((ur) => ur.roleName === role);

      if (hasRole) {
        console.log(`✅ User already has ${role} role`);
      } else {
        await prisma.userRole_User.create({
          data: {
            userId: user.id,
            roleName: role as UserRole,
          },
        });
        console.log(`✅ ${role} role added`);
      }
    }

    // Set isSuperAdmin flag
    await prisma.user.update({
      where: { id: user.id },
      data: { isSuperAdmin: true },
    });
    console.log('✅ isSuperAdmin flag set to true');

    // Verify
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          select: { roleName: true },
        },
      },
    });

    console.log('\n📊 Current user status:');
    console.log('  Email:', updatedUser?.email);
    console.log('  isSuperAdmin:', updatedUser?.isSuperAdmin);
    console.log('  Roles:', updatedUser?.userRoles.map((ur) => ur.roleName).join(', '));

    console.log('\n🎉 Done! User is now fully empowered');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeSuperAdmin();
