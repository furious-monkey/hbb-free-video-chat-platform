import * as z from "zod";

const contactUsSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z
    .string()
    .min(1, { message: "Email address is required" })
    .email({ message: "Invalid email address" }),
  subject: z.string(),
  message: z.string().min(2, { message: "Message is required" }),
});

export default contactUsSchema;
