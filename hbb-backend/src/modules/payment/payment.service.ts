// modules/payment/payment.service.ts - Payment service for handling payment intents and webhooks
import { PaymentProvider } from './payment.types';
import { CreatePaymentIntentDTO, PaymentResponseDTO } from './payment.dto';
import { PrismaClient } from '@prisma/client';
import { PRICING } from './payment.config';

const prisma = new PrismaClient();

export class PaymentService {
  private paymentProvider: PaymentProvider;

  constructor(paymentProvider: PaymentProvider) {
    this.paymentProvider = paymentProvider;
  }

  async createPaymentIntent(data: CreatePaymentIntentDTO): Promise<PaymentResponseDTO> {
    try {
      // For BID_PAYMENT, we need to get the amount from metadata
      let amount: number;
      if (data.type === 'BID_PAYMENT') {
        const bidAmount = data.metadata?.bidAmount;
        if (!bidAmount) {
          throw new Error('Bid amount is required for BID_PAYMENT');
        }
        amount = parseFloat(bidAmount);
      } else {
        amount = PRICING[data.type];
      }

      console.log('Creating payment intent with amount:', amount, 'for type:', data.type);

      const paymentResponse = await this.paymentProvider.createPaymentIntent({
        type: data.type,
        userId: data.userId,
        amount: amount,
        currency: data.currency,
        metadata: data.metadata,
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message);
      }

      // Record the transaction in the database
      await prisma.transaction.create({
        data: {
          userId: data.userId,
          amount: amount,
          currency: data.currency,
          type: data.type, // e.g., "SIGNUP_FEE" or "MEMBERSHIP_FEE"
          status: "COMPLETED", // or "PENDING" depending on your logic
          stripePaymentId: paymentResponse.paymentIntentId, // Assuming the payment provider returns a payment intent ID
          paymentMethod: data.paymentMethod || "card", // Default to "card" if not provided
          description: data.description || `Payment for ${data.type}`, // Default description
          metadata: data.metadata || {}, // Additional metadata
        },
      });

      return paymentResponse;
    } catch (error: any) {
      // Optionally, record a failed transaction
      let amount: number;
      if (data.type === 'BID_PAYMENT') {
        const bidAmount = data.metadata?.bidAmount;
        amount = bidAmount ? parseFloat(bidAmount) : 0;
      } else {
        amount = PRICING[data.type];
      }

      await prisma.transaction.create({
        data: {
          userId: data.userId,
          amount: amount,
          currency: data.currency,
          type: data.type,
          status: "FAILED",
          paymentMethod: data.paymentMethod || "card",
          description: `Failed payment for ${data.type}`,
          metadata: {
            error: error.message,
          },
        },
      });

      return {
        success: false,
        message: error.message,
      };
    }
  }

  async handleWebhook(event: any): Promise<void> {
    try {
      const paymentIntent = event.data.object; // Assuming Stripe webhook event
      const transaction = await prisma.transaction.findUnique({
        where: { id: paymentIntent.id },
      });
  
      if (transaction) {
        // Update the transaction status based on the webhook event
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: paymentIntent.status === "succeeded" ? "COMPLETED" : "FAILED",
          },
        });
      }
    } catch (error: any) {
      console.error('Webhook handling failed:', error.message);
    }
  }

  async getGiftType(giftTypeId: string): Promise<any> {
    // Implement the logic to fetch the gift type details from your database or another service
    const giftType = await prisma.giftType.findUnique({
      where: { id: giftTypeId },
    });

    if (!giftType) {
      throw new Error('Gift type not found');
    }

    return giftType;
  }
}