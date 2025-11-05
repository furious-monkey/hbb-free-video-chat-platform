// websocket/websocket.types.ts - Fixed WebSocket types with full streaming support

export type WebSocketEvent =
  | 'SESSION_CREATED'
  | 'SESSION_JOINED'
  | 'SESSION_ENDED'
  | 'BID_PLACED'
  | 'BID_ACCEPTED'
  | 'BID_REJECTED'
  | 'GIFT_SENT'
  | 'USER_CONNECTED'
  | 'USER_DISCONNECTED'
  | 'STREAM_SIGNAL'
  | 'ICE_CANDIDATE'
  | 'SDP_OFFER'
  | 'SDP_ANSWER'
  | 'ERROR'
  | 'NEW_BID'
  | 'OUTBID'
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'NEW_MESSAGE'
  | 'STREAM_ERROR'
  | 'PRODUCER_CLOSED'
  | 'NEW_PRODUCER'
  | 'SETTINGS_UPDATED'
  | 'STREAM_CREATED'
  | 'STREAM_JOINED'
  | 'STREAM_ENDED'
  | 'BID_PLACED_SUCCESS'
  | 'BID_PLACED_FAILED'
  | 'PAYMENT_FAILED'
  | 'EXPLORER_PAYMENT_FAILED'
  | 'BID_PLACED_ERROR'
  | 'BID_ACCEPTED_SUCCESS'
  | 'BID_REJECTED_SUCCESS'
  | 'GIFT_SENT_SUCCESS'
  | 'GIFT_TYPES_RESPONSE'
  | 'STREAM_SESSION_RESPONSE'
  | 'LIVE_STREAMS_RESPONSE'
  | 'STREAM_BIDS_RESPONSE'
  | 'STREAM_GIFTS_RESPONSE'
  | 'STREAM_SETTINGS_UPDATED'
  | 'USER_TYPING'
  | 'USER_PRESENCE_UPDATED'
  | 'NEW_PRODUCER_RETRY'
  | 'PEER_READY_FOR_CONSUMPTION';

export interface WebSocketMessage {
  type: WebSocketEvent;
  payload: any;
}

// ─── Server → Client (outgoing) events ───
export interface ServerToClientEvents {
  // Authentication
  USER_CONNECTED: (data: UserConnectedData) => void;
  USER_DISCONNECTED: (data: UserDisconnectedData) => void;
  ERROR: (data: ErrorData) => void;

  // Stream Management
  SESSION_CREATED: (data: SessionCreatedData) => void;
  SESSION_JOINED: (data: SessionJoinedData) => void;
  SESSION_ENDED: (data: SessionEndedData) => void;
  STREAM_CREATED: (data: StreamCreatedResponse) => void;
  STREAM_JOINED: (data: StreamJoinedResponse) => void;
  STREAM_ENDED: (data: StreamEndedResponse) => void;
  STREAM_SESSION_RESPONSE: (data: StreamSessionResponse) => void;
  LIVE_STREAMS_RESPONSE: (data: LiveStreamsResponse) => void;
  STREAM_SETTINGS_UPDATED: (data: StreamSettingsUpdatedResponse) => void;

  // Bidding
  BID_PLACED: (data: BidPlacedData) => void;
  BID_ACCEPTED: (data: BidAcceptedData) => void;
  BID_REJECTED: (data: BidRejectedData) => void;
  NEW_BID: (data: NewBidData) => void;
  OUTBID: (data: OutbidData) => void;
  BID_PLACED_SUCCESS: (data: BidPlacedSuccessResponse) => void;
  BID_PLACED_ERROR: (data: BidPlacedErrorResponse) => void;
  BID_ACCEPTED_SUCCESS: (data: BidAcceptedSuccessResponse) => void;
  BID_REJECTED_SUCCESS: (data: BidRejectedSuccessResponse) => void;
  STREAM_BIDS_RESPONSE: (data: StreamBidsResponse) => void;
  
