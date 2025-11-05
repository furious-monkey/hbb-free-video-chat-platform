// routes/gift.routes.ts - Gift routes for handling gift sending and getting gift types
import express from 'express';
import { GiftController } from '../modules/gift/gift.controller';
import { GiftService } from '../modules/gift/gift.service';
import { StripePaymentProvider } from '../providers/stripe.provider';
import { PrismaClient } from '@prisma/client';
import { PaymentService } from '../modules/payment/payment.service';

const prisma = new PrismaClient();
const stripeProvider = new StripePaymentProvider(process.env.STRIPE_SECRET_KEY!, prisma);
const paymentService = new PaymentService(stripeProvider);
const giftService = new GiftService(paymentService);
const giftController = new GiftController(giftService);

const router = express.Router();

router.post('/send', (req, res) => giftController.sendGift(req, res));
router.get('/types', (req, res) => giftController.getGiftTypes(req, res));

export default router;