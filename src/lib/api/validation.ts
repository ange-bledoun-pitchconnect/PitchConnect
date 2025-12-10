// ============================================================================
// src/lib/api/validation.ts - Input Validation & Parsing
// ============================================================================

import { BadRequestError, UnprocessableEntityError } from './errors';

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') || '25', 10), 1),
    100
  );

  return { page, limit };
}

/**
 * Parse and validate query search parameter
 */
export function parseSearchQuery(searchParams: URLSearchParams): string | null {
  const search = searchParams.get('search')?.trim();
  return search && search.length > 0 ? search : null;
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new BadRequestError('Missing required fields', {
      missing,
    });
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError('Invalid email format');
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestError('Password must contain uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new BadRequestError('Password must contain number');
  }
}

/**
 * Validate string field length
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value.length < min || value.length > max) {
    throw new BadRequestError(
      `${fieldName} must be between ${min} and ${max} characters`
    );
  }
}

/**
 * Validate age
 */
export function validateAge(dateOfBirth: Date, minAge: number): void {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const hasHadBirthday =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() &&
      today.getDate() >= dateOfBirth.getDate());

  const actualAge = hasHadBirthday ? age : age - 1;

  if (actualAge < minAge) {
    throw new BadRequestError(
      `Must be at least ${minAge} years old`
    );
  }
}

/**
 * Validate phone number (basic)
 */
export function validatePhoneNumber(phone: string): void {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw new BadRequestError('Invalid phone number format');
  }
}

/**
 * Validate Sport enum
 */
export function validateSport(sport: any): void {
  const validSports = [
    'FOOTBALL',
    'NETBALL',
    'RUGBY',
    'CRICKET',
    'AMERICAN_FOOTBALL',
    'BASKETBALL',
  ];
  if (!validSports.includes(sport)) {
    throw new BadRequestError('Invalid sport', {
      valid: validSports,
    });
  }
}

/**
 * Validate Position enum
 */
export function validatePosition(position: any): void {
  const validPositions = [
    // Football
    'GOALKEEPER',
    'DEFENDER',
    'MIDFIELDER',
    'FORWARD',
    // Netball
    'GOALKEEPER_NETBALL',
    'GOAL_ATTACK',
    'WING_ATTACK',
    'CENTER',
    'WING_DEFENSE',
    'GOAL_DEFENSE',
    'GOAL_SHOOTER',
    // Rugby
    'PROP',
    'HOOKER',
    'LOCK',
    'FLANKER',
    'NUMBER_8',
    'SCRUM_HALF',
    'FLY_HALF',
    'INSIDE_CENTER',
    'OUTSIDE_CENTER',
    'WINGER',
    'FULLBACK',
    // American Football
    'QUARTERBACK',
    'RUNNING_BACK',
    'WIDE_RECEIVER',
    'TACKLE',
    'GUARD',
    'CENTER_POSITION',
    'LINEBACKER',
    'SAFETY',
    'CORNERBACK',
    // Basketball
    'POINT_GUARD',
    'SHOOTING_GUARD',
    'SMALL_FORWARD',
    'POWER_FORWARD',
    'CENTER_BASKETBALL',
    // Cricket
    'BATSMAN',
    'BOWLER',
    'FIELDER',
    'WICKET_KEEPER',
  ];

  if (!validPositions.includes(position)) {
    throw new BadRequestError('Invalid position', {
      valid: validPositions,
    });
  }
}

/**
 * Parse JSON body safely
 */
export async function parseJsonBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch (error) {
    throw new BadRequestError('Invalid JSON in request body');
  }
}

/**
 * Validate date format (ISO 8601)
 */
export function validateDateFormat(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new BadRequestError('Invalid date format (use ISO 8601)');
  }
  return date;
}

/**
 * Validate object structure
 */
export function validateObjectSchema(
  data: any,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'date'>
): void {
  const errors: Record<string, string> = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      if (type === 'date') {
        validateDateFormat(value);
      } else if (typeof value !== type) {
        errors[key] = `Expected ${type}, got ${typeof value}`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new UnprocessableEntityError('Validation failed', errors);
  }
}
