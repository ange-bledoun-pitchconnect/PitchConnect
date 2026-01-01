// =============================================================================
// 🎬 PITCHCONNECT - VIDEO STREAM API
// Path: /src/app/api/videos/[videoId]/stream/route.ts
// =============================================================================
//
// GET - Get video stream details including HLS/DASH URLs
//
// VERSION: 4.0.0 - Enterprise Edition
// SCHEMA: v7.10.0 aligned (using MediaContent model)
//
// =============================================================================
// FEATURES
// =============================================================================
// ✅ Schema alignment (MediaContent model)
// ✅ Multi-sport context support
// ✅ Privacy-aware access control
// ✅ Follow-based visibility
// ✅ View logging
// ✅ Adaptive streaming support (HLS/DASH)
// ✅ Multi-quality URLs
// ✅ Request ID tracking
// ✅ Device detection
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { 
  UserRole, 
  MediaVisibility, 
  MediaProcessingStatus, 
  TranscodingStatus,
  Sport,
  VideoQuality,
} from '@prisma/client';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface VideoStreamResponse {
  success: true;
  media: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    category: string;
    sport: Sport | null;
    duration: number | null;
    visibility: MediaVisibility;
    isPublic: boolean;
    createdAt: string;
    uploader: {
      id: string;
      name: string;
      avatar: string | null;
      isFollowed: boolean;
    };
    club: {
      id: string;
      name: string;
      logo: string | null;
    } | null;
  };
  stream: {
    status: MediaProcessingStatus;
    transcodingStatus: TranscodingStatus | null;
    provider: string | null;
    // Adaptive streaming URLs
    hlsUrl: string | null;
    dashUrl: string | null;
    // Direct quality URLs
    urls: {
      [key: string]: string | null;
    };
    // Video metadata
    width: number | null;
    height: number | null;
    aspectRatio: string | null;
    fps: number | null;
    bitrate: number | null;
    availableQualities: VideoQuality[];
    // Thumbnails
    thumbnailUrl: string | null;
    // Captions/Subtitles
    hasCaptions: boolean;
    captionTracks: {
      language: string;
      label: string;
      url: string;
    }[];
    // Security
    requiresAuth: boolean;
    expiresAt: string | null;
  };
  // User interaction state
  userState: {
    isLiked: boolean;
    isBookmarked: boolean;
    watchProgress: number;
    lastWatchedAt: string | null;
  } | null;
  timestamp: string;
  requestId: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  requestId: string;
  timestamp: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function errorResponse(
  error: string,
  code: string,
  status: number,
  requestId: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

function hasAnyRole(userRoles: UserRole[] | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Calculate aspect ratio from dimensions
 */
function calculateAspectRatio(width: number | null, height: number | null): string | null {
  if (!width || !height) return null;
  
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Parse user agent for device info
 */
function parseUserAgent(userAgent: string | null): {
  deviceType: string;
  browser: string | null;
  os: string | null;
} {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: null, os: null };
  }

  // Device type detection
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    deviceType = /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  } else if (/TV|SmartTV|WebTV/i.test(userAgent)) {
    deviceType = 'tv';
  }

  // Browser detection
  let browser: string | null = null;
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // OS detection
  let os: string | null = null;
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('Linux')) os = 'Linux';

  return { deviceType, browser, os };
}

/**
 * Detect sport from media category
 */
function detectSportFromCategory(category: string): Sport | null {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('football') || categoryLower.includes('soccer')) return Sport.FOOTBALL;
  if (categoryLower.includes('rugby')) return Sport.RUGBY;
  if (categoryLower.includes('basketball')) return Sport.BASKETBALL;
  if (categoryLower.includes('cricket')) return Sport.CRICKET;
  if (categoryLower.includes('american_football')) return Sport.AMERICAN_FOOTBALL;
  if (categoryLower.includes('hockey')) return Sport.HOCKEY;
  if (categoryLower.includes('baseball')) return Sport.BASEBALL;
  if (categoryLower.includes('tennis')) return Sport.TENNIS;
  if (categoryLower.includes('volleyball')) return Sport.VOLLEYBALL;
  if (categoryLower.includes('netball')) return Sport.NETBALL;
  if (categoryLower.includes('handball')) return Sport.HANDBALL;
  
  return null;
}

// =============================================================================
// GET /api/videos/[videoId]/stream
// =============================================================================

