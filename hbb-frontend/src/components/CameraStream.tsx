// src/components/CameraStream.tsx - Complete Version with Bid Logic Restored
"use client";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import { Device } from "mediasoup-client";
import { useWebSocketContext } from "../context/WebSocketContext";
import { useMediaDevices } from "../hooks/useMediaDevices";
import DeviceSelectionModal from "@/src/components/app-reusables/modals/DeviceSelectionModal";

// Detect Safari
const getIsSafari = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// MediaSoup State Manager - Enhanced with better error handling and connection tracking
class MediaSoupStateManager {
  private state:
    | "idle"
    | "initializing"
    | "transports-creating"
    | "transports-connecting"
    | "transports-ready"
    | "producing"
    | "consuming"
    | "ready" = "idle";
  private stateEmitter = new EventTarget();
  private producersRef: React.MutableRefObject<Map<string, any>>;
  private consumersRef: React.MutableRefObject<Map<string, any>>;
  private sendTransportConnected = false;
  private recvTransportConnected = false;

  constructor(
    private deviceRef: React.MutableRefObject<Device | null>,
    private sendTransportRef: React.MutableRefObject<any>,
    private recvTransportRef: React.MutableRefObject<any>,
    private socket: any,
    private sessionId: string,
    private userId: string,
    producersRef: React.MutableRefObject<Map<string, any>>,
    consumersRef: React.MutableRefObject<Map<string, any>>,
    private handleError: (
      error: any,
      context: string,
      recoverable?: boolean
    ) => void
  ) {
    this.producersRef = producersRef;
    this.consumersRef = consumersRef;
  }

  async initialize(): Promise<void> {
    if (this.state !== "idle") {
      throw new Error(`Invalid state for initialization: ${this.state}`);
    }

    this.setState("initializing");

    try {
      // Step 1: Load device capabilities
      await this.loadDevice();

      // Step 2: Create transports in sequence
      this.setState("transports-creating");
      await this.createTransports();

      // Step 3: Wait for transports to be ready
      this.setState("transports-connecting");
      await this.waitForTransportsReady();

      this.setState("ready");
      console.log("✅ [StateManager] MediaSoup initialization complete");
    } catch (error) {
      this.setState("idle");
      throw error;
    }
  }

  private async loadDevice(): Promise<void> {
    const device = new Device();

    // Get RTP capabilities with proper error handling
    const rtpCapabilities = await this.getRtpCapabilitiesWithRetry();
    await device.load({ routerRtpCapabilities: rtpCapabilities });

    this.deviceRef.current = device;
    console.log("✅ [StateManager] Device loaded");
  }

  private async createTransports(): Promise<void> {
    // Create both transports
    await Promise.all([this.createSendTransport(), this.createRecvTransport()]);
  }

  private async waitForTransportsReady(): Promise<void> {
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    console.log("⏳ [StateManager] Waiting for transports to be ready...");

    // FIXED: Don't wait for transports to be connected during initialization
    // They will connect when we actually use them (produce/consume)

    // Just verify transports were created successfully
    if (!this.sendTransportRef.current || !this.recvTransportRef.current) {
      throw new Error("Transports were not created successfully");
    }

    console.log("✅ [StateManager] Transports created and ready for use");

    // Mark as ready even though not connected yet
    // The transports will connect when we produce/consume
    return;
  }

