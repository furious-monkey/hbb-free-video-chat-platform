// modules/payment/payment.controller.ts - Payment controller for handling payment intents and webhooks
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { PaymentType } from './payment.types';
import { PRICING } from './payment.config';

export class PaymentController {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { type, userId, currency, metadata } = req.body;

      // Validate required fields
      if (!type || !userId || !currency) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Validate the payment type
      if (!Object.values(PaymentType).includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid payment type' });
      }


      // Create the payment intent
      const paymentResponse = await this.paymentService.createPaymentIntent({
        type: type as PaymentType,
        userId,
        currency,
        metadata,
        paymentMethod: ''
      });

      // Return the response
      if (paymentResponse.success) {
        res.status(200).json(paymentResponse);
      } else {
        res.status(400).json(paymentResponse);
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      await this.paymentService.handleWebhook(req.body);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(400).json({ error: error.message });
    }
  }
}