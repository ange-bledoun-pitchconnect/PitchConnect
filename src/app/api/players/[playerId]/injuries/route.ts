// ============================================================================
// src/app/api/players/[playerId]/injuries/route.ts
// GET /api/players/[playerId]/injuries
// ============================================================================

interface InjuriesParams {
  params: { playerId: string };
}

export async function GET_INJURIES(
  request: NextRequest,
  { params }: InjuriesParams
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    logger.info(`[${requestId}] GET /api/players/${params.playerId}/injuries - Start`);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Get all injuries
    const injuries = await prisma.injury.findMany({
      where: { playerId: params.playerId },
      select: {
        id: true,
        type: true,
        severity: true,
        dateFrom: true,
        dateTo: true,
        estimatedReturn: true,
        status: true,
        description: true,
        medicalNotes: true,
        treatmentPlan: true,
        reportedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dateFrom: 'desc' },
    });

    // Filter medical notes based on role
    const isMedicalStaff = session.user.roles?.includes('MEDICAL_STAFF');
    const isAdmin = session.user.roles?.includes('SUPER_ADMIN');

    const sanitizedInjuries = injuries.map((inj) => ({
      ...inj,
      medicalNotes: isMedicalStaff || isAdmin ? inj.medicalNotes : undefined,
      treatmentPlan: isMedicalStaff || isAdmin ? inj.treatmentPlan : undefined,
      reportedBy: isMedicalStaff || isAdmin ? inj.reportedBy : undefined,
    }));

    // Calculate injury stats
    const activeInjuries = injuries.filter((i) => !i.dateTo).length;
    const totalInjuries = injuries.length;
    const avgRecoveryDays =
      injuries
        .filter((i) => i.dateTo)
        .reduce((sum, i) => {
          const days = Math.floor(
            (i.dateTo!.getTime() - i.dateFrom.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / (injuries.filter((i) => i.dateTo).length || 1);

    const duration = performance.now() - startTime;
    logger.info(`[${requestId}] GET /api/players/${params.playerId}/injuries - Success`, {
      duration: Math.round(duration),
      activeInjuries,
      totalInjuries,
    });

    return NextResponse.json(
      {
        success: true,
        data: sanitizedInjuries,
        summary: {
          activeInjuries,
          totalInjuries,
          averageRecoveryDays: Math.round(avgRecoveryDays),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'X-Request-ID': requestId, 'X-Response-Time': `${Math.round(duration)}ms` } }
    );
  } catch (error) {
    logger.error(`[${requestId}] GET /api/players/${params.playerId}/injuries - Error`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch injuries', code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
