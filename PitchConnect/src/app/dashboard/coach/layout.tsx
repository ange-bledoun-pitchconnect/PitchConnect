// src/app/dashboard/coach/layout.tsx

import { TeamFilterProvider } from '@/components/providers/TeamFilterProvider';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

// ========================================
// TYPES & INTERFACES
// ========================================

interface TeamData {
  id: string;
  name: string;
}

interface FormattedTeam {
  id: string;
  name: string;
}

export default async function CoachDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/login');
  }

  try {
    // ========================================
    // Step 1: Get Current User
    // ========================================
    console.log('\n📋 ===== COACH DASHBOARD LAYOUT =====');
    
    // Use safe optional chaining with nullish coalescing
    const userEmail = session.user?.email;
    if (!userEmail) {
      console.error('❌ No email found in session');
      throw new Error('User email not found in session');
    }
    
    console.log(`🔐 Session Email: ${userEmail}`);

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.error('❌ User not found in database');
      throw new Error(`User not found: ${userEmail}`);
    }

    console.log(`✅ User Found: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

    // ========================================
    // Step 2: Get Coach Profile
    // ========================================
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
    });

    if (!coach) {
      console.error('❌ Coach profile not found for user:', user.id);
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] to-[#1a1f3a]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <h1 className="text-2xl font-bold text-white mb-4">
                ❌ Coach Profile Not Found
              </h1>
              <p className="text-gray-400 mb-2">
                User: {user.firstName} {user.lastName}
              </p>
              <p className="text-gray-500 text-sm">
                No coach profile associated with this account.
              </p>
            </div>
          </div>
        </div>
      );
    }

    console.log(`✅ Coach Found: ID=${coach.id}`);

    // ========================================
    // Step 3: Query Teams Using Raw SQL
    // ========================================
    console.log(`🔍 Querying teams with coachId: ${coach.id}`);

    const teams = await prisma.$queryRaw<TeamData[]>`
      SELECT "id", "name" 
      FROM "teams" 
      WHERE "coachId" = ${coach.id}
      ORDER BY "name" ASC
    `;

    const teamsList = teams || [];
    console.log(
      `✅ Found ${teamsList.length} teams:`,
      teamsList.map((t) => `${t.name} (${t.id})`).join(', ')
    );

    // Format teams for TeamFilterProvider
    const formattedTeams: FormattedTeam[] = teamsList.map((t) => ({
      id: t.id,
      name: t.name,
    }));

    console.log('📊 Teams passed to provider:', formattedTeams);
    console.log('===== LAYOUT READY =====\n');

    // ========================================
    // Step 4: Return Layout with Provider
    // ========================================
    return (
      <TeamFilterProvider initialTeams={formattedTeams}>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] to-[#1a1f3a]">
          {children}
        </div>
      </TeamFilterProvider>
    );
  } catch (error) {
    console.error('❌ Error in CoachDashboardLayout:');
    console.error('   Error Type:', error instanceof Error ? error.name : typeof error);
    console.error('   Error Message:', error instanceof Error ? error.message : String(error));
    console.error('   Full Error:', error);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] to-[#1a1f3a]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              ⚠️ Dashboard Error
            </h1>
            <p className="text-gray-300 mb-2">
              {error instanceof Error ? error.message : String(error)}
            </p>
            <p className="text-gray-500 text-sm">
              Please check the server logs for details.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
