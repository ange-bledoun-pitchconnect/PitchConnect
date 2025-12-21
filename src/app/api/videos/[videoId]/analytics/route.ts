import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/videos/[videoId]/analytics
 * Get video engagement and streaming analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const video = await prisma.video.findUnique({
      where: { id: params.videoId },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if user can view analytics (creator or team admin)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (video.createdBy !== user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const videoStream = await prisma.videoStream.findUnique({
      where: { videoId: params.videoId },
    });

    if (!videoStream) {
      return NextResponse.json(
        { error: 'Video stream not found' },
        { status: 404 }
      );
    }

    // Get access logs
    const accessLogs = await prisma.videoAccessLog.findMany({
      where: { videoStreamId: videoStream.id },
      take: 100,
    });

    // Calculate analytics
    const totalViews = accessLogs.length;
    const totalPlayTime = accessLogs.reduce((sum, log) => sum + (log.playbackDuration || 0), 0);
    const averagePlayTime = totalViews > 0 ? totalPlayTime / totalViews : 0;

    // Device breakdown
    const deviceBreakdown = accessLogs.reduce((acc: any, log) => {
      const device = log.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // Geographic breakdown
    const geoBreakdown = accessLogs.reduce((acc: any, log) => {
      const country = log.countryCode || 'unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    // Get interactions
    const interactions = await prisma.videoInteraction.findMany({
      where: { videoId: params.videoId },
    });

    const likes = interactions.filter(i => i.likedAt).length;
    const bookmarks = interactions.filter(i => i.bookmarkedAt).length;
    const shares = interactions.filter(i => i.sharedAt).length;

    return NextResponse.json({
      success: true,
      analytics: {
        views: totalViews,
        totalPlayTimeMinutes: Math.round(totalPlayTime / 60),
        averagePlayTimeSeconds: Math.round(averagePlayTime),
        engagement: {
          likes,
          bookmarks,
          shares,
          comments: await prisma.videoComment.count({ where: { videoId: params.videoId } }),
        },
        deviceBreakdown,
        geoBreakdown,
        quality: {
          completion: videoStream.completionRate || 0,
          droppedFrames: videoStream.droppedFramePercent || 0,
        },
      },
      recentAccess: accessLogs.slice(-10).map(log => ({
        timestamp: log.createdAt.toISOString(),
        device: log.deviceType,
        duration: log.playbackDuration,
        country: log.countryCode,
      })),
    });
  } catch (error) {
    logger.error('GET /api/videos/[videoId]/analytics error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
