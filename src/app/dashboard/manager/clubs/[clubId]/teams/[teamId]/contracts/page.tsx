// =============================================================================
// 🏆 PITCHCONNECT - CONTRACT MANAGEMENT v3.0 (Enterprise Edition)
// =============================================================================
// Path: src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/contracts/page.tsx
// Purpose: Player contract management with club-configurable access
//
// FEATURES:
// ✅ Server-side rendering with auth check
// ✅ Club-configurable contract feature (based on teamType)
// ✅ Contract types from schema
// ✅ Position-based contracts (sport-specific)
// ✅ Salary and bonus tracking
// ✅ Contract expiration alerts
// ✅ Multi-currency support
// ✅ Schema-aligned with Contract model
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import ContractsClient from './ContractsClient';
import { SPORT_POSITIONS } from '../analytics/page';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type Position = string;

type TeamType = 
  | 'PROFESSIONAL' | 'SEMI_PROFESSIONAL' | 'AMATEUR' 
  | 'ACADEMY' | 'YOUTH' | 'RECREATIONAL' | 'UNIVERSITY' | 'SCHOOL';

interface ContractData {
  id: string;
  playerId: string;
  playerName: string;
  position: Position;
  salary: number | null;
  currency: string;
  bonusStructure: Record<string, any> | null;
  performanceBonus: number | null;
  signOnBonus: number | null;
  appearanceFee: number | null;
  goalBonus: number | null;
  startDate: Date;
  endDate: Date | null;
  contractType: string;
  status: string;
  extensionOption: boolean;
  buyoutClause: number | null;
  releaseClause: number | null;
  agentName: string | null;
  createdAt: Date;
}

interface PlayerOption {
  id: string;
  name: string;
  position: Position | null;
  jerseyNumber: number | null;
  hasContract: boolean;
}

interface TeamData {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  sport: Sport;
  teamType: TeamType;
  contractsEnabled: boolean;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// Teams that can use contract management
const CONTRACT_ENABLED_TEAM_TYPES: TeamType[] = [
  'PROFESSIONAL',
  'SEMI_PROFESSIONAL',
  'ACADEMY',
];

// Contract types
export const CONTRACT_TYPES = [
  { value: 'PROFESSIONAL', label: 'Professional', description: 'Full-time paid contract' },
  { value: 'SEMI_PROFESSIONAL', label: 'Semi-Professional', description: 'Part-time paid contract' },
  { value: 'AMATEUR', label: 'Amateur', description: 'Unpaid registration' },
  { value: 'YOUTH', label: 'Youth/Academy', description: 'Youth development contract' },
  { value: 'LOAN', label: 'Loan', description: 'Temporary loan from another club' },
  { value: 'TRIAL', label: 'Trial', description: 'Trial period agreement' },
];

// Contract statuses
export const CONTRACT_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'PENDING', label: 'Pending Signature', color: 'amber' },
  { value: 'EXPIRED', label: 'Expired', color: 'red' },
  { value: 'TERMINATED', label: 'Terminated', color: 'gray' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'orange' },
];

// Supported currencies
export const CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getContractsData(
  clubId: string,
  teamId: string,
  userId: string
): Promise<{
  team: TeamData;
  contracts: ContractData[];
  players: PlayerOption[];
  canManage: boolean;
} | null> {
  // Verify user has access to this club
  const club = await prisma.club.findFirst({
    where: {
      id: clubId,
      deletedAt: null,
      OR: [
        { managerId: userId },
        { ownerId: userId },
        { members: { some: { userId, isActive: true, role: { in: ['OWNER', 'MANAGER', 'TREASURER'] } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      sport: true,
      teamType: true,
      managerId: true,
      ownerId: true,
    },
  });

  if (!club) return null;

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      clubId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!team) return null;

  // Check if contracts are enabled for this club type
  const contractsEnabled = CONTRACT_ENABLED_TEAM_TYPES.includes(club.teamType as TeamType);

  // Can manage if owner/manager
  const canManage = club.managerId === userId || club.ownerId === userId;

  // Get contracts for players in this team
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId,
      isActive: true,
    },
    include: {
      player: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          contracts: {
            where: { clubId },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  const contracts: ContractData[] = [];
  const players: PlayerOption[] = [];

  teamPlayers.forEach(tp => {
    const contract = tp.player.contracts[0];
    const playerName = `${tp.player.user.firstName} ${tp.player.user.lastName}`;

    players.push({
      id: tp.player.id,
      name: playerName,
      position: tp.position,
      jerseyNumber: tp.jerseyNumber,
      hasContract: !!contract,
    });

    if (contract) {
      contracts.push({
        id: contract.id,
        playerId: tp.player.id,
        playerName,
        position: contract.position,
        salary: contract.salary,
        currency: contract.currency,
        bonusStructure: contract.bonusStructure as Record<string, any> | null,
        performanceBonus: contract.performanceBonus,
        signOnBonus: contract.signOnBonus,
        appearanceFee: contract.appearanceFee,
        goalBonus: contract.goalBonus,
        startDate: contract.startDate,
        endDate: contract.endDate,
        contractType: contract.contractType,
        status: contract.status,
        extensionOption: contract.extensionOption,
        buyoutClause: contract.buyoutClause,
        releaseClause: contract.releaseClause,
        agentName: contract.agentName,
        createdAt: contract.createdAt,
      });
    }
  });

  // Sort contracts by expiry (soonest first)
  contracts.sort((a, b) => {
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  });

  return {
    team: {
      id: team.id,
      name: team.name,
      clubId: club.id,
      clubName: club.name,
      sport: club.sport as Sport,
      teamType: club.teamType as TeamType,
      contractsEnabled,
    },
    contracts,
    players,
    canManage,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

interface PageProps {
  params: Promise<{ clubId: string; teamId: string }>;
}

export default async function ContractsPage({ params }: PageProps) {
  const { clubId, teamId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const data = await getContractsData(clubId, teamId, session.user.id);

  if (!data) {
    notFound();
  }

  // Get sport-specific positions
  const sportPositions = SPORT_POSITIONS[data.team.sport] || [];

  return (
    <ContractsClient
      team={data.team}
      contracts={data.contracts}
      players={data.players}
      canManage={data.canManage}
      contractTypes={CONTRACT_TYPES}
      contractStatuses={CONTRACT_STATUSES}
      currencies={CURRENCIES}
      sportPositions={sportPositions}
    />
  );
}