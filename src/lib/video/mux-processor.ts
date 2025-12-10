import Mux from '@mux/mux-node';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import fs from 'fs';

const mux = new Mux({
  accessTokenId: process.env.MUX_API_KEY,
  secretKey: process.env.MUX_API_SECRET,
});

/**
 * Process video with Mux
 * Uploads to Mux, creates asset, and monitors transcoding
 */
export async function processVideoWithMux(
  videoId: string,
  streamId: string,
  filePath: string
) {
  try {
    // Read file
    const fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    logger.info('Uploading video to Mux', { videoId, streamId, fileSize });

    // Create Mux asset with direct upload
    const asset = await mux.video.assets.create({
      input: {
        url: `file://${filePath}`, // Local file
      },
      playback_policy: ['public'],
      encoding_tier: 'standard',
    } as any);

    logger.info('Mux asset created', {
      videoId,
      assetId: asset.id,
      playbackId: asset.playback_ids?.?.id,
    });

    // Update video stream with provider details
    await prisma.videoStream.update({
      where: { id: streamId },
      data: {
        providerAssetId: asset.id,
        providerPlaybackId: asset.playback_ids?.?.id,
        transcodeStatus: 'IN_PROGRESS',
        duration: 0,
      },
    });

    // Set up webhook monitoring (Mux will notify when processing completes)
    // This happens via webhook at /api/webhooks/video

    return { assetId: asset.id, playbackId: asset.playback_ids?.?.id };
  } catch (error) {
    logger.error('Mux video processing failed', {
      videoId,
      error,
    });

    // Update status to failed
    await prisma.videoStream.update({
      where: { id: streamId },
      data: {
        transcodeStatus: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

/**
 * Handle Mux webhook for transcoding completion
 */
export async function handleMuxWebhook(payload: any) {
  const event = payload.type;
  const assetId = payload.data.id;

  logger.info('Mux webhook received', { event, assetId });

  try {
    // Find video stream by provider asset ID
    const videoStream = await prisma.videoStream.findUnique({
      where: { providerAssetId: assetId },
      include: { video: true },
    });

    if (!videoStream) {
      logger.warn('Video stream not found for Mux asset', { assetId });
      return;
    }

    if (event === 'video.asset.ready') {
      // Get asset details
      const asset = await mux.video.assets.retrieve(assetId) as any;

      logger.info('Mux asset ready', { assetId, asset });

      // Extract playback URLs
      const hlsPlaylistUrl = `https://image.mux.com/${asset.playback_ids.id}/playlist.m3u8`;
      const dashManifestUrl = `https://image.mux.com/${asset.playback_ids.id}/manifest.mpd`;

      // Update video stream with stream URLs
      await prisma.videoStream.update({
        where: { id: videoStream.id },
        data: {
          transcodeStatus: 'COMPLETED',
          hlsPlaylistUrl,
          dashManifestUrl,
          duration: Math.round(asset.duration || 0),
          width: asset.max_resolution_tier?.width,
          height: asset.max_resolution_tier?.height,
          aspectRatio: `${asset.max_resolution_tier?.width}:${asset.max_resolution_tier?.height}`,
          fps: 30,
          // Create thumbnail URL from Mux
          thumbnailUrl: `https://image.mux.com/${asset.playback_ids.id}/thumbnail.jpg`,
          thumbnailSmall: `https://image.mux.com/${asset.playback_ids.id}/thumbnail.jpg?width=200`,
          posterUrl: `https://image.mux.com/${asset.playback_ids.id}/thumbnail.jpg?width=1280&fit=crop`,
          completedAt: new Date(),
        },
      });

      // Update video record
      await prisma.video.update({
        where: { id: videoStream.videoId },
        data: {
          duration: Math.round(asset.duration || 0),
        },
      });

      logger.info('Video stream processing completed', {
        videoId: videoStream.videoId,
        streamId: videoStream.id,
      });
    } else if (event === 'video.asset.errored') {
      await prisma.videoStream.update({
        where: { id: videoStream.id },
        data: {
          transcodeStatus: 'FAILED',
          failureReason: payload.data.errors?.?.messages?. || 'Mux transcoding failed',
        },
      });

      logger.error('Mux asset transcoding failed', {
        assetId,
        error: payload.data.errors,
      });
    }
  } catch (error) {
    logger.error('Error handling Mux webhook', { error });
  }
}
