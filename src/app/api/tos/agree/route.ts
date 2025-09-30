import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { TosDataAccess } from '@/services/data-access/TosDataAccess';
import { UserDataAccess } from '@/services/data-access/UserDataAccess';
import { handleRouteError } from '@/lib/errors';
import { FailureByDesign } from '@/lib/errors/FailureByDesign';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      throw FailureByDesign.unauthorized('Please log in to agree to terms of service');
    }

    const body = await request.json();
    const { tosVersion } = body;

    if (!tosVersion) {
      throw FailureByDesign.badRequest('TOS version is required');
    }
    
    // Get the user's database record using the numeric ID
    const userDataAccess = container.resolve(UserDataAccess);
    const userData = await userDataAccess.getUserById(parseInt(userId));
    
    if (!userData) {
      console.log(`[TOS_AGREE] User not found in database: ${userId}`);
      throw FailureByDesign.notFound('User account not found. Please contact support.');
    }
    
    console.log(`[TOS_AGREE] Found user in database with ID: ${userData.id}`);
    
    // Get the TOS data access service
    const tosDataAccess = container.resolve(TosDataAccess);
    
    // Check if user has already agreed to this version
    const hasAgreed = await tosDataAccess.hasUserAgreedToTos(userData.id, tosVersion);
    
    if (hasAgreed) {
      console.log(`[TOS_AGREE] User ${userData.id} has already agreed to TOS version ${tosVersion}`);
      return NextResponse.json({
        success: true,
        message: 'User has already agreed to this version of the terms'
      });
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create TOS agreement record
    const agreement = await tosDataAccess.createTosAgreement({
      userId: userData.id,
      tosVersion: tosVersion,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    console.log(`[TOS_AGREE] Successfully created TOS agreement for user ${userData.id}, ID: ${agreement.id}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully agreed to terms of service',
      data: {
        agreementId: agreement.id,
        tosVersion: agreement.tosVersion,
        agreedAt: agreement.agreedAt,
      }
    });

  } catch (error) {
    return handleRouteError(error, 'TOS_AGREE_POST_ROUTE');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      throw FailureByDesign.unauthorized('Please log in to check terms of service status');
    }

    // Get the user's database record using the numeric ID
    const userDataAccess = container.resolve(UserDataAccess);
    const userData = await userDataAccess.getUserById(parseInt(userId));
    
    if (!userData) {
      console.log(`[TOS_AGREE] User not found in database: ${userId}`);
      throw FailureByDesign.notFound('User account not found. Please contact support.');
    }
    
    console.log(`[TOS_AGREE] Found user in database with ID: ${userData.id}`);
    
    // Get the TOS data access service
    const tosDataAccess = container.resolve(TosDataAccess);
    const currentVersion = tosDataAccess.getCurrentTosVersion();
    
    // Check if user has agreed to current version
    const hasAgreed = await tosDataAccess.hasUserAgreedToTos(userData.id, currentVersion);
    const latestAgreement = await tosDataAccess.getLatestTosAgreement(userData.id);

    console.log(`[TOS_AGREE] User ${userData.id} TOS status - hasAgreed: ${hasAgreed}, currentVersion: ${currentVersion}`);

    return NextResponse.json({
      success: true,
      data: {
        hasAgreedToCurrentVersion: hasAgreed,
        currentTosVersion: currentVersion,
        latestAgreement: latestAgreement ? {
          tosVersion: latestAgreement.tosVersion,
          agreedAt: latestAgreement.agreedAt,
        } : null,
      }
    });

  } catch (error) {
    return handleRouteError(error, 'TOS_AGREE_GET_ROUTE');
  }
}
