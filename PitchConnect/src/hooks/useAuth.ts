/**
 * useAuth Hook
 * Provides easy access to authenticated user data
 */

import { useSession } from 'next-auth/react';
import { User, UserRole } from '@/types';

interface AuthUser extends User {
  roles: UserRole[];
}

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user as AuthUser | undefined;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isUnauthenticated = status === 'unauthenticated';

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user?.roles) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some((r) => user.roles.includes(r));
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    hasRole,
  };
}
