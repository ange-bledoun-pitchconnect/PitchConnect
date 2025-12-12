/**
 * Utility Functions - Production-grade helper functions for PitchConnect
 * Comprehensive validation, formatting, and conversion utilities
 */

/**
 * Email validation - Ultra-simple bulletproof validator
 * Zero regex complexity - character-by-character validation
 * Production-grade email validation for PitchConnect
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const e = email.trim()
  if (e.length < 5 || e.length > 254) return false
  if (e.split('@').length !== 2) return false
  const [local, domain] = e.split('@')
  if (!local || local.length > 64 || local[0] === '.' || local[0] === '-' || local[local.length - 1] === '.' || local[local.length - 1] === '-') return false
  if (!domain || domain.length > 255 || !domain.includes('.') || domain[0] === '.' || domain[0] === '-' || domain[domain.length - 1] === '.' || domain[domain.length - 1] === '-') return false
  if (e.includes('..')) return false
  const parts = domain.split('.')
  if (parts.length < 2) return false
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (!p || p.length > 63 || p[0] === '-' || p[p.length - 1] === '-') return false
  }
  const tld = parts[parts.length - 1]
  if (tld.length < 2) return false
  for (let i = 0; i < tld.length; i++) {
    const c = tld[i]
    if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))) return false
  }
  for (let i = 0; i < local.length; i++) {
    const c = local[i]
    const ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || '._+-'.includes(c)
    if (!ok) return false
  }
  for (let i = 0; i < domain.length; i++) {
    const c = domain[i]
    const ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || '.-'.includes(c)
    if (!ok) return false
  }
  return true
}

/**
 * Format number with thousands separator and decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places (default: 2)
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 2, locale = 'en-US') => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format currency value
 * @param {number} value - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted currency
 */
export const formatCurrency = (value, currency = 'USD', locale = 'en-US') => {
  if (typeof value !== 'number' || isNaN(value)) {
    return `$0.00`
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format date to readable string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format style ('short', 'medium', 'long', 'full')
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'medium', locale = 'en-US') => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (!(dateObj instanceof Date) || isNaN(dateObj)) {
      return ''
    }

    const formatOptions = {
      short: { year: '2-digit', month: '2-digit', day: '2-digit' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    }

    return new Intl.DateTimeFormat(locale, formatOptions[format] || formatOptions.medium).format(dateObj)
  } catch {
    return ''
  }
}

/**
 * Format time to readable string
 * @param {Date|string|number} date - Date/time to format
 * @param {boolean} includeSeconds - Include seconds (default: false)
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted time
 */
export const formatTime = (date, includeSeconds = false, locale = 'en-US') => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (!(dateObj instanceof Date) || isNaN(dateObj)) {
      return ''
    }

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    }).format(dateObj)
  } catch {
    return ''
  }
}

/**
 * Calculate days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Days between dates
 */
export const daysBetween = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate

    if (!(start instanceof Date) || !(end instanceof Date)) {
      return 0
    }

    const msPerDay = 24 * 60 * 60 * 1000
    return Math.floor((end - start) / msPerDay)
  } catch {
    return 0
  }
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false
  }

  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  return /^\+?[\d]{10,}$/.test(cleaned)
}

/**
 * Format phone number to consistent format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return ''
  }

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  return phone
}

/**
 * Slugify string for URLs
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
export const slugify = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Capitalize first letter of string
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalize = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @param {string} suffix - Suffix (default: '...')
 * @returns {string} Truncated text
 */
export const truncate = (text, length = 50, suffix = '...') => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  if (text.length <= length) {
    return text
  }

  return text.slice(0, length - suffix.length) + suffix
}

/**
 * Parse JSON safely
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch {
    return obj
  }
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} Whether object is empty
 */
export const isEmpty = (obj) => {
  if (!obj) {
    return true
  }

  if (Array.isArray(obj)) {
    return obj.length === 0
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0
  }

  return false
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

export default {
  isValidEmail,
  formatNumber,
  formatCurrency,
  formatDate,
  formatTime,
  daysBetween,
  isValidPhone,
  formatPhone,
  slugify,
  capitalize,
  truncate,
  safeJsonParse,
  deepClone,
  isEmpty,
  debounce,
  throttle,
}
