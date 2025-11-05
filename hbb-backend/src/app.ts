// app.ts - Enhanced application initialization with comprehensive error handling
import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import http from 'http';
import { BaseError } from './middleware/error/baseError';
import { ErrorHandler } from './middleware/error/errorHandler';
import { 
  connectRedis, 
  gracefulRedisShutdown, 
  checkRedisHealth, 
  isRedisConnected 
} from './config/redis';
import { setupGlobalErrorHandlers, errorHandler as globalErrorHandler } from './utils/errorHandling';

dotenv.config();

class Application {
  private app: express.Application;
  private server: http.Server;
  private errorHandler: ErrorHandler;
  private isShuttingDown = false;
  private gracefulShutdownTimeout = 30000; // 30 seconds
  private webSocketService: any; // Will be injected by loaders

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.errorHandler = new ErrorHandler(logger);
    
    // Set up global error handlers first
    setupGlobalErrorHandlers();
  }

  async initialize(): Promise<void> {
    console.log('🚀 Starting HBB Platform initialization...');
    
    try {
      // Initialize Redis with enhanced error handling
      await this.initializeRedis();
      
      // Load express configurations, routes, and WebSocket services
      await this.loadServices();
      
      // Set up error handling middleware
      this.setupErrorHandling();
      
      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
      
      console.log('🎉 HBB Platform initialization complete!');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      await this.cleanup();
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    console.log('🔄 Initializing Redis connection...');
    
    try {
      await connectRedis();
      
      // Check Redis health
      const health = await checkRedisHealth();
      if (health.connected) {
        console.log(`✅ Redis connected successfully (latency: ${health.latency}ms)`);
        if (health.version) {
          console.log(`📍 Redis version: ${health.version}`);
        }
        if (health.memoryUsage) {
          console.log(`💾 Redis memory usage: ${health.memoryUsage}`);
        }
      } else {
        console.warn('⚠️ Redis health check failed:', health.error);
      }
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      console.warn('⚠️ Application will continue without Redis (degraded mode)');
      // Don't throw - allow application to start without Redis
    }
  }

  private async loadServices(): Promise<void> {
    console.log('🔌 Loading express configurations, routes, and WebSocket services...');
    
    try {
      // Load all services including WebSocket
      const loaderResult = await require('./loaders').default({ 
        expressApp: this.app, 
        httpServer: this.server 
      });
      
      // Store reference to WebSocket service for cleanup
      if (loaderResult && loaderResult.webSocketService) {
        this.webSocketService = loaderResult.webSocketService;
      }
      
      console.log('✅ Services loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load services:', error);
      throw error;
    }
  }

  private setupErrorHandling(): void {
    console.log('🛡️ Setting up error handling middleware...');
    
    // Enhanced error handling middleware
    this.app.use(async (err: BaseError, req: Request, res: Response, next: NextFunction) => {
      try {
        // Log the error with context
        globalErrorHandler.handleError(err, {
          operation: 'express_middleware',
          metadata: {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
          }
        });

        if (!this.errorHandler.isTrustedError(err)) {
          console.error('❌ Untrusted error in Express middleware:', err);
          res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error',
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(err.statusCode).json({
            success: false,
            message: err.message,
            timestamp: new Date().toISOString(),
            ...(err.data && Object.keys(err.data).length > 0 && { data: err.data }),
          });
        }

        await this.errorHandler.handleError(err);
      } catch (handlingError) {
        console.error('❌ Error in error handling middleware:', handlingError);
        res.status(500).json({ 
          success: false, 
          message: 'Internal Server Error',
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log('✅ Error handling middleware configured');
  }

  private setupGracefulShutdown(): void {
    console.log('🛡️ Setting up graceful shutdown handlers...');
    
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        console.log('⚠️ Shutdown already in progress, forcing exit...');
        process.exit(1);
      }
      
      this.isShuttingDown = true;
      console.log(`🛑 Received ${signal}, starting graceful shutdown...`);
      
      // Set a timeout for forced shutdown
      const forceShutdownTimer = setTimeout(() => {
        console.error('❌ Graceful shutdown timeout, forcing exit...');
        process.exit(1);
      }, this.gracefulShutdownTimeout);
      
      try {
        await this.cleanup();
        clearTimeout(forceShutdownTimer);
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        clearTimeout(forceShutdownTimer);
        process.exit(1);
      }
    };
    
    // Handle various shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
    
    // Enhanced error handlers
    process.on('uncaughtException', async (error: Error) => {
      console.error('🚨 Uncaught Exception:', error);
      globalErrorHandler.handleError(error, { operation: 'uncaughtException' });
      
      try {
        await this.errorHandler.handleError(error);
        if (!this.errorHandler.isTrustedError(error)) {
          await gracefulShutdown('UNCAUGHT_EXCEPTION');
        }
      } catch (handlingError) {
        console.error('❌ Error handling uncaught exception:', handlingError);
        process.exit(1);
      }
    });

    process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      globalErrorHandler.handleError(reason, { operation: 'unhandledRejection' });
      
      // Convert to Error if it's not already
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      try {
        await this.errorHandler.handleError(error);
        if (!this.errorHandler.isTrustedError(error)) {
          await gracefulShutdown('UNHANDLED_REJECTION');
        }
      } catch (handlingError) {
        console.error('❌ Error handling unhandled rejection:', handlingError);
        process.exit(1);
      }
    });
    
    console.log('✅ Graceful shutdown handlers configured');
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Starting application cleanup...');
    
    const cleanupPromises: Promise<void>[] = [];
    
    // Stop WebSocket service
    if (this.webSocketService && typeof this.webSocketService.gracefulShutdown === 'function') {
      console.log('📡 Stopping WebSocket service...');
      cleanupPromises.push(
        this.webSocketService.gracefulShutdown().catch((error: any) => {
          console.error('❌ Error stopping WebSocket service:', error);
        })
      );
    }
    
    // Stop HTTP server
    console.log('🌐 Stopping HTTP server...');
    cleanupPromises.push(
      new Promise<void>((resolve) => {
        this.server.close((error) => {
          if (error) {
            console.error('❌ Error stopping HTTP server:', error);
          } else {
            console.log('✅ HTTP server stopped');
          }
          resolve();
        });
      })
    );
    
    // Close Redis connections
    console.log('🗄️ Closing Redis connections...');
    cleanupPromises.push(
      gracefulRedisShutdown().catch((error) => {
        console.error('❌ Error closing Redis connections:', error);
      })
    );
    
    // Stop global error handler
    cleanupPromises.push(
      (globalErrorHandler.gracefulShutdown as () => Promise<void>)().catch((error: unknown) => {
      console.error('❌ Error stopping error handler:', error);
      })
    );
    
    // Wait for all cleanup operations to complete
    try {
      await Promise.allSettled(cleanupPromises);
      console.log('✅ Application cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  async start(): Promise<void> {
    const PORT = process.env.PORT || 3000;
    
    // IMPORTANT: Use server.listen instead of app.listen
    // This ensures the HTTP server with Socket.IO attached is listening
    this.server.listen(PORT, () => {
      logger.info(`hbb service is running on port ${PORT}`);
      logger.info(`WebSocket/Socket.IO server is ready on port ${PORT}`);
      console.log('🎉 Application started successfully');
    });
  }

  // Health check endpoint
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
    timestamp: Date;
  }> {
    const services: Record<string, any> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check Redis health
    try {
      const redisHealth = await checkRedisHealth();
      services.redis = redisHealth;
      if (!redisHealth.connected) {
        overallStatus = 'degraded';
      }
    } catch (error) {
      services.redis = { connected: false, error: 'Health check failed' };
      overallStatus = 'degraded';
    }
    
    // Check WebSocket service health
    if (this.webSocketService && typeof this.webSocketService.getConnectionInfo === 'function') {
      try {
        services.websocket = this.webSocketService.getConnectionInfo();
      } catch (error) {
        services.websocket = { status: 'error', error: String(error) };
        overallStatus = 'degraded';
      }
    } else {
      services.websocket = { status: 'not_available' };
      overallStatus = 'degraded';
    }
    
    // Add error handler stats
    services.errorHandler = {
      errorStats: globalErrorHandler.getErrorStats(),
      isShuttingDown: this.isShuttingDown,
    };
    
    return {
      status: overallStatus,
      services,
      timestamp: new Date(),
    };
  }

  // Metrics for monitoring
  getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      isShuttingDown: this.isShuttingDown,
    };
    
    if (this.webSocketService && typeof this.webSocketService.getConnectionInfo === 'function') {
      try {
        metrics.websocket = this.webSocketService.getConnectionInfo();
      } catch (error) {
        metrics.websocket = { error: String(error) };
      }
    }
    
    metrics.errors = globalErrorHandler.getErrorStats();
    
    return metrics;
  }
}

