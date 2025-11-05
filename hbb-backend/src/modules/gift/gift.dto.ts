// modules/gift/gift.dto.ts - Gift DTOs for handling gift sending and getting gift types
export interface SendGiftDTO {
    senderId: string;
    receiverId: string;
    streamSessionId: string;
    giftTypeId: string;
    message?: string;
}

export interface GiftResponseDTO {
    success: boolean;
    message: string;
    gift?: any;
}