// api/billing/billing.ts - Billing API for handling billing operations
import { api } from "../index";

export interface BillingSession {
  id: string;
  streamSessionId: string;
  sessionId: string; // Alias for streamSessionId for compatibility
  explorerId: string;
  influencerId: string;
  bidAmount: number;
  startTime: string;
  endTime?: string;
  duration?: number; // in seconds
  chargedAmount: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  createdAt: string;
  updatedAt: string;
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
  sessionId: string;
  explorerId: string;
  influencerId: string;
  bidAmount: number;
}

export interface CallEndData {
  sessionId: string;
  billingSessionId: string;
  endTime: string;
  duration: number;
}

export class BillingService {
  /**
   * Process bid payment when bid is accepted
   */
  static async processBidPayment(bidId: string): Promise<BillingResult> {
    try {
      const response = await api.post(`/billing/process-bid-payment/${bidId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error processing bid payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process bid payment',
        error: 'API_ERROR'
      };
    }
  }

  /**
   * Start call billing when both users join
   */
  static async startCallBilling(data: CallStartData): Promise<BillingResult> {
    try {
      const response = await api.post('/billing/start-call-billing', data);
      return response.data;
    } catch (error: any) {
      console.error('Error starting call billing:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to start call billing',
        error: 'API_ERROR'
      };
    }
  }

  /**
   * End call billing when call ends
   */
  static async endCallBilling(data: CallEndData): Promise<BillingResult> {
    try {
      const response = await api.post('/billing/end-call-billing', data);
      return response.data;
    } catch (error: any) {
      console.error('Error ending call billing:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to end call billing',
        error: 'API_ERROR'
      };
    }
  }

  /**
   * Handle payment failure
   */
  static async handlePaymentFailure(billingSessionId: string): Promise<BillingResult> {
    try {
      const response = await api.post(`/billing/handle-payment-failure/${billingSessionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error handling payment failure:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to handle payment failure',
        error: 'API_ERROR'
      };
    }
  }

  /**
   * Process refund
   */
  static async processRefund(billingSessionId: string): Promise<BillingResult> {
    try {
      const response = await api.post(`/billing/process-refund/${billingSessionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process refund',
        error: 'API_ERROR'
      };
    }
  }

  /**
   * Get billing session by ID
   */
  static async getBillingSession(billingSessionId: string): Promise<BillingSession | null> {
    try {
      const response = await api.get(`/billing/billing-session/${billingSessionId}`);
      return response.data.billingSession || null;
    } catch (error: any) {
      console.error('Error getting billing session:', error);
      return null;
    }
  }

  /**
   * Get user's billing sessions
   */
  static async getUserBillingSessions(limit: number = 50): Promise<BillingSession[]> {
    try {
      const response = await api.get(`/billing/user-billing-sessions?limit=${limit}`);
      return response.data.billingSessions || [];
    } catch (error: any) {
      console.error('Error getting user billing sessions:', error);
      return [];
    }
  }

  /**
   * Health check endpoint
   */
  static async getHealthStatus(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.get('/billing/health');
      return response.data;
    } catch (error: any) {
      console.error('Error checking billing health:', error);
      return {
        success: false,
        message: 'Billing service unavailable'
      };
    }
  }
}
