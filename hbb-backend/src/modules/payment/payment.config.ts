// modules/payment/payment.config.ts - Payment configuration for handling payment types and prices
import { PaymentType } from "./payment.types";

export const PRICING = {
    [PaymentType.SIGNUP_FEE]: 12.99,
    [PaymentType.MEMBERSHIP_FEE]: 6.99,
    [PaymentType.LIVE_STREAM]: 50,
    [PaymentType.GIFT]: 20,
  } as const;