// Main startup function
async function startApp(): Promise<Application> {
  try {
    console.log('🎬 Starting HBB Platform...');
    
    const app = new Application();
    await app.initialize();
    await app.start();
    
    return app;
  } catch (error) {
    console.error('💥 Failed to start HBB Platform:', error);
    throw error;
  }
}

// Enhanced startup with better error handling
startApp()
  .then((app) => {
    console.log('🎊 HBB Platform startup completed successfully!');
    
    // Optional: Set up health monitoring
    if (process.env.NODE_ENV === 'production') {
      // Log health status periodically in production
      setInterval(async () => {
        try {
          const health = await app.getHealthStatus();
          if (health.status !== 'healthy') {
            console.warn(`⚠️ Application health: ${health.status}`, {
              redis: health.services.redis?.connected,
              websocket: health.services.websocket?.totalConnections,
              errors: Object.keys(health.services.errorHandler?.errorStats || {}).length,
            });
          }
        } catch (error) {
          console.error('❌ Error checking health status:', error);
        }
      }, 60000); // Check every minute in production
    }
  })
  .catch((error) => {
    console.error('💥 Fatal error starting application:', error);
    
    // Log additional context for debugging
    console.error('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      REDIS_URL: process.env.REDIS_URL ? '[CONFIGURED]' : '[NOT CONFIGURED]',
    });
    
    process.exit(1);
  });

// Export for testing or programmatic use
export { Application, startApp };
export default Application;