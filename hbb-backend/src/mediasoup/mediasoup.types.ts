// mediasoup/mediasoup.types.ts - MediaSoup Manager type definitions

export interface MediaSoupTransport {
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
    sctpParameters?: any;
  }
  
  export interface MediaSoupConsumer {
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
    type: 'simple' | 'simulcast' | 'svc' | 'pipe';
    producerPaused: boolean;
  }
  
  export interface MediaSoupProducer {
    id: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
    type: 'simple' | 'simulcast' | 'svc';
    paused: boolean;
  }
  
  export interface MediaSoupRouter {
    id: string;
    rtpCapabilities: any;
  }
  
  export interface MediaSoupWorker {
    pid: number;
    closed: boolean;
  }
  
  export interface IMediasoupManager {
    // Core functionality check
    isMediaSoupAvailable(): boolean;
  
    // Room management
    createStreamRoom(streamId: string): Promise<void>;
    deleteStreamRoom(streamId: string): Promise<void>;
    roomExists(streamId: string): boolean;
  
    // Router capabilities
    getRouterRtpCapabilities(streamId: string): Promise<any>;
  
    // Transport management
    createWebRtcTransport(
      streamId: string,
      peerId: string,
      direction: 'send' | 'recv'
    ): Promise<MediaSoupTransport>;
  
    connectWebRtcTransport(
      streamId: string,
      peerId: string,
      transportId: string,
      dtlsParameters: any
    ): Promise<void>;
  
    // Producer management
    createProducer(
      streamId: string,
      peerId: string,
      kind: 'audio' | 'video',
      rtpParameters: any
    ): Promise<string>;
  
    closeProducer(
      streamId: string,
      peerId: string,
      producerId: string
    ): Promise<void>;
  
    pauseProducer(
      streamId: string,
      peerId: string,
      producerId: string
    ): Promise<void>;
  
    resumeProducer(
      streamId: string,
      peerId: string,
      producerId: string
    ): Promise<void>;
  
    // Consumer management
    createConsumer(
      streamId: string,
      peerId: string,
      producerId: string,
      rtpCapabilities: any
    ): Promise<MediaSoupConsumer>;
  
    pauseConsumer(
      streamId: string,
      peerId: string,
      consumerId: string
    ): Promise<void>;
  
    resumeConsumer(
      streamId: string,
      peerId: string,
      consumerId: string
    ): Promise<void>;
  
    closeConsumer(
      streamId: string,
      peerId: string,
      consumerId: string
    ): Promise<void>;
  
    // Peer management
    removePeer(streamId: string, peerId: string): Promise<void>;
    getPeerProducers(streamId: string, peerId: string): string[];

    // Get stream producers
    getStreamProducers(streamId: string): Array<{
      producerId: string;
      peerId: string;
      kind: 'audio' | 'video';
    }>;
  
    // Statistics and monitoring
    getTransportStats(
      streamId: string,
      peerId: string,
      transportId: string
    ): Promise<any>;
  
    getProducerStats(
      streamId: string,
      peerId: string,
      producerId: string
    ): Promise<any>;
  
    getConsumerStats(
      streamId: string,
      peerId: string,
      consumerId: string
    ): Promise<any>;
  
    // Worker management
    getWorkerLoad(): Promise<{
      workerId: number;
      pid: number;
      cpuUsage: number;
      routerCount: number;
    }[]>;
  
    // Stream events and notifications
    notifyNewProducer(
      streamId: string,
      peerId: string,
      producerId: string,
      kind: 'audio' | 'video'
    ): void;
  
    notifyProducerClosed(
      streamId: string,
      peerId: string,
      producerId: string
    ): void;
  
    notifyPeerDisconnected(
      streamId: string,
      peerId: string
    ): void;
  }
  
  // MediaSoup configuration types
  export interface MediaSoupConfig {
    worker: {
      rtcMinPort: number;
      rtcMaxPort: number;
      logLevel: 'debug' | 'warn' | 'error' | 'none';
      logTags: string[];
    };
    router: {
      mediaCodecs: MediaCodec[];
    };
    webRtcTransport: {
      listenIps: ListenIp[];
      initialAvailableOutgoingBitrate: number;
      minimumAvailableOutgoingBitrate: number;
      maxSctpMessageSize: number;
      enableUdp: boolean;
      enableTcp: boolean;
      preferUdp: boolean;
    };
  }
  
  export interface MediaCodec {
    kind: 'audio' | 'video';
    mimeType: string;
    preferredPayloadType?: number;
    clockRate: number;
    channels?: number;
    parameters?: Record<string, any>;
    rtcpFeedback?: RtcpFeedback[];
  }
  
  export interface RtcpFeedback {
    type: string;
    parameter?: string;
  }
  
  export interface ListenIp {
    ip: string;
    announcedIp?: string;
  }
  
  // Room and peer state types
  export interface StreamRoom {
    id: string;
    router: any; // MediaSoup Router instance
    peers: Map<string, StreamPeer>;
    createdAt: Date;
  }
  
  export interface StreamPeer {
    id: string;
    streamId: string;
    transports: Map<string, any>; // transportId -> Transport
    producers: Map<string, any>; // producerId -> Producer
    consumers: Map<string, any>; // consumerId -> Consumer
    rtpCapabilities?: any;
    joinedAt: Date;
  }
  
  // Event data types for MediaSoup notifications
  export interface ProducerCreatedEvent {
    streamId: string;
    peerId: string;
    producerId: string;
    kind: 'audio' | 'video';
  }
  
  export interface ProducerClosedEvent {
    streamId: string;
    peerId: string;
    producerId: string;
  }
  
  export interface ConsumerCreatedEvent {
    streamId: string;
    peerId: string;
    consumerId: string;
    producerId: string;
    kind: 'audio' | 'video';
  }
  
  export interface ConsumerClosedEvent {
    streamId: string;
    peerId: string;
    consumerId: string;
  }
  
  export interface PeerJoinedEvent {
    streamId: string;
    peerId: string;
  }
  
  export interface PeerLeftEvent {
    streamId: string;
    peerId: string;
  }
  
  // Error types
  export class MediaSoupError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode?: number
    ) {
      super(message);
      this.name = 'MediaSoupError';
    }
  }
  
  export enum MediaSoupErrorCode {
    ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
    PEER_NOT_FOUND = 'PEER_NOT_FOUND',
    TRANSPORT_NOT_FOUND = 'TRANSPORT_NOT_FOUND',
    PRODUCER_NOT_FOUND = 'PRODUCER_NOT_FOUND',
    CONSUMER_NOT_FOUND = 'CONSUMER_NOT_FOUND',
    INVALID_RTP_CAPABILITIES = 'INVALID_RTP_CAPABILITIES',
    INVALID_TRANSPORT_DIRECTION = 'INVALID_TRANSPORT_DIRECTION',
    TRANSPORT_ALREADY_CONNECTED = 'TRANSPORT_ALREADY_CONNECTED',
    PRODUCER_ALREADY_EXISTS = 'PRODUCER_ALREADY_EXISTS',
    CANNOT_CONSUME = 'CANNOT_CONSUME',
    WORKER_ERROR = 'WORKER_ERROR',
    ROUTER_ERROR = 'ROUTER_ERROR',
  }