// utils/errorHandling.ts - Comprehensive error handling utilities
import { safeRedisOperation } from '../config/redis';

export interface ErrorContext {
  operation: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, number> = new Map();
  private isShuttingDown = false;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle and log errors with context
  handleError(error: any, context: ErrorContext): void {
    const errorKey = `${context.operation}:${context.userId || 'unknown'}`;
    const currentTime = Date.now();
    
    // Track error frequency
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    this.lastErrorTime.set(errorKey, currentTime);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`❌ [ErrorHandler] ${context.operation} failed:`, {
      error: errorMessage,
      context,
      errorCount: count + 1,
      stack: errorStack,
    });

    // Check if this error is happening too frequently
    if (count > 5) {
      console.error(`🚨 [ErrorHandler] High error frequency detected for ${errorKey}`);
    }

    // Log to external monitoring service if available
    this.logToMonitoring(error, context).catch(() => {
      // Silently fail if monitoring is not available
    });
  }

  // Retry mechanism with exponential backoff
  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context: ErrorContext
  ): Promise<T | null> {
    const retryConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      ...config,
    };

    let lastError: any;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        this.handleError(error, {
          ...context,
          metadata: { ...context.metadata, attempt },
        });

        if (attempt === retryConfig.maxAttempts) {
          console.error(`❌ [ErrorHandler] All ${retryConfig.maxAttempts} attempts failed for ${context.operation}`);
          break;
        }

        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );

        console.log(`⏳ [ErrorHandler] Retrying ${context.operation} in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxAttempts})`);
        await this.sleep(delay);
      }
    }

    return null;
  }

  // Safe operation wrapper that catches and handles errors
  async safeOperation<T>(
    operation: () => Promise<T>,
    fallback: T | (() => T),
    context: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    }
  }

  // Circuit breaker pattern
  async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    failureThreshold: number = 5,
    timeoutMs: number = 60000
  ): Promise<T | null> {
    const operationKey = context.operation;
    const errorCount = this.errorCounts.get(operationKey) || 0;
    const lastErrorTime = this.lastErrorTime.get(operationKey) || 0;
    const timeSinceLastError = Date.now() - lastErrorTime;

    // Check if circuit is open
    if (errorCount >= failureThreshold && timeSinceLastError < timeoutMs) {
      console.warn(`⚠️ [ErrorHandler] Circuit breaker OPEN for ${operationKey} (${errorCount} failures)`);
      return null;
    }

    // If enough time has passed, reset the circuit
    if (timeSinceLastError >= timeoutMs) {
      this.errorCounts.delete(operationKey);
      this.lastErrorTime.delete(operationKey);
      console.log(`✅ [ErrorHandler] Circuit breaker RESET for ${operationKey}`);
    }

    try {
      const result = await operation();
      // Reset error count on success
      this.errorCounts.delete(operationKey);
      this.lastErrorTime.delete(operationKey);
      return result;
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }

  // Graceful degradation for Redis operations
  async safeRedisWithFallback<T>(
    redisOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T> | T,
    context: ErrorContext
  ): Promise<T> {
    try {
      // First try Redis operation with timeout
      const result = await safeRedisOperation(
        async (client) => await redisOperation(),
        undefined,
        context.operation
      );

      if (result !== undefined) {
        return result;
      }
    } catch (error) {
      this.handleError(error, { ...context, operation: `redis_${context.operation}` });
    }

    // Fallback to alternative implementation
    console.log(`🔄 [ErrorHandler] Using fallback for ${context.operation}`);
    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      this.handleError(fallbackError, { ...context, operation: `fallback_${context.operation}` });
      throw fallbackError;
    }
  }

  // Timeout wrapper
  async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: ErrorContext
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation ${context.operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }

  // Bulk operation with partial failure handling
  async bulkOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    context: ErrorContext,
    maxConcurrency: number = 5
  ): Promise<{ success: Array<{ item: T; result: R }>; failed: Array<{ item: T; error: any }> }> {
    const results: {
      success: Array<{ item: T; result: R }>;
      failed: Array<{ item: T; error: any }>;
    } = { success: [], failed: [] };
    
    // Process items in batches to control concurrency
    for (let i = 0; i < items.length; i += maxConcurrency) {
      const batch = items.slice(i, i + maxConcurrency);
      
      const promises = batch.map(async (item) => {
        try {
          const result = await operation(item);
          return { success: true as const, item, result };
        } catch (error) {
          this.handleError(error, {
            ...context,
            metadata: { ...context.metadata, item },
          });
          return { success: false as const, item, error };
        }
      });

      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.success.push({
              item: result.value.item,
              result: result.value.result,
            });
          } else {
            results.failed.push({
              item: result.value.item,
              error: result.value.error,
            });
          }
        }
      });
    }

    return results;
  }

  // Cleanup and reset error tracking
  cleanup(): void {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }

  // Get error statistics
  getErrorStats(): Record<string, { count: number; lastError: Date }> {
    const stats: Record<string, { count: number; lastError: Date }> = {};
    
    this.errorCounts.forEach((count, key) => {
      const lastErrorTime = this.lastErrorTime.get(key) || Date.now();
      stats[key] = {
        count,
        lastError: new Date(lastErrorTime),
      };
    });

    return stats;
  }

  // Graceful shutdown
  async gracefulShutdown(): Promise<void> {
    console.log('🛑 [ErrorHandler] Starting graceful shutdown...');
    this.isShuttingDown = true;
    
    // Log final error statistics
    const stats = this.getErrorStats();
    if (Object.keys(stats).length > 0) {
      console.log('📊 [ErrorHandler] Final error statistics:', stats);
    }

    this.cleanup();
    console.log('✅ [ErrorHandler] Graceful shutdown completed');
  }

  // Private methods
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logToMonitoring(error: any, context: ErrorContext): Promise<void> {
    // Implement external monitoring service integration here
    // This could be Sentry, DataDog, CloudWatch, etc.
    try {
      // Example: await monitoringService.logError(error, context);
    } catch (monitoringError) {
      // Don't let monitoring errors affect the main application
      console.warn('⚠️ [ErrorHandler] Failed to log to monitoring service:', monitoringError);
    }
  }
}

