import * as z from "zod";

export const cardDetailsSchema = z
  .object({
    expiryDate: z.date(),
    cardName: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/,
        {
          message:
            "Password must include upper and lower case letters, numbers, and special characters",
        }
      ),
    cardNumber: z.number().max(16),
    cvv: z.number().max(3),
  })
