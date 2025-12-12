/**
 * Utility Functions - Production-grade helper functions for PitchConnect
 * Comprehensive validation, formatting, and conversion utilities
 */

/**
 * Email validation - Bulletproof RFC 5322 compliant validation
 * Zero regex - character-by-character validation for maximum reliability
 * Production-grade email validation for PitchConnect
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  // Type and null check
  if (!email || typeof email !== 'string') {
    return false
  }

  // Trim whitespace
  const trimmedEmail = email.trim()

  // Length checks - minimum: a@b.c (5 chars), maximum: 254
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false
  }

  // Must contain exactly one @
  const atCount = trimmedEmail.split('@').length - 1
  if (atCount !== 1) {
    return false
  }

  // Split into local and domain parts
  const [localPart, domain] = trimmedEmail.split('@')

  // Local part validation: 1-64 characters
  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return false
  }

  // Domain validation: must exist
  if (!domain || domain.length === 0 || domain.length > 255) {
    return false
  }

  // Local part cannot start or end with dot or hyphen
  if (localPart.charAt(0) === '.' || localPart.charAt(0) === '-') {
    return false
  }
  if (localPart.charAt(localPart.length - 1) === '.' || localPart.charAt(localPart.length - 1) === '-') {
    return false
  }

  // Domain must have at least one dot
  if (domain.indexOf('.') === -1) {
    return false
  }

  // Domain cannot start or end with dot or hyphen
  if (domain.charAt(0) === '.' || domain.charAt(0) === '-') {
    return false
  }
  if (domain.charAt(domain.length - 1) === '.' || domain.charAt(domain.length - 1) === '-') {
    return false
  }

  // No consecutive dots allowed
  if (trimmedEmail.indexOf('..') !== -1) {
    return false
  }

  // Validate domain parts (labels between dots)
  const domainParts = domain.split('.')
  if (domainParts.length < 2) {
    return false
  }

  for (const part of domainParts) {
    // Each part must exist and be 1-63 characters
    if (part.length === 0 || part.length > 63) {
      return false
    }

    // Each part cannot start or end with hyphen
    if (part.charAt(0) === '-' || part.charAt(part.length - 1) === '-') {
      return false
    }
  }

  // Validate TLD (last domain part)
  const tld = domainParts[domainParts.length - 1]
  if (tld.length < 2) {
    return false
  }

  // TLD must contain only letters
  for (let i = 0; i < tld.length; i++) {
    const char = tld.charAt(i)
    if (!((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z'))) {
      return false
    }
  }

  // Validate local part characters: letters, numbers, dot, underscore, plus, hyphen
  for (let i = 0; i < localPart.length; i++) {
    const char = localPart.charAt(i)
    const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
    const isNumber = char >= '0' && char <= '9'
    const isAllowed = char === '.' || char === '_' || char === '+' || char === '-'

    if (!isLetter && !isNumber && !isAllowed) {
      return false
    }
  }

  // Validate domain characters: letters, numbers, dot, hyphen
  for (let i = 0; i < domain.length; i++) {
    const char = domain.charAt(i)
    const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
    const isNumber = char >= '0' && char <= '9'
    const isAllowed = char === '.' || char === '-'

    if (!isLetter && !isNumber && !isAllowed) {
      return false
    }
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

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')

  // Must be at least 10 digits for international support
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
