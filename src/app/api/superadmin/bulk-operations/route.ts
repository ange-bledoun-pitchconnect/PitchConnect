/**
 * SuperAdmin Bulk Operations API
 * Bulk user operations and CSV imports
 * @route POST /api/superadmin/bulk-operations - Execute bulk operation
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

// ============================================================================
// POST - Execute Bulk Operation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get SuperAdmin user
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { operation, data } = body;

    // Validation
    if (!operation) {
      return NextResponse.json(
        { error: 'Missing required field: operation' },
        { status: 400 }
      );
    }

    let result;

    // ========================================
    // HANDLE DIFFERENT OPERATIONS
    // ========================================

    switch (operation) {
      // ====================================
      // CSV IMPORT: USERS/PLAYERS
      // ====================================
      case 'IMPORT_USERS':
        if (!data?.users || !Array.isArray(data.users)) {
          return NextResponse.json(
            { error: 'users array required for IMPORT_USERS' },
            { status: 400 }
          );
        }

        const createdUsers = [];
        const failedUsers = [];

        for (const userData of data.users) {
          try {
            // Validate required fields
            if (!userData.email || !userData.firstName || !userData.lastName) {
              failedUsers.push({
                data: userData,
                reason: 'Missing required fields (email, firstName, lastName)',
              });
              continue;
            }

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: userData.email },
            });

            if (existingUser) {
              failedUsers.push({
                data: userData,
                reason: 'User already exists',
              });
              continue;
            }

            // Generate default password
            const defaultPassword = userData.password || 'PitchConnect2024!';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            // Create user
            const newUser = await prisma.user.create({
              data: {
                email: userData.email,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phoneNumber: userData.phoneNumber || null,
                dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
                roles: userData.roles || ['PLAYER'],
                status: 'ACTIVE',
                preferences: {
                  create: {
                    theme: 'auto',
                    language: 'en-GB',
                    timezone: 'Europe/London',
                    currency: 'GBP',
                  },
                },
              },
            });

            createdUsers.push({
              id: newUser.id,
              email: newUser.email,
              name: `${newUser.firstName} ${newUser.lastName}`,
            });
          } catch (error) {
            failedUsers.push({
              data: userData,
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        result = {
          created: createdUsers.length,
          failed: failedUsers.length,
          createdUsers,
          failedUsers,
        };

        // Audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            action: 'BULK_USER_IMPORT',
            entityType: 'User',
            entityId: 'bulk',
            reason: `Imported ${createdUsers.length} users, ${failedUsers.length} failed`,
          },
        });
        break;

      // ====================================
      // CSV IMPORT: CLUBS/TEAMS
      // ====================================
      case 'IMPORT_CLUBS':
        if (!data?.clubs || !Array.isArray(data.clubs)) {
          return NextResponse.json(
            { error: 'clubs array required for IMPORT_CLUBS' },
            { status: 400 }
          );
        }

        const createdClubs = [];
        const failedClubs = [];

        for (const clubData of data.clubs) {
          try {
            // Validate required fields
            if (!clubData.name || !clubData.managerId) {
              failedClubs.push({
                data: clubData,
                reason: 'Missing required fields (name, managerId)',
              });
              continue;
            }

            // Check if manager exists
            const manager = await prisma.user.findUnique({
              where: { id: clubData.managerId },
            });

            if (!manager) {
              failedClubs.push({
                data: clubData,
                reason: 'Manager not found',
              });
              continue;
            }

            // Create club
            const newClub = await prisma.club.create({
              data: {
                name: clubData.name,
                description: clubData.description || null,
                location: clubData.location || null,
                contactEmail: clubData.contactEmail || null,
                contactPhone: clubData.contactPhone || null,
                managerId: clubData.managerId,
                status: 'ACTIVE',
              },
            });

            createdClubs.push({
              id: newClub.id,
              name: newClub.name,
            });
          } catch (error) {
            failedClubs.push({
              data: clubData,
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        result = {
          created: createdClubs.length,
          failed: failedClubs.length,
          createdClubs,
          failedClubs,
        };

        // Audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            action: 'BULK_CLUB_IMPORT',
            entityType: 'Club',
            entityId: 'bulk',
            reason: `Imported ${createdClubs.length} clubs, ${failedClubs.length} failed`,
          },
        });
        break;

      // ====================================
      // CSV IMPORT: LEAGUES
      // ====================================
      case 'IMPORT_LEAGUES':
        if (!data?.leagues || !Array.isArray(data.leagues)) {
          return NextResponse.json(
            { error: 'leagues array required for IMPORT_LEAGUES' },
            { status: 400 }
          );
        }

        const createdLeagues = [];
        const failedLeagues = [];

        for (const leagueData of data.leagues) {
          try {
            // Validate required fields
            if (!leagueData.name || !leagueData.adminId) {
              failedLeagues.push({
                data: leagueData,
                reason: 'Missing required fields (name, adminId)',
              });
              continue;
            }

            // Check if admin exists
            const admin = await prisma.user.findUnique({
              where: { id: leagueData.adminId },
            });

            if (!admin) {
              failedLeagues.push({
                data: leagueData,
                reason: 'Admin not found',
              });
              continue;
            }

            // Create league
            const newLeague = await prisma.league.create({
              data: {
                name: leagueData.name,
                description: leagueData.description || null,
                sport: leagueData.sport || 'Football',
                season: leagueData.season || new Date().getFullYear().toString(),
                adminId: leagueData.adminId,
                status: 'ACTIVE',
                settings: leagueData.settings || {},
              },
            });

            createdLeagues.push({
              id: newLeague.id,
              name: newLeague.name,
            });
          } catch (error) {
            failedLeagues.push({
              data: leagueData,
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        result = {
          created: createdLeagues.length,
          failed: failedLeagues.length,
          createdLeagues,
          failedLeagues,
        };

        // Audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            action: 'BULK_LEAGUE_IMPORT',
            entityType: 'League',
            entityId: 'bulk',
            reason: `Imported ${createdLeagues.length} leagues, ${failedLeagues.length} failed`,
          },
        });
        break;

      // ====================================
      // CSV IMPORT: DIVISIONS
      // ====================================
      case 'IMPORT_DIVISIONS':
        if (!data?.divisions || !Array.isArray(data.divisions)) {
          return NextResponse.json(
            { error: 'divisions array required for IMPORT_DIVISIONS' },
            { status: 400 }
          );
        }

        const createdDivisions = [];
        const failedDivisions = [];

        for (const divisionData of data.divisions) {
          try {
            // Validate required fields
            if (!divisionData.name || !divisionData.leagueId) {
              failedDivisions.push({
                data: divisionData,
                reason: 'Missing required fields (name, leagueId)',
              });
              continue;
            }

            // Check if league exists
            const league = await prisma.league.findUnique({
              where: { id: divisionData.leagueId },
            });

            if (!league) {
              failedDivisions.push({
                data: divisionData,
                reason: 'League not found',
              });
              continue;
            }

            // Create division
            const newDivision = await prisma.division.create({
              data: {
                name: divisionData.name,
                leagueId: divisionData.leagueId,
                level: divisionData.level || 1,
                maxTeams: divisionData.maxTeams || 20,
                status: 'ACTIVE',
              },
            });

            createdDivisions.push({
              id: newDivision.id,
              name: newDivision.name,
            });
          } catch (error) {
            failedDivisions.push({
              data: divisionData,
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        result = {
          created: createdDivisions.length,
          failed: failedDivisions.length,
          createdDivisions,
          failedDivisions,
        };

        // Audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            action: 'BULK_DIVISION_IMPORT',
            entityType: 'Division',
            entityId: 'bulk',
            reason: `Imported ${createdDivisions.length} divisions, ${failedDivisions.length} failed`,
          },
        });
        break;

      // ====================================
      // BULK SUSPEND
      // ====================================
      case 'BULK_SUSPEND':
        if (!data?.userIds || !Array.isArray(data.userIds)) {
          return NextResponse.json(
            { error: 'userIds array required for BULK_SUSPEND' },
            { status: 400 }
          );
        }

        const suspendResult = await prisma.user.updateMany({
          where: {
            id: { in: data.userIds },
            isSuperAdmin: false, // Prevent suspending SuperAdmins
          },
          data: { status: 'SUSPENDED' },
        });

        result = { updated: suspendResult.count };

        // Audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            action: 'BULK_USER_SUSPENDED',
            entityType: 'User',
            entityId: 'bulk',
            reason: `Suspended ${suspendResult.count} users`,
          },
        });
        break;

      // ====================================
      // BULK ACTIVATE
      // ====================================
      case 'BULK_ACTIVATE':
        if (!data?.userIds || !Array.isArray(data.userIds)) {
          return NextResponse.json(
            { error: 'userIds array required for BULK_ACTIVATE' },
            { status: 400 }
          );
        }

        const activateResult = await prisma.user.updateMany({
          where: { id: { in: data.userIds } },
          data: { status: 'ACTIVE' },
        });

        result = { updated: activateResult.count };

        // Audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            action: 'BULK_USER_ACTIVATED',
            entityType: 'User',
            entityId: 'bulk',
            reason: `Activated ${activateResult.count} users`,
          },
        });
        break;

      // ====================================
      // BULK DELETE
      // ====================================
      case 'BULK_DELETE':
        if (!data?.userIds || !Array.isArray(data.userIds)) {
          return NextResponse.json(
            { error: 'userIds array required for BULK_DELETE' },
            { status: 400 }
          );
        }

        const deleteResult = await prisma.user.deleteMany({
          where: {
            id: { in: data.userIds },
            isSuperAdmin: false, // Prevent deleting SuperAdmins
          },
        });

        result = { deleted: deleteResult.count };

        // Audit log
        await prisma.auditLog.create({
          data: {
            performedBy: adminUser.id,
            action: 'BULK_USER_DELETED',
            entityType: 'User',
            entityId: 'bulk',
            reason: `Deleted ${deleteResult.count} users`,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        message: 'Bulk operation completed successfully',
        operation,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk Operations Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export route segment config
// ============================================================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;
