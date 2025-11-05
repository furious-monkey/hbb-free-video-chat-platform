import {
  ContactFormInterface,
  ForgotPasswordInterface,
  ResetPasswordInterface,
  CategoryInterface,
} from "@/src/utils/interface";
import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;
axios.defaults.withCredentials = true;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
  withCredentials: true,
});

export default class NoAuthService {
  static async postContactForm(data: ContactFormInterface) {
    return api.post("no-auth/contact-us", data, {
      withCredentials: true,
    });
  }

  static async fetchCategories(data: CategoryInterface) {
    return api.get("profile/categories", {
      withCredentials: true,
    });
  }

  static async forgotPassword(data: ForgotPasswordInterface) {
    return api.post("auth/forgot-password", data, {
      withCredentials: true,
    });
  }

  static async passwordReset(token: string, data: ResetPasswordInterface) {
    return api.post(`/auth/reset-password/${token}`, data, {
      withCredentials: true,
    });
  }

  static async resendOTP(data: ForgotPasswordInterface) {
    return api.post("auth/resend-otp", data, {
      withCredentials: true,
    });
  }
}
