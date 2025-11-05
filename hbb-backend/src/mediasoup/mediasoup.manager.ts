// mediasoup/mediasoup.manager.ts - Complete Fixed Implementation with Enhanced Producer Creation
import * as mediasoup from 'mediasoup';
import { WebSocketService } from '../websocket/websocket.service';
import os from 'os';
import fs from 'fs';
import path from 'path';
import {
  IMediasoupManager,
  MediaSoupTransport,
  MediaSoupConsumer,
  MediaSoupError,
  MediaSoupErrorCode,
} from './mediasoup.types';
import { getRedisClient } from '../config/redis';

// Type aliases
type Router = mediasoup.types.Router;
type Worker = mediasoup.types.Worker;
type WebRtcTransport = mediasoup.types.WebRtcTransport;
type Producer = mediasoup.types.Producer;
type Consumer = mediasoup.types.Consumer;
type RtpCapabilities = mediasoup.types.RtpCapabilities;
type WorkerLogTag = mediasoup.types.WorkerLogTag;
type DtlsState = mediasoup.types.DtlsState;
type IceState = mediasoup.types.IceState;
type ProducerScore = mediasoup.types.ProducerScore;

// Environment checks
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

interface ConsumerInfo {
  consumer: Consumer;
  producerId: string;
  producerPeerId: string;
  kind: 'audio' | 'video';
  createdAt: Date;
}

interface PeerData {
  id: string;
  sendTransport?: WebRtcTransport;
  recvTransport?: WebRtcTransport;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  consumerInfo: Map<string, ConsumerInfo>;
  producerMetadata: Map<string, { kind: 'audio' | 'video' }>;
  readyForConsumption: boolean; // Enhanced: Track readiness
  lastActivity: number; // Enhanced: Track activity
}

interface StreamRoom {
  router?: Router;
  peers: Map<string, PeerData>;
  createdAt: number; // Enhanced: Track creation time
}

export class MediasoupManager implements IMediasoupManager {
  private workers: Worker[] = [];
  private workerIndex = 0;
  private streamRooms = new Map<string, StreamRoom>();
  private options: {
    numWorkers: number;
    workerSettings: mediasoup.types.WorkerSettings;
    routerOptions: mediasoup.types.RouterOptions;
    webRtcTransportOptions: Partial<mediasoup.types.WebRtcTransportOptions>;
  };
  private webSocketService: WebSocketService | null = null;
  private isInitialized = false;
  private initializationError: Error | null = null;
  private redisClient: any;

  // Enhanced: Performance monitoring
  private stats = {
    totalRooms: 0,
    totalPeers: 0,
    totalProducers: 0,
    totalConsumers: 0,
    failedOperations: 0,
    lastStatsUpdate: 0,
  };

  constructor() {
    this.redisClient = getRedisClient();
    this.options = {
      numWorkers: this.getOptimalWorkerCount(),
      workerSettings: this.getWorkerSettings(),
      routerOptions: this.getRouterOptions(),
      webRtcTransportOptions: this.getProductionWebRtcTransportOptions(),
    };

    // Start periodic stats collection
    setInterval(() => this.updateStats(), 30000); // Every 30 seconds
  }

  // ======================
  // Initialization & Configuration
  // ======================

  private getOptimalWorkerCount(): number {
    const cpuCores = os.cpus().length;
    return isProduction
      ? Math.min(8, Math.max(1, cpuCores))
      : Math.min(4, cpuCores);
  }

  private getWorkerSettings(): mediasoup.types.WorkerSettings {
    const baseSettings: mediasoup.types.WorkerSettings = {
      logLevel: isDevelopment ? 'debug' : 'warn',
      logTags: (isDevelopment
        ? ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
        : ['warn', 'error']) as WorkerLogTag[],
      rtcMinPort: parseInt(
        process.env.MEDIASOUP_MIN_PORT || (isProduction ? '40000' : '10000'),
      ),
      rtcMaxPort: parseInt(
        process.env.MEDIASOUP_MAX_PORT || (isProduction ? '49999' : '59999'),
      ),
    };

    if (!isProduction) return baseSettings;

    const prodSettings = {
      ...baseSettings,
      appData: { workerLabel: 'aws-ecs-worker' },
    };

    // Handle DTLS certificates
    if (process.env.DTLS_CERT_BASE64 && process.env.DTLS_KEY_BASE64) {
      try {
        const tempDir = os.tmpdir();
        const certPath = path.join(tempDir, 'dtls-cert.pem');
        const keyPath = path.join(tempDir, 'dtls-key.pem');

        fs.writeFileSync(
          certPath,
          Buffer.from(process.env.DTLS_CERT_BASE64, 'base64'),
        );
        fs.writeFileSync(
          keyPath,
          Buffer.from(process.env.DTLS_KEY_BASE64, 'base64'),
        );

        return {
          ...prodSettings,
          dtlsCertificateFile: certPath,
          dtlsPrivateKeyFile: keyPath,
        };
      } catch (error) {
        console.error('Error processing base64 DTLS certificates:', error);
      }
    }

    if (process.env.DTLS_CERT_FILE && process.env.DTLS_KEY_FILE) {
      return {
        ...prodSettings,
        dtlsCertificateFile: process.env.DTLS_CERT_FILE,
        dtlsPrivateKeyFile: process.env.DTLS_KEY_FILE,
      };
    }

    console.warn('No DTLS certificates found in production!');
    return prodSettings;
  }

