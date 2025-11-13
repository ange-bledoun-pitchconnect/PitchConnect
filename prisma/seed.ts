import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // ========================================
    // STEP 1: Create Users (Coaches & Players)
    // ========================================
    console.log('👨‍🏫 Creating coaches...');

    const coaches = [
      { email: 'mikel.arteta@arsenal.com', first: 'Mikel', last: 'Arteta' },
      { email: 'pep.guardiola@mancity.com', first: 'Pep', last: 'Guardiola' },
      { email: 'arne.slot@liverpool.com', first: 'Arne', last: 'Slot' },
    ];

    let coachCount = 0;
    for (const coach of coaches) {
      const existing = await prisma.user.findUnique({ where: { email: coach.email } });
      if (!existing) {
        try {
          await prisma.user.create({
            data: {
              email: coach.email,
              password: await bcrypt.hash('Coach123456!', 10),
              firstName: coach.first,
              lastName: coach.last,
              roles: ['COACH'],
              status: 'ACTIVE',
              emailVerified: new Date(),
            },
          });
          coachCount++;
        } catch (err) {
          console.log(`  Skipped ${coach.email} (already exists)`);
        }
      }
    }
    console.log(`✓ ${coachCount} coaches created\n`);

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

    let playerCount = 0;
    for (const player of players) {
      const existing = await prisma.user.findUnique({ where: { email: player.email } });
      if (!existing) {
        try {
          await prisma.user.create({
            data: {
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
          playerCount++;
        } catch (err) {
          console.log(`  Skipped ${player.email} (already exists)`);
        }
      }
    }
    console.log(`✓ ${playerCount} players created\n`);

    // ========================================
    // STEP 2: Create Club Managers
    // ========================================
    console.log('🏢 Creating club managers...');

    const clubManagers = [];
    for (const coach of coaches) {
      const user = await prisma.user.findUnique({ where: { email: coach.email } });
      if (user) {
        let manager = await prisma.clubManager.findUnique({
          where: { userId: user.id },
        });
        
        if (!manager) {
          manager = await prisma.clubManager.create({
            data: { userId: user.id },
          });
        }
        
        clubManagers.push(manager);
      }
    }
    console.log(`✓ ${clubManagers.length} club managers created\n`);

    // ========================================
    // STEP 3: Create Clubs
    // ========================================
    console.log('🏟️  Creating clubs...');

    const arsenalManager = clubManagers[0];
    const cityManager = clubManagers[1];
    const liverpoolManager = clubManagers[2];

    const arsenalClub = await prisma.club.upsert({
      where: { code: 'ARS' },
      update: {},
      create: {
        id: 'arsenal-fc-id',
        code: 'ARS',
        name: 'Arsenal FC',
        city: 'London',
        country: 'England',
        teamType: 'PROFESSIONAL',
        founded: new Date('1886-01-01'),
        managerId: arsenalManager.id,
      },
    });

    const manchesterCityClub = await prisma.club.upsert({
      where: { code: 'MCI' },
      update: {},
      create: {
        id: 'man-city-fc-id',
        code: 'MCI',
        name: 'Manchester City',
        city: 'Manchester',
        country: 'England',
        teamType: 'PROFESSIONAL',
        founded: new Date('1880-01-01'),
        managerId: cityManager.id,
      },
    });

    const liverpoolClub = await prisma.club.upsert({
      where: { code: 'LIV' },
      update: {},
      create: {
        id: 'liverpool-fc-id',
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

    // ========================================
    // STEP 4: Create Coach Profiles
    // ========================================
    console.log('👔 Creating coach profiles...');

    const mikelArteta = await prisma.user.findUnique({
      where: { email: 'mikel.arteta@arsenal.com' },
    });

    const pepGuardiola = await prisma.user.findUnique({
      where: { email: 'pep.guardiola@mancity.com' },
    });

    const arneSlot = await prisma.user.findUnique({
      where: { email: 'arne.slot@liverpool.com' },
    });

    let coachProfileCount = 0;

    // Mikel Arteta
    if (mikelArteta) {
      const existingProfile = await prisma.coach.findUnique({
        where: { userId: mikelArteta.id },
      });
      if (!existingProfile) {
        await prisma.coach.create({
          data: {
            userId: mikelArteta.id,
            yearsExperience: 5,
            qualifications: ['UEFA Pro License'],
            specializations: ['Tactical Analysis', 'Player Development'],
          },
        });
        coachProfileCount++;
      }
    }

    // Pep Guardiola
    if (pepGuardiola) {
      const existingProfile = await prisma.coach.findUnique({
        where: { userId: pepGuardiola.id },
      });
      if (!existingProfile) {
        await prisma.coach.create({
          data: {
            userId: pepGuardiola.id,
            yearsExperience: 18,
            qualifications: ['UEFA Pro License'],
            specializations: ['Possession Football', 'Tactical Innovation'],
          },
        });
        coachProfileCount++;
      }
    }

    // Arne Slot
    if (arneSlot) {
      const existingProfile = await prisma.coach.findUnique({
        where: { userId: arneSlot.id },
      });
      if (!existingProfile) {
        await prisma.coach.create({
          data: {
            userId: arneSlot.id,
            yearsExperience: 7,
            qualifications: ['UEFA Pro License'],
            specializations: ['High Press', 'Attacking Football'],
          },
        });
        coachProfileCount++;
      }
    }

    console.log(`✓ ${coachProfileCount} coach profiles created\n`);

    // ========================================
    // STEP 5: Create Teams
    // ========================================
    console.log('⚽ Creating teams...');

    const currentSeason = 2024;

    const arsenalCoach = await prisma.coach.findUnique({
      where: { userId: mikelArteta.id },
    });
    const cityCoach = await prisma.coach.findUnique({
      where: { userId: pepGuardiola.id },
    });
    const liverpoolCoach = await prisma.coach.findUnique({
      where: { userId: arneSlot.id },
    });

    const arsenalFirstTeam = await prisma.team.upsert({
      where: { id: 'arsenal-first-team-id' },
      update: {},
      create: {
        id: 'arsenal-first-team-id',
        name: 'Arsenal First Team',
        clubId: arsenalClub.id,
        coachId: arsenalCoach!.id,
        category: 'SENIOR',
        season: currentSeason,
        status: 'ACTIVE',
      },
    });

    const arsenalU21 = await prisma.team.upsert({
      where: { id: 'arsenal-u21-id' },
      update: {},
      create: {
        id: 'arsenal-u21-id',
        name: 'Arsenal U21',
        clubId: arsenalClub.id,
        coachId: arsenalCoach!.id,
        category: 'U21',
        season: currentSeason,
        status: 'ACTIVE',
      },
    });

    const cityFirstTeam = await prisma.team.upsert({
      where: { id: 'city-first-team-id' },
      update: {},
      create: {
        id: 'city-first-team-id',
        name: 'Manchester City First Team',
        clubId: manchesterCityClub.id,
        coachId: cityCoach!.id,
        category: 'SENIOR',
        season: currentSeason,
        status: 'ACTIVE',
      },
    });

    const cityU21 = await prisma.team.upsert({
      where: { id: 'city-u21-id' },
      update: {},
      create: {
        id: 'city-u21-id',
        name: 'Manchester City U21',
        clubId: manchesterCityClub.id,
        coachId: cityCoach!.id,
        category: 'U21',
        season: currentSeason,
        status: 'ACTIVE',
      },
    });

    const liverpoolFirstTeam = await prisma.team.upsert({
      where: { id: 'liverpool-first-team-id' },
      update: {},
      create: {
        id: 'liverpool-first-team-id',
        name: 'Liverpool First Team',
        clubId: liverpoolClub.id,
        coachId: liverpoolCoach!.id,
        category: 'SENIOR',
        season: currentSeason,
        status: 'ACTIVE',
      },
    });

    const liverpoolU21 = await prisma.team.upsert({
      where: { id: 'liverpool-u21-id' },
      update: {},
      create: {
        id: 'liverpool-u21-id',
        name: 'Liverpool U21',
        clubId: liverpoolClub.id,
        coachId: liverpoolCoach!.id,
        category: 'U21',
        season: currentSeason,
        status: 'ACTIVE',
      },
    });

    console.log('✓ 6 teams created\n');

    // ========================================
    // STEP 6: Create Player Profiles & Assign to Teams
    // ========================================
    console.log('⚽ Creating player profiles and assigning to teams...');

    const playerProfiles = [
      // Arsenal Players
      { 
        email: 'bukayo.saka@arsenal.com', 
        position: 'FORWARD', 
        shirtNumber: 7, 
        height: 178, 
        weight: 70,
        foot: 'LEFT',
        nationality: 'England',
        teamId: arsenalFirstTeam.id,
      },
      { 
        email: 'gabriel.martinelli@arsenal.com', 
        position: 'FORWARD', 
        shirtNumber: 11, 
        height: 178, 
        weight: 72,
        foot: 'RIGHT',
        nationality: 'Brazil',
        teamId: arsenalFirstTeam.id,
      },
      { 
        email: 'kai.havertz@arsenal.com', 
        position: 'MIDFIELDER', 
        shirtNumber: 29, 
        height: 190, 
        weight: 82,
        foot: 'LEFT',
        nationality: 'Germany',
        teamId: arsenalFirstTeam.id,
      },
      { 
        email: 'thomas.partey@arsenal.com', 
        position: 'MIDFIELDER', 
        shirtNumber: 5, 
        height: 185, 
        weight: 77,
        foot: 'RIGHT',
        nationality: 'Ghana',
        teamId: arsenalFirstTeam.id,
      },
      { 
        email: 'declan.rice@arsenal.com', 
        position: 'MIDFIELDER', 
        shirtNumber: 41, 
        height: 188, 
        weight: 82,
        foot: 'RIGHT',
        nationality: 'England',
        teamId: arsenalFirstTeam.id,
      },
      // Manchester City Players
      { 
        email: 'erling.haaland@mancity.com', 
        position: 'FORWARD', 
        shirtNumber: 9, 
        height: 194, 
        weight: 88,
        foot: 'LEFT',
        nationality: 'Norway',
        teamId: cityFirstTeam.id,
      },
      { 
        email: 'jack.grealish@mancity.com', 
        position: 'FORWARD', 
        shirtNumber: 10, 
        height: 175, 
        weight: 70,
        foot: 'RIGHT',
        nationality: 'England',
        teamId: cityFirstTeam.id,
      },
      { 
        email: 'phil.foden@mancity.com', 
        position: 'MIDFIELDER', 
        shirtNumber: 47, 
        height: 171, 
        weight: 69,
        foot: 'LEFT',
        nationality: 'England',
        teamId: cityFirstTeam.id,
      },
      { 
        email: 'rodri@mancity.com', 
        position: 'MIDFIELDER', 
        shirtNumber: 16, 
        height: 191, 
        weight: 84,
        foot: 'RIGHT',
        nationality: 'Spain',
        teamId: cityFirstTeam.id,
      },
      // Liverpool Players
      { 
        email: 'mohammed.salah@liverpool.com', 
        position: 'FORWARD', 
        shirtNumber: 11, 
        height: 175, 
        weight: 71,
        foot: 'LEFT',
        nationality: 'Egypt',
        teamId: liverpoolFirstTeam.id,
      },
      { 
        email: 'luis.diaz@liverpool.com', 
        position: 'FORWARD', 
        shirtNumber: 7, 
        height: 178, 
        weight: 67,
        foot: 'RIGHT',
        nationality: 'Colombia',
        teamId: liverpoolFirstTeam.id,
      },
      { 
        email: 'darwin.nunez@liverpool.com', 
        position: 'FORWARD', 
        shirtNumber: 9, 
        height: 187, 
        weight: 81,
        foot: 'RIGHT',
        nationality: 'Uruguay',
        teamId: liverpoolFirstTeam.id,
      },
    ];

    let playerProfileCount = 0;
    for (const playerData of playerProfiles) {
      const user = await prisma.user.findUnique({
        where: { email: playerData.email },
      });

      if (user) {
        const existingProfile = await prisma.player.findUnique({
          where: { userId: user.id },
        });

        if (!existingProfile) {
          // Create player profile
          const player = await prisma.player.create({
            data: {
              userId: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              dateOfBirth: user.dateOfBirth || new Date('2000-01-01'),
              nationality: playerData.nationality,
              position: playerData.position,
              preferredFoot: playerData.foot,
              shirtNumber: playerData.shirtNumber,
              height: playerData.height,
              weight: playerData.weight,
            },
          });

          // Link player to team via TeamPlayer join table
          await prisma.teamPlayer.create({
            data: {
              teamId: playerData.teamId,
              playerId: player.id,
              isCaptain: false,
            },
          });

          playerProfileCount++;
        }
      }
    }

    console.log(`✓ ${playerProfileCount} player profiles created\n`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('✅ Database seeding completed!\n');
    console.log('📋 Created:');
    console.log(`   • 3 Clubs (Arsenal, Man City, Liverpool)`);
    console.log(`   • 6 Teams (First Teams + U21s)`);
    console.log(`   • ${coachProfileCount} Coach Profiles`);
    console.log(`   • ${playerProfileCount} Player Profiles`);
    console.log('\n🧪 Test Logins:\n');
    console.log('Coach: mikel.arteta@arsenal.com / Coach123456!');
    console.log('       (Manages: Arsenal First Team, Arsenal U21)');
    console.log('\nPlayer: bukayo.saka@arsenal.com / Player123456!');
    console.log('        (Plays for: Arsenal First Team)');
    console.log('\n🎯 Team Filter Dropdown should now work for coaches!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
