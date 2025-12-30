'use client';

// ============================================================================
// 📸 PITCHCONNECT - Media Dashboard v7.5.0
// Path: app/(dashboard)/dashboard/media/page.tsx
// ============================================================================
//
// Media management dashboard with social account integration,
// gallery management, and content analytics.
//
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Video,
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Share2,
  Link2,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  ChevronRight,
  Play,
  Folder,
  Settings,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { SPORT_CONFIGS, type Sport } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

type SocialPlatform = 'INSTAGRAM' | 'TWITTER' | 'FACEBOOK' | 'YOUTUBE' | 'TIKTOK' | 'LINKEDIN';

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  profileUrl?: string;
  followerCount: number;
  isConnected: boolean;
  lastSyncAt?: Date;
  lastPostAt?: Date;
}

interface MediaItem {
  id: string;
  type: 'VIDEO' | 'IMAGE';
  category: string;
  title: string;
  thumbnailUrl: string;
  url: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  visibility: 'PUBLIC' | 'CLUB_ONLY' | 'TEAM_ONLY' | 'PRIVATE';
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  tags: string[];
}

interface MediaStats {
  totalMedia: number;
  totalVideos: number;
  totalImages: number;
  totalViews: number;
  totalStorage: number;
  storageLimit: number;
}

// ============================================================================
// PLATFORM CONFIG
// ============================================================================

const PLATFORM_CONFIG: Record<SocialPlatform, { icon: React.ElementType; color: string; label: string; gradient: string }> = {
  INSTAGRAM: { icon: Instagram, color: 'pink', label: 'Instagram', gradient: 'from-pink-500 via-purple-500 to-orange-500' },
  TWITTER: { icon: Twitter, color: 'sky', label: 'X (Twitter)', gradient: 'from-sky-400 to-blue-500' },
  FACEBOOK: { icon: Facebook, color: 'blue', label: 'Facebook', gradient: 'from-blue-600 to-blue-700' },
  YOUTUBE: { icon: Youtube, color: 'red', label: 'YouTube', gradient: 'from-red-500 to-red-600' },
  TIKTOK: { icon: Zap, color: 'neutral', label: 'TikTok', gradient: 'from-neutral-900 via-pink-500 to-cyan-400' },
  LINKEDIN: { icon: Users, color: 'blue', label: 'LinkedIn', gradient: 'from-blue-700 to-blue-800' },
};

// ============================================================================
// MOCK DATA
// ============================================================================

const mockStats: MediaStats = {
  totalMedia: 156,
  totalVideos: 42,
  totalImages: 114,
  totalViews: 12450,
  totalStorage: 2.4, // GB
  storageLimit: 10, // GB
};

