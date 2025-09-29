import { injectable, inject } from "tsyringe";
import { LoggingService } from "./LoggingService";
import { RedisConnectionSingleton } from "./RedisConnectionSingleton";

@injectable()
export class RedisConnectionManager {
  private isShuttingDown = false;

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("RedisConnectionSingleton") private redisSingleton: RedisConnectionSingleton,
  ) {
    this.setupShutdownHandlers();
  }

  /**
   * Setup process signal handlers for graceful shutdown
   */
  private setupShutdownHandlers(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.loggingService.info(`[REDIS_MANAGER] Received ${signal}, starting graceful shutdown...`);
        await this.gracefulShutdown();
      });
    });

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', async (error) => {
      this.loggingService.error('[REDIS_MANAGER] Uncaught exception:', error);
      await this.gracefulShutdown();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      this.loggingService.error('[REDIS_MANAGER] Unhandled rejection at:', promise, 'reason:', reason);
      await this.gracefulShutdown();
      process.exit(1);
    });

    // Handle process exit
    process.on('exit', () => {
      this.loggingService.info('[REDIS_MANAGER] Process exiting...');
    });

    this.loggingService.info('[REDIS_MANAGER] Shutdown handlers registered');
  }

  /**
   * Gracefully close all Redis connections
   */
  private async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      this.loggingService.warn('[REDIS_MANAGER] Shutdown already in progress, skipping...');
      return;
    }

    this.isShuttingDown = true;
    this.loggingService.info('[REDIS_MANAGER] Starting graceful shutdown of Redis connection...');

    try {
      await this.redisSingleton.close();
      this.loggingService.info('[REDIS_MANAGER] Redis connection closed successfully');
    } catch (error) {
      this.loggingService.error('[REDIS_MANAGER] Error during shutdown:', error);
    }
  }

  /**
   * Manually trigger shutdown (useful for testing)
   */
  public async shutdown(): Promise<void> {
    await this.gracefulShutdown();
  }
}
