// routes/payment.routes.ts - Payment routes for handling payment intents and webhooks
import express from 'express';
import { PaymentController } from '../modules/payment/payment.controller';
import { PaymentService } from '../modules/payment/payment.service';
import { StripePaymentProvider } from '../providers/stripe.provider';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripeProvider = new StripePaymentProvider(process.env.STRIPE_SECRET_KEY!, prisma);
const paymentService = new PaymentService(stripeProvider);
const paymentController = new PaymentController(paymentService);

const router = express.Router();

router.post('/create-intent', (req, res) => paymentController.createPaymentIntent(req, res));
router.post('/webhook', (req, res) => paymentController.handleWebhook(req, res));

export default router;