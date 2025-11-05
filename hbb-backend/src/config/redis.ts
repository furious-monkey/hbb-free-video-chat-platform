// config/redis.ts - Simplified Redis configuration that works with all Redis versions
import { createClient } from 'redis';

let redisClient: any = null;
let isConnecting = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 5;
const reconnectDelay = 5000; // 5 seconds

export async function connectRedis(): Promise<any> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    while (isConnecting && connectionAttempts < maxConnectionAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }
  }

  isConnecting = true;

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`🔄 [Redis] Attempting to connect to: ${redisUrl.replace(/:[^:@]*@/, ':***@')}`);

    if (!redisClient) {
      // Simplified Redis client configuration
      redisClient = createClient({ 
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            console.log(`🔄 [Redis] Reconnection attempt ${retries}`);
            if (retries > maxConnectionAttempts) {
              console.error('❌ [Redis] Max reconnection attempts reached');
              return false;
            }
            return Math.min(retries * 1000, 5000);
          },
          connectTimeout: 10000,
        },
        // Only add disableOfflineQueue if it exists
        ...(typeof createClient !== 'undefined' && 'disableOfflineQueue' in createClient ? { disableOfflineQueue: true } : {}),
      });

      // Enhanced event listeners with better error handling
      redisClient.on('error', (err: Error) => {
        console.error('❌ [Redis] Client Error:', err.message);
        connectionAttempts++;
        
        // Handle specific Redis connection errors
        if (err.message.includes('ECONNREFUSED')) {
          console.error('❌ [Redis] Connection refused - Redis server may not be running');
        } else if (err.message.includes('ENOTFOUND')) {
          console.error('❌ [Redis] Host not found - Check Redis URL');
        } else if (err.message.includes('ETIMEDOUT')) {
          console.error('❌ [Redis] Connection timeout - Redis server may be overloaded');
        } else if (err.message.includes('closed')) {
          console.error('❌ [Redis] Connection closed unexpectedly');
        }
      });

      redisClient.on('connect', () => {
        console.log('✅ [Redis] Connection established successfully');
        connectionAttempts = 0;
      });

      redisClient.on('ready', () => {
        console.log('🟢 [Redis] Client ready for commands');
      });

      redisClient.on('reconnecting', () => {
        console.log('🔄 [Redis] Reconnecting...');
      });

      redisClient.on('end', () => {
        console.log('🔚 [Redis] Connection ended gracefully');
      });

      // Handle unexpected disconnections
      redisClient.on('disconnect', () => {
        console.warn('⚠️ [Redis] Client disconnected unexpectedly');
      });
    }

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // Test the connection with a simple ping
    const pingResult = await redisClient.ping();
    if (pingResult === 'PONG') {
      console.log('✅ [Redis] Connection test successful');
    } else {
      throw new Error('Redis ping failed - unexpected response');
    }

    return redisClient;
  } catch (error) {
    console.error('❌ [Redis] Connection failed:', error instanceof Error ? error.message : error);
    connectionAttempts++;
    
    if (connectionAttempts >= maxConnectionAttempts) {
      console.error(`❌ [Redis] Failed to connect after ${maxConnectionAttempts} attempts`);
      // Don't throw here to allow graceful degradation
      console.warn('⚠️ [Redis] Application will continue without Redis cache');
      return null;
    }
    
    // Don't schedule automatic retry here to prevent infinite loops
    throw error;
  } finally {
    isConnecting = false;
  }
}

export function getRedisClient(): any {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      if (redisClient.isOpen) {
        await redisClient.quit();
        console.log('✅ [Redis] Client disconnected gracefully');
      }
    } catch (error) {
      console.error('❌ [Redis] Error during graceful disconnect:', error);
      // Force close if graceful quit fails
      try {
        if (redisClient.isOpen) {
          await redisClient.disconnect();
          console.log('✅ [Redis] Client force-disconnected');
        }
      } catch (forceError) {
        console.error('❌ [Redis] Force disconnect also failed:', forceError);
      }
    } finally {
      redisClient = null;
    }
  }
}

