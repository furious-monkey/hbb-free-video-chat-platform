// frontend/src/context/WebSocketContext.tsx - Fixed with better error handling and state management
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { shallow } from "zustand/shallow";
import { useUserStore } from "../store/userStore";

interface StreamSession {
  id: string;
  influencerId: string;
  currentExplorerId?: string;
  status: "PENDING" | "LIVE" | "ENDED";
  allowBids: boolean;
  startTime?: Date;
  endTime?: Date;
  earnings: number;
  callRate?: number;
}

interface Bid {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName?: string;
  timestamp: Date;
  status?: "pending" | "accepted" | "rejected" | "outbid";
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  currentSession: StreamSession | null;
  bids: Bid[];
  highestBid: number;
  actions: {
    createStream: (allowBids: boolean, callRate: string) => void;
    joinStream: (sessionId: string) => void;
    endStream: (sessionId: string) => void;
    placeBid: (sessionId: string, amount: number) => void;
    acceptBid: (bidId: string) => void;
    rejectBid: (bidId: string) => void;
    leaveSession: (sessionId: string) => void;
    getExistingProducers: (sessionId: string, callback?: Function) => void;
  };
  addEventListener: (event: string, handler: Function) => () => void;
  removeEventListener: (event: string, handler: Function) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Fixed: MediaSoup-compatible events that should bypass requestId enhancement
const MEDIASOUP_EVENTS = new Set([
  "mediasoup_getRouterRtpCapabilities",
  "mediasoup_createWebRtcTransport",
  "mediasoup_connectWebRtcTransport",
  "mediasoup_createProducer",
  "mediasoup_createConsumer",
  "mediasoup_pauseProducer",
  "mediasoup_resumeProducer",
  "mediasoup_pauseConsumer",
  "mediasoup_resumeConsumer",
  "mediasoup_closeProducer",
  "mediasoup_closeConsumer",
  "get_existing_producers",
  "peer_ready_for_consumption",
]);

// Enhanced WebSocket Manager with improved MediaSoup compatibility and state management
class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private currentUserId: string | null = null;
  private eventEmitter = new EventTarget();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private messageQueue: Array<{
    event: string;
    data: any;
    callback?: Function;
  }> = [];
  private activeRequests = new Map<
    string,
    { timeout: NodeJS.Timeout; callback: Function }
  >();
  private requestTimeout = 30000; // 30 seconds
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private connectionTimeout: NodeJS.Timeout | null = null;
  
  // Enhanced: Connection health tracking
  private connectionHealth: "excellent" | "good" | "fair" | "poor" = "poor";
  private consecutiveFailures = 0;
  private lastSuccessfulMessage = 0;

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Fixed: Direct emit for MediaSoup events (no requestId)
  private emitDirect(event: string, data: any, callback?: Function): void {
    if (this.socket && this.isAuthenticated) {
      console.log(`🚀 [WebSocket] Direct emit: ${event}`, data);
      this.socket.emit(event, data, callback);
      this.lastSuccessfulMessage = Date.now();
      this.consecutiveFailures = 0;
    } else {
      console.log(`📝 [WebSocket] Queuing direct emit: ${event}`);
      this.messageQueue.push({ event, data, callback });
    }
  }

  // Fixed: Enhanced emit with requestId for non-MediaSoup events
  private emitWithTimeout(
    event: string,
    data: any,
    callback?: Function,
    timeout = this.requestTimeout
  ): void {
    // Fixed: Check if this is a MediaSoup event
    if (MEDIASOUP_EVENTS.has(event)) {
      this.emitDirect(event, data, callback);
      return;
    }

    const requestId = this.generateRequestId();
    const enhancedData = { ...data, requestId };

    // Set up timeout
    const timeoutId = setTimeout(() => {
      this.activeRequests.delete(requestId);
      this.consecutiveFailures++;
      console.warn(`⏰ [WebSocket] Request timeout for ${event} (${requestId})`);
      if (callback) {
        callback({ success: false, error: "Request timeout" });
      }
    }, timeout);

    // Store request
    if (callback) {
      this.activeRequests.set(requestId, { timeout: timeoutId, callback });
    }

    // Emit event
    if (this.socket && this.isAuthenticated) {
      console.log(`🚀 [WebSocket] Enhanced emit: ${event}`, enhancedData);
      this.socket.emit(event, enhancedData, (response: any) => {
        const request = this.activeRequests.get(requestId);
        if (request) {
          clearTimeout(request.timeout);
          this.activeRequests.delete(requestId);
          this.lastSuccessfulMessage = Date.now();
          this.consecutiveFailures = 0;
          request.callback(response);
        }
      });
    } else {
      console.log(`📝 [WebSocket] Queuing enhanced emit: ${event}`);
      this.messageQueue.push({ event, data: enhancedData, callback });
    }
  }

