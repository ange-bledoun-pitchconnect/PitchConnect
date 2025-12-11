import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.string().pipe(z.coerce.number().int().positive()).optional().default('1'),
  pageSize: z.string().pipe(z.coerce.number().int().min(1).max(100)).optional().default('20'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function getPaginationParams(query: PaginationQuery) {
  const page = Math.max(1, query.page);
  const pageSize = Math.min(100, Math.max(1, query.pageSize));

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