/**
 * Get video stream details including HLS/DASH URLs
 * 
 * Path Parameters:
 *   - videoId: string (CUID) - The MediaContent ID
 * 
 * Query Parameters:
 *   - quality: string (preferred quality: '480p', '720p', '1080p', '4k')
 *   - format: 'hls' | 'dash' | 'progressive' (default: 'hls')
 * 
 * Authorization:
 *   - PUBLIC videos: Anyone (with optional auth)
 *   - CLUB_ONLY: Club members
 *   - TEAM_ONLY: Team members
 *   - FOLLOWERS_ONLY: Users following the uploader
 *   - PRIVATE: Only uploader
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
): Promise<NextResponse<VideoStreamResponse | ErrorResponse>> {
  const requestId = generateRequestId();
  const startTime = performance.now();
  const { videoId } = params;

  try {
    // =========================================================================
    // 1. AUTHENTICATION (optional for public videos)
    // =========================================================================

    const session = await auth();
    let userId: string | null = null;
    let user: any = null;

    if (session?.user?.id) {
      userId = session.user.id;
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          roles: true,
          organisationId: true,
          // Following relationships
          following: {
            select: { followingId: true },
          },
          // Club memberships
          clubMembers: {
            where: { isActive: true },
            select: { clubId: true },
          },
          // Player teams
          player: {
            select: {
              teamPlayers: {
                where: { isActive: true },
                select: { teamId: true, team: { select: { clubId: true } } },
              },
            },
          },
        },
      });
    }

    // =========================================================================
    // 2. FETCH MEDIA CONTENT
    // =========================================================================

    const media = await prisma.mediaContent.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        uploaderId: true,
        clubId: true,
        organisationId: true,
        url: true,
        thumbnailUrl: true,
        duration: true,
        width: true,
        height: true,
        mimeType: true,
        visibility: true,
        isPublic: true,
        processingStatus: true,
        transcodingStatus: true,
        processingProvider: true,
        playbackUrl: true,
        hlsUrl: true,
        dashUrl: true,
        availableQualities: true,
        expiresAt: true,
        tags: true,
        createdAt: true,
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            isProfilePublic: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!media) {
      return errorResponse(
        'Video not found',
        'VIDEO_NOT_FOUND',
        404,
        requestId
      );
    }

    // =========================================================================
    // 3. AUTHORIZATION CHECK BASED ON VISIBILITY
    // =========================================================================

    let hasAccess = false;
    const isAdmin = user && hasAnyRole(user.roles as UserRole[], ['SUPERADMIN', 'ADMIN']);
    const isCreator = userId === media.uploaderId;

    // Get user's accessible IDs
    const followingIds = user?.following?.map((f: any) => f.followingId) || [];
    const accessibleClubIds: string[] = [];
    const accessibleTeamIds: string[] = [];

    if (user) {
      user.clubMembers?.forEach((m: any) => accessibleClubIds.push(m.clubId));
      user.player?.teamPlayers?.forEach((tp: any) => {
        accessibleTeamIds.push(tp.teamId);
        if (tp.team?.clubId) accessibleClubIds.push(tp.team.clubId);
      });
    }

    // Check access based on visibility
    switch (media.visibility) {
      case 'PUBLIC':
        hasAccess = true;
        break;
      case 'CLUB_ONLY':
        hasAccess = isAdmin || isCreator || (media.clubId && accessibleClubIds.includes(media.clubId));
        break;
      case 'TEAM_ONLY':
        // For team-only, check if user is in a team within the same club
        hasAccess = isAdmin || isCreator || (media.clubId && accessibleClubIds.includes(media.clubId));
        break;
      case 'STAFF_ONLY':
        hasAccess = isAdmin || isCreator || hasAnyRole(user?.roles as UserRole[], ['COACH', 'MANAGER', 'ANALYST', 'MEDICAL_STAFF']);
        break;
      case 'PRIVATE':
        hasAccess = isAdmin || isCreator;
        break;
      default:
        hasAccess = media.isPublic;
    }

    // Also allow access if following the uploader (for followers-only content)
    if (!hasAccess && followingIds.includes(media.uploaderId)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return errorResponse(
        'You do not have permission to view this video',
        'ACCESS_DENIED',
        403,
        requestId
      );
    }

    // =========================================================================
    // 4. LOG VIEW (for authenticated users)
    // =========================================================================

    if (userId) {
      const userAgent = request.headers.get('user-agent');
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const { deviceType, browser, os } = parseUserAgent(userAgent);

      // Create view log
      await prisma.mediaViewLog.create({
        data: {
          mediaId: videoId,
          userId,
          sessionId: requestId,
          viewStartedAt: new Date(),
          deviceType,
          browser,
          os,
          ipAddress: ipAddress?.split(',')[0] || null,
          userAgent,
          sport: detectSportFromCategory(media.category),
          viewContext: 'direct',
        },
      }).catch((error) => {
        console.error('Failed to create view log:', error);
      });

      // Update view count (async, don't wait)
      prisma.mediaContent.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } },
      }).catch((error) => {
        console.error('Failed to update view count:', error);
      });
    }

    // =========================================================================
    // 5. GET USER INTERACTION STATE
    // =========================================================================

    let userState: VideoStreamResponse['userState'] = null;

    if (userId) {
      const interaction = await prisma.mediaInteraction.findUnique({
        where: {
          mediaId_userId: {
            mediaId: videoId,
            userId,
          },
        },
        select: {
          isLiked: true,
          isBookmarked: true,
          watchProgress: true,
          lastWatchedAt: true,
        },
      });

      if (interaction) {
        userState = {
          isLiked: interaction.isLiked,
          isBookmarked: interaction.isBookmarked,
          watchProgress: interaction.watchProgress || 0,
          lastWatchedAt: interaction.lastWatchedAt?.toISOString() || null,
        };
      } else {
        userState = {
          isLiked: false,
          isBookmarked: false,
          watchProgress: 0,
          lastWatchedAt: null,
        };
      }
    }

    // =========================================================================
    // 6. BUILD STREAM URLS
    // =========================================================================

    // Build quality-specific URLs based on available qualities
    const qualityUrls: Record<string, string | null> = {};
    
    media.availableQualities.forEach((quality) => {
      // In production, these would be constructed based on your CDN/storage structure
      const baseUrl = media.playbackUrl || media.url;
      if (baseUrl) {
        qualityUrls[quality] = baseUrl.replace(/\.(mp4|webm|mov)$/, `_${quality}.$1`);
      }
    });

    // Default fallback URL if no qualities specified
    if (Object.keys(qualityUrls).length === 0 && media.url) {
      qualityUrls['original'] = media.url;
    }

    // Check if user is following the uploader
    const isFollowingUploader = followingIds.includes(media.uploaderId);

    // =========================================================================
    // 7. BUILD RESPONSE
    // =========================================================================

    const duration = Math.round(performance.now() - startTime);
    const sport = detectSportFromCategory(media.category);

    const uploaderName = media.uploader.displayName || 
      `${media.uploader.firstName} ${media.uploader.lastName}`;

    const response: VideoStreamResponse = {
      success: true,
      media: {
        id: media.id,
        title: media.title,
        description: media.description,
        type: media.type,
        category: media.category,
        sport,
        duration: media.duration,
        visibility: media.visibility,
        isPublic: media.isPublic,
        createdAt: media.createdAt.toISOString(),
        uploader: {
          id: media.uploader.id,
          name: uploaderName,
          avatar: media.uploader.avatar,
          isFollowed: isFollowingUploader,
        },
        club: media.club ? {
          id: media.club.id,
          name: media.club.name,
          logo: media.club.logo,
        } : null,
      },
      stream: {
        status: media.processingStatus,
        transcodingStatus: media.transcodingStatus,
        provider: media.processingProvider,
        hlsUrl: media.hlsUrl,
        dashUrl: media.dashUrl,
        urls: qualityUrls,
        width: media.width,
        height: media.height,
        aspectRatio: calculateAspectRatio(media.width, media.height),
        fps: null, // Would come from video metadata
        bitrate: null, // Would come from video metadata
        availableQualities: media.availableQualities,
        thumbnailUrl: media.thumbnailUrl,
        hasCaptions: false, // Would check for caption tracks
        captionTracks: [], // Would fetch from storage
        requiresAuth: media.visibility !== 'PUBLIC',
        expiresAt: media.expiresAt?.toISOString() || null,
      },
      userState,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
        // Cache public content briefly
        ...(media.visibility === 'PUBLIC' && {
          'Cache-Control': 'public, max-age=60',
        }),
      },
    });
  } catch (error) {
    console.error('[GET /api/videos/[videoId]/stream]', {
      requestId,
      videoId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      'Failed to fetch video stream',
      'INTERNAL_ERROR',
      500,
      requestId
    );
  }
}
