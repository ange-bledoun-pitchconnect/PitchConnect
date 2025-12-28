/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Media Manager Dashboard v2.0
 * Path: src/app/dashboard/media/page.tsx
 * ============================================================================
 * 
 * Features:
 * ✅ Content management
 * ✅ Photo/video galleries
 * ✅ Social media integration
 * ✅ News/announcements
 * ✅ Match highlights
 * ✅ Brand assets
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Camera, Video, Image, FileText, Share2, Globe, ArrowRight, Calendar,
  Eye, TrendingUp, Upload, Folder, Megaphone, Clock, BarChart3,
} from 'lucide-react';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getMediaDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: true,
      clubMemberships: {
        where: { isActive: true },
        include: { club: { select: { id: true, name: true, sport: true } } },
      },
    },
  });

  if (!user || user.clubMemberships.length === 0) {
    return { hasAssignment: false, stats: null };
  }

  return {
    hasAssignment: true,
    clubs: user.clubMemberships.map(cm => cm.club),
    stats: {
      totalAssets: 0,
      photosUploaded: 0,
      videosUploaded: 0,
      postsPublished: 0,
      totalViews: 0,
      engagement: 0,
    },
    recentUploads: [],
    scheduledPosts: [],
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function MediaPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getMediaDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          📸 Media Manager
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage club media, content, and social presence
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Assets" value={data.stats?.totalAssets || 0} icon={<Folder className="w-6 h-6 text-blue-500" />} />
        <StatCard label="Photos" value={data.stats?.photosUploaded || 0} icon={<Image className="w-6 h-6 text-green-500" />} />
        <StatCard label="Videos" value={data.stats?.videosUploaded || 0} icon={<Video className="w-6 h-6 text-purple-500" />} />
        <StatCard label="Posts" value={data.stats?.postsPublished || 0} icon={<FileText className="w-6 h-6 text-orange-500" />} />
        <StatCard label="Views" value={data.stats?.totalViews || 0} icon={<Eye className="w-6 h-6 text-pink-500" />} />
        <StatCard label="Engagement" value={`${data.stats?.engagement || 0}%`} icon={<TrendingUp className="w-6 h-6 text-gold-500" />} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction
          href="/dashboard/media/upload"
          icon={<Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Upload Media"
          description="Add photos and videos"
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
        />
        <QuickAction
          href="/dashboard/media/gallery"
          icon={<Image className="w-8 h-8 text-green-600 dark:text-green-400" />}
          title="Media Gallery"
          description="Browse and manage assets"
          gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
        />
        <QuickAction
          href="/dashboard/media/posts/new"
          icon={<Megaphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="Create Post"
          description="Publish news and updates"
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
        />
        <QuickAction
          href="/dashboard/media/social"
          icon={<Share2 className="w-8 h-8 text-pink-600 dark:text-pink-400" />}
          title="Social Media"
          description="Connect and manage accounts"
          gradient="from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20"
          borderColor="border-pink-200 dark:border-pink-800 hover:border-pink-400"
        />
      </div>

      {/* Recent Uploads & Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              Recent Uploads
            </h2>
            <Link href="/dashboard/media/gallery" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            <EmptyState
              icon={<Image className="w-16 h-16" />}
              title="No uploads yet"
              description="Upload your first photo or video"
              actionLabel="Upload Media"
              actionHref="/dashboard/media/upload"
            />
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Scheduled Posts
            </h2>
            <Link href="/dashboard/media/posts/new" className="px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
              New Post
            </Link>
          </div>
          <div className="p-6">
            <EmptyState
              icon={<Calendar className="w-16 h-16" />}
              title="No scheduled posts"
              description="Schedule content to be published later"
            />
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              Content Performance
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Track engagement and reach</p>
          </div>
          <Link
            href="/dashboard/media/analytics"
            className="px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            Full Analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnalyticsCard
              label="Total Reach"
              value="0"
              change={0}
              icon={<Globe className="w-8 h-8 text-blue-500" />}
            />
            <AnalyticsCard
              label="Engagement Rate"
              value="0%"
              change={0}
              icon={<TrendingUp className="w-8 h-8 text-green-500" />}
            />
            <AnalyticsCard
              label="Avg. View Time"
              value="0s"
              change={0}
              icon={<Clock className="w-8 h-8 text-purple-500" />}
            />
          </div>
        </div>
      </div>

      {/* Social Accounts */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-500" />
            Connected Accounts
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SocialAccountCard platform="instagram" connected={false} />
            <SocialAccountCard platform="twitter" connected={false} />
            <SocialAccountCard platform="facebook" connected={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, description, gradient, borderColor }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string;
}) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Open</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function AnalyticsCard({ label, value, change, icon }: { label: string; value: string; change: number; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      </div>
      <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{value}</p>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{label}</p>
    </div>
  );
}

function SocialAccountCard({ platform, connected }: { platform: string; connected: boolean }) {
  const platforms: Record<string, { name: string; color: string; icon: string }> = {
    instagram: { name: 'Instagram', color: 'from-pink-500 to-purple-500', icon: '📷' },
    twitter: { name: 'X (Twitter)', color: 'from-charcoal-600 to-charcoal-800', icon: '🐦' },
    facebook: { name: 'Facebook', color: 'from-blue-500 to-blue-700', icon: '📘' },
  };

  const config = platforms[platform];

  return (
    <div className={`p-4 rounded-xl border-2 ${connected ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-neutral-200 dark:border-charcoal-600 bg-neutral-50 dark:bg-charcoal-700'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="font-semibold text-charcoal-900 dark:text-white">{config.name}</p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
              {connected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          connected 
            ? 'bg-neutral-200 dark:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300'
            : 'bg-gradient-to-r ' + config.color + ' text-white'
        }`}>
          {connected ? 'Manage' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, actionLabel, actionHref }: {
  icon: React.ReactNode; title: string; description?: string; actionLabel?: string; actionHref?: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}