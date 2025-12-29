// =============================================================================
// 🏆 PITCHCONNECT - TEAM ANNOUNCEMENTS v3.0 (Enterprise Edition)
// =============================================================================
// Path: src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/announcements/page.tsx
// Purpose: Team communication with priority, type, visibility, scheduling
//
// FEATURES:
// ✅ Server-side rendering with auth check
// ✅ Priority levels (LOW, NORMAL, HIGH, URGENT) from schema
// ✅ Status management (DRAFT, SCHEDULED, PUBLISHED, ARCHIVED)
// ✅ Visibility control (team-only vs public)
// ✅ Scheduled publishing
// ✅ Target roles (specific team roles)
// ✅ Schema-aligned with Announcement model
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import AnnouncementsClient from './AnnouncementsClient';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
type ClubMemberRole = 
  | 'OWNER' | 'MANAGER' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'PLAYER' 
  | 'STAFF' | 'TREASURER' | 'SCOUT' | 'ANALYST' | 'MEDICAL_STAFF'
  | 'PHYSIOTHERAPIST' | 'NUTRITIONIST' | 'PSYCHOLOGIST' | 'PERFORMANCE_COACH'
  | 'GOALKEEPING_COACH' | 'KIT_MANAGER' | 'MEDIA_OFFICER';

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publishAt: Date | null;
  expiresAt: Date | null;
  targetRoles: ClubMemberRole[];
  targetTeamIds: string[];
  isPublic: boolean;
  attachments: string[];
  imageUrl: string | null;
  viewCount: number;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface TeamData {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

export const PRIORITY_CONFIG: Record<AnnouncementPriority, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  LOW: {
    label: 'Low',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700',
    icon: '📝',
  },
  NORMAL: {
    label: 'Normal',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '📢',
  },
  HIGH: {
    label: 'High',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: '⚠️',
  },
  URGENT: {
    label: 'Urgent',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '🚨',
  },
};

export const STATUS_CONFIG: Record<AnnouncementStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700',
  },
  SCHEDULED: {
    label: 'Scheduled',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  PUBLISHED: {
    label: 'Published',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
};

export const TARGET_ROLES: { value: ClubMemberRole; label: string; category: string }[] = [
  { value: 'OWNER', label: 'Owner', category: 'Management' },
  { value: 'MANAGER', label: 'Manager', category: 'Management' },
  { value: 'HEAD_COACH', label: 'Head Coach', category: 'Coaching' },
  { value: 'ASSISTANT_COACH', label: 'Assistant Coach', category: 'Coaching' },
  { value: 'GOALKEEPING_COACH', label: 'Goalkeeping Coach', category: 'Coaching' },
  { value: 'PERFORMANCE_COACH', label: 'Performance Coach', category: 'Coaching' },
  { value: 'PLAYER', label: 'Player', category: 'Players' },
  { value: 'MEDICAL_STAFF', label: 'Medical Staff', category: 'Medical' },
  { value: 'PHYSIOTHERAPIST', label: 'Physiotherapist', category: 'Medical' },
  { value: 'NUTRITIONIST', label: 'Nutritionist', category: 'Medical' },
  { value: 'PSYCHOLOGIST', label: 'Psychologist', category: 'Medical' },
  { value: 'ANALYST', label: 'Analyst', category: 'Support' },
  { value: 'SCOUT', label: 'Scout', category: 'Support' },
  { value: 'STAFF', label: 'General Staff', category: 'Support' },
  { value: 'TREASURER', label: 'Treasurer', category: 'Admin' },
  { value: 'KIT_MANAGER', label: 'Kit Manager', category: 'Admin' },
  { value: 'MEDIA_OFFICER', label: 'Media Officer', category: 'Admin' },
];

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getAnnouncementsData(
  clubId: string,
  teamId: string,
  userId: string
): Promise<{
  team: TeamData;
  announcements: AnnouncementData[];
  canCreate: boolean;
} | null> {
  // Verify user has access to this club
  const club = await prisma.club.findFirst({
    where: {
      id: clubId,
      deletedAt: null,
      OR: [
        { managerId: userId },
        { ownerId: userId },
        { members: { some: { userId, isActive: true } } },
      ],
    },
    select: {
      id: true,
      name: true,
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

  // Check if user can create announcements (manager, owner, or staff with permissions)
  const canCreate = club.managerId === userId || club.ownerId === userId;

  // Get announcements for this club (filtered to team in client if needed)
  const announcements = await prisma.announcement.findMany({
    where: {
      clubId,
      OR: [
        { targetTeamIds: { has: teamId } },
        { targetTeamIds: { isEmpty: true } }, // Club-wide announcements
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return {
    team: {
      id: team.id,
      name: team.name,
      clubId: club.id,
      clubName: club.name,
    },
    announcements: announcements.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      excerpt: a.excerpt,
      priority: a.priority as AnnouncementPriority,
      status: a.status as AnnouncementStatus,
      publishAt: a.publishAt,
      expiresAt: a.expiresAt,
      targetRoles: a.targetRoles as ClubMemberRole[],
      targetTeamIds: a.targetTeamIds,
      isPublic: a.isPublic,
      attachments: a.attachments,
      imageUrl: a.imageUrl,
      viewCount: a.viewCount,
      author: a.author,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
    canCreate,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

interface PageProps {
  params: Promise<{ clubId: string; teamId: string }>;
}

export default async function TeamAnnouncementsPage({ params }: PageProps) {
  const { clubId, teamId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const data = await getAnnouncementsData(clubId, teamId, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <AnnouncementsClient
      team={data.team}
      announcements={data.announcements}
      canCreate={data.canCreate}
      priorityConfig={PRIORITY_CONFIG}
      statusConfig={STATUS_CONFIG}
      targetRoles={TARGET_ROLES}
      currentUserId={session.user.id}
    />
  );
}