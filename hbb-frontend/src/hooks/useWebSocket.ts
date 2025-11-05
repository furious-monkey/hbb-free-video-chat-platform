// frontend/src/hooks/useWebSocket.ts - Fixed with better session/stream handling
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';

interface StreamSession {
  id: string;
  influencerId: string;
  currentExplorerId?: string;
  status: 'PENDING' | 'LIVE' | 'ENDED';
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
}

interface WebSocketEvents {
  // Enhanced Stream/Session events
  onStreamCreated?: (data: { 
    success: boolean; 
    session: StreamSession;
    sessionId: string;
    message?: string;
  }) => void;
  
  onStreamJoined?: (data: {
    success: boolean; 
    userId: string;
    userName?: string;
    profileImage?: string;
    sessionId: string;
    timestamp: Date;
    participantCount?: number;
    isOtherUser?: boolean;
  }) => void;
  
  onStreamEnded?: (data: { 
    success: boolean; 
    sessionId: string;
    reason?: string;
    endedAt: Date;
    finalEarnings?: number;
  }) => void;
  
  onSessionCreated?: (data: { 
    sessionId: string; 
    streamerId: string; 
    title?: string; 
    createdAt: Date;
    allowBids: boolean;
    callRate?: number;
    influencerId: string;
    status: string;
    timestamp: Date;
  }) => void;

  onSessionJoined?: (data: {
    userId: string;
    sessionId: string;
    socketId?: string;
    participantCount?: number;
  }) => void;
  
  onSessionEnded?: (data: { 
    sessionId: string; 
    reason?: string; 
    endedAt: Date;
    totalEarnings?: number;
  }) => void;
  
  // Enhanced Bid events with better data structure
  onBidPlaced?: (data: Bid & {
    currentHighestBid?: number;
    position?: number;
    userName?: string;
    isNewHighest?: boolean;
  }) => void;
  
  onNewBid?: (data: Bid & { 
    currentHighestBid?: number;
    previousHighestBid?: number;
    isNewHighest?: boolean;
  }) => void;
  
  onBidAccepted?: (data: {
    explorerLocation: string; 
    bidId: string; 
    sessionId: string; 
    amount: number; 
    bidderId: string;
    bidderName?: string;
    streamerId: string; 
    acceptedAt: Date;
    profileImage?: string;
    influencerName?: string;
  }) => void;
  
  onBidRejected?: (data: {
    amount: number;
    bidId: string; 
    sessionId: string; 
    bidderId: string;
    bidderName?: string;
    reason?: string; 
    rejectedAt: Date;
  }) => void;
  
  onOutbid?: (data: {
    amount: number;
    sessionId: string; 
    previousBidderId: string;
    previousBidderName?: string;
    newHighestBid: number; 
    newBidderId: string;
    newBidderName?: string;
    newBidAmount: number; 
    previousAmount: number;
    bidId: string; 
    timestamp: Date;
  }) => void;
  
  // Enhanced Response events for user actions
  onBidPlacedSuccess?: (data: { 
    success: boolean; 
    bid: Bid;
    message?: string;
    waitingForResponse?: boolean;
  }) => void;
  
  onBidPlacedError?: (data: { 
    success: false; 
    message: string;
    code?: string;
    retryable?: boolean;
  }) => void;
  
  onBidAcceptedSuccess?: (data: { 
    success: boolean; 
    bid: Bid;
    message?: string;
  }) => void;
  
  onBidRejectedSuccess?: (data: { 
    success: boolean; 
    bid: Bid;
    message?: string;
  }) => void;
  
  // Enhanced User connection events
  onUserConnected?: (data: { 
    userId: string; 
    socketId: string;
    userType?: 'influencer' | 'explorer';
    sessionId?: string;
  }) => void;
  
  onUserDisconnected?: (data: { 
    userId: string; 
    sessionId?: string;
    userType?: 'influencer' | 'explorer';
    reason?: string;
    timestamp: Date;
  }) => void;
  
  // Enhanced Gift/earning events
  onGiftSent?: (data: {
    amount: number;
    giftId: string;
    sessionId: string;
    senderId: string;
    senderName?: string;
    recipientId: string;
    giftType: string;
    value: number;
    timestamp: Date;
  }) => void;

