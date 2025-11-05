// cookies
import { deleteCookie, getCookie, setCookie } from "cookies-next";
// zustand
import { createWithEqualityFn } from "zustand/traditional";
import { devtools } from "zustand/middleware";
// others
import ProfileService from "../api/profile/profile";
import { toast } from "sonner";
import { UserProfilePostInterface } from "../utils/interface";
import AdminService from "../api/admin/admin";

export const useAdminStore = createWithEqualityFn(
  devtools((set, get) => ({
    faqs: [],
    isAuth: false,
    loading: false,
    isToken: !!getCookie("accessToken"),
    resendLoading: false,
    // Fetch the user profile
    getAdminFaqs: async () => {
      set({ loading: true });
      try {
        const response = await AdminService.getAdminFaq();

        console.log("response.data", response.data);

        if (response.data) {
          if (response.data?.faqs?.length) {
            set({ faqs: [...response?.data.faqs] });
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