  private async createSendTransport(): Promise<void> {
    const response = await this.emitWithTimeout(
      "mediasoup_createWebRtcTransport",
      {
        streamId: this.sessionId,
        peerId: this.userId,
        direction: "send",
      }
    );

    const transport = this.deviceRef.current!.createSendTransport({
      id: response.id,
      iceParameters: response.iceParameters,
      iceCandidates: response.iceCandidates,
      dtlsParameters: response.dtlsParameters,
      sctpParameters: response.sctpParameters,
    });

    // FIXED: Remove connectionstatechange listener - not needed here
    transport.on("dtlsstatechange", (dtlsState) => {
      console.log(`🔄 [StateManager] Send transport DTLS state: ${dtlsState}`);
      if (dtlsState === "connected") {
        console.log("✅ [StateManager] Send transport DTLS connected!");
      } else if (dtlsState === "failed") {
        console.error("❌ [StateManager] Send transport DTLS failed");
        this.handleError(
          new Error("Send transport DTLS failed"),
          "Transport connection failed",
          true
        );
      }
    });

    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        console.log("🔗 [StateManager] Send transport connecting...");
        await this.emitWithTimeout("mediasoup_connectWebRtcTransport", {
          streamId: this.sessionId,
          peerId: this.userId,
          transportId: transport.id,
          dtlsParameters,
        });
        console.log(
          "✅ [StateManager] Send transport connect callback success"
        );
        callback();
      } catch (error) {
        console.error(
          "❌ [StateManager] Send transport connect failed:",
          error
        );
        errback(error as Error);
      }
    });

    transport.on("produce", async (parameters, callback, errback) => {
      try {
        const response = await this.emitWithTimeout(
          "mediasoup_createProducer",
          {
            streamId: this.sessionId,
            peerId: this.userId,
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
          }
        );
        callback({ id: response.producerId });
      } catch (error) {
        errback(error as Error);
      }
    });

    this.sendTransportRef.current = transport;
    console.log("✅ [StateManager] Send transport created");
  }

  private async createRecvTransport(): Promise<void> {
    const response = await this.emitWithTimeout(
      "mediasoup_createWebRtcTransport",
      {
        streamId: this.sessionId,
        peerId: this.userId,
        direction: "recv",
      }
    );

    const transport = this.deviceRef.current!.createRecvTransport({
      id: response.id,
      iceParameters: response.iceParameters,
      iceCandidates: response.iceCandidates,
      dtlsParameters: response.dtlsParameters,
      sctpParameters: response.sctpParameters,
    });

    transport.on("connectionstatechange", (state) => {
      console.log(`🔄 [StateManager] Recv transport state: ${state}`);
      if (state === "connected") {
        this.recvTransportConnected = true;
        console.log("✅ [StateManager] Recv transport connected!");
        if (this.socket) {
          console.log("📢 [StateManager] Emitting peer_ready_for_consumption");
          this.socket.emit("peer_ready_for_consumption", {
            sessionId: this.sessionId,
            peerId: this.userId,
          });
        }
      } else if (state === "failed" || state === "disconnected") {
        this.recvTransportConnected = false;
        console.error(`❌ [StateManager] Recv transport ${state}`);
      }
    });

    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        console.log("🔗 [StateManager] Recv transport connecting...");
        await this.emitWithTimeout("mediasoup_connectWebRtcTransport", {
          streamId: this.sessionId,
          peerId: this.userId,
          transportId: transport.id,
          dtlsParameters,
        });
        console.log(
          "✅ [StateManager] Recv transport connect callback success"
        );
        callback();
      } catch (error) {
        console.error(
          "❌ [StateManager] Recv transport connect failed:",
          error
        );
        errback(error as Error);
      }
    });

    this.recvTransportRef.current = transport;
    console.log("✅ [StateManager] Recv transport created");
  }

  async produceMedia(localStream: MediaStream): Promise<any[]> {
    if (this.state !== "ready") {
      throw new Error(`Cannot produce media in state: ${this.state}`);
    }

    if (
      !this.sendTransportRef.current ||
      this.sendTransportRef.current.closed
    ) {
      throw new Error("Send transport not available");
    }

    console.log("🎬 [StateManager] Starting media production...");
    this.setState("producing");

    const videoTrack = localStream.getVideoTracks()[0];
    const audioTrack = localStream.getAudioTracks()[0];

    const producers: any[] = [];

    try {
      if (videoTrack && this.deviceRef.current!.canProduce("video")) {
        const clonedVideoTrack = videoTrack.clone();
        
        // Enhanced: Simulcast encoding with multiple quality layers for adaptive streaming
        // Low: 150kbps, Medium: 500kbps, High: 1500kbps
        const encodings = [
          {
            rid: "r0", // Low quality layer
            maxBitrate: 150000,
            scalabilityMode: "L1T1",
            scaleResolutionDownBy: 4,
          },
          {
            rid: "r1", // Medium quality layer
            maxBitrate: 500000,
            scalabilityMode: "L1T1",
            scaleResolutionDownBy: 2,
          },
          {
            rid: "r2", // High quality layer
            maxBitrate: 1500000,
            scalabilityMode: "L1T1",
            scaleResolutionDownBy: 1,
          },
        ];

        const videoProducer = await this.sendTransportRef.current.produce({
          track: clonedVideoTrack,
          encodings: encodings,
          codecOptions: {
            videoGoogleStartBitrate: 500, // Start with medium quality
            videoGoogleMaxBitrate: 1500, // Max 1.5 Mbps
            videoGoogleMinBitrate: 150, // Min 150 kbps for fallback
          },
          appData: { mediaType: "video" },
        });

        // Monitor producer quality and adjust dynamically
        videoProducer.on("score", (score: any) => {
          const scores = Array.isArray(score) ? score : [score];
          const avgScore = scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / scores.length;
          
          if (avgScore < 5) {
            console.warn(`⚠️ [StateManager] Low video quality detected: ${avgScore.toFixed(2)}`);
            // Could trigger adaptive quality adjustment here
          }
        });

        this.producersRef.current.set("video", videoProducer);
        producers.push(videoProducer);
        console.log(
          "✅ [StateManager] Video producer created with simulcast:",
          videoProducer.id
        );
      }

      if (audioTrack && this.deviceRef.current!.canProduce("audio")) {
        const clonedAudioTrack = audioTrack.clone();
        const audioProducer = await this.sendTransportRef.current.produce({
          track: clonedAudioTrack,
          appData: { mediaType: "audio" },
          codecOptions: {
            opusStereo: true,
            opusFec: true,
            opusDtx: true,
            opusMaxPlaybackRate: 48000,
          },
        });

        this.producersRef.current.set("audio", audioProducer);
        producers.push(audioProducer);
        console.log(
          "✅ [StateManager] Audio producer created:",
          audioProducer.id
        );
      }

      console.log("✅ [StateManager] Media production completed successfully");
      this.setState("ready");
      return producers;
    } catch (error) {
      console.error("❌ [StateManager] Error in media production:", error);
      this.setState("ready");
      throw error;
    }
  }

  async consumeMedia(
    producerId: string,
    kind: "audio" | "video"
  ): Promise<any> {
    if (this.state !== "ready") {
      throw new Error(`Cannot consume media in state: ${this.state}`);
    }

    if (
      !this.recvTransportRef.current ||
      this.recvTransportRef.current.closed
    ) {
      throw new Error("Receive transport not available");
    }

    const response = await this.emitWithTimeout("mediasoup_createConsumer", {
      streamId: this.sessionId,
      peerId: this.userId,
      producerId,
      rtpCapabilities: this.deviceRef.current!.rtpCapabilities,
    });

    const consumer = await this.recvTransportRef.current.consume({
      id: response.id,
      producerId: response.producerId,
      kind: response.kind,
      rtpParameters: response.rtpParameters,
    });

    // Ensure consumer is not paused
    if (consumer.paused) {
      await consumer.resume();
    }

    // Enhanced: Monitor consumer quality for adaptive streaming
    if (kind === "video" && consumer.setPreferredLayers) {
      let qualityCheckInterval: NodeJS.Timeout | null = null;
      
      const monitorQuality = async () => {
        try {
          // Get stats to determine network conditions
          const stats = await consumer.getStats();
          let packetsLost = 0;
          let packetsReceived = 0;
          let jitter = 0;
          let bitrate = 0;

          stats.forEach((report: any) => {
            if (report.type === "inbound-rtp" && report.mediaType === "video") {
              packetsLost += report.packetsLost || 0;
              packetsReceived += report.packetsReceived || 0;
              jitter += report.jitter || 0;
              bitrate += report.bitrate || 0;
            }
          });

          // Calculate packet loss percentage
          const totalPackets = packetsLost + packetsReceived;
          const packetLossRate = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

          // Adaptive quality: Switch layers based on network conditions
          if (packetLossRate > 5 || jitter > 50) {
            // Poor network - prefer lower quality layer
            console.log(`⚠️ [StateManager] Poor network detected (loss: ${packetLossRate.toFixed(2)}%, jitter: ${jitter.toFixed(2)}), switching to lower quality`);
            try {
              await consumer.setPreferredLayers({ spatialLayer: 0, temporalLayer: 0 });
            } catch (e) {
              // Layer switching not supported or failed - continue
            }
          } else if (packetLossRate < 1 && jitter < 20 && bitrate > 500000) {
            // Good network - prefer higher quality layer
            try {
              await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 0 });
            } catch (e) {
              // Layer switching not supported or failed - continue
            }
          }
        } catch (error) {
          // Stats collection failed - continue without adaptation
          console.warn("⚠️ [StateManager] Failed to get consumer stats:", error);
        }
      };

      // Start quality monitoring every 5 seconds
      qualityCheckInterval = setInterval(monitorQuality, 5000);
      
      // Cleanup interval when consumer closes
      consumer.on("transportclose", () => {
        if (qualityCheckInterval) {
          clearInterval(qualityCheckInterval);
        }
      });

      consumer.on("@close", () => {
        if (qualityCheckInterval) {
          clearInterval(qualityCheckInterval);
        }
      });
    }

    this.consumersRef.current.set(consumer.id, consumer);
    return consumer;
  }

  private async emitWithTimeout(
    event: string,
    data: any,
    timeout = 15000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`${event} timeout`)),
        timeout
      );

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timer);
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  private async getRtpCapabilitiesWithRetry(maxRetries = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.emitWithTimeout(
          "mediasoup_getRouterRtpCapabilities",
          {
            streamId: this.sessionId,
          }
        );
        return response.rtpCapabilities;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  private setState(newState: typeof this.state): void {
    console.log(`🔄 [StateManager] State: ${this.state} → ${newState}`);
    this.state = newState;
    this.stateEmitter.dispatchEvent(
      new CustomEvent("stateChange", {
        detail: { state: newState },
      })
    );
  }

  getState(): string {
    return this.state;
  }

  isReady(): boolean {
    return this.state === "ready";
  }

  onStateChange(callback: (state: string) => void): () => void {
    const handler = (event: any) => callback(event.detail.state);
    this.stateEmitter.addEventListener("stateChange", handler);
    return () => this.stateEmitter.removeEventListener("stateChange", handler);
  }

  cleanup(): void {
    this.setState("idle");
    this.sendTransportConnected = false;
    this.recvTransportConnected = false;
  }
}