const mockSocialAccounts: SocialAccount[] = [
  { id: '1', platform: 'INSTAGRAM', accountName: '@valleyfc_official', followerCount: 5420, isConnected: true, lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), lastPostAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '2', platform: 'TWITTER', accountName: '@ValleyFC', followerCount: 3180, isConnected: true, lastSyncAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  { id: '3', platform: 'FACEBOOK', accountName: 'Valley Football Club', followerCount: 8920, isConnected: true, lastSyncAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { id: '4', platform: 'YOUTUBE', accountName: 'Valley FC', followerCount: 1250, isConnected: false },
  { id: '5', platform: 'TIKTOK', accountName: '@valleyfc', followerCount: 0, isConnected: false },
];

const mockMediaItems: MediaItem[] = [
  { id: '1', type: 'VIDEO', category: 'MATCH_HIGHLIGHT', title: 'Match Highlights vs Riverside FC', thumbnailUrl: '/api/placeholder/400/225', url: '/videos/1.mp4', duration: 245, viewCount: 1250, likeCount: 89, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), visibility: 'PUBLIC', processingStatus: 'COMPLETED', tags: ['match', 'highlights', 'goals'] },
  { id: '2', type: 'IMAGE', category: 'MATCH_PHOTO', title: 'Team Celebration', thumbnailUrl: '/api/placeholder/400/300', url: '/images/2.jpg', viewCount: 890, likeCount: 156, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), visibility: 'PUBLIC', processingStatus: 'COMPLETED', tags: ['celebration', 'team'] },
  { id: '3', type: 'VIDEO', category: 'TRAINING_SESSION', title: 'Training Ground Session', thumbnailUrl: '/api/placeholder/400/225', url: '/videos/3.mp4', duration: 180, viewCount: 456, likeCount: 34, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), visibility: 'CLUB_ONLY', processingStatus: 'COMPLETED', tags: ['training', 'drills'] },
  { id: '4', type: 'VIDEO', category: 'GOAL_CLIP', title: 'Amazing Free Kick Goal', thumbnailUrl: '/api/placeholder/400/225', url: '/videos/4.mp4', duration: 32, viewCount: 2340, likeCount: 245, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), visibility: 'PUBLIC', processingStatus: 'COMPLETED', tags: ['goal', 'freekick', 'amazing'] },
  { id: '5', type: 'IMAGE', category: 'TEAM_PHOTO', title: 'Squad Photo 2024/25', thumbnailUrl: '/api/placeholder/400/300', url: '/images/5.jpg', viewCount: 1890, likeCount: 312, createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), visibility: 'PUBLIC', processingStatus: 'COMPLETED', tags: ['squad', 'team', 'official'] },
  { id: '6', type: 'VIDEO', category: 'PLAYER_INTERVIEW', title: 'Post-Match Interview - Captain', thumbnailUrl: '/api/placeholder/400/225', url: '/videos/6.mp4', duration: 420, viewCount: 678, likeCount: 45, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), visibility: 'PUBLIC', processingStatus: 'COMPLETED', tags: ['interview', 'captain'] },
  { id: '7', type: 'VIDEO', category: 'MATCH_HIGHLIGHT', title: 'Processing...', thumbnailUrl: '/api/placeholder/400/225', url: '', viewCount: 0, likeCount: 0, createdAt: new Date(), visibility: 'CLUB_ONLY', processingStatus: 'PROCESSING', tags: [] },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'MATCH_HIGHLIGHT', label: 'Match Highlights' },
  { value: 'GOAL_CLIP', label: 'Goal Clips' },
  { value: 'MATCH_PHOTO', label: 'Match Photos' },
  { value: 'TRAINING_SESSION', label: 'Training' },
  { value: 'PLAYER_INTERVIEW', label: 'Interviews' },
  { value: 'TEAM_PHOTO', label: 'Team Photos' },
  { value: 'ANNOUNCEMENT', label: 'Announcements' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color = 'blue',
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subValue && <p className="mt-1 text-sm text-neutral-500">{subValue}</p>}
        </div>
        <div className={`rounded-lg border p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SocialAccountCard({ account }: { account: SocialAccount }) {
  const config = PLATFORM_CONFIG[account.platform];
  const Icon = config.icon;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'Never';
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border ${account.isConnected ? 'border-neutral-700' : 'border-dashed border-neutral-800'} bg-neutral-900/50 p-5 transition-all hover:border-neutral-600`}>
      {account.isConnected && (
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.gradient}`} />
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            config.color === 'pink' ? 'bg-pink-500/10 text-pink-400' :
            config.color === 'sky' ? 'bg-sky-500/10 text-sky-400' :
            config.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
            config.color === 'red' ? 'bg-red-500/10 text-red-400' :
            'bg-neutral-500/10 text-neutral-400'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{config.label}</h3>
            <p className="text-sm text-neutral-400">{account.accountName}</p>
          </div>
        </div>
        {account.isConnected ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected
          </span>
        ) : (
          <button className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700">
            Connect
          </button>
        )}
      </div>

      {account.isConnected && (
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4">
          <div>
            <p className="text-2xl font-bold text-white">{formatNumber(account.followerCount)}</p>
            <p className="text-xs text-neutral-500">Followers</p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-300">{formatTime(account.lastSyncAt)}</p>
            <p className="text-xs text-neutral-500">Last Synced</p>
          </div>
        </div>
      )}

      {account.isConnected && (
        <div className="mt-4 flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800/50 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800">
            <Share2 className="h-3.5 w-3.5" />
            Post
          </button>
          <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800/50 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800">
            <RefreshCw className="h-3.5 w-3.5" />
            Sync
          </button>
          <button className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function MediaCard({ item, viewMode }: { item: MediaItem; viewMode: 'grid' | 'list' }) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getVisibilityBadge = (visibility: string) => {
    const styles: Record<string, string> = {
      PUBLIC: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CLUB_ONLY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      TEAM_ONLY: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      PRIVATE: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    };
    return styles[visibility] || styles.PRIVATE;
  };

  if (viewMode === 'list') {
    return (
      <div className="group flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all hover:border-neutral-700 hover:bg-neutral-900/70">
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
          <div className="flex h-full w-full items-center justify-center text-neutral-600">
            {item.type === 'VIDEO' ? <Video className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
          </div>
          {item.type === 'VIDEO' && item.duration && item.processingStatus === 'COMPLETED' && (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs text-white">
              {formatDuration(item.duration)}
            </span>
          )}
          {item.processingStatus === 'PROCESSING' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <RefreshCw className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{item.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            <span>{item.category.replace(/_/g, ' ')}</span>
            <span>•</span>
            <span>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {formatViews(item.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {item.likeCount}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${getVisibilityBadge(item.visibility)}`}>
            {item.visibility.replace('_', ' ')}
          </span>
        </div>

        <button className="rounded-lg p-2 text-neutral-500 opacity-0 transition-all hover:bg-neutral-800 hover:text-white group-hover:opacity-100">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all hover:border-neutral-700 hover:bg-neutral-900/70">
      <div className="relative aspect-video overflow-hidden bg-neutral-800">
        <div className="flex h-full w-full items-center justify-center text-neutral-600">
          {item.type === 'VIDEO' ? <Video className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}
        </div>
        
        {item.type === 'VIDEO' && item.processingStatus === 'COMPLETED' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
              <Play className="h-5 w-5 ml-0.5" />
            </div>
          </div>
        )}
        
        {item.type === 'VIDEO' && item.duration && item.processingStatus === 'COMPLETED' && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(item.duration)}
          </span>
        )}

        {item.processingStatus === 'PROCESSING' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
            <span className="mt-2 text-sm text-white">Processing...</span>
          </div>
        )}

        {item.processingStatus === 'FAILED' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/50">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <span className="mt-2 text-sm text-red-300">Processing Failed</span>
          </div>
        )}

        <span className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-xs ${getVisibilityBadge(item.visibility)}`}>
          {item.visibility.replace('_', ' ')}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-white line-clamp-1">{item.title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{item.category.replace(/_/g, ' ')}</p>
        
        <div className="mt-3 flex items-center justify-between text-sm text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatViews(item.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {item.likeCount}
            </span>
          </div>
          <span>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>

        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StorageIndicator({ used, limit }: { used: number; limit: number }) {
  const percentage = (used / limit) * 100;
  const getColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">Storage</h3>
        <span className="text-sm text-neutral-400">{used.toFixed(1)} GB / {limit} GB</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800">
        <div className={`h-full transition-all ${getColor()}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        {percentage >= 90 ? 'Storage almost full. Consider upgrading.' : `${(limit - used).toFixed(1)} GB available`}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MediaDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'VIDEO' | 'IMAGE'>('all');
  const [activeTab, setActiveTab] = useState<'gallery' | 'social'>('gallery');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredMedia = useMemo(() => {
    return mockMediaItems.filter((item) => {
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, categoryFilter, typeFilter]);

  const connectedAccounts = mockSocialAccounts.filter(a => a.isConnected).length;
  const totalFollowers = mockSocialAccounts.reduce((sum, a) => sum + a.followerCount, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-purple-500" />
          <p className="text-sm text-neutral-400">Loading media dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
                <Video className="h-8 w-8 text-purple-400" />
                Media Center
              </h1>
              <p className="mt-1 text-neutral-400">
                Manage photos, videos, and social media accounts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/media/upload"
                className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-400"
              >
                <Upload className="h-4 w-4" />
                Upload Media
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-neutral-800">
            {[
              { id: 'gallery', label: 'Media Gallery', icon: Grid3X3 },
              { id: 'social', label: 'Social Accounts', icon: Share2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Folder} label="Total Media" value={mockStats.totalMedia} subValue={`${mockStats.totalVideos} videos, ${mockStats.totalImages} images`} color="purple" />
              <StatCard icon={Eye} label="Total Views" value={`${(mockStats.totalViews / 1000).toFixed(1)}K`} subValue="Across all media" color="blue" />
              <StatCard icon={Users} label="Social Followers" value={`${(totalFollowers / 1000).toFixed(1)}K`} subValue={`${connectedAccounts} accounts connected`} color="green" />
              <StorageIndicator used={mockStats.totalStorage} limit={mockStats.storageLimit} />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 py-2 pl-10 pr-4 text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="VIDEO">Videos</option>
                  <option value="IMAGE">Images</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-2 ${viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white'}`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Media Grid/List */}
            {filteredMedia.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredMedia.map((item) => (
                    <MediaCard key={item.id} item={item} viewMode="grid" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMedia.map((item) => (
                    <MediaCard key={item.id} item={item} viewMode="list" />
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-16 text-center">
                <Video className="h-12 w-12 text-neutral-600" />
                <h3 className="mt-4 font-medium text-white">No media found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Upload your first media file'}
                </p>
                <Link
                  href="/dashboard/media/upload"
                  className="mt-4 flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-400"
                >
                  <Upload className="h-4 w-4" />
                  Upload Media
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* Social Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={Link2} label="Connected Accounts" value={connectedAccounts} subValue={`of ${mockSocialAccounts.length} platforms`} color="green" />
              <StatCard icon={Users} label="Total Followers" value={`${(totalFollowers / 1000).toFixed(1)}K`} subValue="Across all platforms" color="blue" />
              <StatCard icon={TrendingUp} label="Engagement Rate" value="4.8%" subValue="+0.5% this month" color="purple" />
            </div>

            {/* Social Accounts Grid */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Connected Platforms</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mockSocialAccounts.map((account) => (
                  <SocialAccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>

            {/* Quick Post */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="text-lg font-semibold text-white">Quick Post</h2>
              <p className="mt-1 text-sm text-neutral-400">Share content across all connected platforms</p>
              <div className="mt-4">
                <textarea
                  placeholder="What's happening at the club?"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 p-4 text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <button className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
                      <Video className="h-5 w-5" />
                    </button>
                  </div>
                  <button className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-400">
                    <Share2 className="h-4 w-4" />
                    Post to All Platforms
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
