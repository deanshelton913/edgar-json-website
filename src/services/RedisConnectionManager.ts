import { injectable, inject } from "tsyringe";
import { createClient, RedisClientType } from "redis";
import { LoggingService } from "./LoggingService";

/**
 * Singleton Redis Connection Manager
 * Ensures only one Redis connection exists across the entire application
 * Designed for serverless environments - closes connections after each use
 */
@injectable()
export class RedisConnectionManager {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private isConnecting = false;
  private static instance: RedisConnectionManager | null = null;

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {
    // No shutdown handlers needed in serverless environment
    // Connections are managed per-route
  }

  /**
   * Get the singleton instance of RedisConnectionManager
   */
  public static getInstance(loggingService: LoggingService): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager(loggingService);
    }
    return RedisConnectionManager.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    if (RedisConnectionManager.instance) {
      RedisConnectionManager.instance.close();
    }
    RedisConnectionManager.instance = null;
  }

  /**
   * Get the Redis client (will initialize if not already connected)
   * For serverless environments - use getClientWithAutoClose instead
   */
  public async getClient(): Promise<RedisClientType> {
    // If we have a connected client, return it
    if (this.isConnected && this.client) {
      try {
        // Test the connection with a ping
        await this.client.ping();
        this.loggingService.debug('[REDIS] Reusing existing healthy connection');
        return this.client;
      } catch (error) {
        this.loggingService.warn('[REDIS] Connection test failed, will reconnect:', error);
        this.isConnected = false;
        this.client = null;
      }
    }

    // If we're already connecting, wait for that connection
    if (this.isConnecting) {
      this.loggingService.debug('[REDIS] Connection already in progress, waiting...');
      // Wait for connection to complete
      while (this.isConnecting && !this.isConnected) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.isConnected && this.client) {
        return this.client;
      }
    }

    this.loggingService.info('[REDIS] Creating new connection...');
    await this.createConnection();
    
    if (!this.isConnected || !this.client) {
      throw new Error('Failed to establish Redis connection');
    }
    
    this.loggingService.info('[REDIS] New connection created successfully');
    return this.client;
  }

  /**
   * Execute a function with Redis client and automatically close connection after use
   * This is the recommended method for serverless environments
   */
  public async withClient<T>(operation: (client: RedisClientType) => Promise<T>): Promise<T> {
    this.loggingService.debug('[REDIS] Starting withClient operation');
    const client = await this.getClient();
    try {
      const result = await operation(client);
      this.loggingService.debug('[REDIS] Operation completed successfully');
      return result;
    } finally {
      // Always close the connection after use in serverless
      this.loggingService.info('[REDIS] Closing connection after operation');
      await this.forceClose();
    }
  }

  /**
   * Force close the Redis connection immediately
   * Used in serverless environments to ensure cleanup
   */
  public async forceClose(): Promise<void> {
    if (this.client) {
      try {
        this.loggingService.info('[REDIS] Force closing Redis connection');
        await this.client.quit();
        this.loggingService.info('[REDIS] Redis connection force closed successfully');
      } catch (error) {
        this.loggingService.warn('[REDIS] Error during force close:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.loggingService.debug('[REDIS] Connection state reset');
      }
    } else {
      this.loggingService.debug('[REDIS] No client to close');
    }
  }

  /**
   * Create the Redis connection
   */
  private async createConnection(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      this.loggingService.debug('[REDIS] Connection already in progress, waiting...');
      return;
    }

    this.loggingService.debug('[REDIS] Starting connection...');
    this.isConnecting = true;
    
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      this.loggingService.debug(`[REDIS] Connecting to Redis...`);
      
      // Clean up any existing client before creating a new one
      if (this.client) {
        this.loggingService.debug('[REDIS] Cleaning up existing client...');
        try {
          await this.client.quit();
        } catch (error) {
          this.loggingService.warn('[REDIS] Error closing existing client:', error);
        }
        this.client = null;
      }
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              this.loggingService.error('[REDIS] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff with jitter
            const delay = Math.min(retries * 200 + Math.random() * 100, 2000);
            this.loggingService.debug(`[REDIS] Reconnection attempt ${retries}, waiting ${delay}ms`);
            return delay;
          },
          connectTimeout: 10000
        }
      });

      this.client.on('error', (err) => {
        this.loggingService.error('[REDIS] Redis error:', err);
        this.isConnected = false;
        // Don't reset isConnecting here as the connection attempt might still be ongoing
      });

      this.client.on('connect', () => {
        this.loggingService.debug('[REDIS] Connected to Redis');
        this.isConnected = true;
        // Don't set isConnecting = false here, wait for 'ready' event
      });

      this.client.on('disconnect', () => {
        this.loggingService.warn('[REDIS] Disconnected from Redis');
        this.isConnected = false;
        this.isConnecting = false;
      });

      this.client.on('ready', () => {
        this.loggingService.debug('[REDIS] Redis client ready');
        this.isConnected = true;
        this.isConnecting = false;
      });

      await this.client.connect();
      this.loggingService.info('[REDIS] Redis connection established');
      
    } catch (error) {
      this.loggingService.error('[REDIS] Failed to create Redis connection:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.client = null;
      throw error;
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
      this.loggingService.error('[REDIS] Health check failed:', error);
      return false;
    }
  }

  /**
   * Close the Redis connection
   */
  public async close(): Promise<void> {
    this.loggingService.info('[REDIS] Closing Redis connection...');
    
    if (this.client) {
      try {
        await this.client.quit();
        this.loggingService.info('[REDIS] Redis connection closed');
      } catch (error) {
        this.loggingService.error('[REDIS] Error closing Redis connection:', error);
      }
    }
    
    // Reset all state
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): { isConnected: boolean; hasClient: boolean; isConnecting: boolean } {
    return {
      isConnected: this.isConnected,
      hasClient: this.client !== null,
      isConnecting: this.isConnecting
    };
  }

  /**
   * Force reset the connection state (useful for error recovery)
   */
  public resetConnection(): void {
    this.loggingService.warn('[REDIS] Forcing connection reset');
    this.isConnected = false;
    this.isConnecting = false;
    
    if (this.client) {
      try {
        this.client.quit();
      } catch (error) {
        this.loggingService.warn('[REDIS] Error during forced quit:', error);
      }
      this.client = null;
    }
  }

}