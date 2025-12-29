// ============================================================================
// 📹 MEDIA UPLOADER - PitchConnect v7.3.0
// ============================================================================
// File upload component for media content
// Supports drag & drop, progress tracking, and multiple file types
// ============================================================================

'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Loader2,
  CheckCircle,
  AlertCircle,
  Cloud,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZES,
  type MediaType,
  type MediaCategory,
  type MediaVisibility,
} from '@/types/media.types';
import { validateFile } from '@/schemas/media.schema';

// ============================================================================
// TYPES
// ============================================================================

interface MediaUploaderProps {
  clubId: string;
  teamId?: string;
  matchId?: string;
  trainingId?: string;
  allowedTypes?: MediaType[];
  maxFiles?: number;
  onUploadComplete?: (media: UploadedMedia[]) => void;
  onClose?: () => void;
}

interface UploadedMedia {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  mediaId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_OPTIONS: Array<{ value: MediaCategory; label: string; group: string }> = [
  { value: 'MATCH_HIGHLIGHT', label: 'Match Highlight', group: 'Match' },
  { value: 'MATCH_FULL', label: 'Full Match', group: 'Match' },
  { value: 'MATCH_ANALYSIS', label: 'Match Analysis', group: 'Match' },
  { value: 'GOAL_CLIP', label: 'Goal Clip', group: 'Match' },
  { value: 'TRAINING_SESSION', label: 'Training Session', group: 'Training' },
  { value: 'TRAINING_DRILL', label: 'Training Drill', group: 'Training' },
  { value: 'PLAYER_HIGHLIGHT', label: 'Player Highlight', group: 'Player' },
  { value: 'TEAM_PROMO', label: 'Team Promo', group: 'Team' },
  { value: 'OTHER', label: 'Other', group: 'General' },
];

const VISIBILITY_OPTIONS: Array<{ value: MediaVisibility; label: string; description: string }> = [
  { value: 'CLUB_ONLY', label: 'Club Only', description: 'Visible to all club members' },
  { value: 'TEAM_ONLY', label: 'Team Only', description: 'Visible to team members only' },
  { value: 'STAFF_ONLY', label: 'Staff Only', description: 'Visible to coaches and staff' },
  { value: 'PRIVATE', label: 'Private', description: 'Only visible to you' },
  { value: 'PUBLIC', label: 'Public', description: 'Visible to everyone' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMediaType(mimeType: string): MediaType {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'IMAGE';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'VIDEO';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'AUDIO';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'DOCUMENT';
  return 'DOCUMENT';
}

function getFileIcon(type: MediaType) {
  switch (type) {
    case 'IMAGE':
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    case 'VIDEO':
      return <Video className="h-8 w-8 text-purple-500" />;
    case 'AUDIO':
      return <Music className="h-8 w-8 text-green-500" />;
    case 'DOCUMENT':
      return <FileText className="h-8 w-8 text-orange-500" />;
    default:
      return <File className="h-8 w-8 text-gray-500" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaUploader({
  clubId,
  teamId,
  matchId,
  trainingId,
  allowedTypes = ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'],
  maxFiles = 10,
  onUploadComplete,
  onClose,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MediaCategory>('OTHER');
  const [visibility, setVisibility] = useState<MediaVisibility>('CLUB_ONLY');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Build accept object for dropzone
  const acceptTypes: Record<string, string[]> = {};
  if (allowedTypes.includes('IMAGE')) {
    acceptTypes['image/*'] = ALLOWED_IMAGE_TYPES.map((t) => `.${t.split('/')[1]}`);
  }
  if (allowedTypes.includes('VIDEO')) {
    acceptTypes['video/*'] = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  }
  if (allowedTypes.includes('AUDIO')) {
    acceptTypes['audio/*'] = ['.mp3', '.wav', '.ogg', '.aac'];
  }
  if (allowedTypes.includes('DOCUMENT')) {
    acceptTypes['application/pdf'] = ['.pdf'];
    acceptTypes['application/msword'] = ['.doc'];
    acceptTypes['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
  }

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: FileWithPreview[] = [];

      for (const file of acceptedFiles) {
        if (files.length + newFiles.length >= maxFiles) {
          toast({
            title: 'Max files reached',
            description: `You can only upload ${maxFiles} files at a time`,
            variant: 'destructive',
          });
          break;
        }

        const mediaType = getMediaType(file.type);
        const validation = validateFile(
          { name: file.name, type: file.type, size: file.size },
          mediaType
        );

        if (!validation.valid) {
          toast({
            title: 'Invalid file',
            description: validation.error,
            variant: 'destructive',
          });
          continue;
        }

        const fileWithPreview: FileWithPreview = Object.assign(file, {
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          uploadProgress: 0,
          uploadStatus: 'pending' as const,
        });

        newFiles.push(fileWithPreview);
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptTypes,
    maxSize: Math.max(...Object.values(MAX_FILE_SIZES)),
    maxFiles: maxFiles - files.length,
  });

  // Remove file
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const file = newFiles[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedMedia: UploadedMedia[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = getMediaType(file.type);

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, uploadStatus: 'uploading' as const } : f
        )
      );

      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);
        formData.append('description', description);
        formData.append('type', mediaType);
        formData.append('category', category);
        formData.append('visibility', visibility);
        formData.append('clubId', clubId);
        if (teamId) formData.append('teamId', teamId);
        if (matchId) formData.append('matchId', matchId);
        if (trainingId) formData.append('trainingId', trainingId);
        if (tags.length > 0) formData.append('tags', JSON.stringify(tags));

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();
        
        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setFiles((prev) =>
                prev.map((f, idx) =>
                  idx === i ? { ...f, uploadProgress: progress } : f
                )
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                uploadedMedia.push({
                  id: response.data.id,
                  title: response.data.title,
                  type: response.data.type,
                  url: response.data.url,
                  thumbnailUrl: response.data.thumbnailUrl,
                });
                setFiles((prev) =>
                  prev.map((f, idx) =>
                    idx === i
                      ? { ...f, uploadStatus: 'success' as const, mediaId: response.data.id }
                      : f
                  )
                );
                resolve();
              } else {
                reject(new Error(response.error?.message || 'Upload failed'));
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));

          xhr.open('POST', '/api/media/upload');
          xhr.send(formData);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, uploadStatus: 'error' as const, errorMessage }
              : f
          )
        );
      }
    }

    setUploading(false);

    if (uploadedMedia.length > 0) {
      toast({
        title: 'Upload complete',
        description: `Successfully uploaded ${uploadedMedia.length} file(s)`,
      });
      onUploadComplete?.(uploadedMedia);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        `}
      >
        <input {...getInputProps()} />
        <Cloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Supports: Images, Videos, Documents, Audio
          <br />
          Max file size: Video 2GB, Images 10MB, Documents 50MB
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files ({files.length}/{maxFiles})</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  {/* Preview or Icon */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(getMediaType(file.type))
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {file.uploadStatus === 'uploading' && (
                      <Progress value={file.uploadProgress} className="h-1 mt-1" />
                    )}
                    {file.uploadStatus === 'error' && (
                      <p className="text-xs text-destructive mt-1">{file.errorMessage}</p>
                    )}
                  </div>

                  {/* Status/Actions */}
                  <div className="flex-shrink-0">
                    {file.uploadStatus === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {file.uploadStatus === 'uploading' && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {file.uploadStatus === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {file.uploadStatus === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
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
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for the media"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as MediaVisibility)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tags..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
        )}
        <Button
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading || files.every((f) => f.uploadStatus === 'success')}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload {files.length} File{files.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default MediaUploader;