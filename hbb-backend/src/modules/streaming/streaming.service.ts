// modules/streaming/streaming.service.ts - Complete version with fixes
import { StreamingRepository } from './streaming.repository';
import { PaymentService } from '../payment/payment.service';
import { WebSocketService } from '../../websocket/websocket.service';
import { BidService } from '../bid/bid.service';
import { BillingService } from '../billing/billing.service';
import { StreamSession, StreamStatus } from '@prisma/client';
import {
  CreateStreamSessionDTO,
  PlaceBidDTO,
  SendGiftDTO,
  UpdateStreamSettingsDTO,
} from './streaming.dto';
import {
  StreamSessionWithRelations,
  CreatePaymentIntentDTO,
} from './streaming.interface';
import { PaymentType } from '../payment/payment.types';
import { EarningsService } from '../earnings/earnings.service';

export class StreamingService {
  // Track active sessions for influencers
  private influencerActiveSessions: Map<string, string> = new Map();

  constructor(
    private streamingRepository: StreamingRepository,
    private paymentService: PaymentService,
    private webSocketService: WebSocketService,
    private bidService: BidService,
    private earningsService: EarningsService,
    private billingService: BillingService,
  ) {
    console.log('📺 StreamingService initialized');
    // Load active sessions from database on startup
    this.loadActiveSessions();
  }

  // Load active sessions from database
  private async loadActiveSessions(): Promise<void> {
    try {
      console.log(
        '🔄 [StreamingService] Loading active sessions from database...',
      );
      const liveSessions = await this.streamingRepository.getLiveStreams();

      for (const session of liveSessions) {
        this.influencerActiveSessions.set(session.influencerId, session.id);
        console.log(
          `✅ [StreamingService] Loaded active session: ${session.id} for influencer: ${session.influencerId}`,
        );
      }

      console.log(
        `✅ [StreamingService] Loaded ${liveSessions.length} active sessions`,
      );
    } catch (error) {
      console.error(
        '❌ [StreamingService] Error loading active sessions:',
        error,
      );
    }
  }

