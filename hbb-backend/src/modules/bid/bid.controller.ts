// modules/bid/bid.controller.ts - Complete Bid Controller Implementation
import { Request, Response } from 'express';
import { BidService } from './bid.service';
import { PlaceBidDTO } from './bid.dto';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    userRole?: string;
    email?: string;
  };
}

export class BidController {
  constructor(
    private bidService: BidService,
    private webSocketService?: any
  ) {
    console.log('💰 BidController initialized');
  }

  // Place a new bid
  async placeBid(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('💰 [BidController] Place bid request:', req.body);

      const { sessionId, amount } = req.body;
      const explorerId = req.user.id;

      // Validate required fields
      if (!sessionId || !amount || !explorerId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: sessionId, amount',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      // Validate amount
      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
          code: 'INVALID_AMOUNT',
        });
        return;
      }

      // Validate amount constraints
      if (amount < 1 || amount > 10000) {
        res.status(400).json({
          success: false,
          message: 'Amount must be between $1 and $10,000',
          code: 'AMOUNT_OUT_OF_RANGE',
        });
        return;
      }

      const bidData: PlaceBidDTO = {
        sessionId,
        explorerId,
        amount,
      };

      const result = await this.bidService.placeBid(bidData);

      if (result.success) {
        console.log('✅ [BidController] Bid placed successfully:', result.bid?.id);
        res.status(201).json(result);
      } else {
        console.log('❌ [BidController] Bid placement failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BidController] Error placing bid:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Accept a bid
  async acceptBid(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('✅ [BidController] Accept bid request:', req.params);

      const bidId = req.params.id;
      const userId = req.user.id;

      if (!bidId) {
        res.status(400).json({
          success: false,
          message: 'Bid ID is required',
          code: 'MISSING_BID_ID',
        });
        return;
      }

      // Validate that the bid exists and the user can accept it
      const bid = await this.bidService.getBidById(bidId);
      if (!bid) {
        res.status(404).json({
          success: false,
          message: 'Bid not found',
          code: 'BID_NOT_FOUND',
        });
        return;
      }

      // Check if the user is the influencer of the stream session
      if (bid.streamSession?.influencerId !== userId) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to accept this bid',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const result = await this.bidService.acceptBid(bidId);

      if (result.success) {
        console.log('✅ [BidController] Bid accepted successfully:', bidId);
        res.status(200).json(result);
      } else {
        console.log('❌ [BidController] Bid acceptance failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BidController] Error accepting bid:', error);
      
      // Send error response to client
      res.status(500).json({
        success: false,
        message: 'Internal server error while accepting bid',
        code: 'BID_ACCEPT_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      });
      
      // Also send WebSocket error notification
      if (this.webSocketService) {
        this.webSocketService.notifyError({
          message: 'Failed to accept bid due to server error',
          code: 'BID_ACCEPT_ERROR',
          timestamp: new Date(),
        });
      }
    }
  }

  // Reject a bid
  async rejectBid(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🚫 [BidController] Reject bid request:', req.params);

      const bidId = req.params.id;
      const userId = req.user.id;
      const { reason } = req.body;

      if (!bidId) {
        res.status(400).json({
          success: false,
          message: 'Bid ID is required',
          code: 'MISSING_BID_ID',
        });
        return;
      }

      // Validate that the bid exists and the user can reject it
      const bid = await this.bidService.getBidById(bidId);
      if (!bid) {
        res.status(404).json({
          success: false,
          message: 'Bid not found',
          code: 'BID_NOT_FOUND',
        });
        return;
      }

      // Check if the user is the influencer of the stream session
      if (bid.streamSession?.influencerId !== userId) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to reject this bid',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const result = await this.bidService.rejectBid(bidId);

      if (result.success) {
        console.log('🚫 [BidController] Bid rejected successfully:', bidId);
        res.status(200).json(result);
      } else {
        console.log('❌ [BidController] Bid rejection failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('❌ [BidController] Error rejecting bid:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get bid by ID
  async getBidById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BidController] Get bid by ID request:', req.params);

      const bidId = req.params.id;
      const userId = req.user.id;

      if (!bidId) {
        res.status(400).json({
          success: false,
          message: 'Bid ID is required',
          code: 'MISSING_BID_ID',
        });
        return;
      }

      const bid = await this.bidService.getBidById(bidId);

      if (!bid) {
        res.status(404).json({
          success: false,
          message: 'Bid not found',
          code: 'BID_NOT_FOUND',
        });
        return;
      }

      // Check if the user is authorized to view this bid
      const isExplorer = bid.explorerId === userId;
      const isInfluencer = bid.streamSession?.influencerId === userId;

      if (!isExplorer && !isInfluencer) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to view this bid',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      console.log('✅ [BidController] Bid retrieved successfully:', bidId);
      res.status(200).json({
        success: true,
        bid,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting bid by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get bids for a session
  async getBidsForSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BidController] Get bids for session request:', req.params);

      const sessionId = req.params.sessionId;
      const userId = req.user.id;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID',
        });
        return;
      }

      // TODO: Add authorization check to ensure user can view bids for this session
      // For now, we'll allow it but in production you might want to restrict this

      const bids = await this.bidService.getBidsForSession(sessionId);

      console.log('✅ [BidController] Bids retrieved successfully for session:', sessionId);
      res.status(200).json({
        success: true,
        bids,
        total: bids.length,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting bids for session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get pending bids for a session
  async getPendingBidsForSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BidController] Get pending bids for session request:', req.params);

      const sessionId = req.params.sessionId;
      const userId = req.user.id;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID',
        });
        return;
      }

      const pendingBids = await this.bidService.getPendingBidsForSession(sessionId);

      console.log('✅ [BidController] Pending bids retrieved successfully for session:', sessionId);
      res.status(200).json({
        success: true,
        bids: pendingBids,
        total: pendingBids.length,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting pending bids for session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get bids for explorer
  async getBidsForExplorer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BidController] Get bids for explorer request');

      const userId = req.user.id;
      const explorerId = req.params.explorerId || userId; // Default to current user

      // Only allow users to see their own bids unless they are admin
      if (explorerId !== userId && req.user.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You can only view your own bids',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const bids = await this.bidService.getBidsForExplorer(explorerId);

      console.log('✅ [BidController] Bids retrieved successfully for explorer:', explorerId);
      res.status(200).json({
        success: true,
        bids,
        total: bids.length,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting bids for explorer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get bids for influencer
  async getBidsForInfluencer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BidController] Get bids for influencer request');

      const userId = req.user.id;
      const influencerId = req.params.influencerId || userId; // Default to current user

      // Only allow users to see their own bids unless they are admin
      if (influencerId !== userId && req.user.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You can only view your own bids',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const bids = await this.bidService.getBidsForInfluencer(influencerId);

      console.log('✅ [BidController] Bids retrieved successfully for influencer:', influencerId);
      res.status(200).json({
        success: true,
        bids,
        total: bids.length,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting bids for influencer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Validate session for bidding
  async validateSessionForBid(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [BidController] Validate session for bid request:', req.params);

      const sessionId = req.params.sessionId;
      const influencerId = req.params.influencerId;

      if (!sessionId || !influencerId) {
        res.status(400).json({
          success: false,
          message: 'Session ID and Influencer ID are required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const validationResult = await this.bidService.validateSessionForBid(sessionId, influencerId);

      console.log('✅ [BidController] Session validation completed:', validationResult);
      res.status(200).json({
        success: true,
        validation: validationResult,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error validating session for bid:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get bid statistics for a session
  async getBidStatsForSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 [BidController] Get bid stats for session request:', req.params);

      const sessionId = req.params.sessionId;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID',
        });
        return;
      }

      // Get the statistics through repository (if available)
      // For now, we'll calculate basic stats from the bids
      const bids = await this.bidService.getBidsForSession(sessionId);
      const pendingBids = await this.bidService.getPendingBidsForSession(sessionId);

      const stats = {
        totalBids: bids.length,
        pendingBids: pendingBids.length,
        acceptedBids: bids.filter(bid => bid.status === 'ACCEPTED').length,
        rejectedBids: bids.filter(bid => bid.status === 'REJECTED').length,
        totalAmount: bids.reduce((sum, bid) => sum + bid.amount, 0),
        averageAmount: bids.length > 0 ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length : 0,
        highestBid: bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0,
        lowestBid: bids.length > 0 ? Math.min(...bids.map(bid => bid.amount)) : 0,
      };

      console.log('✅ [BidController] Bid stats retrieved successfully for session:', sessionId);
      res.status(200).json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting bid stats for session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Health check endpoint
  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = this.bidService.getHealthStatus();
      
      res.status(200).json({
        success: true,
        health: healthStatus,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting health status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Admin-only: Get recent bids across all sessions
  async getRecentBids(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 [BidController] Get recent bids request');

      // Check if user is admin
      if (req.user.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
          code: 'ADMIN_ONLY',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      
      // This would need to be implemented in the service/repository
      // For now, we'll return an empty array with a note
      res.status(200).json({
        success: true,
        bids: [],
        total: 0,
        message: 'Recent bids endpoint needs to be implemented in service layer',
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting recent bids:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get bid summary for explorer
  async getExplorerBidSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 [BidController] Get explorer bid summary request');

      const userId = req.user.id;
      const explorerId = req.params.explorerId || userId;

      // Only allow users to see their own summary unless they are admin
      if (explorerId !== userId && req.user.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You can only view your own bid summary',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const bids = await this.bidService.getBidsForExplorer(explorerId);

      const summary = {
        explorerId,
        totalBidsPlaced: bids.length,
        totalAmountBid: bids.reduce((sum, bid) => sum + bid.amount, 0),
        successfulBids: bids.filter(bid => bid.status === 'ACCEPTED').length,
        rejectedBids: bids.filter(bid => bid.status === 'REJECTED').length,
        pendingBids: bids.filter(bid => bid.status === 'PENDING').length,
        averageBidAmount: bids.length > 0 ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length : 0,
        highestBid: bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0,
        successRate: bids.length > 0 ? (bids.filter(bid => bid.status === 'ACCEPTED').length / bids.length) * 100 : 0,
      };

      console.log('✅ [BidController] Explorer bid summary retrieved successfully:', explorerId);
      res.status(200).json({
        success: true,
        summary,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting explorer bid summary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get bid summary for influencer
  async getInfluencerBidSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 [BidController] Get influencer bid summary request');

      const userId = req.user.id;
      const influencerId = req.params.influencerId || userId;

      // Only allow users to see their own summary unless they are admin
      if (influencerId !== userId && req.user.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You can only view your own bid summary',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const bids = await this.bidService.getBidsForInfluencer(influencerId);

      const summary = {
        influencerId,
        totalBidsReceived: bids.length,
        totalValueReceived: bids.reduce((sum, bid) => sum + bid.amount, 0),
        acceptedBids: bids.filter(bid => bid.status === 'ACCEPTED').length,
        rejectedBids: bids.filter(bid => bid.status === 'REJECTED').length,
        pendingBids: bids.filter(bid => bid.status === 'PENDING').length,
        averageBidValue: bids.length > 0 ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length : 0,
        highestBidReceived: bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0,
        acceptanceRate: bids.length > 0 ? (bids.filter(bid => bid.status === 'ACCEPTED').length / bids.length) * 100 : 0,
      };

      console.log('✅ [BidController] Influencer bid summary retrieved successfully:', influencerId);
      res.status(200).json({
        success: true,
        summary,
      });
    } catch (error: any) {
      console.error('❌ [BidController] Error getting influencer bid summary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}