  // Payment Events
  PAYMENT_FAILED: (data: any) => void;
  EXPLORER_PAYMENT_FAILED: (data: any) => void;

  // Gifts
  GIFT_SENT: (data: GiftSentData) => void;
  GIFT_SENT_SUCCESS: (data: GiftSentSuccessResponse) => void;
  GIFT_TYPES_RESPONSE: (data: GiftTypesResponse) => void;
  STREAM_GIFTS_RESPONSE: (data: StreamGiftsResponse) => void;

  // WebRTC Signaling
  STREAM_SIGNAL: (data: StreamSignalData) => void;
  ICE_CANDIDATE: (data: IceCandidateData) => void;
  SDP_OFFER: (data: SdpOfferData) => void;
  SDP_ANSWER: (data: SdpAnswerData) => void;
  WEBRTC_OFFER: (data: WebRtcOfferData) => void;
  WEBRTC_ANSWER: (data: WebRtcAnswerData) => void;

  // Chat & Communication
  NEW_MESSAGE: (data: NewMessageData) => void;
  USER_TYPING: (data: UserTypingData) => void;

  // User Presence
  USER_PRESENCE_UPDATED: (data: UserPresenceUpdatedData) => void;

  // Stream Events
  STREAM_ERROR: (data: StreamErrorData) => void;
  PRODUCER_CLOSED: (data: ProducerClosedData) => void;
  NEW_PRODUCER: (data: NewProducerData) => void;
  NEW_PRODUCER_RETRY: (data: NewProducerRetryData) => void;
  SETTINGS_UPDATED: (data: SettingsUpdatedData) => void;
  PEER_READY_FOR_CONSUMPTION: (data: PeerReadyForConsumptionData) => void;

  // Influencer discovery events
  INFLUENCERS_LIST: (data: InfluencersListData) => void;
  INFLUENCER_DETAILS: (data: InfluencerDetailsData) => void;
  INFLUENCER_STATUS_CHANGED: (data: InfluencerStatusChangedData) => void;
  INFLUENCER_WENT_LIVE: (data: InfluencerWentLiveData) => void;
  INFLUENCER_ENDED_STREAM: (data: InfluencerEndedStreamData) => void;
  DISCOVERY_ERROR: (data: DiscoveryErrorData) => void;
}

// Callback response types
export interface CreateStreamCallbackResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface JoinStreamCallbackResponse {
  success: boolean;
  error?: string;
}

export interface PeerReadyForConsumptionData {
  sessionId: string;
  peerId: string;
  timestamp: Date;
}

// ─── Client → Server (incoming) events ───
export interface ClientToServerEvents {
  // Authentication
  authenticate: (data: AuthenticateData) => void;

  // Stream Management
  create_stream: (
    data: CreateStreamData,
    callback: (response: CreateStreamCallbackResponse) => void,
  ) => void;
  join_stream: (
    data: JoinStreamData,
    callback: (response: JoinStreamCallbackResponse) => void,
  ) => void;
  leave_session: (data: LeaveSessionData) => void;
  end_stream: (data: EndStreamData) => void;
  get_stream_session: (data: GetStreamSessionData) => void;
  get_live_streams: () => void;
  update_stream_settings: (data: UpdateStreamSettingsData) => void;

  // Bidding
  place_bid: (data: PlaceBidData) => void;
  accept_bid: (data: AcceptBidData) => void;
  reject_bid: (data: RejectBidData) => void;
  get_stream_bids: (data: GetStreamBidsData) => void;

  // Gifts
  send_gift: (data: SendGiftData) => void;
  get_gift_types: () => void;
  get_stream_gifts: (data: GetStreamGiftsData) => void;

