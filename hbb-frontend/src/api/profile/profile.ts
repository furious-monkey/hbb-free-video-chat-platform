// frontend/src/api/profile/profile.ts - Profile service for handling profile related functions
import { UserProfilePostInterface } from "@/src/utils/interface";
import { api } from "../index";

export default class ProfileService {
  static async getUserProfile() {
    return api.get("profile", {
      withCredentials: true,
    });
  }
  static async handlePostUserDetails(data: UserProfilePostInterface) {
    return api.post("profile", data, {
      withCredentials: true,
    });
  }

  static async getUserAppointments() {
    return api.get("appointment", {
      withCredentials: true,
    });
  }

  static async getUserProfileviews() {
    return api.get("profile/profile-views", {
      withCredentials: true,
    });
  }

  static async getUserProfileLikes() {
    return api.get("profile/liked-profiles", {
      withCredentials: true,
    });
  }

  static async updateUserProfileImage({ profileImage }: { profileImage: string }) {
    return api.post("user/update-profile-image", { profileImage: profileImage }, {
      withCredentials: true,
    });
  }

  static async updateUserPromotionalVideo({ promotionalVideo }: { promotionalVideo: string }) {
    return api.post("user/update-promotional-videos", { promotionalVideos: [promotionalVideo] }, {
      withCredentials: true,
    });
  }

  static async getCallHistory() {
    return api.get("call-history", {
      withCredentials: true,
    });
  }
}