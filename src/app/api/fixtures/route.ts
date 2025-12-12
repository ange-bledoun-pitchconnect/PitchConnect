// 
======================================================================== ==== 
// src/app/api/fixtures/route.ts 
// GET - List fixtures | POST - Create fixtures for league 
// VERSION: 3.0 - World-Class Enhanced 
// 
======================================================================== ==== 
import { getServerSession } from 'next-auth/next'; 
import { NextRequest, NextResponse } from 'next/server'; 
import { authOptions } from '@/lib/auth'; 
import { prisma } from '@/lib/prisma'; 
import { parseJsonBody, validateRequired, validateStringLength } from '@/lib/api/validation'; import { errorResponse } from '@/lib/api/responses'; 
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors'; import { logResourceCreated, createAuditLog } from '@/lib/api/audit'; 
// 
======================================================================== ==== 
// TYPES & INTERFACES 
// 
======================================================================== ==== 
interface CreateFixtureRequest { 
leagueId: string; 
matchweek: number; 
season: number; 
fixtures?: Array<{ 
homeTeamId: string; 
awayTeamId: string; 
}>; 
} 
interface FixtureListItem { 
id: string; 
leagueId: string; 
league: { id: string; name: string; season: number }; 
matchweek: number; 
season: number; 
status: string;
matches: Array<{ 
id: string; 
homeTeam: { id: string; name: string }; 
awayTeam: { id: string; name: string }; 
date: string | null; 
score: { homeGoals: number | null; awayGoals: number | null }; 
status: string; 
}>; 
createdAt: string; 
updatedAt: string; 
} 
interface CreateFixtureResponse { 
success: true; 
id: string; 
leagueId: string; 
league: { id: string; name: string }; 
matchweek: number; 
season: number; 
matchesCount: number; 
message: string; 
timestamp: string; 
requestId: string; 
} 
interface FixturesListResponse { 
success: true; 
fixtures: FixtureListItem[]; 
pagination: { 
page: number; 
limit: number; 
total: number; 
totalPages: number; 
hasNextPage: boolean; 
hasPreviousPage: boolean; 
}; 
filters: Record<string, any>; 
timestamp: string; 
requestId: string; 
} 
// 
======================================================================== ====
// GET /api/fixtures - List Fixtures 
// 
======================================================================== ==== 
/** 
* GET /api/fixtures 
* List league fixtures with match details 
* 
* Query Parameters: 
* - page: number (default: 1) 
* - limit: number (default: 25, max: 100) 
* - leagueId: string (filter by league) 
* - matchweek: number (filter by matchweek) 
* - season: number (filter by season) 
* - status: string ('PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL') * - sortBy: 'matchweek' | 'date' (default: 'matchweek') 
* - sortOrder: 'asc' | 'desc' (default: 'asc') 
* 
* Authorization: Any authenticated user 
* 
* Returns: 200 OK with paginated fixtures 
* 
* Features: 
* ✅ Advanced filtering 
* ✅ Pagination 
* ✅ Match details included 
* ✅ Status tracking 
*/ 
export async function GET(request: NextRequest): 
Promise<NextResponse<FixturesListResponse | { success: false; error: string; code: string; requestId: string }>> { 
const requestId = crypto.randomUUID(); 
try { 
// 1. Authentication check 
const session = await getServerSession(authOptions); 
if (!session?.user?.id) { 
return NextResponse.json( 
{ 
success: false, 
error: 'Unauthorized - Authentication required', 
code: 'AUTH_REQUIRED',
requestId, 
}, 
{ status: 401, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 2. Parse pagination parameters 
const { searchParams } = new URL(request.url); 
const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10)); const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10))); const skip = (page - 1) * limit; 
// 3. Extract filter parameters 
const leagueId = searchParams.get('leagueId'); 
const matchweek = searchParams.get('matchweek'); 
const season = searchParams.get('season'); 
const status = searchParams.get('status') || 'ALL'; 
const sortBy = searchParams.get('sortBy') || 'matchweek'; 
const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'; 
// 4. Build where clause 
const where: any = {}; 
if (leagueId) where.leagueId = leagueId; 
if (matchweek) where.matchweek = parseInt(matchweek, 10); 
if (season) where.season = parseInt(season, 10); 
if (status !== 'ALL') where.status = status; 
// 5. Get total count 
const total = await prisma.fixture.count({ where }); 
const totalPages = Math.ceil(total / limit); 
// 6. Determine sort order 
const orderBy: any = {}; 
if (sortBy === 'date') { 
orderBy.createdAt = sortOrder; 
} else { 
orderBy.matchweek = sortOrder; 
} 
// 7. Fetch fixtures with matches 
const fixtures = await prisma.fixture.findMany({ 
where, 
include: {
league: { select: { id: true, name: true, season: true } }, matches: { 
select: { 
id: true, 
homeTeam: { select: { id: true, name: true } }, 
awayTeam: { select: { id: true, name: true } }, 
date: true, 
homeGoals: true, 
awayGoals: true, 
status: true, 
}, 
}, 
}, 
orderBy, 
skip, 
take: limit, 
}); 
// 8. Format fixtures 
const formattedFixtures: FixtureListItem[] = fixtures.map((fixture) => ({ id: fixture.id, 
leagueId: fixture.leagueId, 
league: fixture.league, 
matchweek: fixture.matchweek, 
season: fixture.season, 
status: fixture.status, 
matches: fixture.matches.map((match) => ({ 
id: match.id, 
homeTeam: match.homeTeam, 
awayTeam: match.awayTeam, 
date: match.date?.toISOString() || null, 
score: { 
homeGoals: match.homeGoals, 
awayGoals: match.awayGoals, 
}, 
status: match.status, 
})), 
createdAt: fixture.createdAt.toISOString(), 
updatedAt: fixture.updatedAt.toISOString(), 
})); 
// 9. Create audit log 
await createAuditLog({ 
userId: session.user.id,
action: 'FIXTURESVIEWED', 
resourceType: 'Fixture', 
details: { 
filters: { 
leagueId: leagueId || 'all', 
matchweek: matchweek || 'all', 
season: season || 'all', 
}, 
pageSize: limit, 
currentPage: page, 
}, 
requestId, 
}); 
// 10. Build response 
const response: FixturesListResponse = { 
success: true, 
fixtures: formattedFixtures, 
pagination: { 
page, 
limit, 
total, 
totalPages, 
hasNextPage: page < totalPages, 
hasPreviousPage: page > 1, 
}, 
filters: { 
leagueId: leagueId || null, 
matchweek: matchweek ? parseInt(matchweek, 10) : null, season: season ? parseInt(season, 10) : null, 
status, 
}, 
timestamp: new Date().toISOString(), 
requestId, 
}; 
return NextResponse.json(response, { 
status: 200, 
headers: { 'X-Request-ID': requestId }, 
}); 
} catch (error) { 
console.error('[GET /api/fixtures]', { 
requestId, 
error: error instanceof Error ? error.message : String(error),
}); 
return errorResponse(error as Error, { 
headers: { 'X-Request-ID': requestId }, 
}); 
} 
} 
// 
======================================================================== ==== 
// POST /api/fixtures - Create Fixtures 
// 
======================================================================== ==== 
/** 
* POST /api/fixtures 
* Create fixture(s) for a league 
* 
* Authorization: SUPERADMIN, LEAGUE_ADMIN 
* 
* Request Body: 
* Required: 
* - leagueId: string 
* - matchweek: number 
* - season: number 
* 
* Optional: 
* - fixtures: Array of match objects 
* - homeTeamId: string 
* - awayTeamId: string 
* 
* Returns: 201 Created with fixture details 
* 
* Features: 
* ✅ Bulk fixture creation 
* ✅ Team validation 
* ✅ League validation 
* ✅ Match creation 
* ✅ Transaction support 
*/
export async function POST(request: NextRequest): 
Promise<NextResponse<CreateFixtureResponse | { success: false; error: string; code: string; requestId: string }>> { 
const requestId = crypto.randomUUID(); 
try { 
// 1. Authentication check 
const session = await getServerSession(authOptions); 
if (!session?.user?.id) { 
return NextResponse.json( 
{ 
success: false, 
error: 'Unauthorized - Authentication required', 
code: 'AUTH_REQUIRED', 
requestId, 
}, 
{ status: 401, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 2. Authorization check 
const isSuperAdmin = session.user.roles?.includes('SUPERADMIN'); 
const isLeagueAdmin = session.user.roles?.includes('LEAGUE_ADMIN'); 
if (!isSuperAdmin && !isLeagueAdmin) { 
return NextResponse.json( 
{ 
success: false, 
error: 'Forbidden - Only SUPERADMIN or LEAGUE_ADMIN can create fixtures', code: 'INSUFFICIENT_PERMISSIONS', 
requestId, 
}, 
{ status: 403, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 3. Parse request body 
let body: CreateFixtureRequest; 
try { 
body = await parseJsonBody(request); 
} catch { 
return NextResponse.json( 
{
success: false, 
error: 'Invalid JSON in request body', 
code: 'INVALID_JSON', 
requestId, 
}, 
{ status: 400, headers: { 'X-Request-ID': requestId } } ); 
} 
// 4. Validate required fields 
validateRequired(body, ['leagueId', 'matchweek', 'season']); 
// 5. Verify league exists 
const league = await prisma.league.findUnique({ where: { id: body.leagueId }, 
select: { id: true, name: true, season: true }, 
}); 
if (!league) { 
return NextResponse.json( 
{ 
success: false, 
error: `League "${body.leagueId}" not found`, code: 'LEAGUE_NOT_FOUND', 
requestId, 
}, 
{ status: 404, headers: { 'X-Request-ID': requestId } } ); 
} 
// 6. Create fixture 
const fixture = await prisma.$transaction(async (tx) => { // Create fixture 
const newFixture = await tx.fixture.create({ 
data: { 
leagueId: body.leagueId, 
matchweek: body.matchweek, 
season: body.season, 
status: 'PENDING', 
}, 
include: { 
league: { select: { id: true, name: true } }, 
}, 
});
// Create matches if provided 
if (body.fixtures && body.fixtures.length > 0) { 
const matches = await Promise.all( 
body.fixtures.map(async (fixture) => { 
const [homeTeam, awayTeam] = await Promise.all([ 
tx.team.findUnique({ where: { id: fixture.homeTeamId }, select: { id: true, sport: true } }), tx.team.findUnique({ where: { id: fixture.awayTeamId }, select: { id: true, sport: true } }), ]); 
if (!homeTeam || !awayTeam) { 
throw new NotFoundError('Team', fixture.homeTeamId || fixture.awayTeamId); } 
return await tx.match.create({ 
data: { 
fixtureId: newFixture.id, 
homeTeamId: fixture.homeTeamId, 
awayTeamId: fixture.awayTeamId, 
sport: homeTeam.sport, 
status: 'SCHEDULED', 
date: new Date(), 
}, 
}); 
}) 
); 
} 
return newFixture; 
}); 
// 7. Create audit log 
await logResourceCreated( 
session.user.id, 
'Fixture', 
fixture.id, 
`${league.name} - Matchweek ${body.matchweek}`, 
{ 
leagueId: body.leagueId, 
leagueName: league.name, 
matchweek: body.matchweek, 
season: body.season, 
matchCount: body.fixtures?.length || 0, 
},
`Created fixture for ${league.name} Matchweek ${body.matchweek}` 
); 
// 8. Build response 
const response: CreateFixtureResponse = { 
success: true, 
id: fixture.id, 
leagueId: fixture.leagueId, 
league: { id: fixture.league.id, name: fixture.league.name }, 
matchweek: fixture.matchweek, 
season: fixture.season, 
matchesCount: body.fixtures?.length || 0, 
message: `Fixture created successfully for ${league.name} Matchweek ${body.matchweek}`, timestamp: new Date().toISOString(), 
requestId, 
}; 
return NextResponse.json(response, { 
status: 201, 
headers: { 'X-Request-ID': requestId }, 
}); 
} catch (error) { 
console.error('[POST /api/fixtures]', { 
requestId, 
error: error instanceof Error ? error.message : String(error), 
}); 
return errorResponse(error as Error, { 
headers: { 'X-Request-ID': requestId }, 
}); 
} 
}