interface CameraStreamProps {
  isMuted: boolean;
  onVideoReady?: (ready: boolean) => void;
  isInfluencer?: boolean;
  isExplorer?: boolean;
  sessionId?: string;
  userId?: string;
  onVideoRefsReady?: (refs: {
    localVideoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    localStreamRef: React.RefObject<MediaStream | null>;
    remoteStreamRef: React.RefObject<MediaStream | null>;
  }) => void;
  showDeviceSelector?: boolean;
  onDeviceSelectorToggle?: (show: boolean) => void;
  // BID-RELATED PROPS
  onBidReceived?: (bid: any) => void;
  onBidAccepted?: (bid: any) => void;
  onBidRejected?: (bid: any) => void;
}

const CameraStream = memo(function CameraStream({
  isMuted,
  onVideoReady,
  isInfluencer = false,
  isExplorer = false,
  sessionId,
  userId,
  onVideoRefsReady,
  showDeviceSelector = false,
  onDeviceSelectorToggle,
  // Bid callbacks
  onBidReceived,
  onBidAccepted,
  onBidRejected,
}: CameraStreamProps) {
  console.log(
    `🔄 [CameraStream] Render - Session: ${sessionId}, User: ${userId}, Role: ${
      isInfluencer ? "Influencer" : "Explorer"
    }`
  );

  // Component state
  const [isMounted, setIsMounted] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const mountedRef = useRef(false);

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Safari workaround refs
  const localHiddenVideoRef = useRef<HTMLVideoElement>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);

  // MediaSoup state
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  const producersRef = useRef<Map<string, any>>(new Map());
  const consumersRef = useRef<Map<string, any>>(new Map());

  // Remote stream management
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteTracksRef = useRef<Map<string, MediaStreamTrack>>(new Map());

  // State management refs
  const isInitializingRef = useRef(false);
  const isProducingRef = useRef(false);
  const pendingConsumersRef = useRef<Set<string>>(new Set());
  const isDeviceSwitchingRef = useRef(false);
  const producerFailureCountRef = useRef<Map<string, number>>(new Map());

  // State manager
  const stateManagerRef = useRef<MediaSoupStateManager | null>(null);

  // Component state
  const [connectionState, setConnectionState] = useState<
    "idle" | "initializing" | "connecting" | "connected" | "failed"
  >("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [localStreamReady, setLocalStreamReady] = useState(false);

  // Playback state tracking
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [isRemotePlaying, setIsRemotePlaying] = useState(false);

  // BID-RELATED STATE
  const [incomingBids, setIncomingBids] = useState<any[]>([]);
  const [acceptedBid, setAcceptedBid] = useState<any>(null);
  const [bidConnectionState, setBidConnectionState] = useState<
    "none" | "waiting" | "connecting" | "connected"
  >("none");

  const { socket, isReady, addEventListener, removeEventListener } =
    useWebSocketContext();

  // Device management
  const mediaDevices = useMediaDevices();

  // Producer event cache for deduplication
  const producerEventCache = useRef<Map<string, number>>(new Map());

  // Animation frame for canvas drawing
  const animationFrameRef = useRef<number>(0);

  // Cleanup timeout for StrictMode
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize mounted state
  useEffect(() => {
    console.log("🔧 [CameraStream] Component mounting...");
    mountedRef.current = true;
    setIsMounted(true);
    setIsSafari(getIsSafari());

    return () => {
      console.log("🧹 [CameraStream] Component unmounting...");
      mountedRef.current = false;
      setIsMounted(false);
    };
  }, []);

  // Error handling
  const handleError = useCallback(
    (error: any, context: string, recoverable = true) => {
      const errorMessage = `${context}: ${error?.message || error}`;
      console.error(`❌ [CameraStream] ${errorMessage}`);

      if (mountedRef.current) {
        setLastError(errorMessage);

        const totalFailures = Array.from(
          producerFailureCountRef.current.values()
        ).reduce((sum, count) => sum + count, 0);

        if (totalFailures >= 10) {
          console.error(
            "❌ [CameraStream] Too many failures, stopping retries"
          );
          setConnectionState("failed");
          recoverable = false;
        }

        if (!recoverable) {
          setConnectionState("failed");
        }
      }
    },
    []
  );

  // Update remote stream with fixed display logic
  const updateRemoteStream = useCallback(() => {
    if (!remoteVideoRef.current || !mountedRef.current) {
      console.log(
        "⏭️ [CameraStream] Cannot update remote stream - no video element or unmounted"
      );
      return;
    }

    console.log("🎥 [updateRemoteStream] Called", {
      hasRemoteVideoElement: !!remoteVideoRef.current,
      existingStreamTracks: remoteStreamRef.current?.getTracks().length || 0,
      availableTracks: remoteTracksRef.current.size,
    });

    // Create or get the remote stream
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
      console.log("🆕 [CameraStream] Created new remote stream");
    }

    // Get all available tracks
    const tracks = Array.from(remoteTracksRef.current.values());
    console.log(
      `🎥 [CameraStream] Updating remote stream with ${tracks.length} tracks:`,
      tracks.map((t) => `${t.kind} (${t.readyState})`)
    );

    // Clear existing tracks from the stream
    remoteStreamRef.current.getTracks().forEach((track) => {
      remoteStreamRef.current!.removeTrack(track);
    });

    // Add new tracks that are live
    let hasLiveTracks = false;
    tracks.forEach((track) => {
      if (track.readyState === "live") {
        remoteStreamRef.current!.addTrack(track);
        hasLiveTracks = true;
        console.log(
          `✅ [CameraStream] Added live ${track.kind} track to remote stream`
        );
      } else {
        console.warn(
          `⚠️ [CameraStream] Skipping ${track.kind} track - not live (${track.readyState})`
        );
      }
    });

    // Update video element source
    if (hasLiveTracks) {
      console.log(
        `🎥 [CameraStream] Setting remote video source with ${
          remoteStreamRef.current.getTracks().length
        } tracks`
      );

      // Force video element to reload
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.srcObject = remoteStreamRef.current;

      // Set ready state
      setRemoteVideoReady(true);

      // Force play
      remoteVideoRef.current.play().catch((error) => {
        console.warn("⚠️ [CameraStream] Remote video autoplay failed:", error);
      });
    } else {
      console.log(
        "📭 [CameraStream] No live tracks available for remote stream"
      );
      setRemoteVideoReady(false);
      setIsRemotePlaying(false);
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  // Canvas drawing for Safari
  const drawToCanvas = useCallback(() => {
    if (
      !localCanvasRef.current ||
      !localHiddenVideoRef.current ||
      !localStreamRef.current
    ) {
      return;
    }

    const canvas = localCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = localHiddenVideoRef.current;

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    animationFrameRef.current = requestAnimationFrame(drawToCanvas);
  }, []);

  // Initialize local stream
  const initializeLocalStream = useCallback(
    async (forceDeviceId?: { video?: string; audio?: string }) => {
      if (!mountedRef.current) {
        console.log(
          "❌ [CameraStream] Component not mounted, skipping stream initialization"
        );
        return null;
      }

      try {
        const videoDeviceId = forceDeviceId?.video;
        const audioDeviceId = forceDeviceId?.audio;

        console.log("📹 [CameraStream] Initializing local stream...", {
          videoDeviceId,
          audioDeviceId,
          hasExistingStream: !!localStreamRef.current,
          mounted: mountedRef.current,
          isSafari,
        });

        // Stop existing stream if forced (device change)
        if (forceDeviceId && localStreamRef.current) {
          console.log(
            "🔄 [CameraStream] Stopping existing stream for device change"
          );
          localStreamRef.current.getTracks().forEach((track) => track.stop());
          localStreamRef.current = null;
          setLocalStreamReady(false);
          setLocalVideoReady(false);
          setIsLocalPlaying(false);
        }

        // Skip if we already have a working stream and no device change
        if (localStreamRef.current && !forceDeviceId) {
          const tracks = localStreamRef.current.getTracks();
          const hasLiveTracks = tracks.some(
            (track) => track.readyState === "live"
          );

          if (hasLiveTracks) {
            console.log(
              "✅ [CameraStream] Using existing local stream with live tracks"
            );

            const videoElement = isSafari
              ? localHiddenVideoRef.current
              : localVideoRef.current;
            if (
              videoElement &&
              videoElement.srcObject !== localStreamRef.current
            ) {
              videoElement.srcObject = localStreamRef.current;
              try {
                await videoElement.play();
                if (isSafari) {
                  drawToCanvas();
                }
              } catch (e) {
                console.warn(
                  "⚠️ [CameraStream] Autoplay failed, but continuing:",
                  e
                );
              }
            }

            if (!localStreamReady) {
              setLocalStreamReady(true);
              setLocalVideoReady(true);
              onVideoReady?.(true);
            }

            return localStreamRef.current;
          }
        }

        // Enhanced: Improved video constraints for better quality
        // Start with 720p, fallback to 480p, then 360p
        const videoConstraints = videoDeviceId
          ? {
              deviceId: { exact: videoDeviceId },
              width: { ideal: 1280, min: 640 }, // 720p ideal, 480p minimum
              height: { ideal: 720, min: 480 },
              facingMode: "user",
              frameRate: { ideal: 30, min: 20, max: 30 }, // Higher frame rate for smoother video
              aspectRatio: { ideal: 16 / 9 },
            }
          : {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              facingMode: "user",
              frameRate: { ideal: 30, min: 20, max: 30 },
              aspectRatio: { ideal: 16 / 9 },
            };

        const audioConstraints = audioDeviceId
          ? {
              deviceId: { exact: audioDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            };

        console.log("🎥 [CameraStream] Requesting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        if (!mountedRef.current) {
          console.log("❌ [CameraStream] Component unmounted, stopping stream");
          stream.getTracks().forEach((track) => track.stop());
          return null;
        }

        localStreamRef.current = stream;

        // Add track event listeners
        stream.getTracks().forEach((track) => {
          track.onended = () =>
            console.log(`🔚 [CameraStream] Local ${track.kind} track ended`);
          track.onmute = () =>
            console.log(`🔇 [CameraStream] Local ${track.kind} track muted`);
          track.onunmute = () =>
            console.log(`🔊 [CameraStream] Local ${track.kind} track unmuted`);
        });

        // Set video element source
        const videoElement = isSafari
          ? localHiddenVideoRef.current
          : localVideoRef.current;

        if (videoElement) {
          console.log("🎥 [CameraStream] Setting local video source");
          videoElement.srcObject = stream;

          setLocalVideoReady(true);
          setLocalStreamReady(true);
          onVideoReady?.(true);

          videoElement.play().catch((playError) => {
            console.warn(
              "⚠️ [CameraStream] Local video autoplay failed:",
              playError
            );
          });

          if (isSafari) {
            drawToCanvas();
          }
        } else {
          setLocalVideoReady(true);
          setLocalStreamReady(true);
          onVideoReady?.(true);
        }

        // Set mute state
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });

        console.log("✅ [CameraStream] Local stream initialized:", {
          video: stream.getVideoTracks().length,
          audio: stream.getAudioTracks().length,
          videoTrack: stream.getVideoTracks()[0]?.label,
          audioTrack: stream.getAudioTracks()[0]?.label,
        });

        return stream;
      } catch (error) {
        console.error(
          "❌ [CameraStream] Failed to initialize local stream:",
          error
        );

        if (error instanceof DOMException) {
          if (
            error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError"
          ) {
            handleError(
              error,
              "Camera/microphone permission denied. Please allow access and refresh.",
              false
            );
          } else if (
            error.name === "NotFoundError" ||
            error.name === "DevicesNotFoundError"
          ) {
            handleError(
              error,
              "No camera or microphone found. Please connect a device.",
              false
            );
          } else if (
            error.name === "NotReadableError" ||
            error.name === "TrackStartError"
          ) {
            handleError(
              error,
              "Camera or microphone is already in use by another application.",
              false
            );
          } else {
            handleError(error, "Failed to access camera/microphone", false);
          }
        } else {
          handleError(error, "Failed to access camera/microphone", false);
        }

        onVideoReady?.(false);
        setLocalStreamReady(false);
        setLocalVideoReady(false);
        return null;
      }
    },
    [isMuted, onVideoReady, handleError, drawToCanvas, isSafari]
  );

  // Switch device and replace MediaSoup producer
  const switchDevice = useCallback(
    async (type: "video" | "audio", deviceId: string) => {
      if (isDeviceSwitchingRef.current) {
        console.log("⏭️ [CameraStream] Device switch already in progress");
        return false;
      }

      isDeviceSwitchingRef.current = true;
      console.log(`🔄 [CameraStream] Switching ${type} device to:`, deviceId);

      try {
        const currentStream = localStreamRef.current;
        if (!currentStream) {
          throw new Error("No current stream available");
        }

        const currentVideoTrack = currentStream.getVideoTracks()[0];
        const currentAudioTrack = currentStream.getAudioTracks()[0];

        const currentVideoDeviceId = currentVideoTrack?.getSettings().deviceId;
        const currentAudioDeviceId = currentAudioTrack?.getSettings().deviceId;

        const newVideoDeviceId =
          type === "video" ? deviceId : currentVideoDeviceId;
        const newAudioDeviceId =
          type === "audio" ? deviceId : currentAudioDeviceId;

        const newStream = await initializeLocalStream({
          video: newVideoDeviceId,
          audio: newAudioDeviceId,
        });

        if (!newStream) {
          throw new Error("Failed to create new stream with selected device");
        }

        // Replace MediaSoup producers if connected
        if (
          sendTransportRef.current &&
          !sendTransportRef.current.closed &&
          deviceRef.current
        ) {
          console.log("🔄 [CameraStream] Replacing MediaSoup producers...");

          const newVideoTrack = newStream.getVideoTracks()[0];
          const newAudioTrack = newStream.getAudioTracks()[0];

          if (type === "video" && newVideoTrack) {
            const videoProducer = producersRef.current.get("video");
            if (videoProducer && !videoProducer.closed) {
              try {
                await videoProducer.replaceTrack({ track: newVideoTrack });
                console.log("✅ [CameraStream] Video producer track replaced");
              } catch (error) {
                console.warn(
                  "⚠️ [CameraStream] Failed to replace video track, recreating producer...",
                  error
                );
                videoProducer.close();
                producersRef.current.delete("video");
                isProducingRef.current = false;
                setTimeout(() => {
                  if (
                    mountedRef.current &&
                    stateManagerRef.current?.isReady()
                  ) {
                    stateManagerRef.current.produceMedia(newStream);
                  }
                }, 1000);
              }
            }
          }

          if (type === "audio" && newAudioTrack) {
            const audioProducer = producersRef.current.get("audio");
            if (audioProducer && !audioProducer.closed) {
              try {
                await audioProducer.replaceTrack({ track: newAudioTrack });
                console.log("✅ [CameraStream] Audio producer track replaced");
              } catch (error) {
                console.warn(
                  "⚠️ [CameraStream] Failed to replace audio track, recreating producer...",
                  error
                );
                audioProducer.close();
                producersRef.current.delete("audio");
                isProducingRef.current = false;
                setTimeout(() => {
                  if (
                    mountedRef.current &&
                    stateManagerRef.current?.isReady()
                  ) {
                    stateManagerRef.current.produceMedia(newStream);
                  }
                }, 1000);
              }
            }
          }
        }

        console.log(`✅ [CameraStream] Successfully switched ${type} device`);
        return true;
      } catch (error) {
        console.error(
          `❌ [CameraStream] Failed to switch ${type} device:`,
          error
        );
        setLastError(
          `Failed to switch ${type} device: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return false;
      } finally {
        isDeviceSwitchingRef.current = false;
      }
    },
    [initializeLocalStream]
  );

  // Handle device changes from modal
  const handleDeviceChange = useCallback(
    async (type: "video" | "audio" | "audioOutput", deviceId: string) => {
      console.log(`📱 [CameraStream] Device change requested:`, {
        type,
        deviceId,
      });

      if (type === "audioOutput") {
        try {
          if (localVideoRef.current && "setSinkId" in localVideoRef.current) {
            await (localVideoRef.current as any).setSinkId(deviceId);
          }
          if (remoteVideoRef.current && "setSinkId" in remoteVideoRef.current) {
            await (remoteVideoRef.current as any).setSinkId(deviceId);
          }
          console.log("✅ [CameraStream] Audio output device changed");
        } catch (error) {
          console.error(
            "❌ [CameraStream] Failed to change audio output device:",
            error
          );
        }
        return;
      }

      const success = await switchDevice(type, deviceId);
      if (!success) {
        setLastError(`Failed to switch to selected ${type} device`);
      }
    },
    [switchDevice]
  );

  // Deduplicate producer events
  const deduplicateProducerEvent = useCallback((data: any, ttl = 5000) => {
    const key = `${data.producerId}-${data.kind}`;
    const now = Date.now();
    const last = producerEventCache.current.get(key);
    if (last && now - last < ttl) return false;
    producerEventCache.current.set(key, now);
    return true;
  }, []);

  // Consume media with proper track management
  const consumeMedia = useCallback(
    async (
      producerId: string,
      producerUserId: string,
      kind: "audio" | "video"
    ) => {
      if (!stateManagerRef.current?.isReady() || !mountedRef.current) {
        console.log("⏭️ [CameraStream] Cannot consume media - not ready");
        return;
      }

      const consumerKey = `${producerId}-${kind}`;
      if (pendingConsumersRef.current.has(consumerKey)) {
        console.log(
          `⏭️ [CameraStream] Consumer for ${kind} producer ${producerId} already pending`
        );
        return;
      }

      // Check if we already have a consumer for this producer
      for (const consumer of Array.from(consumersRef.current.values())) {
        if (consumer.producerId === producerId) {
          console.log(
            `⏭️ [CameraStream] Consumer for producer ${producerId} already exists`
          );
          return;
        }
      }

      pendingConsumersRef.current.add(consumerKey);
      console.log(
        `📺 [CameraStream] Consuming ${kind} from ${producerUserId}...`
      );

      try {
        const consumer = await stateManagerRef.current.consumeMedia(
          producerId,
          kind
        );

        if (!mountedRef.current) return;

        console.log(
          `✅ [CameraStream] ${kind} consumer created for ${producerUserId}`
        );

        const track = consumer.track;
        track.enabled = true; // Ensure track is enabled

        const trackId = `${producerUserId}-${kind}`;

        console.log(
          `🎵🎥 [CameraStream] New ${kind} track from ${producerUserId}:`,
          {
            trackId,
            readyState: track.readyState,
            enabled: track.enabled,
          }
        );

        // Store the track
        remoteTracksRef.current.set(trackId, track);

        // Update remote stream immediately
        updateRemoteStream();

        // Handle track ending
        track.onended = () => {
          console.log(
            `🔚 [CameraStream] ${kind} track ended from ${producerUserId}`
          );
          remoteTracksRef.current.delete(trackId);
          updateRemoteStream();
        };

        track.onmute = () => {
          console.log(
            `🔇 [CameraStream] ${kind} track muted from ${producerUserId}`
          );
        };

        track.onunmute = () => {
          console.log(
            `🔊 [CameraStream] ${kind} track unmuted from ${producerUserId}`
          );
        };

        // Handle consumer events
        consumer.on("transportclose", () => {
          console.log(
            `🚛 [CameraStream] Consumer transport closed for ${kind} from ${producerUserId}`
          );
          consumersRef.current.delete(consumer.id);
          remoteTracksRef.current.delete(trackId);
          updateRemoteStream();
        });

        consumer.on("producerclose", () => {
          console.log(
            `🎬 [CameraStream] Producer closed for ${kind} from ${producerUserId}`
          );
          consumersRef.current.delete(consumer.id);
          remoteTracksRef.current.delete(trackId);
          updateRemoteStream();
        });
      } catch (error) {
        console.error(`❌ [CameraStream] Error consuming ${kind}:`, error);
      } finally {
        pendingConsumersRef.current.delete(consumerKey);
      }
    },
    [updateRemoteStream]
  );

  // Request existing producers
  const requestExistingProducers = useCallback(async () => {
    if (
      !socket ||
      !isReady ||
      !sessionId ||
      !userId ||
      !stateManagerRef.current?.isReady()
    ) {
      console.log(
        "⏭️ [CameraStream] Cannot request existing producers - not ready"
      );
      return;
    }

    console.log("🔍 [CameraStream] Requesting existing producers...");

    try {
      socket.emit("get_existing_producers", { sessionId }, (response: any) => {
        if (response.success && response.producers) {
          console.log(
            `🎬 [CameraStream] Found ${response.producers.length} existing producers:`,
            response.producers
          );

          const otherProducers = response.producers.filter(
            (producer: any) => producer.peerId !== userId
          );

          console.log(
            `📋 [CameraStream] Will consume ${otherProducers.length} producers from other peers`
          );

          otherProducers.forEach((producer: any, index: number) => {
            setTimeout(() => {
              if (mountedRef.current) {
                console.log(
                  `📺 [CameraStream] Auto-consuming ${producer.kind} from ${producer.peerId}`
                );
                consumeMedia(
                  producer.producerId,
                  producer.peerId,
                  producer.kind
                );
              }
            }, index * 500);
          });
        } else {
          console.log("ℹ️ [CameraStream] No existing producers found");
        }
      });
    } catch (error) {
      console.error(
        "❌ [CameraStream] Error requesting existing producers:",
        error
      );
    }
  }, [socket, isReady, sessionId, userId, consumeMedia]);

  // Initialize MediaSoup
  const initializeMediaSoup = useCallback(async () => {
    if (
      !socket ||
      !isReady ||
      !sessionId ||
      !userId ||
      !mountedRef.current ||
      isInitializingRef.current
    ) {
      console.log("⏭️ [CameraStream] Skipping MediaSoup init - not ready", {
        socket: !!socket,
        isReady,
        sessionId: !!sessionId,
        userId: !!userId,
        mounted: mountedRef.current,
        initializing: isInitializingRef.current,
      });
      return;
    }

    if (!localStreamReady || !localStreamRef.current) {
      console.log(
        "⏭️ [CameraStream] Skipping MediaSoup init - local stream not ready",
        {
          localStreamReady,
          hasLocalStream: !!localStreamRef.current,
        }
      );
      return;
    }

    console.log("🔧 [CameraStream] Initializing MediaSoup...");
    isInitializingRef.current = true;
    setConnectionState("connecting");

    try {
      producerFailureCountRef.current.clear();

      // Create state manager
      stateManagerRef.current = new MediaSoupStateManager(
        deviceRef,
        sendTransportRef,
        recvTransportRef,
        socket,
        sessionId,
        userId,
        producersRef,
        consumersRef,
        handleError
      );

      // Initialize MediaSoup with state manager
      await stateManagerRef.current.initialize();

      if (mountedRef.current) {
        setConnectionState("connected");
        console.log("✅ [CameraStream] MediaSoup initialized successfully");

        // Notify WebSocket that peer is ready
        socket.emit("peer_ready_for_consumption", {
          sessionId,
          peerId: userId,
        });

        // Produce media if we have a local stream
        if (
          localStreamRef.current &&
          localStreamReady &&
          stateManagerRef.current.isReady()
        ) {
          try {
            console.log("🎬 [CameraStream] Starting media production...");
            await stateManagerRef.current.produceMedia(localStreamRef.current);

            if (socket && sessionId && userId) {
              console.log(
                "📢 [CameraStream] Emitting peer_ready_for_consumption after producing"
              );
              socket.emit("peer_ready_for_consumption", {
                sessionId,
                peerId: userId,
              });
            }

            // Request existing producers after we've set up our own
            setTimeout(() => {
              if (mountedRef.current) {
                requestExistingProducers();
              }
            }, 2000);
          } catch (error) {
            console.error("❌ [CameraStream] Failed to produce media:", error);
          }
        } else {
          console.log(
            "⏳ [CameraStream] Local stream not ready yet, will produce later"
          );
        }
      }
    } catch (error) {
      console.error("❌ [CameraStream] MediaSoup initialization error:", error);
      if (mountedRef.current) {
        handleError(error, "MediaSoup initialization failed", false);
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    socket,
    isReady,
    sessionId,
    userId,
    localStreamReady,
    handleError,
    requestExistingProducers,
  ]);

  // Handle new producer events
  const handleNewProducer = useCallback(
    (data: any) => {
      console.log("🆕 [CameraStream] New producer event:", data);

      if (!deduplicateProducerEvent(data)) {
        console.log("⏭️ [CameraStream] Duplicate producer event skipped");
        return;
      }

      if (
        data.userId !== userId &&
        data.sessionId === sessionId &&
        mountedRef.current
      ) {
        console.log(
          `📺 [CameraStream] Immediately consuming ${data.kind} from ${data.userId}`
        );

        if (stateManagerRef.current?.isReady()) {
          // Delay slightly to ensure no conflicts
          setTimeout(() => {
            if (mountedRef.current) {
              consumeMedia(data.producerId, data.userId, data.kind);
            }
          }, 500);
        } else {
          console.warn(
            "⚠️ [CameraStream] State manager not ready for consumption"
          );
        }
      }
    },
    [userId, sessionId, consumeMedia, deduplicateProducerEvent]
  );

  // Handle producer closed events
  const handleProducerClosed = useCallback(
    (data: any) => {
      console.log("🔚 [CameraStream] Producer closed:", data);

      for (const [consumerId, consumer] of consumersRef.current as any) {
        if (consumer.producerId === data.producerId) {
          consumer.close();
          consumersRef.current.delete(consumerId);

          const trackToRemove = Array.from(
            remoteTracksRef.current.entries()
          ).find(([_, track]) => track === consumer.track);

          if (trackToRemove) {
            remoteTracksRef.current.delete(trackToRemove[0]);
            updateRemoteStream();
          }
          break;
        }
      }
    },
    [updateRemoteStream]
  );

  // BID EVENT HANDLERS
  const handleBidPlaced = useCallback(
    (data: any) => {
      console.log("💰 [CameraStream] Bid placed:", data);
      setIncomingBids((prev) => [...prev, data]);
      setBidConnectionState("waiting");
      onBidReceived?.(data);
    },
    [onBidReceived]
  );

  const handleBidAccepted = useCallback(
    (data: any) => {
      console.log("✅ [CameraStream] Bid accepted:", data);
      setAcceptedBid(data);
      setBidConnectionState("connecting");
      setIncomingBids([]);
      onBidAccepted?.(data);
    },
    [onBidAccepted]
  );

  const handleBidRejected = useCallback(
    (data: any) => {
      console.log("🚫 [CameraStream] Bid rejected:", data);
      setIncomingBids((prev) => prev.filter((bid) => bid.bidId !== data.bidId));
      onBidRejected?.(data);
    },
    [onBidRejected]
  );

  const handlePeerReady = (data: any) => {
    console.log("🎯 [CameraStream] Peer ready for consumption:", data);

    if (data.peerId !== userId && data.sessionId === sessionId) {
      // Send our existing producers to the newly ready peer
      const producers = producersRef.current;
      if (producers.size > 0 && socket) {
        producers.forEach((producer, kind) => {
          if (!producer.closed) {
            console.log(
              `📤 [CameraStream] Notifying ready peer about our ${kind} producer`
            );
            socket.emit("NEW_PRODUCER", {
              sessionId,
              producerId: producer.id,
              userId,
              kind,
              targetPeerId: data.peerId, // Send specifically to this peer
            });
          }
        });
      }
    }
  };

  // Main initialization effect
  useEffect(() => {
    if (!isMounted || !sessionId || !userId) {
      console.log("⏭️ [CameraStream] Skipping initialization - not ready:", {
        isMounted,
        sessionId: !!sessionId,
        userId: !!userId,
      });
      return;
    }

    console.log("🚀 [CameraStream] Starting initialization sequence...");

    const initializeSequence = async () => {
      try {
        setConnectionState("initializing");
        isInitializingRef.current = true;

        // Step 1: Initialize local stream
        console.log("📹 [CameraStream] Step 1: Initializing local stream...");
        const stream = await initializeLocalStream();

        if (!mountedRef.current || !stream) {
          console.log(
            "❌ [CameraStream] Failed to initialize local stream or unmounted"
          );
          isInitializingRef.current = false;
          return;
        }

        // Step 2: Set stream ready state
        console.log(
          "✅ [CameraStream] Local stream initialized, setting ready state"
        );
        setLocalStreamReady(true);
        setLocalVideoReady(true);

        // Step 3: Initialize MediaSoup after delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (mountedRef.current && localStreamRef.current) {
          console.log("🔧 [CameraStream] Step 2: Initializing MediaSoup...");
          await initializeMediaSoup();
        }
      } catch (error) {
        console.error(
          "❌ [CameraStream] Initialization sequence failed:",
          error
        );
        setConnectionState("failed");
        setLastError(
          `Initialization failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeSequence();
  }, [isMounted, sessionId, userId, initializeLocalStream, initializeMediaSoup]);

  // Handle MediaSoup initialization when stream becomes ready
  useEffect(() => {
    if (
      localStreamReady &&
      localStreamRef.current &&
      !stateManagerRef.current &&
      !isInitializingRef.current &&
      mountedRef.current &&
      sessionId &&
      userId &&
      isMounted
    ) {
      console.log(
        "🔧 [CameraStream] Local stream ready, initializing MediaSoup..."
      );

      setTimeout(() => {
        if (
          mountedRef.current &&
          localStreamReady &&
          !stateManagerRef.current
        ) {
          initializeMediaSoup();
        }
      }, 500);
    }
  }, [localStreamReady, sessionId, userId, isMounted, initializeMediaSoup]);

  // Produce media when both stream and MediaSoup are ready
  useEffect(() => {
    if (
      localStreamReady &&
      localStreamRef.current &&
      stateManagerRef.current?.isReady() &&
      !isProducingRef.current &&
      mountedRef.current &&
      connectionState === "connected"
    ) {
      console.log(
        "🔄 [CameraStream] Both stream and MediaSoup ready, producing media..."
      );
      isProducingRef.current = true;

      stateManagerRef.current
        .produceMedia(localStreamRef.current)
        .then(() => {
          console.log("✅ [CameraStream] Media production completed");
          setTimeout(() => {
            if (mountedRef.current) {
              requestExistingProducers();
            }
          }, 1000);
        })
        .catch((error) => {
          console.error("❌ [CameraStream] Failed to produce media:", error);
        })
        .finally(() => {
          setTimeout(() => {
            isProducingRef.current = false;
          }, 5000);
        });
    }
  }, [localStreamReady, connectionState, requestExistingProducers]);

  // Handle audio mute
  useEffect(() => {
    if (localStreamRef.current && mountedRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Expose video refs to parent
  useEffect(() => {
    if (onVideoRefsReady) {
      onVideoRefsReady({
        localVideoRef,
        remoteVideoRef,
        localStreamRef,
        remoteStreamRef,
      });
    }
  }, [onVideoRefsReady, localVideoReady]);

  // Setup event listeners (including bid events)
  useEffect(() => {
    if (!addEventListener || !removeEventListener) return;

    addEventListener("NEW_PRODUCER", handleNewProducer);
    addEventListener("PRODUCER_CLOSED", handleProducerClosed);

    // BID EVENT LISTENERS
    addEventListener("BID_PLACED", handleBidPlaced);
    addEventListener("NEW_BID", handleBidPlaced);
    addEventListener("BID_ACCEPTED", handleBidAccepted);
    addEventListener("BID_REJECTED", handleBidRejected);
    addEventListener("PEER_READY_FOR_CONSUMPTION", handlePeerReady);

    return () => {
      removeEventListener("NEW_PRODUCER", handleNewProducer);
      removeEventListener("PRODUCER_CLOSED", handleProducerClosed);

      // REMOVE BID EVENT LISTENERS
      removeEventListener("BID_PLACED", handleBidPlaced);
      removeEventListener("NEW_BID", handleBidPlaced);
      removeEventListener("BID_ACCEPTED", handleBidAccepted);
      removeEventListener("BID_REJECTED", handleBidRejected);
      removeEventListener("PEER_READY_FOR_CONSUMPTION", handlePeerReady);
    };
  }, [addEventListener, removeEventListener, handleNewProducer, handleProducerClosed, handleBidPlaced, handleBidAccepted, handleBidRejected]);

  // Handle device selector toggle
  useEffect(() => {
    setShowDeviceModal(showDeviceSelector);
  }, [showDeviceSelector]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Component cleanup
  useEffect(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    return () => {
      console.log("🧹 [CameraStream] Scheduling cleanup...");

      isProducingRef.current = false;
      isInitializingRef.current = false;
      isDeviceSwitchingRef.current = false;

      producerFailureCountRef.current.clear();
      pendingConsumersRef.current.clear();

      if (stateManagerRef.current) {
        stateManagerRef.current.cleanup();
        stateManagerRef.current = null;
      }

      consumersRef.current.forEach((consumer) => {
        try {
          consumer.close();
        } catch (e) {}
      });
      consumersRef.current.clear();

      producersRef.current.forEach((producer) => {
        try {
          producer.close();
        } catch (e) {}
      });
      producersRef.current.clear();

      try {
        if (sendTransportRef.current && !sendTransportRef.current.closed) {
          sendTransportRef.current.close();
        }
      } catch (e) {}

      try {
        if (recvTransportRef.current && !recvTransportRef.current.closed) {
          recvTransportRef.current.close();
        }
      } catch (e) {}

      remoteTracksRef.current.clear();

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (localHiddenVideoRef.current) {
        localHiddenVideoRef.current.srcObject = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (localStreamRef.current) {
        cleanupTimeoutRef.current = setTimeout(() => {
          console.log("🛑 [CameraStream] Stopping local stream tracks");
          localStreamRef.current?.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (e) {}
          });
          localStreamRef.current = null;
        }, 0);
      }
    };
  }, []);

  // Render connection status
  const renderConnectionStatus = () => {
    const stateManagerState = stateManagerRef.current?.getState() || "idle";

    switch (connectionState) {
      case "connecting":
      case "initializing":
        return (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Establishing video connection...</p>
              <p className="text-xs opacity-75 mt-1">
                State: {stateManagerState}
              </p>
            </div>
          </div>
        );
      case "failed":
        const totalFailures = Array.from(
          producerFailureCountRef.current.values()
        ).reduce((sum, count) => sum + count, 0);
        return (
          <div className="absolute inset-0 bg-red-900 bg-opacity-50 flex items-center justify-center z-30">
            <div className="text-white text-center max-w-sm p-4">
              <div className="text-2xl mb-2">⚠️</div>
              <p className="mb-2">Connection Failed</p>
              <p className="text-xs opacity-75 mb-2">{lastError}</p>
              <p className="text-xs opacity-75 mb-3">
                Failures: {totalFailures}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setConnectionState("idle");
                    setLastError(null);
                    producerFailureCountRef.current.clear();
                    if (stateManagerRef.current) {
                      stateManagerRef.current.cleanup();
                      stateManagerRef.current = null;
                    }
                    if (sessionId && userId) {
                      setTimeout(() => initializeMediaSoup(), 1000);
                    }
                  }}
                  className="px-4 py-2 bg-white text-red-900 rounded text-sm mr-2"
                  disabled={totalFailures >= 10}
                >
                  {totalFailures >= 10
                    ? "Too Many Failures"
                    : "Retry Connection"}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded text-sm"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Click handler to ensure video plays
  const handleVideoClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (video) {
        video.play().catch(console.warn);
      }
    },
    []
  );

  // Determine what to show
  const shouldShowRemoteVideo =
    isRemotePlaying && remoteTracksRef.current.size > 0;
  const shouldShowLocalVideo = isLocalPlaying || localStreamReady;

  // Render main video based on role
  const renderMainVideo = () => {
    if (isInfluencer) {
      // Influencer: Show remote when available, otherwise local
      if (shouldShowRemoteVideo) {
        return (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            onClick={handleVideoClick}
            onPlaying={() => setIsRemotePlaying(true)}
            onPause={() => setIsRemotePlaying(false)}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              video.play().catch(console.warn);
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer bg-black"
            style={{ zIndex: 10 }}
          />
        );
      } else if (shouldShowLocalVideo) {
        if (isSafari) {
          return (
            <>
              <video
                ref={localHiddenVideoRef}
                autoPlay
                playsInline
                muted={true}
                style={{ display: "none" }}
              />
              <canvas
                ref={localCanvasRef}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                style={{ backgroundColor: "#000", zIndex: 10 }}
                onClick={() =>
                  handleVideoClick({
                    currentTarget: localHiddenVideoRef.current,
                  } as any)
                }
              />
            </>
          );
        } else {
          return (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted={true}
              onClick={handleVideoClick}
              onPlaying={() => setIsLocalPlaying(true)}
              onPause={() => setIsLocalPlaying(false)}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                video.play().catch(console.warn);
              }}
              className="absolute inset-0 w-full h-full object-cover cursor-pointer bg-black"
              style={{ zIndex: 10 }}
            />
          );
        }
      } else {
        return (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <p className="text-white">Initializing camera...</p>
          </div>
        );
      }
    } else {
      // Explorer: Show remote when available, otherwise waiting message
      if (shouldShowRemoteVideo) {
        return (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            onClick={handleVideoClick}
            onPlaying={() => setIsRemotePlaying(true)}
            onPause={() => setIsRemotePlaying(false)}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              video.play().catch(console.warn);
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer bg-black"
            style={{ zIndex: 10 }}
          />
        );
      } else {
        return (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-pulse mb-2">📺</div>
              <p>Waiting for streamer...</p>
            </div>
          </div>
        );
      }
    }
  };

  // Render PiP video for influencer when remote is active
  const renderPipVideo = () => {
    if (!isInfluencer || !shouldShowRemoteVideo || !shouldShowLocalVideo) {
      return null;
    }

    if (isSafari) {
      // Safari: PiP shows canvas
      return (
        <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg shadow-lg overflow-hidden z-20 bg-gray-900">
          <canvas
            ref={localCanvasRef}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() =>
              handleVideoClick({
                currentTarget: localHiddenVideoRef.current,
              } as any)
            }
          />
        </div>
      );
    } else {
      return (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted={true}
          onClick={handleVideoClick}
          onPlaying={() => setIsLocalPlaying(true)}
          onPause={() => setIsLocalPlaying(false)}
          className="absolute bottom-4 right-4 w-32 h-24 object-cover rounded-lg shadow-lg z-20 cursor-pointer bg-gray-900"
        />
      );
    }
  };

  // BID STATUS OVERLAY (for explorers waiting for bid acceptance)
  const renderBidStatus = () => {
    if (!isExplorer || bidConnectionState === "none") return null;

    return (
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg z-30">
        {bidConnectionState === "waiting" && (
          <>
            <div className="flex items-center space-x-2">
              <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm">Waiting for bid acceptance...</span>
            </div>
            {incomingBids.length > 0 && (
              <p className="text-xs opacity-75 mt-1">
                Your bid: ${incomingBids[0].amount}
              </p>
            )}
          </>
        )}

        {bidConnectionState === "connecting" && acceptedBid && (
          <>
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
              <span className="text-sm">Bid accepted! Connecting...</span>
            </div>
            <p className="text-xs opacity-75 mt-1">
              Amount: ${acceptedBid.amount}
            </p>
          </>
        )}

        {bidConnectionState === "connected" && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm">Connected</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Main video */}
      {renderMainVideo()}

      {/* PiP video */}
      {renderPipVideo()}

      {/* Bid status overlay for explorers */}
      {renderBidStatus()}

      {/* Device settings button */}
      <button
        onClick={() => {
          setShowDeviceModal(true);
          onDeviceSelectorToggle?.(true);
        }}
        className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all z-30"
        title="Camera & Microphone Settings"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Debug info - only in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs max-w-xs z-30">
          <p>
            <strong>Role:</strong> {isInfluencer ? "Broadcasting" : "Watching"}
          </p>
          <p>
            <strong>Mounted:</strong> {isMounted ? "✅" : "❌"}
          </p>
          <p>
            <strong>Local Stream:</strong> {localStreamReady ? "✅" : "❌"}
          </p>
          <p>
            <strong>Local Playing:</strong> {isLocalPlaying ? "✅" : "❌"}
          </p>
          <p>
            <strong>Remote Playing:</strong> {isRemotePlaying ? "✅" : "❌"}
          </p>
          <p>
            <strong>State:</strong>{" "}
            {stateManagerRef.current?.getState() || "idle"}
          </p>
          <p>
            <strong>Connection:</strong> {connectionState}
          </p>
          <p>
            <strong>Producers:</strong> {producersRef.current.size}
          </p>
          <p>
            <strong>Consumers:</strong> {consumersRef.current.size}
          </p>
          <p>
            <strong>Remote Tracks:</strong> {remoteTracksRef.current.size}
          </p>

          {/* Bid info for debugging */}
          {(isInfluencer || isExplorer) && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <p>
                <strong>Bid State:</strong> {bidConnectionState}
              </p>
              <p>
                <strong>Incoming Bids:</strong> {incomingBids.length}
              </p>
              {acceptedBid && (
                <p>
                  <strong>Accepted Bid:</strong> ${acceptedBid.amount}
                </p>
              )}
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-gray-600">
            <p className="mb-1">
              <strong>Manual Controls:</strong>
            </p>
            <div className="flex gap-1 flex-wrap">
              {localStreamReady && !stateManagerRef.current && (
                <button
                  onClick={() => {
                    console.log(
                      "🔧 [Manual] Triggering MediaSoup initialization"
                    );
                    initializeMediaSoup();
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                >
                  Start MediaSoup
                </button>
              )}

              <button
                onClick={() => {
                  if (localVideoRef.current && localStreamRef.current) {
                    console.log("🔄 [Manual] Refreshing local video");
                    localVideoRef.current.srcObject = null;
                    setTimeout(() => {
                      if (localVideoRef.current && localStreamRef.current) {
                        localVideoRef.current.srcObject =
                          localStreamRef.current;
                        localVideoRef.current.play().catch(console.error);
                      }
                    }, 100);
                  }
                }}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
              >
                Refresh Local
              </button>

              <button
                onClick={() => {
                  if (remoteVideoRef.current) {
                    console.log("🔄 [Manual] Force playing remote video");
                    remoteVideoRef.current
                      .play()
                      .then(() => {
                        console.log("✅ Remote video playing");
                      })
                      .catch((error) => {
                        console.error("❌ Remote play failed:", error);
                      });
                  }
                }}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
              >
                Play Remote
              </button>

              <button
                onClick={() => {
                  updateRemoteStream();
                }}
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
              >
                Update Remote
              </button>
            </div>
          </div>

          {lastError && (
            <div className="mt-2 pt-2 border-t border-red-600">
              <p className="text-red-300 text-xs">{lastError}</p>
            </div>
          )}
        </div>
      )}

      {/* Connection status overlay */}
      {renderConnectionStatus()}

      {/* Device Selection Modal */}
      <DeviceSelectionModal
        isOpen={showDeviceModal}
        onClose={() => {
          setShowDeviceModal(false);
          onDeviceSelectorToggle?.(false);
        }}
        onDeviceChange={handleDeviceChange}
        currentVideoDeviceId={mediaDevices.selectedVideoDevice || undefined}
        currentAudioDeviceId={
          mediaDevices.selectedAudioInputDevice || undefined
        }
        currentAudioOutputDeviceId={
          mediaDevices.selectedAudioOutputDevice || undefined
        }
      />

      {/* Hidden video element for Safari if not used in main display */}
      {isSafari && !shouldShowRemoteVideo && (
        <video
          ref={localHiddenVideoRef}
          autoPlay
          playsInline
          muted={true}
          style={{ display: "none" }}
        />
      )}
    </>
  );
});

CameraStream.displayName = "CameraStream";

export default CameraStream;
