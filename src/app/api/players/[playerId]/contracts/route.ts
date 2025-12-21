// ============================================================================
// FILE 2: src/app/api/players/[playerId]/contracts/route.ts
// GET /api/players/[playerId]/contracts
// ============================================================================

interface ContractsParams {
  params: { playerId: string };
}

export async function GET_CONTRACTS(
  request: NextRequest,
  { params }: ContractsParams
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] GET /api/players/${params.playerId}/contracts - Start`);

    const session = await auth();
    if (!session) {
      return Response.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Get all contracts for player
    const contracts = await prisma.contract.findMany({
      where: { playerId: params.playerId },
      select: {
        id: true,
        position: true,
        salary: true,
        currency: true,
        startDate: true,
        endDate: true,
        contractType: true,
        status: true,
        signingBonus: true,
        performanceBonus: true,
        releaseClause: true,
        notes: true,
        team: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    // Check authorization - only manager/admin or player can see salary details
    const canSeeSalary =
      session.user.id === contracts[0]?.team.id ||
      session.user.roles?.some((r) => ['MANAGER', 'SUPER_ADMIN'].includes(r));

    const sanitizedContracts = contracts.map((c) => ({
      ...c,
      salary: canSeeSalary ? c.salary : undefined,
      signingBonus: canSeeSalary ? c.signingBonus : undefined,
      performanceBonus: canSeeSalary ? c.performanceBonus : undefined,
      releaseClause: canSeeSalary ? c.releaseClause : undefined,
    }));

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] GET /api/players/${params.playerId}/contracts - Success`, {
      duration: Math.round(duration),
      contracts: contracts.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: sanitizedContracts,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'X-Request-ID': requestId, 'X-Response-Time': `${Math.round(duration)}ms` } }
    );
  } catch (error) {
    logger.error(`[${requestId}] GET /api/players/${params.playerId}/contracts - Error`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch contracts', code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
