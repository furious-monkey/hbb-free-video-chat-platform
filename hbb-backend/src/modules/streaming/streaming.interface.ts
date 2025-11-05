// modules/streaming/streaming.interface.ts - Streaming interfaces for handling stream creation, joining, bidding, and ending

import { StreamSession, User, Bid, Gift, GiftType } from '@prisma/client';

// Extended types with relations
export interface StreamSessionWithRelations extends StreamSession {
  influencer: User & {
    profile?: {
      username?: string | null;
      location?: string | null;
      callRate?: string | null;
    } | null;
  };
  currentExplorer?: (User & {
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  }) | null;
  bids?: BidWithRelations[];
  gifts?: GiftWithRelations[];
}

export interface BidWithRelations extends Bid {
  explorer: User & {
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  };
  streamSession: StreamSession & {
    influencer?: User & {
      profile?: {
        username?: string | null;
        location?: string | null;
      } | null;
    };
  };
}

export interface GiftWithRelations extends Gift {
  sender: User & {
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  };
  receiver: User & {
    profile?: {
      username?: string | null;
      location?: string | null;
    } | null;
  };
  giftType: GiftType;
  streamSession: StreamSession;
}

export interface UserWithProfile extends User {
  profile?: {
    id: string;
    userId: string;
    username?: string | null;
    bio?: string | null;
    location?: string | null;
    interests?: string[];
    category?: string[];
    zodiacSign?: string | null;
    callRate?: string | null;
    likedProfiles?: string[];
    subscriptionPlan?: string | null;
    subscriptionStatus?: string | null;
    viewCount: number;
    likes: number;
    allowLike?: number | null;
  } | null;
}

// Service interfaces
export interface IStreamingService {
  createStreamSession(userId: string, allowBids: boolean, callRate: string, options?: any): Promise<StreamSession>;
  getStreamSession(sessionId: string): Promise<StreamSession | null>;
  endStreamSession(sessionId: string): Promise<StreamSession>;
  updateStreamSettings(sessionId: string, settings: any): Promise<StreamSession>;
  getInfluencerActiveSession(influencerId: string): string | null;
  getLiveStreams(): Promise<StreamSession[]>;
  getStreamBids(sessionId: string): Promise<any[]>;
  getStreamGifts(sessionId: string): Promise<any[]>;
  sendGift(data: any): Promise<{ gift: any; paymentIntent: any }>;
  getGiftTypes(): Promise<any[]>;
  placeBid(data: { sessionId: string; explorerId: string; amount: number }): Promise<{ success: boolean; bid?: any; message: string }>;
  acceptBid(bidId: string): Promise<{ success: boolean; bid?: any; message: string }>;
  rejectBid(bidId: string): Promise<{ success: boolean; bid?: any; message: string }>;
  joinStreamSession(sessionId: string, userId: string): Promise<StreamSession>;
  leaveStreamSession(sessionId: string, userId: string): Promise<void>;
  getSessionStatistics(sessionId: string): Promise<any>;
  validateStreamPermissions(sessionId: string, userId: string, action: string): Promise<boolean>;
  cleanupExpiredSessions(): Promise<void>;
  getHealthStatus(): any;
}

export interface IStreamingRepository {
  createStreamSession(data: any): Promise<StreamSessionWithRelations>;
  getStreamSession(id: string): Promise<StreamSessionWithRelations | null>;
  updateStreamSession(id: string, data: any, transactionManager?: any): Promise<StreamSessionWithRelations>;
  joinStreamSession(data: any): Promise<StreamSessionWithRelations>;
  getLiveStreams(): Promise<StreamSessionWithRelations[]>;
  getStreamBids(sessionId: string, transactionManager?: any): Promise<BidWithRelations[]>;
  getStreamGifts(sessionId: string): Promise<GiftWithRelations[]>;
  sendGift(data: any): Promise<GiftWithRelations>;
  getGiftTypes(): Promise<GiftType[]>;
  getUser(id: string): Promise<UserWithProfile | null>;
  upsertUserProfile(userId: string, data: any): Promise<any>;
  getActiveStreamForInfluencer(influencerId: string): Promise<StreamSession | null>;
  getExpiredSessions(): Promise<StreamSession[]>;
  runInTransaction<T>(callback: (transactionManager: any) => Promise<T>): Promise<T>;
}

// WebSocket event interfaces
export interface StreamCreatedEvent {
  sessionId: string;
  influencerId: string;
  status: string;
  allowBids: boolean;
  callRate: string;
  timestamp: Date;
  streamerId: string;
  title: string;
  createdAt: Date;
}

