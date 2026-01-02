// ============================================================================
// 🛡️ VALIDATION UTILITIES - PitchConnect v7.5.0
// Path: src/utils/validation.ts
// ============================================================================
//
// Enterprise-grade validation, formatting, and utility functions.
// Fully typed with TypeScript for type safety.
//
// ============================================================================

// ============================================================================
// EMAIL VALIDATION (No Regex - Character by Character)
// ============================================================================

/**
 * Validates an email address without using regex
 * Performs character-by-character validation
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  
  // Find @ symbol
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1 || atIndex === 0) return false;
  if (trimmed.indexOf('@', atIndex + 1) !== -1) return false; // Multiple @
  
  const localPart = trimmed.substring(0, atIndex);
  const domainPart = trimmed.substring(atIndex + 1);
  
  // Validate local part
  if (localPart.length === 0 || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;
  
  // Valid local part characters
  const validLocalChars = 'abcdefghijklmnopqrstuvwxyz0123456789.!#$%&\'*+/=?^_`{|}~-';
  for (const char of localPart) {
    if (!validLocalChars.includes(char)) return false;
  }
  
  // Validate domain part
  if (domainPart.length === 0 || domainPart.length > 253) return false;
  if (domainPart.startsWith('.') || domainPart.startsWith('-')) return false;
  if (domainPart.endsWith('.') || domainPart.endsWith('-')) return false;
  
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) return false;
  
  // Check TLD
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;
  
  // Valid domain characters
  const validDomainChars = 'abcdefghijklmnopqrstuvwxyz0123456789-';
  for (const part of domainParts) {
    if (part.length === 0 || part.length > 63) return false;
    if (part.startsWith('-') || part.endsWith('-')) return false;
    for (const char of part) {
      if (!validDomainChars.includes(char)) return false;
    }
  }
  
  return true;
}

/**
 * Normalize an email address
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

// ============================================================================
// PHONE VALIDATION & FORMATTING
// ============================================================================

/**
 * Validates a phone number (international format)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters except leading +
  const cleaned = phone.trim();
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');
  
  // Check length (7-15 digits)
  if (digits.length < 7 || digits.length > 15) return false;
  
  // If has +, first digit shouldn't be 0
  if (hasPlus && digits.startsWith('0')) return false;
  
  return true;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string, format: 'international' | 'national' | 'e164' = 'international'): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  
  switch (format) {
    case 'e164':
      return `+${digits}`;
    case 'national':
      // Assume UK format for national
      if (digits.length === 11 && digits.startsWith('0')) {
        return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
      }
      return digits;
    case 'international':
    default:
      if (digits.length === 10) {
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      if (digits.length === 11 && digits.startsWith('44')) {
        return `+44 ${digits.slice(2, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
      }
      return `+${digits}`;
  }
}

/**
 * Extract country code from phone number
 */
export function getPhoneCountryCode(phone: string): string | null {
  if (!phone) return null;
  
  const digits = phone.replace(/\D/g, '');
  
  // Common country codes
  const countryCodes: Record<string, string> = {
    '1': 'US/CA', '44': 'GB', '353': 'IE', '61': 'AU',
    '64': 'NZ', '33': 'FR', '49': 'DE', '34': 'ES',
    '39': 'IT', '31': 'NL', '32': 'BE', '81': 'JP',
  };
  
  // Try 3-digit, then 2-digit, then 1-digit
  for (const len of [3, 2, 1]) {
    const code = digits.substring(0, len);
    if (countryCodes[code]) return code;
  }
  
  return null;
}

// ============================================================================
// NUMBER & CURRENCY FORMATTING
// ============================================================================

/**
 * Format a number with locale-aware separators
 */
export function formatNumber(
  value: number,
  options: {
    locale?: string;
    decimals?: number;
    compact?: boolean;
  } = {}
): string {
  const { locale = 'en-GB', decimals = 0, compact = false } = options;
  
  if (!Number.isFinite(value)) return '0';
  
  try {
    if (compact) {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);
    }
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency: string = 'GBP',
  locale: string = 'en-GB'
): string {
  if (!Number.isFinite(value)) return '£0.00';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  // Remove currency symbols and separators
  const cleaned = value.replace(/[£$€¥,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = 'en-GB'
): string {
  if (!Number.isFinite(value)) return '0%';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  } catch {
    return `${value.toFixed(decimals)}%`;
  }
}

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string | number,
  options: {
    format?: 'short' | 'medium' | 'long' | 'full';
    locale?: string;
    includeTime?: boolean;
  } = {}
): string {
  const { format = 'medium', locale = 'en-GB', includeTime = false } = options;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      short: { day: 'numeric', month: 'numeric', year: '2-digit' },
      medium: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    }[format];
    
    if (includeTime) {
      dateOptions.hour = '2-digit';
      dateOptions.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat(locale, dateOptions).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Format time for display
 */
export function formatTime(
  date: Date | string | number,
  options: {
    format?: '12h' | '24h';
    locale?: string;
    includeSeconds?: boolean;
  } = {}
): string {
  const { format = '24h', locale = 'en-GB', includeSeconds = false } = options;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid time';
    
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: format === '12h',
    }).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en-GB'
): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffSecs < 60) return rtf.format(-diffSecs, 'second');
    if (diffMins < 60) return rtf.format(-diffMins, 'minute');
    if (diffHours < 24) return rtf.format(-diffHours, 'hour');
    if (diffDays < 7) return rtf.format(-diffDays, 'day');
    if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), 'week');
    if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), 'month');
    return rtf.format(-Math.floor(diffDays / 365), 'year');
  } catch {
    return String(date);
  }
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  return new Date(date).getTime() > Date.now();
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Generate URL-friendly slug
 */
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '')        // Remove non-word chars
    .replace(/[\s_-]+/g, '-')        // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalize only the first letter
 */
export function capitalizeFirst(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  // Simple tag removal (for basic cases)
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Generate initials from name
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join('');
}

/**
 * Format name (First Last)
 */
export function formatName(firstName?: string, lastName?: string): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ').trim() || 'Unknown';
}

// ============================================================================
// OBJECT & DATA UTILITIES
// ============================================================================

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Remove null and undefined values from object
 */
export function removeEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  ) as Partial<T>;
}

/**
 * Pick specific keys from object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

/**
 * Omit specific keys from object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result as Omit<T, K>;
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================================================
// ID & RANDOM UTILITIES
// ============================================================================

/**
 * Generate a simple unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Check if string is valid CUID
 */
export function isValidCuid(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // CUID format: c + timestamp + counter + fingerprint + random
  return /^c[a-z0-9]{24,}$/i.test(id);
}

/**
 * Check if string is valid UUID
 */
export function isValidUuid(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password || password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Include at least one lowercase letter');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Include at least one uppercase letter');
  } else {
    score += 1;
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('Include at least one number');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Include at least one special character');
  } else {
    score += 1;
  }
  
  return {
    isValid: feedback.length === 0 && password.length >= 8,
    score: Math.min(score, 5),
    feedback,
  };
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate jersey number (1-99)
 */
export function isValidJerseyNumber(number: number): boolean {
  return Number.isInteger(number) && number >= 1 && number <= 99;
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

/**
 * Check if file is a video
 */
export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv'].includes(ext);
}