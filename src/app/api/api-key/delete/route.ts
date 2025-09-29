import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { ApiKeyDataAccess } from '@/data-access/ApiKeyDataAccess';
import { UserDataAccess } from '@/data-access/UserDataAccess';
import { LoggingService } from '@/services/LoggingService';

export async function DELETE(request: NextRequest) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    // Authorize the request using cookie-based authentication
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      loggingService.warn('[API_KEY_DELETE] Unauthorized request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: authResult.message },
        { status: 401 }
      );
    }

    const userId = parseInt(authResult.userId!);
    loggingService.debug(`[API_KEY_DELETE] Deleting API key for user ID: ${userId}`);

    // Get the user to verify they exist
    const userDataAccess = container.resolve(UserDataAccess);
    const user = await userDataAccess.getUserById(userId);
    
    if (!user) {
      loggingService.warn(`[API_KEY_DELETE] User not found: ${userId}`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the API key
    const apiKeyDataAccess = container.resolve(ApiKeyDataAccess);
    await apiKeyDataAccess.deleteApiKeyByUserId(user.id);

    loggingService.info(`[API_KEY_DELETE] Successfully deleted API key for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    loggingService.error(`[API_KEY_DELETE] Error deleting API key: ${error}`);
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
