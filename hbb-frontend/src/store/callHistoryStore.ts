import { createWithEqualityFn } from "zustand/traditional";
import { devtools } from "zustand/middleware";
import ProfileService from "../api/profile/profile";

export const useCallHistoryStore = createWithEqualityFn(
  devtools((set, get) => ({
    callHistory: [],
    loading: false,

    getCallHistory: async () => {
      set({ loading: true });
      try {
        const response = await ProfileService.getCallHistory();

        console.log("response.data", response.data);

        if (response.data) {
          if (response.data?.data?.length) {
            set({ callHistory: [...response?.data.data] });
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