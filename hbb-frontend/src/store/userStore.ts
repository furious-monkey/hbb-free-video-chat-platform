// frontend/src/store/userStore.ts - User store for handling user details, login, logout, and other user related functions
import axios from "axios";
import { API_URL } from "../api";
import AuthService from "../api/auth/auth";
// cookies
import { getCookie, setCookie, deleteCookie } from "cookies-next";
// zustand
import { createWithEqualityFn } from "zustand/traditional";
import { devtools, persist } from "zustand/middleware";
// others
import { toast } from "sonner";
import { isNotEmpty } from "../utils/functions";
import { handleAuthSuccess, clearAuthData } from "../lib/auth";

export const useUserStore = createWithEqualityFn(
  devtools(
    persist(
      (set, get) => ({
        user: {},
        isAuth: false,
        loading: false,
        isToken: !!getCookie("accessToken"),
        resendLoading: false,
        allowBids: false,
        setAllowBids: (value: boolean) => set({ allowBids: value }),

        register: async (data) => {
          set({ loading: true });
          try {
            const response = await AuthService.registration(data);
            handleAuthSuccess(response.data.data);
            toast.success("Signup successful! 🎉");
            return response.data;
          } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration Error");
          } finally {
            set({ loading: false });
          }
        },

        login: async (data, router) => {
          console.log("🚀 Starting login process", { router: !!router });
          set({ loading: true });
          try {
            const response = await AuthService.login(data);
            const authResponse = response.data.data;
            
            console.log("✅ Login API success", { 
              userRole: authResponse.user.userRole,
              hasToken: !!authResponse.token.accessToken 
            });
            
            handleAuthSuccess(authResponse, router);
            set({ user: authResponse.user, isAuth: true });

            if (!isNotEmpty(authResponse.user.profileImage)) {
              window.location.href = `/dashboard/${authResponse.user.userRole.toLowerCase()}/profile`;
            }

          } catch (error: any) {
            console.error("❌ Login error:", error);
            const errorMessage = error?.response?.data?.message || "An error occurred while logging in";
            toast.error(errorMessage);
            
            if (errorMessage === "Email not verified") {
              const userRole = error?.response?.data?.data?.userRole;
              window.location.href = `/${userRole.toLowerCase()}/confirm?email=${error?.response?.data?.data?.email}`;
            }
            set({ isAuth: false });
          } finally {
            set({ loading: false });
          }
        },

        tryAuth: async () => {
          set({ loading: true });
          try {
            await axios.post(`${API_URL}auth/jwt/verify/`, {
              token: getCookie("refreshToken"),
            });
            set({ isAuth: true });
          } catch (error) {
            console.error("Auth verification failed:", error);
            set({ isAuth: false });
          } finally {
            set({ loading: false });
          }
        },

        resendOTP: async (data) => {
          set({ resendLoading: true });
          try {
            const response = await AuthService.resendOTP(data);
            toast.success("OTP resent successfully!");
            return response.data;
          } catch (error: any) {
            toast.error(error.response?.data?.message || "Error resending OTP");
          } finally {
            set({ resendLoading: false });
          }
        },

        verifyEmail: async (data) => {
          set({ loading: true });
          try {
            const response = await AuthService.verifyEmail(data);
            handleAuthSuccess(response.data.data);
            set({ user: response.data.data.user, isAuth: true });
            toast.success("Email verified successfully!");
            return response.data;
          } catch (error: any) {
            toast.error(error.response?.data?.message || "Error verifying email");
          } finally {
            set({ loading: false });
          }
        },

        getUserByReferralCode: async (data, setCurrentReferralDetail) => {
          set({ loading: true });
          try {
            const response = await AuthService.getUserByReferralCode(data);
            return response.data;
          } catch (error: any) {
            setCurrentReferralDetail(null);
            toast.error(error.response?.data?.message || "Error verifying referral code");
            return null;
          } finally {
            set({ loading: false });
          }
        },

        postUserCompleteProfile: async (data) => {
          set({ loading: true });
          try {
            const response = await AuthService.setCompleteUserProfile(data);
            if (response?.data?.data?.userDetails) {
              set({ userDetails: response.data.data.userDetails });
            }
            return response.data;
          } catch (error: any) {
            toast.error(error.response?.data?.message || "Error completing profile");
          } finally {
            set({ loading: false });
          }
        },

        fetchUserDetails: async () => {
          set({ loading: true });
          try {
            const response = await AuthService.getUserDetails();
            if (response?.data?.data?.userDetails) {
              set({ userDetails: response.data.data.userDetails });
            }
            return response.data;
          } catch (error: any) {
            toast.error(error.response?.data?.message || "Error fetching user details");
          } finally {
            set({ loading: false });
          }
        },

      }),
      {
        name: "user-storage",
        getStorage: () => localStorage,
      }
    )
  )
);
