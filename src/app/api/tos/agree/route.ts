import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { TosDataAccess } from '@/data-access';
import { UserDataAccess } from '@/data-access';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';

export async function POST(request: NextRequest) {
  try {
    console.log('[TOS_AGREE] Processing TOS agreement request');
    
    // Get the authenticated user's session using cookie authorization
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      console.log('[TOS_AGREE] Authentication failed:', authResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to agree to terms of service'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tosVersion } = body;

    if (!tosVersion) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing TOS version',
          message: 'TOS version is required'
        },
        { status: 400 }
      );
    }

    console.log(`[TOS_AGREE] User ${authResult.userId} agreeing to TOS version ${tosVersion}`);
    
    // Get the user's database record using the numeric ID
    const userDataAccess = container.resolve(UserDataAccess);
    const userData = await userDataAccess.getUserById(parseInt(authResult.userId!));
    
    if (!userData) {
      console.log(`[TOS_AGREE] User not found in database: ${authResult.userId}`);
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: 'User account not found. Please contact support.'
        },
        { status: 404 }
      );
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
    console.error('[TOS_AGREE] Error processing TOS agreement:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    console.log('[TOS_AGREE] Getting TOS agreement status');
    
    // Get the authenticated user's session using cookie authorization
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      console.log('[TOS_AGREE] Authentication failed:', authResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to check terms of service status'
        },
        { status: 401 }
      );
    }

    // Get the user's database record using the numeric ID
    const userDataAccess = container.resolve(UserDataAccess);
    const userData = await userDataAccess.getUserById(parseInt(authResult.userId!));
    
    if (!userData) {
      console.log(`[TOS_AGREE] User not found in database: ${authResult.userId}`);
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: 'User account not found. Please contact support.'
        },
        { status: 404 }
      );
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
    console.error('[TOS_AGREE] Error getting TOS agreement status:', error);
    
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
