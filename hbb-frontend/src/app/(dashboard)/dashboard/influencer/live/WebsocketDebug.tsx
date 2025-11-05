// Add this debug component to help diagnose WebSocket connection issues
// Place this in your LiveRate component temporarily or create a separate debug component

import React, { useEffect, useState } from 'react';
import { useWebSocket } from "@/src/hooks/useWebSocket";

interface WebSocketDebugProps {
  userId: string;
}

const WebSocketDebug: React.FC<WebSocketDebugProps> = ({ userId }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const {
    socket,
    isConnected,
    isAuthenticated,
    isReady,
    connectionStatus,
    connectionHealth,
    getDebugInfo
  } = useWebSocket(userId, {
    onError: (error) => {
      console.error("🚨 WebSocket Debug - Error:", error);
    },
    onConnectionStatusChanged: (status) => {
      console.log("🔄 WebSocket Debug - Status Changed:", status);
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const info = getDebugInfo();
      setDebugInfo(info);
      
      if (!isConnected) {
        setConnectionAttempts(prev => prev + 1);
      }

      console.log("🔍 WebSocket Debug Info:", {
        ...info,
        socketDetails: {
          exists: !!socket,
          connected: socket?.connected,
          id: socket?.id,
          url: socket?.io?.uri,
          transport: socket?.io?.engine?.transport?.name,
        },
        browserInfo: {
          userAgent: navigator.userAgent,
          onLine: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled,
        },
        networkInfo: {
          effectiveType: (navigator as any).connection?.effectiveType,
          downlink: (navigator as any).connection?.downlink,
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [getDebugInfo, socket, isConnected]);

  // Check WebSocket context availability
  useEffect(() => {
    console.log("🔧 WebSocket Debug - Context Check:", {
      hasSocket: !!socket,
      socketConstructor: socket?.constructor?.name,
      socketReadyState: socket?.readyState,
      socketUrl: socket?.url,
      ioOptions: socket?.io?.opts,
    });
  }, [socket]);

  // Test connection manually
  const testConnection = () => {
    console.log("🧪 Manual connection test...");
    
    try {
      if (socket) {
        console.log("📡 Socket exists, attempting to connect...");
        socket.connect();
      } else {
        console.error("❌ No socket available");
      }
    } catch (error) {
      console.error("❌ Connection test failed:", error);
    }
  };

  const formatTime = (ms: number) => {
    return new Date(ms).toLocaleTimeString();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md text-xs space-y-2 font-mono z-50">
      <div className="font-bold text-sm mb-2">🔍 WebSocket Debug</div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>Connected:</div>
        <div className={isConnected ? "text-green-400" : "text-red-400"}>
          {isConnected ? "✅ Yes" : "❌ No"}
        </div>
        
        <div>Authenticated:</div>
        <div className={isAuthenticated ? "text-green-400" : "text-yellow-400"}>
          {isAuthenticated ? "✅ Yes" : "⏳ No"}
        </div>
        
        <div>Ready:</div>
        <div className={isReady ? "text-green-400" : "text-red-400"}>
          {isReady ? "✅ Yes" : "❌ No"}
        </div>
        
        <div>Status:</div>
        <div>{connectionStatus}</div>
        
        <div>Health:</div>
        <div>{connectionHealth}</div>
        
        <div>Attempts:</div>
        <div>{connectionAttempts}</div>
      </div>

      {socket && (
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div>Socket ID: {socket.id || "None"}</div>
          <div>Transport: {socket.io?.engine?.transport?.name || "Unknown"}</div>
          <div>URL: {socket.io?.uri || "Unknown"}</div>
          <div>Ready State: {socket.readyState}</div>
        </div>
      )}

      <div className="border-t border-gray-600 pt-2 mt-2">
        <div>User ID: {userId}</div>
        <div>Online: {navigator.onLine ? "✅" : "❌"}</div>
        <div>Last Update: {formatTime(Date.now())}</div>
      </div>

      <div className="flex gap-2 mt-3">
        <button 
          onClick={testConnection}
          className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          Test Connection
        </button>
        <button 
          onClick={() => console.log("Full Debug:", debugInfo)}
          className="bg-green-600 px-2 py-1 rounded text-xs hover:bg-green-700"
        >
          Log Details
        </button>
      </div>
    </div>
  );
};

export default WebSocketDebug;