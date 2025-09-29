import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { SubscriptionDataAccess } from '@/data-access/SubscriptionDataAccess';
import { UserDataAccess } from '@/data-access/UserDataAccess';
import { ApiKeyDataAccess } from '@/data-access/ApiKeyDataAccess';
import { ApiKeyCacheService } from '@/services/ApiKeyCacheService';
import { LoggingService } from '@/services/LoggingService';

export async function POST(request: NextRequest) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    // Authenticate user
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Convert string ID to number for database operations
    const userDbId = parseInt(userId, 10);
    if (isNaN(userDbId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get user's current subscription using database ID
    const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
    const subscription = await subscriptionDataAccess.getSubscriptionByUserId(userDbId);
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Only allow downgrade if subscription is canceled at period end
    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { success: false, error: 'Subscription is not canceled' },
        { status: 400 }
      );
    }

    // Downgrade API key to free tier
    const apiKeyDataAccess = container.resolve(ApiKeyDataAccess);
    const apiKeyCacheService = container.resolve('ApiKeyCacheService');
    
    // Get user's current API key info
    const currentApiKey = await apiKeyDataAccess.getApiKeyByUserId(userDbId);
    if (!currentApiKey) {
      return NextResponse.json(
        { success: false, error: 'No API key found' },
        { status: 404 }
      );
    }
    
    // Update API key tier to free
    await apiKeyDataAccess.updateApiKeyTier(userDbId, 'free', 10, 100);
    
    // Clear the cache so new limits take effect immediately
    await apiKeyCacheService.invalidateApiKey(currentApiKey.apiKey);

    loggingService.debug(`[DOWNGRADE_CANCELED] Downgraded API key for user ${userDbId} to free tier`);

    return NextResponse.json({
      success: true,
      message: 'API key downgraded to free tier. You will keep Pro billing access until the end of your current period.'
    });

  } catch (error) {
    loggingService.error(`[DOWNGRADE_CANCELED] Error downgrading canceled subscription: ${error}`);
    
    return NextResponse.json(
      { success: false, error: 'Failed to downgrade subscription' },
      { status: 500 }
    );
  }
}
