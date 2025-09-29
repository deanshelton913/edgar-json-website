import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/authorizers/CookieAuthorizerService';
import { UserComplianceService } from '@/services/UserComplianceService';
import { handleRouteError } from '@/lib/errors';
import { FailureByDesign } from '@/lib/errors/FailureByDesign';

export async function GET(request: NextRequest) {
  try {
    // Log request details for debugging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log(`[COMPLIANCE_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

    // Get the authenticated user
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest(request);

    if (!authResult.success || !authResult.userId) {
      throw FailureByDesign.unauthorized('Please log in to check compliance status');
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
    return handleRouteError(error, 'COMPLIANCE_ROUTE');
  }
}
