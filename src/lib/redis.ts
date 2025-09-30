import { container } from "./container-server";
import { RedisConnectionManager } from "@/services/RedisConnectionManager";
import { LoggingService } from "@/services/LoggingService";
import { RedisClientType } from "redis";

/**
 * Get the singleton Redis connection manager instance
 * This ensures we only have one Redis connection across the entire application
 */
export function getRedisManager(): RedisConnectionManager {
  const loggingService = container.resolve<LoggingService>("LoggingService");
  return RedisConnectionManager.getInstance(loggingService);
}

/**
 * Execute a Redis operation with automatic connection cleanup
 * This is the recommended way to use Redis in serverless environments
 */
export async function withRedis<T>(operation: (client: RedisClientType) => Promise<T>): Promise<T> {
  const redisManager = getRedisManager();
  return redisManager.withClient(operation);
}

/**
 * Initialize Redis connection for a route handler
 * Call this at the start of each route that uses Redis
 */
export async function initializeRedisForRoute(): Promise<void> {
  const redisManager = getRedisManager();
  const loggingService = container.resolve<LoggingService>("LoggingService");
  
  loggingService.info('[ROUTE] Initializing Redis connection for route handler');
  
  // Force close any existing connection first
  await redisManager.forceClose();
  
  // Create a new connection
  await redisManager.getClient();
  
  loggingService.info('[ROUTE] Redis connection initialized for route handler');
}

/**
 * Cleanup Redis connection for a route handler
 * Call this at the end of each route that uses Redis
 */
export async function cleanupRedisForRoute(): Promise<void> {
  const redisManager = getRedisManager();
  const loggingService = container.resolve<LoggingService>("LoggingService");
  
  loggingService.info('[ROUTE] Cleaning up Redis connection for route handler');
  
  // Force close the connection
  await redisManager.forceClose();
  
  loggingService.info('[ROUTE] Redis connection cleaned up for route handler');
}
