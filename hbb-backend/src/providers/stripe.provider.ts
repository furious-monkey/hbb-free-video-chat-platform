// providers/stripe.provider.ts - Stripe payment provider for handling payment intents and webhooks
import Stripe from 'stripe';
import { PaymentRequest, PaymentResponse, PaymentProvider } from '../modules/payment/payment.types';
import { PrismaClient } from '@prisma/client';

export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;
  private prisma: PrismaClient;

  constructor(stripeSecretKey: string, prisma: PrismaClient) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia', 
    });
    this.prisma = prisma;
  }

  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Get or create customer
      const user = await this.prisma.user.findUnique({
        where: { id: request.userId },
        include: { stripeCustomer: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      let stripeCustomerId: string;

      if (user.stripeCustomer) {
        stripeCustomerId = user.stripeCustomer.stripeCustomerId;
      } else {
        const customer = await this.stripe.customers.create({
          email: user.email,
          metadata: {
            userId: request.userId,
          },
        });

        await this.prisma.stripeCustomer.create({
          data: {
            userId: request.userId,
            stripeCustomerId: customer.id,
          },
        });

        stripeCustomerId = customer.id;
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never', // Disable redirect-based payment methods for server-side confirmations
        },
        customer: stripeCustomerId,
        metadata: {
          userId: request.userId,
          ...request.metadata,
        },
      });

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          userId: request.userId,
          amount: request.amount,
          currency: request.currency,
          type: request.type,
          status: 'PENDING',
          stripePaymentId: paymentIntent.id,
          metadata: request.metadata as any,
        },
      });

      return {
        success: true,
        message: 'Payment processed successfully',
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined, // Handle null case
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, amount: number): Promise<{ success: boolean; message: string; chargeId?: string }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          message: 'Payment confirmed successfully',
          chargeId: paymentIntent.latest_charge as string
        };
      } else {
        return {
          success: false,
          message: `Payment failed with status: ${paymentIntent.status}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async createAndConfirmPaymentIntent(request: PaymentRequest): Promise<{ success: boolean; message: string; chargeId?: string }> {
    try {
      // Get or create customer
      const user = await this.prisma.user.findUnique({
        where: { id: request.userId },
        include: { stripeCustomer: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      let stripeCustomerId: string;

      if (user.stripeCustomer) {
        stripeCustomerId = user.stripeCustomer.stripeCustomerId;
      } else {
        const customer = await this.stripe.customers.create({
          email: user.email,
          metadata: {
            userId: request.userId,
          },
        });

        await this.prisma.stripeCustomer.create({
          data: {
            userId: request.userId,
            stripeCustomerId: customer.id,
          },
        });

        stripeCustomerId = customer.id;
      }

      // Get customer's payment methods
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
      });

      if (paymentMethods.data.length === 0) {
        console.log(`⚠️ [StripeProvider] No payment methods found for customer ${stripeCustomerId}`);
        
        // For final charges, if no payment method exists, we should skip the charge
        // since the initial bid payment already succeeded
        if (request.metadata?.finalCharge === 'true') {
          console.log(`💰 [StripeProvider] Skipping final charge - no payment method available, but initial payment succeeded`);
          return {
            success: true,
            message: 'Final charge skipped - no payment method available',
            chargeId: 'skipped_no_payment_method'
          };
        }
        
        return {
          success: false,
          message: 'No payment method available for this customer'
        };
      }

      // Use the first available payment method
      const paymentMethod = paymentMethods.data[0];

      // Create payment intent with payment method
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency,
        customer: stripeCustomerId,
        payment_method: paymentMethod.id,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          userId: request.userId,
          ...request.metadata,
        },
      });

      if (paymentIntent.status === 'succeeded') {
        // Create transaction record
        await this.prisma.transaction.create({
          data: {
            userId: request.userId,
            amount: request.amount,
            currency: request.currency,
            type: request.type,
            status: 'COMPLETED',
            stripePaymentId: paymentIntent.id,
            metadata: request.metadata as any,
          },
        });

        return {
          success: true,
          message: 'Payment processed successfully',
          chargeId: paymentIntent.latest_charge as string
        };
      } else {
        return {
          success: false,
          message: `Payment failed with status: ${paymentIntent.status}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async processRefund(chargeId: string, amount: number, reason: string): Promise<{ success: boolean; message: string; refundId?: string }> {
    try {
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          reason: reason
        }
      });

      return {
        success: true,
        message: 'Refund processed successfully',
        refundId: refund.id
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handleSuccessfulPayment(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handleFailedPayment(failedPaymentIntent);
        break;
    }
  }

  private async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
    // Update transaction status
    await this.prisma.transaction.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'COMPLETED' },
    });

    // Handle specific payment types
    const metadata = paymentIntent.metadata;
    if (metadata.type === 'BID') {
      await this.handleSuccessfulBid(metadata.sessionId, metadata.userId);
    }
  }

  private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
    // Update transaction status
    await this.prisma.transaction.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'FAILED' },
    });
  }

  private async handleSuccessfulBid(sessionId: string, explorerId: string) {
    // Update the stream session with the new explorer
    await this.prisma.streamSession.update({
      where: { id: sessionId },
      data: { currentExplorerId: explorerId },
    });
  }
}