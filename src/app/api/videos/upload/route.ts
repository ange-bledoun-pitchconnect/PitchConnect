import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { processVideoWithMux } from '@/lib/video/mux-processor';

/**
 * POST /api/videos/upload
 * Upload and initiate video processing
 * Handles multipart/form-data with video file
 * 
 * Form Data:
 * - file: File (required)
 * - title: string (required)
 * - description: string (optional)
 * - teamId: string (optional)
 * - matchId: string (optional)
 * - type: string (optional - TRAINING, MATCH_HIGHLIGHTS, TACTICS, INJURY_REVIEW, etc.)
 * - makePublic: boolean (optional - default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const teamId = formData.get('teamId') as string;
    const matchId = formData.get('matchId') as string;
    const type = formData.get('type') as string || 'TRAINING';
    const makePublic = formData.get('makePublic') === 'true';

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '5000') * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${process.env.MAX_UPLOAD_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    // Supported video formats
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported video format. Supported: MP4, MOV, AVI, WebM, MPEG' },
        { status: 400 }
      );
    }

    // Save file to temporary storage
    const tempDir = process.env.TEMP_VIDEO_STORAGE || '/tmp/videos';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileId = uuidv4();
    const fileName = `${fileId}-${file.name}`;
    const tempPath = path.join(tempDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    logger.info('Video file saved to temporary storage', {
      fileId,
      fileName,
      size: file.size,
      type: file.type,
    });

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        title,
        description,
        url: tempPath, // Temporary local path
        type,
        videoType: 'UPLOADED',
        duration: 0,
        teamId: teamId || null,
        matchId: matchId || null,
        createdBy: user.id,
      },
    });

    // Create video stream record (pending processing)
    const videoStream = await prisma.videoStream.create({
      data: {
        videoId: video.id,
        provider: (process.env.VIDEO_STORAGE_PROVIDER || 'MUX') as any,
        transcodeStatus: 'PENDING',
        isPublic: makePublic,
      },
    });

    // Initiate processing based on provider
    const provider = process.env.VIDEO_STORAGE_PROVIDER || 'MUX';

    try {
      if (provider === 'MUX') {
        await processVideoWithMux(video.id, videoStream.id, tempPath);
      } else if (provider === 'AWS') {
        // Implement AWS processing
        // await processVideoWithAWS(video.id, videoStream.id, tempPath);
      } else if (provider === 'BUNNY') {
        // Implement Bunny CDN processing
        // await processVideoWithBunny(video.id, videoStream.id, tempPath);
      }
    } catch (processingError) {
      logger.error('Video processing initiation failed', {
        videoId: video.id,
        error: processingError,
      });

      await prisma.videoStream.update({
        where: { id: videoStream.id },
        data: {
          transcodeStatus: 'FAILED',
          failureReason: processingError instanceof Error ? processingError.message : 'Unknown error',
        },
      });
    }

    logger.info('Video upload initiated', {
      videoId: video.id,
      streamId: videoStream.id,
      provider,
    });

    return NextResponse.json(
      {
        success: true,
        video: {
          id: video.id,
          title: video.title,
          type: video.type,
          createdAt: video.createdAt.toISOString(),
        },
        stream: {
          id: videoStream.id,
          status: videoStream.transcodeStatus,
          provider: videoStream.provider,
        },
        message: 'Video upload initiated. Processing will begin shortly.',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('POST /api/videos/upload error', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5gb',
    },
  },
};
