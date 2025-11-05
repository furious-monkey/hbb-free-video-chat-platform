// modules/bid/bid.types.ts - Bid types for handling bid placing

import { Bid as PrismaBid, BidStatus, User, StreamSession, Profile } from '@prisma/client';

// Extended Bid type with relations
export interface Bid extends PrismaBid {
  explorer?: User & {
    profile?: Profile | null;
  };
  streamSession?: StreamSession & {
    influencer?: User & {
      profile?: Profile | null;
    };
  };
}

// Enhanced Bid with full relations
export interface BidWithFullRelations {
  id: string;
  streamSessionId: string;
  explorerId: string;
  amount: number;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
  explorer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    email: string;
    isOnline: boolean;
    profile?: {
      id: string;
      username?: string | null;
      location?: string | null;
      bio?: string | null;
      callRate?: string | null;
    } | null;
  };
  streamSession: {
    id: string;
    influencerId: string;
    currentExplorerId: string | null;
    status: 'PENDING' | 'LIVE' | 'ENDED';
    allowBids: boolean;
    startTime: Date | null;
    endTime: Date | null;
    earnings: number;
    influencer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profileImage: string | null;
      email: string;
      profile?: {
        id: string;
        username?: string | null;
        location?: string | null;
        bio?: string | null;
        callRate?: string | null;
      } | null;
    };
  };
}

// Simplified Bid for API responses
export interface BidApiResponse {
  id: string;
  sessionId: string;
  explorerId: string;
  amount: number;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
  explorer?: {
    id: string;
    name: string;
    username?: string;
    profileImage?: string;
    location?: string;
  };
  session?: {
    id: string;
    influencerId: string;
    status: string;
    allowBids: boolean;
  };
}

// Bid creation data
export interface BidCreationData {
  streamSessionId: string;
  explorerId: string;
  amount: number;
  status?: BidStatus;
}

// Bid update data
export interface BidUpdateData {
  status?: BidStatus;
  amount?: number;
  updatedAt?: Date;
}

