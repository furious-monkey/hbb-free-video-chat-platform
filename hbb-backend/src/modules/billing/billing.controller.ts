// modules/billing/billing.controller.ts - Billing controller for handling billing operations
import { Request, Response } from 'express';
import { BillingService } from './billing.service';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    userRole?: string;
    email?: string;
  };
}

export class BillingController {
  constructor(private billingService: BillingService) {
    console.log('💳 BillingController initialized');
  }

  // Process bid payment when bid is accepted
  async processBidPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('💳 [BillingController] Process bid payment request:', req.params);

      const bidId = req.params.bidId;
      const userId = req.user.id;

      if (!bidId) {
        res.status(400).json({
          success: false,
          message: 'Bid ID is required',
          code: 'MISSING_BID_ID',
        });
        return;
      }

      const result = await this.billingService.processBidPayment(bidId);

      if (result.success) {
        console.log('✅ [BillingController] Bid payment processed successfully:', bidId);
        res.status(200).json(result);
      } else {
        console.log('❌ [BillingController] Bid payment processing failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BillingController] Error processing bid payment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Start call billing when both users join
  async startCallBilling(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🎬 [BillingController] Start call billing request:', req.body);

      const { streamSessionId, explorerId, influencerId, bidId, bidAmount } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!streamSessionId || !explorerId || !influencerId || !bidId || !bidAmount) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: streamSessionId, explorerId, influencerId, bidId, bidAmount',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      // Validate that the user is either the explorer or influencer
      if (userId !== explorerId && userId !== influencerId) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to start billing for this call',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const result = await this.billingService.startCallBilling({
        streamSessionId,
        explorerId,
        influencerId,
        bidId,
        bidAmount
      });

      if (result.success) {
        console.log('✅ [BillingController] Call billing started successfully:', streamSessionId);
        res.status(200).json(result);
      } else {
        console.log('❌ [BillingController] Call billing start failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BillingController] Error starting call billing:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // End call billing when call ends
  async endCallBilling(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🏁 [BillingController] End call billing request:', req.body);

      const { streamSessionId, duration, reason } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!streamSessionId || duration === undefined || !reason) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: streamSessionId, duration, reason',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      // Validate reason
      if (!['completed', 'disconnected', 'cancelled'].includes(reason)) {
        res.status(400).json({
          success: false,
          message: 'Invalid reason. Must be: completed, disconnected, or cancelled',
          code: 'INVALID_REASON',
        });
        return;
      }

      const result = await this.billingService.endCallBilling({
        streamSessionId,
        duration,
        reason
      });

      if (result.success) {
        console.log('✅ [BillingController] Call billing ended successfully:', streamSessionId);
        res.status(200).json(result);
      } else {
        console.log('❌ [BillingController] Call billing end failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BillingController] Error ending call billing:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Handle payment failure
  async handlePaymentFailure(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('❌ [BillingController] Handle payment failure request:', req.params);

      const billingSessionId = req.params.billingSessionId;
      const { reason } = req.body;

      if (!billingSessionId) {
        res.status(400).json({
          success: false,
          message: 'Billing session ID is required',
          code: 'MISSING_BILLING_SESSION_ID',
        });
        return;
      }

      const result = await this.billingService.handlePaymentFailure(
        billingSessionId,
        reason || 'Payment failed'
      );

      if (result.success) {
        console.log('✅ [BillingController] Payment failure handled successfully:', billingSessionId);
        res.status(200).json(result);
      } else {
        console.log('❌ [BillingController] Payment failure handling failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BillingController] Error handling payment failure:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Process refund
  async processRefund(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('💰 [BillingController] Process refund request:', req.params);

      const billingSessionId = req.params.billingSessionId;
      const { reason } = req.body;

      if (!billingSessionId) {
        res.status(400).json({
          success: false,
          message: 'Billing session ID is required',
          code: 'MISSING_BILLING_SESSION_ID',
        });
        return;
      }

      const result = await this.billingService.processRefund(
        billingSessionId,
        reason || 'Refund requested'
      );

      if (result.success) {
        console.log('✅ [BillingController] Refund processed successfully:', billingSessionId);
        res.status(200).json(result);
      } else {
        console.log('❌ [BillingController] Refund processing failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BillingController] Error processing refund:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get billing session by ID
  async getBillingSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BillingController] Get billing session request:', req.params);

      const billingSessionId = req.params.billingSessionId;
      const userId = req.user.id;

      if (!billingSessionId) {
        res.status(400).json({
          success: false,
          message: 'Billing session ID is required',
          code: 'MISSING_BILLING_SESSION_ID',
        });
        return;
      }

      const billingSession = await this.billingService.getBillingSession(billingSessionId);

      if (!billingSession) {
        res.status(404).json({
          success: false,
          message: 'Billing session not found',
          code: 'BILLING_SESSION_NOT_FOUND',
        });
        return;
      }

      // Check if user is authorized to view this billing session
      if (billingSession.explorerId !== userId && billingSession.influencerId !== userId && req.user.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to view this billing session',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      console.log('✅ [BillingController] Billing session retrieved successfully:', billingSessionId);
      res.status(200).json({
        success: true,
        billingSession,
      });
    } catch (error: any) {
      console.error('❌ [BillingController] Error getting billing session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get user's billing sessions
  async getUserBillingSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BillingController] Get user billing sessions request');

      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const billingSessions = await this.billingService.getUserBillingSessions(userId, limit);

      console.log('✅ [BillingController] User billing sessions retrieved successfully:', userId);
      res.status(200).json({
        success: true,
        billingSessions,
        total: billingSessions.length,
      });
    } catch (error: any) {
      console.error('❌ [BillingController] Error getting user billing sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Health check endpoint
  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = this.billingService.getHealthStatus();
      
      res.status(200).json({
        success: true,
        health: healthStatus,
      });
    } catch (error: any) {
      console.error('❌ [BillingController] Error getting health status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}
