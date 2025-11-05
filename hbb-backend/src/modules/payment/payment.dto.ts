// modules/payment/payment.dto.ts - Payment DTOs for handling payment intents and webhooks
import { PaymentType } from './payment.types';

export interface CreatePaymentIntentDTO {
  type: PaymentType; 
  userId: string;
  currency: string;
  metadata?: Record<string, string>;
  paymentMethod: string;
  description?: string;
}

export interface PaymentResponseDTO {
  success: boolean;
  message: string;
  paymentIntentId?: string;
  clientSecret?: string;
}