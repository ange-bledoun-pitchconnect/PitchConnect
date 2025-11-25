// src/app/api/leagues/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow LeagueAdmins or SuperAdmins to fetch leagues
  const allowedRoles = ['LEAGUE_ADMIN', 'SUPERADMIN'];
  if (!session.user.roles?.some((role: string) => allowedRoles.includes(role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch all leagues where the current user is LeagueAdmin or SuperAdmin
    let leagues;
    if (session.user.roles.includes('SUPERADMIN')) {
      leagues = await prisma.league.findMany({
        include: {
          _count: {
            select: { teams: true, fixtures: true, standings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // LEAGUE_ADMIN: only their leagues
      const admin = await prisma.leagueAdmin.findUnique({
        where: { userId: session.user.id },
      });
      if (!admin) {
        return NextResponse.json([], { status: 200 });
      }
      leagues = await prisma.league.findMany({
        where: { adminId: admin.id },
        include: {
          _count: {
            select: { teams: true, fixtures: true, standings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return NextResponse.json(leagues);
  } catch (error) {
    return NextResponse.json({ error: 'Server error', details: `${error}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // 🔍 DEBUG: Log session data
  console.log('=== LEAGUE CREATION DEBUG ===');
  console.log('Session exists:', !!session);
  console.log('User ID:', session?.user?.id);
  console.log('User roles:', session?.user?.roles);
  console.log('Is SuperAdmin:', session?.user?.isSuperAdmin);
  console.log('============================');
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if user is SuperAdmin OR has LEAGUE_ADMIN/SUPERADMIN role
  const isSuperAdmin = session.user.isSuperAdmin || session.user.roles?.includes('SUPERADMIN');
  const hasLeagueAdminRole = session.user.roles?.includes('LEAGUE_ADMIN');
  
  console.log('Authorization check:');
  console.log('- isSuperAdmin:', isSuperAdmin);
  console.log('- hasLeagueAdminRole:', hasLeagueAdminRole);
  
  if (!isSuperAdmin && !hasLeagueAdminRole) {
    console.log('❌ Authorization FAILED - Returning 403');
    return NextResponse.json({ 
      error: 'Forbidden', 
      debug: {
        roles: session.user.roles,
        isSuperAdmin: session.user.isSuperAdmin,
      }
    }, { status: 403 });
  }
  
  console.log('✅ Authorization PASSED');

  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.code || !body.sport || !body.season) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create LeagueAdmin profile
    let leagueAdmin = await prisma.leagueAdmin.findUnique({
      where: { userId: session.user.id },
    });

    if (!leagueAdmin) {
      console.log('Creating LeagueAdmin profile for user:', session.user.id);
      
      // Check if user has LEAGUE_ADMIN role, if not add it
      const hasLeagueAdminRole = await prisma.userRole_User.findFirst({
        where: {
          userId: session.user.id,
          roleName: 'LEAGUE_ADMIN',
        },
      });

      if (!hasLeagueAdminRole) {
        console.log('Adding LEAGUE_ADMIN role to user');
        await prisma.userRole_User.create({
          data: {
            userId: session.user.id,
            roleName: 'LEAGUE_ADMIN',
          },
        });
      }

      leagueAdmin = await prisma.leagueAdmin.create({
        data: { userId: session.user.id },
      });
      
      console.log('LeagueAdmin profile created:', leagueAdmin.id);
    }

    // Create league with configuration
    const league = await prisma.league.create({
      data: {
        name: body.name,
        code: body.code,
        sport: body.sport,
        country: body.country || 'United Kingdom',
        status: body.status || 'ACTIVE',
        season: body.season,
        format: body.format || 'ROUND_ROBIN',
        visibility: body.visibility || 'PUBLIC',
        pointsWin: body.pointsWin || 3,
        pointsDraw: body.pointsDraw || 1,
        pointsLoss: body.pointsLoss || 0,
        adminId: leagueAdmin.id,
        configuration: {
          create: {
            pointsForWin: body.pointsWin || 3,
            pointsForDraw: body.pointsDraw || 1,
            pointsForLoss: body.pointsLoss || 0,
            minTeams: body.minTeams || 2,
            maxTeams: body.maxTeams || 20,
            registrationOpen: body.registrationOpen ?? true,
            bonusPointsEnabled: body.bonusPointsEnabled || false,
            bonusPointsForGoals: body.bonusPointsForGoals || 0,
          },
        },
      },
      include: {
        configuration: true,
        _count: {
          select: { teams: true, fixtures: true, standings: true },
        },
      },
    });
    
    console.log('✅ League created successfully:', league.id);
    
    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error('POST /api/leagues error:', error);
    return NextResponse.json({ error: 'Failed to create league', details: `${error}` }, { status: 500 });
  }
}
