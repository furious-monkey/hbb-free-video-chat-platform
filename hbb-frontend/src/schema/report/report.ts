import * as z from "zod";

export const reportSchema = z.object({
  category: z.array(z.string()).min(1, { message: "Select at least one reason" }),
  description: z.string().optional(),
});