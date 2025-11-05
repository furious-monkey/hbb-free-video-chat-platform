// api/streaming/index.tsx - Streaming API for handling streaming related functions
import { apiRequest } from "../../lib/queryClient";

export const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

interface StartStreamSessionParams {
  influencerId: string;
  allowBids: boolean;
  callRate: number;
}

interface JoinStreamSessionParams {
  sessionId: string;
  explorerId: string;
}

interface PlaceBidParams {
  sessionId: string;
  explorerId: string;
  amount: number;
}

interface SendGiftParams {
  sessionId: string;
  explorerId: string;
  giftTypeId: string;
  influencerId: string;
  message?: string;
}

interface EndStreamSessionParams {
  sessionId: string;
}

interface SendMessageParams {
  sessionId: string;
  senderId: string;
  content: string;
}

interface UpdateStreamSettingsParams {
  allowBids?: boolean;
  callRate?: string;
}

export default class StreamingService {
  static async startStreamSession(data: StartStreamSessionParams) {
    const res = await apiRequest("POST", `${API_URL}/streaming/start`, data);
    return res.json();
  }

  static async joinStreamSession(data: JoinStreamSessionParams) {
    const res = await apiRequest("POST", `${API_URL}/streaming/join`, data);
    return res.json();
  }

  static async placeBid(data: PlaceBidParams) {
    const res = await apiRequest("POST", `${API_URL}/streaming/bid`, data);
    return res.json();
  }

  static async sendGift(data: SendGiftParams) {
    const res = await apiRequest("POST", `${API_URL}/streaming/gift`, data);
    return res.json();
  }

  static async endStreamSession(data: EndStreamSessionParams) {
    const res = await apiRequest("POST", `${API_URL}/streaming/end`, data);
    return res.json();
  }

  static async getAvailableInfluencers() {
    const res = await apiRequest("GET", `${API_URL}/streaming/available`);
    return res.json();
  }

  static async getStreamSessionDetails(sessionId: string) {
    const res = await apiRequest("GET", `${API_URL}/streaming/session/${sessionId}`);
    return res.json();
  }

  static async getLiveStreams() {
    const res = await apiRequest("GET", `${API_URL}/streaming/live`);
    return res.json();
  }

  static async getStreamBids(sessionId: string) {
    const res = await apiRequest("GET", `${API_URL}/streaming/session/${sessionId}/bids`);
    return res.json();
  }

  static async acceptBid(bidId: string) {
    const res = await apiRequest("POST", `${API_URL}/streaming/bid/${bidId}/accept`);
    return res.json();
  }

  static async rejectBid(bidId: string) {
    const res = await apiRequest("POST", `${API_URL}/streaming/bid/${bidId}/reject`);
    return res.json();
  }

  static async getGiftTypes() {
    const res = await apiRequest("GET", `${API_URL}/streaming/gift/types`);
    return res.json();
  }

  static async getStreamGifts(sessionId: string) {
    const res = await apiRequest("GET", `${API_URL}/streaming/session/${sessionId}/gifts`);
    return res.json();
  }

  static async sendMessage(data: SendMessageParams) {
    const res = await apiRequest("POST", `${API_URL}/streaming/message`, data);
    return res.json();
  }

  static async getStreamMessages(sessionId: string) {
    const res = await apiRequest("GET", `${API_URL}/streaming/session/${sessionId}/messages`);
    return res.json();
  }

  static async updateStreamSettings(sessionId: string, data: UpdateStreamSettingsParams) {
    const res = await apiRequest("PATCH", `${API_URL}/streaming/session/${sessionId}/settings`, data);
    return res.json();
  }
}