  // WebRTC Signaling
  send_signal: (data: SendSignalData) => void;
  send_ice_candidate: (data: SendIceCandidateData) => void;
  send_offer: (data: SendOfferData) => void;
  send_answer: (data: SendAnswerData) => void;
  webrtc_offer: (data: WebRtcOfferClientData) => void;
  webrtc_answer: (data: WebRtcAnswerClientData) => void;
  ice_candidate: (data: IceCandidateClientData) => void;

  // Chat
  send_message: (data: SendMessageData) => void;

  // MediaSoup Events
  mediasoup_getRouterRtpCapabilities: (
    data: MediaSoupGetRtpCapabilitiesData,
    callback: (response: MediaSoupRtpCapabilitiesResponse) => void,
  ) => void;
  mediasoup_createWebRtcTransport: (
    data: MediaSoupCreateTransportData,
    callback: (response: MediaSoupTransportResponse) => void,
  ) => void;
  mediasoup_connectWebRtcTransport: (
    data: MediaSoupConnectTransportData,
    callback: (response: MediaSoupResponse) => void,
  ) => void;
  mediasoup_createProducer: (
    data: MediaSoupCreateProducerData,
    callback: (response: MediaSoupProducerResponse) => void,
  ) => void;
  mediasoup_createConsumer: (
    data: MediaSoupCreateConsumerData,
    callback: (response: MediaSoupConsumerResponse) => void,
  ) => void;
  mediasoup_pauseConsumer: (
    data: MediaSoupConsumerActionData,
    callback: (response: MediaSoupResponse) => void,
  ) => void;
  mediasoup_resumeConsumer: (
    data: MediaSoupConsumerActionData,
    callback: (response: MediaSoupResponse) => void,
  ) => void;
  mediasoup_closeProducer: (
    data: MediaSoupProducerActionData,
    callback: (response: MediaSoupResponse) => void,
  ) => void;
  mediasoup_pauseProducer: (
    data: MediaSoupProducerActionData,
    callback: (response: MediaSoupResponse) => void,
  ) => void;
  mediasoup_resumeProducer: (
    data: MediaSoupProducerActionData,
    callback: (response: MediaSoupResponse) => void,
  ) => void;
  mediasoup_closeConsumer: (
    data: MediaSoupConsumerActionData,
    callback: (response: MediaSoupResponse) => void,
  ) => void;

  // Utility Events
  update_presence: (data: UpdatePresenceData) => void;
  typing_start: (data: TypingData) => void;
  typing_stop: (data: TypingData) => void;
  ping: (callback: (response: string) => void) => void;
  get_platform_stats: (
    callback: (response: PlatformStatsResponse) => void,
  ) => void;

  get_influencers: (
    data: GetInfluencersData,
    callback?: (response: GetInfluencersResponse) => void,
  ) => void;
  get_influencer_by_username: (
    data: GetInfluencerByUsernameData,
    callback?: (response: GetInfluencerResponse) => void,
  ) => void;
  subscribe_to_influencer_updates: (
    data: SubscribeToInfluencerUpdatesData,
  ) => void;
  unsubscribe_from_influencer_updates: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  authenticatedAt?: Date;
  userName?: string;
  userId?: string;
  sessionId?: string;
}

// ═══════════════════════════════════════════════════════════════
// ─── Event payload interfaces ───
// ═══════════════════════════════════════════════════════════════

// Authentication
export interface AuthenticateData {
  userId: string;
  token?: string;
}

export interface UserConnectedData {
  userId: string;
  socketId: string;
  sessionId?: string;
}

export interface UserDisconnectedData {
  userId: string;
  sessionId: string;
  timestamp: Date;
}

export interface ErrorData {
  message: string;
  code?: string;
  sessionId?: string;
  timestamp: Date;
}

// Stream Management
export interface CreateStreamData {
  allowBids: boolean;
  callRate: string;
}

export interface JoinStreamData {
  sessionId: string;
}

export interface EndStreamData {
  sessionId: string;
}

export interface LeaveSessionData {
  sessionId: string;
}

export interface GetStreamSessionData {
  sessionId: string;
}

