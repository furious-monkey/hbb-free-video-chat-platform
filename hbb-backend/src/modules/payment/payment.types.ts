// modules/payment/payment.types.ts - Payment types for handling payment intents and webhooks
import Stripe from "stripe";

export enum PaymentType {
    SIGNUP_FEE = 'SIGNUP_FEE',
    MEMBERSHIP_FEE = 'MEMBERSHIP_FEE',
    LIVE_STREAM = 'LIVE_STREAM',
    GIFT = 'GIFT',
    BID_PAYMENT = 'BID_PAYMENT',
}

export interface PaymentRequest {
    type: PaymentType;
    userId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
}

export interface PaymentResponse {
    success: boolean;
    message: string;
    paymentIntentId?: string;
    clientSecret?: string;
}

export interface PaymentProvider {
    createPaymentIntent(request: PaymentRequest): Promise<PaymentResponse>;
    handleWebhook(event: Stripe.Event): Promise<void>;
}