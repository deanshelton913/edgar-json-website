import { NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { UserDataAccess } from '@/data-access';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { ApiKeyService } from '@/services/ApiKeyService';

export async function GET() {
  try {
    console.log('[API_KEY] Starting GET request');
    
    // Get the authenticated user's session using cookie authorization
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    console.log('[API_KEY] Authentication result:', authResult.success);

    if (!authResult.success) {
      console.log('[API_KEY] Authentication failed:', authResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to access your API key'
        },
        { status: 401 }
      );
    }

    console.log('[API_KEY] User ID from session:', authResult.userId);
    console.log('[API_KEY] User email from session:', authResult.email);
    
    // Get the user's database record using the numeric ID
    const userDataAccess = container.resolve(UserDataAccess);
    const userData = await userDataAccess.getUserById(parseInt(authResult.userId!));
    
    if (!userData) {
      console.log(`[API_KEY] User not found in database: ${authResult.userId}`);
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: 'User account not found. Please contact support.'
        },
        { status: 404 }
      );
    }
    
    console.log(`[API_KEY] Found user in database with ID: ${userData.id}`);
    
    // Get the API key service from the container
    const apiKeyService = container.resolve(ApiKeyService);
    
    console.log('[API_KEY] Getting API key for user');
    
    // Get the user's API key with tier information using the database user ID
    const apiKey = await apiKeyService.getApiKeyWithTier(userData.id);
    
    console.log('[API_KEY] API key result:', !!apiKey);
    
    if (apiKey) {
      return NextResponse.json({
        success: true,
        data: apiKey
      });
    } else {
      console.log('[API_KEY] No API key found for user');
      return NextResponse.json(
        { 
          success: false,
          error: 'No API key found',
          message: 'User does not have an API key'
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('[API_KEY] Error in GET request:', error);
    
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

export async function POST() {
  try {
    console.log('[API_KEY] Starting POST request');
    
    // Get the authenticated user's session using cookie authorization
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      console.log('[API_KEY] Authentication failed:', authResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to create an API key'
        },
        { status: 401 }
      );
    }

    console.log('[API_KEY] User ID from session:', authResult.userId);
    console.log('[API_KEY] User email from session:', authResult.email);
    
    // Get the user's database record using the numeric ID
    const userDataAccess = container.resolve(UserDataAccess);
    const userData = await userDataAccess.getUserById(parseInt(authResult.userId!));
    
    if (!userData) {
      console.log(`[API_KEY] User not found in database: ${authResult.userId}`);
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: 'User account not found. Please contact support.'
        },
        { status: 404 }
      );
    }
    
    console.log(`[API_KEY] Found user in database with ID: ${userData.id}`);
    
    // Get the API key service from the container
    const apiKeyService = container.resolve(ApiKeyService);
    
    // Check if user already has an API key using the database user ID
    const existingApiKey = await apiKeyService.getApiKeyWithTier(userData.id);
    
    if (existingApiKey) {
      console.log('[API_KEY] User already has an API key');
      return NextResponse.json(
        { 
          success: false,
          error: 'Conflict',
          message: 'User already has an API key'
        },
        { status: 409 }
      );
    }

    // Create API key with tier information based on user's subscription
    const newApiKey = await apiKeyService.createApiKeyWithTier(
      userData.id,
      authResult.email!
    );

    console.log('[API_KEY] Successfully created API key for user:', userData.id);

    return NextResponse.json({
      success: true,
      data: newApiKey
    }, { status: 201 });

  } catch (error) {
    console.error('[API_KEY] Error in POST request:', error);
    
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