export interface UpdateStreamSettingsData {
  sessionId: string;
  allowBids?: boolean;
  callRate?: string;
}

export interface SessionCreatedData {
  sessionId: string;
  streamerId: string;
  title: string;
  createdAt: Date;
  allowBids: boolean;
  callRate: string;
  timestamp: Date;
  influencerId: string;
  status: string;
}

export interface SessionJoinedData {
  sessionId: string;
  userId: string;
  socketId: string;
  participantCount?: number;
}

export interface SessionEndedData {
  sessionId: string;
  reason?: string;
  endedAt: Date;
}

export interface StreamCreatedResponse {
  success: boolean;
  session: any;
}

export interface StreamJoinedResponse {
  success: boolean;
  session?: any;
  participantCount: number;
  userId: string;
  userName: string;
  sessionId: string;
  isOtherUser?: boolean;
  timestamp: Date;
}

export interface StreamEndedResponse {
  success: boolean;
  session: any;
}

export interface StreamSessionResponse {
  success: boolean;
  session?: any;
}

export interface LiveStreamsResponse {
  success: boolean;
  streams: any[];
}

export interface StreamSettingsUpdatedResponse {
  success: boolean;
  session: any;
}

// Bidding
export interface PlaceBidData {
  sessionId: string;
  amount: number;
}

export interface AcceptBidData {
  bidId: string;
}

export interface RejectBidData {
  bidId: string;
}

export interface GetStreamBidsData {
  sessionId: string;
}

export interface BidPlacedData {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName?: string;
  message?: string;
  timestamp: Date;
}

export interface BidAcceptedData {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  streamerId: string;
  acceptedAt: Date;
  bidderName?: string;
  explorerLocation?: string;
  profileImage?: string;
}

export interface BidRejectedData {
  bidId: string;
  sessionId: string;
  bidderId: string;
  reason?: string;
  rejectedAt: Date;
}

export interface NewBidData {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName?: string;
  currentHighestBid?: number;
  timestamp: Date;
  isNewHighest?: boolean;
}

export interface OutbidData {
  sessionId: string;
  previousBidderId: string;
  newHighestBid: number;
  newBidderId: string;
  newBidAmount: number;
  bidId: string;
  timestamp: Date;
}

export interface BidPlacedSuccessResponse {
  success: boolean;
  bid: any;
  message: string;
}

export interface BidPlacedErrorResponse {
  success: boolean;
  message: string;
  code: string;
}

export interface BidAcceptedSuccessResponse {
  success: boolean;
  bid: any;
  message: string;
}

export interface BidRejectedSuccessResponse {
  success: boolean;
  bid: any;
  message: string;
}

export interface StreamBidsResponse {
  success: boolean;
  bids: any[];
}

// Gifts
export interface SendGiftData {
  sessionId: string;
  giftTypeId: string;
  influencerId: string;
  message?: string;
}

export interface GetStreamGiftsData {
  sessionId: string;
}

export interface GiftSentData {
  giftId: string;
  sessionId: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  giftType: string;
  value: number;
  timestamp: Date;
}

export interface GiftSentSuccessResponse {
  success: boolean;
  gift: any;
  paymentIntent: any;
}

export interface GiftTypesResponse {
  success: boolean;
  giftTypes: any[];
}

export interface StreamGiftsResponse {
  success: boolean;
  gifts: any[];
}

// WebRTC Signaling
export interface SendSignalData {
  sessionId: string;
  targetUserId: string;
  signal: any;
  type: string;
}

export interface SendIceCandidateData {
  sessionId: string;
  targetUserId: string;
  candidate: RTCIceCandidate;
}

export interface SendOfferData {
  sessionId: string;
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
}

