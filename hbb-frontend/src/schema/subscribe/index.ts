import * as z from "zod";

export const subscribeSchema = z.object({
  cardName: z.string({ required_error: "Card Name is required" }),
  expiryDate: z.string({ required_error: "Expiry date is required" }),
  cardNumber: z.string({ required_error: "Card Number is required" }),
  cvv: z.string({ required_error: "CVV is required" }),
});
