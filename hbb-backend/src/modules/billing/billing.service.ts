// modules/billing/billing.service.ts - Complete billing service for call duration and bid processing
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { PaymentService } from '../payment/payment.service';
import { WebSocketService } from '../../websocket/websocket.service';
import { StripePaymentProvider } from '../../providers/stripe.provider';
import { PaymentType } from '../payment/payment.types';

export interface BillingSession {
  id: string;
  streamSessionId: string;
  explorerId: string;
  influencerId: string;
  bidAmount: number;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  chargedAmount: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  stripePaymentIntentId?: string;
  stripePaymentMethodId?: string;
  stripeChargeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingResult {
  success: boolean;
  message: string;
  billingSession?: BillingSession;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export interface CallStartData {
  streamSessionId: string;
  explorerId: string;
  influencerId: string;
  bidId: string;
  bidAmount: number;
}

export interface CallEndData {
  streamSessionId: string;
  duration: number; // in seconds
  reason: 'completed' | 'disconnected' | 'cancelled';
}

@Service()
export class BillingService {
  private prisma: PrismaClient;
  private paymentService?: PaymentService;
  private webSocketService?: WebSocketService;
  private stripeProvider?: StripePaymentProvider;
  private readonly BID_DURATION_MINUTES = 30; // Default bid duration
  private readonly MINIMUM_CHARGE_AMOUNT = 0.50; // Minimum $0.50 charge

  constructor() {
    this.prisma = new PrismaClient();
  }

  public injectServices(
    paymentService: PaymentService,
    webSocketService: WebSocketService,
    stripeProvider: StripePaymentProvider
  ) {
    this.paymentService = paymentService;
    this.webSocketService = webSocketService;
    this.stripeProvider = stripeProvider;
  }

  /**
   * Process payment when a bid is accepted
   * This creates a payment intent but doesn't charge immediately
   */
  async processBidPayment(bidId: string): Promise<BillingResult> {
    try {
      console.log(`💳 [BillingService] Processing bid payment for bid: ${bidId}`);

      // Get bid details
      const bid = await this.prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          streamSession: {
            include: {
              influencer: true,
              currentExplorer: true
            }
          },
          explorer: {
            include: {
              stripeCustomer: true
            }
          }
        }
      });

      if (!bid) {
        return {
          success: false,
          message: 'Bid not found',
          error: 'BID_NOT_FOUND'
        };
      }

      if (bid.status !== 'ACCEPTED') {
        return {
          success: false,
          message: 'Bid is not accepted',
          error: 'BID_NOT_ACCEPTED'
        };
      }

      const session = bid.streamSession;
      const explorer = bid.explorer;

      // Create billing session
      const billingSession = await this.prisma.billingSession.create({
        data: {
          streamSessionId: session.id,
          explorerId: explorer.id,
          influencerId: session.influencerId,
          bidAmount: bid.amount,
          startTime: new Date(),
          chargedAmount: 0, // Will be updated when call ends
          status: 'PENDING'
        }
      });

      // Create payment intent for the bid amount
      if (!this.paymentService) {
        throw new Error('Payment service not available');
      }
      
      const paymentResult = await this.paymentService.createPaymentIntent({
        type: 'BID_PAYMENT' as any,
        userId: explorer.id,
        currency: 'USD',
        paymentMethod: 'card',
        metadata: {
          bidId: bid.id,
          streamSessionId: session.id,
          billingSessionId: billingSession.id,
          influencerId: session.influencerId,
          bidAmount: bid.amount.toString(),
          maxDurationMinutes: this.BID_DURATION_MINUTES.toString()
        }
      });

      if (!paymentResult.success) {
        // Update billing session status
        await this.prisma.billingSession.update({
          where: { id: billingSession.id },
          data: { status: 'FAILED' }
        });

        return {
          success: false,
          message: paymentResult.message,
          error: 'PAYMENT_INTENT_FAILED'
        };
      }

      // Update billing session with payment intent ID
      const updatedBillingSession = await this.prisma.billingSession.update({
        where: { id: billingSession.id },
        data: {
          stripePaymentIntentId: paymentResult.paymentIntentId,
          status: 'PENDING'
        }
      });

      console.log(`✅ [BillingService] Payment intent created for bid ${bidId}: ${paymentResult.paymentIntentId}`);

      return {
        success: true,
        message: 'Payment intent created successfully',
        billingSession: updatedBillingSession as any,
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret
      };

    } catch (error) {
      console.error('❌ [BillingService] Error processing bid payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process bid payment',
        error: 'PROCESSING_ERROR'
      };
    }
  }

  /**
   * Start billing when the actual call begins (both users join)
   */
  async startCallBilling(data: CallStartData): Promise<BillingResult> {
    try {
      console.log(`🎬 [BillingService] Starting call billing for session: ${data.streamSessionId}`);

      // Check if billing is already active to prevent duplicate calls
      const existingActiveSession = await this.prisma.billingSession.findFirst({
        where: {
          streamSessionId: data.streamSessionId,
          explorerId: data.explorerId,
          status: 'ACTIVE'
        }
      });

      if (existingActiveSession) {
        console.log(`⚠️ [BillingService] Billing already active for session: ${data.streamSessionId}`);
        return {
          success: true,
          message: 'Call billing already active',
          billingSession: existingActiveSession as any,
        };
      }

      // Find the billing session
      const billingSession = await this.prisma.billingSession.findFirst({
        where: {
          streamSessionId: data.streamSessionId,
          explorerId: data.explorerId,
          status: 'PENDING'
        }
      });

      if (!billingSession) {
        console.log(`❌ [BillingService] No pending billing session found for session: ${data.streamSessionId}, explorer: ${data.explorerId}`);
        
        // Let's check what billing sessions exist for this stream
        const allSessions = await this.prisma.billingSession.findMany({
          where: { streamSessionId: data.streamSessionId }
        });
        console.log(`📋 [BillingService] All billing sessions for stream ${data.streamSessionId}:`, allSessions.map(s => ({ id: s.id, status: s.status, explorerId: s.explorerId })));
        
        return {
          success: false,
          message: 'Billing session not found',
          error: 'BILLING_SESSION_NOT_FOUND'
        };
      }

      // Update billing session to active
      const updatedBillingSession = await this.prisma.billingSession.update({
        where: { id: billingSession.id },
        data: {
          status: 'ACTIVE',
          startTime: new Date()
        }
      });

      // Start timer-based billing (optional - for real-time billing during call)
      this.startTimerBasedBilling(billingSession.id);

      console.log(`✅ [BillingService] Call billing started for session: ${data.streamSessionId}`);

      return {
        success: true,
        message: 'Call billing started successfully',
        billingSession: updatedBillingSession as any,
      };

    } catch (error) {
      console.error('❌ [BillingService] Error starting call billing:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start call billing',
        error: 'START_BILLING_ERROR'
      };
    }
  }

  /**
   * End billing and process final charge when call ends
   */
  async endCallBilling(data: CallEndData): Promise<BillingResult> {
    try {
      console.log(`🏁 [BillingService] Ending call billing for session: ${data.streamSessionId}`);

      // Find the active billing session
      const billingSession = await this.prisma.billingSession.findFirst({
        where: {
          streamSessionId: data.streamSessionId,
          status: 'ACTIVE'
        }
      });

      if (!billingSession) {
        return {
          success: false,
          message: 'Active billing session not found',
          error: 'BILLING_SESSION_NOT_FOUND'
        };
      }

      // Calculate final charge amount based on actual duration
      const finalChargeAmount = this.calculateFinalCharge(
        billingSession.bidAmount,
        data.duration,
        this.BID_DURATION_MINUTES
      );

      // Update billing session with final details
      const updatedBillingSession = await this.prisma.billingSession.update({
        where: { id: billingSession.id },
        data: {
          endTime: new Date(),
          duration: data.duration,
          chargedAmount: finalChargeAmount,
          status: 'COMPLETED'
        }
      });

      // Process the final charge
      console.log(`💳 [BillingService] Processing final charge: $${finalChargeAmount} for billing session: ${billingSession.id}`);
      
      const chargeResult = await this.processFinalCharge(
        billingSession.stripePaymentIntentId!,
        finalChargeAmount,
        billingSession.id
      );

      if (!chargeResult.success) {
        console.error(`❌ [BillingService] Final charge failed for session: ${data.streamSessionId}:`, chargeResult.message);
        
        // Update billing session status to failed
        await this.prisma.billingSession.update({
          where: { id: billingSession.id },
          data: { status: 'FAILED' }
        });

        return {
          success: false,
          message: chargeResult.message,
          error: 'FINAL_CHARGE_FAILED'
        };
      }

      console.log(`✅ [BillingService] Final charge processed successfully: $${finalChargeAmount}, charge ID: ${chargeResult.chargeId}`);

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          userId: billingSession.explorerId,
          amount: finalChargeAmount,
          currency: 'USD',
          type: 'BID_PAYMENT',
          status: 'COMPLETED',
          stripePaymentId: chargeResult.chargeId,
          description: `Call payment for ${Math.round(data.duration / 60)} minutes`,
          metadata: {
            billingSessionId: billingSession.id,
            streamSessionId: data.streamSessionId,
            influencerId: billingSession.influencerId,
            originalBidAmount: billingSession.bidAmount,
            actualDuration: data.duration,
            wasProRated: finalChargeAmount < billingSession.bidAmount
          }
        }
      });

      console.log(`✅ [BillingService] Call billing completed for session: ${data.streamSessionId}, charged: $${finalChargeAmount}`);

      return {
        success: true,
        message: 'Call billing completed successfully',
        billingSession: updatedBillingSession as any,
      };

    } catch (error) {
      console.error('❌ [BillingService] Error ending call billing:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to end call billing',
        error: 'END_BILLING_ERROR'
      };
    }
  }

  /**
   * Handle payment failures and refunds
   */
  async handlePaymentFailure(billingSessionId: string, reason: string): Promise<BillingResult> {
    try {
      console.log(`❌ [BillingService] Handling payment failure for billing session: ${billingSessionId}`);

      const billingSession = await this.prisma.billingSession.findUnique({
        where: { id: billingSessionId }
      });

      if (!billingSession) {
        return {
          success: false,
          message: 'Billing session not found',
          error: 'BILLING_SESSION_NOT_FOUND'
        };
      }

      // Update billing session status
      const updatedBillingSession = await this.prisma.billingSession.update({
        where: { id: billingSessionId },
        data: {
          status: 'FAILED',
          endTime: new Date()
        }
      });

      // Create failed transaction record
      await this.prisma.transaction.create({
        data: {
          userId: billingSession.explorerId,
          amount: billingSession.bidAmount,
          currency: 'USD',
          type: 'BID_PAYMENT',
          status: 'FAILED',
          description: `Failed call payment - ${reason}`,
          metadata: {
            billingSessionId: billingSession.id,
            streamSessionId: billingSession.streamSessionId,
            failureReason: reason
          }
        }
      });

      // Notify users about payment failure
      if (this.webSocketService) {
        this.webSocketService.safeEmitToUser(billingSession.explorerId, 'PAYMENT_FAILED', {
          billingSessionId: billingSession.id,
          streamSessionId: billingSession.streamSessionId,
          reason: reason,
          timestamp: new Date()
        });

        this.webSocketService.safeEmitToUser(billingSession.influencerId, 'EXPLORER_PAYMENT_FAILED', {
          billingSessionId: billingSession.id,
          streamSessionId: billingSession.streamSessionId,
          explorerId: billingSession.explorerId,
          reason: reason,
          timestamp: new Date()
        });
      }

      console.log(`✅ [BillingService] Payment failure handled for billing session: ${billingSessionId}`);

      return {
        success: true,
        message: 'Payment failure handled successfully',
        billingSession: updatedBillingSession as any,
      };

    } catch (error) {
      console.error('❌ [BillingService] Error handling payment failure:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to handle payment failure',
        error: 'HANDLE_FAILURE_ERROR'
      };
    }
  }

  /**
   * Process refund for cancelled calls
   */
  async processRefund(billingSessionId: string, reason: string): Promise<BillingResult> {
    try {
      console.log(`💰 [BillingService] Processing refund for billing session: ${billingSessionId}`);

      const billingSession = await this.prisma.billingSession.findUnique({
        where: { id: billingSessionId }
      });

      if (!billingSession) {
        return {
          success: false,
          message: 'Billing session not found',
          error: 'BILLING_SESSION_NOT_FOUND'
        };
      }

      if (!billingSession.stripeChargeId) {
        return {
          success: false,
          message: 'No charge to refund',
          error: 'NO_CHARGE_TO_REFUND'
        };
      }

      // Process refund through Stripe
      if (!this.stripeProvider) {
        throw new Error('Stripe provider not available');
      }
      
      const refundResult = await this.stripeProvider.processRefund(
        billingSession.stripeChargeId,
        billingSession.chargedAmount,
        reason
      );

      if (!refundResult.success) {
        return {
          success: false,
          message: refundResult.message,
          error: 'REFUND_FAILED'
        };
      }

      // Update billing session status
      const updatedBillingSession = await this.prisma.billingSession.update({
        where: { id: billingSessionId },
        data: {
          status: 'REFUNDED',
          endTime: new Date()
        }
      });

      // Create refund transaction record
      await this.prisma.transaction.create({
        data: {
          userId: billingSession.explorerId,
          amount: -billingSession.chargedAmount, // Negative amount for refund
          currency: 'USD',
          type: 'BID_REFUND',
          status: 'COMPLETED',
          stripePaymentId: refundResult.refundId,
          description: `Refund for cancelled call - ${reason}`,
          metadata: {
            billingSessionId: billingSession.id,
            streamSessionId: billingSession.streamSessionId,
            originalChargeId: billingSession.stripeChargeId,
            refundReason: reason
          }
        }
      });

      console.log(`✅ [BillingService] Refund processed for billing session: ${billingSessionId}`);

      return {
        success: true,
        message: 'Refund processed successfully',
        billingSession: updatedBillingSession as any,
      };

    } catch (error) {
      console.error('❌ [BillingService] Error processing refund:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process refund',
        error: 'REFUND_ERROR'
      };
    }
  }

  /**
   * Get billing session by ID
   */
  async getBillingSession(billingSessionId: string): Promise<BillingSession | null> {
    try {
      const billingSession = await this.prisma.billingSession.findUnique({
        where: { id: billingSessionId }
      });

      return billingSession as any;
    } catch (error) {
      console.error('❌ [BillingService] Error getting billing session:', error);
      return null;
    }
  }

  /**
   * Get billing sessions for a user
   */
  async getUserBillingSessions(userId: string, limit: number = 50): Promise<BillingSession[]> {
    try {
      const billingSessions = await this.prisma.billingSession.findMany({
        where: {
          OR: [
            { explorerId: userId },
            { influencerId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return billingSessions as any;
    } catch (error) {
      console.error('❌ [BillingService] Error getting user billing sessions:', error);
      return [];
    }
  }

  // Private helper methods

  private calculateFinalCharge(bidAmount: number, actualDurationSeconds: number, maxDurationMinutes: number): number {
    const actualMinutes = actualDurationSeconds / 60;
    const maxMinutes = maxDurationMinutes;

    // If call lasted longer than bid duration, charge the full amount
    if (actualMinutes >= maxMinutes) {
      return bidAmount;
    }

    // Otherwise, calculate pro-rated amount
    const proRatedAmount = (actualMinutes / maxMinutes) * bidAmount;
    
    // Ensure minimum charge amount
    const finalAmount = Math.max(proRatedAmount, this.MINIMUM_CHARGE_AMOUNT);
    
    // Round to 2 decimal places
    return Math.round(finalAmount * 100) / 100;
  }

  private async processFinalCharge(paymentIntentId: string, amount: number, billingSessionId: string): Promise<{ success: boolean; message: string; chargeId?: string }> {
    try {
      // Get the billing session to get customer info
      const billingSession = await this.prisma.billingSession.findUnique({
        where: { id: billingSessionId },
        include: { explorer: true }
      });

      if (!billingSession) {
        throw new Error('Billing session not found');
      }

      if (!this.stripeProvider) {
        throw new Error('Stripe provider not available');
      }

      // Instead of creating a new payment intent, let's create a new one for the final charge
      // using the customer's available payment methods
      const paymentRequest = {
        userId: billingSession.explorerId,
        amount: amount,
        currency: 'usd',
        type: PaymentType.BID_PAYMENT,
        metadata: {
          billingSessionId: billingSessionId,
          streamSessionId: billingSession.streamSessionId,
          finalCharge: 'true'
        }
      };

      const confirmedPayment = await this.stripeProvider.createAndConfirmPaymentIntent(paymentRequest);
      
      if (!confirmedPayment.success) {
        return {
          success: false,
          message: confirmedPayment.message
        };
      }

      // Update billing session with charge ID
      await this.prisma.billingSession.update({
        where: { id: billingSessionId },
        data: {
          stripeChargeId: confirmedPayment.chargeId
        }
      });

      return {
        success: true,
        message: 'Final charge processed successfully',
        chargeId: confirmedPayment.chargeId
      };

    } catch (error) {
      console.error('❌ [BillingService] Error processing final charge:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process final charge'
      };
    }
  }

  private startTimerBasedBilling(billingSessionId: string): void {
    // Optional: Implement real-time billing during call
    // This could send periodic updates about call duration and estimated cost
    console.log(`⏰ [BillingService] Timer-based billing started for session: ${billingSessionId}`);
  }

  // Health check method
  getHealthStatus(): any {
    return {
      service: 'BillingService',
      status: 'healthy',
      dependencies: {
        prisma: !!this.prisma,
        paymentService: !!this.paymentService,
        webSocketService: !!this.webSocketService,
        stripeProvider: !!this.stripeProvider
      },
      timestamp: new Date()
    };
  }
}
