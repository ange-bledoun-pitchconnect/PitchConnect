import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/videos/[videoId]/stream
 * Get video stream details including HLS/DASH URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();

    const video = await prisma.video.findUnique({
      where: { id: params.videoId },
      include: {
        videoStream: true,
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Authorization check (if private)
    if (!video.videoStream?.isPublic && !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log access
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (user && video.videoStream) {
        await prisma.videoAccessLog.create({
          data: {
            videoStreamId: video.videoStream.id,
            userId: user.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent'),
          },
        });
      }
    }

    const response = {
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        type: video.type,
        duration: video.videoStream?.duration,
        createdAt: video.createdAt.toISOString(),
      },
      stream: video.videoStream
        ? {
            id: video.videoStream.id,
            status: video.videoStream.transcodeStatus,
            provider: video.videoStream.provider,
            // HLS & DASH URLs (for adaptive streaming)
            hlsPlaylistUrl: video.videoStream.hlsPlaylistUrl,
            dashManifestUrl: video.videoStream.dashManifestUrl,
            // Direct quality URLs (for progressive download)
            urls: {
              '480p': video.videoStream.url480p,
              '720p': video.videoStream.url720p,
              '1080p': video.videoStream.url1080p,
              '4k': video.videoStream.url4k,
            },
            // Metadata
            width: video.videoStream.width,
            height: video.videoStream.height,
            fps: video.videoStream.fps,
            bitrate: video.videoStream.bitrate,
            // Thumbnails
            thumbnailUrl: video.videoStream.thumbnailUrl,
            posterUrl: video.videoStream.posterUrl,
            // Captions
            hasCaptions: video.videoStream.hasCaptions,
            captionTracks: video.videoStream.captionTracks,
            // Security
            isPublic: video.videoStream.isPublic,
            requiresAuth: video.videoStream.requiresAuth,
            expiresAt: video.videoStream.expiresAt?.toISOString(),
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('GET /api/videos/[videoId]/stream error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch video stream',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