  private updateConnectionHealth(): void {
    const now = Date.now();
    const timeSinceLastSuccess = now - this.lastSuccessfulMessage;
    
    if (!this.isConnected) {
      this.connectionHealth = "poor";
    } else if (this.consecutiveFailures >= 3) {
      this.connectionHealth = "poor";
    } else if (timeSinceLastSuccess > 60000) { // 1 minute
      this.connectionHealth = "fair";
    } else if (this.lastPingTime < 50) {
      this.connectionHealth = "excellent";
    } else if (this.lastPingTime < 150) {
      this.connectionHealth = "good";
    } else {
      this.connectionHealth = "fair";
    }
  }

  private setupHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        const startTime = Date.now();
        this.socket.emit("ping", (response: string) => {
          if (response === "pong") {
            this.lastPingTime = Date.now() - startTime;
            this.updateConnectionHealth();
          }
        });
      }
    }, 25000); // Every 25 seconds
  }

  private clearHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private emitStateChange() {
    this.updateConnectionHealth();
    this.eventEmitter.dispatchEvent(
      new CustomEvent("stateChange", {
        detail: {
          socket: this.socket,
          isConnected: this.isConnected,
          isAuthenticated: this.isAuthenticated,
          isReady: this.isConnected && this.isAuthenticated,
          connectionHealth: this.connectionHealth,
          consecutiveFailures: this.consecutiveFailures,
          lastSuccessfulMessage: this.lastSuccessfulMessage,
        },
      })
    );
  }

  private processMessageQueue() {
    if (this.isAuthenticated && this.socket && this.messageQueue.length > 0) {
      console.log(
        `📤 [WebSocket] Processing ${this.messageQueue.length} queued messages`
      );
      const queue = [...this.messageQueue];
      this.messageQueue = [];

      queue.forEach(({ event, data, callback }) => {
        // Use appropriate emit method based on event type
        if (MEDIASOUP_EVENTS.has(event)) {
          this.emitDirect(event, data, callback);
        } else {
          this.emitWithTimeout(event, data, callback);
        }
      });
    }
  }

  private setupSocketListeners(socket: Socket) {
    // Enhanced connection event handlers
    socket.on("connect", () => {
      console.log("🔗 [WebSocket] Connected", {
        socketId: socket.id,
        transport: (socket.io.engine as any)?.transport?.name,
      });
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.consecutiveFailures = 0;
      this.lastSuccessfulMessage = Date.now();
      this.emitStateChange();
      this.setupHeartbeat();

      if (this.currentUserId) {
        console.log("🔐 [WebSocket] Authenticating user:", this.currentUserId);
        socket.emit("authenticate", { userId: this.currentUserId });
      } else {
        console.warn("⚠️ [WebSocket] Connected but no userId available for authentication");
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 [WebSocket] Disconnected:", reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.clearHeartbeat();
      this.emitStateChange();

      // Clear all active requests
      this.activeRequests.forEach(({ timeout, callback }) => {
        clearTimeout(timeout);
        callback({ success: false, error: "Disconnected" });
      });
      this.activeRequests.clear();
    });

    socket.on("connect_error", (error: Error) => {
      const errorInfo: any = {
        error: error.message,
        stack: error.stack,
      };
      
      // Try to extract additional error info if available
      if ((error as any).type) errorInfo.type = (error as any).type;
      if ((error as any).description) errorInfo.description = (error as any).description;
      if ((error as any).context) errorInfo.context = (error as any).context;
      
      console.error("❌ [WebSocket] Connection error:", errorInfo);
      this.reconnectAttempts++;
      this.consecutiveFailures++;
      this.isConnected = false;
      this.isAuthenticated = false;
      this.emitStateChange();

      // Clear connection timeout if still set
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(`❌ [WebSocket] Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
        this.emitToListeners("CONNECTION_FAILED", {
          message: "Unable to establish connection",
          attempts: this.reconnectAttempts,
          error: error.message,
        });
      } else {
        console.log(`🔄 [WebSocket] Will retry connection (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(
        "🔄 [WebSocket] Reconnected after",
        attemptNumber,
        "attempts"
      );
      this.consecutiveFailures = 0;
      this.emitToListeners("CONNECTION_RESTORED", {
        attempts: attemptNumber,
      });
    });

    // Enhanced authentication handling
    socket.on("USER_CONNECTED", (data) => {
      console.log("✅ [WebSocket] User authenticated:", data);
      this.isAuthenticated = true;
      this.lastSuccessfulMessage = Date.now();
      this.emitStateChange();
      this.processMessageQueue();
    });

    socket.on("ERROR", (data) => {
      console.error("❌ [WebSocket] Server error:", data);
      this.consecutiveFailures++;
      this.emitToListeners("ERROR", data);
    });

    // Enhanced bid events with deduplication and better error handling
    const bidEventCache = new Map<string, number>();
    const deduplicateBidEvent = (eventName: string, data: any, ttl = 5000) => {
      const key = `${eventName}_${data.bidId || data.sessionId}_${
        data.bidderId || ""
      }`;
      const now = Date.now();
      const lastEmit = bidEventCache.get(key);

      if (lastEmit && now - lastEmit < ttl) {
        return false; // Duplicate
      }

      bidEventCache.set(key, now);

      // Clean old entries
      if (bidEventCache.size > 100) {
        const cutoff = now - ttl;
        Array.from(bidEventCache.entries()).forEach(([k, v]) => {
          if (v < cutoff) bidEventCache.delete(k);
        });
      }

      return true;
    };

    // Bid event handlers with enhanced logging
    socket.on("BID_PLACED", (data) => {
      if (deduplicateBidEvent("BID_PLACED", data)) {
        console.log("💰 [WebSocket] BID_PLACED:", data);
        this.emitToListeners("BID_PLACED", data);
      }
    });

    socket.on("NEW_BID", (data) => {
      if (deduplicateBidEvent("NEW_BID", data)) {
        console.log("🆕 [WebSocket] NEW_BID:", data);
        this.emitToListeners("NEW_BID", data);
      }
    });

    socket.on("BID_ACCEPTED", (data) => {
      if (deduplicateBidEvent("BID_ACCEPTED", data)) {
        console.log("✅ [WebSocket] BID_ACCEPTED:", data);
        this.emitToListeners("BID_ACCEPTED", data);
      }
    });

    socket.on("BID_REJECTED", (data) => {
      if (deduplicateBidEvent("BID_REJECTED", data)) {
        console.log("🚫 [WebSocket] BID_REJECTED:", data);
        this.emitToListeners("BID_REJECTED", data);
      }
    });

    socket.on("OUTBID", (data) => {
      if (deduplicateBidEvent("OUTBID", data)) {
        console.log("📈 [WebSocket] OUTBID:", data);
        this.emitToListeners("OUTBID", data);
      }
    });

    // Stream management events
    socket.on("STREAM_CREATED", (data) => {
      console.log("🎬 [WebSocket] STREAM_CREATED:", data);
      this.emitToListeners("STREAM_CREATED", data);
    });

    socket.on("STREAM_JOINED", (data) => {
      console.log("👥 [WebSocket] STREAM_JOINED:", data);
      this.emitToListeners("STREAM_JOINED", data);
    });

    socket.on("STREAM_ENDED", (data) => {
      console.log("🔚 [WebSocket] STREAM_ENDED:", data);
      this.emitToListeners("STREAM_ENDED", data);
    });

    socket.on("SESSION_CREATED", (data) => {
      console.log("📺 [WebSocket] SESSION_CREATED:", data);
      this.emitToListeners("SESSION_CREATED", data);
    });

    socket.on("SESSION_JOINED", (data) => {
      console.log("🎯 [WebSocket] SESSION_JOINED:", data);
      this.emitToListeners("SESSION_JOINED", data);
    });

    socket.on("SESSION_ENDED", (data) => {
      console.log("🏁 [WebSocket] SESSION_ENDED:", data);
      this.emitToListeners("SESSION_ENDED", data);
    });

    socket.on("USER_DISCONNECTED", (data) => {
      console.log("👋 [WebSocket] USER_DISCONNECTED:", data);
      this.emitToListeners("USER_DISCONNECTED", data);
    });

    // Gift and earnings events
    socket.on("GIFT_SENT", (data) => {
      console.log("🎁 [WebSocket] GIFT_SENT:", data);
      this.emitToListeners("GIFT_SENT", data);
    });

    socket.on("GIFT_RECEIVED", (data) => {
      console.log("🎁 [WebSocket] GIFT_RECEIVED:", data);
      this.emitToListeners("GIFT_RECEIVED", data);
    });

    socket.on("EARNINGS_UPDATED", (data) => {
      console.log("💵 [WebSocket] EARNINGS_UPDATED:", data);
      this.emitToListeners("EARNINGS_UPDATED", data);
    });

    // Billing events
    socket.on("BILLING_STARTED", (data) => {
      console.log("💰 [WebSocket] BILLING_STARTED:", data);
      this.emitToListeners("BILLING_STARTED", data);
    });

    socket.on("BILLING_UPDATED", (data) => {
      console.log("💰 [WebSocket] BILLING_UPDATED:", data);
      this.emitToListeners("BILLING_UPDATED", data);
    });

    socket.on("BILLING_COMPLETED", (data) => {
      console.log("💰 [WebSocket] BILLING_COMPLETED:", data);
      this.emitToListeners("BILLING_COMPLETED", data);
    });

    socket.on("PAYMENT_FAILED", (data) => {
      console.log("❌ [WebSocket] PAYMENT_FAILED:", data);
      this.emitToListeners("PAYMENT_FAILED", data);
    });

    socket.on("REFUND_PROCESSED", (data) => {
      console.log("💸 [WebSocket] REFUND_PROCESSED:", data);
      this.emitToListeners("REFUND_PROCESSED", data);
    });

    // Enhanced MediaSoup event logging with better debugging
    socket.on("NEW_PRODUCER", (data) => {
      console.log("🎬 [WebSocket] NEW_PRODUCER event:", {
        sessionId: data.sessionId,
        producerId: data.producerId,
        userId: data.userId,
        kind: data.kind,
        sequenced: data.sequenced,
        existing: data.existing,
        broadcast: data.broadcast,
      });
      this.emitToListeners("NEW_PRODUCER", data);
    });

    socket.on("PRODUCER_CLOSED", (data) => {
      console.log("🔚 [WebSocket] PRODUCER_CLOSED event:", data);
      this.emitToListeners("PRODUCER_CLOSED", data);
    });

    // Enhanced: Handle existing producers response with better logging
    socket.on('EXISTING_PRODUCERS_RESPONSE', (data) => {
      console.log('📋 [WebSocket] EXISTING_PRODUCERS_RESPONSE:', {
        success: data.success,
        producerCount: data.producers?.length || 0,
        sessionId: data.sessionId,
        producers: data.producers?.map((p: any) => `${p.kind} from ${p.peerId}`),
      });
      this.emitToListeners('EXISTING_PRODUCERS_RESPONSE', data);
    });

    // Response events with enhanced logging
    socket.on("BID_PLACED_SUCCESS", (data) => {
      console.log("✅ [WebSocket] BID_PLACED_SUCCESS:", data);
      this.emitToListeners("BID_PLACED_SUCCESS", data);
    });

    socket.on("BID_PLACED_ERROR", (data) => {
      console.log("❌ [WebSocket] BID_PLACED_ERROR:", data);
      this.emitToListeners("BID_PLACED_ERROR", data);
    });

    socket.on("BID_ACCEPTED_SUCCESS", (data) => {
      console.log("✅ [WebSocket] BID_ACCEPTED_SUCCESS:", data);
      this.emitToListeners("BID_ACCEPTED_SUCCESS", data);
    });

    socket.on("BID_REJECTED_SUCCESS", (data) => {
      console.log("🚫 [WebSocket] BID_REJECTED_SUCCESS:", data);
      this.emitToListeners("BID_REJECTED_SUCCESS", data);
    });

    // Enhanced live feed updates with better state tracking
    socket.on("INFLUENCER_ONLINE", (data) => {
      console.log("🟢 [WebSocket] INFLUENCER_ONLINE:", data);
      this.emitToListeners("INFLUENCER_ONLINE", data);
    });

    socket.on("INFLUENCER_OFFLINE", (data) => {
      console.log("🔴 [WebSocket] INFLUENCER_OFFLINE:", data);
      this.emitToListeners("INFLUENCER_OFFLINE", data);
    });

    socket.on("INFLUENCERS_LIST_UPDATE", (data) => {
      console.log("📋 [WebSocket] INFLUENCERS_LIST_UPDATE:", data);
      this.emitToListeners("INFLUENCERS_LIST_UPDATE", data);
    });

    // Enhanced connection monitoring
    socket.on("pong", () => {
      // Handled in heartbeat logic
    });
  }

  private emitToListeners(eventName: string, data: any) {
    this.eventEmitter.dispatchEvent(
      new CustomEvent(eventName, { detail: data })
    );
  }

  // Enhanced emit methods with better MediaSoup support
  public emitGetExistingProducers(sessionId: string, callback?: Function): void {
    console.log(`📋 [WebSocket] Requesting existing producers for session: ${sessionId}`);
    this.emitDirect('get_existing_producers', { sessionId }, callback);
  }

  public emitPeerReadyForConsumption(sessionId: string, peerId: string): void {
    console.log(`✅ [WebSocket] Notifying peer ready for consumption: ${peerId} in ${sessionId}`);
    this.emitDirect('peer_ready_for_consumption', { sessionId, peerId });
  }

  // Enhanced connection management
  connect(userId: string): Socket | null {
    // FIXED: Check for healthy existing connection first
    if (
      this.socket &&
      this.currentUserId === userId &&
      this.socket.connected &&
      this.isAuthenticated &&
      this.connectionHealth !== 'poor'
    ) {
      console.log("🔄 [WebSocket] Already connected and authenticated with good health");
      return this.socket;
    }

    // FIXED: Check for connected but not authenticated
    if (
      this.socket &&
      this.currentUserId === userId &&
      this.socket.connected &&
      !this.isAuthenticated
    ) {
      console.log(
        "🔐 [WebSocket] Connected but not authenticated, authenticating..."
      );
      this.socket.emit("authenticate", { userId });
      return this.socket;
    }

    // FIXED: Clean up existing socket properly
    if (this.socket) {
      console.log("🔌 [WebSocket] Cleaning up existing socket");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.clearHeartbeat();
    }

    console.log("🚀 [WebSocket] Creating new connection for user:", userId);
    this.currentUserId = userId;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.consecutiveFailures = 0;
    this.lastSuccessfulMessage = 0;

    // Fixed: Use correct WebSocket URL with better fallback
    // Socket.IO client accepts both http:// and ws:// URLs and converts them appropriately
    let wsUrl = process.env.NEXT_PUBLIC_WEB_SOCKET_URL;
    
    if (!wsUrl && process.env.NEXT_PUBLIC_API_URL) {
      // Convert http:// to ws:// for socket.io
      wsUrl = process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws');
      // Ensure port is correct (default to 8000 for WebSocket server)
      if (!wsUrl.includes(':')) {
        wsUrl = wsUrl.replace(/(:\d+)?$/, ':8000');
      }
    }
    
    // Fallback to localhost with correct protocol
    if (!wsUrl) {
      wsUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : 'http://localhost:8000';
    }
    
    console.log("🌐 [WebSocket] Connecting to:", wsUrl);
    console.log("🔍 [WebSocket] Environment check:", {
      NEXT_PUBLIC_WEB_SOCKET_URL: process.env.NEXT_PUBLIC_WEB_SOCKET_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      finalUrl: wsUrl,
      userId,
    });

    this.socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { userId },
      forceNew: true, // FIXED: Force new connection
    });

    // Enhanced: Add connection timeout handler
    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        console.error("❌ [WebSocket] Connection timeout - failed to connect within 20 seconds");
        this.emitToListeners("CONNECTION_FAILED", {
          message: "Connection timeout",
          reason: "Failed to establish connection within timeout period",
        });
      }
    }, 20000);

    this.setupSocketListeners(this.socket);
    this.emitStateChange();

    return this.socket;
  }

  emit(event: string, data: any, callback?: Function) {
    this.emitWithTimeout(event, data, callback);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getState() {
    return {
      socket: this.socket,
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      isReady: this.isConnected && this.isAuthenticated,
      connectionHealth: this.connectionHealth,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessfulMessage: this.lastSuccessfulMessage,
    };
  }

  onStateChange(callback: (state: any) => void) {
    const handler = (event: any) => callback(event.detail);
    this.eventEmitter.addEventListener("stateChange", handler);
    return () => this.eventEmitter.removeEventListener("stateChange", handler);
  }

  addEventListener(eventName: string, handler: Function) {
    const wrappedHandler = (event: any) => handler(event.detail);
    this.eventEmitter.addEventListener(eventName, wrappedHandler);
    return () =>
      this.eventEmitter.removeEventListener(eventName, wrappedHandler);
  }

  removeEventListener(
    eventName: string,
    handler: EventListenerOrEventListenerObject
  ) {
    this.eventEmitter.removeEventListener(eventName, handler);
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 [WebSocket] Disconnecting...");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
      this.currentUserId = null;
      this.messageQueue = [];
      this.clearHeartbeat();

      // Clear all active requests
      this.activeRequests.forEach(({ timeout }) => clearTimeout(timeout));
      this.activeRequests.clear();

      this.emitStateChange();
    }
  }

  // Enhanced debugging methods
  getConnectionHealth(): "excellent" | "good" | "fair" | "poor" {
    return this.connectionHealth;
  }

  getDebugInfo() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      connectionHealth: this.connectionHealth,
      consecutiveFailures: this.consecutiveFailures,
      lastPingTime: this.lastPingTime,
      lastSuccessfulMessage: this.lastSuccessfulMessage,
      queuedMessages: this.messageQueue.length,
      activeRequests: this.activeRequests.size,
      reconnectAttempts: this.reconnectAttempts,
      currentUserId: this.currentUserId,
      socketId: this.socket?.id,
      socketConnected: this.socket?.connected,
    };
  }
}

