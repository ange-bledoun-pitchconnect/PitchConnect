import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/utils/asyncHandler';
import { successResponse } from '@/lib/api/responses';
import { requireAuth } from '@/lib/api/middleware/auth';
import { validateBody } from '@/lib/api/middleware/validator';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { z } from 'zod';

// POST /api/matches/[matchId]/score - Update match score
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: { matchId: string } }) => {
    const user = await requireAuth();

    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    // Only referees or officials can update scores
    if (!['SUPERADMIN', 'REFEREE'].some(r => user.roles.includes(r as any))) {
      throw new Error('Only match officials can update scores');
    }

    const ScoreSchema = z.object({
      homeGoals: z.number().int().min(0).optional(),
      awayGoals: z.number().int().min(0).optional(),
      status: z.enum(['SCHEDULED', 'LIVE', 'HALFTIME', 'FINISHED']).optional(),
      homeGoalsET: z.number().int().min(0).optional(),
      awayGoalsET: z.number().int().min(0).optional(),
      homePenalties: z.number().int().min(0).optional(),
      awayPenalties: z.number().int().min(0).optional(),
    });

    const body = await validateBody(request, ScoreSchema.partial());

    if (!body.homeGoals && body.homeGoals !== 0 && !body.awayGoals && body.awayGoals !== 0 && !body.status) {
      throw new ValidationError('Must provide homeGoals, awayGoals, or status');
    }

    const updated = await prisma.match.update({
      where: { id: params.matchId },
      data: body,
    });

    // EMIT WEBSOCKET EVENT for score update

    return successResponse(updated, 200);
  }
);
