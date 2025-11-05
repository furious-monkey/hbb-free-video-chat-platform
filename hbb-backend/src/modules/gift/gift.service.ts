// modules/gift/gift.service.ts - Gift service for handling gift sending and getting gift types
import { PrismaClient } from '@prisma/client';
import { PaymentService } from '../payment/payment.service';
import { GiftRequest, GiftResponse } from './gift.types';
import { PaymentType } from '../payment/payment.types'; 

const prisma = new PrismaClient();

export class GiftService {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  async sendGift(data: GiftRequest): Promise<GiftResponse> {
    try {
      const { senderId, receiverId, streamSessionId, giftTypeId, message } = data;

      // Fetch gift type details
      const giftType = await prisma.giftType.findUnique({
        where: { id: giftTypeId },
      });

      if (!giftType) {
        throw new Error('Gift type not found');
      }

      // Process payment for the gift
      const paymentResponse = await this.paymentService.createPaymentIntent({
        type: PaymentType.GIFT,
        userId: senderId,
        currency: 'usd',
        metadata: {
          giftTypeId,
          streamSessionId,
          receiverId,
        },
        paymentMethod: ''
      });

      if (!paymentResponse.success) {
        throw new Error('Payment failed: ' + paymentResponse.message);
      }

      // Create gift record
      const gift = await prisma.gift.create({
        data: {
          streamSessionId,
          senderId,
          receiverId,
          giftTypeId,
          amount: giftType.price,
          message,
        },
      });

      return {
        success: true,
        message: 'Gift sent successfully',
        gift,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getGiftTypes() {
    return prisma.giftType.findMany({
      where: { isActive: true },
    });
  }
}