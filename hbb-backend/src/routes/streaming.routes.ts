// Fixed routes/streaming.routes.ts - Use singleton properly
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StreamingController } from '../modules/streaming/streaming.controller';
import { StreamingService } from '../modules/streaming/streaming.service';
import { StreamingRepository } from '../modules/streaming/streaming.repository';
import { PaymentService } from '../modules/payment/payment.service';
import { BidService } from '../modules/bid/bid.service';
import { BidController } from '../modules/bid/bid.controller';
import { authWithTTL } from '../middleware/authWithTTL';
import { getWebSocketService } from '../websocket/WebSocketServiceInstance';
import { StripePaymentProvider } from '../providers/stripe.provider';
import { EarningsService } from '../modules/earnings/earnings.service';
import { BillingService } from '../modules/billing/billing.service';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    // Add other user properties as needed
  };
}

const router = Router();

// Function to initialize routes with proper dependencies
const initializeStreamingRoutes = () => {
  // Instantiate dependencies
  const prisma = new PrismaClient();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

  const paymentProvider = new StripePaymentProvider(stripeSecretKey, prisma);
  const paymentService = new PaymentService(paymentProvider);
  
  // Get the singleton WebSocket service instance
  const webSocketService = getWebSocketService();
  
  const streamingRepository = new StreamingRepository(prisma);
  const bidRepository = new (require('../modules/bid/bid.repository').BidRepository)(prisma);
  const earningsService = new EarningsService();
  const billingService = new BillingService();
  billingService.injectServices(paymentService, webSocketService, paymentProvider);
  const bidService = new BidService(
    bidRepository,
    streamingRepository,
    webSocketService,
    paymentService,
    billingService
  );
  const streamingService = new StreamingService(streamingRepository, paymentService, webSocketService, bidService, earningsService, billingService);
  const streamingController = new StreamingController(streamingService);
  const bidController = new BidController(bidService);

  return {
    streamingController,
    bidController,
    webSocketService
  };
};

// Lazy initialization to ensure WebSocket service is ready
let controllers: any = null;

const getControllers = () => {
  if (!controllers) {
    controllers = initializeStreamingRoutes();
  }
  return controllers;
};

// Stream Management Routes
router.post('/start', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.createStreamSession(req, res);
});

router.post('/join', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.joinStreamSession(req, res);
});

router.post('/end', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.endStreamSession(req, res);
});

// Stream Information Routes
router.get('/session/:id', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.getStreamSession(req, res);
});

router.get('/live', (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.getLiveStreams(req, res);
});

router.patch('/session/:id/settings', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.updateStreamSettings(req, res);
});

// Bidding Routes
router.post('/bid', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.placeBid(req, res);
});

router.get('/session/:id/bids', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.getStreamBids(req, res);
});

router.post('/bid/:id/accept', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.acceptBid(req, res);
});

router.post('/bid/:id/reject', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.rejectBid(req, res);
});

// Gift Routes
router.post('/gift', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.sendGift(req, res);
});

router.get('/gift/types', (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.getGiftTypes(req, res);
});

router.get('/session/:id/gifts', authWithTTL, (req: Request, res: Response) => {
  const { streamingController } = getControllers();
  return streamingController.getStreamGifts(req, res);
});

// WebRTC Signaling Routes (if needed for fallback)
router.post('/signal', authWithTTL, async (req: Request, res: Response) => {
  try {
    const { sessionId, targetUserId, signal, type } = req.body;
    const user = (req as AuthenticatedRequest).user;
    const { webSocketService } = getControllers();

    // Use the emitToUser method with proper event typing
    webSocketService.emitToUser(targetUserId, 'STREAM_SIGNAL', {
      sessionId,
      from: user.id,
      signal,
      type
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;