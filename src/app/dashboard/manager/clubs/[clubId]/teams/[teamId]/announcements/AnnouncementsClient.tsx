// =============================================================================
// 🏆 PITCHCONNECT - ANNOUNCEMENTS CLIENT COMPONENT
// =============================================================================
// Full announcement management with priority, scheduling, and visibility
// =============================================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Plus,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Users,
  Trash2,
  Edit,
  Send,
  Archive,
  Filter,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronDown,
  Globe,
  Lock,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
type ClubMemberRole = string;

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publishAt: Date | null;
  expiresAt: Date | null;
  targetRoles: ClubMemberRole[];
  targetTeamIds: string[];
  isPublic: boolean;
  attachments: string[];
  imageUrl: string | null;
  viewCount: number;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface TeamData {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
}

interface PriorityConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

interface TargetRole {
  value: ClubMemberRole;
  label: string;
  category: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AnnouncementsClientProps {
  team: TeamData;
  announcements: AnnouncementData[];
  canCreate: boolean;
  priorityConfig: Record<AnnouncementPriority, PriorityConfig>;
  statusConfig: Record<AnnouncementStatus, StatusConfig>;
  targetRoles: TargetRole[];
  currentUserId: string;
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function AnnouncementsClient({
  team,
  announcements: initialAnnouncements,
  canCreate,
  priorityConfig,
  statusConfig,
  targetRoles,
  currentUserId,
}: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>(initialAnnouncements);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    priority: 'NORMAL' as AnnouncementPriority,
    status: 'DRAFT' as AnnouncementStatus,
    publishAt: '',
    expiresAt: '',
    targetRoles: [] as ClubMemberRole[],
    isPublic: false,
  });

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      priority: 'NORMAL',
      status: 'DRAFT',
      publishAt: '',
      expiresAt: '',
      targetRoles: [],
      isPublic: false,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(a => a.priority === priorityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [announcements, statusFilter, priorityFilter, searchQuery]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        targetTeamIds: [team.id],
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      const url = editingId
        ? `/api/manager/clubs/${team.clubId}/announcements/${editingId}`
        : `/api/manager/clubs/${team.clubId}/announcements`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save announcement');
      }

      const savedAnnouncement = await response.json();

      if (editingId) {
        setAnnouncements(prev =>
          prev.map(a => (a.id === editingId ? savedAnnouncement : a))
        );
        showToast('Announcement updated successfully!', 'success');
      } else {
        setAnnouncements(prev => [savedAnnouncement, ...prev]);
        showToast('Announcement created successfully!', 'success');
      }

      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: AnnouncementData) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      excerpt: announcement.excerpt || '',
      priority: announcement.priority,
      status: announcement.status,
      publishAt: announcement.publishAt
        ? new Date(announcement.publishAt).toISOString().slice(0, 16)
        : '',
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : '',
      targetRoles: announcement.targetRoles,
      isPublic: announcement.isPublic,
    });
    setEditingId(announcement.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${team.clubId}/announcements/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showToast('Announcement deleted', 'success');
    } catch (error) {
      showToast('Failed to delete announcement', 'error');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(
        `/api/manager/clubs/${team.clubId}/announcements/${id}/publish`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to publish');

      const updated = await response.json();
      setAnnouncements(prev =>
        prev.map(a => (a.id === id ? updated : a))
      );
      showToast('Announcement published!', 'success');
    } catch (error) {
      showToast('Failed to publish announcement', 'error');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(
        `/api/manager/clubs/${team.clubId}/announcements/${id}/archive`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to archive');

      const updated = await response.json();
      setAnnouncements(prev =>
        prev.map(a => (a.id === id ? updated : a))
      );
      showToast('Announcement archived', 'success');
    } catch (error) {
      showToast('Failed to archive announcement', 'error');
    }
  };

  const toggleRole = (role: ClubMemberRole) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/10 to-cyan-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                  : toast.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400'
              }`}
            >
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${team.clubId}/teams/${team.id}`}>
            <button className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Announcements</h1>
                <p className="text-slate-600 dark:text-slate-400">{team.name} • {team.clubName}</p>
              </div>
            </div>

            {canCreate && !isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Announcement
              </button>
            )}
          </div>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title..."
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement here..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as AnnouncementStatus }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Publish At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publishAt}
                    onChange={e => setFormData(prev => ({ ...prev, publishAt: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={e => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Target Roles */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Target Roles (Leave empty for all)
                </label>
                <div className="flex flex-wrap gap-2">
                  {targetRoles.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => toggleRole(role.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.targetRoles.includes(role.value)
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={e => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-5 h-5 rounded"
                  />
                  <span className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formData.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {formData.isPublic ? 'Public (visible to everyone)' : 'Team Only'}
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {editingId ? 'Update' : 'Create'} Announcement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as AnnouncementStatus | 'ALL')}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as AnnouncementPriority | 'ALL')}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Priorities</option>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No announcements found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {canCreate
                  ? 'Create your first announcement to keep your team informed'
                  : 'Check back later for updates from your team'
                }
              </p>
            </div>
          ) : (
            filteredAnnouncements.map(announcement => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                priorityConfig={priorityConfig}
                statusConfig={statusConfig}
                canEdit={canCreate}
                onEdit={() => handleEdit(announcement)}
                onDelete={() => handleDelete(announcement.id)}
                onPublish={() => handlePublish(announcement.id)}
                onArchive={() => handleArchive(announcement.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function AnnouncementCard({
  announcement,
  priorityConfig,
  statusConfig,
  canEdit,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: {
  announcement: AnnouncementData;
  priorityConfig: Record<AnnouncementPriority, PriorityConfig>;
  statusConfig: Record<AnnouncementStatus, StatusConfig>;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const priority = priorityConfig[announcement.priority];
  const status = statusConfig[announcement.status];

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden ${
      announcement.priority === 'URGENT'
        ? 'border-red-300 dark:border-red-700'
        : announcement.priority === 'HIGH'
          ? 'border-amber-300 dark:border-amber-700'
          : 'border-slate-200 dark:border-slate-700'
    }`}>
      {/* Priority bar */}
      <div className={`h-1 ${
        announcement.priority === 'URGENT' ? 'bg-red-500' :
        announcement.priority === 'HIGH' ? 'bg-amber-500' :
        announcement.priority === 'NORMAL' ? 'bg-blue-500' : 'bg-slate-300'
      }`} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priority.bgColor} ${priority.color}`}>
                {priority.icon} {priority.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
              {announcement.isPublic ? (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Globe className="w-3 h-3" /> Public
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Lock className="w-3 h-3" /> Team Only
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{announcement.title}</h3>
          </div>

          {canEdit && (
            <div className="flex items-center gap-1">
              {announcement.status === 'DRAFT' && (
                <button
                  onClick={onPublish}
                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                  title="Publish"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
              {announcement.status === 'PUBLISHED' && (
                <button
                  onClick={onArchive}
                  className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onEdit}
                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-4">
          {announcement.content}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>By {announcement.author.firstName} {announcement.author.lastName}</span>
          <span>{new Date(announcement.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</span>
          {announcement.publishAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Scheduled: {new Date(announcement.publishAt).toLocaleDateString('en-GB')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {announcement.viewCount} views
          </span>
        </div>
      </div>
    </div>
  );
}