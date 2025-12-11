import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/utils/asyncHandler';
import { successResponse } from '@/lib/api/responses';
import { requireAuth } from '@/lib/api/middleware/auth';
import { validateBody } from '@/lib/api/middleware/validator';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { z } from 'zod';

// POST /api/matches/[matchId]/submit-result
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: { matchId: string } }) => {
    const user = await requireAuth();

    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: { fixture: { include: { league: true } } },
    });

    if (!match) {
      throw new NotFoundError('Match', params.matchId);
    }

    if (match.status !== 'FINISHED') {
      throw new ValidationError('Match must be finished to submit result');
    }

    const ResultSchema = z.object({
      homeScore: z.number().int().min(0),
      awayScore: z.number().int().min(0),
      notes: z.string().optional(),
    });

    const body = await validateBody(request, ResultSchema);

    // Create result approval record
    const approval = await prisma.matchResultApproval.create({
      data: {
        matchId: params.matchId,
        submittedBy: user.id,
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        notes: body.notes,
        status: 'PENDING', // Awaits referee approval
      },
    });

    return successResponse(approval, 201);
  }
);
