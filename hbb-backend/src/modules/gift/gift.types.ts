// modules/gift/gift.types.ts - Gift types for handling gift sending and getting gift types
export interface GiftRequest {
    senderId: string;
    receiverId: string;
    streamSessionId: string;
    giftTypeId: string;
    message?: string;
  }
  
  export interface GiftResponse {
    success: boolean;
    message: string;
    gift?: any;
  }