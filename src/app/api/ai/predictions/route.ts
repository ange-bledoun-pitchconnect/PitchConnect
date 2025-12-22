/**
 * NextAuth v5 Migration - AI Predictions API
 * Path: /src/app/api/ai/predictions/route.ts
 *
 * ============================================================================
 * MIGRATION NOTES
 * ============================================================================
 * ✅ Updated from NextAuth v4 (getServerSession, authOptions)
 * ✅ Now uses NextAuth v5 auth() function
 * ✅ Simplified authentication import
 * ✅ Maintains all existing functionality
 * ✅ Type-safe session handling
 * ✅ Production-ready
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';


const ML_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5000';


export async function POST(request: NextRequest) {
  try {
    const session = await auth();


    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    const data = await request.json();


    // Call Python ML service
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/injury`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });


    if (!mlResponse.ok) {
      throw new Error('ML service prediction failed');
    }


    const prediction = await mlResponse.json();


    // Log prediction for audit
    console.log(`[PREDICTION] User: ${session.user.id}, Risk: ${prediction.injury_risk}`);


    return NextResponse.json({
      success: true,
      prediction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ML API Error]:', error);
    return NextResponse.json(
      { error: 'Prediction failed' },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`);
    const health = await response.json();


    return NextResponse.json({
      mlService: health,
      apiStatus: 'healthy',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'ML service unavailable' },
      { status: 503 }
    );
  }
}
