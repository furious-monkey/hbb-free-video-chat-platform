// earnings.interface.ts - Updated with pro-rated bid support
export interface IEarningsUpdate {
  streamSessionId: string;
  amount: number;
  type: 'GIFT' | 'BID_ACCEPTED' | 'TIME_BASED' | 'TIP';
  metadata?: {
    giftId?: string;
    bidId?: string;
    duration?: number; // in seconds
    explorerId?: string;
    originalBidAmount?: number; // For tracking the original bid amount
  };
}

export interface IEarningsSummary {
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  earningsByType: {
    gifts: number;
    bids: number; // Pro-rated earnings from accepted bids
    timeBased: number;
    tips: number;
  };
  recentEarnings: IEarningRecord[];
}

export interface IEarningRecord {
  id: string;
  streamSessionId: string;
  influencerId: string;
  explorerId?: string;
  amount: number;
  type: string;
  description?: string;
  createdAt: Date;
  // Related data
  giftDetails?: {
    giftType: string;
    giftImage?: string;
  };
  explorerDetails?: {
    username: string;
    profileImage?: string;
    location?: string;
  };
  streamDetails?: {
    duration?: number;
    startTime?: Date;
    endTime?: Date;
  };
  bidDetails?: {
    originalBidAmount: number;
    wasProRated: boolean;
    durationMinutes?: string;
  };
}

export interface ITimeBasedEarningsCalculation {
  bidAmount: number;
  actualDurationMinutes: number;
  maxDurationMinutes: number;
  calculatedEarnings: number;
  wasProRated: boolean;
}

export interface IEarningsService {
  updateStreamEarnings(data: IEarningsUpdate): Promise<void>;
  getEarningsSummary(influencerId: string): Promise<IEarningsSummary>;
  getDetailedEarnings(influencerId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    limit?: number;
  }): Promise<IEarningRecord[]>;
  calculateTimeBasedEarnings(sessionId: string, duration: number): Promise<number>;
  calculateAndRecordBidEarnings(sessionId: string): Promise<ITimeBasedEarningsCalculation>;
}