  // Create a new stream session
  async createStreamSession(
    userId: string,
    allowBids: boolean,
    callRate: string,
    options?: Partial<CreateStreamSessionDTO>,
  ): Promise<StreamSession> {
    try {
      console.log(
        `🎬 [StreamingService] Creating stream session for user ${userId}`,
      );

      // Check if user already has an active session
      const existingSession =
        await this.streamingRepository.getActiveStreamForInfluencer(userId);
      if (existingSession) {
        console.log(
          `⚠️ [StreamingService] User ${userId} already has active session: ${existingSession.id}`,
        );
        // End the existing session first
        await this.endStreamSession(existingSession.id);
      }

      // Validate call rate
      const parsedCallRate = parseFloat(callRate);
      if (isNaN(parsedCallRate) || parsedCallRate < 0) {
        throw new Error('Invalid call rate provided');
      }

      // Update user's profile with the new call rate
      try {
        await this.streamingRepository.upsertUserProfile(userId, {
          callRate: parsedCallRate.toString(),
        });
        console.log(
          `✅ [StreamingService] Updated call rate for user ${userId}: ${parsedCallRate}`,
        );
      } catch (error) {
        console.warn(
          `⚠️ [StreamingService] Could not update call rate in profile:`,
          error,
        );
        // Continue with stream creation even if profile update fails
      }

      // Create the session using the repository method
      const sessionData: CreateStreamSessionDTO = {
        influencerId: userId,
        allowBids,
        callRate: parsedCallRate.toString(),
      };

      const session = await this.streamingRepository.createStreamSession(
        sessionData,
      );

      // Track this as the active session for the influencer
      this.influencerActiveSessions.set(userId, session.id);

      console.log(
        `✅ [StreamingService] Stream session created: ${session.id} for user ${userId}`,
      );

      // Get influencer details for notifications using getUser method
      const influencer = await this.streamingRepository.getUser(userId);

      // Notify about new live stream
      if (this.webSocketService && influencer) {
        // First notify about status change
        this.webSocketService.notifyInfluencerStatusChange(
          userId,
          influencer.profile?.username || null,
          'live',
          'online',
        );

        // Then notify about going live
        this.webSocketService.notifyInfluencerWentLive(
          userId,
          influencer.profile?.username || null,
          session.id,
          session.allowBids,
          callRate,
        );

        // Also emit the general stream created event
        this.webSocketService.emitToAll('STREAM_CREATED', {
          success: true,
          session: {
            ...session,
            influencer: {
              id: userId,
              username: influencer.profile?.username,
              profileImage: influencer.profileImage,
            },
          },
        });
      }

      return session;
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error creating stream session:`,
        error,
      );
      throw error;
    }
  }

  // Get a stream session by ID
  async getStreamSession(sessionId: string): Promise<StreamSession | null> {
    try {
      console.log(`📋 [StreamingService] Getting stream session: ${sessionId}`);

      const session = await this.streamingRepository.getStreamSession(
        sessionId,
      );

      if (session) {
        console.log(`✅ [StreamingService] Found stream session: ${sessionId}`);
      } else {
        console.warn(
          `⚠️ [StreamingService] Stream session not found: ${sessionId}`,
        );
      }

      return session;
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error getting stream session:`,
        error,
      );
      throw error;
    }
  }

  // End a stream session
  async endStreamSession(sessionId: string): Promise<StreamSession> {
    try {
      console.log(`🛑 [StreamingService] Ending stream session: ${sessionId}`);

      const session = await this.streamingRepository.getStreamSession(
        sessionId,
      );
      if (!session) {
        throw new Error('Stream session not found');
      }

      if (session.status === 'ENDED') {
        console.log(`⚠️ [StreamingService] Session ${sessionId} already ended`);
        return session;
      }

      // Calculate duration and end time
      const endTime = new Date();
      const duration = session.startTime
        ? Math.floor(
            (endTime.getTime() - new Date(session.startTime).getTime()) / 1000,
          )
        : 0;

      // Update session with duration and endTime FIRST
      await this.streamingRepository.updateStreamSession(sessionId, {
        endTime: endTime,
        duration: duration,
        // Don't update status to ENDED yet
      });

      // Check if there was an accepted bid for this session
      const acceptedBid =
        await this.streamingRepository.getAcceptedBidForSession(sessionId);

      let finalEarnings = session.earnings || 0;

      // If there was an accepted bid, calculate pro-rated earnings
      if (acceptedBid && this.earningsService) {
        console.log(
          `💰 [StreamingService] Calculating pro-rated earnings for bid ${acceptedBid.id}`,
        );

        try {
          const earningsCalculation =
            await this.earningsService.calculateAndRecordBidEarnings(sessionId);

          console.log(`💰 [StreamingService] Pro-rated earnings calculation:`, {
            bidAmount: earningsCalculation.bidAmount,
            actualMinutes: earningsCalculation.actualDurationMinutes.toFixed(2),
            maxMinutes: earningsCalculation.maxDurationMinutes,
            calculatedEarnings: earningsCalculation.calculatedEarnings,
            wasProRated: earningsCalculation.wasProRated,
          });

          // The earnings have been updated in the database by calculateAndRecordBidEarnings
          // Fetch the updated session to get the new earnings total
          const updatedSessionForEarnings =
            await this.streamingRepository.getStreamSession(sessionId);
          finalEarnings = updatedSessionForEarnings?.earnings || finalEarnings;
          
          console.log(`✅ [StreamingService] Earnings calculated successfully: $${finalEarnings}`);
        } catch (earningsError) {
          console.error(`❌ [StreamingService] Failed to calculate earnings for session: ${sessionId}:`, earningsError);
          // Use the original earnings if calculation fails
        }
      } else if (acceptedBid && !this.earningsService) {
        console.error(`❌ [StreamingService] Earnings service not available for session: ${sessionId}`);
      }

      // Now update session status to ENDED with final earnings
      const updatedSession = await this.streamingRepository.updateStreamSession(
        sessionId,
        {
          status: 'ENDED' as StreamStatus,
          earnings: finalEarnings, // Use the calculated earnings
        },
      );

      // Create call history record with final earnings
      await this.streamingRepository.createCallHistory({
        streamSessionId: sessionId,
        influencerId: session.influencerId,
        explorerId: session.currentExplorerId ?? undefined,
        startTime: session.startTime || new Date(),
        endTime: endTime,
        duration: duration,
        earnings: finalEarnings, // Use the calculated earnings
      });

      // End call billing if there was an accepted bid
      if (acceptedBid && this.billingService) {
        console.log(`💳 [StreamingService] Ending call billing for session: ${sessionId}, duration: ${duration}s`);
        try {
          await this.endCallBilling(sessionId, duration, 'completed');
          console.log(`✅ [StreamingService] Call billing completed successfully for session: ${sessionId}`);
        } catch (billingError) {
          console.error(`❌ [StreamingService] Failed to end call billing for session: ${sessionId}:`, billingError);
          // Don't throw error - we still want to end the stream even if billing fails
        }
      } else if (acceptedBid && !this.billingService) {
        console.error(`❌ [StreamingService] Billing service not available for session: ${sessionId}`);
      }

      console.log(
        `✅ [StreamingService] Call history recorded for session: ${sessionId} with earnings: $${finalEarnings.toFixed(
          2,
        )}`,
      );

      // Remove from active sessions tracking
      this.influencerActiveSessions.delete(session.influencerId);

      // Get influencer details for notifications
      const influencer = await this.streamingRepository.getUser(
        session.influencerId,
      );

      // Reject all pending bids for this session
      if (this.bidService) {
        const pendingBids = await this.bidService.getPendingBidsForSession(
          sessionId,
        );
        for (const bid of pendingBids) {
          await this.bidService.rejectBid(bid.id);
        }
      }

      console.log(`✅ [StreamingService] Stream session ended: ${sessionId}`);

      // Notify about stream end
      if (this.webSocketService && influencer) {
        this.webSocketService.notifyInfluencerEndedStream(
          session.influencerId,
          influencer.profile?.username || null,
          sessionId,
        );

        this.webSocketService.emitToAll('STREAM_ENDED', {
          success: true,
          session: updatedSession,
        });
      }

      return updatedSession;
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error ending stream session:`,
        error,
      );
      throw error;
    }
  }

  async getCallHistory(userId: string): Promise<any[]> {
    try {
      console.log(
        `📜 [StreamingService] Getting call history for user: ${userId}`,
      );

      const history = await this.streamingRepository.getCallHistoryByUserId(
        userId,
      );

      console.log(
        `✅ [StreamingService] Found ${history.length} history records for user: ${userId}`,
      );

      return history;
    } catch (error) {
      console.error(`❌ [StreamingService] Error getting call history:`, error);
      throw error;
    }
  }

  // Get all live streams
  async getLiveStreams(): Promise<StreamSession[]> {
    try {
      console.log(`📺 [StreamingService] Getting all live streams`);

      const liveStreams = await this.streamingRepository.getLiveStreams();

      console.log(
        `✅ [StreamingService] Found ${liveStreams.length} live streams`,
      );

      return liveStreams;
    } catch (error) {
      console.error(`❌ [StreamingService] Error getting live streams:`, error);
      throw error;
    }
  }

  // Update stream settings
  async updateStreamSettings(
    sessionId: string,
    settings: UpdateStreamSettingsDTO,
  ): Promise<StreamSession> {
    try {
      console.log(
        `⚙️ [StreamingService] Updating stream settings for session: ${sessionId}`,
      );

      const session = await this.streamingRepository.getStreamSession(
        sessionId,
      );
      if (!session) {
        throw new Error('Stream session not found');
      }

      if (session.status !== 'LIVE') {
        throw new Error('Cannot update settings for non-live session');
      }

      // Validate call rate if provided
      if (settings.callRate !== undefined) {
        const parsedCallRate = parseFloat(settings.callRate);
        if (isNaN(parsedCallRate) || parsedCallRate < 0) {
          throw new Error('Invalid call rate provided');
        }
        settings.callRate = parsedCallRate.toString();

        // Also update the user's profile
        try {
          await this.streamingRepository.upsertUserProfile(
            session.influencerId,
            {
              callRate: settings.callRate,
            },
          );
          console.log(
            `✅ [StreamingService] Updated profile call rate for user ${session.influencerId}`,
          );
        } catch (error) {
          console.warn(
            `⚠️ [StreamingService] Could not update call rate in profile:`,
            error,
          );
        }
      }

      const updatedSession = await this.streamingRepository.updateStreamSession(
        sessionId,
        settings,
      );

      console.log(
        `✅ [StreamingService] Stream settings updated for session: ${sessionId}`,
      );

      // Notify about settings update
      if (this.webSocketService) {
        this.webSocketService.emitToSession(sessionId, 'SETTINGS_UPDATED', {
          sessionId,
          settings,
          updatedBy: session.influencerId,
          timestamp: new Date(),
        });
      }

      return updatedSession;
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error updating stream settings:`,
        error,
      );
      throw error;
    }
  }

  // Get influencer's active session
  getInfluencerActiveSession(influencerId: string): string | null {
    const activeSessionId = this.influencerActiveSessions.get(influencerId);
    console.log(
      `🔍 [StreamingService] Active session for influencer ${influencerId}: ${
        activeSessionId || 'none'
      }`,
    );
    return activeSessionId || null;
  }

  // Place a bid (delegates to BidService)
  async placeBid(
    data: PlaceBidDTO,
  ): Promise<{ success: boolean; bid?: any; message: string }> {
    try {
      console.log(`💰 [StreamingService] Placing bid:`, data);

      if (!this.bidService) {
        throw new Error('Bid service not available');
      }

      const result = await this.bidService.placeBid(data);

      console.log(`💰 [StreamingService] Bid placement result:`, result);

      return result;
    } catch (error) {
      console.error(`❌ [StreamingService] Error placing bid:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to place bid',
      };
    }
  }

  // Updated acceptBid method in streaming.service.ts
  async acceptBid(
    bidId: string,
  ): Promise<{ success: boolean; bid?: any; message: string }> {
    try {
      console.log(`✅ [StreamingService] Accepting bid: ${bidId}`);

      if (!this.bidService) {
        throw new Error('Bid service not available');
      }

      const result = await this.bidService.acceptBid(bidId);

      // If bid was accepted successfully, record the acceptance for tracking
      if (result.success && result.bid && this.earningsService) {
        console.log(
          `💰 [StreamingService] Recording bid acceptance for tracking`,
        );

        // Record bid acceptance with zero earnings (actual earnings calculated at stream end)
        await this.earningsService.updateStreamEarnings({
          streamSessionId: result.bid.streamSession?.id ?? '',
          amount: result.bid.amount, // This will be recorded as metadata only
          type: 'BID_ACCEPTED',
          metadata: {
            bidId: result.bid.id,
            explorerId: result.bid.explorerId,
          },
        });
      }

      console.log(`✅ [StreamingService] Bid acceptance result:`, result);

      return result;
    } catch (error) {
      console.error(`❌ [StreamingService] Error accepting bid:`, error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to accept bid',
      };
    }
  }

  // Reject a bid (delegates to BidService)
  async rejectBid(
    bidId: string,
  ): Promise<{ success: boolean; bid?: any; message: string }> {
    try {
      console.log(`🚫 [StreamingService] Rejecting bid: ${bidId}`);

      if (!this.bidService) {
        throw new Error('Bid service not available');
      }

      const result = await this.bidService.rejectBid(bidId);

      console.log(`🚫 [StreamingService] Bid rejection result:`, result);

      return result;
    } catch (error) {
      console.error(`❌ [StreamingService] Error rejecting bid:`, error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to reject bid',
      };
    }
  }

  // Get bids for a stream session
  async getStreamBids(sessionId: string): Promise<any[]> {
    try {
      console.log(
        `💰 [StreamingService] Getting bids for session: ${sessionId}`,
      );

      if (!this.bidService) {
        console.warn(`⚠️ [StreamingService] Bid service not available`);
        return [];
      }

      const bids = await this.bidService.getBidsForSession(sessionId);

      console.log(
        `✅ [StreamingService] Found ${bids.length} bids for session: ${sessionId}`,
      );

      return bids;
    } catch (error) {
      console.error(`❌ [StreamingService] Error getting stream bids:`, error);
      return [];
    }
  }

  // Send a gift
  async sendGift(
    data: SendGiftDTO,
  ): Promise<{ gift: any; paymentIntent: any }> {
    try {
      console.log(`🎁 [StreamingService] Sending gift:`, data);

      // Validate session
      const session = await this.streamingRepository.getStreamSession(
        data.sessionId,
      );
      if (!session) {
        throw new Error('Stream session not found');
      }

      if (session.status !== 'LIVE') {
        throw new Error('Cannot send gift to non-live session');
      }

      // Get gift type details
      const giftType = await this.streamingRepository.getGiftType(
        data.giftTypeId,
      );
      if (!giftType) {
        throw new Error('Gift type not found');
      }

      // Create payment intent
      const paymentIntentData = {
        type: PaymentType.GIFT,
        userId: data.explorerId,
        currency: 'usd',
        paymentMethod: '', // or specify a default payment method if needed
        metadata: {
          giftTypeId: data.giftTypeId,
          sessionId: data.sessionId,
          influencerId: data.influencerId,
        },
        description: data.message || undefined,
      };

      const paymentIntent = await this.paymentService.createPaymentIntent(
        paymentIntentData,
      );

      // Create gift record using repository method
      const gift = await this.streamingRepository.sendGift({
        sessionId: data.sessionId,
        explorerId: data.explorerId,
        influencerId: data.influencerId,
        giftTypeId: data.giftTypeId,
        amount: giftType.price,
        message: data.message,
      });

      console.log(`✅ [StreamingService] Gift created: ${gift.id}`);

      await this.earningsService.updateStreamEarnings({
        streamSessionId: data.sessionId,
        amount: giftType.price,
        type: 'GIFT',
        metadata: {
          giftId: gift.id,
          explorerId: data.explorerId,
        },
      });

      // Notify about gift
      if (this.webSocketService) {
        this.webSocketService.emitToSession(data.sessionId, 'GIFT_SENT', {
          giftId: gift.id,
          sessionId: data.sessionId,
          senderId: data.explorerId,
          receiverId: data.influencerId,
          giftType: giftType.name,
          value: giftType.price,
          timestamp: new Date(),
        });
      }

      return { gift, paymentIntent };
    } catch (error) {
      console.error(`❌ [StreamingService] Error sending gift:`, error);
      throw error;
    }
  }

  // Get gift types
  async getGiftTypes(): Promise<any[]> {
    try {
      console.log(`🎁 [StreamingService] Getting gift types`);

      const giftTypes = await this.streamingRepository.getGiftTypes();

      console.log(`✅ [StreamingService] Found ${giftTypes.length} gift types`);

      return giftTypes;
    } catch (error) {
      console.error(`❌ [StreamingService] Error getting gift types:`, error);
      throw error;
    }
  }

  // Get gifts for a stream session
  async getStreamGifts(sessionId: string): Promise<any[]> {
    try {
      console.log(
        `🎁 [StreamingService] Getting gifts for session: ${sessionId}`,
      );

      const gifts = await this.streamingRepository.getStreamGifts(sessionId);

      console.log(
        `✅ [StreamingService] Found ${gifts.length} gifts for session: ${sessionId}`,
      );

      return gifts;
    } catch (error) {
      console.error(`❌ [StreamingService] Error getting stream gifts:`, error);
      return [];
    }
  }

  // Join a stream session
  async joinStreamSession(
    sessionId: string,
    userId: string,
  ): Promise<StreamSession> {
    try {
      console.log(
        `🎬 [StreamingService] User ${userId} joining session: ${sessionId}`,
      );

      const session = await this.streamingRepository.getStreamSession(
        sessionId,
      );
      if (!session) {
        throw new Error('Stream session not found');
      }

      if (session.status !== 'LIVE') {
        throw new Error('Stream session is not live');
      }

      // Use repository join method
      const updatedSession = await this.streamingRepository.joinStreamSession({
        sessionId,
        explorerId: userId,
      });

      console.log(
        `✅ [StreamingService] User ${userId} joined session: ${sessionId}`,
      );

      return updatedSession;
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error joining stream session:`,
        error,
      );
      throw error;
    }
  }
  async getInfluencers(params: {
    cursor?: string;
    categories?: string[];
    search_term?: string;
    limit?: number;
    is_user_online?: boolean;
  }): Promise<{
    influencers: any[];
    nextCursor: string | null;
    hasNextPage: boolean;
    statusBreakdown: {
      live: number;
      online: number;
      offline: number;
      total: number;
    };
  }> {
    try {
      console.log(
        `🔍 [StreamingService] Fetching influencers with params:`,
        params,
      );

      // Configurable fetch limit to prevent overload; in prod, make this dynamic based on system resources.
      const FETCH_LIMIT = 1000;

      // Fetch influencers from repository (assumes Prisma or similar; no pagination here to allow in-memory categorization).
      const allInfluencers = await this.streamingRepository.getInfluencers({
        cursor: undefined,
        categories: params.categories,
        searchTerm: params.search_term,
        limit: FETCH_LIMIT,
        onlineOnly: false, // Fetch all to categorize accurately.
      });

      console.log(
        `📊 [StreamingService] Retrieved ${allInfluencers.length} total influencers from repository`,
      );

      if (allInfluencers.length === FETCH_LIMIT) {
        console.warn(
          `⚠️ [StreamingService] Hit fetch limit (${FETCH_LIMIT}); consider scaling if influencer count exceeds this.`,
        );
      }

      // Debug: Log active sessions for traceability.
      console.log(
        `📊 [StreamingService] Active sessions map:`,
        Array.from(this.influencerActiveSessions.entries()),
      );

      // Enrich influencers with live/online status and stream info.
      const enrichedInfluencers = await Promise.all(
        allInfluencers.map(async (influencer) => {
          const activeSessionId = this.influencerActiveSessions.get(
            influencer.id,
          );
          let streamInfo = null;
          let isLive = false;

          if (activeSessionId) {
            const session = await this.streamingRepository.getStreamSession(
              activeSessionId,
            );
            if (session && session.status === 'LIVE') {
              isLive = true;
              streamInfo = {
                id: session.id,
                allowBids: session.allowBids,
                callRate: influencer.profile?.callRate || '0',
                viewerCount: this.webSocketService
                  ? this.webSocketService.getStreamParticipantCount(session.id)
                  : 0,
              };
              console.log(
                `✅ [StreamingService] Influencer ${influencer.id} (${influencer.profile?.username}) is LIVE`,
              );
            }
          }

          // Fetch complete profile details (matching influencer.service.ts)
          const profileImage = await this.streamingRepository.fetchProfileImage(
            influencer?.profileImage || null,
          );
          const promotionalVideos =
            await this.streamingRepository.fetchPromotionalVideos(
              influencer?.promotionalVideo || [],
            );
          const interestsDetails =
            await this.streamingRepository.fetchInterests(
              influencer.profile?.interests || [],
            );
          const zodiacSignDetails =
            await this.streamingRepository.fetchZodiacSign(
              influencer.profile?.zodiacSign || null,
            );

          return {
            id: influencer.id,
            gender: influencer.gender,
            promotionalVideo: influencer.promotionalVideo || [],
            profileImageDetails: profileImage || undefined,
            promotionalVideoDetails: promotionalVideos,
            interestsDetails,
            isOnline: influencer.isOnline || isLive, // If live, they're online
            isLive,
            streamInfo,
            profile: influencer.profile
              ? {
                  id: influencer.profile.id,
                  userId: influencer.profile.userId,
                  username: influencer.profile.username,
                  bio: influencer.profile.bio,
                  location: influencer.profile.location,
                  interests: influencer.profile.interests,
                  category: influencer.profile.category,
                  zodiacSign: influencer.profile.zodiacSign,
                  callRate: influencer.profile.callRate,
                  likedProfiles: influencer.profile.likedProfiles,
                  subscriptionPlan: influencer.profile.subscriptionPlan,
                  subscriptionStatus: influencer.profile.subscriptionStatus,
                  likes: influencer.profile.likes,
                  viewCount: influencer.profile.viewCount,
                  allowLike: influencer.profile.allowLike,
                }
              : undefined,
            zodiacSignDetails: zodiacSignDetails || undefined,
          };
        }),
      );

      // Categorize enriched influencers.
      const categorized = {
        live: enrichedInfluencers.filter((inf) => inf.isLive),
        online: enrichedInfluencers.filter(
          (inf) => inf.isOnline && !inf.isLive,
        ),
        offline: enrichedInfluencers.filter((inf) => !inf.isOnline),
      };

      console.log(`📊 [StreamingService] Categorized influencers:`, {
        live: categorized.live.length,
        online: categorized.online.length,
        offline: categorized.offline.length,
      });

      // Sort each category by createdAt desc (newest first). Assume createdAt is Date or ISO string.
      const sortByCreatedAtDesc = (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

      categorized.live.sort(sortByCreatedAtDesc);
      categorized.online.sort(sortByCreatedAtDesc);
      categorized.offline.sort(sortByCreatedAtDesc);

      // Combine categories in priority order: live > online > offline.
      let combinedInfluencers = [
        ...categorized.live,
        ...categorized.online,
        ...categorized.offline,
      ];

      // Apply onlineOnly filter if requested.
      if (params.is_user_online) {
        combinedInfluencers = combinedInfluencers.filter(
          (inf) => inf.isOnline || inf.isLive,
        );
        console.log(
          `🔍 [StreamingService] Filtered to online only: ${combinedInfluencers.length} influencers`,
        );
      }

      // Compute full status breakdown (on entire list, not paginated, for accurate aggregates).
      const statusBreakdown = {
        live: categorized.live.length,
        online: categorized.online.length,
        offline: categorized.offline.length,
        total: combinedInfluencers.length,
      };

      // Apply pagination using cursor as index (simple but assumes stable order; for prod, use ID-based cursor).
      let startIndex = params.cursor ? parseInt(params.cursor, 10) : 0;
      if (isNaN(startIndex) || startIndex < 0) {
        startIndex = 0;
      }

      const pageLimit = params.limit || 10;
      const endIndex = startIndex + pageLimit;
      const paginatedInfluencers = combinedInfluencers.slice(
        startIndex,
        endIndex,
      );

      const hasNextPage = endIndex < combinedInfluencers.length;
      const nextCursor = hasNextPage ? endIndex.toString() : null;

      console.log(
        `✅ [StreamingService] Returning ${paginatedInfluencers.length} influencers:`,
        {
          startIndex,
          endIndex,
          total: combinedInfluencers.length,
          live: paginatedInfluencers.filter((i) => i.isLive).length,
          online: paginatedInfluencers.filter((i) => i.isOnline && !i.isLive)
            .length,
          offline: paginatedInfluencers.filter((i) => !i.isOnline).length,
          hasNextPage,
          nextCursor,
          fullStatusBreakdown: statusBreakdown,
        },
      );

      // Debug: Log returned influencers' details.
      console.log(
        `👥 [StreamingService] Influencers being returned:`,
        paginatedInfluencers.map((i) => ({
          username: i.profile?.username,
          isLive: i.isLive,
          isOnline: i.isOnline,
        })),
      );

      return {
        influencers: paginatedInfluencers,
        nextCursor,
        hasNextPage,
        statusBreakdown, // Return full breakdown for accuracy.
      };
    } catch (error) {
      console.error(`❌ [StreamingService] Error getting influencers:`, error);
      throw new Error(
        `Failed to retrieve influencers: ${(error as Error).message}`,
      );
    }
  }

  // Get influencer by username
  async getInfluencerByUsername(username: string): Promise<any> {
    try {
      console.log(
        `🔍 [StreamingService] Getting influencer by username: ${username}`,
      );

      const influencer = await this.streamingRepository.getInfluencerByUsername(
        username,
      );

      if (!influencer) {
        console.warn(`⚠️ [StreamingService] Influencer not found: ${username}`);
        return null;
      }

      // Enrich with live stream info
      const activeSessionId = this.getInfluencerActiveSession(influencer.id);
      let streamInfo = null;

      if (activeSessionId) {
        const session = await this.streamingRepository.getStreamSession(
          activeSessionId,
        );
        if (session && session.status === 'LIVE') {
          streamInfo = {
            id: session.id,
            allowBids: session.allowBids,
            callRate: influencer.profile?.callRate || '0',
            viewerCount: this.webSocketService
              ? this.webSocketService.getStreamParticipantCount(session.id)
              : 0,
          };
        }
      }

      const enrichedInfluencer = {
        ...influencer,
        isOnline: influencer.isOnline || false,
        isLive: !!streamInfo,
        streamInfo,
      };

      console.log(`✅ [StreamingService] Found influencer: ${username}`);

      return enrichedInfluencer;
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error getting influencer by username:`,
        error,
      );
      throw error;
    }
  }

  // Leave a stream session
  async leaveStreamSession(sessionId: string, userId: string): Promise<void> {
    try {
      console.log(
        `🚪 [StreamingService] User ${userId} leaving session: ${sessionId}`,
      );

      const session = await this.streamingRepository.getStreamSession(
        sessionId,
      );
      if (!session) {
        console.warn(
          `⚠️ [StreamingService] Session ${sessionId} not found for leave operation`,
        );
        return;
      }

      // Update session to remove current explorer if they are leaving
      if (session.currentExplorerId === userId) {
        await this.streamingRepository.updateStreamSession(sessionId, {
          currentExplorerId: null,
        });
      }

      console.log(
        `✅ [StreamingService] User ${userId} left session: ${sessionId}`,
      );
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error leaving stream session:`,
        error,
      );
      throw error;
    }
  }

  // Get session statistics
  async getSessionStatistics(sessionId: string): Promise<any> {
    try {
      console.log(
        `📊 [StreamingService] Getting statistics for session: ${sessionId}`,
      );

      const session = await this.streamingRepository.getStreamSession(
        sessionId,
      );
      if (!session) {
        throw new Error('Stream session not found');
      }

      const statistics = {
        sessionId,
        duration: session.startTime
          ? Date.now() - new Date(session.startTime).getTime()
          : 0,
        totalBids: this.bidService
          ? (await this.bidService.getBidsForSession(sessionId)).length
          : 0,
        totalGifts: (await this.streamingRepository.getStreamGifts(sessionId))
          .length,
        participantCount: this.webSocketService
          ? this.webSocketService.getStreamParticipantCount(sessionId)
          : 0,
        status: session.status,
        earnings: session.earnings || 0,
      };

      console.log(
        `✅ [StreamingService] Statistics retrieved for session: ${sessionId}`,
      );

      return statistics;
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error getting session statistics:`,
        error,
      );
      throw error;
    }
  }

  // Validate stream permissions
  async validateStreamPermissions(
    sessionId: string,
    userId: string,
    action: string,
  ): Promise<boolean> {
    try {
      console.log(
        `🔐 [StreamingService] Validating permissions for user ${userId} on session ${sessionId} for action: ${action}`,
      );

      const session = await this.streamingRepository.getStreamSession(
        sessionId,
      );
      if (!session) {
        return false;
      }

      // Check if user is the influencer
      if (session.influencerId === userId) {
        return true;
      }

      // Add more permission checks based on action
      switch (action) {
        case 'view':
          return session.status === 'LIVE';
        case 'bid':
          return session.status === 'LIVE' && session.allowBids;
        case 'gift':
          return session.status === 'LIVE';
        case 'moderate':
          // Add moderation permissions logic
          return session.influencerId === userId;
        default:
          return false;
      }
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error validating stream permissions:`,
        error,
      );
      return false;
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      console.log(`🧹 [StreamingService] Cleaning up expired sessions`);

      // Get sessions that have been live for too long without activity
      const expiredSessions =
        await this.streamingRepository.getExpiredSessions();

      for (const session of expiredSessions) {
        await this.endStreamSession(session.id);
        console.log(
          `🧹 [StreamingService] Cleaned up expired session: ${session.id}`,
        );
      }

      console.log(
        `✅ [StreamingService] Cleaned up ${expiredSessions.length} expired sessions`,
      );
    } catch (error) {
      console.error(
        `❌ [StreamingService] Error cleaning up expired sessions:`,
        error,
      );
    }
  }

  // Initialize periodic cleanup
  startPeriodicCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, 5 * 60 * 1000);

    console.log('✅ [StreamingService] Periodic cleanup started');
  }

  // Add method to manually sync active sessions (useful for debugging)
  async syncActiveSessions(): Promise<void> {
    await this.loadActiveSessions();
    console.log('✅ [StreamingService] Active sessions synced');
  }

  // Add method to get all active sessions (for debugging)
  getActiveSessionsDebug(): Map<string, string> {
    return new Map(this.influencerActiveSessions);
  }

  // Start call billing when both users join the session
  async startCallBilling(data: { streamSessionId: string; explorerId: string; influencerId: string; bidId: string; bidAmount: number }): Promise<void> {
    try {
      console.log(`💳 [StreamingService] Starting call billing for session: ${data.streamSessionId}`);

      if (!this.billingService) {
        console.warn('⚠️ [StreamingService] Billing service not available');
        return;
      }

      // Get session with accepted bid
      const session = await this.streamingRepository.getStreamSession(data.streamSessionId);
      if (!session || !session.currentExplorerId) {
        console.warn(`⚠️ [StreamingService] No active explorer in session: ${data.streamSessionId}`);
        return;
      }

      // Get the accepted bid for this session
      const acceptedBid = await this.streamingRepository.getAcceptedBidForSession(data.streamSessionId);
      if (!acceptedBid) {
        console.warn(`⚠️ [StreamingService] No accepted bid found for session: ${data.streamSessionId}`);
        return;
      }

      console.log(`💳 [StreamingService] Found accepted bid: $${acceptedBid.amount} for session: ${data.streamSessionId}`);

      // Start billing
      const billingResult = await this.billingService.startCallBilling({
        streamSessionId: data.streamSessionId,
        explorerId: session.currentExplorerId,
        influencerId: session.influencerId,
        bidId: acceptedBid.id,
        bidAmount: acceptedBid.amount
      });

      if (billingResult.success) {
        console.log(`✅ [StreamingService] Call billing started for session: ${data.streamSessionId}`);
      } else {
        console.error(`❌ [StreamingService] Failed to start call billing: ${billingResult.message}`);
      }
    } catch (error) {
      console.error(`❌ [StreamingService] Error starting call billing:`, error);
    }
  }

  // End call billing when call ends
  async endCallBilling(sessionId: string, duration: number, reason: 'completed' | 'disconnected' | 'cancelled'): Promise<void> {
    try {
      console.log(`💳 [StreamingService] Ending call billing for session: ${sessionId}`);

      if (!this.billingService) {
        console.warn('⚠️ [StreamingService] Billing service not available');
        return;
      }

      // End billing
      const billingResult = await this.billingService.endCallBilling({
        streamSessionId: sessionId,
        duration,
        reason
      });

      if (billingResult.success) {
        console.log(`✅ [StreamingService] Call billing ended for session: ${sessionId}, charged: $${billingResult.billingSession?.chargedAmount}`);
      } else {
        console.error(`❌ [StreamingService] Failed to end call billing: ${billingResult.message}`);
      }
    } catch (error) {
      console.error(`❌ [StreamingService] Error ending call billing:`, error);
    }
  }

  // Get service health status
  getHealthStatus(): any {
    return {
      service: 'StreamingService',
      status: 'healthy',
      activeSessions: this.influencerActiveSessions.size,
      dependencies: {
        streamingRepository: !!this.streamingRepository,
        paymentService: !!this.paymentService,
        webSocketService: !!this.webSocketService,
        bidService: !!this.bidService,
        earningsService: !!this.earningsService,
        billingService: !!this.billingService,
      },
      timestamp: new Date(),
    };
  }
}
