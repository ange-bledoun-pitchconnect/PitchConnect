// 
======================================================================== ==== 
// src/app/api/players/[playerId]/route.ts 
// GET - Player details with stats | PATCH - Update player info 
// VERSION: 3.0 - World-Class Enhanced 
// 
======================================================================== ==== 
import { getServerSession } from 'next-auth/next'; 
import { NextRequest, NextResponse } from 'next/server'; 
import { authOptions } from '@/lib/auth'; 
import { prisma } from '@/lib/prisma'; 
import { parseJsonBody, validateStringLength } from '@/lib/api/validation'; import { errorResponse } from '@/lib/api/responses'; 
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/api/errors'; import { logResourceUpdated, createAuditLog } from '@/lib/api/audit'; 
// 
======================================================================== ==== 
// TYPES & INTERFACES 
// 
======================================================================== ==== 
interface PlayerDetailResponse { 
success: true; 
id: string; 
userId: string; 
firstName: string; 
lastName: string; 
fullName: string; 
email: string; 
dateOfBirth: string; 
age: number; 
nationality: string; 
photo: string | null; 
physical: { 
height: number | null; 
weight: number | null; 
preferredFoot: string; 
};
position: { 
primary: string; 
secondary: string | null; 
}; 
status: string; 
teams: Array<{ 
id: string; 
name: string; 
shortCode: string; 
joinedAt: string; 
shirtNumber: number | null; }>; 
statistics: { 
matchesPlayed: number; 
goals: number; 
assists: number; 
yellowCards: number; 
redCards: number; 
season: number; 
}; 
recentMatches: Array<{ 
id: string; 
date: string; 
opponent: string; 
minutes: number; 
goals: number; 
assists: number; 
rating: number | null; 
}>; 
contracts: Array<{ 
id: string; 
team: string; 
startDate: string; 
endDate: string; 
position: string; 
salary: string; 
status: string; 
}>; 
injuries: Array<{ 
id: string; 
type: string; 
date: string; 
expectedReturnDate: string | null; status: string;
}>; 
timestamp: string; 
requestId: string; 
} 
interface UpdatePlayerRequest { 
firstName?: string; 
lastName?: string; 
height?: number; 
weight?: number; 
nationality?: string; 
position?: string; 
secondaryPosition?: string; 
preferredFoot?: string; 
shirtNumber?: number; 
photo?: string; 
status?: string; 
} 
interface UpdatePlayerResponse { 
success: true; 
id: string; 
firstName: string; 
lastName: string; 
position: string; 
status: string; 
updatedAt: string; 
message: string; 
changedFields: string[]; 
timestamp: string; 
requestId: string; 
} 
// 
======================================================================== ==== 
// GET /api/players/[playerId] - Get Player Details 
// 
======================================================================== ==== 
/** 
* GET /api/players/[playerId] 
* Get comprehensive player information including stats, teams, and contracts
* 
* Path Parameters: 
* - playerId: string (player ID) 
* 
* Authorization: Any authenticated user 
* 
* Returns: 200 OK with detailed player data 
* 
* Response includes: 
* - Player personal info & photo 
* - Physical attributes 
* - Team memberships 
* - Season statistics 
* - Recent match performance 
* - Active contracts 
* - Injury status 
* 
* Features: 
* ✅ Complete player profile 
* ✅ Multi-team support 
* ✅ Aggregated statistics 
* ✅ Contract tracking 
* ✅ Injury management 
*/ 
export async function GET( 
request: NextRequest, 
{ params }: { params: { playerId: string } } 
): Promise<NextResponse<PlayerDetailResponse | { success: false; error: string; code: string; requestId: string }>> { 
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
// 2. Validate playerId 
if (!params.playerId || typeof params.playerId !== 'string') { return NextResponse.json( 
{ 
success: false, 
error: 'Invalid player ID format', 
code: 'INVALID_PLAYER_ID', 
requestId, 
}, 
{ status: 400, headers: { 'X-Request-ID': requestId } } ); 
} 
// 3. Fetch player with comprehensive data 
const currentYear = new Date().getFullYear(); 
const player = await prisma.player.findUnique({ where: { id: params.playerId }, 
include: { 
user: { 
select: { 
id: true, 
email: true, 
firstName: true, 
lastName: true, 
avatar: true, 
}, 
}, 
teamMemberships: { 
where: { status: 'ACTIVE' }, 
include: { 
team: { 
select: { 
id: true, 
name: true, 
shortCode: true, 
}, 
}, 
}, 
}, 
stats: {
where: { season: currentYear }, 
take: 1, 
}, 
matchAttendance: { 
include: { 
match: { 
select: { 
id: true, 
date: true, 
homeTeam: { select: { name: true } }, 
awayTeam: { select: { name: true } }, 
}, 
}, 
}, 
where: { match: { status: 'FINISHED' } }, 
orderBy: { match: { date: 'desc' } }, 
take: 10, 
}, 
contracts: { 
include: { 
team: { select: { name: true } }, 
}, 
orderBy: { startDate: 'desc' }, 
}, 
injuries: { 
where: { status: 'ACTIVE' }, 
orderBy: { date: 'desc' }, 
}, 
}, 
}); 
if (!player) { 
return NextResponse.json( 
{ 
success: false, 
error: 'Player not found', 
code: 'PLAYER_NOT_FOUND', 
requestId, 
}, 
{ status: 404, headers: { 'X-Request-ID': requestId } } ); 
} 
// 4. Calculate age
const birthDate = new Date(player.dateOfBirth); 
let age = currentYear - birthDate.getFullYear(); 
const monthDiff = new Date().getMonth() - birthDate.getMonth(); 
if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < birthDate.getDate())) { age--; 
} 
// 5. Format recent matches 
const recentMatches = player.matchAttendance.map((ma) => { 
const isHome = ma.match.homeTeam.name === player.teamMemberships[0]?.team.name; return { 
id: ma.match.id, 
date: ma.match.date.toISOString(), 
opponent: isHome ? ma.match.awayTeam.name : ma.match.homeTeam.name, minutes: ma.minutesPlayed || 0, 
goals: ma.goals || 0, 
assists: ma.assists || 0, 
rating: ma.performanceRating, 
}; 
}); 
// 6. Format contracts 
const formattedContracts = player.contracts.map((contract) => ({ 
id: contract.id, 
team: contract.team.name, 
startDate: contract.startDate.toISOString(), 
endDate: contract.endDate.toISOString(), 
position: contract.position || 'N/A', 
salary: contract.salary ? `£${contract.salary.toLocaleString()}` : 'Confidential', status: contract.status, 
})); 
// 7. Format injuries 
const formattedInjuries = player.injuries.map((injury) => ({ 
id: injury.id, 
type: injury.type, 
date: injury.date.toISOString(), 
expectedReturnDate: injury.expectedReturnDate?.toISOString() || null, status: injury.status, 
})); 
// 8. Create audit log 
await createAuditLog({ 
userId: session.user.id,
action: 'PLAYERVIEWED', 
resourceType: 'Player', 
resourceId: player.id, 
details: { 
playerName: `${player.firstName} ${player.lastName}`, position: player.position, 
}, 
requestId, 
}); 
// 9. Build response 
const response: PlayerDetailResponse = { 
success: true, 
id: player.id, 
userId: player.userId, 
firstName: player.firstName, 
lastName: player.lastName, 
fullName: `${player.firstName} ${player.lastName}`, email: player.user.email, 
dateOfBirth: new Date(player.dateOfBirth).toISOString(), age, 
nationality: player.nationality, 
photo: player.photo, 
physical: { 
height: player.height, 
weight: player.weight, 
preferredFoot: player.preferredFoot, 
}, 
position: { 
primary: player.position, 
secondary: player.secondaryPosition, 
}, 
status: player.status, 
teams: player.teamMemberships.map((tm) => ({ id: tm.team.id, 
name: tm.team.name, 
shortCode: tm.team.shortCode, 
joinedAt: tm.joinedAt.toISOString(), 
shirtNumber: tm.number, 
})), 
statistics: { 
matchesPlayed: player.stats[0]?.matchesPlayed || 0, goals: player.stats[0]?.goals || 0, 
assists: player.stats[0]?.assists || 0,
yellowCards: player.stats[0]?.yellowCards || 0, 
redCards: player.stats[0]?.redCards || 0, 
season: currentYear, 
}, 
recentMatches, 
contracts: formattedContracts, 
injuries: formattedInjuries, 
timestamp: new Date().toISOString(), 
requestId, 
}; 
return NextResponse.json(response, { 
status: 200, 
headers: { 'X-Request-ID': requestId }, 
}); 
} catch (error) { 
console.error('[GET /api/players/[playerId]]', { 
playerId: params.playerId, 
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
// PATCH /api/players/[playerId] - Update Player 
// 
======================================================================== ==== 
/** 
* PATCH /api/players/[playerId] 
* Update player information 
* 
* Authorization: SUPERADMIN, COACH, CLUB_MANAGER, Player (self only) * 
* Request Body (all optional): 
* - firstName: string
* - lastName: string 
* - height: number 
* - weight: number 
* - nationality: string 
* - position: string 
* - secondaryPosition: string 
* - preferredFoot: string 
* - shirtNumber: number 
* - photo: URL string 
* - status: string 
* 
* Returns: 200 OK with updated player 
* 
* Features: 
* ✅ Personal info updates 
* ✅ Physical attribute tracking 
* ✅ Position management 
* ✅ Self-service updates 
* ✅ Audit logging 
*/ 
export async function PATCH( 
request: NextRequest, 
{ params }: { params: { playerId: string } } 
): Promise<NextResponse<UpdatePlayerResponse | { success: false; error: string; code: string; requestId: string }>> { 
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
// 2. Validate playerId
if (!params.playerId || typeof params.playerId !== 'string') { return NextResponse.json( 
{ 
success: false, 
error: 'Invalid player ID format', 
code: 'INVALID_PLAYER_ID', 
requestId, 
}, 
{ status: 400, headers: { 'X-Request-ID': requestId } } ); 
} 
// 3. Parse request body 
let body: UpdatePlayerRequest; 
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
// 4. Fetch current player 
const player = await prisma.player.findUnique({ where: { id: params.playerId }, 
select: { 
id: true, 
userId: true, 
firstName: true, 
lastName: true, 
height: true, 
weight: true, 
nationality: true, 
position: true, 
secondaryPosition: true, 
preferredFoot: true, 
status: true, 
photo: true,
}, 
}); 
if (!player) { 
return NextResponse.json( 
{ 
success: false, 
error: 'Player not found', 
code: 'PLAYER_NOT_FOUND', 
requestId, 
}, 
{ status: 404, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 5. Authorization check 
const isSuperAdmin = session.user.roles?.includes('SUPERADMIN'); const isCoach = session.user.roles?.includes('COACH'); 
const isClubManager = session.user.roles?.includes('CLUB_MANAGER'); const isPlayerSelf = session.user.id === player.userId; 
if (!isSuperAdmin && !isCoach && !isClubManager && !isPlayerSelf) { return NextResponse.json( 
{ 
success: false, 
error: 'Forbidden - You do not have permission to update this player', code: 'INSUFFICIENT_PERMISSIONS', 
requestId, 
}, 
{ status: 403, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 6. Track changes 
const changes: Record<string, { old: any; new: any }> = {}; 
const updateData: Record<string, any> = {}; 
const allowedFields = ['firstName', 'lastName', 'height', 'weight', 'nationality', 'position', 'secondaryPosition', 'preferredFoot', 'photo', 'status']; 
for (const field of allowedFields) { 
if (field in body && body[field as keyof UpdatePlayerRequest] !== undefined) { const oldValue = (player as any)[field]; 
let newValue = (body as any)[field];
// Validate string fields 
if (['firstName', 'lastName', 'nationality', 'position', 'secondaryPosition', 'preferredFoot'].includes(field)) { 
if (typeof newValue === 'string') { 
newValue = newValue.trim(); 
validateStringLength(newValue, 2, 100, field); 
} 
} 
// Type coercion for numeric fields 
if (['height', 'weight'].includes(field) && newValue !== null) { newValue = parseFloat(newValue); 
if (isNaN(newValue) || newValue <= 0) { 
return NextResponse.json( 
{ 
success: false, 
error: `${field} must be a positive number`, 
code: 'INVALID_INPUT', 
requestId, 
}, 
{ status: 400, headers: { 'X-Request-ID': requestId } } 
); 
} 
} 
if (oldValue !== newValue) { 
changes[field] = { old: oldValue, new: newValue }; 
updateData[field] = newValue; 
} 
} 
} 
// 7. Check if there are changes 
if (Object.keys(updateData).length === 0) { 
return NextResponse.json( 
{ 
success: true, 
id: player.id, 
firstName: player.firstName, 
lastName: player.lastName, 
position: player.position, 
status: player.status, 
updatedAt: new Date().toISOString(),
message: 'No changes provided', 
changedFields: [], 
timestamp: new Date().toISOString(), 
requestId, 
}, 
{ status: 200, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 8. Update player 
const updatedPlayer = await prisma.player.update({ 
where: { id: params.playerId }, 
data: updateData, 
}); 
// 9. Create audit log 
await logResourceUpdated( 
session.user.id, 
'Player', 
player.id, 
`${player.firstName} ${player.lastName}`, 
changes, 
`Updated player profile` 
); 
// 10. Build response 
const response: UpdatePlayerResponse = { 
success: true, 
id: updatedPlayer.id, 
firstName: updatedPlayer.firstName, 
lastName: updatedPlayer.lastName, 
position: updatedPlayer.position, 
status: updatedPlayer.status, 
updatedAt: updatedPlayer.updatedAt.toISOString(), 
message: `Player "${updatedPlayer.firstName} ${updatedPlayer.lastName}" updated successfully`, 
changedFields: Object.keys(changes), 
timestamp: new Date().toISOString(), 
requestId, 
}; 
return NextResponse.json(response, { 
status: 200, 
headers: { 'X-Request-ID': requestId },
}); 
} catch (error) { 
console.error('[PATCH /api/players/[playerId]]', { playerId: params.playerId, 
requestId, 
error: error instanceof Error ? error.message : String(error), }); 
if (error instanceof BadRequestError) { 
return NextResponse.json( 
{ 
success: false, 
error: error.message, 
code: 'BADREQUEST', 
requestId, 
}, 
{ status: 400, headers: { 'X-Request-ID': requestId } } ); 
} 
return errorResponse(error as Error, { 
headers: { 'X-Request-ID': requestId }, 
}); 
} 
}