  private getRouterOptions(): mediasoup.types.RouterOptions {
    return {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
          parameters: { 
            minptime: 10, 
            useinbandfec: 1, 
            usedtx: 1,
            stereo: 1,
            spstereo: 1,
          },
          rtcpFeedback: [{ type: 'transport-cc' }, { type: 'nack' }],
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': isProduction ? 1000 : 800,
            'x-google-max-bitrate': isProduction ? 2500 : 2000,
            'x-google-min-bitrate': isProduction ? 200 : 150,
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' },
            { type: 'ccm', parameter: 'fir' },
            { type: 'goog-remb' },
            { type: 'transport-cc' },
          ],
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': isProduction ? 1000 : 800,
            'x-google-max-bitrate': isProduction ? 2500 : 2000,
            'x-google-min-bitrate': isProduction ? 200 : 150,
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' },
            { type: 'ccm', parameter: 'fir' },
            { type: 'goog-remb' },
            { type: 'transport-cc' },
          ],
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'level-asymmetry-allowed': 1,
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'x-google-start-bitrate': isProduction ? 1000 : 800,
            'x-google-max-bitrate': isProduction ? 2500 : 2000,
            'x-google-min-bitrate': isProduction ? 200 : 150,
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' },
            { type: 'ccm', parameter: 'fir' },
            { type: 'goog-remb' },
            { type: 'transport-cc' },
          ],
        },
      ],
    };
  }

  private getProductionWebRtcTransportOptions(): Partial<mediasoup.types.WebRtcTransportOptions> {
    return {
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: isProduction ? 2500000 : 1500000, // Increased for better quality
      maxSctpMessageSize: 262144,
      enableSctp: true,
      numSctpStreams: { OS: 1024, MIS: 1024 },
    };
  }

  public setWebSocketService(webSocketService: WebSocketService): void {
    this.webSocketService = webSocketService;
    console.log('[MediaSoup] WebSocketService injected successfully');
  }

  // ======================
  // Core Functionality
  // ======================

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationError) throw this.initializationError;

    console.log(
      `[MediaSoup] Initializing with ${this.options.numWorkers} workers...`,
    );
    this.debugNetworkConfiguration();

    try {
      if (!mediasoup || typeof mediasoup.createWorker !== 'function') {
        throw new Error('MediaSoup library not available');
      }

      await this.testCodecCompatibility();

      for (let i = 0; i < this.options.numWorkers; i++) {
        const worker = await mediasoup.createWorker({
          ...this.options.workerSettings,
          appData: { ...this.options.workerSettings.appData, workerIndex: i },
        });

        worker.on('died', () => {
          console.error(
            `[MediaSoup] Worker ${i} (pid:${worker.pid}) died, exiting...`,
          );
          setTimeout(() => process.exit(1), 2000);
        });

        const testRouter = await worker.createRouter(
          this.options.routerOptions,
        );
        testRouter.close();

        this.workers.push(worker);
        console.log(`[MediaSoup] Worker ${i} created (pid:${worker.pid})`);
      }

      this.isInitialized = true;
      console.log('[MediaSoup] Initialization completed successfully');
    } catch (error) {
      this.initializationError = error as Error;
      console.error('[MediaSoup] Failed to initialize:', error);
      await this.cleanupWorkers();
      throw new MediaSoupError(
        `Initialization failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        MediaSoupErrorCode.WORKER_ERROR,
      );
    }
  }

  private async testCodecCompatibility(): Promise<void> {
    console.log('[MediaSoup] Testing codec compatibility...');
    const testWorker = await mediasoup.createWorker({
      logLevel: 'error',
      rtcMinPort: 10000,
      rtcMaxPort: 10010,
    });

    try {
      const testRouter = await testWorker.createRouter(
        this.options.routerOptions,
      );
      testRouter.close();
      console.log('[MediaSoup] Codec compatibility test passed');
    } catch (error) {
      console.error('[MediaSoup] Codec compatibility test failed:', error);
      throw new Error(
        `Invalid codec configuration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      testWorker.close();
    }
  }

  public debugNetworkConfiguration(): void {
    const announcedIp = this.getAnnouncedIp();

    console.log('[MediaSoup] Network Configuration:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`- Announced IP: ${announcedIp}`);
    console.log(
      `- MEDIASOUP_ANNOUNCED_IP: ${
        process.env.MEDIASOUP_ANNOUNCED_IP || 'not set'
      }`,
    );
    console.log(
      `- Port Range: ${this.options.workerSettings.rtcMinPort}-${this.options.workerSettings.rtcMaxPort}`,
    );
    console.log(`- Production Mode: ${isProduction}`);
    console.log(`- Workers: ${this.options.numWorkers}`);

    try {
      const nets = os.networkInterfaces();
      console.log('- Network Interfaces:');
      Object.entries(nets).forEach(([name, addresses]) => {
        (addresses as any[]).forEach((addr) => {
          console.log(
            `  ${name}: ${addr.address} (${addr.family}, ${
              addr.internal ? 'internal' : 'external'
            })`,
          );
        });
      });
    } catch (error) {
      console.error('- Could not get network interfaces:', error);
    }
  }

  private getAnnouncedIp(): string {
    if (process.env.MEDIASOUP_ANNOUNCED_IP) {
      return process.env.MEDIASOUP_ANNOUNCED_IP;
    }
    if (isProduction) {
      return '54.86.45.7'; // Fallback NLB IP
    }
    return '127.0.0.1';
  }

  isMediaSoupAvailable(): boolean {
    return (
      this.isInitialized && this.workers.length > 0 && !this.initializationError
    );
  }

  // ======================
  // Room Management
  // ======================

  roomExists(streamId: string): boolean {
    return this.streamRooms.has(streamId);
  }

  async createStreamRoom(streamId: string): Promise<void> {
    if (!this.isMediaSoupAvailable()) {
      throw new MediaSoupError(
        'MediaSoup not available',
        MediaSoupErrorCode.WORKER_ERROR,
      );
    }

    if (this.streamRooms.has(streamId)) {
      console.log(`[MediaSoup] Cleaning up existing room ${streamId}`);
      await this.closeStreamRoom(streamId);
    }

    try {
      const worker = this.getNextWorker();
      const router = await worker.createRouter(this.options.routerOptions);

      this.streamRooms.set(streamId, { 
        router, 
        peers: new Map(),
        createdAt: Date.now() 
      });
      
      await this.redisClient.set(
        `room:${streamId}`,
        JSON.stringify({ workerIndex: this.workerIndex }),
        'EX',
        3600,
      );

      this.stats.totalRooms++;
      console.log(`[MediaSoup] Created stream room ${streamId}`);
    } catch (error) {
      console.error(`[MediaSoup] Failed to create room ${streamId}:`, error);
      this.stats.failedOperations++;
      throw new MediaSoupError(
        `Failed to create room: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        MediaSoupErrorCode.ROUTER_ERROR,
      );
    }
  }

  async deleteStreamRoom(streamId: string): Promise<void> {
    return this.closeStreamRoom(streamId);
  }

  async closeStreamRoom(streamId: string): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room) return;

    try {
      // Close all peer resources
      for (const peer of room.peers.values()) {
        if (peer.sendTransport && !peer.sendTransport.closed)
          peer.sendTransport.close();
        if (peer.recvTransport && !peer.recvTransport.closed)
          peer.recvTransport.close();

        for (const producer of peer.producers.values()) {
          if (!producer.closed) producer.close();
        }
        for (const consumer of peer.consumers.values()) {
          if (!consumer.closed) consumer.close();
        }
      }

      // Close router
      if (room.router && !room.router.closed) {
        room.router.close();
      }

      // Cleanup
      this.streamRooms.delete(streamId);
      await this.redisClient.del(`room:${streamId}`);
      await this.redisClient.del(`producers:${streamId}`);

      console.log(`[MediaSoup] Closed stream room ${streamId}`);
    } catch (error) {
      console.error(`[MediaSoup] Error closing room ${streamId}:`, error);
      this.stats.failedOperations++;
    }
  }

  async getRouterRtpCapabilities(
    streamId: string,
  ): Promise<RtpCapabilities | null> {
    if (!this.isMediaSoupAvailable()) {
      console.warn(
        '[MediaSoup] Not available, cannot provide RTP capabilities',
      );
      return null;
    }

    try {
      const room = this.streamRooms.get(streamId);
      if (!room || !room.router) {
        await this.createStreamRoom(streamId);
        return this.streamRooms.get(streamId)?.router?.rtpCapabilities || null;
      }
      return room.router.rtpCapabilities;
    } catch (error) {
      console.error(
        `[MediaSoup] Error getting RTP capabilities for ${streamId}:`,
        error,
      );
      this.stats.failedOperations++;
      return null;
    }
  }

  // ======================
  // Transport Management
  // ======================

  async createWebRtcTransport(
    streamId: string,
    peerId: string,
    direction: 'send' | 'recv',
  ): Promise<MediaSoupTransport> {
    console.log(
      `[MediaSoup] Creating ${direction} transport for ${peerId} in ${streamId}`,
    );

    if (!this.isMediaSoupAvailable()) {
      throw new MediaSoupError(
        'MediaSoup not available',
        MediaSoupErrorCode.WORKER_ERROR,
      );
    }

    try {
      let room = this.streamRooms.get(streamId);
      if (!room || !room.router) {
        await this.createStreamRoom(streamId);
        room = this.streamRooms.get(streamId);
        if (!room || !room.router) {
          throw new MediaSoupError(
            `Failed to create room ${streamId}`,
            MediaSoupErrorCode.ROOM_NOT_FOUND,
          );
        }
      }

      let peer = room.peers.get(peerId);
      if (!peer) {
        peer = {
          id: peerId,
          producers: new Map(),
          consumers: new Map(),
          consumerInfo: new Map(),
          producerMetadata: new Map(),
          readyForConsumption: false,
          lastActivity: Date.now(),
        };
        room.peers.set(peerId, peer);
        this.stats.totalPeers++;
      }

      // Enhanced: Update peer activity
      peer.lastActivity = Date.now();

      // Reuse existing transport if available
      const existingTransport =
        direction === 'send' ? peer.sendTransport : peer.recvTransport;
      if (existingTransport && !existingTransport.closed) {
        console.log(
          `[MediaSoup] Reusing existing ${direction} transport for ${peerId}`,
        );
        return {
          id: existingTransport.id,
          iceParameters: existingTransport.iceParameters,
          iceCandidates: existingTransport.iceCandidates,
          dtlsParameters: existingTransport.dtlsParameters,
          sctpParameters: existingTransport.sctpParameters,
        };
      }

      // Create new transport
      const transport = await room.router.createWebRtcTransport({
        ...this.getWebRtcTransportOptions(),
        appData: { streamId, peerId, direction, createdAt: new Date() },
      });

      // Store transport
      if (direction === 'send') {
        if (peer.sendTransport && !peer.sendTransport.closed)
          peer.sendTransport.close();
        peer.sendTransport = transport;
      } else {
        if (peer.recvTransport && !peer.recvTransport.closed)
          peer.recvTransport.close();
        peer.recvTransport = transport;
      }

      // Setup event listeners
      transport.on('dtlsstatechange', (dtlsState: DtlsState) => {
        console.log(
          `[MediaSoup] Transport ${transport.id} DTLS state: ${dtlsState}`,
        );
        if (dtlsState === 'failed' || dtlsState === 'closed') {
          this.cleanupTransport(streamId, peerId, transport.id, direction);
        }
      });

      transport.on('@close', () => {
        this.cleanupTransport(streamId, peerId, transport.id, direction);
      });

      console.log(
        `[MediaSoup] Created ${direction} transport ${transport.id} for ${peerId}`,
      );

      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters,
      };
    } catch (error) {
      console.error(
        `[MediaSoup] Error creating ${direction} transport:`,
        error,
      );
      this.stats.failedOperations++;
      throw new MediaSoupError(
        `Failed to create transport: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        MediaSoupErrorCode.TRANSPORT_NOT_FOUND,
      );
    }
  }

  private getWebRtcTransportOptions(): mediasoup.types.WebRtcTransportOptions {
    const announcedIp = this.getAnnouncedIp();
    return {
      listenInfos: [
        { protocol: 'udp', ip: '0.0.0.0', announcedAddress: announcedIp },
        { protocol: 'tcp', ip: '0.0.0.0', announcedAddress: announcedIp },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: isProduction ? 2500000 : 1500000, // Increased for simulcast
      maxSctpMessageSize: 262144,
      enableSctp: true,
      numSctpStreams: { OS: 1024, MIS: 1024 },
    };
  }

  async connectWebRtcTransport(
    streamId: string,
    peerId: string,
    transportId: string,
    dtlsParameters: any,
  ): Promise<void> {
    console.log(
      `[MediaSoup] Connecting transport ${transportId} for ${peerId}`,
    );

    try {
      const room = this.streamRooms.get(streamId);
      if (!room)
        throw new MediaSoupError(
          `Room ${streamId} not found`,
          MediaSoupErrorCode.ROOM_NOT_FOUND,
        );

      const peer = room.peers.get(peerId);
      if (!peer)
        throw new MediaSoupError(
          `Peer ${peerId} not found`,
          MediaSoupErrorCode.PEER_NOT_FOUND,
        );

      // Enhanced: Update peer activity
      peer.lastActivity = Date.now();

      const transport =
        peer.sendTransport?.id === transportId
          ? peer.sendTransport
          : peer.recvTransport?.id === transportId
          ? peer.recvTransport
          : null;

      if (!transport)
        throw new MediaSoupError(
          `Transport ${transportId} not found`,
          MediaSoupErrorCode.TRANSPORT_NOT_FOUND,
        );
      if (transport.closed)
        throw new MediaSoupError(
          `Transport ${transportId} is closed`,
          MediaSoupErrorCode.TRANSPORT_NOT_FOUND,
        );

      // Add timeout for connection
      const connectPromise = transport.connect({ dtlsParameters });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Connection timeout after 30s')),
          30000,
        );
      });

      await Promise.race([connectPromise, timeoutPromise]);
      
      // Enhanced: Mark peer as ready for consumption when recv transport connects
      if (peer.recvTransport?.id === transportId) {
        peer.readyForConsumption = true;
        console.log(`[MediaSoup] Peer ${peerId} marked ready for consumption`);
        
        // Notify WebSocket service
        if (this.webSocketService) {
          this.webSocketService.notifyPeerReadyForConsumption(streamId, peerId);
        }
      }

      // Enhanced: Setup transport-level bandwidth monitoring and adaptation
      if (transport && (peer.sendTransport?.id === transportId || peer.recvTransport?.id === transportId)) {
        const transportDirection = peer.sendTransport?.id === transportId ? 'send' : 'recv';
        this.setupTransportBandwidthMonitoring(transport, streamId, peerId, transportDirection);
      }
      
      console.log(
        `[MediaSoup] Transport ${transportId} connected successfully`,
      );
    } catch (error) {
      console.error(
        `[MediaSoup] Error connecting transport ${transportId}:`,
        error,
      );
      this.stats.failedOperations++;
      throw new MediaSoupError(
        `Failed to connect transport: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        MediaSoupErrorCode.TRANSPORT_NOT_FOUND,
      );
    }
  }

  // ======================
  // Enhanced Producer Management
  // ======================

  async createProducer(
    streamId: string,
    peerId: string,
    kind: 'audio' | 'video',
    rtpParameters: any,
  ): Promise<string> {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        console.log(
          `🎬 [MediaSoup] Creating ${kind} producer for ${peerId} in room ${streamId} (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`,
        );

        // Validate MediaSoup availability
        if (!this.isMediaSoupAvailable()) {
          throw new MediaSoupError(
            'MediaSoup not available',
            MediaSoupErrorCode.WORKER_ERROR,
          );
        }

        // Get and validate room
        const room = this.streamRooms.get(streamId);
        if (!room) {
          throw new MediaSoupError(
            `Room ${streamId} not found`,
            MediaSoupErrorCode.ROOM_NOT_FOUND,
          );
        }

        // Enhanced: Log room state for debugging
        console.log(`📊 [MediaSoup] Room ${streamId} state:`, {
          hasRouter: !!room.router,
          routerClosed: room.router?.closed,
          totalPeers: room.peers.size,
          peerIds: Array.from(room.peers.keys()),
        });

        // Validate router
        if (!room.router || room.router.closed) {
          throw new MediaSoupError(
            `Router for room ${streamId} is not available or closed`,
            MediaSoupErrorCode.ROUTER_ERROR,
          );
        }

        // Get and validate peer
        const peer = room.peers.get(peerId);
        if (!peer) {
          throw new MediaSoupError(
            `Peer ${peerId} not found in room ${streamId}`,
            MediaSoupErrorCode.PEER_NOT_FOUND,
          );
        }

        // Enhanced: Update peer activity
        peer.lastActivity = Date.now();

        // Enhanced: Log peer state for debugging
        console.log(`👤 [MediaSoup] Peer ${peerId} state:`, {
          hasSendTransport: !!peer.sendTransport,
          sendTransportId: peer.sendTransport?.id,
          sendTransportClosed: peer.sendTransport?.closed,
          hasRecvTransport: !!peer.recvTransport,
          recvTransportId: peer.recvTransport?.id,
          existingProducers: Array.from(peer.producers.keys()),
          existingProducerDetails: Array.from(
            peer.producerMetadata.entries(),
          ).map(([id, meta]) => ({ id, kind: meta.kind })),
          readyForConsumption: peer.readyForConsumption,
        });

        // Validate send transport
        if (!peer.sendTransport) {
          throw new MediaSoupError(
            `Send transport not found for peer ${peerId}`,
            MediaSoupErrorCode.TRANSPORT_NOT_FOUND,
          );
        }

        if (peer.sendTransport.closed) {
          throw new MediaSoupError(
            `Send transport is closed for peer ${peerId}`,
            MediaSoupErrorCode.TRANSPORT_NOT_FOUND,
          );
        }

        // Enhanced: Log transport state with better debugging
        const transportId = peer.sendTransport.id;
        const dtlsState = peer.sendTransport.dtlsState;
        const iceState = peer.sendTransport.iceState;

        console.log(`🚛 [MediaSoup] Transport ${transportId} state:`, {
          dtlsState,
          iceState,
          closed: peer.sendTransport.closed,
          appData: peer.sendTransport.appData,
        });

        // Enhanced: Wait for transport to be connected with better state checking
        if (dtlsState !== 'connected') {
          console.log(
            `⏳ [MediaSoup] Waiting for transport ${transportId} to connect (current DTLS state: ${dtlsState})`,
          );

          // Define timeout and polling interval
          const maxWaitTime = 15000; // 15 seconds
          const pollInterval = 100; // 100ms
          let waitTime = 0;

          while (
            peer.sendTransport.dtlsState !== 'connected' &&
            waitTime < maxWaitTime &&
            !peer.sendTransport.closed
          ) {
            // Check for failure states
            if (
              peer.sendTransport.dtlsState === 'failed' ||
              peer.sendTransport.dtlsState === 'closed' ||
              peer.sendTransport.closed
            ) {
              throw new Error(
                `Transport connection failed: DTLS=${peer.sendTransport.dtlsState}, closed=${peer.sendTransport.closed}`,
              );
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            waitTime += pollInterval;

            // Log progress every second
            if (waitTime % 1000 === 0) {
              console.log(
                `⏳ [MediaSoup] Still waiting... ${waitTime / 1000}s (DTLS: ${
                  peer.sendTransport.dtlsState
                }, ICE: ${peer.sendTransport.iceState})`,
              );
            }
          }

          // Final state check
          if (peer.sendTransport.dtlsState !== 'connected') {
            throw new Error(
              `Transport failed to connect after ${maxWaitTime / 1000}s: DTLS=${
                peer.sendTransport.dtlsState
              }`,
            );
          }

          console.log(
            `✅ [MediaSoup] Transport ${transportId} connected after ${waitTime}ms`,
          );
        }

        // Enhanced: Check for existing producer of the same kind and close it
        for (const [existingProducerId, existingProducer] of peer.producers) {
          const metadata = peer.producerMetadata.get(existingProducerId);
          if (metadata?.kind === kind && !existingProducer.closed) {
            console.log(
              `🔄 [MediaSoup] Closing existing ${kind} producer ${existingProducerId}`,
            );

            existingProducer.close();
            peer.producers.delete(existingProducerId);
            peer.producerMetadata.delete(existingProducerId);

            // Remove from Redis
            await this.redisClient.hDel(
              `producers:${streamId}`,
              existingProducerId,
            );

            // Notify about closed producer
            this.notifyProducerClosed(streamId, peerId, existingProducerId);
          }
        }

        // Enhanced: Optimize RTP parameters for better compatibility
        const optimizedRtpParameters = this.optimizeRtpParameters(
          rtpParameters,
          kind,
        );

        console.log(
          `🔧 [MediaSoup] Creating ${kind} producer with RTP parameters:`,
          {
            codecs: optimizedRtpParameters.codecs?.map((c: any) => ({
              mimeType: c.mimeType,
              payloadType: c.payloadType,
              clockRate: c.clockRate,
              parameters: c.parameters,
            })),
            encodings: optimizedRtpParameters.encodings,
          },
        );

        // Enhanced: Create the producer with better error handling
        const producer = await peer.sendTransport.produce({
          kind,
          rtpParameters: optimizedRtpParameters,
          paused: false,
          keyFrameRequestDelay: 5000,
          appData: {
            streamId,
            peerId,
            kind,
            createdAt: new Date().toISOString(),
            attempt: retryCount + 1,
          },
        });

        if (!producer) {
          throw new Error('Failed to create producer - null response');
        }

        console.log(`✅ [MediaSoup] ${kind} producer created successfully:`, {
          id: producer.id,
          kind: producer.kind,
          paused: producer.paused,
          score: producer.score,
          appData: producer.appData,
        });

        // Enhanced: Store producer and metadata
        peer.producers.set(producer.id, producer);
        peer.producerMetadata.set(producer.id, { kind });
        this.stats.totalProducers++;

        // Enhanced: Store in Redis for persistence
        try {
          await this.redisClient.hSet(
            `producers:${streamId}`,
            producer.id,
            JSON.stringify({
              peerId,
              kind,
              createdAt: new Date().toISOString(),
              rtpParameters: {
                codecs: optimizedRtpParameters.codecs,
                headerExtensions: optimizedRtpParameters.headerExtensions,
              },
            }),
          );
          console.log(`💾 [MediaSoup] Producer ${producer.id} stored in Redis`);
        } catch (redisError) {
          console.error(
            `❌ [MediaSoup] Failed to store producer in Redis:`,
            redisError,
          );
          // Continue even if Redis fails
        }

        // Enhanced: Set up comprehensive event listeners
        producer.on('transportclose', () => {
          console.log(
            `🚛 [MediaSoup] Transport closed for producer ${producer.id}`,
          );
          peer.producers.delete(producer.id);
          peer.producerMetadata.delete(producer.id);
          this.notifyProducerClosed(streamId, peerId, producer.id);
        });

        producer.on('@close', () => {
          console.log(`🔚 [MediaSoup] Producer ${producer.id} closed`);
          peer.producers.delete(producer.id);
          peer.producerMetadata.delete(producer.id);
          this.notifyProducerClosed(streamId, peerId, producer.id);
        });

        // Enhanced: Monitor video quality for video producers
        if (kind === 'video') {
          producer.on('score', (scores: ProducerScore[]) => {
            const avgScore =
              scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

            if (avgScore < 5) {
              console.warn(
                `⚠️ [MediaSoup] Low video quality for producer ${producer.id}:`,
                {
                  scores: scores.map((s) => ({
                    encodingIdx: s.encodingIdx,
                    score: s.score,
                    rid: s.rid,
                  })),
                  avgScore,
                },
              );
            }
          });

          producer.on('videoorientationchange', (videoOrientation: any) => {
            console.log(
              `📐 [MediaSoup] Video orientation changed for producer ${producer.id}:`,
              videoOrientation,
            );
          });
        }

        // Enhanced: Enable comprehensive stats collection
        producer.enableTraceEvent(['rtp', 'keyframe', 'nack', 'pli', 'fir']);

        producer.on('trace', (trace: any) => {
          if (
            trace.type === 'keyframe' ||
            trace.type === 'pli' ||
            trace.type === 'fir'
          ) {
            console.log(
              `📊 [MediaSoup] Producer ${producer.id} trace event:`,
              trace.type,
            );
          }
        });

        // Enhanced: Notify other peers using the WebSocket service's enhanced notification
        console.log(
          `📢 [MediaSoup] Notifying peers about new ${kind} producer ${producer.id}`,
        );
        
        if (this.webSocketService) {
          // Use enhanced notification that handles sequencing
          this.webSocketService.notifyNewProducerEnhanced(
            streamId, 
            peerId, 
            producer.id, 
            kind
          );
        } else {
          // Fallback to basic notification
          this.notifyNewProducer(streamId, peerId, producer.id, kind);
        }

        // Enhanced: Log final room state
        const finalRoomState = {
          totalPeers: room.peers.size,
          totalProducers: Array.from(room.peers.values()).reduce(
            (sum, p) => sum + p.producers.size,
            0,
          ),
          peerProducers: Array.from(room.peers.entries()).map(([id, p]) => ({
            peerId: id,
            producers: Array.from(p.producers.keys()),
            readyForConsumption: p.readyForConsumption,
          })),
        };

        console.log(
          `📊 [MediaSoup] Room ${streamId} state after producer creation:`,
          finalRoomState,
        );

        // Success - return producer ID
        return producer.id;
      } catch (error) {
        retryCount++;

        console.error(
          `❌ [MediaSoup] Error creating ${kind} producer (attempt ${retryCount}/${MAX_RETRIES}):`,
          {
            error: error instanceof Error ? error.message : error,
            streamId,
            peerId,
            kind,
            stack: error instanceof Error ? error.stack : undefined,
          },
        );

        this.stats.failedOperations++;

        if (retryCount >= MAX_RETRIES) {
          // Log detailed failure information
          console.error(
            `❌ [MediaSoup] Failed to create ${kind} producer after ${MAX_RETRIES} attempts`,
            {
              streamId,
              peerId,
              kind,
              error: error instanceof Error ? error.message : error,
            },
          );

          throw new MediaSoupError(
            `Failed after ${MAX_RETRIES} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            MediaSoupErrorCode.PRODUCER_NOT_FOUND,
          );
        }

        // Enhanced: Exponential backoff between retries
        const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(
          `⏳ [MediaSoup] Waiting ${waitTime}ms before retry ${
            retryCount + 1
          }...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // Check if we should continue retrying
        if (!this.isMediaSoupAvailable()) {
          throw new MediaSoupError(
            'MediaSoup no longer available',
            MediaSoupErrorCode.WORKER_ERROR,
          );
        }
      }
    }

    // Should never reach here
    throw new MediaSoupError(
      'Failed to create producer after all retries',
      MediaSoupErrorCode.PRODUCER_NOT_FOUND,
    );
  }

  private optimizeRtpParameters(
    rtpParameters: any,
    kind: 'audio' | 'video',
  ): any {
    const optimized = JSON.parse(JSON.stringify(rtpParameters));

    if (kind === 'video') {
      if (optimized.codecs) {
        optimized.codecs.forEach((codec: any) => {
          const mimeType = codec.mimeType.toLowerCase();
          if (mimeType.includes('vp9')) {
            // VP9: Best compression, highest quality
            codec.parameters = {
              ...codec.parameters,
              'x-google-start-bitrate': isProduction ? 1000 : 800,
              'x-google-max-bitrate': isProduction ? 2500 : 2000,
              'x-google-min-bitrate': isProduction ? 200 : 150,
            };
          } else if (mimeType.includes('vp8')) {
            codec.parameters = {
              ...codec.parameters,
              'x-google-start-bitrate': isProduction ? 1000 : 800,
              'x-google-max-bitrate': isProduction ? 2500 : 2000,
              'x-google-min-bitrate': isProduction ? 200 : 150,
            };
          } else if (mimeType.includes('h264')) {
            codec.parameters = {
              ...codec.parameters,
              'level-asymmetry-allowed': 1,
              'packetization-mode': 1,
              'profile-level-id': '42e01f',
              'x-google-start-bitrate': isProduction ? 1000 : 800,
              'x-google-max-bitrate': isProduction ? 2500 : 2000,
              'x-google-min-bitrate': isProduction ? 200 : 150,
            };
          }
        });
      }

      // Enhanced: Optimize encodings for simulcast with proper layer configuration
      if (optimized.encodings && Array.isArray(optimized.encodings)) {
        // Check if simulcast is already configured (has rid)
        const hasSimulcast = optimized.encodings.some((e: any) => e.rid);
        
        if (hasSimulcast) {
          // Preserve simulcast structure, just optimize bitrates
          optimized.encodings = optimized.encodings.map(
            (encoding: any) => {
              const rid = encoding.rid || '';
              let maxBitrate: number;
              
              // Determine bitrate based on RID or layer position
              if (rid.includes('r0') || rid === 'q') {
                // Low quality layer
                maxBitrate = isProduction ? 200000 : 150000;
              } else if (rid.includes('r1') || rid === 'h') {
                // Medium quality layer
                maxBitrate = isProduction ? 600000 : 500000;
              } else {
                // High quality layer (r2, f, or default)
                maxBitrate = isProduction ? 1800000 : 1500000;
              }
              
              return {
                ...encoding,
                maxBitrate: encoding.maxBitrate || maxBitrate,
                active: encoding.active !== undefined ? encoding.active : true,
              };
            },
          );
        } else {
          // No simulcast - optimize single encoding
          optimized.encodings = optimized.encodings.map(
            (encoding: any, index: number) => ({
              ...encoding,
              scalabilityMode: encoding.scalabilityMode || 'L1T1',
              maxBitrate: encoding.maxBitrate || (isProduction ? 1500000 : 1200000),
              active: encoding.active !== undefined ? encoding.active : true,
            }),
          );
        }
      }
    }

    return optimized;
  }

  async closeProducer(
    streamId: string,
    peerId: string,
    producerId: string,
  ): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const producer = peer.producers.get(producerId);
    if (!producer)
      throw new MediaSoupError(
        `Producer ${producerId} not found`,
        MediaSoupErrorCode.PRODUCER_NOT_FOUND,
      );

    producer.close();
    peer.producers.delete(producerId);
    peer.producerMetadata.delete(producerId);
    await this.redisClient.hDel(`producers:${streamId}`, producerId);
    this.notifyProducerClosed(streamId, peerId, producerId);

    console.log(`[MediaSoup] Closed producer ${producerId} for ${peerId}`);
  }

  async pauseProducer(
    streamId: string,
    peerId: string,
    producerId: string,
  ): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const producer = peer.producers.get(producerId);
    if (!producer)
      throw new MediaSoupError(
        `Producer ${producerId} not found`,
        MediaSoupErrorCode.PRODUCER_NOT_FOUND,
      );

    await producer.pause();
    console.log(`[MediaSoup] Paused producer ${producerId} for ${peerId}`);
  }

  async resumeProducer(
    streamId: string,
    peerId: string,
    producerId: string,
  ): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const producer = peer.producers.get(producerId);
    if (!producer)
      throw new MediaSoupError(
        `Producer ${producerId} not found`,
        MediaSoupErrorCode.PRODUCER_NOT_FOUND,
      );

    await producer.resume();
    console.log(`[MediaSoup] Resumed producer ${producerId} for ${peerId}`);
  }

  // ======================
  // Enhanced Consumer Management
  // ======================

  async createConsumer(
    streamId: string,
    consumerPeerId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ): Promise<MediaSoupConsumer> {
    console.log(
      `[MediaSoup] Creating consumer for ${consumerPeerId} to consume ${producerId}`,
    );

    const room = this.streamRooms.get(streamId);
    if (!room || !room.router) {
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );
    }

    const consumerPeer = room.peers.get(consumerPeerId);
    if (!consumerPeer || !consumerPeer.recvTransport) {
      throw new MediaSoupError(
        `Peer ${consumerPeerId} or transport not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );
    }

    // Enhanced: Update peer activity
    consumerPeer.lastActivity = Date.now();

    // Find producer and its peer
    let producer: Producer | undefined;
    let producerPeerId: string | undefined;
    for (const [pId, peer] of room.peers.entries()) {
      producer = peer.producers.get(producerId);
      if (producer) {
        producerPeerId = pId;
        break;
      }
    }

    if (!producer || !producerPeerId) {
      throw new MediaSoupError(
        `Producer ${producerId} not found`,
        MediaSoupErrorCode.PRODUCER_NOT_FOUND,
      );
    }

    // Enhanced: Check for existing consumer with better deduplication
    for (const [id, info] of consumerPeer.consumerInfo || new Map()) {
      if (
        info.producerId === producerId &&
        info.producerPeerId === producerPeerId
      ) {
        const existing = consumerPeer.consumers.get(id);
        if (existing && !existing.closed) {
          console.log(
            `[MediaSoup] Reusing existing consumer for ${producerId}`,
          );
          return {
            id: existing.id,
            producerId: existing.producerId,
            kind: existing.kind,
            rtpParameters: existing.rtpParameters,
            type: existing.type,
            producerPaused: existing.producerPaused,
          };
        }
      }
    }

    // Enhanced: Verify consumption is possible with better validation
    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new MediaSoupError(
        `Cannot consume producer ${producerId} - RTP capabilities mismatch`,
        MediaSoupErrorCode.CANNOT_CONSUME,
      );
    }

    try {
      const consumer = await consumerPeer.recvTransport.consume({
        producerId,
        rtpCapabilities,
        paused: false,
      });

      if (!consumer) throw new Error('Failed to create consumer');

      // Enhanced: Store consumer with comprehensive metadata
      consumerPeer.consumers.set(consumer.id, consumer);
      if (!consumerPeer.consumerInfo) consumerPeer.consumerInfo = new Map();
      consumerPeer.consumerInfo.set(consumer.id, {
        consumer,
        producerId,
        producerPeerId,
        kind: consumer.kind as 'audio' | 'video',
        createdAt: new Date(),
      });

      this.stats.totalConsumers++;

      // Enhanced: Setup comprehensive event listeners
      consumer.on('transportclose', () => {
        consumer.close();
        consumerPeer.consumers.delete(consumer.id);
        consumerPeer.consumerInfo?.delete(consumer.id);
        console.log(`[MediaSoup] Consumer ${consumer.id} transport closed`);
      });

      consumer.on('producerclose', () => {
        consumer.close();
        consumerPeer.consumers.delete(consumer.id);
        consumerPeer.consumerInfo?.delete(consumer.id);
        this.notifyProducerClosed(streamId, consumerPeerId, producerId);
        console.log(`[MediaSoup] Consumer ${consumer.id} producer closed`);
      });

      consumer.on('producerpause', () => {
        console.log(`[MediaSoup] Consumer ${consumer.id} producer paused`);
      });

      consumer.on('producerresume', () => {
        console.log(`[MediaSoup] Consumer ${consumer.id} producer resumed`);
      });

      // Enhanced: Enable stats collection for consumers
      consumer.enableTraceEvent(['rtp', 'pli', 'fir']);

      consumer.on('trace', (trace: any) => {
        if (trace.type === 'pli' || trace.type === 'fir') {
          console.log(
            `📊 [MediaSoup] Consumer ${consumer.id} trace event:`,
            trace.type,
          );
        }
      });

      console.log(
        `✅ [MediaSoup] Consumer created ${consumer.id} for ${consumerPeerId}`,
      );

      return {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      };
    } catch (error) {
      console.error(`[MediaSoup] Error creating consumer:`, error);
      this.stats.failedOperations++;
      throw new MediaSoupError(
        `Failed to create consumer: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        MediaSoupErrorCode.CONSUMER_NOT_FOUND,
      );
    }
  }

  async pauseConsumer(
    streamId: string,
    peerId: string,
    consumerId: string,
  ): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const consumer = peer.consumers.get(consumerId);
    if (!consumer)
      throw new MediaSoupError(
        `Consumer ${consumerId} not found`,
        MediaSoupErrorCode.CONSUMER_NOT_FOUND,
      );

    await consumer.pause();
    console.log(`[MediaSoup] Paused consumer ${consumerId} for ${peerId}`);
  }

  async resumeConsumer(
    streamId: string,
    peerId: string,
    consumerId: string,
  ): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const consumer = peer.consumers.get(consumerId);
    if (!consumer)
      throw new MediaSoupError(
        `Consumer ${consumerId} not found`,
        MediaSoupErrorCode.CONSUMER_NOT_FOUND,
      );

    await consumer.resume();
    console.log(`[MediaSoup] Resumed consumer ${consumerId} for ${peerId}`);
  }

  async closeConsumer(
    streamId: string,
    peerId: string,
    consumerId: string,
  ): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const consumer = peer.consumers.get(consumerId);
    if (!consumer)
      throw new MediaSoupError(
        `Consumer ${consumerId} not found`,
        MediaSoupErrorCode.CONSUMER_NOT_FOUND,
      );

    consumer.close();
    peer.consumers.delete(consumerId);
    peer.consumerInfo?.delete(consumerId);
    console.log(`[MediaSoup] Closed consumer ${consumerId} for ${peerId}`);
  }

  // ======================
  // Enhanced Peer Management
  // ======================

  async removePeer(streamId: string, peerId: string): Promise<void> {
    const room = this.streamRooms.get(streamId);
    if (!room) return;

    const peer = room.peers.get(peerId);
    if (!peer) return;

    try {
      console.log(`🧹 [MediaSoup] Removing peer ${peerId} from ${streamId}`);

      // Close all transports
      if (peer.sendTransport && !peer.sendTransport.closed)
        peer.sendTransport.close();
      if (peer.recvTransport && !peer.recvTransport.closed)
        peer.recvTransport.close();

      // Close all producers and remove from Redis
      for (const [id, producer] of peer.producers) {
        if (!producer.closed) producer.close();
        await this.redisClient.hDel(`producers:${streamId}`, id);
        this.notifyProducerClosed(streamId, peerId, id);
      }

      // Close all consumers
      for (const consumer of peer.consumers.values()) {
        if (!consumer.closed) consumer.close();
      }

      // Cleanup
      peer.producers.clear();
      peer.consumers.clear();
      peer.producerMetadata.clear();
      peer.consumerInfo?.clear();

      // Remove peer
      room.peers.delete(peerId);

      // Cleanup room if empty
      if (room.peers.size === 0) {
        await this.closeStreamRoom(streamId);
      }

      // Notify others
      this.notifyPeerDisconnected(streamId, peerId);
      console.log(`✅ [MediaSoup] Removed peer ${peerId} from ${streamId}`);
    } catch (error) {
      console.error(`❌ [MediaSoup] Error removing peer ${peerId}:`, error);
      this.stats.failedOperations++;
    }
  }

  getPeerProducers(streamId: string, peerId: string): string[] {
    const room = this.streamRooms.get(streamId);
    if (!room) return [];

    const peer = room.peers.get(peerId);
    if (!peer) return [];

    return Array.from(peer.producers.keys());
  }

  getStreamProducers(
    streamId: string,
  ): Array<{ producerId: string; peerId: string; kind: 'audio' | 'video' }> {
    const room = this.streamRooms.get(streamId);
    if (!room) return [];

    const producers: Array<{
      producerId: string;
      peerId: string;
      kind: 'audio' | 'video';
    }> = [];

    for (const [peerId, peer] of room.peers) {
      for (const [producerId, producer] of peer.producers) {
        const metadata = peer.producerMetadata.get(producerId);
        if (metadata && !producer.closed) {
          producers.push({
            producerId,
            peerId,
            kind: metadata.kind,
          });
        }
      }
    }

    return producers;
  }

  // ======================
  // Enhanced Statistics & Monitoring
  // ======================

  private updateStats(): void {
    this.stats.totalRooms = this.streamRooms.size;
    this.stats.totalPeers = Array.from(this.streamRooms.values()).reduce(
      (sum, room) => sum + room.peers.size,
      0
    );
    this.stats.totalProducers = Array.from(this.streamRooms.values()).reduce(
      (sum, room) => sum + Array.from(room.peers.values()).reduce(
        (peerSum, peer) => peerSum + peer.producers.size,
        0
      ),
      0
    );
    this.stats.totalConsumers = Array.from(this.streamRooms.values()).reduce(
      (sum, room) => sum + Array.from(room.peers.values()).reduce(
        (peerSum, peer) => peerSum + peer.consumers.size,
        0
      ),
      0
    );
    this.stats.lastStatsUpdate = Date.now();
  }

  getStats(): any {
    this.updateStats();
    return {
      ...this.stats,
      workers: this.workers.length,
      isInitialized: this.isInitialized,
      rooms: Array.from(this.streamRooms.entries()).map(([id, room]) => ({
        id,
        peers: room.peers.size,
        age: Date.now() - room.createdAt,
      })),
    };
  }

  async getTransportStats(
    streamId: string,
    peerId: string,
    transportId: string,
  ): Promise<any> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const transport =
      peer.sendTransport?.id === transportId
        ? peer.sendTransport
        : peer.recvTransport?.id === transportId
        ? peer.recvTransport
        : null;

    if (!transport)
      throw new MediaSoupError(
        `Transport ${transportId} not found`,
        MediaSoupErrorCode.TRANSPORT_NOT_FOUND,
      );

    return await transport.getStats();
  }

  async getProducerStats(
    streamId: string,
    peerId: string,
    producerId: string,
  ): Promise<any> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const producer = peer.producers.get(producerId);
    if (!producer)
      throw new MediaSoupError(
        `Producer ${producerId} not found`,
        MediaSoupErrorCode.PRODUCER_NOT_FOUND,
      );

    return await producer.getStats();
  }

  async getConsumerStats(
    streamId: string,
    peerId: string,
    consumerId: string,
  ): Promise<any> {
    const room = this.streamRooms.get(streamId);
    if (!room)
      throw new MediaSoupError(
        `Room ${streamId} not found`,
        MediaSoupErrorCode.ROOM_NOT_FOUND,
      );

    const peer = room.peers.get(peerId);
    if (!peer)
      throw new MediaSoupError(
        `Peer ${peerId} not found`,
        MediaSoupErrorCode.PEER_NOT_FOUND,
      );

    const consumer = peer.consumers.get(consumerId);
    if (!consumer)
      throw new MediaSoupError(
        `Consumer ${consumerId} not found`,
        MediaSoupErrorCode.CONSUMER_NOT_FOUND,
      );

    return await consumer.getStats();
  }

  async getWorkerLoad(): Promise<
    {
      workerId: number;
      pid: number;
      cpuUsage: number;
      routerCount: number;
    }[]
  > {
    return Promise.all(
      this.workers.map(async (worker, index) => ({
        workerId: index,
        pid: worker.pid,
        cpuUsage: (await worker.getResourceUsage()).ru_utime / 1000000,
        routerCount: 1,
      })),
    );
  }

  // ======================
  // Enhanced Notifications
  // ======================

  notifyNewProducer(
    streamId: string,
    peerId: string,
    producerId: string,
    kind: 'audio' | 'video',
  ): void {
    if (this.webSocketService) {
      this.webSocketService.emitToSession(streamId, 'NEW_PRODUCER', {
        sessionId: streamId,
        producerId,
        userId: peerId,
        kind,
      });
    }
  }

  notifyProducerClosed(
    streamId: string,
    peerId: string,
    producerId: string,
  ): void {
    if (this.webSocketService) {
      this.webSocketService.emitToSession(streamId, 'PRODUCER_CLOSED', {
        sessionId: streamId,
        producerId,
        userId: peerId,
      });
    }
  }

  notifyPeerDisconnected(streamId: string, peerId: string): void {
    if (this.webSocketService) {
      this.webSocketService.emitToSession(streamId, 'USER_DISCONNECTED', {
        sessionId: streamId,
        userId: peerId,
        timestamp: new Date(),
      });
    }
  }

  // ======================
  // Enhanced Cleanup & Maintenance
  // ======================

  async closeAllStreamRooms(): Promise<void> {
    for (const streamId of this.streamRooms.keys()) {
      await this.closeStreamRoom(streamId);
    }
  }

  async cleanupStaleRooms(): Promise<void> {
    const now = Date.now();
    const staleThreshold = 2 * 60 * 60 * 1000; // 2 hours

    const staleRooms = Array.from(this.streamRooms.entries()).filter(
      ([_, room]) => {
        const isEmpty = room.peers.size === 0;
        const isOld = now - room.createdAt > staleThreshold;
        return isEmpty || isOld;
      }
    );

    for (const [streamId] of staleRooms) {
      console.log(`🧹 [MediaSoup] Cleaning up stale room: ${streamId}`);
      await this.closeStreamRoom(streamId);
    }

    if (staleRooms.length > 0) {
      console.log(`🧹 [MediaSoup] Cleaned up ${staleRooms.length} stale rooms`);
    }
  }

  async cleanupInactivePeers(): Promise<void> {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [streamId, room] of this.streamRooms.entries()) {
      const inactivePeers = Array.from(room.peers.entries()).filter(
        ([_, peer]) => now - peer.lastActivity > inactiveThreshold
      );

      for (const [peerId] of inactivePeers) {
        console.log(`🧹 [MediaSoup] Removing inactive peer: ${peerId} from ${streamId}`);
        await this.removePeer(streamId, peerId);
      }
    }
  }

  getActiveRooms(): string[] {
    return Array.from(this.streamRooms.keys());
  }

  debugRoomState(streamId: string): void {
    const room = this.streamRooms.get(streamId);
    if (!room) {
      console.log(`[MediaSoup] Room ${streamId} not found`);
      return;
    }

    console.log(`[MediaSoup] Room ${streamId} State:`);
    console.log(`- Router: ${room.router ? 'exists' : 'missing'}`);
    console.log(`- Peers: ${room.peers.size}`);
    console.log(`- Age: ${Date.now() - room.createdAt}ms`);

    for (const [peerId, peer] of room.peers) {
      console.log(`  Peer ${peerId}:`);
      console.log(
        `  - Transports: Send=${peer.sendTransport?.id || 'none'}, Recv=${
          peer.recvTransport?.id || 'none'
        }`,
      );
      console.log(`  - Producers: ${peer.producers.size}`);
      console.log(`  - Consumers: ${peer.consumers.size}`);
      console.log(`  - Ready for consumption: ${peer.readyForConsumption}`);
      console.log(`  - Last activity: ${Date.now() - peer.lastActivity}ms ago`);

      if (peer.consumerInfo) {
        console.log(`  - Consumer Info:`);
        for (const [id, info] of peer.consumerInfo) {
          console.log(`    ${id}: ${info.kind} from ${info.producerPeerId}`);
        }
      }
    }
  }

  // ======================
  // Enhanced Utility Methods
  // ======================

  private getNextWorker(): Worker {
    if (this.workers.length === 0) {
      throw new MediaSoupError(
        'No workers available',
        MediaSoupErrorCode.WORKER_ERROR,
      );
    }

    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;
    return worker;
  }

  private cleanupTransport(
    streamId: string,
    peerId: string,
    transportId: string,
    direction: 'send' | 'recv',
  ): void {
    const room = this.streamRooms.get(streamId);
    if (!room) return;

    const peer = room.peers.get(peerId);
    if (!peer) return;

    if (direction === 'send' && peer.sendTransport?.id === transportId) {
      peer.sendTransport = undefined;
    } else if (direction === 'recv' && peer.recvTransport?.id === transportId) {
      peer.recvTransport = undefined;
      peer.readyForConsumption = false;
    }
  }

  private async cleanupWorkers(): Promise<void> {
    for (const worker of this.workers) {
      try {
        worker.close();
      } catch (e) {
        console.error('[MediaSoup] Error closing worker:', e);
      }
    }
    this.workers = [];
  }

  // Enhanced: Transport-level bandwidth monitoring and adaptive bitrate
  private setupTransportBandwidthMonitoring(
    transport: WebRtcTransport,
    streamId: string,
    peerId: string,
    direction: 'send' | 'recv',
  ): void {
    // Monitor transport stats periodically
    const statsInterval = setInterval(async () => {
      try {
        if (transport.closed) {
          clearInterval(statsInterval);
          return;
        }

        const stats = await transport.getStats();
        let availableOutgoingBitrate = 0;
        let availableIncomingBitrate = 0;

        // Extract available bitrate from stats
        for (const report of stats) {
          if (report.type === 'transport') {
            availableOutgoingBitrate = report.availableOutgoingBitrate || 0;
            availableIncomingBitrate = report.availableIncomingBitrate || 0;
            break;
          }
        }

        // Log bandwidth information
        if (direction === 'send' && availableOutgoingBitrate > 0) {
          const room = this.streamRooms.get(streamId);
          const peer = room?.peers.get(peerId);
          
          if (peer) {
            // Adjust transport bitrate based on available bandwidth
            const currentBitrate = availableOutgoingBitrate;
            const minBitrate = isProduction ? 600000 : 400000;
            const maxBitrate = isProduction ? 2500000 : 1500000;

            // If bandwidth is constrained, notify producers to adapt
            if (currentBitrate < minBitrate && peer.producers.size > 0) {
              console.warn(
                `⚠️ [MediaSoup] Low bandwidth detected for ${peerId} (${(currentBitrate / 1000).toFixed(0)}kbps)`,
              );
              
              // Could trigger producer bitrate reduction here
              // This would require additional producer adaptation logic
            }
          }
        }
      } catch (error) {
        // Stats collection failed - continue without adaptation
        console.warn('[MediaSoup] Failed to get transport stats:', error);
      }
    }, 10000); // Check every 10 seconds

    // Cleanup on transport close
    transport.on('@close', () => {
      clearInterval(statsInterval);
    });
  }

  // Enhanced: Start background maintenance tasks
  startMaintenanceTasks(): void {
    // Cleanup stale rooms every 10 minutes
    setInterval(async () => {
      try {
        await this.cleanupStaleRooms();
      } catch (error) {
        console.error('[MediaSoup] Error in stale room cleanup:', error);
      }
    }, 10 * 60 * 1000);

    // Cleanup inactive peers every 5 minutes
    setInterval(async () => {
      try {
        await this.cleanupInactivePeers();
      } catch (error) {
        console.error('[MediaSoup] Error in inactive peer cleanup:', error);
      }
    }, 5 * 60 * 1000);

    console.log('[MediaSoup] Maintenance tasks started');
  }
}