export interface SendAnswerData {
  sessionId: string;
  targetUserId: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRtcOfferClientData {
  sessionId: string;
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
}

export interface WebRtcAnswerClientData {
  sessionId: string;
  targetUserId: string;
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidateClientData {
  sessionId: string;
  targetUserId: string;
  candidate: RTCIceCandidate;
}

export interface StreamSignalData {
  sessionId: string;
  from: string;
  signal: any;
  type: string;
}

export interface IceCandidateData {
  sessionId: string;
  candidate: RTCIceCandidate;
  from: string;
  to: string;
}

export interface SdpOfferData {
  sessionId: string;
  offer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

export interface SdpAnswerData {
  sessionId: string;
  answer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

export interface WebRtcOfferData {
  sessionId: string;
  offer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

export interface WebRtcAnswerData {
  sessionId: string;
  answer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

// Chat
export interface SendMessageData {
  sessionId: string;
  content: string;
}

export interface NewMessageData {
  messageId: string;
  sessionId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: Date;
}

// Stream Events
export interface StreamErrorData {
  sessionId: string;
  error: string;
  code?: string;
  userId?: string;
  timestamp: Date;
}

export interface ProducerClosedData {
  sessionId: string;
  producerId: string;
  userId: string;
}

export interface NewProducerData {
  sessionId: string;
  producerId: string;
  userId: string;
  kind: 'audio' | 'video';
  timestamp?: Date;
  enhanced?: boolean;
  existing?: boolean;
  attempt?: number;
}

export interface NewProducerRetryData {
  sessionId: string;
  producerId: string;
  userId: string;
  kind: 'audio' | 'video';
  timestamp?: Date;
  enhanced?: boolean;
  retry: boolean;
}

export interface SettingsUpdatedData {
  sessionId: string;
  settings: Record<string, any>;
  updatedBy: string;
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════
// ─── MediaSoup Event Data Interfaces ───
// ═══════════════════════════════════════════════════════════════

export interface MediaSoupGetRtpCapabilitiesData {
  streamId: string;
}

export interface MediaSoupCreateTransportData {
  streamId: string;
  peerId: string;
  direction: 'send' | 'recv';
}

export interface MediaSoupConnectTransportData {
  streamId: string;
  peerId: string;
  transportId: string;
  dtlsParameters: any;
}

export interface MediaSoupCreateProducerData {
  streamId: string;
  peerId: string;
  kind: 'audio' | 'video';
  rtpParameters: any;
}

export interface MediaSoupCreateConsumerData {
  streamId: string;
  peerId: string;
  producerId: string;
  rtpCapabilities: any;
}

export interface MediaSoupConsumerActionData {
  streamId: string;
  peerId: string;
  consumerId: string;
}

export interface MediaSoupProducerActionData {
  streamId: string;
  peerId: string;
  producerId: string;
}

export interface MediaSoupResponse {
  success: boolean;
  error?: string;
}

export interface MediaSoupTransportResponse extends MediaSoupResponse {
  id?: string;
  iceParameters?: any;
  iceCandidates?: any;
  dtlsParameters?: any;
  sctpParameters?: any;
}

export interface MediaSoupProducerResponse extends MediaSoupResponse {
  producerId?: string;
}

export interface MediaSoupConsumerResponse extends MediaSoupResponse {
  id?: string;
  producerId?: string;
  kind?: string;
  rtpParameters?: any;
  type?: string;
  producerPaused?: boolean;
}

export interface MediaSoupRtpCapabilitiesResponse extends MediaSoupResponse {
  rtpCapabilities?: any;
}

// ═══════════════════════════════════════════════════════════════
// ─── Utility Event Data Interfaces ───
// ═══════════════════════════════════════════════════════════════

export interface UpdatePresenceData {
  isOnline: boolean;
}

export interface TypingData {
  sessionId: string;
}

export interface PlatformStatsResponse {
  success: boolean;
  stats?: {
    totalUsers: number;
    activeStreams: number;
    totalConnections: number;
    serverTime: string;
  };
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// ─── Additional Event Data Interfaces ───
// ═══════════════════════════════════════════════════════════════

export interface UserTypingData {
  userId: string;
  sessionId: string;
  isTyping: boolean;
}

export interface UserPresenceUpdatedData {
  userId: string;
  isOnline: boolean;
  timestamp: Date;
}

export interface GetGiftStatisticsData {
  timeframe?: 'day' | 'week' | 'month' | 'year';
}

export interface GiftStatisticsResponse {
  success: boolean;
  data?: {
    timeframe: string;
    totalGifts: number;
    totalValue: number;
    averageValue: number;
    giftsByType: Record<string, { count: number; value: number }>;
    period: {
      from: Date;
      to: Date;
    };
  };
  error?: string;
}

export interface GetUserGiftHistoryData {
  type?: 'sent' | 'received';
}

export interface UserGiftHistoryResponse {
  success: boolean;
  data?: Array<{
    id: string;
    amount: number;
    message?: string;
    createdAt: Date;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
    receiver: {
      id: string;
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
    giftType: {
      id: string;
      name: string;
      imageUrl: string;
      price: number;
    };
    streamSession?: {
      id: string;
      influencer: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  }>;
  error?: string;
}

// Service interfaces for dependency injection
export interface IStreamingService {
  createStreamSession(
    userId: string,
    allowBids: boolean,
    callRate: string,
  ): Promise<any>;
  endStreamSession(sessionId: string): Promise<any>;
  sendGift(data: {
    sessionId: string;
    explorerId: string;
    giftTypeId: string;
    influencerId: string;
    message?: string;
  }): Promise<{ gift: any; paymentIntent: any }>;
  getGiftTypes(): Promise<any[]>;
  getStreamSession(sessionId: string): Promise<any>;
  getLiveStreams(): Promise<any[]>;
  getStreamBids(sessionId: string): Promise<any[]>;
  getStreamGifts(sessionId: string): Promise<any[]>;
  updateStreamSettings(
    sessionId: string,
    settings: { allowBids?: boolean; callRate?: string },
  ): Promise<any>;
  getInfluencerActiveSession(influencerId: string): Promise<any>;
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
}

export interface IPaymentService {
  // Define payment service methods if needed
}

export interface IBidService {
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


export interface GetInfluencersData {
  cursor?: string;
  categories?: string[];
  searchTerm?: string;
  limit?: number;
  onlineOnly?: boolean;
  sessionId?: string;
}

export interface GetInfluencersResponse {
  success: boolean;
  data?: InfluencersListData;
  error?: string;
}

export interface InfluencersListData {
  influencers: any[];
  nextCursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
  sessionId?: string;
  statusBreakdown: {
    live: number;
    online: number;
    offline: number;
    total: number;
  };
  timestamp: Date;
}

export interface GetInfluencerByUsernameData {
  username: string;
}

export interface GetInfluencerResponse {
  success: boolean;
  data?: InfluencerDetailsData;
  error?: string;
}

export interface InfluencerDetailsData {
  influencer: any;
  isLive: boolean;
  currentStreamId?: string;
  timestamp: Date;
}

export interface SubscribeToInfluencerUpdatesData {
  categories?: string[];
  searchTerm?: string;
  influencerIds?: string[]; // Subscribe to specific influencers
}

export interface InfluencerStatusChangedData {
  influencerId: string;
  username?: string;
  status: 'online' | 'offline' | 'live';
  previousStatus: 'online' | 'offline' | 'live';
  timestamp: Date;
}

export interface InfluencerWentLiveData {
  influencerId: string;
  username?: string;
  streamId: string;
  allowBids: boolean;
  callRate: string;
  timestamp: Date;
}

export interface InfluencerEndedStreamData {
  influencerId: string;
  username?: string;
  streamId: string;
  timestamp: Date;
}

export interface DiscoveryErrorData {
  message: string;
  code: string;
  sessionId?: string;
  timestamp: Date;
}
