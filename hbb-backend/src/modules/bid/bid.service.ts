// modules/bid/bid.service.ts - 
import { BidRepository } from './bid.repository';
import { StreamingRepository } from '../streaming/streaming.repository';
import { WebSocketService } from '../../websocket/websocket.service';
import { PaymentService } from '../payment/payment.service';
import { BillingService } from '../billing/billing.service';
import { PlaceBidDTO, BidResponseDTO, BidWithRelations, CreateBidDTO } from './bid.dto';
import { 
  BidValidationResult
} from './bid.types';

export class BidService {
  constructor(
    private bidRepository: BidRepository,
    private streamingRepository: StreamingRepository,
    private webSocketService: WebSocketService,
    private paymentService: PaymentService,
    private billingService: BillingService,
  ) {
    console.log('💰 BidService initialized');
  }

  // Enhanced bid placement with session resolution
  async placeBid(data: PlaceBidDTO): Promise<BidResponseDTO> {
    try {
      console.log('💰 BidService: Placing bid:', data);

      // Resolve the correct session for bidding
      const { resolvedSessionId, originalSession } = await this.resolveTargetSession(data.sessionId);
      
      if (resolvedSessionId !== data.sessionId) {
        console.log(`🔄 BidService: Redirecting bid from ${data.sessionId} to ${resolvedSessionId}`);
        // Update the bid data to use the resolved session
        data.sessionId = resolvedSessionId;
      }

      // Validate the resolved session
      const session = await this.streamingRepository.getStreamSession(data.sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Stream session not found',
          bid: undefined,
        };
      }

      if (session.status !== 'LIVE') {
        return {
          success: false,
          message: 'Stream session is not live',
          bid: undefined,
        };
      }

      if (!session.allowBids) {
        return {
          success: false,
          message: 'Bidding is not allowed for this stream',
          bid: undefined,
        };
      }

      // Check for existing higher bids
      const existingBids = await this.bidRepository.getPendingBidsForSession(data.sessionId);
      const highestBid: number = existingBids.length > 0 
        ? Math.max(...existingBids.map((bid: any) => bid.amount)) 
        : 0;

      if (data.amount <= highestBid) {
        return {
          success: false,
          message: `Bid must be higher than current highest bid ($${highestBid})`,
          bid: undefined,
        };
      }

      // Get explorer details for notifications
      const explorer = await this.streamingRepository.getUser(data.explorerId);
      if (!explorer) {
        return {
          success: false,
          message: 'Explorer not found',
          bid: undefined,
        };
      }

      // Create the bid with the resolved session ID
      const createBidData: CreateBidDTO = {
        streamSessionId: data.sessionId, // Use resolved session ID
        explorerId: data.explorerId,
        amount: data.amount,
        status: 'PENDING',
      };

      const bid = await this.bidRepository.createBid(createBidData);

      console.log('💰 BidService: Bid created successfully:', {
        bidId: bid.id,
        amount: data.amount,
        explorerName: `${explorer.firstName} ${explorer.lastName}`,
      });

      // Send notifications using the resolved session ID
      const notificationData = {
        bidId: bid.id,
        sessionId: data.sessionId, // Resolved session ID
        amount: data.amount,
        bidderId: data.explorerId,
        bidderName: `${explorer.firstName} ${explorer.lastName}`,
        userName: explorer.profile?.username || `${explorer.firstName} ${explorer.lastName}`,
        profileImage: explorer.profileImage,
        timestamp: new Date(),
        currentHighestBid: data.amount,
        isNewHighest: true,
      };

      console.log('💰 BidService: Sending notifications with data:', notificationData);

      // Send notifications to the correct session
      this.sendBidNotifications(notificationData);

      console.log('💰 BidService: All notifications sent successfully');

      return {
        success: true,
        message: 'Bid placed successfully',
        bid: {
          ...bid,
          explorer: {
            ...explorer,
            profileImage: explorer.profileImage ?? null,
          },
          streamSession: session,
        },
      };
    } catch (error) {
      console.error('💰 BidService: Error placing bid:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to place bid',
        bid: undefined,
      };
    }
  }

  // Method to resolve the target session for bidding
  private async resolveTargetSession(providedSessionId: string): Promise<{
    resolvedSessionId: string;
    originalSession: any;
  }> {
    // Get the original session
    const originalSession = await this.streamingRepository.getStreamSession(providedSessionId);
    if (!originalSession) {
      throw new Error('Original session not found');
    }

    // If the session is live, use it as-is
    if (originalSession.status === 'LIVE') {
      return {
        resolvedSessionId: providedSessionId,
        originalSession,
      };
    }

    // If the session is not live, try to find the influencer's current active session
    const influencerId = originalSession.influencerId;
    const activeSessions = await this.streamingRepository.getLiveStreams();
    
    // Find the influencer's current live session
    const currentLiveSession = activeSessions.find(
      session => session.influencerId === influencerId && session.status === 'LIVE'
    );

    if (currentLiveSession) {
      console.log(`🔄 BidService: Found current live session ${currentLiveSession.id} for influencer ${influencerId}`);
      return {
        resolvedSessionId: currentLiveSession.id,
        originalSession,
      };
    }

    // If no current live session found, stick with the original
    return {
      resolvedSessionId: providedSessionId,
      originalSession,
    };
  }

  // Enhanced bid acceptance without immediate earnings recording
  async acceptBid(bidId: string): Promise<BidResponseDTO> {
    try {
      console.log('✅ BidService: Accepting bid:', bidId);

      const bid = await this.bidRepository.getBidById(bidId);
      if (!bid) {
        return {
          success: false,
          message: 'Bid not found',
          bid: undefined,
        };
      }

      if (bid.status !== 'PENDING') {
        return {
          success: false,
          message: 'Bid is not pending',
          bid: undefined,
        };
      }

      // Get the original session from the bid
      const originalSession = await this.streamingRepository.getStreamSession(bid.streamSessionId);
      if (!originalSession) {
        return {
          success: false,
          message: 'Original stream session not found',
          bid: undefined,
        };
      }

      // Resolve to the influencer's current active session
      const { resolvedSessionId } = await this.resolveTargetSession(bid.streamSessionId);
      
      const targetSession = await this.streamingRepository.getStreamSession(resolvedSessionId);
      if (!targetSession) {
        return {
          success: false,
          message: 'Target stream session not found',
          bid: undefined,
        };
      }

      if (targetSession.status !== 'LIVE') {
        return {
          success: false,
          message: 'Target stream session is not live',
          bid: undefined,
        };
      }

      // Get explorer and influencer details
      const explorer = await this.streamingRepository.getUser(bid.explorerId);
      const influencer = await this.streamingRepository.getUser(targetSession.influencerId);

      if (!explorer || !influencer) {
        return {
          success: false,
          message: 'Explorer or influencer not found',
          bid: undefined,
        };
      }

      // Get other pending bids BEFORE starting transaction to avoid transaction issues
      const otherBids = await this.bidRepository.getPendingBidsForSession(resolvedSessionId);
      const otherPendingBids = otherBids.filter((b: any) => b.id !== bidId);

      console.log(`🔄 [BidService] Processing ${otherPendingBids.length} other bids to reject`);

      // Start database transaction (optimized - only essential database operations)
      let updatedBid;
      try {
        updatedBid = await this.streamingRepository.runInTransaction(async (transactionManager) => {
          try {
            // Update bid status
            const bidUpdate = await this.bidRepository.updateBidStatus(bidId, 'ACCEPTED', transactionManager);

            // Update the TARGET session (influencer's current active session)
            await this.streamingRepository.updateStreamSession(
              resolvedSessionId, // Use resolved session ID
              { currentExplorerId: bid.explorerId },
              transactionManager
            );

            // Reject other pending bids for the TARGET session
            for (const otherBid of otherPendingBids) {
              await this.bidRepository.updateBidStatus(otherBid.id, 'REJECTED', transactionManager);
            }

            return { bidUpdate, rejectedBids: otherPendingBids };
          } catch (transactionError) {
            console.error('❌ [BidService] Transaction error:', transactionError);
            throw transactionError;
          }
        });
      } catch (transactionError) {
        console.error('❌ [BidService] Transaction failed, trying fallback approach:', transactionError);
        
        // Fallback: Update without transaction
        const bidUpdate = await this.bidRepository.updateBidStatus(bidId, 'ACCEPTED');
        await this.streamingRepository.updateStreamSession(
          resolvedSessionId,
          { currentExplorerId: bid.explorerId }
        );
        
        // Reject other bids without transaction
        for (const otherBid of otherPendingBids) {
          try {
            await this.bidRepository.updateBidStatus(otherBid.id, 'REJECTED');
          } catch (rejectError) {
            console.error(`❌ [BidService] Failed to reject bid ${otherBid.id}:`, rejectError);
          }
        }
        
        updatedBid = { bidUpdate, rejectedBids: otherPendingBids };
      }

      // Send notifications outside the transaction to avoid timeout
      const { rejectedBids } = updatedBid as any;
      for (const otherBid of rejectedBids) {
        // Notify rejected bidders
        const rejectedExplorer = await this.streamingRepository.getUser(otherBid.explorerId);
        if (rejectedExplorer) {
          this.webSocketService.notifyBidRejected({
            bidId: otherBid.id,
            sessionId: resolvedSessionId, // Use resolved session ID
            bidderId: otherBid.explorerId,
            reason: 'Another bid was accepted',
            rejectedAt: new Date(),
          });
        }
      }

      // NOTE: Earnings will be calculated when the stream ends based on actual duration
      // No immediate earnings recording here

      // Process billing for the accepted bid
      if (this.billingService) {
        console.log('💳 BidService: Processing billing for accepted bid:', bidId);
        
        const billingResult = await this.billingService.processBidPayment(bidId);
        
        if (!billingResult.success) {
          console.error('❌ BidService: Billing processing failed:', billingResult.message);
          
          // Revert the bid acceptance if billing fails
          await this.bidRepository.updateBidStatus(bidId, 'PENDING');
          
          return {
            success: false,
            message: `Bid accepted but payment processing failed: ${billingResult.message}`,
            bid: undefined,
          };
        }
        
        console.log('✅ BidService: Billing processed successfully:', billingResult.paymentIntentId);
      }

      // Send bid accepted notification with the TARGET session ID
      const notificationData = {
        bidId,
        sessionId: resolvedSessionId, // Use the target session ID where explorer should join
        amount: bid.amount,
        bidderId: bid.explorerId,
        bidderName: `${explorer.firstName} ${explorer.lastName}`,
        profileImage: explorer.profileImage ?? undefined,
        streamerId: targetSession.influencerId,
        streamerName: `${influencer.firstName} ${influencer.lastName}`,
        acceptedAt: new Date(),
        explorerLocation: explorer.profile?.location || 'Unknown',
      };

      console.log('✅ BidService: Sending bid accepted notifications:', notificationData);

      // Send notifications
      this.webSocketService.notifyBidAccepted(notificationData);

      console.log('✅ BidService: Bid accepted successfully and notifications sent');

      return {
        success: true,
        message: 'Bid accepted successfully',
        bid: {
          ...(updatedBid as any).bidUpdate,
          explorer: {
            ...explorer,
            profileImage: explorer.profileImage ?? null,
          },
          streamSession: targetSession, // Return the target session
        },
      };
    } catch (error) {
      console.error('✅ BidService: Error accepting bid:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to accept bid',
        bid: undefined,
      };
    }
  }

  async rejectBid(bidId: string): Promise<BidResponseDTO> {
    try {
      console.log('🚫 BidService: Rejecting bid:', bidId);

      const bid = await this.bidRepository.getBidById(bidId);
      if (!bid) {
        return {
          success: false,
          message: 'Bid not found',
          bid: undefined,
        };
      }

      if (bid.status !== 'PENDING') {
        return {
          success: false,
          message: 'Bid is not pending',
          bid: undefined,
        };
      }

      const updatedBid = await this.bidRepository.updateBidStatus(bidId, 'REJECTED');

      // Get explorer details for notification
      const explorer = await this.streamingRepository.getUser(bid.explorerId);
      
      // Send rejection notification
      this.webSocketService.notifyBidRejected({
        bidId,
        sessionId: bid.streamSessionId,
        bidderId: bid.explorerId,
        reason: 'Bid rejected by influencer',
        rejectedAt: new Date(),
      });

      console.log('🚫 BidService: Bid rejected successfully');

      return {
        success: true,
        message: 'Bid rejected successfully',
        bid: {
          ...updatedBid,
          explorer: explorer
            ? {
                id: explorer.id,
                firstName: explorer.firstName ?? null,
                lastName: explorer.lastName ?? null,
                profileImage: explorer.profileImage ?? null,
                profile: explorer.profile
                  ? {
                      username: explorer.profile.username ?? `${explorer.firstName} ${explorer.lastName}`,
                      location: explorer.profile.location ?? null,
                    }
                  : null,
              }
            : undefined,
        },
      };
    } catch (error) {
      console.error('🚫 BidService: Error rejecting bid:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject bid',
        bid: undefined,
      };
    }
  }

  // Helper method to send bid notifications
  private sendBidNotifications(data: any): void {
    try {
      // Send NEW_BID notification to the session
      this.webSocketService.emitToSession(data.sessionId, 'NEW_BID', {
        bidId: data.bidId,
        sessionId: data.sessionId,
        amount: data.amount,
        bidderId: data.bidderId,
        bidderName: data.bidderName,
        timestamp: data.timestamp,
        currentHighestBid: data.currentHighestBid,
        isNewHighest: data.isNewHighest,
      });

      // Also send BID_PLACED for backward compatibility
      this.webSocketService.emitToSession(data.sessionId, 'BID_PLACED', {
        bidId: data.bidId,
        sessionId: data.sessionId,
        amount: data.amount,
        bidderId: data.bidderId,
        bidderName: data.bidderName,
        timestamp: data.timestamp,
      });

      console.log('💰 BidService: Notifications sent to session:', data.sessionId);
    } catch (error) {
      console.error('💰 BidService: Error sending notifications:', error);
    }
  }

  // Utility methods
  async getBidById(bidId: string): Promise<any> {
    return this.bidRepository.getBidById(bidId);
  }

  async getBidsForSession(sessionId: string): Promise<any[]> {
    return this.bidRepository.getBidsForSession(sessionId);
  }

  async getPendingBidsForSession(sessionId: string): Promise<any[]> {
    return this.bidRepository.getPendingBidsForSession(sessionId);
  }

  async getBidsForExplorer(explorerId: string): Promise<any[]> {
    return this.bidRepository.getBidsForExplorer(explorerId);
  }

  // Enhanced method to get bids for influencer's current session
  async getBidsForInfluencer(influencerId: string): Promise<any[]> {
    try {
      // Get all live sessions for this influencer
      const liveSessions = await this.streamingRepository.getLiveStreams();
      const influencerSessions = liveSessions.filter(session => session.influencerId === influencerId);

      if (influencerSessions.length === 0) {
        return [];
      }

      // Get bids for all influencer sessions (prioritize the most recent)
      const allBids: any[] = [];
      
      for (const session of influencerSessions) {
        const sessionBids = await this.bidRepository.getBidsForSession(session.id);
        allBids.push(...sessionBids);
      }

      // Sort by creation date (most recent first)
      return allBids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting bids for influencer:', error);
      return [];
    }
  }

  // Method to validate session for bidding
  async validateSessionForBid(sessionId: string, influencerId: string): Promise<BidValidationResult> {
    try {
      const session = await this.streamingRepository.getStreamSession(sessionId);
      if (!session) {
        return {
          isValid: false,
          errors: ['Session not found'],
          warnings: [],
        };
      }

      if (session.influencerId !== influencerId) {
        return {
          isValid: false,
          errors: ['Session does not belong to the specified influencer'],
          warnings: [],
        };
      }

      // Check if this is still the active session
      const { resolvedSessionId } = await this.resolveTargetSession(sessionId);
      
      if (resolvedSessionId !== sessionId) {
        return {
          isValid: false,
          errors: ['Session is not the current active session'],
          warnings: [],
          sessionInfo: {
            id: resolvedSessionId,
            status: 'LIVE',
            allowBids: true,
            influencerId,
          },
        };
      }

      if (session.status !== 'LIVE') {
        return {
          isValid: false,
          errors: ['Session is not live'],
          warnings: [],
        };
      }

      if (!session.allowBids) {
        return {
          isValid: false,
          errors: ['Bidding is not allowed for this session'],
          warnings: [],
        };
      }

      return {
        isValid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      console.error('Error validating session for bid:', error);
      return {
        isValid: false,
        errors: ['Failed to validate session'],
        warnings: [],
      };
    }
  }

  // Get service health status
  getHealthStatus(): any {
    return {
      service: 'BidService',
      status: 'healthy',
      dependencies: {
        bidRepository: !!this.bidRepository,
        streamingRepository: !!this.streamingRepository,
        webSocketService: !!this.webSocketService,
        paymentService: !!this.paymentService,
      },
      timestamp: new Date(),
    };
  }
}