/**
 * Create SuperAdmin User
 * Run: npx ts-node scripts/create-superadmin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating SuperAdmin user...\n');

    // SuperAdmin details
    const email = 'admin@pitchconnect.com';
    const password = 'SuperAdmin123!'; // Change this!
    const firstName = 'Super';
    const lastName = 'Admin';

    // Check if SuperAdmin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('⚠️  SuperAdmin already exists!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Updating to ensure SuperAdmin status...\n`);

      // Update existing user to SuperAdmin
      const updatedAdmin = await prisma.user.update({
        where: { email },
        data: {
          isSuperAdmin: true,
          roles: ['SUPERADMIN'],
          status: 'ACTIVE',
        },
      });

      console.log('✅ SuperAdmin updated successfully!');
      console.log(`👤 Name: ${updatedAdmin.firstName} ${updatedAdmin.lastName}`);
      console.log(`📧 Email: ${updatedAdmin.email}`);
      console.log(`🔐 Password: ${password}`);
      console.log(`🎯 Roles: ${updatedAdmin.roles.join(', ')}`);
      console.log(`✅ Status: ${updatedAdmin.status}\n`);

      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create SuperAdmin user
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: new Date(),
        roles: ['SUPERADMIN'],
        status: 'ACTIVE',
        isSuperAdmin: true,
        preferences: {
          create: {
            theme: 'auto',
            language: 'en-GB',
            timezone: 'Europe/London',
            currency: 'GBP',
            notificationsEmail: true,
            notificationsPush: true,
          },
        },
      },
    });

    console.log('✅ SuperAdmin created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SUPERADMIN LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🎯 Roles: ${superAdmin.roles.join(', ')}`);
    console.log(`✅ Status: ${superAdmin.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚀 You can now login at: http://localhost:3000/auth/login\n');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
