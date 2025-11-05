import { api } from "@/src/api";

export interface WaitlistFormData {
  name: string;
  email: string;
  location: string;
  ageConfirmation: boolean;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
    referralCode?: string;
  };
}

export default class WaitlistService {
  static async joinWaitlist(data: WaitlistFormData): Promise<WaitlistResponse> {
    try {
      const response = await api.post("/waitlist/join", data);
      return response.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 409) {
        throw new Error("This email is already on the waitlist");
      }
      throw error;
    }
  }

  static async checkWaitlistStatus(email: string): Promise<any> {
    try {
      const response = await api.get(`/waitlist/status/${email}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
