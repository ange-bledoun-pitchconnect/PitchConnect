'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Upload,
  Play,
  Trash2,
  Loader2,
  Video,
  Clock,
  User,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface VideoClip {
  id: string;
  title: string;
  url: string;
  duration: number;
  uploadedAt: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
  match?: {
    date: string;
  };
}

export default function VideoLibraryPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [videos, setVideos] = useState<VideoClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/videos`
      );

      if (!response.ok) throw new Error('Failed to fetch videos');

      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !title.trim()) {
      toast.error('Please select a file and enter a title');
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/videos`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to upload video');

      const newVideo = await response.json();
      setVideos([newVideo, ...videos]);
      setSelectedFile(null);
      setTitle('');
      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/videos/${videoId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete video');

      setVideos(videos.filter((v) => v.id !== videoId));
      toast.success('Video deleted');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/10 to-pink-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/10 to-pink-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                Video Library
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Match highlights and training videos
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Upload Video</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Match Highlights"
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Video File
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white"
                  />
                  {selectedFile && (
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white font-bold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Video Grid */}
          <div className="lg:col-span-2">
            {videos.length === 0 ? (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <Video className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    No videos yet. Upload your first video!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <Card
                    key={video.id}
                    className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 overflow-hidden hover:shadow-lg dark:hover:shadow-charcoal-900/30 transition-shadow"
                  >
                    <div className="relative bg-charcoal-900 aspect-video flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-50" />
                      <video
                        src={video.url}
                        className="w-full h-full object-cover opacity-0"
                      />
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-bold text-charcoal-900 dark:text-white mb-2">
                        {video.title}
                      </h3>
                      <div className="space-y-2 text-xs text-charcoal-600 dark:text-charcoal-400 mb-4">
                        <p className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </p>
                        <p className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {video.uploadedBy.firstName} {video.uploadedBy.lastName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Watch
                        </a>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
