/**
 * Enhanced Utilities Library - WORLD-CLASS VERSION
 * Path: /src/lib/utils.ts
 *
 * ============================================================================
 * ENTERPRISE FEATURES
 * ============================================================================
 * ✅ Zero external dependencies (removed clsx, tailwind-merge)
 * ✅ Native Tailwind class merging with conflict resolution
 * ✅ Type-safe utility functions
 * ✅ Advanced formatting (currency, dates, time)
 * ✅ String manipulation utilities
 * ✅ Type guards and validators
 * ✅ Performance optimization helpers
 * ✅ Sports-specific utilities
 * ✅ Data transformation helpers
 * ✅ Error handling utilities
 * ✅ Async/Promise utilities
 * ✅ Caching and memoization
 * ✅ Production-ready code
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ClassValue =
  | string
  | undefined
  | null
  | false
  | Record<string, boolean>
  | ClassValue[];

export type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// TAILWIND CLASS UTILITIES - ZERO DEPENDENCIES
// ============================================================================

/**
 * Split Tailwind class string into individual classes
 */
function splitClasses(classString: string): string[] {
  return classString
    .split(/\s+/)
    .filter((cls) => cls.length > 0);
}

/**
 * Get Tailwind property prefix (e.g., 'bg' from 'bg-red-500')
 */
function getTailwindPrefix(className: string): string {
  // Handle special cases
  if (className.startsWith('peer') || className.startsWith('group')) {
    return className.split(/[-:]/)[0];
  }

  // Get base prefix (e.g., 'bg' from 'bg-red-500')
  const match = className.match(/^([a-z]+)(-|:)/);
  return match ? match[1] : className;
}

/**
 * Merge Tailwind CSS classes intelligently (no external dependencies)
 * Handles conflict resolution for utilities like bg-red-500 vs bg-blue-500
 */
export function cn(...inputs: ClassValue[]): string {
  const classMap = new Map<string, string>();
  const conflictGroups = new Map<string, Set<string>>();

  // Flatten and process all classes
  const flattenClasses = (val: ClassValue): string[] => {
    if (!val) return [];
    if (typeof val === 'string') return splitClasses(val);
    if (Array.isArray(val)) return val.flatMap(flattenClasses);
    if (typeof val === 'object') {
      return Object.entries(val)
        .filter(([, condition]) => condition)
        .map(([className]) => className);
    }
    return [];
  };

  const allClasses = inputs.flatMap(flattenClasses);

  // Process classes in order to handle overrides
  for (const className of allClasses) {
    const prefix = getTailwindPrefix(className);

    // Store class by prefix for conflict detection
    if (!conflictGroups.has(prefix)) {
      conflictGroups.set(prefix, new Set());
    }

    // For conflicting properties, the last one wins
    conflictGroups.get(prefix)!.add(className);

    // Always store the class (will be overridden if conflicting)
    classMap.set(`${prefix}_${className}`, className);
  }

  // Build final class list with only the last occurrence of each prefix
  const finalClasses: string[] = [];
  const seenPrefixes = new Set<string>();

  for (let i = allClasses.length - 1; i >= 0; i--) {
    const className = allClasses[i];
    const prefix = getTailwindPrefix(className);

    if (!seenPrefixes.has(prefix)) {
      finalClasses.unshift(className);
      seenPrefixes.add(prefix);
    }
  }

  return finalClasses.join(' ');
}

/**
 * Conditionally merge classes
 */
