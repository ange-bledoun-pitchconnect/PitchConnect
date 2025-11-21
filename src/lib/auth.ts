import prisma from '@/lib/prisma';

/**
 * Check if a user is a SuperAdmin
 * @param email - User's email address
 * @returns boolean - true if user is SuperAdmin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        isSuperAdmin: true,
        userRoles: {
          select: {
            roleName: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Check if user has isSuperAdmin flag OR has SUPERADMIN role
    const hasSuperAdminRole = user.userRoles.some(
      (userRole) => userRole.roleName === 'SUPERADMIN'
    );

    return user.isSuperAdmin || hasSuperAdminRole;
  } catch (error) {
    console.error('isSuperAdmin check error:', error);
    return false;
  }
}

/**
 * Check if a user has a specific role
 * @param email - User's email address
 * @param role - Role to check for
 * @returns boolean - true if user has the role
 */
export async function hasRole(email: string, role: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userRoles: {
          select: {
            roleName: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    return user.userRoles.some((userRole) => userRole.roleName === role);
  } catch (error) {
    console.error('hasRole check error:', error);
    return false;
  }
}

/**
 * Get all roles for a user
 * @param email - User's email address
 * @returns string[] - Array of role names
 */
export async function getUserRoles(email: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userRoles: {
          select: {
            roleName: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    return user.userRoles.map((userRole) => userRole.roleName);
  } catch (error) {
    console.error('getUserRoles error:', error);
    return [];
  }
}
