'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Share2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  videoId: string;
  hlsUrl?: string;
  dashUrl?: string;
  fallbackUrls?: {
    '480p'?: string;
    '720p'?: string;
    '1080p'?: string;
    '4k'?: string;
  };
  title: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  onAnalyticEvent?: (event: string, data: any) => void;
  captionTracks?: Array<{ language: string; url: string }>;
  chapters?: Array<{ title: string; startTime: number; endTime: number }>;
}

export default function VideoPlayer({
  videoId,
  hlsUrl,
  dashUrl,
  fallbackUrls,
  title,
  thumbnailUrl,
  posterUrl,
  onAnalyticEvent,
  captionTracks,
  chapters,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('adaptive');
  const [showControls, setShowControls] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize HLS.js or DASH.js
  useEffect(() => {
    if (!videoRef.current || !hlsUrl) return;

    // Use HLS.js for adaptive streaming
    if (hlsUrl.includes('.m3u8')) {
      import('hls.js').then((HLS) => {
        if (!HLS.default.isSupported()) {
          // Fallback to native HLS (Safari)
          videoRef.current!.src = hlsUrl;
          return;
        }

        const hls = new HLS.default({
          debug: false,
          autoStartLoad: true,
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current!);

        hls.on(HLS.default.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play();
        });

        hls.on(HLS.default.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            console.error('HLS fatal error:', data);
            toast.error('Video playback error');
          }
        });

        return () => {
          hls.destroy();
        };
      });
    }
  }, [hlsUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      onAnalyticEvent?.(isPlaying ? 'PAUSE' : 'PLAY', { timestamp: currentTime });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    onAnalyticEvent?.('SEEK', { fromTime: currentTime, toTime: newTime });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;

    try {
      if (!isFullscreen) {
        await playerRef.current.requestFullscreen?.() ||
          (playerRef.current as any).webkitRequestFullscreen?.() ||
          (playerRef.current as any).mozRequestFullScreen?.() ||
          (playerRef.current as any).msRequestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    onAnalyticEvent?.('QUALITY_CHANGE', { quality });

    if (quality === 'adaptive') {
      videoRef.current!.src = hlsUrl || '';
    } else {
      videoRef.current!.src = fallbackUrls?.[quality as keyof typeof fallbackUrls] || '';
    }
  };

  const handleDownload = async () => {
    try {
      const quality = selectedQuality === 'adaptive' ? '720p' : selectedQuality;
      const downloadUrl = fallbackUrls?.[quality as keyof typeof fallbackUrls];

      if (!downloadUrl) {
        toast.error('Download not available for this quality');
        return;
      }

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onAnalyticEvent?.('DOWNLOAD', { quality });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Watch "${title}" on PitchConnect`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Video link copied to clipboard');
      }
      onAnalyticEvent?.('SHARE', {});
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={playerRef}
      className="relative bg-black w-full aspect-video rounded-lg overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={posterUrl || thumbnailUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onProgress={(e) => {
          const buffered = e.currentTarget.buffered;
          if (buffered.length > 0) {
            setBufferedPercent((buffered.end(0) / duration) * 100);
          }
        }}
        controlsList="nodownload"
      >
        {captionTracks?.map((track) => (
          <track key={track.language} kind="subtitles" src={track.url} srcLang={track.language} label={track.language} />
        ))}
      </video>

      {/* Controls - Always visible on mobile, fade on desktop */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        } group-hover:opacity-100`}
      >
        {/* Progress Bar */}
        <div className="mb-3 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleTimeUpdate}
            className="flex-1 h-1 cursor-pointer accent-blue-600 rounded"
          />
        </div>

        {/* Buffering indicator */}
        <div className="mb-2 h-0.5 bg-gray-800 rounded">
          <div className="h-full bg-gray-500" style={{ width: `${bufferedPercent}%` }} />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="hover:bg-white hover:bg-opacity-20"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="hover:bg-white hover:bg-opacity-20"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 cursor-pointer accent-blue-600"
              />
            </div>

            {/* Time Display */}
            <span className="text-sm font-medium ml-2 min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setPlaybackRate(rate);
                if (videoRef.current) videoRef.current.playbackRate = rate;
                onAnalyticEvent?.('PLAYBACK_RATE_CHANGE', { rate });
              }}
              className="bg-transparent text-white text-sm rounded px-2 py-1 border border-gray-600 hover:border-gray-400"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>

            {/* Quality Selector */}
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 hover:bg-white hover:bg-opacity-20"
              >
                {selectedQuality === 'adaptive' ? 'AUTO' : selectedQuality.toUpperCase()}
                <ChevronDown size={16} />
              </Button>

              <div className="absolute bottom-full right-0 hidden group-hover:block bg-black border border-gray-600 rounded shadow-lg p-2 mb-2 min-w-[120px]">
                <button
                  onClick={() => handleQualityChange('adaptive')}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm"
                >
                  Adaptive
                </button>
                {fallbackUrls?.['480p'] && (
                  <button
                    onClick={() => handleQualityChange('480p')}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm"
                  >
                    480p
                  </button>
                )}
                {fallbackUrls?.['720p'] && (
                  <button
                    onClick={() => handleQualityChange('720p')}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm"
                  >
                    720p
                  </button>
                )}
                {fallbackUrls?.['1080p'] && (
                  <button
                    onClick={() => handleQualityChange('1080p')}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm"
                  >
                    1080p
                  </button>
                )}
                {fallbackUrls?.['4k'] && (
                  <button
                    onClick={() => handleQualityChange('4k')}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm"
                  >
                    4K
                  </button>
                )}
              </div>
            </div>

            {/* Download */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="hover:bg-white hover:bg-opacity-20"
              title="Download"
            >
              <Download size={20} />
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="hover:bg-white hover:bg-opacity-20"
              title="Share"
            >
              <Share2 size={20} />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="hover:bg-white hover:bg-opacity-20"
              title="Fullscreen"
            >
              <Maximize size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
