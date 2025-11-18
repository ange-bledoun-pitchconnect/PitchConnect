import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // === COACH USERS ===
  console.log('👨‍🏫 Creating coaches...');
  const coaches = [
    { email: 'mikel.arteta@arsenal.com', first: 'Mikel', last: 'Arteta' },
    { email: 'pep.guardiola@mancity.com', first: 'Pep', last: 'Guardiola' },
    { email: 'arne.slot@liverpool.com', first: 'Arne', last: 'Slot' },
  ];
  for (const coach of coaches) {
    await prisma.user.upsert({
      where: { email: coach.email },
      update: {},
      create: {
        email: coach.email,
        password: await bcrypt.hash('Coach123456!', 10),
        firstName: coach.first,
        lastName: coach.last,
        roles: ['COACH'],
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    });
  }
  console.log('✓ Coaches created\n');

  // === PLAYER USERS ===
  console.log('👥 Creating players...');
  const players = [
    { email: 'bukayo.saka@arsenal.com', first: 'Bukayo', last: 'Saka', dob: new Date('2001-09-05') },
    { email: 'gabriel.martinelli@arsenal.com', first: 'Gabriel', last: 'Martinelli', dob: new Date('2001-06-18') },
    { email: 'kai.havertz@arsenal.com', first: 'Kai', last: 'Havertz', dob: new Date('1999-06-11') },
    { email: 'thomas.partey@arsenal.com', first: 'Thomas', last: 'Partey', dob: new Date('1993-06-13') },
    { email: 'declan.rice@arsenal.com', first: 'Declan', last: 'Rice', dob: new Date('1999-01-14') },
    { email: 'erling.haaland@mancity.com', first: 'Erling', last: 'Haaland', dob: new Date('2000-07-21') },
    { email: 'jack.grealish@mancity.com', first: 'Jack', last: 'Grealish', dob: new Date('1995-09-10') },
    { email: 'phil.foden@mancity.com', first: 'Phil', last: 'Foden', dob: new Date('2000-05-28') },
    { email: 'rodri@mancity.com', first: 'Rodri', last: 'Hernández', dob: new Date('1996-06-22') },
    { email: 'mohammed.salah@liverpool.com', first: 'Mohammed', last: 'Salah', dob: new Date('1992-06-15') },
    { email: 'luis.diaz@liverpool.com', first: 'Luis', last: 'Díaz', dob: new Date('1997-01-13') },
    { email: 'darwin.nunez@liverpool.com', first: 'Darwin', last: 'Núñez', dob: new Date('1999-06-24') },
  ];
  for (const player of players) {
    await prisma.user.upsert({
      where: { email: player.email },
      update: {},
      create: {
        email: player.email,
        password: await bcrypt.hash('Player123456!', 10),
        firstName: player.first,
        lastName: player.last,
        dateOfBirth: player.dob,
        roles: ['PLAYER'],
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    });
  }
  console.log('✓ Players created\n');

  // === CLUB MANAGERS ===
  console.log('🏢 Creating club managers...');
  const coachUsers = await Promise.all(coaches.map(c => prisma.user.findUnique({ where: { email: c.email } })));
  if (coachUsers.some(u => !u)) throw new Error('At least one club manager user missing');
  const managerUsers = await Promise.all(coachUsers.map(u => {
    if (!u) throw new Error('Unexpectedly missing club manager user');
    return prisma.clubManager.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });
  }));
  if (managerUsers.some(m => !m)) throw new Error('At least one club manager record missing');

  const [arsenalManager, cityManager, liverpoolManager] = managerUsers;
  if (!arsenalManager || !cityManager || !liverpoolManager) throw new Error('Specific manager missing');
  console.log('✓ Club managers created\n');

  // === CLUBS ===
  console.log('🏟️  Creating clubs...');
  const arsenalClub = await prisma.club.upsert({
    where: { code: 'ARS' },
    update: {},
    create: {
      code: 'ARS',
      name: 'Arsenal FC',
      city: 'London',
      country: 'England',
      teamType: 'PROFESSIONAL',
      founded: new Date('1886-01-01'),
      managerId: arsenalManager.id,
    },
  });
  await prisma.club.upsert({
    where: { code: 'MCI' },
    update: {},
    create: {
      code: 'MCI',
      name: 'Manchester City',
      city: 'Manchester',
      country: 'England',
      teamType: 'PROFESSIONAL',
      founded: new Date('1880-01-01'),
      managerId: cityManager.id,
    },
  });
  await prisma.club.upsert({
    where: { code: 'LIV' },
    update: {},
    create: {
      code: 'LIV',
      name: 'Liverpool FC',
      city: 'Liverpool',
      country: 'England',
      teamType: 'PROFESSIONAL',
      founded: new Date('1892-01-01'),
      managerId: liverpoolManager.id,
    },
  });
  console.log('✓ 3 clubs created\n');

  // === COACH PROFILES ===
  console.log('👔 Creating coach profiles...');
  const [mikelArteta, pepGuardiola, arneSlot] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'mikel.arteta@arsenal.com' } }),
    prisma.user.findUnique({ where: { email: 'pep.guardiola@mancity.com' } }),
    prisma.user.findUnique({ where: { email: 'arne.slot@liverpool.com' } }),
  ]);
  if (!mikelArteta || !pepGuardiola || !arneSlot) throw new Error('Missing a coach user');

  const profilesToSeed = [
    { user: mikelArteta, years: 5, quals: ['UEFA Pro License'], specs: ['Tactical Analysis', 'Player Development'] },
    { user: pepGuardiola, years: 18, quals: ['UEFA Pro License'], specs: ['Possession Football', 'Tactical Innovation'] },
    { user: arneSlot, years: 7, quals: ['UEFA Pro License'], specs: ['High Press', 'Attacking Football'] },
  ];
  for (const { user, years, quals, specs } of profilesToSeed) {
    await prisma.coach.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        yearsExperience: years,
        qualifications: quals,
        specializations: specs,
      },
    });
  }
  console.log('✓ Coach profiles created\n');

  // === TEAMS ===
  console.log('⚽ Creating teams...');
  const currentSeason = 2024;
  const [arsenalCoach, cityCoach, liverpoolCoach] = await Promise.all([
    prisma.coach.findUnique({ where: { userId: mikelArteta.id } }),
    prisma.coach.findUnique({ where: { userId: pepGuardiola.id } }),
    prisma.coach.findUnique({ where: { userId: arneSlot.id } }),
  ]);
  if (!arsenalCoach || !cityCoach || !liverpoolCoach) throw new Error('Coach profile missing');

  const arsenalFirstTeam = await prisma.team.upsert({
    where: { id: 'arsenal-first-team-id' },
    update: {},
    create: {
      id: 'arsenal-first-team-id',
      name: 'Arsenal First Team',
      clubId: arsenalClub.id,
      coachId: arsenalCoach.id,
      category: 'SENIOR',
      season: currentSeason,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Teams created\n');

  // === PLAYER PROFILES & TEAM ASSIGNMENTS ===
  console.log('⚽ Creating player profiles and assigning to teams...');
  const playerTeamAssignments = [
    {
      email: 'bukayo.saka@arsenal.com',
      profile: {
        position: 'FORWARD',
        shirtNumber: 7,
        height: 178,
        weight: 70,
        preferredFoot: 'LEFT',
        nationality: 'England',
        dateOfBirth: new Date('2001-09-05')
      },
      teamId: arsenalFirstTeam.id,
      teamName: 'Arsenal First Team'
    },
  ];

  for (const assignment of playerTeamAssignments) {
    const playerUser = await prisma.user.findUnique({ where: { email: assignment.email } });
    if (!playerUser) throw new Error(`Missing User for ${assignment.email}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerProfile = await prisma.player.upsert({
      where: { userId: playerUser.id },
      update: assignment.profile as any,
      create: {
        userId: playerUser.id,
        ...(assignment.profile as any)
      },
    });

    const targetTeam = await prisma.team.findUnique({ where: { id: assignment.teamId } });
    if (!targetTeam) throw new Error(`Missing Team with id ${assignment.teamId} for ${assignment.email}`);

    await prisma.teamPlayer.upsert({
      where: { teamId_playerId: { teamId: assignment.teamId, playerId: playerProfile.id } },
      update: {},
      create: { teamId: assignment.teamId, playerId: playerProfile.id, isCaptain: false }
    });
  }
  console.log('✓ Player profiles created\n');

  console.log('✅ Database seeding complete!\n');
}

main().catch((e) => {
  console.error('❌ Seed Script Error:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
