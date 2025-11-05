import * as z from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email address is required" })
    .email({ message: "Invalid email address" }),
});
