import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const roles = (session?.user?.roles as string[]) || [];

  // Check if user has MANAGER or CLUB_MANAGER role or is SuperAdmin
  const hasManagerRole = roles.includes('MANAGER') || roles.includes('CLUB_MANAGER');
  
  if (!hasManagerRole && !session?.user?.isSuperAdmin) {
    redirect('/dashboard/overview');
  }

  return <>{children}</>;
}
