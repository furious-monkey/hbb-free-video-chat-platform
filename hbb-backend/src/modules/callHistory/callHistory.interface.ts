export interface ICallHistory {
  id: string;
  streamSessionId: string;
  influencerId: string;
  explorerId?: string; // Note this is optional (undefined) not null
  startTime: Date;
  endTime?: Date;
  duration?: number;
  earnings?: number;
  createdAt: Date;
  updatedAt: Date;
  // Add the user details that the frontend expects
  influencer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile: {
      username: string | null;
      location?: string | null;
    } | null;
  };
  explorer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile: {
      username: string | null;
      location?: string | null;
    } | null;
  };
  // Optional: Include stream session details if needed
  streamSession?: {
    id: string;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
  };
  // Include gifts array that the frontend uses
  gifts?: Array<{
    id: string;
    amount: number;
    createdAt: Date | string;
    giftType: {
      name: string;
      imageUrl: string;
      price: number;
    };
  }>;
}

export interface ICallHistoryService {
  getCallHistoryByUserId(userId: string): Promise<ICallHistory[]>;
  createCallHistory(data: {
    streamSessionId: string;
    influencerId: string;
    explorerId?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    earnings?: number;
  }): Promise<ICallHistory>;
}