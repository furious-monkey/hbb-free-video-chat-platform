// frontend/src/api/earnings/earnings.ts
import { api } from "../index";

interface EarningsFilterPayload {
  startDate?: string;
  endDate?: string;
  type?: string;
  limit?: number;
}

export default class EarningsService {
  static async getEarningsSummary() {
    const endpoint = 'earnings/summary';
    return api.get(endpoint, {
      withCredentials: true,
    });
  }

  static async getDetailedEarnings(payload?: EarningsFilterPayload) {
    const endpoint = 'earnings/detailed';

    const params = new URLSearchParams();

    if (payload?.startDate) {
      params.append('startDate', payload.startDate);
    }

    if (payload?.endDate) {
      params.append('endDate', payload.endDate);
    }

    if (payload?.type) {
      params.append('type', payload.type);
    }

    if (payload?.limit) {
      params.append('limit', String(payload.limit));
    }

    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

    return api.get(url, {
      withCredentials: true,
    });
  }
}