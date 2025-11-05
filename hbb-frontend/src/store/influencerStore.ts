// /frontend/src/store/influencerStore.ts - Influencer store for handling influencer details, likes, and other influencer related functions
// cookies
import { getCookie } from "cookies-next";
// zustand
import { createWithEqualityFn } from "zustand/traditional";
import { devtools } from "zustand/middleware";
import { InfluencerPayloadInterface } from "../utils/interface";
import InfluencerService from "../api/influencer/influencer";

export const useInfluencerStore = createWithEqualityFn(
devtools((set, get) => ({
  influencers: [],
  influencersPaginationData: {},
  likeInfluencer: {},
  unlikeInfluencer: {},
  likedProfiles: [],
  likesFromExplorers: [],
  isAuth: false,
  loading: false,
  getUsernameLoading: false,
  checkUsernameLoading: false, 
  isToken: !!getCookie("accessToken"),
  resendLoading: false,

  getOnlineInfluencers: async (payload: InfluencerPayloadInterface) => {
    set({ loading: true });
    try {
      const response = await InfluencerService.getInfluencers(payload);

      if (response?.data) {
        const { influencers, nextCursor, hasNextPage, message } = response.data;

        if (influencers) {
          set((state) => ({
            influencers: payload.cursor
              ? [...state.influencers, ...influencers] // Append if cursor is provided
              : influencers, // Replace if no cursor is provided
            influencersPaginationData: {
              nextCursor,
              hasNextPage,
            },
            message,
          }));
        }

        set({ loading: false });
        return response.data;
      }

      set({ loading: false });
    } catch (err: any) {
      set({ loading: false });
      return err;
    } finally {
      set({ loading: false });
    }
  },

  // Fetch influencer by username
  getInfluencerByUsername: async (username: string) => {
    set({ getUsernameLoading: true });
    try {
      const response = await InfluencerService.getInfluencerByUsername(username);

      if (response?.data) {
        const { influencer, message } = response.data;

        if (influencer) {
          set({
            influencers: [influencer],
            message,
          });
        }

        set({ getUsernameLoading: false });
        return response.data;
      }

      set({ getUsernameLoading: false });
    } catch (err: any) {
      set({ getUsernameLoading: false });
      return err;
    } finally {
      set({ getUsernameLoading: false });
    }
  },

    // Check username availability
    checkUsernameAvailability: async (username: string) => {
    set({ checkUsernameLoading: true }); // Set loading state for username check
    try {
      const response = await InfluencerService.checkUsernameAvailability(username);

      if (response?.data) {
        const { isAvailable, message } = response.data;

        set({
          isUsernameAvailable: isAvailable,
          usernameAvailabilityMessage: message,
        });

        set({ checkUsernameLoading: false });
        return response.data;
      }

      set({ checkUsernameLoading: false });
    } catch (err: any) {
      set({ checkUsernameLoading: false });
      return err;
    } finally {
      set({ checkUsernameLoading: false });
    }
  },

}))
);
