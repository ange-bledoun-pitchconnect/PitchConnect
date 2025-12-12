// 
======================================================================== ==== 
// �� NOUVEAU : src/app/api/standings/route.ts 
// GET - Classement de la ligue avec statistiques complètes 
// VERSION : 3.0 - Version améliorée de classe mondiale 
// 
======================================================================== ==== 
import { getServerSession } from 'next-auth/next'; 
import { NextRequest, NextResponse } from 'next/server'; 
import { authOptions } from '@/lib/auth'; 
import { prisma } from '@/lib/prisma'; 
import { errorResponse } from '@/lib/api/responses'; 
import { NotFoundError, BadRequestError } from '@/lib/api/errors'; 
import { createAuditLog } from '@/lib/api/audit'; 
// 
======================================================================== ==== 
// TYPES & INTERFACES 
// 
======================================================================== ==== 
interface StandingTeam { 
position: number; 
team: { 
id: string; 
name: string;
shortCode: string; 
logo: string | null; 
}; 
club: { 
id: string; 
name: string; 
city: string | null; 
}; 
stats: { 
played: number; 
wins: number; 
draws: number; 
losses: number; 
goalsFor: number; 
buts encaissés : nombre ; 
différence de buts : nombre ; 
points : nombre ; 
} ; 
forme : chaîne de caractères ; 
tendance : « à la hausse » | « à la baisse » | « stable » ; } 
interface RéponseClassement {
succès : vrai ; 
IDLigue : chaîne de caractères ; Ligue : { 
id : chaîne de caractères ; 
nom : chaîne de caractères ; saison : nombre ; 
sport : chaîne de caractères ; format : chaîne de caractères ; } ; 
classement : ÉquipeClassement[] ; métadonnées : { 
meilleurButeur : { 
nomJoueur : chaîne de caractères ; buts : nombre ; 
équipe : chaîne de caractères ; } | null ; 
nombreTotalMatchs : nombre ; matchsJoués : nombre ; 
matchsEnAttendu : nombre ; } ; 
horodatage : chaîne de caractères ; IDRequête : chaîne de caractères ;
} 
// 
======================================================================== ==== 
// GET /api/standings - Obtenir le classement du championnat 
// 
======================================================================== ==== 
/** 
* GET /api/standings 
* Obtenir le classement du championnat avec les statistiques et les positions des équipes 
* 
* Paramètres de la requête : 
* - leagueId : chaîne de caractères (obligatoire) 
* 
* Autorisation : Tout utilisateur authentifié 
* 
* Retourne : Code 200 OK avec les données du classement 
* 
* La réponse inclut : 
* - Classement des équipes par points 
* - Statistiques des matchs (victoires, nuls, défaites) 
* - Buts marqués/encaissés et différence de buts 
* - Forme récente 
* - Informations sur le meilleur buteur 
* - Métadonnées du championnat 
* 
* Fonctionnalités :
* ✅ Calcul du classement en temps réel 
* ✅ Statistiques complètes des équipes 
* ✅ Tendances de performance 
* ✅ Suivi des meilleurs buteurs 
* ✅ Suivi de la progression des matchs 
*/ export async function GET(request: NextRequest): 
Promise<NextResponse<StandingsResponse | { success: false; error: string; code: string; requestId: string }>> { 
const requestId = crypto.randomUUID(); 
try { 
// 1. Vérification d'authentification 
const session = await getServerSession(authOptions); 
if (!session?.user?.id) { 
return NextResponse.json( 
{ 
success: false, 
error: 'Non autorisé - Authentification requise', 
code: 'AUTH_REQUIRED', 
requestId, 
}, 
{ status: 401, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 2. Récupérer l'identifiant de la ligue à partir de la requête
const { searchParams } = new URL(request.url); const leagueId = searchParams.get('leagueId'); if (!leagueId) { 
return NextResponse.json( 
{ 
success: false, 
error: 'leagueId query parameter is required', code: 'MISSING_PARAMETER', 
requestId, 
}, 
{ status: 400, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 3. Récupérer la ligue 
const league = await prisma.league.findUnique({ where: { id: leagueId }, 
select: { 
id: true, 
name: true, 
season: true, 
sport: true, 
format: true, 
teams: {
include: { 
team: { 
select: { 
id: true, 
name: true, 
shortCode: true, 
logo: true, 
club: { select: { id: true, name: true, city: true } }, }, 
}, 
}, 
}, 
}); 
if (!league) { 
return NextResponse.json( 
{ 
success: false, 
error: `League "${leagueId}" not found`, 
code: 'LEAGUE_NOT_FOUND', 
requestId, 
}, 
{ status: 404, headers: { 'X-Request-ID': requestId } } 
); 
} 
// 4. Calcul du classement de chaque équipe
const standingsData = await Promise.all( 
league.teams.map(async (lt) => { 
const teamId = lt.team.id; 
// Récupérer tous les matchs terminés 
const matches = await prisma.match.findMany({ where: { 
OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }], status: 'FINISHED', 
}, 
select: { 
homeTeamId: true, 
awayTeamId: true, 
homeGoals: true, 
awayGoals: true, 
status: true, 
date: true, 
}, 
orderBy: { date: 'desc' }, 
take: 5, 
}); 
// Calcul des statistiques 
let wins = 0,
draws = 0, 
losses = 0, 
goalsFor = 0, 
butsEncaissés = 0; 
matchs.forEach((match) => { 
const isHome = match.homeTeamId === teamId; 
const teamGoals = isHome ? match.homeGoals : match.awayGoals; const oppGoals = isHome ? match.awayGoals : match.homeGoals; if (teamGoals > oppGoals) wins++; 
else if (teamGoals === oppGoals) draws++; 
else losses++; 
goalsFor += teamGoals || 0; 
goalsEncaissés += oppGoals || 0; 
}); 
const points = wins * 3 + draws; 
const played = wins + draws + losses; 
const goalDifference = goalsFor - goalsEncaissés; 
// Calcul de la forme (5 derniers matchs) 
const form = matches 
.map((match) => { 
const isHome = match.homeTeamId === teamId; 
const teamGoals = isHome ? match.homeGoals : match.awayGoals;
const oppGoals = isHome ? match.awayGoals : match.homeGoals; 
return teamGoals > oppGoals ? 'W' : teamGoals === oppGoals ? 'D' : 'L'; }) 
.join(''); 
return { 
teamId, 
team: lt.team, 
points, 
played, 
wins, 
draws, 
losses, 
goalsFor, 
goalsAgainst, 
goalDifference, 
form, 
matchesRecent: matches, 
}; 
}) 
); 
// 5. Trier par points (décroissant), puis par différence de buts, puis par nombre de buts marqués const sorted = standingsData.sort((a, b) => {
if (b.points !== a.points) return b.points - a.points; 
if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference; return b.goalsFor - a.goalsFor; 
}); 
// 6. Ajouter la position et la tendance 
const standings: StandingTeam[] = sorted.map((team, index) => { // Tendance simple basée sur la forme récente 
const recentWins = (team.form.match(/W/g) || []).length; 
let trend: 'up' | 'down' | 'stable' = 'stable'; 
if (recentWins >= 3) trend = 'up'; 
else if (recentWins === 0) trend = 'down'; 
return { 
position: index + 1, 
team: team.team, 
club: team.team.club, 
stats: { 
played: team.played, 
wins: team.wins, 
draws: team.draws, 
losses: team.losses, 
goalsFor: team.goalsFor, 
goalsAgainst: team.goalsAgainst,
goalDifference: team.goalDifference, 
points: équipe.points, 
}, 
form: équipe.form, 
tendance, 
}; 
}); 
// 7. Obtenir le meilleur buteur 
const meilleurButeur = await prisma.playerStatistics.findFirst({ where: { league: { id: leagueId } }, 
include: { 
joueur: { 
select: { 
firstName: true, 
lastName: true, 
teamMemberships: { 
where: { status: 'ACTIVE' }, 
select: { team: { select: { name: true } } }, 
take: 1, 
}, 
}, 
}, 
orderBy: { goals: 'desc' }, 
take: 1, 
});
// 8. Compter les matchs 
const allMatches = await prisma.match.findMany({ 
where: { 
fixture: { leagueId }, 
}, 
select: { status: true }, 
}); 
const matchesPlayed = allMatches.filter((m) => m.status === 'FINISHED').length; const matchesPending = allMatches.filter((m) => m.status === 'SCHEDULED').length; // 9. Créer un journal d'audit 
await createAuditLog({ 
userId: session.user.id, 
action: 'STANDINGSVIEWED', 
resourceType: 'Standings', 
resourceId: leagueId, 
details: { 
leagueName: league.name, 
season: league.season, 
}, 
requestId, 
}); 
// 10. Construction de la réponse 
const response: StandingsResponse = { 
success: true,
leagueId: league.id, 
league: { 
id: league.id, 
name: league.name, 
season: league.season, 
sport: league.sport, 
format: league.format, 
}, 
standings, 
metadata: { 
topScorer: topScorer 
? { 
playerName: `${topScorer.player.firstName} ${topScorer.player.lastName}`, goals: topScorer.goals, 
team: topScorer.player.teamMemberships[0]?.team.name || 'Unknown', } 
: null, 
totalMatches: allMatches.length, 
matchesPlayed, 
matchesPending, 
}, 
timestamp: new Date().toISOString(), 
requestId,
}; 
return NextResponse.json(response, { 
status: 200, 
headers: { 'X-Request-ID': requestId }, 
}); 
} catch (error) { 
console.error('[GET /api/standings]', { 
requestId, 
error: error instanceof Error ? error.message : String(error), }); 
return errorResponse(error as Error, { 
headers: { 'X-Request-ID': requestId }, 
}); 
} 
}
