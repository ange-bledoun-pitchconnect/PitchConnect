'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  MessageSquare,
  Trash2,
  Calendar,
  User,
  Bell,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface Team {
  id: string;
  name: string;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teamRes, announcementsRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/announcements`),
      ]);

      if (!teamRes.ok) throw new Error('Failed to fetch team');
      if (!announcementsRes.ok) throw new Error('Failed to fetch announcements');

      const [teamData, announcementsData] = await Promise.all([
        teamRes.json(),
        announcementsRes.json(),
      ]);

      setTeam(teamData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      setIsCreating(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/announcements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        }
      );

      if (!response.ok) throw new Error('Failed to create announcement');

      const newAnnouncement = await response.json();
      setAnnouncements([newAnnouncement, ...announcements]);
      setTitle('');
      setContent('');
      toast.success('Announcement posted successfully!');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/announcements/${announcementId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete announcement');

      setAnnouncements(announcements.filter((a) => a.id !== announcementId));
      toast.success('Announcement deleted');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-teal-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-teal-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
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
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                Team Announcements
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Communicate with your {team?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Create Announcement */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 mb-8">
          <CardHeader>
            <CardTitle className="text-charcoal-900 dark:text-white">New Announcement</CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Post an update to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Match Schedule Updated"
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Message
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement here..."
                  rows={5}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-700 transition-all"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setContent('');
                  }}
                  className="px-6 py-2 border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors"
                >
                  Clear
                </button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-600 hover:to-cyan-500 text-white font-bold"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Announcement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardContent className="pt-12 pb-12 text-center">
                <MessageSquare className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  No announcements yet. Post one to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card
                key={announcement.id}
                className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 hover:shadow-lg dark:hover:shadow-charcoal-900/30 transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">
                        {announcement.title}
                      </h3>
                      <p className="text-charcoal-700 dark:text-charcoal-300 mb-4 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-charcoal-600 dark:text-charcoal-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {announcement.creator.firstName} {announcement.creator.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(announcement.createdAt).toLocaleDateString()} at{' '}
                          {new Date(announcement.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
