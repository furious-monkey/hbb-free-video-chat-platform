// websocket/WebSocketServiceInstance.ts - Singleton WebSocket service instance with proper error handling
import { WebSocketService } from './websocket.service';
import { Server } from 'http';
import { MediasoupManager } from '../mediasoup/mediasoup.manager';

let webSocketServiceInstance: WebSocketService | null = null;

/**
 * Initialize the WebSocket service singleton
 * @param server HTTP server instance
 * @param mediasoupManager Mediasoup manager instance
 * @returns WebSocketService instance
 */
export const initWebSocketService = (
  server: Server,
  mediasoupManager: MediasoupManager
): WebSocketService => {
  try {
    if (!webSocketServiceInstance) {
      console.log('Initializing WebSocket service...');
      webSocketServiceInstance = new WebSocketService(server, mediasoupManager);
      console.log('WebSocket service initialized successfully');
    } else {
      console.warn('WebSocket service already initialized, returning existing instance');
    }
    return webSocketServiceInstance;
  } catch (error) {
    console.error('Failed to initialize WebSocket service:', error);
    throw new Error(`WebSocket service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get the WebSocket service singleton instance
 * @returns WebSocketService instance
 * @throws Error if service is not initialized
 */
export const getWebSocketService = (): WebSocketService => {
  if (!webSocketServiceInstance) {
    const error = new Error('WebSocketService not initialized. Call initWebSocketService(server, mediasoupManager) first.');
    console.error(error.message);
    throw error;
  }
  return webSocketServiceInstance;
};

/**
 * Check if WebSocket service is initialized
 * @returns boolean indicating if service is ready
 */
export const isWebSocketServiceInitialized = (): boolean => {
  return webSocketServiceInstance !== null;
};

/**
 * Gracefully shutdown the WebSocket service
 * This should be called during application shutdown
 */
export const shutdownWebSocketService = async (): Promise<void> => {
  if (webSocketServiceInstance) {
    try {
      console.log('Shutting down WebSocket service...');
      
      // Close all connections
      const server = webSocketServiceInstance.getServer();
      server.close();
      
      // Clean up the instance
      webSocketServiceInstance = null;
      
      console.log('WebSocket service shutdown complete');
    } catch (error) {
      console.error('Error during WebSocket service shutdown:', error);
      throw error;
    }
  } else {
    console.log('WebSocket service not initialized, nothing to shutdown');
  }
};

/**
 * Get WebSocket service connection info (if initialized)
 * @returns Connection info or null if not initialized
 */
export const getWebSocketConnectionInfo = () => {
  if (webSocketServiceInstance) {
    return webSocketServiceInstance.getConnectionInfo();
  }
  return null;
};