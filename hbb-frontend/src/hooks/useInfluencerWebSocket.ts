import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { IPublicInfluencer } from '@/src/types/influencer';

interface InfluencerWebSocketState {
  influencers: IPublicInfluencer[];
  influencersPaginationData: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
  statusBreakdown: {
    live: number;
    online: number;
    offline: number;
    total: number;
  };
  selectedInfluencer: IPublicInfluencer | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setInfluencers: (influencers: IPublicInfluencer[], append?: boolean) => void;
  setPaginationData: (data: { nextCursor: string | null; hasNextPage: boolean }) => void;
  setStatusBreakdown: (breakdown: any) => void;
  setSelectedInfluencer: (influencer: IPublicInfluencer | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateInfluencerStatus: (influencerId: string, status: 'online' | 'offline' | 'live') => void;
  reset: () => void;
}

export const useInfluencerWebSocketStore = create<InfluencerWebSocketState>()(
  devtools((set) => ({
    influencers: [],
    influencersPaginationData: {
      nextCursor: null,
      hasNextPage: false,
    },
    statusBreakdown: {
      live: 0,
      online: 0,
      offline: 0,
      total: 0,
    },
    selectedInfluencer: null,
    loading: false,
    error: null,

    setInfluencers: (influencers, append = false) =>
      set((state) => ({
        influencers: append
          ? [...state.influencers, ...influencers]
          : influencers,
      })),

    setPaginationData: (data) =>
      set({ influencersPaginationData: data }),

    setStatusBreakdown: (breakdown) =>
      set({ statusBreakdown: breakdown }),

    setSelectedInfluencer: (influencer) =>
      set({ selectedInfluencer: influencer }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    updateInfluencerStatus: (influencerId, status) =>
      set((state) => ({
        influencers: state.influencers.map((inf) =>
          inf.id === influencerId
            ? {
                ...inf,
                isOnline: status === 'online' || status === 'live',
                isLive: status === 'live',
              }
            : inf
        ),
      })),

    reset: () =>
      set({
        influencers: [],
        influencersPaginationData: {
          nextCursor: null,
          hasNextPage: false,
        },
        statusBreakdown: {
          live: 0,
          online: 0,
          offline: 0,
          total: 0,
        },
        selectedInfluencer: null,
        loading: false,
        error: null,
      }),
  }))
);