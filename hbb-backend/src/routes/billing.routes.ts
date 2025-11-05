// routes/billing.routes.ts - Billing routes for handling billing operations
import { Router } from 'express';
import { BillingController } from '../modules/billing/billing.controller';
import { verifyJwt } from '../middleware/verifyJwt';
import { BillingService } from '../modules/billing/billing.service';

const router = Router();
const billingService = new BillingService();
const billingController = new BillingController(billingService);

// Apply JWT verification to all billing routes
router.use(verifyJwt);

// Process bid payment when bid is accepted
router.post('/process-bid-payment/:bidId', (req, res) => {
  billingController.processBidPayment(req as any, res);
});

// Start call billing when both users join
router.post('/start-call-billing', (req, res) => {
  billingController.startCallBilling(req as any, res);
});

// End call billing when call ends
router.post('/end-call-billing', (req, res) => {
  billingController.endCallBilling(req as any, res);
});

// Handle payment failure
router.post('/handle-payment-failure/:billingSessionId', (req, res) => {
  billingController.handlePaymentFailure(req as any, res);
});

// Process refund
router.post('/process-refund/:billingSessionId', (req, res) => {
  billingController.processRefund(req as any, res);
});

// Get billing session by ID
router.get('/billing-session/:billingSessionId', (req, res) => {
  billingController.getBillingSession(req as any, res);
});

// Get user's billing sessions
router.get('/user-billing-sessions', (req, res) => {
  billingController.getUserBillingSessions(req as any, res);
});

// Health check endpoint
router.get('/health', (req, res) => {
  billingController.getHealthStatus(req, res);
});

export default router;
