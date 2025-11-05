// frontend/src/api/influencer/influencer.ts - Influencer service for handling influencer related functions
import { InfluencerPayloadInterface } from "@/src/utils/interface";
import { api } from "../index";

export default class InfluencerService {
  static async getInfluencers(payload: InfluencerPayloadInterface) {
    const endpoint = 'influencer/discover';

    const params = new URLSearchParams();

    if (payload?.cursor) {
      params.append('cursor', payload.cursor);
    }

    if (payload?.limit) {
      params.append('limit', String(payload.limit));
    }

    if (payload?.categories?.length) {
      payload.categories.forEach((cat) => {
        params.append('categories', cat);
      });
    }

    if (payload?.search_term) {
      params.append('search_term', payload.search_term);
    }

    if (payload?.is_user_online) {
      params.append('is_user_online', String(payload.is_user_online));
    }

    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

    return api.get(url, {
      withCredentials: true,
    });
  }

  static async getInfluencerByUsername(username: string) {
    const endpoint = `influencer/discover/${username}`;
    return api.get(endpoint, {
      withCredentials: true,
    });
  }

  static async checkUsernameAvailability(username: string) {
    const endpoint = `influencer/discover/check-username/${username}`;
    return api.get(endpoint, {
      withCredentials: true,
    });
  }
}

