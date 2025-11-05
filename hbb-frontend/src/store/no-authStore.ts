// zustand
import { createWithEqualityFn } from "zustand/traditional";
import { devtools } from "zustand/middleware";
import NoAuthService from "../api/no-auth";
import {
  ContactFormInterface,
  ForgotPasswordInterface,
  ResetPasswordPayloadInterface,
  CategoryInterface,
} from "../utils/interface";

export const useNoAuthStore = createWithEqualityFn(
  devtools((set, get) => ({
    contact: {},
    categories:{},
    forgot_Password: {},
    resetPassword: {},
    resendOTP: {},
    loading: false,
    resendLoading: false,
    // Fetch the user profile
    postContactForm: async (data: ContactFormInterface) => {
      set({ loading: true });
      try {
        const response = await NoAuthService.postContactForm(data);

        if (response.data) {
          set({ contact: { ...response?.data } });
          set({ loading: false });
          return response.data;
        }

        set({ loading: false });
      } catch (err: any) {
        return err;
      } finally {
        set({ loading: false });
      }
    },
    fetchCategories: async (data: CategoryInterface) => {
      set({ loading: true });
      try {
        const response = await NoAuthService.fetchCategories(data);

        if (response.data) {
          set({ categories: { ...response?.data } });
          set({ loading: false });
          return response.data;
        }

        set({ loading: false });
      } catch (err: any) {
        return err;
      } finally {
        set({ loading: false });
      }
    },
    postForgotPassword: async (data: ForgotPasswordInterface) => {
      set({ loading: true });
      try {
        const response = await NoAuthService.forgotPassword(data);

        if (response.data) {
          set({ forgot_Password: { ...response?.data } });
          set({ loading: false });
          return response.data;
        }

        set({ loading: false });
      } catch (err: any) {
        return err;
      } finally {
        set({ loading: false });
      }
    },
    postResetPassword: async (payload: ResetPasswordPayloadInterface) => {
      set({ loading: true });
      try {
        const response = await NoAuthService.passwordReset(
          payload?.token,
          payload?.data
        );

        if (response.data) {
          set({ reset_Password: { ...response?.data } });
          set({ loading: false });
          return response.data;
        }

        set({ loading: false });
      } catch (err: any) {
        return err;
      } finally {
        set({ loading: false });
      }
    },
    postResendOTP: async (data: ForgotPasswordInterface) => {
      set({ loading: true });
      try {
        const response = await NoAuthService.resendOTP(data);

        if (response.data) {
          set({ resendOTP: { ...response?.data } });
          set({ loading: false });
          return response.data;
        }

        set({ loading: false });
      } catch (err: any) {
        return err;
      } finally {
        set({ loading: false });
      }
    },
  }))
);