const wsManager = WebSocketManager.getInstance();

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(wsManager.getSocket());
  const [isConnected, setIsConnected] = useState(
    wsManager.getState().isConnected
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    wsManager.getState().isAuthenticated
  );
  const [isReady, setIsReady] = useState(wsManager.getState().isReady);
  const [currentSession, setCurrentSession] = useState<StreamSession | null>(
    null
  );
  const [bids, setBids] = useState<Bid[]>([]);
  const [highestBid, setHighestBid] = useState<number>(0);
  const eventListenersRef = useRef<Map<string, Set<Function>>>(new Map());

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );
  const userId = userDetails?.id;

  // Fixed: Enhanced session and bid state management with better error handling
  useEffect(() => {
    const handleSessionCreated = (data: any) => {
      try {
        console.log("📺 [Context] Session created, updating state:", data);
        setCurrentSession({
          id: data.sessionId,
          influencerId: data.influencerId,
          status: data.status || 'LIVE',
          allowBids: data.allowBids,
          startTime: data.createdAt ? new Date(data.createdAt) : new Date(),
          earnings: 0,
          callRate: parseFloat(data.callRate) || 0,
        });
        // Clear previous bids when new session starts
        setBids([]);
        setHighestBid(0);
      } catch (error) {
        console.error("❌ [Context] Error handling SESSION_CREATED:", error);
      }
    };

    const handleSessionEnded = (data: any) => {
      try {
        console.log("🏁 [Context] Session ended, clearing state:", data);
        setCurrentSession(null);
        setBids([]);
        setHighestBid(0);
      } catch (error) {
        console.error("❌ [Context] Error handling SESSION_ENDED:", error);
      }
    };

    const handleNewBid = (data: any) => {
      try {
        console.log("💰 [Context] New bid received:", data);
        const newBid: Bid = {
          bidId: data.bidId,
          sessionId: data.sessionId,
          amount: data.amount,
          bidderId: data.bidderId,
          bidderName: data.bidderName,
          timestamp: new Date(data.timestamp),
          status: 'pending'
        };

        setBids(prevBids => {
          // Remove any existing bid from the same bidder
          const filteredBids = prevBids.filter(bid => bid.bidderId !== data.bidderId);
          return [...filteredBids, newBid].sort((a, b) => b.amount - a.amount);
        });

        // Update highest bid
        setHighestBid(prev => Math.max(prev, data.amount));
      } catch (error) {
        console.error("❌ [Context] Error handling NEW_BID:", error);
      }
    };

    const handleBidAccepted = (data: any) => {
      try {
        console.log("✅ [Context] Bid accepted:", data);
        setBids(prevBids => 
          prevBids.map(bid => 
            bid.bidId === data.bidId 
              ? { ...bid, status: 'accepted' as const }
              : { ...bid, status: 'rejected' as const }
          )
        );
      } catch (error) {
        console.error("❌ [Context] Error handling BID_ACCEPTED:", error);
      }
    };

    const handleBidRejected = (data: any) => {
      try {
        console.log("🚫 [Context] Bid rejected:", data);
        setBids(prevBids => 
          prevBids.map(bid => 
            bid.bidId === data.bidId 
              ? { ...bid, status: 'rejected' as const }
              : bid
          )
        );
      } catch (error) {
        console.error("❌ [Context] Error handling BID_REJECTED:", error);
      }
    };

    const handleOutbid = (data: any) => {
      try {
        console.log("📈 [Context] User outbid:", data);
        setBids(prevBids => 
          prevBids.map(bid => 
            bid.bidderId === data.previousBidderId 
              ? { ...bid, status: 'outbid' as const }
              : bid
          )
        );
        setHighestBid(data.newHighestBid);
      } catch (error) {
        console.error("❌ [Context] Error handling OUTBID:", error);
      }
    };

    // Register event listeners
    const unsubscribeSessionCreated = wsManager.addEventListener('SESSION_CREATED', handleSessionCreated);
    const unsubscribeSessionEnded = wsManager.addEventListener('SESSION_ENDED', handleSessionEnded);
    const unsubscribeNewBid = wsManager.addEventListener('NEW_BID', handleNewBid);
    const unsubscribeBidPlaced = wsManager.addEventListener('BID_PLACED', handleNewBid); // Handle both events
    const unsubscribeBidAccepted = wsManager.addEventListener('BID_ACCEPTED', handleBidAccepted);
    const unsubscribeBidRejected = wsManager.addEventListener('BID_REJECTED', handleBidRejected);
    const unsubscribeOutbid = wsManager.addEventListener('OUTBID', handleOutbid);

    return () => {
      unsubscribeSessionCreated();
      unsubscribeSessionEnded();
      unsubscribeNewBid();
      unsubscribeBidPlaced();
      unsubscribeBidAccepted();
      unsubscribeBidRejected();
      unsubscribeOutbid();
    };
  }, []);

  // Enhanced connection effect with better error handling and retry logic
  useEffect(() => {
    if (!userId) {
      console.log("⏭️ [Context] No userId available, skipping connection");
      return;
    }

    console.log("🔗 [Context] Connecting WebSocket for user:", userId);
    
    try {
      const connectedSocket = wsManager.connect(userId);
      setSocket(connectedSocket);
    } catch (error) {
      console.error("❌ [Context] Error connecting WebSocket:", error);
    }

    const unsubscribe = wsManager.onStateChange((state: any) => {
      console.log("🔄 [Context] WebSocket state changed:", {
        isConnected: state.isConnected,
        isAuthenticated: state.isAuthenticated,
        isReady: state.isReady,
        connectionHealth: state.connectionHealth
      });
      
      try {
        setSocket(state.socket);
        setIsConnected(state.isConnected);
        setIsAuthenticated(state.isAuthenticated);
        setIsReady(state.isReady);
      } catch (error) {
        console.error("❌ [Context] Error updating state:", error);
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error("❌ [Context] Error during cleanup:", error);
      }
    };
  }, [userId]);

  // Enhanced action handlers with better error handling and logging
  const createStream = useCallback((allowBids: boolean, callRate: string) => {
    try {
      console.log(`🎬 [Context] Creating stream: allowBids=${allowBids}, callRate=${callRate}`);
      
      // Check actual current state (both context and manager to be safe)
      const managerState = wsManager.getState();
      const actualReady = isReady || (isConnected && isAuthenticated) || managerState.isReady;
      
      console.log("🔍 [Context] Connection state check:", {
        contextReady: isReady,
        contextConnected: isConnected,
        contextAuthenticated: isAuthenticated,
        managerReady: managerState.isReady,
        managerConnected: managerState.isConnected,
        managerAuthenticated: managerState.isAuthenticated,
        actualReady,
        socketExists: !!socket,
        socketConnected: socket?.connected,
      });
      
      // If ready, proceed immediately
      if (actualReady && socket && socket.connected) {
        console.log("✅ [Context] WebSocket ready, creating stream immediately");
        wsManager.emit(
          "create_stream",
          { allowBids, callRate },
          (response: any) => {
            if (response?.success) {
              console.log("✅ [Context] Stream created successfully:", response.sessionId);
            } else {
              console.error("❌ [Context] Stream creation failed:", response?.error);
            }
          }
        );
        return;
      }
      
      // Not ready - handle based on current state
      console.warn("⚠️ [Context] WebSocket not ready, attempting to proceed or wait...");
      
      // If socket is connected but not authenticated, try authentication
      if (socket && socket.connected && !isAuthenticated && userId) {
        console.log("🔐 [Context] Socket connected but not authenticated, attempting authentication...");
        socket.emit("authenticate", { userId });
        
        // Wait for authentication, then retry
        const authCheckInterval = setInterval(() => {
          const currentState = wsManager.getState();
          if (currentState.isAuthenticated || (isConnected && isAuthenticated)) {
            clearInterval(authCheckInterval);
            console.log("✅ [Context] Authentication completed, creating stream...");
            wsManager.emit(
              "create_stream",
              { allowBids, callRate },
              (response: any) => {
                if (response?.success) {
                  console.log("✅ [Context] Stream created successfully:", response.sessionId);
                } else {
                  console.error("❌ [Context] Stream creation failed:", response?.error);
                }
              }
            );
          }
        }, 200);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(authCheckInterval), 5000);
        return;
      }
      
      // If not connected at all, wait for connection
      const maxWaitTime = 10000; // 10 seconds
      const startTime = Date.now();
      
      const checkReady = setInterval(() => {
        const currentManagerState = wsManager.getState();
        const currentReady = isReady || (isConnected && isAuthenticated) || currentManagerState.isReady;
        
        if (currentReady && socket && socket.connected) {
          clearInterval(checkReady);
          console.log("✅ [Context] WebSocket became ready, creating stream...");
          
          wsManager.emit(
            "create_stream",
            { allowBids, callRate },
            (response: any) => {
              if (response?.success) {
                console.log("✅ [Context] Stream created successfully:", response.sessionId);
              } else {
                console.error("❌ [Context] Stream creation failed:", response?.error);
              }
            }
          );
        } else if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkReady);
          console.error("❌ [Context] WebSocket did not become ready within timeout", {
            contextState: { isConnected, isAuthenticated, isReady },
            managerState: {
              isConnected: currentManagerState.isConnected,
              isAuthenticated: currentManagerState.isAuthenticated,
              isReady: currentManagerState.isReady,
            },
            socketExists: !!socket,
            socketConnected: socket?.connected,
          });
        }
      }, 200); // Check every 200ms
      
    } catch (error) {
      console.error("❌ [Context] Error in createStream:", error);
    }
  }, [userId, isReady, isConnected, isAuthenticated, socket]);

  const joinStream = useCallback((sessionId: string) => {
    try {
      console.log(`🎯 [Context] Joining stream: ${sessionId}`);
      
      if (!wsManager.getState().isReady) {
        console.error("❌ [Context] WebSocket not ready for joinStream");
        return;
      }
      
      wsManager.emit("join_stream", { sessionId }, (response: any) => {
        if (response?.success) {
          console.log("✅ [Context] Stream joined successfully");
        } else {
          console.error("❌ [Context] Stream join failed:", response?.error);
        }
      });
    } catch (error) {
      console.error("❌ [Context] Error in joinStream:", error);
    }
  }, []);

  const endStream = useCallback((sessionId: string) => {
    try {
      console.log(`🏁 [Context] Ending stream: ${sessionId}`);
      
      if (!wsManager.getState().isReady) {
        console.error("❌ [Context] WebSocket not ready for endStream");
        return;
      }
      
      wsManager.emit("end_stream", { sessionId }, (response: any) => {
        if (response?.success) {
          console.log("✅ [Context] Stream ended successfully");
        } else {
          console.error("❌ [Context] Stream end failed:", response?.error);
        }
      });
    } catch (error) {
      console.error("❌ [Context] Error in endStream:", error);
    }
  }, []);

  const placeBid = useCallback((sessionId: string, amount: number) => {
    try {
      console.log(`💰 [Context] Placing bid: ${amount} for session ${sessionId}`);
      
      if (!wsManager.getState().isReady) {
        console.error("❌ [Context] WebSocket not ready for placeBid");
        return;
      }
      
      wsManager.emit("place_bid", { sessionId, amount }, (response: any) => {
        if (response?.success) {
          console.log("✅ [Context] Bid placed successfully");
        } else {
          console.error("❌ [Context] Bid placement failed:", response?.error);
        }
      });
    } catch (error) {
      console.error("❌ [Context] Error in placeBid:", error);
    }
  }, []);

  const acceptBid = useCallback((bidId: string) => {
    try {
      console.log(`✅ [Context] Accepting bid: ${bidId}`);
      
      if (!wsManager.getState().isReady) {
        console.error("❌ [Context] WebSocket not ready for acceptBid");
        return;
      }
      
      wsManager.emit("accept_bid", { bidId }, (response: any) => {
        if (response?.success) {
          console.log("✅ [Context] Bid accepted successfully");
        } else {
          console.error("❌ [Context] Bid acceptance failed:", response?.error);
        }
      });
    } catch (error) {
      console.error("❌ [Context] Error in acceptBid:", error);
    }
  }, []);

  const rejectBid = useCallback((bidId: string) => {
    try {
      console.log(`🚫 [Context] Rejecting bid: ${bidId}`);
      
      if (!wsManager.getState().isReady) {
        console.error("❌ [Context] WebSocket not ready for rejectBid");
        return;
      }
      
      wsManager.emit("reject_bid", { bidId }, (response: any) => {
        if (response?.success) {
          console.log("✅ [Context] Bid rejected successfully");
        } else {
          console.error("❌ [Context] Bid rejection failed:", response?.error);
        }
      });
    } catch (error) {
      console.error("❌ [Context] Error in rejectBid:", error);
    }
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    try {
      console.log(`🚪 [Context] Leaving session: ${sessionId}`);
      
      if (!wsManager.getState().isReady) {
        console.error("❌ [Context] WebSocket not ready for leaveSession");
        return;
      }
      
      wsManager.emit("leave_session", { sessionId });
      // Clear local state when leaving
      setCurrentSession(null);
      setBids([]);
      setHighestBid(0);
    } catch (error) {
      console.error("❌ [Context] Error in leaveSession:", error);
    }
  }, []);

  // Enhanced: Get existing producers with better callback handling
  const getExistingProducers = useCallback((sessionId: string, callback?: Function) => {
    try {
      console.log(`📋 [Context] Getting existing producers for session: ${sessionId}`);
      
      if (!wsManager.getState().isReady) {
        console.error("❌ [Context] WebSocket not ready for getExistingProducers");
        if (callback) callback({ success: false, error: "WebSocket not ready" });
        return;
      }
      
      wsManager.emitGetExistingProducers(sessionId, (response: any) => {
        if (response?.success) {
          console.log(`✅ [Context] Got ${response.producers?.length || 0} existing producers`);
        } else {
          console.error("❌ [Context] Failed to get existing producers:", response?.error);
        }
        if (callback) callback(response);
      });
    } catch (error) {
      console.error("❌ [Context] Error in getExistingProducers:", error);
      if (callback) callback({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }, []);

  // Enhanced event listener management with better cleanup
  const addEventListener = useCallback((event: string, handler: Function): (() => void) => {
    try {
      if (!eventListenersRef.current.has(event)) {
        eventListenersRef.current.set(event, new Set());
      }
      eventListenersRef.current.get(event)!.add(handler);

      const removeHandler = wsManager.addEventListener(event, handler);

      return () => {
        try {
          const listeners = eventListenersRef.current.get(event);
          if (listeners) {
            listeners.delete(handler);
          }
          removeHandler();
        } catch (error) {
          console.error("❌ [Context] Error removing event listener:", error);
        }
      };
    } catch (error) {
      console.error("❌ [Context] Error adding event listener:", error);
      return () => {};
    }
  }, []);

  const removeEventListener = useCallback(
    (event: string, handler: Function) => {
      try {
        const listeners = eventListenersRef.current.get(event);
        if (listeners) {
          listeners.delete(handler);
        }
        wsManager.removeEventListener(event, handler as EventListener);
      } catch (error) {
        console.error("❌ [Context] Error removing event listener:", error);
      }
    },
    []
  );

  // Enhanced value memoization with better dependency tracking
  const value = React.useMemo<WebSocketContextType>(
    () => ({
      socket,
      isConnected,
      isAuthenticated,
      isReady,
      currentSession,
      bids,
      highestBid,
      actions: {
        createStream,
        joinStream,
        endStream,
        placeBid,
        acceptBid,
        rejectBid,
        leaveSession,
        getExistingProducers,
      },
      addEventListener,
      removeEventListener,
    }),
    [
      socket,
      isConnected,
      isAuthenticated,
      isReady,
      currentSession,
      bids,
      highestBid,
      createStream,
      joinStream,
      endStream,
      placeBid,
      acceptBid,
      rejectBid,
      leaveSession,
      getExistingProducers,
      addEventListener,
      removeEventListener,
    ]
  );

  // Enhanced debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        try {
          const debugInfo = wsManager.getDebugInfo();
          console.log('🔍 [Context] Debug Info:', {
            ...debugInfo,
            currentSession: currentSession?.id,
            bidCount: bids.length,
            highestBid
          });
          
          if (debugInfo.consecutiveFailures > 3 || debugInfo.connectionHealth === 'poor') {
            console.warn('⚠️ [Context] Connection health degraded:', debugInfo);
          }
        } catch (error) {
          console.error('❌ [Context] Error in debug logging:', error);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentSession, bids.length, highestBid]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        console.log('🧹 [Context] Cleaning up WebSocket context');
        // Clear all event listeners
        eventListenersRef.current.clear();
      } catch (error) {
        console.error('❌ [Context] Error during cleanup:', error);
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};