// Bid query options
export interface BidQueryOptions {
  includeExplorer?: boolean;
  includeSession?: boolean;
  includeInfluencer?: boolean;
  sortBy?: 'amount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Bid filters
export interface BidFilters {
  status?: BidStatus | BidStatus[];
  sessionId?: string;
  explorerId?: string;
  influencerId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// Bid statistics
export interface BidStatistics {
  totalBids: number;
  pendingBids: number;
  acceptedBids: number;
  rejectedBids: number;
  totalAmount: number;
  averageAmount: number;
  highestBid: number;
  lowestBid: number;
  uniqueBidders: number;
}

// Session bid summary
export interface SessionBidSummary {
  sessionId: string;
  totalBids: number;
  pendingBids: number;
  acceptedBids: number;
  rejectedBids: number;
  highestBid: number;
  averageBid: number;
  totalValue: number;
  topBidders: {
    explorerId: string;
    explorerName: string;
    amount: number;
    status: BidStatus;
  }[];
}

// Explorer bid history
export interface ExplorerBidHistory {
  explorerId: string;
  totalBids: number;
  successfulBids: number;
  rejectedBids: number;
  pendingBids: number;
  totalAmountBid: number;
  averageBid: number;
  highestBid: number;
  successRate: number;
  recentBids: BidApiResponse[];
}

// Influencer bid summary
export interface InfluencerBidSummary {
  influencerId: string;
  totalBidsReceived: number;
  acceptedBids: number;
  rejectedBids: number;
  pendingBids: number;
  totalEarnings: number;
  averageBidValue: number;
  highestBidReceived: number;
  acceptanceRate: number;
  topBidders: {
    explorerId: string;
    explorerName: string;
    totalAmount: number;
    bidCount: number;
  }[];
}

// Bid notification data
export interface BidNotificationData {
  bidId: string;
  sessionId: string;
  explorerId: string;
  explorerName: string;
  amount: number;
  status: BidStatus;
  timestamp: Date;
  profileImage?: string;
  location?: string;
}

// Bid validation result
export interface BidValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAmount?: number;
  currentHighestBid?: number;
  sessionInfo?: {
    id: string;
    status: string;
    allowBids: boolean;
    influencerId: string;
  };
}

// Real-time bid events
export interface BidEvent {
  type: 'BID_PLACED' | 'BID_ACCEPTED' | 'BID_REJECTED' | 'BID_OUTBID';
  sessionId: string;
  bid: BidApiResponse;
  timestamp: Date;
  metadata?: {
    previousHighestBid?: number;
    newHighestBid?: number;
    reason?: string;
    [key: string]: any;
  };
}

// Bid service response types
export interface BidServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export interface PlaceBidResponse extends BidServiceResponse<BidApiResponse> {
  isNewHighest?: boolean;
  previousHighestBid?: number;
  outbidBidders?: string[];
}

export interface AcceptBidResponse extends BidServiceResponse<BidApiResponse> {
  rejectedBids?: string[];
  sessionUpdated?: boolean;
}

export interface RejectBidResponse extends BidServiceResponse<BidApiResponse> {
  reason?: string;
}

// Bid repository interface
export interface IBidRepository {
  createBid(data: BidCreationData, transactionManager?: any): Promise<BidWithFullRelations>;
  getBidById(bidId: string, transactionManager?: any): Promise<BidWithFullRelations | null>;
  updateBidStatus(bidId: string, status: BidStatus, transactionManager?: any): Promise<BidWithFullRelations>;
  getBidsForSession(sessionId: string, transactionManager?: any): Promise<BidWithFullRelations[]>;
  getPendingBidsForSession(sessionId: string, transactionManager?: any): Promise<BidWithFullRelations[]>;
  getBidsForExplorer(explorerId: string): Promise<BidWithFullRelations[]>;
  getBidsForInfluencer(influencerId: string): Promise<BidWithFullRelations[]>;
  getHighestBidForSession(sessionId: string): Promise<BidWithFullRelations | null>;
  deleteBid(bidId: string, transactionManager?: any): Promise<BidWithFullRelations>;
  getBidStatsForSession(sessionId: string): Promise<BidStatistics>;
  bulkUpdateBidStatus(bidIds: string[], status: BidStatus, transactionManager?: any): Promise<number>;
  getRecentBids(limit?: number): Promise<BidWithFullRelations[]>;
  hasExplorerPendingBidForSession(explorerId: string, sessionId: string): Promise<boolean>;
  cleanupOldBids(daysOld?: number): Promise<number>;
}

// Bid service interface
export interface IBidService {
  placeBid(data: { sessionId: string; explorerId: string; amount: number }): Promise<PlaceBidResponse>;
  acceptBid(bidId: string): Promise<AcceptBidResponse>;
  rejectBid(bidId: string): Promise<RejectBidResponse>;
  getBidById(bidId: string): Promise<BidWithFullRelations | null>;
  getBidsForSession(sessionId: string): Promise<BidWithFullRelations[]>;
  getPendingBidsForSession(sessionId: string): Promise<BidWithFullRelations[]>;
  getBidsForExplorer(explorerId: string): Promise<BidWithFullRelations[]>;
  getBidsForInfluencer(influencerId: string): Promise<BidWithFullRelations[]>;
  validateSessionForBid(sessionId: string, influencerId: string): Promise<BidValidationResult>;
  getHealthStatus(): any;
}

// Error types
export interface BidError extends Error {
  code: BidErrorCode;
  statusCode?: number;
  details?: any;
}

export enum BidErrorCode {
  BID_NOT_FOUND = 'BID_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  AMOUNT_TOO_LOW = 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH = 'AMOUNT_TOO_HIGH',
  BIDDING_NOT_ALLOWED = 'BIDDING_NOT_ALLOWED',
  SESSION_NOT_LIVE = 'SESSION_NOT_LIVE',
  EXPLORER_NOT_FOUND = 'EXPLORER_NOT_FOUND',
  INFLUENCER_NOT_FOUND = 'INFLUENCER_NOT_FOUND',
  DUPLICATE_BID = 'DUPLICATE_BID',
  BID_ALREADY_PROCESSED = 'BID_ALREADY_PROCESSED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Configuration types
export interface BidConfig {
  minAmount: number;
  maxAmount: number;
  minIncrement: number;
  maxBidsPerSession: number;
  maxBidsPerUser: number;
  bidTimeoutMinutes: number;
  enableAutoBidding: boolean;
  notificationDelayMs: number;
}

// Audit types
export interface BidAuditLog {
  id: string;
  bidId: string;
  action: 'CREATED' | 'UPDATED' | 'ACCEPTED' | 'REJECTED' | 'DELETED';
  performedBy: string;
  timestamp: Date;
  oldValues?: Partial<BidWithFullRelations>;
  newValues?: Partial<BidWithFullRelations>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Webhook types
export interface BidWebhookPayload {
  event: 'bid.placed' | 'bid.accepted' | 'bid.rejected';
  bid: BidApiResponse;
  session: {
    id: string;
    influencerId: string;
    status: string;
  };
  timestamp: string;
  signature?: string;
}

// Constants
export const BID_CONSTANTS = {
  STATUS: {
    PENDING: 'PENDING' as BidStatus,
    ACCEPTED: 'ACCEPTED' as BidStatus,
    REJECTED: 'REJECTED' as BidStatus,
  },
  LIMITS: {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 10000,
    MIN_INCREMENT: 1,
    MAX_BIDS_PER_SESSION: 100,
    MAX_BIDS_PER_USER: 50,
    TIMEOUT_MINUTES: 60,
  },
  EVENTS: {
    PLACED: 'BID_PLACED',
    ACCEPTED: 'BID_ACCEPTED',
    REJECTED: 'BID_REJECTED',
    OUTBID: 'BID_OUTBID',
  },
} as const;

// Type exports
export type { BidStatus } from '@prisma/client';