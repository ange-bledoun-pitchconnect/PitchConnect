/**
 * Email validation - RFC 5322 compliant
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false
  }

  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Additional validation
  const [localPart, domain] = email.split('@')

  if (!localPart || !domain) {
    return false
  }

  // Local part can't start or end with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false
  }

  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return false
  }

  // Domain can't start or end with dot or hyphen
  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
    return false
  }

  // Basic regex check
  return emailRegex.test(email)
}

export default isValidEmail
