// backend/src/loaders/websocket.ts - Fixed WebSocket loader with all required methods
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import {
  initWebSocketService,
  getWebSocketService,
} from '../websocket/WebSocketServiceInstance';
import { MediasoupManager } from '../mediasoup/mediasoup.manager';
import { StripePaymentProvider } from '../providers/stripe.provider';
import { PaymentService } from '../modules/payment/payment.service';
import { StreamingRepository } from '../modules/streaming/streaming.repository';
import { StreamingService } from '../modules/streaming/streaming.service';
import { BidService } from '../modules/bid/bid.service';
import { BidRepository } from '../modules/bid/bid.repository';
import { GiftService } from '../modules/gift/gift.service';
import { EarningsService } from '../modules/earnings/earnings.service';
import { BillingService } from '../modules/billing/billing.service';

export default async ({ httpServer }: { httpServer: Server }) => {
  try {
    // Initialize database
    console.log('🗄️  Connecting to database...');
    const prisma = new PrismaClient();

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize payment provider
    console.log('💳 Initializing payment services...');
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    const stripeProvider = new StripePaymentProvider(stripeSecretKey, prisma);
    const paymentService = new PaymentService(stripeProvider);
    console.log('✅ Payment services initialized');

    // Initialize MediaSoup manager first (without WebSocketService initially)
    console.log('🎥 Initializing MediaSoup manager...');
    const mediasoupManager = new MediasoupManager();
    await mediasoupManager.init();
    console.log('✅ MediaSoup manager initialized');

    // Initialize WebSocket service using singleton pattern
    console.log('🔌 Initializing WebSocket service...');
    const webSocketService = initWebSocketService(httpServer, mediasoupManager);
    console.log('✅ WebSocket service initialized');

    // Now inject WebSocketService into MediasoupManager to complete the circular dependency
    console.log('🔗 Injecting WebSocketService into MediasoupManager...');
    mediasoupManager.setWebSocketService(webSocketService);
    console.log('✅ WebSocketService injected into MediasoupManager');

    // Initialize repositories
    console.log('📂 Initializing repositories...');
    const streamingRepository = new StreamingRepository(prisma);
    const bidRepository = new BidRepository(prisma);
    console.log('✅ Repositories initialized');

    // Initialize services with proper dependencies
    console.log('📺 Initializing streaming services...');

    // Create billing service first (other services depend on it)
    const billingService = new BillingService();
    
    // Inject services into billing service
    billingService.injectServices(paymentService, webSocketService, stripeProvider);

    // Create bid service first (it depends on repositories and websocket service)
    const bidService = new BidService(
      bidRepository,
      streamingRepository,
      webSocketService,
      paymentService,
      billingService,
    );

    // Create gift service
    const giftService = new GiftService(paymentService);

    const earningsService = new EarningsService();

    // Create streaming service (depends on bidService)
    const streamingService = new StreamingService(
      streamingRepository,
      paymentService,
      webSocketService,
      bidService,
      earningsService,
      billingService,
    );

    console.log('✅ Streaming services initialized');

    // Create a proper streaming service interface implementation with ALL required methods
    const streamingServiceInterface = {
      createStreamSession:
        streamingService.createStreamSession.bind(streamingService),
      getStreamSession:
        streamingService.getStreamSession.bind(streamingService),
      endStreamSession:
        streamingService.endStreamSession.bind(streamingService),
      updateStreamSettings:
        streamingService.updateStreamSettings.bind(streamingService),
      getInfluencerActiveSession:
        streamingService.getInfluencerActiveSession.bind(streamingService),
      getLiveStreams: streamingService.getLiveStreams.bind(streamingService),
      getStreamBids: streamingService.getStreamBids.bind(streamingService),
      getStreamGifts: streamingService.getStreamGifts.bind(streamingService),
      sendGift: streamingService.sendGift.bind(streamingService),
      getGiftTypes: streamingService.getGiftTypes.bind(streamingService),
      placeBid: streamingService.placeBid.bind(streamingService),
      acceptBid: streamingService.acceptBid.bind(streamingService),
      rejectBid: streamingService.rejectBid.bind(streamingService),
      getInfluencers: streamingService.getInfluencers.bind(streamingService),
      startCallBilling: streamingService.startCallBilling.bind(streamingService),
      getInfluencerByUsername:
        streamingService.getInfluencerByUsername.bind(streamingService),
    };

    // Inject proper service implementations into WebSocket service
    console.log('🔗 Injecting service dependencies into WebSocketService...');
    webSocketService.injectServices(
      streamingServiceInterface, // Proper streaming service implementation with all methods
      paymentService,
      bidService,
      billingService,
      mediasoupManager,
    );
    console.log('✅ Service dependencies injected into WebSocketService');

    // Setup additional WebSocket event handlers
    setupAdditionalWebSocketHandlers(webSocketService, {
      prisma,
      streamingService,
      bidService,
      giftService,
      paymentService,
      mediasoupManager,
    });

    // Setup graceful shutdown handlers
    setupGracefulShutdown({
      prisma,
      webSocketService,
      mediasoupManager,
    });

    // Setup periodic cleanup of stale MediaSoup rooms
    setInterval(async () => {
      try {
        await mediasoupManager.cleanupStaleRooms();
      } catch (error) {
        console.error('Error during periodic MediaSoup cleanup:', error);
      }
    }, 60000); // Run every minute

    console.log('🎊 All WebSocket services initialized successfully!');

    return {
      webSocketService,
      mediasoupManager,
      streamingService,
      paymentService,
      bidService,
      giftService,
    };
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket services:', error);
    throw error;
  }
};

