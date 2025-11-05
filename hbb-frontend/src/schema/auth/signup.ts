import * as z from "zod";

export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: "Email address is required" })
      .email({ message: "Invalid email address" }),
    consent: z.boolean().refine((consent) => consent === true, {
      message: "You must agree to the terms and conditions",
    }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/,
        {
          message:
            "Password must include upper and lower case letters, numbers, and special characters",
        }
      ),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const confirmCodeSchema = z.object({
  pin: z.string().min(4, {
    message: "Your one-time password must be 6 characters.",
  }),
});