export interface StreamJoinedEvent {
  success: boolean;
  sessionId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  participantCount: number;
  session?: StreamSessionWithRelations;
  isOtherUser?: boolean;
}

export interface StreamEndedEvent {
  success: boolean;
  session: StreamSessionWithRelations;
}

export interface SessionEndedEvent {
  sessionId: string;
  reason: string;
  endedAt: Date;
}

export interface BidPlacedEvent {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  timestamp: Date;
}

export interface NewBidEvent {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  currentHighestBid: number;
  timestamp: Date;
}

export interface BidAcceptedEvent {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  profileImage?: string;
  streamerId: string;
  streamerName: string;
  acceptedAt: Date;
  explorerLocation: string;
}

export interface BidRejectedEvent {
  bidId: string;
  sessionId: string;
  bidderId: string;
  reason: string;
  rejectedAt: Date;
}

export interface GiftSentEvent {
  giftId: string;
  sessionId: string;
  senderId: string;
  receiverId: string;
  giftType: string;
  value: number;
  timestamp: Date;
}

export interface UserDisconnectedEvent {
  sessionId: string;
  userId: string;
  timestamp: Date;
}

export interface SettingsUpdatedEvent {
  sessionId: string;
  settings: any;
  updatedBy: string;
  timestamp: Date;
}

export interface NewProducerEvent {
  sessionId: string;
  producerId: string;
  userId: string;
  kind: 'audio' | 'video';
}

export interface ProducerClosedEvent {
  sessionId: string;
  producerId: string;
  userId: string;
}

// Payment interfaces
export interface CreatePaymentIntentDTO {
  amount: number;
  currency: string;
  userId: string;
  paymentMethod: string
  metadata?: {
    type: string;
    giftTypeId?: string;
    sessionId?: string;
    influencerId?: string;
    [key: string]: any;
  };
}

export interface PaymentIntentResponse {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

// Stream validation interfaces
export interface StreamValidationResult {
  isValid: boolean;
  redirectSessionId?: string;
  message: string;
}

export interface StreamPermissions {
  canView: boolean;
  canBid: boolean;
  canGift: boolean;
  canModerate: boolean;
  canEndStream: boolean;
}

// Statistics interfaces
export interface StreamStatistics {
  sessionId: string;
  duration: number;
  totalBids: number;
  totalGifts: number;
  participantCount: number;
  status: string;
  earnings: number;
  averageBidAmount: number;
  highestBid: number;
  uniqueViewers: number;
}

// Health check interfaces
export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  activeSessions: number;
  dependencies: {
    streamingRepository: boolean;
    paymentService: boolean;
    webSocketService: boolean;
    bidService: boolean;
  };
  timestamp: Date;
}

// Configuration interfaces
export interface StreamConfig {
  maxConcurrentStreams: number;
  maxStreamDuration: number;
  minCallRate: number;
  maxCallRate: number;
  bidTimeout: number;
  giftTimeout: number;
  cleanupInterval: number;
}

// Error interfaces
export interface StreamError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
}

// Enum-like constants
export const STREAM_STATUS = {
  PENDING: 'PENDING',
  LIVE: 'LIVE',
  ENDED: 'ENDED',
} as const;

export const BID_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export const STREAM_EVENTS = {
  STREAM_CREATED: 'STREAM_CREATED',
  STREAM_JOINED: 'STREAM_JOINED',
  STREAM_ENDED: 'STREAM_ENDED',
  SESSION_ENDED: 'SESSION_ENDED',
  BID_PLACED: 'BID_PLACED',
  NEW_BID: 'NEW_BID',
  BID_ACCEPTED: 'BID_ACCEPTED',
  BID_REJECTED: 'BID_REJECTED',
  GIFT_SENT: 'GIFT_SENT',
  USER_DISCONNECTED: 'USER_DISCONNECTED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  NEW_PRODUCER: 'NEW_PRODUCER',
  PRODUCER_CLOSED: 'PRODUCER_CLOSED',
  NEW_PRODUCER_RETRY: 'NEW_PRODUCER_RETRY',
} as const;

export type StreamStatus = typeof STREAM_STATUS[keyof typeof STREAM_STATUS];
export type BidStatus = typeof BID_STATUS[keyof typeof BID_STATUS];
export type StreamEventType = typeof STREAM_EVENTS[keyof typeof STREAM_EVENTS];