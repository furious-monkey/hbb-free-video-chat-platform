// /frontend/src/store/profileStore.ts - Profile store for handling profile details, appointments, likes, views, and other profile related functions
// cookies
import { deleteCookie, getCookie, setCookie } from "cookies-next";
// zustand
import { createWithEqualityFn } from "zustand/traditional";
import { devtools } from "zustand/middleware";
// others
import ProfileService from "../api/profile/profile";
import { toast } from "sonner";
import { UserProfilePostInterface } from "../utils/interface";

export const useProfileStore = createWithEqualityFn(
  devtools((set, get) => ({
    profile: {},
    appointments: [],
    likedProfiles: [],
    profileViews: [],
    isAuth: false,
    loading: false,
    isToken: !!getCookie("accessToken"),
    allowBids: false,
    setAllowBids: (value) => set({ allowBids: value }),
    resendLoading: false,
    // Fetch the user profile
    getUserProfile: async () => {
      set({ loading: true });
      try {
        const response = await ProfileService.getUserProfile();

        console.log("response.data", response.data);

        if (response.data) {

          console.log("mtrjerjjer", response.data);
          if (response.data?.profile) {
            set({ profile: { ...response?.data.profile } });
          }
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
    postUserProfileDetails: async (data: UserProfilePostInterface) => {
      set({ loading: true });
      try {
        const response = await ProfileService.handlePostUserDetails(data);
        if (response.data?.profile) {
          set({ profile: { ...response?.data.profile } });
        }
        set({ loading: false });
        return response.data;
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Error completing profile");
      } finally {
        set({ loading: false });
      }
    },
    getUserAppointments: async () => {
      set({ loading: true });
      try {
        const response = await ProfileService.getUserAppointments();

        console.log("response.data", response.data);

        if (response.data) {
          if (response.data?.appointments?.length) {
            set({ appointments: { ...response?.data.appointments } });
          }
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
    getProfileViews: async () => {
      set({ loading: true });
      try {
        const response = await ProfileService.getUserProfileviews();

        console.log("response.data", response.data);

        if (response.data) {
          if (response.data?.profileViews?.length) {
            set({ profileViews: { ...response?.data.profileViews } });
          }
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
    postUpdateUserProfileImage: async (data) => {
      set({ loading: true });
      try {
        const response = await ProfileService.updateUserProfileImage(data);
        set({ loading: false });
        return response.data;
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Error completing profile"
        );
      } finally {
        set({ loading: false });
      }
    },
    postUpdateUserPromotionalVideo: async (data) => {
      set({ loading: true });
      try {
        const response = await ProfileService.updateUserPromotionalVideo(data);
        set({ loading: false });
        return response.data;
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Error completing profile"
        );
      } finally {
        set({ loading: false });
      }
    },
    getProfileLikes: async () => {
      set({ loading: true });
      try {
        const response = await ProfileService.getUserProfileLikes();

        if (response.data) {
          if (response.data?.likedProfiles?.length) {
            set({ likedProfiles: { ...response?.data.likedProfiles } });
          }
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