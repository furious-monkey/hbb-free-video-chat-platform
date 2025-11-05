// backend/src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '../config/redis';

const router = Router();
const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: boolean;
    redis: boolean;
    mediasoup?: boolean;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  details?: any;
}

// Basic health check - used by AWS ECS health checks
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: await checkDatabase(),
        redis: await checkRedis(),
      },
      memory: getMemoryUsage(),
    };

    // Check MediaSoup if available
    try {
      const { MediasoupManager } = await import('../mediasoup/mediasoup.manager');
      // Assuming you have a singleton instance
      const mediasoupManager = (global as any).mediasoupManager as any;
      if (mediasoupManager) {
        healthStatus.services.mediasoup = mediasoupManager.isMediaSoupAvailable();
      }
    } catch (error) {
      // MediaSoup not initialized yet, that's okay
      healthStatus.services.mediasoup = false;
    }

    // Determine overall health status
    const allServicesHealthy = Object.values(healthStatus.services).every(service => service !== false);
    
    if (!allServicesHealthy) {
      healthStatus.status = 'degraded';
    }

    // Return appropriate HTTP status
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(httpStatus).json(healthStatus);
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: false,
        redis: false,
        mediasoup: false,
      },
      memory: getMemoryUsage(),
    });
  }
});

// Detailed health check - for monitoring and debugging
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: await checkDatabase(),
          details: await getDatabaseDetails(),
        },
        redis: {
          status: await checkRedis(),
          details: await getRedisDetails(),
        },
        mediasoup: await getMediaSoupDetails(),
      },
      system: {
        memory: getMemoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
      },
      networking: {
        ports: {
          http: process.env.PORT || 5000,
          mediasoup: {
            min: process.env.MEDIASOUP_MIN_PORT || 40000,
            max: process.env.MEDIASOUP_MAX_PORT || 49999,
          },
        },
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || 'auto-detect',
      },
    };

    res.status(200).json(detailedHealth);
    
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness probe - checks if the app is ready to serve traffic
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Basic readiness checks
    const databaseReady = await checkDatabase();
    const redisReady = await checkRedis();
    
    if (databaseReady && redisReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: databaseReady,
          redis: redisReady,
        },
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        services: {
          database: databaseReady,
          redis: redisReady,
        },
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe - checks if the app is alive
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Helper functions
async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    if (!redisClient.isOpen) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

async function getDatabaseDetails() {
  try {
    const result = await prisma.$queryRaw`SELECT version() as version` as any[];
    return {
      connected: true,
      version: result[0]?.version || 'unknown',
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function getRedisDetails() {
  try {
    const redisClient = getRedisClient();
    if (!redisClient.isOpen) {
      return { connected: false, error: 'Redis client not available' };
    }
    
    const info = await redisClient.info();
    const lines = info.split('\r\n');
    const version = lines.find((line: string) => line.startsWith('redis_version:'))?.split(':')[1];
    
    return {
      connected: true,
      version: version || 'unknown',
      status: redisClient.isOpen ? 'connected' : 'disconnected',
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function getMediaSoupDetails() {
  try {
    const { MediasoupManager } = await import('../mediasoup/mediasoup.manager');
    const mediasoupManager = (global as any).mediasoupManager as any;
    
    if (!mediasoupManager) {
      return {
        status: false,
        error: 'MediaSoup manager not initialized',
      };
    }

    return {
      status: mediasoupManager.isMediaSoupAvailable(),
      activeRooms: mediasoupManager.getActiveRooms?.() || [],
      workerCount: mediasoupManager.workers?.length || 0,
    };
  } catch (error) {
    return {
      status: false,
      error: error instanceof Error ? error.message : 'MediaSoup not available',
    };
  }
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  return {
    used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
  };
}

export default router;