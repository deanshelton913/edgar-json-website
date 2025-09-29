import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { UserComplianceService } from '@/services/UserComplianceService';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authenticated',
          message: 'Please log in to check compliance status'
        },
        { status: 401 }
      );
    }

    // Check user compliance
    const complianceService = container.resolve(UserComplianceService);
    const complianceResult = await complianceService.checkUserCompliance(authResult.userId);

    return NextResponse.json({
      success: true,
      isCompliant: complianceResult.isCompliant,
      requirements: complianceResult.requirements,
      userId: complianceResult.userId
    });

  } catch (error) {
    console.error('[API_COMPLIANCE] Error checking compliance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