// Utility functions for common error handling patterns
export const errorHandler = ErrorHandler.getInstance();

export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string,
  context: Partial<ErrorContext> = {}
): Promise<T> {
  return errorHandler.safeOperation(
    operation,
    fallback,
    { operation: operationName, ...context }
  );
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryConfig?: Partial<RetryConfig>,
  context: Partial<ErrorContext> = {}
): Promise<T | null> {
  return errorHandler.withRetry(
    operation,
    retryConfig,
    { operation: operationName, ...context }
  );
}

export async function circuitBreakerOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Partial<ErrorContext> = {}
): Promise<T | null> {
  return errorHandler.withCircuitBreaker(
    operation,
    { operation: operationName, ...context }
  );
}

// Global unhandled error handlers
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    console.error('🚨 [Global] Uncaught Exception:', error);
    errorHandler.handleError(error, { operation: 'uncaughtException' });
    
    // Give some time for cleanup then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 [Global] Unhandled Rejection at:', promise, 'reason:', reason);
    errorHandler.handleError(reason, { operation: 'unhandledRejection' });
  });

  console.log('✅ [ErrorHandler] Global error handlers set up');
}

// Application-specific error types
export class RedisConnectionError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'RedisConnectionError';
  }
}

export class WebSocketError extends Error {
  constructor(message: string, public socketId?: string, public userId?: string) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export class StreamingError extends Error {
  constructor(message: string, public sessionId?: string, public operation?: string) {
    super(message);
    this.name = 'StreamingError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(service: string) {
    super(`${service} is currently unavailable`);
    this.name = 'ServiceUnavailableError';
  }
}