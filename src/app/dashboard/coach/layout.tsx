import { TeamFilterProvider } from '@/components/providers/TeamFilterProvider';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function CoachDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Fetch coach's teams from database
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: {
      coachProfile: {
        include: {
          teams: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Extract teams from the coach profile
  const teams = user?.coachProfile?.teams || [];

  return (
    <TeamFilterProvider initialTeams={teams}>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] to-[#1a1f3a]">
        {children}
      </div>
    </TeamFilterProvider>
  );
}
