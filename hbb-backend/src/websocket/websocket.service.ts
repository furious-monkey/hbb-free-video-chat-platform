// websocket/websocket.service.ts - Complete fixed version with PrismaClient
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { PrismaClient } from '@prisma/client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  BidPlacedData,
  BidAcceptedData,
  BidRejectedData,
  OutbidData,
  GiftSentData,
  SessionCreatedData,
  SessionEndedData,
  StreamErrorData,
  SettingsUpdatedData,
  NewBidData,
  CreateStreamCallbackResponse,
  JoinStreamCallbackResponse,
  NewProducerRetryData,
  NewProducerData,
  InfluencerEndedStreamData,
  InfluencerWentLiveData,
  InfluencerStatusChangedData,
  InfluencerDetailsData,
  InfluencersListData,
} from './websocket.types';
import { MediasoupManager } from '../mediasoup/mediasoup.manager';
import { Emitter } from '@socket.io/redis-emitter';
import {
  getRedisClient,
  isRedisConnected,
  safeRedisOperation,
  createRedisClient,
} from '../config/redis';

interface IStreamingService {
  createStreamSession(
    userId: string,
    allowBids: boolean,
    callRate: string,
  ): Promise<any>;
  getStreamSession(sessionId: string): Promise<any>;
  endStreamSession(sessionId: string): Promise<any>;
  updateStreamSettings(sessionId: string, settings: any): Promise<any>;
  getInfluencerActiveSession(influencerId: string): string | null;
  getLiveStreams(): Promise<any[]>;
  getStreamBids(sessionId: string): Promise<any[]>;
  getStreamGifts(sessionId: string): Promise<any[]>;
  sendGift(data: any): Promise<{ gift: any; paymentIntent: any }>;
  getGiftTypes(): Promise<any[]>;
  placeBid(data: {
    sessionId: string;
    explorerId: string;
    amount: number;
  }): Promise<{ success: boolean; bid?: any; message: string }>;
  acceptBid(
    bidId: string,
  ): Promise<{ success: boolean; bid?: any; message: string }>;
  rejectBid(
    bidId: string,
  ): Promise<{ success: boolean; bid?: any; message: string }>;
  getInfluencers(params: {
    cursor?: string;
    categories?: string[];
    search_term?: string;
    limit?: number;
    is_user_online?: boolean;
  }): Promise<{
    influencers: any[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }>;
  startCallBilling(data: { streamSessionId: string; explorerId: string; influencerId: string; bidId: string; bidAmount: number }): Promise<void>;
  getInfluencerByUsername(username: string): Promise<any>;
}

interface IPaymentService {
  // Payment service methods
}

interface IBidService {
  placeBid(data: {
    sessionId: string;
    explorerId: string;
    amount: number;
  }): Promise<{
    success: boolean;
    bid?: any;
    message: string;
  }>;
  acceptBid(bidId: string): Promise<{
    success: boolean;
    bid?: any;
    message: string;
  }>;
  rejectBid(bidId: string): Promise<{
    success: boolean;
    bid?: any;
    message: string;
  }>;
}

interface IBillingService {
  processBidPayment(bidId: string): Promise<any>;
  startCallBilling(data: any): Promise<any>;
  endCallBilling(data: any): Promise<any>;
  handlePaymentFailure(billingSessionId: string, reason: string): Promise<any>;
  processRefund(billingSessionId: string, reason: string): Promise<any>;
}

export class WebSocketService {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private userSockets: Map<string, string> = new Map();
  private streamRooms: Map<string, Set<string>> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private connectedUsers: Map<string, string> = new Map();
  private socketToUser: Map<string, string> = new Map();
  private streamingService!: IStreamingService;
  private paymentService!: IPaymentService;
  private bidService!: IBidService;
  private billingService!: IBillingService;
  private mediasoupManager: MediasoupManager;
  private userSessionContext: Map<string, string> = new Map();
  private pubClient: any;
  private subClient: any;
  private emitter: any;
  private isShuttingDown = false;
  private redisAvailable = false;
  private prisma: PrismaClient;

  constructor(
    server: HttpServer,
    mediasoupManager: MediasoupManager,
    prisma?: PrismaClient,
  ) {
    this.mediasoupManager = mediasoupManager;
    this.prisma = prisma || new PrismaClient();

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Set up Redis adapter with error handling
    this.setupRedisAdapter();

    console.log('🔧 WebSocketService constructor called');
    this.setupEventHandlers();
  }

  private async setupRedisAdapter(): Promise<void> {
    try {
      if (await isRedisConnected()) {
        this.pubClient = createRedisClient();
        this.subClient = createRedisClient();

        // Wait for clients to connect if they aren't already
        if (!this.pubClient.isOpen) {
          await this.pubClient.connect();
        }
        if (!this.subClient.isOpen) {
          await this.subClient.connect();
        }

        this.emitter = new Emitter(this.pubClient);

        // Add error handlers for Redis clients
        this.pubClient.on('error', (error: any) => {
          console.error('❌ [WebSocket] Redis pubClient error:', error);
          this.redisAvailable = false;
        });

        this.subClient.on('error', (error: any) => {
          console.error('❌ [WebSocket] Redis subClient error:', error);
          this.redisAvailable = false;
        });

        this.pubClient.on('connect', () => {
          console.log('✅ [WebSocket] Redis pubClient connected');
          this.redisAvailable = true;
        });

        this.subClient.on('connect', () => {
          console.log('✅ [WebSocket] Redis subClient connected');
          this.redisAvailable = true;
        });

        this.io.adapter(createAdapter(this.pubClient, this.subClient));
        this.redisAvailable = true;
        console.log('✅ [WebSocket] Redis adapter configured successfully');
      } else {
        console.warn(
          '⚠️ [WebSocket] Redis not available, using memory adapter',
        );
        this.redisAvailable = false;
      }
    } catch (error) {
      console.error('❌ [WebSocket] Failed to setup Redis adapter:', error);
      console.warn('⚠️ [WebSocket] Falling back to memory adapter');
      this.redisAvailable = false;
    }
  }

  public   injectServices(
    streamingService: IStreamingService,
    paymentService: IPaymentService,
    bidService: IBidService,
    billingService: IBillingService,
    mediasoupManager?: MediasoupManager,
  ) {
    console.log('💉 injectServices called');

    this.streamingService = streamingService;
    this.paymentService = paymentService;
    this.bidService = bidService;
    this.billingService = billingService;

    if (mediasoupManager) {
      this.mediasoupManager = mediasoupManager;
    }

    console.log('✅ Services injected successfully into WebSocketService');
  }

  private validateServices(): boolean {
    const isValid = !!(
      this.streamingService &&
      this.paymentService &&
      this.bidService
    );
    if (!isValid) {
      console.error('❌ Services validation failed');
    }
    return isValid;
  }