  onGiftReceived?: (data: {
    giftId: string;
    sessionId: string;
    senderId: string;
    senderName?: string;
    recipientId: string;
    giftType: string;
    amount: number;
    timestamp: Date;
  }) => void;
  
  onEarningsUpdated?: (data: {
    sessionId: string;
    userId: string;
    videoEarnings: number;
    giftEarnings: number;
    totalEarnings: number;
    timestamp: Date;
  }) => void;

  // Billing events
  onBillingStarted?: (data: {
    sessionId: string;
    billingSessionId: string;
    bidAmount: number;
    timestamp: Date;
  }) => void;

  onBillingUpdated?: (data: {
    sessionId: string;
    billingSessionId: string;
    totalCharged: number;
    duration: number;
    timestamp: Date;
  }) => void;

  onBillingCompleted?: (data: {
    sessionId: string;
    billingSessionId: string;
    finalAmount: number;
    duration: number;
    timestamp: Date;
  }) => void;

  onPaymentFailed?: (data: {
    sessionId: string;
    billingSessionId: string;
    reason: string;
    timestamp: Date;
  }) => void;

  onRefundProcessed?: (data: {
    sessionId: string;
    billingSessionId: string;
    refundAmount: number;
    timestamp: Date;
  }) => void;
  
  // Enhanced MediaSoup events with better debugging
  onNewProducer?: (data: {
    userId: string;
    producerId: string;
    kind: 'audio' | 'video';
    sessionId: string;
    timestamp?: Date;
    sequenced?: boolean;
    existing?: boolean;
    broadcast?: boolean;
  }) => void;
  
  onProducerClosed?: (data: {
    userId: string;
    producerId: string;
    kind?: 'audio' | 'video';
    sessionId: string;
    reason?: string;
  }) => void;

  // Enhanced: Existing producers event
  onExistingProducers?: (data: {
    success: boolean;
    producers: Array<{
      producerId: string;
      peerId: string;
      kind: 'audio' | 'video';
    }>;
    sessionId: string;
  }) => void;
  
  // Enhanced Error events with severity levels
  onError?: (data: { 
    message: string; 
    code?: string; 
    sessionId?: string; 
    timestamp: Date;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    retryable?: boolean;
  }) => void;
  
  // Enhanced Connection events
  onConnectionStatusChanged?: (data: {
    status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
    timestamp: Date;
    health?: 'excellent' | 'good' | 'fair' | 'poor';
  }) => void;

  // Enhanced: Additional MediaSoup events
  onConnectionRestored?: (data: {
    attempts: number;
    timestamp: Date;
  }) => void;

  onConnectionFailed?: (data: {
    message: string;
    attempts: number;
    timestamp: Date;
  }) => void;
}

// Fixed: Proper action return types
interface ActionResponse {
  success: boolean;
  error?: string;
}

interface CreateStreamResponse extends ActionResponse {
  sessionId?: string;
}

interface UseWebSocketReturn {
  // Enhanced context properties
  socket: any;
  isConnected: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  currentSession: StreamSession | null;
  bids: Bid[];
  highestBid: number;
  
  // Fixed: Enhanced actions with proper return types
  actions: {
    createStream: (allowBids: boolean, callRate: string) => Promise<CreateStreamResponse>;
    joinStream: (sessionId: string) => Promise<ActionResponse>;
    endStream: (sessionId: string) => Promise<ActionResponse>;
    placeBid: (sessionId: string, amount: number) => Promise<ActionResponse>;
    acceptBid: (bidId: string) => Promise<ActionResponse>;
    rejectBid: (bidId: string) => Promise<ActionResponse>;
    leaveSession: (sessionId: string) => void;
    getExistingProducers: (sessionId: string, callback?: Function) => void;
  };
  
  // Fixed: Enhanced event management with proper return type
  addEventListener: (event: string, handler: Function) => () => void;
  removeEventListener: (event: string, handler: Function) => void;
  
  // Enhanced properties with connection health
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  connectionHealth: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Enhanced helper methods
  retry: () => void;
  disconnect: () => void;
  getDebugInfo: () => any;
}

