// modules/bid/bid.dto.ts - Complete Bid DTOs for handling bid operations

import { BidStatus } from '@prisma/client';

export interface PlaceBidDTO {
  sessionId: string;
  explorerId: string;
  amount: number;
}

export interface CreateBidDTO {
  streamSessionId: string;
  explorerId: string;
  amount: number;
  status?: BidStatus;
}

export interface UpdateBidDTO {
  status?: BidStatus;
  amount?: number;
}

export interface BidResponseDTO {
  success: boolean;
  message: string;
  bid?: BidWithRelations;
}

export interface BidWithRelations {
  id: string;
  streamSessionId: string;
  explorerId: string;
  amount: number;
  status: BidStatus;
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
    influencer?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profileImage: string | null;
      profile?: {
        username?: string | null;
        location?: string | null;
      } | null;
    };
  };
}

export interface BidStatisticsDTO {
  sessionId: string;
  totalBids: number;
  pendingBids: number;
  acceptedBids: number;
  rejectedBids: number;
  highestBidAmount: number;
  averageBidAmount: number;
  totalBidValue: number;
  uniqueBidders: number;
}

export interface BidValidationDTO {
  sessionId: string;
  influencerId: string;
  amount: number;
  explorerId: string;
}

export interface BidValidationResult {
  isValid: boolean;
  redirectSessionId?: string;
  message: string;
  currentHighestBid?: number;
  minimumBid?: number;
}

export interface AcceptBidDTO {
  bidId: string;
  influencerId: string;
  reason?: string;
}

export interface RejectBidDTO {
  bidId: string;
  influencerId: string;
  reason?: string;
}

export interface BidNotificationDTO {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  profileImage?: string;
  timestamp: Date;
  type: 'placed' | 'accepted' | 'rejected' | 'outbid';
}

export interface OutbidNotificationDTO {
  sessionId: string;
  previousBidderId: string;
  newBidderId: string;
  previousAmount: number;
  newAmount: number;
  timestamp: Date;
}

export interface BidFiltersDTO {
  status?: BidStatus[];
  sessionId?: string;
  explorerId?: string;
  influencerId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'amount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BidListResponseDTO {
  success: boolean;
  bids: BidWithRelations[];
  total: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

export interface BidSummaryDTO {
  explorerId: string;
  totalBidsPlaced: number;
  totalAmountBid: number;
  successfulBids: number;
  rejectedBids: number;
  pendingBids: number;
  averageBidAmount: number;
  highestBid: number;
  successRate: number;
}

export interface InfluencerBidSummaryDTO {
  influencerId: string;
  totalBidsReceived: number;
  totalValueReceived: number;
  acceptedBids: number;
  rejectedBids: number;
  pendingBids: number;
  averageBidValue: number;
  highestBidReceived: number;
  acceptanceRate: number;
}

// Validation constants
export const BID_CONSTRAINTS = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 10000,
  DEFAULT_INCREMENT: 5,
  MAX_BIDS_PER_SESSION: 100,
  BID_EXPIRY_MINUTES: 60,
  MIN_BID_INCREMENT: 1,
} as const;

export const BID_STATUS_VALUES = {
  PENDING: 'PENDING' as BidStatus,
  ACCEPTED: 'ACCEPTED' as BidStatus,
  REJECTED: 'REJECTED' as BidStatus,
} as const;

// Type guards
export function isValidBidStatus(status: string): status is BidStatus {
  return Object.values(BID_STATUS_VALUES).includes(status as BidStatus);
}

export function isValidBidAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    amount >= BID_CONSTRAINTS.MIN_AMOUNT &&
    amount <= BID_CONSTRAINTS.MAX_AMOUNT
  );
}

// Utility functions
export function calculateMinimumBid(currentHighestBid: number): number {
  return currentHighestBid + BID_CONSTRAINTS.MIN_BID_INCREMENT;
}

export function formatBidAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getBidStatusLabel(status: BidStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Accepted';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

// Error response types
export interface BidErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: any;
}

export interface BidSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type BidResponse<T = any> = BidSuccessResponse<T> | BidErrorResponse;

// Pagination types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Audit trail types
export interface BidAuditDTO {
  bidId: string;
  action: 'created' | 'updated' | 'accepted' | 'rejected';
  performedBy: string;
  timestamp: Date;
  oldValues?: Partial<BidWithRelations>;
  newValues?: Partial<BidWithRelations>;
  reason?: string;
}

// Real-time event types
export interface BidEventDTO {
  type: 'bid_placed' | 'bid_accepted' | 'bid_rejected' | 'bid_updated';
  sessionId: string;
  bid: BidWithRelations;
  timestamp: Date;
  metadata?: {
    previousHighestBid?: number;
    newHighestBid?: number;
    totalBids?: number;
    [key: string]: any;
  };
}