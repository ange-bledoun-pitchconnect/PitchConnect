/**
 * 🌟 PITCHCONNECT - API Validation Library
 * Path: /src/lib/api/validation.ts
 */

import { logger } from '@/lib/logging';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

// ============================================================================
// URL VALIDATION
// ============================================================================

export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url) {
    errors.push('URL is required');
    return { valid: false, errors };
  }

  if (typeof url !== 'string') {
    errors.push('URL must be a string');
    return { valid: false, errors };
  }

  try {
    const urlObj = new URL(url);

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }

    if (url.length > 2048) {
      errors.push('URL is too long (max 2048 characters)');
    }

    if (!urlObj.hostname) {
      errors.push('URL must have a valid hostname');
    }

    if (process.env.NODE_ENV === 'production') {
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        errors.push('Localhost URLs are not allowed in production');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push('Invalid URL format');
    return { valid: false, errors };
  }
}

export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

export function isInternalUrl(url: string, baseDomain?: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = baseDomain || process.env.NEXT_PUBLIC_APP_URL || 'localhost';
    return urlObj.hostname === new URL(domain).hostname;
  } catch {
    return false;
  }
}

// ============================================================================
// COLOR VALIDATION
// ============================================================================

export function validateHexColor(color: string): ValidationResult {
  const errors: string[] = [];

  if (!color) {
    errors.push('Color is required');
    return { valid: false, errors };
  }

  if (typeof color !== 'string') {
    errors.push('Color must be a string');
    return { valid: false, errors };
  }

  const cleanColor = color.startsWith('#') ? color.slice(1) : color;

  if (cleanColor.length !== 3 && cleanColor.length !== 6) {
    errors.push('Hex color must be 3 or 6 characters');
    return { valid: false, errors };
  }

  if (!/^[0-9A-Fa-f]+$/.test(cleanColor)) {
    errors.push('Hex color must contain only valid hex characters (0-9, A-F)');
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
  };
}

export function normalizeHexColor(color: string): string {
  let cleanColor = color.startsWith('#') ? color.slice(1) : color;

  if (cleanColor.length === 3) {
    cleanColor = cleanColor
      .split('')
      .map((char) => char + char)
      .join('');
  }

  return `#${cleanColor.toUpperCase()}`;
}

export function validateRgbColor(color: string): ValidationResult {
  const errors: string[] = [];
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

  if (!color) {
    errors.push('Color is required');
    return { valid: false, errors };
  }

  const match = color.match(rgbRegex);
  if (!match) {
    errors.push('Invalid RGB color format. Use rgb(r, g, b)');
    return { valid: false, errors };
  }

  const [, r, g, b] = match.map((x) => parseInt(x, 10));

  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    errors.push('RGB values must be between 0 and 255');
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
  };
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

interface FileValidationOptions {
  maxSize?: number;
  allowedMimes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File | { size: number; type: string; name: string },
  options: FileValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];

  const {
    maxSize = 10 * 1024 * 1024,
    allowedMimes = [],
    allowedExtensions = [],
  } = options;

  if (!file) {
    errors.push('File is required');
    return { valid: false, errors };
  }

  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`);
  }

  if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateImageFile(
  file: File | { size: number; type: string; name: string },
  maxSizeMB: number = 5
): ValidationResult {
  return validateFile(file, {
    maxSize: maxSizeMB * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  });
}

export function validateVideoFile(
  file: File | { size: number; type: string; name: string },
  maxSizeMB: number = 100
): ValidationResult {
  return validateFile(file, {
    maxSize: maxSizeMB * 1024 * 1024,
    allowedMimes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    allowedExtensions: ['mp4', 'webm', 'ogv', 'mov'],
  });
}

export function validatePdfFile(
  file: File | { size: number; type: string; name: string },
  maxSizeMB: number = 25
): ValidationResult {
  return validateFile(file, {
    maxSize: maxSizeMB * 1024 * 1024,
    allowedMimes: ['application/pdf'],
    allowedExtensions: ['pdf'],
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// PAGINATION VALIDATION
// ============================================================================

interface PaginationParams {
  page?: number | string;
  perPage?: number | string;
  maxPerPage?: number;
}

export function validatePagination(
  params: PaginationParams
): { page: number; perPage: number; errors: string[] } {
  const errors: string[] = [];
  let page = 1;
  let perPage = 10;
  const maxPerPage = params.maxPerPage || 100;

  if (params.page !== undefined) {
    const parsedPage = parseInt(String(params.page), 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.push('Page must be a number greater than 0');
      page = 1;
    } else {
      page = parsedPage;
    }
  }

  if (params.perPage !== undefined) {
    const parsedPerPage = parseInt(String(params.perPage), 10);
    if (isNaN(parsedPerPage) || parsedPerPage < 1) {
      errors.push('perPage must be a number greater than 0');
      perPage = 10;
    } else if (parsedPerPage > maxPerPage) {
      errors.push(`perPage cannot exceed ${maxPerPage}`);
      perPage = maxPerPage;
    } else {
      perPage = parsedPerPage;
    }
  }

  return { page, perPage, errors };
}

// ============================================================================
// STRING VALIDATION
// ============================================================================

export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username) {
    errors.push('Username is required');
    return { valid: false, errors };
  }

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (username.length > 30) {
    errors.push('Username must not exceed 30 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSlug(slug: string): ValidationResult {
  const errors: string[] = [];

  if (!slug) {
    errors.push('Slug is required');
    return { valid: false, errors };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  if (slug.length > 200) {
    errors.push('Slug must not exceed 200 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200);
}

export function validateSearchQuery(query: string, minLength: number = 2): ValidationResult {
  const errors: string[] = [];

  if (!query) {
    errors.push('Search query is required');
    return { valid: false, errors };
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length < minLength) {
    errors.push(`Search query must be at least ${minLength} characters`);
  }

  if (trimmedQuery.length > 500) {
    errors.push('Search query must not exceed 500 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// NUMERIC VALIDATION
// ============================================================================

export function validateIntegerRange(
  value: any,
  min?: number,
  max?: number
): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null || value === '') {
    errors.push('Value is required');
    return { valid: false, errors };
  }

  const num = parseInt(String(value), 10);
  if (isNaN(num)) {
    errors.push('Value must be a valid integer');
    return { valid: false, errors };
  }

  if (min !== undefined && num < min) {
    errors.push(`Value must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    errors.push(`Value must not exceed ${max}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePositiveInteger(value: any): ValidationResult {
  return validateIntegerRange(value, 1);
}

// ============================================================================
// GENERAL UTILITIES
// ============================================================================

export function allValid(results: ValidationResult[]): boolean {
  return results.every((result) => result.valid);
}

export function collectErrors(results: ValidationResult[]): string[] {
  return results.flatMap((result) => result.errors);
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export type { ValidationResult, FileValidationOptions, PaginationParams };