  private sendServiceNotAvailableError(socket: Socket) {
    socket.emit('ERROR', {
      message: 'Services not available. Please try again later.',
      code: 'SERVICES_NOT_READY',
      timestamp: new Date(),
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      socket.on('authenticate', async (data) => {
        try {
          const userId = data.userId;
          if (!userId) {
            socket.emit('ERROR', {
              message: 'User ID is required for authentication',
              timestamp: new Date(),
            });
            return;
          }

          socket.data = socket.data || {};
          socket.data.userId = userId;
          socket.data.authenticatedAt = new Date();

          this.connectedUsers.set(userId, socket.id);
          this.socketToUser.set(socket.id, userId);

          if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, new Set());
          }
          this.userSessions.get(userId)!.add(socket.id);

          socket.join(`user:${userId}`);

          console.log(
            `[WebSocket] User ${userId} authenticated on socket ${socket.id}`,
          );

          // Update user online status in database
          try {
            await this.prisma.user.update({
              where: { id: userId },
              data: { isOnline: true },
            });

            console.log(`✅ [WebSocket] User ${userId} marked as online`);

            // If this is an influencer who has an active stream, update their status
            if (this.streamingService) {
              const activeSessionId =
                this.streamingService.getInfluencerActiveSession(userId);

              if (activeSessionId) {
                console.log(
                  `🎬 [WebSocket] User ${userId} has active stream ${activeSessionId}`,
                );

                // Get user details
                const user = await this.prisma.user.findUnique({
                  where: { id: userId },
                  include: { profile: true },
                });

                if (user) {
                  // Notify that influencer is back online with their stream
                  this.safeEmitToAll('INFLUENCER_STATUS_CHANGED', {
                    influencerId: userId,
                    username: user.profile?.username || undefined,
                    status: 'live',
                    previousStatus: 'offline',
                    timestamp: new Date(),
                  });
                }
              }
            }
          } catch (dbError) {
            console.error(
              `❌ [WebSocket] Failed to update online status for user ${userId}:`,
              dbError,
            );
            // Don't fail the authentication if the online status update fails
          }

          socket.emit('USER_CONNECTED', {
            userId,
            socketId: socket.id,
          });
        } catch (error) {
          console.error('[WebSocket] Authentication error:', error);
          socket.emit('ERROR', {
            message: 'Authentication failed',
            timestamp: new Date(),
          });
        }
      });

      socket.on('create_stream', async (data, callback) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) {
            callback({ success: false, error: 'Not authenticated' });
            return;
          }

          if (!this.validateServices()) {
            callback({ success: false, error: 'Services not available' });
            return;
          }

          console.log(`🎬 [WebSocket] User ${userId} creating stream...`);

          const session = await this.streamingService.createStreamSession(
            userId,
            data.allowBids,
            data.callRate,
          );

          console.log(`✅ [WebSocket] Stream session created: ${session.id}`);

          this.userSessionContext.set(userId, session.id);
          socket.data.sessionId = session.id;

          const roomName = `stream:${session.id}`;
          socket.join(roomName);

          if (!this.streamRooms.has(session.id)) {
            this.streamRooms.set(session.id, new Set());
          }
          this.streamRooms.get(session.id)!.add(socket.id);

          if (this.mediasoupManager?.isMediaSoupAvailable()) {
            try {
              await this.mediasoupManager.createStreamRoom(session.id);
              console.log(
                `✅ [WebSocket] MediaSoup room created for session: ${session.id}`,
              );
            } catch (error) {
              console.error(
                `❌ [WebSocket] Failed to create MediaSoup room:`,
                error,
              );
            }
          }

          socket.emit('SESSION_CREATED', {
            sessionId: session.id,
            influencerId: userId,
            status: session.status,
            allowBids: session.allowBids,
            callRate: session.callRate,
            timestamp: new Date(),
            streamerId: userId,
            title: 'Live Stream',
            createdAt: new Date(),
          });

          console.log(
            `✅ [WebSocket] Influencer ${userId} setup complete in session ${session.id}`,
          );

          if (callback) callback({ success: true, sessionId: session.id });
        } catch (error: unknown) {
          console.error('[WebSocket] Error creating stream:', error);
          if (callback)
            callback({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
            });
        }
      });

      socket.on('peer_ready_for_consumption', (data) => {
        try {
          const { sessionId, peerId } = data;
          const userId = socket.data?.userId;

          if (!userId) {
            socket.emit('ERROR', {
              message: 'Not authenticated',
              timestamp: new Date(),
            });
            return;
          }

          console.log(
            `🎯 [WebSocket] Peer ${peerId} is ready for consumption in session ${sessionId}`,
          );

          // Get the room name
          const roomName = `stream:${sessionId}`;
          const room = this.io.sockets.adapter.rooms.get(roomName);

          if (!room) {
            console.warn(
              `⚠️ [WebSocket] No room found for session ${sessionId}`,
            );
            return;
          }

          // Notify other peers that this peer is ready
          socket.to(roomName).emit('PEER_READY_FOR_CONSUMPTION', {
            sessionId,
            peerId,
            timestamp: new Date(),
          });

          // If MediaSoup is available, send existing producers to the newly ready peer
          if (this.mediasoupManager?.isMediaSoupAvailable()) {
            const existingProducers =
              this.mediasoupManager.getStreamProducers(sessionId);

            // Filter out the peer's own producers
            const otherProducers = existingProducers.filter(
              (producer) => producer.peerId !== peerId,
            );

            if (otherProducers.length > 0) {
              console.log(
                `📤 [WebSocket] Sending ${otherProducers.length} existing producers to ready peer ${peerId}`,
              );

              // Send existing producers to the newly ready peer with a delay
              otherProducers.forEach((producer, index) => {
                setTimeout(() => {
                  // Send directly to the peer who just became ready
                  this.safeEmitToUser(peerId, 'NEW_PRODUCER', {
                    sessionId,
                    producerId: producer.producerId,
                    userId: producer.peerId,
                    kind: producer.kind,
                    timestamp: new Date(),
                    existing: true, // Flag to indicate this is an existing producer
                  });
                }, index * 200); // 200ms delay between each
              });
            }
          }
        } catch (error) {
          console.error(
            '❌ [WebSocket] Error handling peer_ready_for_consumption:',
            error,
          );
          socket.emit('ERROR', {
            message: 'Failed to process peer ready notification',
            timestamp: new Date(),
          });
        }
      });

      socket.on('join_stream', async (data, callback) => {
        try {
          const { sessionId } = data;
          const userId = socket.data?.userId;

          if (!userId) {
            if (callback)
              callback({ success: false, error: 'Not authenticated' });
            return;
          }

          console.log(
            `🎬 [WebSocket] User ${userId} joining session ${sessionId}`,
          );

          if (!this.validateServices()) {
            if (callback)
              callback({ success: false, error: 'Services not available' });
            return;
          }

          const session = await this.streamingService.getStreamSession(
            sessionId,
          );
          if (!session) {
            console.error(`❌ [WebSocket] Session ${sessionId} not found`);
            if (callback)
              callback({ success: false, error: 'Session not found' });
            return;
          }

          this.userSessionContext.set(userId, sessionId);
          socket.data.sessionId = sessionId;

          const roomName = `stream:${sessionId}`;
          socket.join(roomName);

          if (!this.streamRooms.has(sessionId)) {
            this.streamRooms.set(sessionId, new Set());
          }
          this.streamRooms.get(sessionId)!.add(socket.id);

          console.log(`✅ [WebSocket] User ${userId} joined room ${roomName}`);

          if (this.mediasoupManager?.isMediaSoupAvailable()) {
            if (!this.mediasoupManager.roomExists(sessionId)) {
              console.log(
                `🔧 [WebSocket] Creating missing MediaSoup room for session ${sessionId}`,
              );
              await this.mediasoupManager.createStreamRoom(sessionId);
            }

            setTimeout(() => {
              console.log(
                `🔍 [WebSocket] Starting producer discovery for ${userId} in session ${sessionId}`,
              );

              if (this.mediasoupManager?.isMediaSoupAvailable()) {
                const existingProducers =
                  this.mediasoupManager.getStreamProducers(sessionId);
                const otherProducers = existingProducers.filter(
                  (p) => p.peerId !== userId,
                );

                console.log(
                  `📋 [WebSocket] Found ${otherProducers.length} existing producers for ${userId}:`,
                  otherProducers,
                );

                if (otherProducers.length > 0) {
                  socket.emit('EXISTING_PRODUCERS_RESPONSE', {
                    success: true,
                    producers: otherProducers,
                    sessionId,
                  });

                  otherProducers.forEach((producer, index) => {
                    setTimeout(() => {
                      console.log(
                        `🔔 [WebSocket] Auto-sending NEW_PRODUCER to ${userId}: ${producer.kind} from ${producer.peerId}`,
                      );
                      socket.emit('NEW_PRODUCER', {
                        sessionId,
                        producerId: producer.producerId,
                        userId: producer.peerId,
                        kind: producer.kind,
                      });
                    }, index * 300);
                  });
                }
              }
            }, 2000);
          }

          socket.emit('STREAM_JOINED', {
            success: true,
            sessionId,
            userId,
            userName: socket.data.userName || 'User',
            timestamp: new Date(),
            session: undefined,
            participantCount: this.getStreamParticipantCount(sessionId),
          });

          socket.to(roomName).emit('STREAM_JOINED', {
            success: true,
            sessionId,
            userId,
            userName: socket.data.userName || 'User',
            isOtherUser: true,
            timestamp: new Date(),
            participantCount: this.getStreamParticipantCount(sessionId),
            session: undefined,
          });

          // Check if both users are now in the session and start billing
          const participantCount = this.getStreamParticipantCount(sessionId);
          console.log(`👥 [WebSocket] Session ${sessionId} now has ${participantCount} participants`);
          
          if (participantCount >= 2) {
            console.log(`💳 [WebSocket] Both users joined session ${sessionId}, starting call billing`);
            try {
              // Get session details to pass proper data to startCallBilling
              const session = await this.streamingService.getStreamSession(sessionId);
              if (session && session.currentExplorerId) {
                await this.streamingService.startCallBilling({
                  streamSessionId: sessionId,
                  explorerId: session.currentExplorerId,
                  influencerId: session.influencerId,
                  bidId: '', // Will be found by the billing service
                  bidAmount: 0 // Will be found by the billing service
                });
                console.log(`✅ [WebSocket] Call billing started for session ${sessionId}`);
              } else {
                console.warn(`⚠️ [WebSocket] Session ${sessionId} missing required data for billing`);
              }
            } catch (billingError) {
              console.error(`❌ [WebSocket] Failed to start call billing for session ${sessionId}:`, billingError);
            }
          }

          if (callback) callback({ success: true });
        } catch (error: unknown) {
          console.error('[WebSocket] Error joining stream:', error);
          if (callback)
            callback({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
            });
        }
      });

      socket.on('place_bid', async (data) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) {
            socket.emit('ERROR', {
              message: 'Not authenticated',
              code: 'AUTH_REQUIRED',
              timestamp: new Date(),
            });
            return;
          }

          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          console.log('💰 WebSocket: place_bid received:', data);

          let targetSessionId = data.sessionId;

          const session = await this.streamingService.getStreamSession(
            data.sessionId,
          );
          if (session) {
            const activeSessionId =
              this.streamingService.getInfluencerActiveSession(
                session.influencerId,
              );
            if (activeSessionId && activeSessionId !== data.sessionId) {
              console.log(
                `🔄 [WebSocket] Redirecting bid to influencer's active session: ${activeSessionId}`,
              );
              targetSessionId = activeSessionId;
            }
          }

          const bidResponse = await this.streamingService.placeBid({
            sessionId: targetSessionId,
            explorerId: userId,
            amount: data.amount,
          });

          console.log('💰 WebSocket: bid service response:', bidResponse);

          if (bidResponse.success) {
            socket.emit('BID_PLACED_SUCCESS', {
              success: true,
              bid: bidResponse.bid!,
              message: 'Bid placed successfully',
            });

            console.log('✅ WebSocket: BID_PLACED_SUCCESS sent to bidder');
          } else {
            socket.emit('BID_PLACED_ERROR', {
              success: false,
              message: bidResponse.message,
              code: 'BID_PLACEMENT_FAILED',
            });

            console.log(
              '❌ WebSocket: BID_PLACED_ERROR sent to bidder:',
              bidResponse.message,
            );
          }
        } catch (error: any) {
          console.error('💰 WebSocket: Error in place_bid:', error);
          socket.emit('ERROR', {
            message: error.message,
            code: 'BID_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          });
        }
      });

      socket.on('accept_bid', async (data, callback) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) {
            const errorResponse = {
              success: false,
              message: 'Not authenticated',
              code: 'AUTH_REQUIRED',
              timestamp: new Date(),
            };
            socket.emit('ERROR', errorResponse);
            if (callback) callback(errorResponse);
            return;
          }

          if (!this.validateServices()) {
            const errorResponse = {
              success: false,
              message: 'Services not available',
              code: 'SERVICE_UNAVAILABLE',
              timestamp: new Date(),
            };
            this.sendServiceNotAvailableError(socket);
            if (callback) callback(errorResponse);
            return;
          }

          console.log('✅ WebSocket: accept_bid received:', data);

          const bidResponse = await this.streamingService.acceptBid(data.bidId);

          if (bidResponse.success) {
            const successResponse = {
              success: true,
              bid: bidResponse.bid!,
              message: 'Bid accepted successfully',
            };
            
            socket.emit('BID_ACCEPTED_SUCCESS', successResponse);
            
            // Send callback response immediately
            if (callback) callback(successResponse);

            console.log(
              '✅ WebSocket: BID_ACCEPTED_SUCCESS sent to influencer',
            );
            // Wait a moment for the explorer to join the session
            setTimeout(async () => {
              if (
                bidResponse.bid &&
                bidResponse.bid.sessionId &&
                bidResponse.bid.explorerId
              ) {
                await this.notifyExplorerOfExistingProducers(
                  bidResponse.bid.sessionId,
                  bidResponse.bid.explorerId,
                );
              }
            }, 3000); // 3 second delay to allow explorer to join
          } else {
            const errorResponse = {
              success: false,
              message: bidResponse.message,
              code: 'BID_ACCEPT_ERROR',
              timestamp: new Date(),
            };
            socket.emit('ERROR', errorResponse);
            if (callback) callback(errorResponse);
          }
        } catch (error: any) {
          console.error('✅ WebSocket: Error in accept_bid:', error);
          const errorResponse = {
            success: false,
            message: error.message,
            code: 'BID_ACCEPT_ERROR',
            timestamp: new Date(),
          };
          socket.emit('ERROR', errorResponse);
          if (callback) callback(errorResponse);
        }
      });

      socket.on('reject_bid', async (data, callback) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) {
            const errorResponse = {
              success: false,
              message: 'Not authenticated',
              code: 'AUTH_REQUIRED',
              timestamp: new Date(),
            };
            socket.emit('ERROR', errorResponse);
            if (callback) callback(errorResponse);
            return;
          }

          if (!this.validateServices()) {
            const errorResponse = {
              success: false,
              message: 'Services not available',
              code: 'SERVICE_UNAVAILABLE',
              timestamp: new Date(),
            };
            this.sendServiceNotAvailableError(socket);
            if (callback) callback(errorResponse);
            return;
          }

          console.log('🚫 WebSocket: reject_bid received:', data);

          const bidResponse = await this.streamingService.rejectBid(data.bidId);

          console.log(
            '🚫 WebSocket: reject bid service response:',
            bidResponse,
          );

          if (bidResponse.success) {
            const successResponse = {
              success: true,
              bid: bidResponse.bid!,
              message: 'Bid rejected successfully',
            };
            socket.emit('BID_REJECTED_SUCCESS', successResponse);
            if (callback) callback(successResponse);

            console.log(
              '🚫 WebSocket: BID_REJECTED_SUCCESS sent to influencer',
            );
          } else {
            const errorResponse = {
              success: false,
              message: bidResponse.message,
              code: 'BID_REJECT_ERROR',
              timestamp: new Date(),
            };
            socket.emit('ERROR', errorResponse);
            if (callback) callback(errorResponse);

            console.log(
              '❌ WebSocket: BID_REJECT_ERROR sent to influencer:',
              bidResponse.message,
            );
          }
        } catch (error: any) {
          console.error('🚫 WebSocket: Error in reject_bid:', error);
          const errorResponse = {
            success: false,
            message: error.message,
            code: 'BID_REJECT_ERROR',
            timestamp: new Date(),
          };
          socket.emit('ERROR', errorResponse);
          if (callback) callback(errorResponse);
        }
      });

      socket.on('end_stream', async (data) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) {
            socket.emit('ERROR', {
              message: 'Not authenticated',
              code: 'AUTH_REQUIRED',
              timestamp: new Date(),
            });
            return;
          }

          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          console.log('🎬 WebSocket: end_stream received:', data);

          const updatedSession = await this.streamingService.endStreamSession(
            data.sessionId,
          );

          this.userSessionContext.delete(userId);

          socket.emit('STREAM_ENDED', {
            success: true,
            session: updatedSession,
          });

          this.safeEmitToSession(data.sessionId, 'SESSION_ENDED', {
            sessionId: data.sessionId,
            reason: 'ended_by_influencer',
            endedAt: new Date(),
          });

          if (this.mediasoupManager?.isMediaSoupAvailable()) {
            await this.mediasoupManager.deleteStreamRoom(data.sessionId);
          }

          this.streamRooms.delete(data.sessionId);

          console.log(`🎬 Stream ended: ${data.sessionId} by ${userId}`);
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'STREAM_END_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          });
        }
      });

      socket.on('send_gift', async (data) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) {
            socket.emit('ERROR', {
              message: 'Not authenticated',
              code: 'AUTH_REQUIRED',
              timestamp: new Date(),
            });
            return;
          }

          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          const giftResponse = await this.streamingService.sendGift({
            sessionId: data.sessionId,
            explorerId: userId,
            giftTypeId: data.giftTypeId,
            influencerId: data.influencerId,
            message: data.message,
          });

          socket.emit('GIFT_SENT_SUCCESS', {
            success: true,
            gift: giftResponse.gift,
            paymentIntent: giftResponse.paymentIntent,
          });
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'GIFT_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          });
        }
      });

      socket.on('get_gift_types', async () => {
        try {
          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          const giftTypes = await this.streamingService.getGiftTypes();
          socket.emit('GIFT_TYPES_RESPONSE', {
            success: true,
            giftTypes,
          });
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'GIFT_TYPES_ERROR',
            timestamp: new Date(),
          });
        }
      });

      socket.on('get_stream_session', async (data) => {
        try {
          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          const session = await this.streamingService.getStreamSession(
            data.sessionId,
          );

          if (session) {
            socket.emit('STREAM_SESSION_RESPONSE', {
              success: true,
              session,
            });
          } else {
            socket.emit('ERROR', {
              message: 'Stream session not found',
              code: 'SESSION_NOT_FOUND',
              sessionId: data.sessionId,
              timestamp: new Date(),
            });
          }
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'GET_SESSION_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          });
        }
      });

      socket.on('get_live_streams', async () => {
        try {
          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          const streams = await this.streamingService.getLiveStreams();
          socket.emit('LIVE_STREAMS_RESPONSE', {
            success: true,
            streams,
          });
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'GET_LIVE_STREAMS_ERROR',
            timestamp: new Date(),
          });
        }
      });

      socket.on('get_stream_bids', async (data) => {
        try {
          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          const bids = await this.streamingService.getStreamBids(
            data.sessionId,
          );
          socket.emit('STREAM_BIDS_RESPONSE', {
            success: true,
            bids,
          });
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'GET_BIDS_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          });
        }
      });

      socket.on('get_stream_gifts', async (data) => {
        try {
          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          const gifts = await this.streamingService.getStreamGifts(
            data.sessionId,
          );
          socket.emit('STREAM_GIFTS_RESPONSE', {
            success: true,
            gifts,
          });
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'GET_GIFTS_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          });
        }
      });

      socket.on('update_stream_settings', async (data) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) {
            socket.emit('ERROR', {
              message: 'Not authenticated',
              code: 'AUTH_REQUIRED',
              timestamp: new Date(),
            });
            return;
          }

          if (!this.validateServices()) {
            this.sendServiceNotAvailableError(socket);
            return;
          }

          const updatedSession =
            await this.streamingService.updateStreamSettings(data.sessionId, {
              allowBids: data.allowBids,
              callRate: data.callRate,
            });

          socket.emit('STREAM_SETTINGS_UPDATED', {
            success: true,
            session: updatedSession,
          });
        } catch (error: any) {
          socket.emit('ERROR', {
            message: error.message,
            code: 'UPDATE_SETTINGS_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          });
        }
      });

      socket.on('webrtc_offer', (data) => {
        try {
          if (socket.data.userId) {
            this.safeEmitToUser(data.targetUserId, 'WEBRTC_OFFER', {
              sessionId: data.sessionId,
              offer: data.offer,
              from: socket.data.userId,
              to: data.targetUserId,
            });
          }
        } catch (error) {
          console.error('WebRTC offer error:', error);
        }
      });

      socket.on('webrtc_answer', (data) => {
        try {
          if (socket.data.userId) {
            this.safeEmitToUser(data.targetUserId, 'WEBRTC_ANSWER', {
              sessionId: data.sessionId,
              answer: data.answer,
              from: socket.data.userId,
              to: data.targetUserId,
            });
          }
        } catch (error) {
          console.error('WebRTC answer error:', error);
        }
      });

      socket.on('ice_candidate', (data) => {
        try {
          if (socket.data.userId) {
            this.safeEmitToUser(data.targetUserId, 'ICE_CANDIDATE', {
              sessionId: data.sessionId,
              candidate: data.candidate,
              from: socket.data.userId,
              to: data.targetUserId,
            });
          }
        } catch (error) {
          console.error('ICE candidate error:', error);
        }
      });

      socket.on(
        'mediasoup_getRouterRtpCapabilities',
        async (data, callback) => {
          try {
            console.log(
              '🔧 [WebSocket] Getting router RTP capabilities for stream:',
              data.streamId,
            );

            if (!this.mediasoupManager?.isMediaSoupAvailable()) {
              console.warn('⚠️ [WebSocket] MediaSoup not available');
              callback({
                success: false,
                error: 'MediaSoup service not available',
              });
              return;
            }

            const rtpCapabilities =
              await this.mediasoupManager.getRouterRtpCapabilities(
                data.streamId,
              );

            if (rtpCapabilities) {
              console.log(
                '✅ [WebSocket] RTP capabilities sent for stream:',
                data.streamId,
              );
              callback({
                success: true,
                rtpCapabilities,
              });
            } else {
              console.error(
                '❌ [WebSocket] Failed to get RTP capabilities for stream:',
                data.streamId,
              );
              callback({
                success: false,
                error: 'Failed to get router RTP capabilities',
              });
            }
          } catch (error: any) {
            console.error(
              '❌ [WebSocket] Error getting RTP capabilities:',
              error,
            );
            callback({
              success: false,
              error: error.message || 'Unknown error getting RTP capabilities',
            });
          }
        },
      );

      socket.on('mediasoup_createWebRtcTransport', async (data, callback) => {
        try {
          console.log('🔧 [WebSocket] Creating WebRTC transport:', {
            streamId: data.streamId,
            peerId: data.peerId,
            direction: data.direction,
          });

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            console.warn(
              '⚠️ [WebSocket] MediaSoup not available for transport creation',
            );
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          if (!data.streamId || !data.peerId || !data.direction) {
            console.error(
              '❌ [WebSocket] Missing required parameters for transport creation',
            );
            callback({
              success: false,
              error: 'Missing required parameters: streamId, peerId, direction',
            });
            return;
          }

          if (data.direction !== 'send' && data.direction !== 'recv') {
            console.error(
              '❌ [WebSocket] Invalid direction for transport:',
              data.direction,
            );
            callback({
              success: false,
              error: 'Direction must be "send" or "recv"',
            });
            return;
          }

          const transport = await this.mediasoupManager.createWebRtcTransport(
            data.streamId,
            data.peerId,
            data.direction,
          );

          console.log('✅ [WebSocket] WebRTC transport created:', {
            transportId: transport.id,
            direction: data.direction,
            streamId: data.streamId,
            peerId: data.peerId,
          });

          callback({
            success: true,
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            sctpParameters: transport.sctpParameters,
          });
        } catch (error: any) {
          console.error(
            '❌ [WebSocket] Error creating WebRTC transport:',
            error,
          );
          callback({
            success: false,
            error: error.message || 'Failed to create WebRTC transport',
          });
        }
      });

      socket.on('mediasoup_connectWebRtcTransport', async (data, callback) => {
        try {
          console.log('🔗 [WebSocket] Connecting WebRTC transport:', {
            streamId: data.streamId,
            peerId: data.peerId,
            transportId: data.transportId,
          });

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            console.warn(
              '⚠️ [WebSocket] MediaSoup not available for transport connection',
            );
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          if (
            !data.streamId ||
            !data.peerId ||
            !data.transportId ||
            !data.dtlsParameters
          ) {
            console.error(
              '❌ [WebSocket] Missing required parameters for transport connection',
            );
            callback({
              success: false,
              error:
                'Missing required parameters: streamId, peerId, transportId, dtlsParameters',
            });
            return;
          }

          await this.mediasoupManager.connectWebRtcTransport(
            data.streamId,
            data.peerId,
            data.transportId,
            data.dtlsParameters,
          );

          console.log('✅ [WebSocket] WebRTC transport connected:', {
            transportId: data.transportId,
            streamId: data.streamId,
            peerId: data.peerId,
          });

          callback({
            success: true,
          });
        } catch (error: any) {
          console.error(
            '❌ [WebSocket] Error connecting WebRTC transport:',
            error,
          );
          callback({
            success: false,
            error: error.message || 'Failed to connect WebRTC transport',
          });
        }
      });

      socket.on('mediasoup_createProducer', async (data, callback) => {
        try {
          console.log('🎬 [WebSocket] Creating producer:', {
            streamId: data.streamId,
            peerId: data.peerId,
            kind: data.kind,
          });

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            console.warn(
              '⚠️ [WebSocket] MediaSoup not available for producer creation',
            );
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          if (
            !data.streamId ||
            !data.peerId ||
            !data.kind ||
            !data.rtpParameters
          ) {
            console.error(
              '❌ [WebSocket] Missing required parameters for producer creation',
            );
            callback({
              success: false,
              error:
                'Missing required parameters: streamId, peerId, kind, rtpParameters',
            });
            return;
          }

          if (data.kind !== 'audio' && data.kind !== 'video') {
            console.error(
              '❌ [WebSocket] Invalid kind for producer:',
              data.kind,
            );
            callback({
              success: false,
              error: 'Kind must be "audio" or "video"',
            });
            return;
          }

          const producerId = await this.mediasoupManager.createProducer(
            data.streamId,
            data.peerId,
            data.kind,
            data.rtpParameters,
          );

          console.log('✅ [WebSocket] Producer created:', {
            producerId,
            kind: data.kind,
            streamId: data.streamId,
            peerId: data.peerId,
          });

          const roomName = `stream:${data.streamId}`;
          const room = this.io.sockets.adapter.rooms.get(roomName);

          if (room) {
            console.log(
              `📊 [WebSocket] Room ${roomName} has ${room.size} participants`,
            );

            const otherUserIds: string[] = [];
            room.forEach((socketId) => {
              const participantSocket = this.io.sockets.sockets.get(socketId);
              if (
                participantSocket?.data?.userId &&
                participantSocket.data.userId !== data.peerId
              ) {
                otherUserIds.push(participantSocket.data.userId);
              }
            });

            console.log(
              `📢 [WebSocket] Notifying ${
                otherUserIds.length
              } other users: ${otherUserIds.join(', ')}`,
            );

            socket.to(roomName).emit('NEW_PRODUCER', {
              sessionId: data.streamId,
              producerId,
              userId: data.peerId,
              kind: data.kind,
            });

            otherUserIds.forEach((otherUserId) => {
              console.log(
                `📤 [WebSocket] Direct notification to ${otherUserId} about ${data.kind} producer ${producerId}`,
              );
              this.safeEmitToUser(otherUserId, 'NEW_PRODUCER', {
                sessionId: data.streamId,
                producerId,
                userId: data.peerId,
                kind: data.kind,
              });
            });
          } else {
            console.warn(`⚠️ [WebSocket] No room found for ${roomName}`);
          }

          callback({
            success: true,
            producerId,
          });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error creating producer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to create producer',
          });
        }
      });

      socket.on('mediasoup_createConsumer', async (data, callback) => {
        try {
          console.log('📺 [WebSocket] Creating consumer:', {
            streamId: data.streamId,
            peerId: data.peerId,
            producerId: data.producerId,
          });

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            console.warn(
              '⚠️ [WebSocket] MediaSoup not available for consumer creation',
            );
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          if (
            !data.streamId ||
            !data.peerId ||
            !data.producerId ||
            !data.rtpCapabilities
          ) {
            console.error(
              '❌ [WebSocket] Missing required parameters for consumer creation',
            );
            callback({
              success: false,
              error:
                'Missing required parameters: streamId, peerId, producerId, rtpCapabilities',
            });
            return;
          }

          const consumer = await this.mediasoupManager.createConsumer(
            data.streamId,
            data.peerId,
            data.producerId,
            data.rtpCapabilities,
          );

          console.log('✅ [WebSocket] Consumer created:', {
            consumerId: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            streamId: data.streamId,
            peerId: data.peerId,
          });

          callback({
            success: true,
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused,
          });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error creating consumer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to create consumer',
          });
        }
      });

      socket.on('mediasoup_pauseProducer', async (data, callback) => {
        try {
          console.log('⏸️ [WebSocket] Pausing producer:', data);

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          await this.mediasoupManager.pauseProducer(
            data.streamId,
            data.peerId,
            data.producerId,
          );

          console.log('✅ [WebSocket] Producer paused:', data.producerId);
          callback({ success: true });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error pausing producer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to pause producer',
          });
        }
      });

      socket.on('mediasoup_resumeProducer', async (data, callback) => {
        try {
          console.log('▶️ [WebSocket] Resuming producer:', data);

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          await this.mediasoupManager.resumeProducer(
            data.streamId,
            data.peerId,
            data.producerId,
          );

          console.log('✅ [WebSocket] Producer resumed:', data.producerId);
          callback({ success: true });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error resuming producer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to resume producer',
          });
        }
      });

      socket.on('mediasoup_pauseConsumer', async (data, callback) => {
        try {
          console.log('⏸️ [WebSocket] Pausing consumer:', data);

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          await this.mediasoupManager.pauseConsumer(
            data.streamId,
            data.peerId,
            data.consumerId,
          );

          console.log('✅ [WebSocket] Consumer paused:', data.consumerId);
          callback({ success: true });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error pausing consumer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to pause consumer',
          });
        }
      });

      socket.on('mediasoup_resumeConsumer', async (data, callback) => {
        try {
          console.log('▶️ [WebSocket] Resuming consumer:', data);

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          await this.mediasoupManager.resumeConsumer(
            data.streamId,
            data.peerId,
            data.consumerId,
          );

          console.log('✅ [WebSocket] Consumer resumed:', data.consumerId);
          callback({ success: true });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error resuming consumer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to resume consumer',
          });
        }
      });

      socket.on('mediasoup_closeProducer', async (data, callback) => {
        try {
          console.log('🚫 [WebSocket] Closing producer:', data);

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          await this.mediasoupManager.closeProducer(
            data.streamId,
            data.peerId,
            data.producerId,
          );

          console.log('✅ [WebSocket] Producer closed:', data.producerId);
          callback({ success: true });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error closing producer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to close producer',
          });
        }
      });

      socket.on('mediasoup_closeConsumer', async (data, callback) => {
        try {
          console.log('🚫 [WebSocket] Closing consumer:', data);

          if (!this.mediasoupManager?.isMediaSoupAvailable()) {
            callback({
              success: false,
              error: 'MediaSoup service not available',
            });
            return;
          }

          await this.mediasoupManager.closeConsumer(
            data.streamId,
            data.peerId,
            data.consumerId,
          );

          console.log('✅ [WebSocket] Consumer closed:', data.consumerId);
          callback({ success: true });
        } catch (error: any) {
          console.error('❌ [WebSocket] Error closing consumer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to close consumer',
          });
        }
      });

      socket.on('send_message', (data) => {
        try {
          if (socket.data.userId && socket.data.sessionId) {
            const messageId = `msg_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;

            this.safeEmitToSession(data.sessionId, 'NEW_MESSAGE', {
              messageId,
              sessionId: data.sessionId,
              senderId: socket.data.userId,
              content: data.content,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error('Message sending error:', error);
        }
      });

      socket.on('update_presence', (data) => {
        try {
          if (socket.data.userId) {
            this.safeEmitToAll('USER_PRESENCE_UPDATED', {
              userId: socket.data.userId,
              isOnline: data.isOnline,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error('Presence update error:', error);
        }
      });
      socket.on('get_influencers', async (data, callback) => {
        try {
          const userId = socket.data?.userId;

          console.log('🔍 [WebSocket] Get influencers request:', {
            userId,
            categories: data.categories,
            searchTerm: data.searchTerm || data.search_term,
            cursor: data.cursor,
            onlineOnly: data.onlineOnly || data.is_user_online,
            limit: data.limit,
          });

          if (!this.validateServices()) {
            if (callback) {
              callback({
                success: false,
                error: 'Services not available',
              });
            }
            return;
          }

          // Call the streaming service
          const result = await this.streamingService.getInfluencers({
            cursor: data.cursor,
            categories: data.categories,
            search_term: data.searchTerm || data.search_term,
            limit: data.limit || 10,
            is_user_online: data.onlineOnly || data.is_user_online,
          });

          // Join discovery room for updates
          socket.join('discovery:updates');

          // Store search criteria for targeted updates
          socket.data.discoveryCriteria = {
            categories: data.categories,
            searchTerm: data.searchTerm || data.search_term,
            onlineOnly: data.onlineOnly || data.is_user_online,
          };

          const responseData: InfluencersListData = {
            influencers: result.influencers,
            nextCursor: result.nextCursor,
            hasNextPage: result.hasNextPage,
            totalCount: result.influencers.length,
            sessionId: data.sessionId,
            statusBreakdown: {
              live: result.influencers.filter((inf: any) => inf.isLive).length,
              online: result.influencers.filter(
                (inf: any) => inf.isOnline && !inf.isLive,
              ).length,
              offline: result.influencers.filter((inf: any) => !inf.isOnline)
                .length,
              total: result.influencers.length,
            },
            timestamp: new Date(),
          };

          console.log('✅ [WebSocket] Sending influencers response:', {
            count: responseData.influencers.length,
            statusBreakdown: responseData.statusBreakdown,
            hasNextPage: responseData.hasNextPage,
          });

          // Send via callback if provided
          if (callback) {
            callback({
              success: true,
              data: responseData,
            });
          }

          // Removed: socket.emit('INFLUENCERS_LIST', responseData);  // This was causing state overwrite in frontend
        } catch (error: any) {
          console.error('❌ [WebSocket] Get influencers error:', error);

          const errorData = {
            message: error.message || 'Failed to get influencers',
            code: 'GET_INFLUENCERS_ERROR',
            sessionId: data.sessionId,
            timestamp: new Date(),
          };

          if (callback) {
            callback({
              success: false,
              error: errorData.message,
            });
          }

          socket.emit('DISCOVERY_ERROR', errorData);
        }
      });

      socket.on('get_influencer_by_username', async (data, callback) => {
        try {
          const userId = socket.data?.userId;

          console.log('🔍 [WebSocket] Get influencer by username:', {
            userId,
            username: data.username,
          });

          const influencer =
            await this.streamingService.getInfluencerByUsername(data.username);

          if (!influencer) {
            if (callback) {
              callback({
                success: false,
                error: 'Influencer not found',
              });
            }
            return;
          }

          // Subscribe to updates for this specific influencer
          socket.join(`influencer:${influencer.id}`);

          const responseData: InfluencerDetailsData = {
            influencer,
            isLive: influencer.isLive || false,
            currentStreamId: influencer.streamInfo?.id,
            timestamp: new Date(),
          };

          if (callback) {
            callback({
              success: true,
              data: responseData,
            });
          }

          socket.emit('INFLUENCER_DETAILS', responseData);
        } catch (error: any) {
          console.error(
            '❌ [WebSocket] Get influencer by username error:',
            error,
          );

          if (callback) {
            callback({
              success: false,
              error: error.message || 'Failed to get influencer',
            });
          }
        }
      });

      socket.on('subscribe_to_influencer_updates', (data) => {
        try {
          const userId = socket.data?.userId;
          if (!userId) return;

          // Join appropriate rooms
          socket.join('discovery:updates');

          if (data.influencerIds && data.influencerIds.length > 0) {
            data.influencerIds.forEach((influencerId: any) => {
              socket.join(`influencer:${influencerId}`);
            });
          }

          // Store subscription criteria
          socket.data.influencerUpdatesCriteria = data;

          console.log('📡 [WebSocket] Subscribed to influencer updates:', {
            userId,
            criteria: data,
          });
        } catch (error) {
          console.error('❌ [WebSocket] Subscribe error:', error);
        }
      });

      socket.on('unsubscribe_from_influencer_updates', () => {
        try {
          const userId = socket.data?.userId;
          if (!userId) return;

          // Leave update rooms
          socket.leave('discovery:updates');

          // Leave specific influencer rooms
          const rooms = Array.from(socket.rooms);
          rooms.forEach((room) => {
            if (room.startsWith('influencer:')) {
              socket.leave(room);
            }
          });

          delete socket.data.discoveryCriteria;
          delete socket.data.influencerUpdatesCriteria;

          console.log(
            '🔕 [WebSocket] Unsubscribed from influencer updates:',
            userId,
          );
        } catch (error) {
          console.error('❌ [WebSocket] Unsubscribe error:', error);
        }
      });

      socket.on('typing_start', (data) => {
        try {
          if (socket.data.userId) {
            this.safeEmitToSession(data.sessionId, 'USER_TYPING', {
              userId: socket.data.userId,
              sessionId: data.sessionId,
              isTyping: true,
            });
          }
        } catch (error) {
          console.error('Typing start error:', error);
        }
      });

      socket.on('typing_stop', (data) => {
        try {
          if (socket.data.userId) {
            this.safeEmitToSession(data.sessionId, 'USER_TYPING', {
              userId: socket.data.userId,
              sessionId: data.sessionId,
              isTyping: false,
            });
          }
        } catch (error) {
          console.error('Typing stop error:', error);
        }
      });

      socket.on('ping', (callback) => {
        callback('pong');
      });

      socket.on('get_platform_stats', (callback) => {
        try {
          const stats = this.getConnectionInfo();
          callback({
            success: true,
            stats: {
              totalUsers: stats.activeUsers,
              activeStreams: stats.activeSessions,
              totalConnections: stats.totalConnections,
              serverTime: new Date().toISOString(),
            },
          });
        } catch (error: any) {
          callback({
            success: false,
            error: error.message,
          });
        }
      });

      socket.on('leave_session', (data) => {
        try {
          const roomName = `stream:${data.sessionId}`;
          socket.leave(roomName);
          this.streamRooms.get(data.sessionId)?.delete(socket.id);

          if (socket.data.userId) {
            this.userSessionContext.delete(socket.data.userId);

            this.safeEmitToSession(data.sessionId, 'USER_DISCONNECTED', {
              sessionId: data.sessionId,
              userId: socket.data.userId,
              timestamp: new Date(),
            });
          }

          console.log(
            `🚪 User ${socket.data.userId} left session ${data.sessionId}`,
          );
        } catch (error) {
          console.error('🚪 Leave session error:', error);
        }
      });

      socket.on('disconnect', async (reason) => {
        console.log(
          `🔌 [WebSocket] Socket disconnected: ${socket.id}, reason: ${reason}`,
        );

        const userId = socket.data?.userId;
        const sessionId = socket.data?.sessionId;

        if (userId) {
          this.userSessionContext.delete(userId);

          this.connectedUsers.delete(userId);
          this.socketToUser.delete(socket.id);

          const userSessions = this.userSessions.get(userId);
          if (userSessions) {
            userSessions.delete(socket.id);

            // Only mark user as offline if this was their last connection
            if (userSessions.size === 0) {
              this.userSessions.delete(userId);

              // Update user offline status in database
              try {
                await this.prisma.user.update({
                  where: { id: userId },
                  data: { isOnline: false },
                });

                console.log(`✅ [WebSocket] User ${userId} marked as offline`);

                // Get user details for notifications
                const user = await this.prisma.user.findUnique({
                  where: { id: userId },
                  include: { profile: true },
                });

                if (user && this.streamingService) {
                  // Check if they had an active stream
                  const activeSessionId =
                    this.streamingService.getInfluencerActiveSession(userId);

                  if (activeSessionId) {
                    // If they had an active stream but disconnected, the stream might still be "live"
                    // but the influencer is offline. You might want to end the stream or mark it differently
                    console.warn(
                      `⚠️ [WebSocket] User ${userId} disconnected while streaming`,
                    );

                    // Optionally end the stream
                    // await this.streamingService.endStreamSession(activeSessionId);

                    // Or just notify that they're offline
                    this.safeEmitToAll('INFLUENCER_STATUS_CHANGED', {
                      influencerId: userId,
                      username: user.profile?.username || undefined,
                      status: 'offline',
                      previousStatus: 'live',
                      timestamp: new Date(),
                    });
                  } else {
                    // Regular offline notification
                    this.safeEmitToAll('INFLUENCER_STATUS_CHANGED', {
                      influencerId: userId,
                      username: user.profile?.username || undefined,
                      status: 'offline',
                      previousStatus: 'online',
                      timestamp: new Date(),
                    });
                  }
                }
              } catch (dbError) {
                console.error(
                  `❌ [WebSocket] Failed to update offline status for user ${userId}:`,
                  dbError,
                );
              }
            } else {
              console.log(
                `👥 [WebSocket] User ${userId} still has ${userSessions.size} active connections`,
              );
            }
          }

          if (sessionId && this.mediasoupManager?.isMediaSoupAvailable()) {
            try {
              console.log(
                `🧹 [WebSocket] Cleaning up MediaSoup resources for user ${userId} in session ${sessionId}`,
              );
              await this.mediasoupManager.removePeer(sessionId, userId);
            } catch (error) {
              console.error(
                '❌ [WebSocket] Error cleaning up MediaSoup resources:',
                error,
              );
            }
          }

          for (const [streamId, socketIds] of this.streamRooms.entries()) {
            if (socketIds.has(socket.id)) {
              socketIds.delete(socket.id);

              if (socketIds.size === 0) {
                this.streamRooms.delete(streamId);

                if (this.mediasoupManager?.isMediaSoupAvailable()) {
                  try {
                    console.log(
                      `🧹 [WebSocket] Cleaning up empty MediaSoup room: ${streamId}`,
                    );
                    await this.mediasoupManager.closeStreamRoom(streamId);
                  } catch (error) {
                    console.error(
                      '❌ [WebSocket] Error cleaning up MediaSoup room:',
                      error,
                    );
                  }
                }
              }

              socket.to(`stream:${streamId}`).emit('USER_DISCONNECTED', {
                sessionId: streamId,
                userId,
                timestamp: new Date(),
              });
            }
          }

          console.log(
            `👋 [WebSocket] User ${userId} disconnected and cleaned up`,
          );
        }
      });

      socket.on('error', (error) => {
        console.error(`Socket error on ${socket.id}:`, error);
      });
    });
  }

  // Safe emit methods to handle Redis connection issues
  public async safeEmitToUser<K extends keyof ServerToClientEvents>(
    userId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): Promise<void> {
    try {
      if (this.isShuttingDown) {
        console.warn(`⚠️ [WebSocket] Skipping emit during shutdown: ${event}`);
        return;
      }

      if (this.redisAvailable && this.emitter) {
        await safeRedisOperation(async () => {
          this.emitter.to(`user:${userId}`).emit(event, ...args);
        });
      } else {
        // Fallback to direct socket emit if Redis is not available
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit(event, ...args);
          }
        }
      }
    } catch (error) {
      console.error(
        `❌ [WebSocket] Error in safeEmitToUser for ${event}:`,
        error,
      );
      // Try direct socket emit as fallback
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          try {
            socket.emit(event, ...args);
          } catch (fallbackError) {
            console.error(
              `❌ [WebSocket] Fallback emit also failed:`,
              fallbackError,
            );
          }
        }
      }
    }
  }

  public async safeEmitToSession<K extends keyof ServerToClientEvents>(
    sessionId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): Promise<void> {
    try {
      if (this.isShuttingDown) {
        console.warn(`⚠️ [WebSocket] Skipping emit during shutdown: ${event}`);
        return;
      }

      const roomName = `stream:${sessionId}`;
      const room = this.io.sockets.adapter.rooms.get(roomName);
      const participantCount = room ? room.size : 0;

      console.log(
        `[WebSocket] safeEmitToSession called: event=${event}, sessionId=${sessionId}, participants=${participantCount}`,
      );

      if (participantCount === 0) {
        console.warn(
          `[WebSocket] No participants in room ${roomName}! Event ${event} will not be delivered.`,
        );
        return;
      }

      if (this.redisAvailable && this.emitter) {
        await safeRedisOperation(async () => {
          this.emitter.to(roomName).emit(event, ...args);
        });
      } else {
        // Fallback to direct room emit
        this.io.to(roomName).emit(event, ...args);
      }

      console.log(
        `[WebSocket] Event ${event} emitted to room ${roomName} with ${participantCount} participants`,
      );
    } catch (error) {
      console.error(
        `❌ [WebSocket] Error in safeEmitToSession for ${event}:`,
        error,
      );
      // Try direct room emit as fallback
      try {
        this.io.to(`stream:${sessionId}`).emit(event, ...args);
      } catch (fallbackError) {
        console.error(
          `❌ [WebSocket] Fallback emit also failed:`,
          fallbackError,
        );
      }
    }
  }

  public async safeEmitToAll<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): Promise<void> {
    try {
      if (this.isShuttingDown) {
        console.warn(`⚠️ [WebSocket] Skipping emit during shutdown: ${event}`);
        return;
      }

      if (this.redisAvailable && this.emitter) {
        await safeRedisOperation(async () => {
          this.emitter.emit(event, ...args);
        });
      } else {
        this.io.emit(event, ...args);
      }
    } catch (error) {
      console.error(
        `❌ [WebSocket] Error in safeEmitToAll for ${event}:`,
        error,
      );
      // Try direct emit as fallback
      try {
        this.io.emit(event, ...args);
      } catch (fallbackError) {
        console.error(
          `❌ [WebSocket] Fallback emit also failed:`,
          fallbackError,
        );
      }
    }
  }

  // Original emit methods (preserved for backward compatibility)
  public emitToUser<K extends keyof ServerToClientEvents>(
    userId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    this.safeEmitToUser(userId, event, ...args).catch((error) => {
      console.error(`❌ [WebSocket] emitToUser failed:`, error);
    });
  }

  public emitToSession<K extends keyof ServerToClientEvents>(
    sessionId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    this.safeEmitToSession(sessionId, event, ...args).catch((error) => {
      console.error(`❌ [WebSocket] emitToSession failed:`, error);
    });
  }

  public emitToAll<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    this.safeEmitToAll(event, ...args).catch((error) => {
      console.error(`❌ [WebSocket] emitToAll failed:`, error);
    });
  }

  public notifyInfluencerStatusChange(
    influencerId: string,
    username: string | null,
    newStatus: 'online' | 'offline' | 'live',
    previousStatus: 'online' | 'offline' | 'live',
  ): void {
    const notification: InfluencerStatusChangedData = {
      influencerId,
      username: username || undefined,
      status: newStatus,
      previousStatus,
      timestamp: new Date(),
    };

    // Notify discovery subscribers
    this.io
      .to('discovery:updates')
      .emit('INFLUENCER_STATUS_CHANGED', notification);

    // Notify specific influencer subscribers
    this.io
      .to(`influencer:${influencerId}`)
      .emit('INFLUENCER_STATUS_CHANGED', notification);
  }

  public notifyInfluencerWentLive(
    influencerId: string,
    username: string | null,
    streamId: string,
    allowBids: boolean,
    callRate: string,
  ): void {
    const notification: InfluencerWentLiveData = {
      influencerId,
      username: username || undefined,
      streamId,
      allowBids,
      callRate,
      timestamp: new Date(),
    };

    // Update status first
    this.notifyInfluencerStatusChange(influencerId, username, 'live', 'online');

    // Then notify about the stream
    this.io.to('discovery:updates').emit('INFLUENCER_WENT_LIVE', notification);
    this.io
      .to(`influencer:${influencerId}`)
      .emit('INFLUENCER_WENT_LIVE', notification);
  }

  public notifyInfluencerEndedStream(
    influencerId: string,
    username: string | null,
    streamId: string,
  ): void {
    const notification: InfluencerEndedStreamData = {
      influencerId,
      username: username || undefined,
      streamId,
      timestamp: new Date(),
    };

    // Update status first
    this.notifyInfluencerStatusChange(influencerId, username, 'online', 'live');

    // Then notify about stream end
    this.io
      .to('discovery:updates')
      .emit('INFLUENCER_ENDED_STREAM', notification);
    this.io
      .to(`influencer:${influencerId}`)
      .emit('INFLUENCER_ENDED_STREAM', notification);
  }

  // All remaining methods from original (preserved exactly)
  private async syncMediaSoupRoom(sessionId: string): Promise<void> {
    if (!this.mediasoupManager?.isMediaSoupAvailable()) {
      return;
    }

    try {
      console.log(
        `🔄 [WebSocket] Syncing MediaSoup room for session ${sessionId}`,
      );

      const roomName = `stream:${sessionId}`;
      const room = this.io.sockets.adapter.rooms.get(roomName);

      if (!room) {
        console.warn(
          `🔄 [WebSocket] No WebSocket room found for session ${sessionId}`,
        );
        return;
      }

      console.log(
        `🔄 [WebSocket] Room ${roomName} has ${room.size} participants`,
      );

      room.forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket?.data?.userId) {
          console.log(
            `🔄 [WebSocket] Participant: ${socket.data.userId} (socket: ${socketId})`,
          );
        }
      });

      if (!this.mediasoupManager.roomExists(sessionId)) {
        console.log(
          `🔄 [WebSocket] Creating MediaSoup room for session ${sessionId}`,
        );
        await this.mediasoupManager.createStreamRoom(sessionId);
      }
    } catch (error) {
      console.error(
        `❌ [WebSocket] Error syncing MediaSoup room for session ${sessionId}:`,
        error,
      );
    }
  }

  public async notifyExplorerOfExistingProducers(
    sessionId: string,
    explorerId: string,
  ): Promise<void> {
    console.log(
      `📢 [WebSocket] Notifying explorer ${explorerId} of existing producers in session ${sessionId}`,
    );

    if (!this.mediasoupManager?.isMediaSoupAvailable()) {
      console.warn(
        '⚠️ [WebSocket] MediaSoup not available for producer notification',
      );
      return;
    }

    try {
      // Get all producers in the session
      const allProducers = this.mediasoupManager.getStreamProducers(sessionId);

      // Filter out the explorer's own producers (if any)
      const influencerProducers = allProducers.filter(
        (p) => p.peerId !== explorerId,
      );

      if (influencerProducers.length === 0) {
        console.warn(
          `⚠️ [WebSocket] No influencer producers found in session ${sessionId}`,
        );
        return;
      }

      console.log(
        `📋 [WebSocket] Found ${influencerProducers.length} influencer producers to notify`,
      );

      // Send each producer notification with a delay to ensure proper order
      for (let i = 0; i < influencerProducers.length; i++) {
        const producer = influencerProducers[i];

        await new Promise((resolve) => setTimeout(resolve, i * 300)); // 300ms delay between each

        console.log(
          `🔔 [WebSocket] Notifying explorer about ${producer.kind} producer ${producer.producerId}`,
        );

        // Send multiple times to ensure delivery
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));

          this.safeEmitToUser(explorerId, 'NEW_PRODUCER', {
            sessionId,
            producerId: producer.producerId,
            userId: producer.peerId,
            kind: producer.kind,
            timestamp: new Date(),
            enhanced: true,
            attempt: attempt + 1,
          });
        }
      }

      console.log(
        `✅ [WebSocket] Completed producer notifications to explorer ${explorerId}`,
      );
    } catch (error) {
      console.error(
        '❌ [WebSocket] Error notifying explorer of producers:',
        error,
      );
    }
  }

  public notifyNewProducerEnhanced(
    streamId: string,
    peerId: string,
    producerId: string,
    kind: 'audio' | 'video',
  ): void {
    console.log(
      `📢 [WebSocket] Enhanced notification: New ${kind} producer ${producerId} from ${peerId} in session ${streamId}`,
    );

    const roomName = `stream:${streamId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);

    if (!room) {
      console.warn(
        `⚠️ [WebSocket] No room found for session ${streamId} when notifying about producer ${producerId}`,
      );
      return;
    }

    // Get all participants except the producer
    const otherParticipants: string[] = [];
    room.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket?.data?.userId && socket.data.userId !== peerId) {
        otherParticipants.push(socket.data.userId);
      }
    });

    console.log(
      `📊 [WebSocket] Notifying ${otherParticipants.length} participants about new ${kind} producer:`,
      otherParticipants,
    );

    // Enhanced notification data with additional metadata
    const enhancedNotificationData: NewProducerData = {
      sessionId: streamId,
      producerId,
      userId: peerId,
      kind,
      timestamp: new Date(),
      enhanced: true, // Flag to indicate this is an enhanced notification
    };

    // Send to room (excluding the producer)
    this.io
      .to(roomName)
      .except(`user:${peerId}`)
      .emit('NEW_PRODUCER', enhancedNotificationData);

    // Also send direct notifications to ensure delivery
    otherParticipants.forEach((participantId, index) => {
      // Stagger notifications slightly to prevent overwhelming
      setTimeout(() => {
        console.log(
          `📤 [WebSocket] Direct enhanced notification to ${participantId} about ${kind} producer ${producerId}`,
        );

        this.safeEmitToUser(
          participantId,
          'NEW_PRODUCER',
          enhancedNotificationData,
        );

        // Also emit a retry notification as backup
        setTimeout(() => {
          this.safeEmitToUser(participantId, 'NEW_PRODUCER_RETRY', {
            ...enhancedNotificationData,
            retry: true,
          } as NewProducerRetryData);
        }, 500);
      }, index * 100); // 100ms between each notification
    });

    // Log the final state
    console.log(
      `✅ [WebSocket] Enhanced producer notification completed for ${kind} producer ${producerId} in session ${streamId}`,
    );
  }

  public notifyPeerReadyForConsumption(streamId: string, peerId: string): void {
    console.log(
      `🎯 [WebSocket] Peer ${peerId} is ready for consumption in session ${streamId}`,
    );

    const roomName = `stream:${streamId}`;

    // Notify other peers that this peer is ready to consume their content
    this.io
      .to(roomName)
      .except(`user:${peerId}`)
      .emit('PEER_READY_FOR_CONSUMPTION', {
        sessionId: streamId,
        peerId,
        timestamp: new Date(),
      });

    // If this peer is ready, check if there are existing producers they should consume
    setTimeout(() => {
      if (this.mediasoupManager?.isMediaSoupAvailable()) {
        const existingProducers =
          this.mediasoupManager.getStreamProducers(streamId);
        const otherProducers = existingProducers.filter(
          (p) => p.peerId !== peerId,
        );

        if (otherProducers.length > 0) {
          console.log(
            `🔄 [WebSocket] Sending existing producers to newly ready peer ${peerId}:`,
            otherProducers,
          );

          // Send existing producers to the newly ready peer
          otherProducers.forEach((producer, index) => {
            setTimeout(() => {
              this.safeEmitToUser(peerId, 'NEW_PRODUCER', {
                sessionId: streamId,
                producerId: producer.producerId,
                userId: producer.peerId,
                kind: producer.kind,
                timestamp: new Date(),
                enhanced: true,
              });
            }, index * 200); // 200ms between each existing producer notification
          });
        }
      }
    }, 1000); // Wait 1 second to ensure peer is fully ready
  }

  // Notification methods using safe emit
  public notifyBidPlaced(sessionId: string, bidData: BidPlacedData): void {
    this.safeEmitToSession(sessionId, 'BID_PLACED', bidData);

    const newBidData: NewBidData = {
      bidId: bidData.bidId,
      sessionId: bidData.sessionId,
      amount: bidData.amount,
      bidderId: bidData.bidderId,
      bidderName: bidData.bidderName,
      currentHighestBid: bidData.amount,
      timestamp: bidData.timestamp,
    };

    this.safeEmitToSession(sessionId, 'NEW_BID', newBidData);
  }

  public notifyBidAccepted(bidData: BidAcceptedData): void {
    this.safeEmitToUser(bidData.bidderId, 'BID_ACCEPTED', bidData);
    this.safeEmitToSession(bidData.sessionId, 'BID_ACCEPTED', bidData);
  }

  public notifyBidRejected(bidData: BidRejectedData): void {
    this.safeEmitToSession(bidData.sessionId, 'BID_REJECTED', bidData);
  }

  public notifyOutbid(outbidData: OutbidData): void {
    this.safeEmitToUser(outbidData.previousBidderId, 'OUTBID', outbidData);
    this.safeEmitToSession(outbidData.sessionId, 'OUTBID', outbidData);
  }

  public notifyGiftSent(sessionId: string, giftData: GiftSentData): void {
    this.safeEmitToSession(sessionId, 'GIFT_SENT', giftData);
  }

  public notifySessionCreated(
    influencerId: string,
    sessionData: SessionCreatedData,
  ): void {
    this.safeEmitToUser(influencerId, 'SESSION_CREATED', sessionData);
  }

  public notifySessionEnded(
    sessionId: string,
    sessionData: SessionEndedData,
  ): void {
    this.safeEmitToSession(sessionId, 'SESSION_ENDED', sessionData);
  }

  public notifyStreamError(
    sessionId: string,
    errorData: StreamErrorData,
  ): void {
    this.safeEmitToSession(sessionId, 'STREAM_ERROR', errorData);
  }

  public notifySettingsUpdated(
    sessionId: string,
    settingsData: SettingsUpdatedData,
  ): void {
    this.safeEmitToSession(sessionId, 'SETTINGS_UPDATED', settingsData);
  }

  public getStreamParticipantCount(sessionId: string): number {
    const roomName = `stream:${sessionId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    const count = room ? room.size : 0;

    console.log(`[WebSocket] Session ${sessionId} participant count: ${count}`);
    return count;
  }

  public getStreamParticipants(sessionId: string): string[] {
    const participants = this.streamRooms.get(sessionId);
    return participants ? Array.from(participants) : [];
  }

  public getSessionUserIds(sessionId: string): string[] {
    const roomName = `stream:${sessionId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    const userIds: string[] = [];

    if (room) {
      room.forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket?.data.userId) {
          userIds.push(socket.data.userId);
        }
      });
    }

    return [...new Set(userIds)];
  }

  public isUserOnline(userId: string): boolean {
    return (
      this.userSessions.has(userId) && this.userSessions.get(userId)!.size > 0
    );
  }

  public getServer(): SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > {
    return this.io;
  }

  public getConnectionInfo(): {
    totalConnections: number;
    activeUsers: number;
    activeSessions: number;
  } {
    return {
      totalConnections: this.io.sockets.sockets.size,
      activeUsers: this.userSessions.size,
      activeSessions: this.streamRooms.size,
    };
  }

  public forceDisconnectUser(
    userId: string,
    reason = 'Forced disconnect',
  ): boolean {
    const socketIds = this.userSessions.get(userId);
    if (socketIds) {
      for (const socketId of socketIds) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
      return true;
    }
    return false;
  }

  public cleanupEmptyRooms(): void {
    this.streamRooms.forEach((participants, sessionId) => {
      if (participants.size === 0) {
        this.streamRooms.delete(sessionId);
        console.log(`Cleaned up empty room: ${sessionId}`);
      }
    });
  }

  public debugSessionConsistency(sessionId: string): void {
    console.log(`🔍 [WebSocket] Session Consistency Check for ${sessionId}:`);

    const roomName = `stream:${sessionId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    console.log(`WebSocket Room ${roomName}:`, {
      exists: !!room,
      size: room ? room.size : 0,
    });

    if (this.mediasoupManager?.isMediaSoupAvailable()) {
      const roomExists = this.mediasoupManager.roomExists(sessionId);
      const producers = this.mediasoupManager.getStreamProducers(sessionId);
      console.log(`MediaSoup Room ${sessionId}:`, {
        exists: roomExists,
        producers: producers.length,
        producerDetails: producers,
      });
    }

    if (room) {
      room.forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          console.log(`Socket ${socketId}:`, {
            userId: socket.data?.userId,
            sessionId: socket.data?.sessionId,
            consistentSession: socket.data?.sessionId === sessionId,
          });
        }
      });
    }
  }

  public debugSessionState(sessionId: string): void {
    console.log(`[WebSocket] 🔍 Debug Session State for ${sessionId}:`);

    const roomName = `stream:${sessionId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);

    console.log(`[WebSocket] Room ${roomName}:`, {
      exists: !!room,
      size: room ? room.size : 0,
      sockets: room ? Array.from(room) : [],
    });

    console.log(`[WebSocket] StreamRooms tracking:`, {
      hasSession: this.streamRooms.has(sessionId),
      size: this.streamRooms.get(sessionId)?.size || 0,
      socketIds: this.streamRooms.get(sessionId)
        ? Array.from(this.streamRooms.get(sessionId)!)
        : [],
    });

    const participants = this.getSessionUserIds(sessionId);
    console.log(`[WebSocket] Active participants:`, participants);

    if (this.mediasoupManager?.isMediaSoupAvailable()) {
      const producers = this.mediasoupManager.getStreamProducers(sessionId);
      console.log(`[WebSocket] MediaSoup producers:`, producers);
    }
  }

  private async rateLimit(
    userId: string,
    action: string,
    limit: number,
    period: number,
  ): Promise<boolean> {
    if (!this.redisAvailable || !this.pubClient) {
      // If Redis is not available, allow all operations
      return true;
    }

    try {
      const key = `rate:${userId}:${action}`;
      const count = await this.pubClient.incr(key);
      if (count === 1) {
        await this.pubClient.expire(key, period);
      }
      return count <= limit;
    } catch (error) {
      console.error('❌ [WebSocket] Rate limit error:', error);
      // If rate limiting fails, allow the operation
      return true;
    }
  }

  async getConcurrentUsers(sessionId: string): Promise<number> {
    if (!this.redisAvailable || !this.pubClient) {
      // Fallback to counting room participants
      const roomName = `stream:${sessionId}`;
      const room = this.io.sockets.adapter.rooms.get(roomName);
      return room ? room.size : 0;
    }

    try {
      return await this.pubClient.sCard(`session:${sessionId}:users`);
    } catch (error) {
      console.error('❌ [WebSocket] Error getting concurrent users:', error);
      // Fallback to counting room participants
      const roomName = `stream:${sessionId}`;
      const room = this.io.sockets.adapter.rooms.get(roomName);
      return room ? room.size : 0;
    }
  }

  // Add method to set Prisma client if not provided in constructor
  public setPrismaClient(prisma: PrismaClient): void {
    this.prisma = prisma;
  }

  // Add cleanup method for Prisma
  public async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    await this.gracefulShutdown();
  }

  // Graceful shutdown method
  public async gracefulShutdown(): Promise<void> {
    console.log('🛑 [WebSocket] Starting graceful shutdown...');
    this.isShuttingDown = true;

    try {
      // Close all socket connections
      this.io.sockets.sockets.forEach((socket) => {
        socket.disconnect(true);
      });

      // Close Redis connections safely
      if (this.pubClient && this.pubClient.isOpen) {
        await this.pubClient.quit().catch(() => {
          // If quit fails, try disconnect
          return this.pubClient.disconnect();
        });
      }
      if (this.subClient && this.subClient.isOpen) {
        await this.subClient.quit().catch(() => {
          // If quit fails, try disconnect
          return this.subClient.disconnect();
        });
      }

      // Close Socket.IO server
      this.io.close();

      console.log('✅ [WebSocket] Graceful shutdown completed');
    } catch (error) {
      console.error('❌ [WebSocket] Error during graceful shutdown:', error);
    }
  }
}
