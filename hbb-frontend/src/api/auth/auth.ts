import axios from "axios";
import { api } from "../index";

export const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

export default class AuthService {
  static async login(data) {
    return axios.post(API_URL + "auth/login", data);
  }

  static async registration(data) {
    return axios.post(API_URL + "auth/register", data, {
      withCredentials: true,
    });
  }

  static async resendOTP(data) {
    return axios.post(API_URL + "auth/resend-otp", data, {
      withCredentials: true,
    });
  }

  static async verifyEmail(data) {
    return axios.post(API_URL + "auth/verify-email", data, {
      withCredentials: true,
    });
  }

  static async getUserByReferralCode(data) {
    return axios.get(API_URL + `user/user-by-referral-code/${data.referralCode}`, {
      withCredentials: true,
    });
  }

  static async setCompleteUserProfile(data) {
    return api.post(`/user/complete-profile`, data, {
      withCredentials: true,
    });
  }

  static async getUserDetails() {
    return api.get(`/user/user-details`, {
      withCredentials: true,
    });
  }
}
  