import { verifySuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { UpgradeRequestStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate status enum
    const validStatuses: UpgradeRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    let status: UpgradeRequestStatus = 'PENDING';
    
    if (validStatuses.includes(statusParam as UpgradeRequestStatus)) {
      status = statusParam as UpgradeRequestStatus;
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.upgradeRequest.findMany({
        where: { status },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.upgradeRequest.count({ where: { status } }),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Upgrade Requests Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, action } = body; // action: APPROVE | REJECT

    if (!requestId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const upgradeRequest = await prisma.upgradeRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (action === 'APPROVE') {
      // Update user role
      await prisma.user.update({
        where: { id: upgradeRequest.userId },
        data: {
          roles: Array.from(new Set([...(upgradeRequest.user.roles || []), upgradeRequest.requestedRole])),
        },
      });

      // Update request status
      await prisma.upgradeRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: session.user.id },
      });

      console.log(`✅ Approved role upgrade for ${upgradeRequest.user.email}`);
    } else {
      // Just reject
      await prisma.upgradeRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: session.user.id },
      });

      console.log(`❌ Rejected role upgrade for ${upgradeRequest.user.email}`);
    }

    return NextResponse.json({
      success: true,
      message: `Role upgrade ${action.toLowerCase()}ed`,
    });
  } catch (error) {
    console.error('❌ Process Upgrade Request Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
