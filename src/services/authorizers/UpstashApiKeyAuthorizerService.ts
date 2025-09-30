import { NextRequest } from 'next/server';
import { UpstashRedisService } from '../UpstashRedisService';
import { UpstashRateLimitService } from '../rate-limiting/UpstashRateLimitService';

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  apiKey?: string;
  error?: string;
  message?: string;
}

/**
 * Upstash-compatible API key authorizer that works in Edge Runtime (middleware)
 * Uses HTTP-based Redis, so it's webpack-safe
 */
export class UpstashApiKeyAuthorizerService {
  private redisService: UpstashRedisService;
  private rateLimitService: UpstashRateLimitService;

  constructor() {
    this.redisService = new UpstashRedisService();
    this.rateLimitService = new UpstashRateLimitService();
  }

  async authorizeRequest(request: NextRequest): Promise<AuthResult> {
    try {
      // Extract API key from headers
      const apiKey = request.headers.get('x-api-key') || 
                    request.headers.get('authorization')?.replace('Bearer ', '');

      if (!apiKey) {
        return {
          success: false,
          error: 'Missing API key',
          message: 'API key is required'
        };
      }

      // Check rate limiting first
      const rateLimitResult = await this.rateLimitService.checkApiKeyLimit(apiKey);
      if (!rateLimitResult.success) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds`
        };
      }

      // Check if API key exists in cache
      const cacheKey = `api_key:${apiKey}`;
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        try {
          const apiKeyData = JSON.parse(cachedData);
          return {
            success: true,
            userId: apiKeyData.userId.toString(),
            email: apiKeyData.email,
            apiKey: apiKey
          };
        } catch (parseError) {
          console.error('[UPSTASH_API_KEY_AUTHORIZER] Failed to parse cached API key data:', parseError);
        }
      }

      // If not in cache, we need to validate against database
      // For Edge Runtime, we can't directly access the database
      // This is a limitation - we should fail securely
      console.warn(`[UPSTASH_API_KEY_AUTHORIZER] API key not found in cache: ${apiKey.substring(0, 10)}...`);
      return {
        success: false,
        error: 'Invalid API key',
        message: 'API key not found or invalid'
      };

    } catch (error) {
      console.error('[UPSTASH_API_KEY_AUTHORIZER] Authorization error:', error);
      return {
        success: false,
        error: 'Authorization failed',
        message: 'Internal server error'
      };
    }
  }
}
