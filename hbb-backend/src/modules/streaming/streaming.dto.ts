// modules/streaming/streaming.dto.ts - Streaming DTOs for handling stream creation, joining, bidding, and ending

export interface CreateStreamSessionDTO {
  influencerId: string;
  allowBids: boolean;
  callRate: string;
}

export interface JoinStreamDTO {
  sessionId: string;
  explorerId: string;
}

export interface PlaceBidDTO {
  sessionId: string;
  explorerId: string;
  amount: number;
}

export interface SendGiftDTO {
  sessionId: string;
  explorerId: string;
  influencerId: string;
  giftTypeId: string;
  amount: number;
  message?: string;
}

export interface UpdateStreamSettingsDTO {
  allowBids?: boolean;
  callRate?: string;
  title?: string;
  description?: string;
  tags?: string[];
  thumbnailUrl?: string;
  isPrivate?: boolean;
}

export interface StreamSessionResponseDTO {
  id: string;
  influencerId: string;
  currentExplorerId: string | null;
  status: 'PENDING' | 'LIVE' | 'ENDED';
  allowBids: boolean;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  earnings: number;
  createdAt: Date;
  updatedAt: Date;
  influencer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile?: {
      username?: string | null;
      location?: string | null;
      callRate?: string | null;
    } | null;
  };
  currentExplorer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  } | null;
}

export interface BidResponseDTO {
  id: string;
  streamSessionId: string;
  explorerId: string;
  amount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  explorer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  };
  streamSession?: {
    id: string;
    influencerId: string;
    status: string;
    allowBids: boolean;
    currentExplorerId: string | null;
  };
}

export interface GiftResponseDTO {
  id: string;
  streamSessionId: string;
  senderId: string;
  receiverId: string;
  giftTypeId: string;
  amount: number;
  message?: string | null;
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  };
  receiver?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  };
  giftType?: {
    id: string;
    name: string;
    imageUrl: string;
    soundUrl: string;
    price: number;
    isActive: boolean;
  };
}

export interface GiftTypeResponseDTO {
  id: string;
  name: string;
  imageUrl: string;
  soundUrl: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionStatisticsDTO {
  sessionId: string;
  duration: number;
  totalBids: number;
  totalGifts: number;
  participantCount: number;
  status: string;
  earnings: number;
}

export interface WebRTCSignalingDTO {
  sessionId: string;
  peerId: string;
  data: any; // SDP or ICE candidate
}

export interface SendMessageDTO {
  sessionId: string;
  senderId: string;
  content: string;
}

export interface MessageResponseDTO {
  id: string;
  streamSessionId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  };
}

// Validation constants
export const STREAM_CONSTRAINTS = {
  MIN_CALL_RATE: 0.01,
  MAX_CALL_RATE: 1000,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAGS: 10,
  MAX_SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

export const GIFT_CONSTRAINTS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000,
  MAX_MESSAGE_LENGTH: 200,
} as const;

// Type guards
export function isValidStreamStatus(status: string): status is 'PENDING' | 'LIVE' | 'ENDED' {
  return ['PENDING', 'LIVE', 'ENDED'].includes(status);
}

export function isValidBidStatus(status: string): status is 'PENDING' | 'ACCEPTED' | 'REJECTED' {
  return ['PENDING', 'ACCEPTED', 'REJECTED'].includes(status);
}

// Error response types
export interface StreamErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: any;
}

export interface StreamSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type StreamResponse<T = any> = StreamSuccessResponse<T> | StreamErrorResponse;