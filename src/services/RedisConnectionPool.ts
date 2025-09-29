import { injectable, inject } from "tsyringe";
import { createClient, RedisClientType } from "redis";
import { LoggingService } from "./LoggingService";

@injectable()
export class RedisConnectionSingleton {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  /**
   * Get the singleton Redis client, creating connection if needed
   */
  public async getClient(): Promise<RedisClientType> {
    if (this.isConnected && this.client) {
      return this.client;
    }

    if (this.connectionPromise) {
      await this.connectionPromise;
      return this.client!;
    }

    this.connectionPromise = this.createConnection();
    await this.connectionPromise;
    return this.client!;
  }

  /**
   * Create the Redis connection
   */
  private async createConnection(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL;
      this.loggingService.debug(`[REDIS_SINGLETON] Redis URL: ${redisUrl}`);
      
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      this.loggingService.debug(`[REDIS_SINGLETON] Creating singleton Redis connection with URL: ${redisUrl}`);
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.loggingService.error('[REDIS_SINGLETON] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        this.loggingService.error('[REDIS_SINGLETON] Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.loggingService.debug('[REDIS_SINGLETON] Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.loggingService.warn('[REDIS_SINGLETON] Disconnected from Redis');
        this.isConnected = false;
      });

      await this.client.connect();
      this.loggingService.info('[REDIS_SINGLETON] Singleton Redis connection established');
      
    } catch (error) {
      this.loggingService.error('[REDIS_SINGLETON] Failed to create Redis connection:', error);
      this.connectionPromise = null;
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Check if the connection is healthy
   */
  public async isHealthy(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      this.loggingService.error('[REDIS_SINGLETON] Health check failed:', error);
      return false;
    }
  }

  /**
   * Close the Redis connection
   */
  public async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.loggingService.info('[REDIS_SINGLETON] Singleton Redis connection closed');
      } catch (error) {
        this.loggingService.error('[REDIS_SINGLETON] Error closing Redis connection:', error);
      } finally {
        this.client = null;
        this.connectionPromise = null;
      }
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): { isConnected: boolean; hasClient: boolean } {
    return {
      isConnected: this.isConnected,
      hasClient: this.client !== null
    };
  }
}
