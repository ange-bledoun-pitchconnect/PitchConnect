// File: src/app/api/leagues/[leagueId]/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '@/lib/api/errors';
import { createAuditLog } from '@/lib/api/audit';

interface UpdateLeagueRequest {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  format?: 'LEAGUE' | 'KNOCKOUT' | 'ROUNDROBIN' | 'GROUPS';
  maxTeams?: number;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  startDate?: string;
  endDate?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // 2. Fetch league
    const league = await prisma.league.findUnique({
      where: { id: params.leagueId },
      select: { id: true, adminId: true, name: true, status: true },
    });

    if (!league) {
      throw new NotFoundError('League not found');
    }

    // 3. Authorization check
    const isAdmin = league.adminId === user.id;
    const isSuperAdmin = user.roles?.includes('SUPERADMIN');

    if (!isAdmin && !isSuperAdmin) {
      throw new ForbiddenError('You do not have permission to update this league');
    }

    // 4. Parse body
    let body: UpdateLeagueRequest;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON');
    }

    // 5. Validate updates
    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        throw new BadRequestError('League name must be non-empty');
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.status !== undefined) {
      if (!['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(body.status)) {
        throw new BadRequestError('Invalid status');
      }
      updateData.status = body.status;
    }

    if (body.format !== undefined) {
      if (!['LEAGUE', 'KNOCKOUT', 'ROUNDROBIN', 'GROUPS'].includes(body.format)) {
        throw new BadRequestError('Invalid format');
      }
      updateData.format = body.format;
    }

    if (body.maxTeams !== undefined) {
      if (typeof body.maxTeams !== 'number' || body.maxTeams < 2) {
        throw new BadRequestError('Max teams must be at least 2');
      }
      updateData.maxTeams = body.maxTeams;
    }

    if (body.visibility !== undefined) {
      if (!['PUBLIC', 'PRIVATE', 'INVITE_ONLY'].includes(body.visibility)) {
        throw new BadRequestError('Invalid visibility');
      }
      updateData.visibility = body.visibility;
    }

    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }

    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    // 6. Update league
    const updatedLeague = await prisma.league.update({
      where: { id: params.leagueId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        club: { select: { id: true, name: true } },
        admin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    // 7. Audit log
    await createAuditLog({
      userId: user.id,
      action: 'LEAGUEUPDATED',
      resourceType: 'League',
      resourceId: league.id,
      details: {
        leagueName: league.name,
        changes: Object.keys(updateData),
      },
      requestId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedLeague.id,
          name: updatedLeague.name,
          sport: updatedLeague.sport,
          season: updatedLeague.season,
          status: updatedLeague.status,
          format: updatedLeague.format,
          visibility: updatedLeague.visibility,
          maxTeams: updatedLeague.maxTeams,
          updatedAt: updatedLeague.updatedAt.toISOString(),
          club: updatedLeague.club,
          admin: updatedLeague.admin,
        },
        message: 'League updated successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (err) {
    console.error('[League PATCH]', {
      requestId,
      leagueId: params.leagueId,
      error: err instanceof Error ? err.message : String(err),
    });

    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'UNAUTHORIZED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'FORBIDDEN' },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (err instanceof BadRequestError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'BADREQUEST' },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'NOTFOUND' },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update league', code: 'INTERNALERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
