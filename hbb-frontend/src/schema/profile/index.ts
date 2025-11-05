import { isValidPhoneNumber } from "react-phone-number-input";
import * as z from "zod";

export const profileSchema = z.object({
  userName: z.string().min(1, {
    message: " Username is required",
  }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
  categories: z
  .array(
    z.string().min(1, {
      message: 'Category is required',
    })
  )
  .nonempty({
    message: 'At least one category must be selected',
  }),
});

export const agencyProfileSchema = z.object({
  firstname: z.string().min(1, {
    message: "First name is required",
  }),
  lastname: z.string().min(1, {
    message: "Last name is required",
  }),
  phone: z
    .string()
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
});

export const userProfileSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email address is required" })
    .email({ message: "Invalid email address" }),
  username: z.string().min(1, {
    message: "Username is required",
  }),
  location: z.string().min(1, {
    message: "Location is required",
  }),
  bio: z.string({ required_error: "Bio is required" }).optional(),
  callRate: z.string({ required_error: "Call Rate is required" }).optional(),
  country: z.string().min(1, {
    message: "Country is required",
  }),
});

export const boostSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  location: z.string().min(1, {
    message: "Location is required",
  }),
  bio: z.string({ required_error: "Bio is required" }),
  callRate: z.string({ required_error: "Call Rate is required" }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
});
