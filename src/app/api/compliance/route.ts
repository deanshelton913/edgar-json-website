import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { UserComplianceService } from '@/services/UserComplianceService';
import { handleRouteError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check user compliance
    const complianceService = container.resolve(UserComplianceService);
    const complianceResult = await complianceService.checkUserCompliance(userId);

    return NextResponse.json({
      success: true,
      isCompliant: complianceResult.isCompliant,
      requirements: complianceResult.requirements,
      userId: complianceResult.userId
    });

  } catch (error) {
    return handleRouteError(error, 'COMPLIANCE_ROUTE');
  }
}