export async function isRedisConnected(): Promise<boolean> {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    
    // Use a timeout for the ping to avoid hanging
    const pingPromise = redisClient.ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Ping timeout')), 3000)
    );
    
    await Promise.race([pingPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.error('❌ [Redis] Health check failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function safeRedisOperation<T>(
  operation: (client: any) => Promise<T>,
  fallback?: T,
  operationName?: string
): Promise<T | undefined> {
  try {
    if (!redisClient || !redisClient.isOpen) {
      console.warn(`⚠️ [Redis] Client not available for operation: ${operationName || 'unknown'}`);
      return fallback;
    }
    
    // Add timeout to prevent hanging operations
    const operationPromise = operation(redisClient);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Redis operation timeout')), 5000)
    );
    
    return await Promise.race([operationPromise, timeoutPromise]);
  } catch (error) {
    console.error(`❌ [Redis] Operation failed (${operationName || 'unknown'}):`, error instanceof Error ? error.message : error);
    
    // If it's a connection error, mark client as problematic
    if (error instanceof Error && 
        (error.message.includes('closed') || 
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('ENOTFOUND') ||
         error.message.includes('timeout'))) {
      console.warn('⚠️ [Redis] Connection issue detected, client may need reconnection');
    }
    
    return fallback;
  }
}

// Graceful shutdown handler
export async function gracefulRedisShutdown(): Promise<void> {
  console.log('🛑 [Redis] Starting graceful shutdown...');
  
  try {
    await disconnectRedis();
    console.log('✅ [Redis] Graceful shutdown completed');
  } catch (error) {
    console.error('❌ [Redis] Error during graceful shutdown:', error);
  }
}

// Health check function with detailed diagnostics
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
  memoryUsage?: string;
  version?: string;
}> {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return { connected: false, error: 'Client not connected' };
    }

    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;

    // Get additional info if possible
    let memoryUsage: string | undefined;
    let version: string | undefined;

    try {
      const info = await redisClient.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      if (memoryMatch) {
        memoryUsage = memoryMatch[1];
      }
    } catch (infoError) {
      console.warn('⚠️ [Redis] Could not get memory info:', infoError);
    }

    try {
      const serverInfo = await redisClient.info('server');
      const versionMatch = serverInfo.match(/redis_version:([^\r\n]+)/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } catch (versionError) {
      console.warn('⚠️ [Redis] Could not get version info:', versionError);
    }

    return { 
      connected: true, 
      latency,
      memoryUsage,
      version
    };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper function to ensure Redis is connected before performing operations
export async function ensureRedisConnection(): Promise<boolean> {
  try {
    if (await isRedisConnected()) {
      return true;
    }
    
    console.log('🔄 [Redis] Attempting to reconnect...');
    const client = await connectRedis();
    return client !== null && client.isOpen;
  } catch (error) {
    console.error('❌ [Redis] Failed to ensure connection:', error);
    return false;
  }
}

// Simplified connection pool
export class RedisConnectionPool {
  private clients: Map<string, any> = new Map();
  private isShuttingDown = false;
  
  async getClient(name: string = 'default'): Promise<any> {
    if (this.isShuttingDown) {
      console.warn('⚠️ [Redis Pool] Pool is shutting down, cannot provide client');
      return null;
    }

    if (this.clients.has(name)) {
      const client = this.clients.get(name);
      if (client && client.isOpen) {
        return client;
      } else {
        console.warn(`⚠️ [Redis Pool] Client ${name} is closed, removing from pool`);
        this.clients.delete(name);
      }
    }
    
    try {
      const client = await this.createClient();
      if (client) {
        this.clients.set(name, client);
        return client;
      }
    } catch (error) {
      console.error(`❌ [Redis Pool] Failed to create client ${name}:`, error);
    }
    
    return null;
  }
  
  private async createClient(): Promise<any> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const client = createClient({ 
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 3) return false;
            return Math.min(retries * 1000, 3000);
          },
          connectTimeout: 10000,
        },
      });
      
      // Add error handler to prevent unhandled errors
      client.on('error', (error: Error) => {
        console.error(`❌ [Redis Pool] Client error:`, error.message);
      });
      
      await client.connect();
      return client;
    } catch (error) {
      console.error('❌ [Redis Pool] Failed to create client:', error);
      return null;
    }
  }
  
  async closeAll(): Promise<void> {
    console.log('🛑 [Redis Pool] Closing all connections...');
    this.isShuttingDown = true;
    
    const promises = Array.from(this.clients.entries()).map(async ([name, client]) => {
      try {
        if (client && client.isOpen) {
          await client.quit();
        }
        console.log(`✅ [Redis Pool] Closed connection: ${name}`);
      } catch (error) {
        console.error(`❌ [Redis Pool] Error closing ${name}:`, error);
        // Try force disconnect
        try {
          if (client && client.isOpen) {
            await client.disconnect();
          }
        } catch (forceError) {
          console.error(`❌ [Redis Pool] Force disconnect failed for ${name}:`, forceError);
        }
      }
    });
    
    await Promise.allSettled(promises);
    this.clients.clear();
    console.log('✅ [Redis Pool] All connections closed');
  }

  getConnectionCount(): number {
    return this.clients.size;
  }

  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.clients.forEach((client, name) => {
      status[name] = client && client.isOpen;
    });
    return status;
  }
}

// Export a default pool instance
export const redisPool = new RedisConnectionPool();

// Retry mechanism for critical Redis operations
export async function retryRedisOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName?: string
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`❌ [Redis] Attempt ${attempt}/${maxRetries} failed for ${operationName || 'operation'}:`, error);
      
      if (attempt === maxRetries) {
        console.error(`❌ [Redis] All ${maxRetries} attempts failed for ${operationName || 'operation'}`);
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  return null;
}

// Simple duplicate function for compatibility
export function createRedisClient(): any {
  if (!redisClient) {
    throw new Error('Main Redis client not initialized');
  }
  
  try {
    return redisClient.duplicate();
  } catch (error) {
    console.error('❌ [Redis] Failed to duplicate client:', error);
    // Fallback: create a new client
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    return createClient({ url: redisUrl });
  }
}