export const useWebSocket = (userId?: string, events?: WebSocketEvents): UseWebSocketReturn => {
  const context = useWebSocketContext();
  const eventsRef = useRef(events);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const activePromisesRef = useRef<Map<string, { resolve: Function; reject: Function; timeoutId: NodeJS.Timeout }>>(new Map());
  
  // Enhanced: Track connection health
  const connectionHealthRef = useRef<'excellent' | 'good' | 'fair' | 'poor'>('poor');
  
  // Update events reference
  eventsRef.current = events;

  // Enhanced event name mapping with comprehensive coverage
  const eventMap = {
    onStreamCreated: 'STREAM_CREATED',
    onStreamJoined: 'STREAM_JOINED',
    onStreamEnded: 'STREAM_ENDED',
    onSessionCreated: 'SESSION_CREATED',
    onSessionJoined: 'SESSION_JOINED',
    onSessionEnded: 'SESSION_ENDED',
    onBidPlaced: 'BID_PLACED',
    onNewBid: 'NEW_BID',
    onBidAccepted: 'BID_ACCEPTED',
    onBidRejected: 'BID_REJECTED',
    onOutbid: 'OUTBID',
    onBidPlacedSuccess: 'BID_PLACED_SUCCESS',
    onBidPlacedError: 'BID_PLACED_ERROR',
    onBidAcceptedSuccess: 'BID_ACCEPTED_SUCCESS',
    onBidRejectedSuccess: 'BID_REJECTED_SUCCESS',
    onUserConnected: 'USER_CONNECTED',
    onUserDisconnected: 'USER_DISCONNECTED',
    onGiftSent: 'GIFT_SENT',
    onGiftReceived: 'GIFT_RECEIVED',
    onEarningsUpdated: 'EARNINGS_UPDATED',
    onBillingStarted: 'BILLING_STARTED',
    onBillingUpdated: 'BILLING_UPDATED',
    onBillingCompleted: 'BILLING_COMPLETED',
    onPaymentFailed: 'PAYMENT_FAILED',
    onRefundProcessed: 'REFUND_PROCESSED',
    onNewProducer: 'NEW_PRODUCER',
    onProducerClosed: 'PRODUCER_CLOSED',
    onError: 'ERROR',
    onConnectionStatusChanged: 'CONNECTION_STATUS_CHANGED',
    onExistingProducers: 'EXISTING_PRODUCERS_RESPONSE',
    onConnectionRestored: 'CONNECTION_RESTORED',
    onConnectionFailed: 'CONNECTION_FAILED',
  } as const;

  // Enhanced: Register event listeners with comprehensive error handling and cleanup
  useEffect(() => {
    if (!eventsRef.current || !context) return;

    const handlers: Array<() => void> = [];

    Object.entries(eventsRef.current).forEach(([eventName, handler]) => {
      const websocketEvent = eventMap[eventName as keyof typeof eventMap];
      if (websocketEvent && handler) {
        const wrappedHandler = (data: any) => {
          try {
            // Enhanced: Add debug logging for important events
            if (['NEW_PRODUCER', 'PRODUCER_CLOSED', 'EXISTING_PRODUCERS_RESPONSE', 'SESSION_CREATED'].includes(websocketEvent)) {
              console.log(`🎬 [useWebSocket] ${websocketEvent} event:`, data);
            }
            
            // Enhanced: Handle promise resolution for action responses
            if (websocketEvent === 'SESSION_CREATED') {
              const createStreamPromises = Array.from(activePromisesRef.current.entries())
                .filter(([id]) => id.startsWith('createStream_'));
              
              if (createStreamPromises.length > 0) {
                createStreamPromises.forEach(([promiseId, { resolve, timeoutId }]) => {
                  clearTimeout(timeoutId);
                  activePromisesRef.current.delete(promiseId);
                  resolve({
                    success: true,
                    sessionId: data.sessionId,
                  });
                });
              }
            }
            
            handler(data);
            
            // Enhanced: Reset retry count on successful event handling
            retryCountRef.current = 0;
            
            // Enhanced: Update connection health based on successful events
            if (websocketEvent !== 'ERROR' && websocketEvent !== 'CONNECTION_FAILED') {
              connectionHealthRef.current = 'good';
            }
          } catch (error) {
            console.error(`❌ [useWebSocket] Error handling ${eventName}:`, error);
            
            // Enhanced: Track consecutive failures
            retryCountRef.current++;
            connectionHealthRef.current = 'poor';
            
            // Trigger error callback if available
            if (eventsRef.current?.onError) {
              eventsRef.current.onError({
                message: `Error handling ${eventName}: ${error}`,
                code: 'EVENT_HANDLER_ERROR',
                timestamp: new Date(),
                severity: 'medium'
              });
            }
          }
        };
        
        const removeHandler = context.addEventListener(websocketEvent, wrappedHandler);
        if (typeof removeHandler === 'function') {
          handlers.push(removeHandler);
        }
      }
    });

    return () => {
      handlers.forEach(removeHandler => {
        if (typeof removeHandler === 'function') {
          removeHandler();
        }
      });
    };
  }, [context]);

  // Enhanced: Connection status monitoring with health tracking
  const getConnectionStatus = useCallback(() => {
    if (!context) return 'disconnected';
    
    if (context.isConnected && context.isAuthenticated) {
      return 'connected';
    } else if (context.isConnected) {
      return 'connecting';
    } else {
      return 'disconnected';
    }
  }, [context?.isConnected, context?.isAuthenticated]);

  // Enhanced: Get connection health
  const getConnectionHealth = useCallback((): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!context?.isConnected) return 'poor';
    return connectionHealthRef.current;
  }, [context?.isConnected]);

  // Enhanced: Retry connection with exponential backoff
  const retry = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      console.warn(`⚠️ [useWebSocket] Max retry attempts reached (${maxRetries})`);
      if (eventsRef.current?.onError) {
        eventsRef.current.onError({
          message: 'Maximum connection retry attempts reached',
          code: 'MAX_RETRIES_EXCEEDED',
          timestamp: new Date(),
          severity: 'high',
          retryable: false
        });
      }
      return;
    }

    retryCountRef.current += 1;
    const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
    console.log(`🔄 [useWebSocket] Retrying connection (attempt ${retryCountRef.current}/${maxRetries}) in ${backoffTime}ms`);
    
    setTimeout(() => {
      // Force reconnection by refreshing the page or reconnecting WebSocket
      if (context?.socket) {
        context.socket.disconnect();
        context.socket.connect();
      }
    }, backoffTime);
  }, [context, maxRetries]);

  // Enhanced: Disconnect with cleanup
  const disconnect = useCallback(() => {
    console.log('🔌 [useWebSocket] Disconnecting...');
    
    // Reject all pending promises
    activePromisesRef.current.forEach(({ reject, timeoutId }) => {
      clearTimeout(timeoutId);
      reject(new Error('Connection disconnected'));
    });
    activePromisesRef.current.clear();
    
    if (context?.socket) {
      context.socket.disconnect();
    }
  }, [context]);

  // Enhanced: Get comprehensive debug information
  const getDebugInfo = useCallback(() => {
    return {
      isConnected: context?.isConnected || false,
      isAuthenticated: context?.isAuthenticated || false,
      isReady: context?.isReady || false,
      connectionStatus: getConnectionStatus(),
      connectionHealth: getConnectionHealth(),
      retryCount: retryCountRef.current,
      maxRetries,
      activePromises: activePromisesRef.current.size,
      hasSocket: !!context?.socket,
      socketConnected: context?.socket?.connected || false,
      timestamp: new Date().toISOString(),
    };
  }, [context, getConnectionStatus, getConnectionHealth]);

  // Fixed: Create promise-based action wrapper with proper return types and better handling
  const createPromiseAction = useCallback(
    <T = ActionResponse>(actionName: string, actionFn: Function) => {
      return (...args: any[]): Promise<T> => {
        return new Promise((resolve, reject) => {
          const promiseId = `${actionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Set timeout for promise
          const timeoutId = setTimeout(() => {
            activePromisesRef.current.delete(promiseId);
            reject(new Error(`${actionName} timeout after 30 seconds`));
          }, 30000); // 30 second timeout
          
          // Store promise handlers
          activePromisesRef.current.set(promiseId, { resolve, reject, timeoutId });
          
          try {
            console.log(`🚀 [useWebSocket] Executing ${actionName} with args:`, args);
            
            // Execute the action
            actionFn(...args);
            
            // For createStream, don't auto-resolve - wait for SESSION_CREATED event
            if (actionName === 'createStream') {
              console.log(`⏳ [useWebSocket] Waiting for SESSION_CREATED event for ${actionName}`);
              return; // Don't auto-resolve for createStream
            }
            
            // For other actions that don't have explicit callbacks, resolve after a short delay
            setTimeout(() => {
              if (activePromisesRef.current.has(promiseId)) {
                activePromisesRef.current.delete(promiseId);
                clearTimeout(timeoutId);
                resolve({ success: true } as T);
              }
            }, 1000); // 1 second delay for immediate resolution
            
          } catch (error) {
            activePromisesRef.current.delete(promiseId);
            clearTimeout(timeoutId);
            reject(error);
          }
        });
      };
    }, []
  );

  // Fixed: Enhanced actions with proper return types
  const enhancedActions = {
    createStream: useCallback(createPromiseAction<CreateStreamResponse>('createStream', (allowBids: boolean, callRate: string) => {
      try {
        console.log(`🎬 [useWebSocket] Creating stream: allowBids=${allowBids}, callRate=${callRate}`);
        
        if (!context?.actions?.createStream) {
          throw new Error('Context createStream action not available');
        }
        
        context.actions.createStream(allowBids, callRate);
        console.log(`📡 [useWebSocket] createStream action called successfully`);
      } catch (error) {
        console.error('❌ [useWebSocket] Error creating stream:', error);
        throw error;
      }
    }), [context, createPromiseAction]),

    joinStream: useCallback(createPromiseAction<ActionResponse>('joinStream', (sessionId: string) => {
      try {
        console.log(`🎯 [useWebSocket] Joining stream: ${sessionId}`);
        if (!context?.actions?.joinStream) {
          throw new Error('Context joinStream action not available');
        }
        context.actions.joinStream(sessionId);
      } catch (error) {
        console.error('❌ [useWebSocket] Error joining stream:', error);
        throw error;
      }
    }), [context, createPromiseAction]),

    endStream: useCallback(createPromiseAction<ActionResponse>('endStream', (sessionId: string) => {
      try {
        console.log(`🏁 [useWebSocket] Ending stream: ${sessionId}`);
        if (!context?.actions?.endStream) {
          throw new Error('Context endStream action not available');
        }
        context.actions.endStream(sessionId);
      } catch (error) {
        console.error('❌ [useWebSocket] Error ending stream:', error);
        throw error;
      }
    }), [context, createPromiseAction]),

    placeBid: useCallback(createPromiseAction<ActionResponse>('placeBid', (sessionId: string, amount: number) => {
      try {
        console.log(`💰 [useWebSocket] Placing bid: ${amount} for session ${sessionId}`);
        if (!context?.actions?.placeBid) {
          throw new Error('Context placeBid action not available');
        }
        context.actions.placeBid(sessionId, amount);
      } catch (error) {
        console.error('❌ [useWebSocket] Error placing bid:', error);
        throw error;
      }
    }), [context, createPromiseAction]),

    acceptBid: useCallback(createPromiseAction<ActionResponse>('acceptBid', (bidId: string) => {
      try {
        console.log(`✅ [useWebSocket] Accepting bid: ${bidId}`);
        if (!context?.actions?.acceptBid) {
          throw new Error('Context acceptBid action not available');
        }
        context.actions.acceptBid(bidId);
      } catch (error) {
        console.error('❌ [useWebSocket] Error accepting bid:', error);
        throw error;
      }
    }), [context, createPromiseAction]),

    rejectBid: useCallback(createPromiseAction<ActionResponse>('rejectBid', (bidId: string) => {
      try {
        console.log(`🚫 [useWebSocket] Rejecting bid: ${bidId}`);
        if (!context?.actions?.rejectBid) {
          throw new Error('Context rejectBid action not available');
        }
        context.actions.rejectBid(bidId);
      } catch (error) {
        console.error('❌ [useWebSocket] Error rejecting bid:', error);
        throw error;
      }
    }), [context, createPromiseAction]),

    leaveSession: useCallback((sessionId: string) => {
      try {
        console.log(`🚪 [useWebSocket] Leaving session: ${sessionId}`);
        if (!context?.actions?.leaveSession) {
          console.warn('Context leaveSession action not available');
          return;
        }
        context.actions.leaveSession(sessionId);
      } catch (error) {
        console.error('❌ [useWebSocket] Error leaving session:', error);
        if (eventsRef.current?.onError) {
          eventsRef.current.onError({
            message: `Failed to leave session: ${error}`,
            code: 'LEAVE_SESSION_ERROR',
            sessionId,
            timestamp: new Date(),
            severity: 'low',
            retryable: true
          });
        }
      }
    }, [context]),

    getExistingProducers: useCallback((sessionId: string, callback?: Function) => {
      try {
        console.log(`📋 [useWebSocket] Getting existing producers for session: ${sessionId}`);
        if (!context?.actions?.getExistingProducers) {
          console.warn('Context getExistingProducers action not available');
          if (callback) callback({ success: false, error: 'Action not available' });
          return;
        }
        context.actions.getExistingProducers(sessionId, (response: any) => {
          if (response?.success) {
            console.log(`✅ [useWebSocket] Got ${response.producers?.length || 0} existing producers`);
          } else {
            console.error("❌ [useWebSocket] Failed to get existing producers:", response?.error);
          }
          if (callback) callback(response);
        });
      } catch (error) {
        console.error('❌ [useWebSocket] Error getting existing producers:', error);
        if (eventsRef.current?.onError) {
          eventsRef.current.onError({
            message: `Failed to get existing producers: ${error}`,
            code: 'GET_EXISTING_PRODUCERS_ERROR',
            sessionId,
            timestamp: new Date(),
            severity: 'medium',
            retryable: true
          });
        }
        if (callback) callback({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }, [context])
  };

  // Fixed: Create a wrapper for addEventListener that returns cleanup function
  const addEventListenerWrapper = useCallback((event: string, handler: Function): (() => void) => {
    if (!context?.addEventListener) {
      console.warn(`⚠️ [useWebSocket] Context addEventListener not available for event: ${event}`);
      return () => {}; // Return empty cleanup function if context not available
    }
    
    try {
      const cleanup = context.addEventListener(event, handler);
      
      // If cleanup is already a function, return it
      if (typeof cleanup === 'function') {
        return cleanup;
      }
      
      // If cleanup is not a function, return empty cleanup function
      return () => {};
    } catch (error) {
      console.error(`❌ [useWebSocket] Error adding event listener for ${event}:`, error);
      return () => {};
    }
  }, [context]);

  // Enhanced: Monitor connection health changes
  useEffect(() => {
    if (!context) return;

    const healthCheckInterval = setInterval(() => {
      const currentStatus = getConnectionStatus();
      const currentHealth = getConnectionHealth();
      
      // Update connection health based on status
      if (currentStatus === 'connected') {
        if (retryCountRef.current === 0) {
          connectionHealthRef.current = 'excellent';
        } else if (retryCountRef.current <= 2) {
          connectionHealthRef.current = 'good';
        } else {
          connectionHealthRef.current = 'fair';
        }
      } else if (currentStatus === 'connecting') {
        connectionHealthRef.current = 'fair';
      } else {
        connectionHealthRef.current = 'poor';
      }

      // Trigger connection status change event
      if (eventsRef.current?.onConnectionStatusChanged) {
        eventsRef.current.onConnectionStatusChanged({
          status: currentStatus as any,
          timestamp: new Date(),
          health: currentHealth,
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(healthCheckInterval);
  }, [context, getConnectionStatus, getConnectionHealth]);

  // Enhanced: Auto-retry logic for failed connections
  useEffect(() => {
    if (!context) return;

    let retryTimeout: NodeJS.Timeout;

    if (!context.isConnected && retryCountRef.current < maxRetries) {
      const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      console.log(`⏳ [useWebSocket] Auto-retry in ${backoffTime}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
      
      retryTimeout = setTimeout(() => {
        retry();
      }, backoffTime);
    }

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [context?.isConnected, retry]);

  // Enhanced: Handle successful connections
  useEffect(() => {
    if (context?.isReady && retryCountRef.current > 0) {
      console.log('✅ [useWebSocket] Connection restored successfully');
      retryCountRef.current = 0;
      connectionHealthRef.current = 'excellent';
      
      if (eventsRef.current?.onConnectionRestored) {
        eventsRef.current.onConnectionRestored({
          attempts: retryCountRef.current,
          timestamp: new Date(),
        });
      }
    }
  }, [context?.isReady]);

  // Enhanced: Provide fallback object when context is not available
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      isAuthenticated: false,
      isReady: false,
      currentSession: null,
      bids: [],
      highestBid: 0,
      actions: {
        createStream: async () => ({ success: false, error: 'Context not available' }),
        joinStream: async () => ({ success: false, error: 'Context not available' }),
        endStream: async () => ({ success: false, error: 'Context not available' }),
        placeBid: async () => ({ success: false, error: 'Context not available' }),
        acceptBid: async () => ({ success: false, error: 'Context not available' }),
        rejectBid: async () => ({ success: false, error: 'Context not available' }),
        leaveSession: () => {},
        getExistingProducers: () => {}
      },
      addEventListener: () => () => {},
      removeEventListener: () => {},
      connectionStatus: 'disconnected' as const,
      connectionHealth: 'poor' as const,
      retry: () => {},
      disconnect: () => {},
      getDebugInfo: () => ({
        isConnected: false,
        isAuthenticated: false,
        isReady: false,
        connectionStatus: 'disconnected',
        connectionHealth: 'poor',
        retryCount: 0,
        maxRetries: 0,
        activePromises: 0,
        hasSocket: false,
        socketConnected: false,
        timestamp: new Date().toISOString(),
        error: 'WebSocket context not available'
      })
    };
  }

  return {
    // Enhanced context properties
    socket: context.socket,
    isConnected: context.isConnected,
    isAuthenticated: context.isAuthenticated,
    isReady: context.isReady,
    currentSession: context.currentSession,
    bids: context.bids,
    highestBid: context.highestBid,
    
    // Fixed: Enhanced actions with proper return types
    actions: enhancedActions,
    
    // Fixed: Enhanced event management with proper return type
    addEventListener: addEventListenerWrapper,
    removeEventListener: context.removeEventListener || (() => {}),
    
    // Enhanced connection properties
    connectionStatus: getConnectionStatus(),
    connectionHealth: getConnectionHealth(),
    
    // Enhanced helper methods
    retry,
    disconnect,
    getDebugInfo
  };
};

// Enhanced: Export additional utility functions for debugging
export const WebSocketDebug = {
  logConnectionState: (hookReturn: UseWebSocketReturn) => {
    console.log('🔍 [WebSocket Debug] Connection State:', hookReturn.getDebugInfo());
  },
  
  testConnection: async (hookReturn: UseWebSocketReturn) => {
    const debugInfo = hookReturn.getDebugInfo();
    console.log('🧪 [WebSocket Test] Starting connection test...');
    console.log('📊 [WebSocket Test] Current state:', debugInfo);
    
    if (!debugInfo.isConnected) {
      console.log('🔄 [WebSocket Test] Attempting to retry connection...');
      hookReturn.retry();
    } else if (!debugInfo.isAuthenticated) {
      console.log('⚠️ [WebSocket Test] Connected but not authenticated');
    } else {
      console.log('✅ [WebSocket Test] Connection is healthy');
    }
  },
  
  simulateReconnect: (hookReturn: UseWebSocketReturn) => {
    console.log('🔄 [WebSocket Debug] Simulating reconnect...');
    hookReturn.disconnect();
    setTimeout(() => {
      hookReturn.retry();
    }, 1000);
  }
};

// Enhanced: Export hook with comprehensive TypeScript support
export default useWebSocket;