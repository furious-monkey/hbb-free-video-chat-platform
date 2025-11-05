import * as z from "zod";

export const Schema = z.object({
  amount: z.string().min(1, "Amount cannot be empty"),
  

});
