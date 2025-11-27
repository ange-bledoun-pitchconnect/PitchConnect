// src/app/api/superadmin/settings/route.ts
/**
 * SuperAdmin Settings API
 * PATCH - Update SuperAdmin settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdminSession, createAuditLog } from '@/lib/superadmin-helpers';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const body = await request.json();
    const { sessionTimeoutMinutes, ipWhitelist } = body;

    // TODO: Store settings in database or Redis
    // For now, store in environment or admin session

    await createAuditLog(admin.id, null, 'DATA_EXPORTED', {
      action: 'security_settings_updated',
      sessionTimeoutMinutes,
      ipWhitelist: ipWhitelist?.length || 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Settings updated successfully',
        data: {
          sessionTimeoutMinutes,
          ipWhitelistCount: ipWhitelist?.length || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Settings PATCH error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
```

---

## FILE 7: src/app/api/superadmin/settings/2fa/route.ts

```typescript
// src/app/api/superadmin/settings/2fa/route.ts
/**
 * 2FA Setup API
 * POST - Generate QR code for 2FA setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdminSession, createAuditLog } from '@/lib/superadmin-helpers';

// NOTE: Install speakeasy and qrcode packages
// npm install speakeasy qrcode

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();
    const body = await request.json();
    const { action } = body;

    if (action === 'enable') {
      // TODO: Implement with speakeasy/qrcode packages
      // For now, return mock QR code

      const mockQRCode =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await createAuditLog(admin.id, null, 'DATA_EXPORTED', {
        action: '2fa_qrcode_generated',
      });

      return NextResponse.json(
        {
          success: true,
          message: 'QR code generated',
          qrCode: mockQRCode,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[SuperAdmin] 2FA POST error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
```

---

## FILE 8: Update Prisma Schema (Add New Models)

```prisma
// Add to your existing schema.prisma

model AuditLog {
  id            String   @id @default(cuid())
  performedById String
  performedBy   User     @relation("AuditLogPerformedBy", fields: [performedById], references: [id])
  targetUserId  String?
  action        String
  details       String   @db.Text // JSON string
  timestamp     DateTime @default(now())

  @@index([performedById])
  @@index([targetUserId])
  @@index([timestamp])
  @@map("audit_logs")
}

model ImpersonationSession {
  id        String    @id @default(cuid())
  adminId   String
  admin     User      @relation("ImpersonationAdmin", fields: [adminId], references: [id])
  targetUserId String
  targetUser User    @relation("ImpersonationTarget", fields: [targetUserId], references: [id])
  startedAt DateTime  @default(now())
  endedAt   DateTime?
  ipAddress String?
  userAgent String?
  reason    String?

  @@index([adminId])
  @@index([targetUserId])
  @@index([startedAt])
  @@map("impersonation_sessions")
}

// Update User model to add relations
model User {
  // ... existing fields ...

  auditLogsPerformed     AuditLog[]                @relation("AuditLogPerformedBy")
  impersonationSessions  ImpersonationSession[]    @relation("ImpersonationAdmin")
  impersonationTargets   ImpersonationSession[]    @relation("ImpersonationTarget")
  twoFactorSecret        String?
  twoFactorEnabled       Boolean                   @default(false)
}