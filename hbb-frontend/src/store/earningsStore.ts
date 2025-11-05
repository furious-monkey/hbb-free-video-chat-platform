// frontend/src/store/earningsStore.ts
import { createWithEqualityFn } from "zustand/traditional";
import { devtools } from "zustand/middleware";
import EarningsService from "../api/earnings/earnings";

export const useEarningsStore = createWithEqualityFn(
  devtools((set, get) => ({
    totalEarnings: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    recentEarnings: [],
    summaryLoading: false,
    detailedLoading: false,

    getEarningsSummary: async () => {
      set({ summaryLoading: true });
      try {
        const response = await EarningsService.getEarningsSummary();

        console.log("response.data", response.data);

        if (response.data) {
          const data = response.data?.data;
          
          if (data) {
            // Format earnings for display
            const formattedEarnings = data.recentEarnings?.map((earning: any) => {
              const date = new Date(earning.createdAt);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNumber = date.getDate().toString().padStart(2, '0');
              
              let displayType = earning.type;
              let displayIcon = "/img/live 1.svg";
              
              if (earning.type === 'GIFT' && earning.giftDetails) {
                displayType = earning.giftDetails.giftType;
                displayIcon = earning.giftDetails.giftImage || "/img/gift.svg";
              } else if (earning.type === 'TIME_BASED') {
                displayType = 'Video chat';
              } else if (earning.type === 'TIP') {
                displayType = 'Tip';
                displayIcon = "/img/tip.svg";
              }

              return {
                id: earning.id,
                name: earning.explorerDetails?.username || 'Unknown User',
                location: earning.explorerDetails?.location || 'Unknown Location',
                profileImage: earning.explorerDetails?.profileImage || "/img/avatar.png",
                day: dayName,
                date: dayNumber,
                displayType,
                displayIcon,
                amount: earning.amount,
                giftType: displayType, // For backward compatibility
              };
            }) || [];

            set({ 
              totalEarnings: data.totalEarnings || 0,
              todayEarnings: data.todayEarnings || 0,
              weeklyEarnings: data.weeklyEarnings || 0,
              monthlyEarnings: data.monthlyEarnings || 0,
              recentEarnings: formattedEarnings,
              summaryLoading: false 
            });
          }
          
          return response.data;
        }

        set({ summaryLoading: false });
      } catch (err: any) {
        set({ summaryLoading: false });
        return err;
      }
    },

    getDetailedEarnings: async (params?: any) => {
      set({ detailedLoading: true });
      try {
        const response = await EarningsService.getDetailedEarnings(params);

        console.log("detailed response.data", response.data);

        if (response.data) {
          // Handle detailed earnings if needed
          set({ detailedLoading: false });
          return response.data;
        }

        set({ detailedLoading: false });
      } catch (err: any) {
        set({ detailedLoading: false });
        return err;
      }
    },
  }))
);