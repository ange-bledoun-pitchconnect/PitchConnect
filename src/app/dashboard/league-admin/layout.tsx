import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LeagueAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user?.roles as string[]) || [];

  // Check if user has LEAGUE_ADMIN role or is SuperAdmin
  if (!roles.includes('LEAGUE_ADMIN') && !session?.user?.isSuperAdmin) {
    redirect('/dashboard/overview');
  }

  return <>{children}</>;
}
