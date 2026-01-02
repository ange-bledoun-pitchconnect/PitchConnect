/**
 * ============================================================================
 * Media Uploader Component
 * ============================================================================
 * 
 * Enterprise-grade media upload with multi-sport category support.
 * 
 * @version 2.0.0
 * @path src/components/media/MediaUploader.tsx
 * 
 * FEATURES:
 * - Drag & drop upload
 * - Progress tracking
 * - Multi-file support
 * - Sport-specific categories
 * - Visibility controls
 * - Tag management
 * - Image/Video/Audio/Document support
 * - Dark mode support
 * 
 * AFFECTED USER ROLES:
 * - COACH, COACH_PRO: Training & match media
 * - MANAGER, CLUB_MANAGER: All club media
 * - MEDIA_MANAGER: Full media access
 * - ANALYST: Analysis clips
 * - PLAYER_PRO: Personal highlights
 * 
 * ============================================================================
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, X, File, Image as ImageIcon, Video, FileText, Music,
  Loader2, CheckCircle, AlertCircle, Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
export type MediaVisibility = 'PUBLIC' | 'CLUB_ONLY' | 'TEAM_ONLY' | 'STAFF_ONLY' | 'PRIVATE';

export type MediaCategory =
  | 'MATCH_HIGHLIGHT' | 'MATCH_FULL' | 'MATCH_ANALYSIS' | 'SCORING_CLIP'
  | 'TRAINING_SESSION' | 'TRAINING_DRILL' | 'TACTICAL_BOARD'
  | 'PLAYER_HIGHLIGHT' | 'PLAYER_INTERVIEW' | 'PLAYER_PROFILE'
  | 'TEAM_PROMO' | 'TEAM_PHOTO' | 'TEAM_ANNOUNCEMENT'
  | 'MEDICAL_RECORD' | 'INJURY_REPORT'
  | 'SCOUTING_REPORT' | 'OPPOSITION_ANALYSIS'
  | 'OTHER';

export interface UploadedMedia {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
}

export interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  mediaId?: string;
}

export interface MediaUploaderProps {
  sport?: Sport;
  clubId: string;
  teamId?: string;
  matchId?: string;
  trainingId?: string;
  playerId?: string;
  allowedTypes?: MediaType[];
  maxFiles?: number;
  maxFileSizes?: Partial<Record<MediaType, number>>;
  onUploadComplete?: (media: UploadedMedia[]) => void;
  onClose?: () => void;
  defaultCategory?: MediaCategory;
  defaultVisibility?: MediaVisibility;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const DEFAULT_MAX_SIZES: Record<MediaType, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 2 * 1024 * 1024 * 1024,
  AUDIO: 50 * 1024 * 1024,
  DOCUMENT: 50 * 1024 * 1024,
};

const CATEGORY_OPTIONS: Array<{ value: MediaCategory; label: string; group: string }> = [
  { value: 'MATCH_HIGHLIGHT', label: 'Match Highlight', group: 'Match' },
  { value: 'MATCH_FULL', label: 'Full Match', group: 'Match' },
  { value: 'MATCH_ANALYSIS', label: 'Match Analysis', group: 'Match' },
  { value: 'SCORING_CLIP', label: 'Scoring Clip', group: 'Match' },
  { value: 'TRAINING_SESSION', label: 'Training Session', group: 'Training' },
  { value: 'TRAINING_DRILL', label: 'Training Drill', group: 'Training' },
  { value: 'TACTICAL_BOARD', label: 'Tactical Board', group: 'Training' },
  { value: 'PLAYER_HIGHLIGHT', label: 'Player Highlight', group: 'Player' },
  { value: 'PLAYER_INTERVIEW', label: 'Player Interview', group: 'Player' },
  { value: 'PLAYER_PROFILE', label: 'Player Profile', group: 'Player' },
  { value: 'TEAM_PROMO', label: 'Team Promo', group: 'Team' },
  { value: 'TEAM_PHOTO', label: 'Team Photo', group: 'Team' },
  { value: 'TEAM_ANNOUNCEMENT', label: 'Announcement', group: 'Team' },
  { value: 'MEDICAL_RECORD', label: 'Medical Record', group: 'Medical' },
  { value: 'INJURY_REPORT', label: 'Injury Report', group: 'Medical' },
  { value: 'SCOUTING_REPORT', label: 'Scouting Report', group: 'Scouting' },
  { value: 'OPPOSITION_ANALYSIS', label: 'Opposition Analysis', group: 'Scouting' },
  { value: 'OTHER', label: 'Other', group: 'General' },
];

const VISIBILITY_OPTIONS: Array<{ value: MediaVisibility; label: string; description: string }> = [
  { value: 'PUBLIC', label: 'Public', description: 'Visible to everyone' },
  { value: 'CLUB_ONLY', label: 'Club Only', description: 'Visible to all club members' },
  { value: 'TEAM_ONLY', label: 'Team Only', description: 'Visible to team members only' },
  { value: 'STAFF_ONLY', label: 'Staff Only', description: 'Visible to coaches and staff' },
  { value: 'PRIVATE', label: 'Private', description: 'Only visible to you' },
];

// =============================================================================
// HELPERS
// =============================================================================

function getMediaType(mimeType: string): MediaType {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'IMAGE';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'VIDEO';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'AUDIO';
  return 'DOCUMENT';
}

function getFileIcon(type: MediaType) {
  const icons = { IMAGE: ImageIcon, VIDEO: Video, AUDIO: Music, DOCUMENT: FileText };
  const colors = { IMAGE: 'text-blue-500', VIDEO: 'text-purple-500', AUDIO: 'text-green-500', DOCUMENT: 'text-orange-500' };
  const Icon = icons[type] || File;
  return <Icon className={cn('h-8 w-8', colors[type] || 'text-gray-500')} />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MediaUploader({
  sport,
  clubId,
  teamId,
  matchId,
  trainingId,
  playerId,
  allowedTypes = ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'],
  maxFiles = 10,
  maxFileSizes = DEFAULT_MAX_SIZES,
  onUploadComplete,
  onClose,
  defaultCategory = 'OTHER',
  defaultVisibility = 'CLUB_ONLY',
  className,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MediaCategory>(defaultCategory);
  const [visibility, setVisibility] = useState<MediaVisibility>(defaultVisibility);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Build accept types
  const acceptTypes: Record<string, string[]> = {};
  if (allowedTypes.includes('IMAGE')) acceptTypes['image/*'] = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (allowedTypes.includes('VIDEO')) acceptTypes['video/*'] = ['.mp4', '.webm', '.mov', '.avi'];
  if (allowedTypes.includes('AUDIO')) acceptTypes['audio/*'] = ['.mp3', '.wav', '.ogg', '.aac'];
  if (allowedTypes.includes('DOCUMENT')) {
    acceptTypes['application/pdf'] = ['.pdf'];
    acceptTypes['application/msword'] = ['.doc'];
    acceptTypes['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
  }

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const mediaType = getMediaType(file.type);
    const maxSize = maxFileSizes[mediaType] || DEFAULT_MAX_SIZES[mediaType];
    if (file.size > maxSize) return { valid: false, error: `File too large. Max size: ${formatFileSize(maxSize)}` };
    return { valid: true };
  };

  // Handle drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithPreview[] = [];
    for (const file of acceptedFiles) {
      if (files.length + newFiles.length >= maxFiles) break;
      const validation = validateFile(file);
      if (!validation.valid) continue;
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadProgress: 0,
        uploadStatus: 'pending' as const,
      });
      newFiles.push(fileWithPreview);
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }, [files.length, maxFiles, maxFileSizes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptTypes,
    maxFiles: maxFiles - files.length,
    disabled: uploading,
  });

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addTag = useCallback(() => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const uploadedMedia: UploadedMedia[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.uploadStatus === 'success') continue;

      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploadStatus: 'uploading' as const } : f));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('visibility', visibility);
        formData.append('tags', JSON.stringify(tags));
        formData.append('clubId', clubId);
        if (teamId) formData.append('teamId', teamId);
        if (matchId) formData.append('matchId', matchId);
        if (trainingId) formData.append('trainingId', trainingId);
        if (playerId) formData.append('playerId', playerId);
        if (sport) formData.append('sport', sport);

        const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();

        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploadStatus: 'success' as const, uploadProgress: 100, mediaId: data.id } : f));
        uploadedMedia.push({ id: data.id, title: data.title, type: data.type, url: data.url, thumbnailUrl: data.thumbnailUrl });
      } catch (error) {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploadStatus: 'error' as const, errorMessage: 'Upload failed' } : f));
      }
    }

    setUploading(false);
    if (uploadedMedia.length > 0) onUploadComplete?.(uploadedMedia);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-neutral-300 dark:border-charcoal-600 hover:border-primary/50',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Cloud className="mx-auto h-12 w-12 text-charcoal-400 dark:text-charcoal-500 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-charcoal-900 dark:text-white">Drag & drop files here</p>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">or click to browse</p>
          </>
        )}
        <p className="text-xs text-charcoal-400 mt-4">Supports: Images, Videos, Documents, Audio • Max: {maxFiles} files</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files ({files.length}/{maxFiles})</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {file.preview ? <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded" /> : getFileIcon(getMediaType(file.type))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-charcoal-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-charcoal-500">{formatFileSize(file.size)}</p>
                    {file.uploadStatus === 'uploading' && <Progress value={file.uploadProgress} className="h-1 mt-1" />}
                    {file.uploadStatus === 'error' && <p className="text-xs text-red-500 mt-1">{file.errorMessage}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    {file.uploadStatus === 'pending' && <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={uploading}><X className="h-4 w-4" /></Button>}
                    {file.uploadStatus === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    {file.uploadStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {file.uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Form */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Enter a title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Add a description..." rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORY_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as MediaVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VISIBILITY_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input placeholder="Add tags..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, i) => <Badge key={i} variant="secondary" className="gap-1">{tag}<button type="button" onClick={() => setTags(tags.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button></Badge>)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onClose && <Button variant="outline" onClick={onClose} disabled={uploading}>Cancel</Button>}
        <Button
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading || files.every((f) => f.uploadStatus === 'success')}
          className="bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white"
        >
          {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload {files.length} File{files.length !== 1 ? 's' : ''}</>}
        </Button>
      </div>
    </div>
  );
}

MediaUploader.displayName = 'MediaUploader';
export default MediaUploader;
