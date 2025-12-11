import { ZodSchema } from 'zod';
import { ValidationError } from '../errors';

export async function validateBody<T>(
  request: Request,
  schema: ZodSchema
): Promise<T> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return validated as T;
  } catch (error: any) {
    if (error.errors) {
      const details = Object.fromEntries(
        error.errors.map((e: any) => [
          e.path.join('.'),
          e.message,
        ])
      );
      throw new ValidationError('Invalid request body', details);
    }
    throw new ValidationError('Request body must be valid JSON');
  }
}

export async function validateQuery<T>(
  url: URL,
  schema: ZodSchema
): Promise<T> {
  try {
    const query = Object.fromEntries(url.searchParams);
    const validated = schema.parse(query);
    return validated as T;
  } catch (error: any) {
    if (error.errors) {
      const details = Object.fromEntries(
        error.errors.map((e: any) => [
          e.path.join('.'),
          e.message,
        ])
      );
      throw new ValidationError('Invalid query parameters', details);
    }
    throw new ValidationError('Invalid query parameters');
  }
}