export function clsx(...inputs: ClassValue[]): string {
  return cn(...inputs);
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency with support for multiple locales
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  try {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format time (HH:MM:SS)
 */
export function formatTime(
  seconds: number,
  format: 'hms' | 'ms' | 'hm' = 'hms'
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num: number) => String(num).padStart(2, '0');

  switch (format) {
    case 'hms':
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    case 'ms':
      return `${pad(minutes)}:${pad(secs)}`;
    case 'hm':
      return `${pad(hours)}:${pad(minutes)}`;
    default:
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'en-US'
): string {
  try {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = then - now;

  const units: Array<[TimeUnit, number]> = [
    ['d', 86400000],
    ['h', 3600000],
    ['min', 60000],
    ['s', 1000],
    ['ms', 1],
  ];

  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) {
      return rtf.format(Math.round(diff / ms), unit as any);
    }
  }

  return 'just now';
}

/**
 * Format duration in human readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate string to specified length
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (!str || str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert to title case
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Convert string to slug format
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Camel case conversion
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (match) => match.toLowerCase());
}

/**
 * Snake case conversion
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]/g, '_')
    .toLowerCase();
}

/**
 * Kebab case conversion
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[-_\s]/g, '-')
    .toLowerCase();
}

/**
 * Reverse string
 */
export function reverseString(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * Check if string contains substring (case insensitive)
 */
export function containsIgnoreCase(str: string, search: string): boolean {
  return str.toLowerCase().includes(search.toLowerCase());
}

/**
 * Remove whitespace from string
 */
export function removeWhitespace(str: string): string {
  return str.replace(/\s+/g, '');
}

/**
 * Pluralize word based on count
 */
export function pluralize(word: string, count: number, plural?: string): string {
  if (count === 1) return word;
  return plural || word + 's';
}

// ============================================================================
// VALIDATION & TYPE CHECKING
// ============================================================================

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Type guard: is string
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Type guard: is number
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

/**
 * Type guard: is boolean
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Type guard: is array
 */
export const isArray = (value: unknown): value is unknown[] =>
  Array.isArray(value);

/**
 * Type guard: is object
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Type guard: is function
 */
export const isFunction = (value: unknown): value is (...args: any[]) => any =>
  typeof value === 'function';

/**
 * Type guard: is Date
 */
export const isDate = (value: unknown): value is Date =>
  value instanceof Date && !isNaN(value.getTime());

/**
 * Type guard: is Map
 */
export const isMap = (value: unknown): value is Map<any, any> =>
  value instanceof Map;

/**
 * Type guard: is Set
 */
export const isSet = (value: unknown): value is Set<any> =>
  value instanceof Set;

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
  return phoneRegex;
}

// ============================================================================
// PERFORMANCE & ASYNC UTILITIES
// ============================================================================

/**
 * Debounce function with cancel support
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Throttle function with leading/trailing options
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let inThrottle = false;
  let lastFunc: NodeJS.Timeout | null = null;
  const { leading = true, trailing = true } = options;

  const throttled = function (...args: Parameters<T>) {
    if (!inThrottle) {
      if (leading) {
        func(...args);
      }
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastFunc) {
          func(...args);
        }
      }, limit);
    } else if (trailing) {
      if (lastFunc) clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        func(...args);
        lastFunc = null;
      }, limit);
    }
  };

  throttled.cancel = () => {
    inThrottle = false;
    if (lastFunc) {
      clearTimeout(lastFunc);
      lastFunc = null;
    }
  };

  return throttled;
}

/**
 * Sleep helper for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        await sleep(currentDelay);
        currentDelay *= backoff;
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxSize?: number } = {}
): T {
  const cache = new Map();
  const { maxSize = 100 } = options;

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  }) as T;
}

// ============================================================================
// ARRAY & OBJECT UTILITIES
// ============================================================================

/**
 * Flatten nested array
 */
export function flatten<T>(arr: (T | T[])[], depth: number = Infinity): T[] {
  if (depth === 0) return arr as T[];

  return arr.reduce<T[]>((flat, item) => {
    return flat.concat(isArray(item) ? flatten(item as T[], depth - 1) : item);
  }, []);
}

/**
 * Remove duplicates from array
 */
export function unique<T>(arr: T[], by?: (item: T) => any): T[] {
  if (!by) return [...new Set(arr)];

  const seen = new Set();
  return arr.filter((item) => {
    const key = by(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Group array items
 */
export function groupBy<T, K extends string | number>(
  arr: T[],
  by: (item: T) => K
): Record<K, T[]> {
  return arr.reduce(
    (groups, item) => {
      const key = by(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as any;
  if (obj instanceof Object) {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject((source as any)[key]) && isObject((output as any)[key])) {
        (output as any)[key] = deepMerge((output as any)[key], (source as any)[key]);
      } else {
        (output as any)[key] = (source as any)[key];
      }
    });
  }

  return output;
}

/**
 * Pick specific properties from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    result[key] = obj[key];
  });
  return result;
}

/**
 * Omit specific properties from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

// ============================================================================
// SPORTS-SPECIFIC UTILITIES
// ============================================================================

/**
 * Format match score
 */
export function formatMatchScore(homeScore: number, awayScore: number): string {
  return `${homeScore} - ${awayScore}`;
}

/**
 * Format player rating
 */
export function formatRating(rating: number): string {
  return `${Math.min(rating, 10).toFixed(1)}/10`;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Format speed in km/h
 */
export function formatSpeed(speedMs: number): string {
  const kmh = speedMs * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Convert minutes and seconds to total seconds
 */
export function toSeconds(minutes: number, seconds: number = 0): number {
  return minutes * 60 + seconds;
}

/**
 * Convert seconds to minutes and seconds
 */
export function toMinutesSeconds(totalSeconds: number): { minutes: number; seconds: number } {
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Get match period label
 */
export function getMatchPeriodLabel(elapsedTime: number): string {
  if (elapsedTime < 45) return `${elapsedTime}'`;
  if (elapsedTime < 45) return `${elapsedTime}'`;
  if (elapsedTime < 90) return `${elapsedTime}'`;
  if (elapsedTime < 90) return `${elapsedTime}'`;
  if (elapsedTime < 120) return `${elapsedTime}' (ET)`;
  return 'FT';
}

// ============================================================================
// DATE & TIME UTILITIES
// ============================================================================

/**
 * Get time range
 */
export function getTimeRange(range: 'today' | 'week' | 'month' | 'year'): TimeRange {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return { start, end };
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get pagination params
 */
export function getPaginationParams(page: number, limit: number): PaginationParams {
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    offset: Math.max(0, (page - 1) * limit),
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Safe JSON parse
 */
export function safeJsonParse<T = any>(json: string, fallback?: T): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback || null;
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default {
  cn,
  clsx,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatBytes,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  truncate,
  capitalize,
  titleCase,
  toSlug,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  reverseString,
  containsIgnoreCase,
  removeWhitespace,
  pluralize,
  isEmpty,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isFunction,
  isDate,
  isMap,
  isSet,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  debounce,
  throttle,
  sleep,
  retry,
  memoize,
  flatten,
  unique,
  groupBy,
  chunk,
  deepClone,
  deepMerge,
  pick,
  omit,
  formatMatchScore,
  formatRating,
  formatDistance,
  formatSpeed,
  toSeconds,
  toMinutesSeconds,
  getMatchPeriodLabel,
  getTimeRange,
  addDays,
  getPaginationParams,
  safeJsonParse,
  safeJsonStringify,
};