function setupAdditionalWebSocketHandlers(
  webSocketService: any,
  services: {
    prisma: PrismaClient;
    streamingService: any;
    bidService: any;
    giftService: any;
    paymentService: any;
    mediasoupManager: any;
  },
) {
  const io = webSocketService.getServer();

  // Add custom event handlers that don't fit in the main service
  io.on('connection', (socket: any) => {
    console.log(`New WebSocket connection: ${socket.id}`);

    // Handle platform statistics requests
    socket.on('get_platform_stats', async (callback: any) => {
      try {
        const stats = {
          totalUsers: await services.prisma.user.count(),
          activeStreams: await services.prisma.streamSession.count({
            where: { status: 'LIVE' },
          }),
          totalConnections:
            webSocketService.getConnectionInfo().totalConnections,
          serverTime: new Date().toISOString(),
        };

        if (callback) callback({ success: true, stats });
      } catch (error: any) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Handle user presence updates
    socket.on('update_presence', async (data: any) => {
      try {
        if (socket.data.userId) {
          await services.prisma.user.update({
            where: { id: socket.data.userId },
            data: { isOnline: data.isOnline },
          });

          // Broadcast presence update to relevant users
          socket.broadcast.emit('USER_PRESENCE_UPDATED', {
            userId: socket.data.userId,
            isOnline: data.isOnline,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    });

    // Handle typing indicators for chat
    socket.on('typing_start', (data: any) => {
      if (socket.data.userId && socket.data.sessionId) {
        socket.to(`stream:${data.sessionId}`).emit('USER_TYPING', {
          userId: socket.data.userId,
          sessionId: data.sessionId,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', (data: any) => {
      if (socket.data.userId && socket.data.sessionId) {
        socket.to(`stream:${data.sessionId}`).emit('USER_TYPING', {
          userId: socket.data.userId,
          sessionId: data.sessionId,
          isTyping: false,
        });
      }
    });

    // Handle disconnection - Fixed to use socket.data properly
    socket.on('disconnect', async (reason: any) => {
      console.log(`[WebSocket] Socket ${socket.id} disconnected: ${reason}`);

      // Check if the socket has user and session data for MediaSoup cleanup
      if (socket.data && socket.data.userId && socket.data.sessionId) {
        console.log(
          `[WebSocket] Cleaning up MediaSoup resources for user ${socket.data.userId} in stream ${socket.data.sessionId}`,
        );
        try {
          await services.mediasoupManager.removePeer(
            socket.data.sessionId,
            socket.data.userId,
          );
        } catch (error) {
          console.error(
            `[WebSocket] Error removing peer on disconnect:`,
            error,
          );
        }
      }
    });
  });

  console.log('✅ Additional WebSocket handlers set up');
}

function setupGracefulShutdown(services: {
  prisma: PrismaClient;
  webSocketService: any;
  mediasoupManager: any;
}) {
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

    try {
      // 1. Stop accepting new connections
      console.log('📡 Stopping WebSocket server...');
      services.webSocketService.getServer().close();

      // 2. Close all MediaSoup rooms
      console.log('🎥 Closing MediaSoup rooms...');
      await services.mediasoupManager.closeAllStreamRooms();

      // 3. Close database connections
      console.log('🗄️  Closing database connections...');
      await services.prisma.$disconnect();

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });

  console.log('✅ Graceful shutdown handlers set up');
}
