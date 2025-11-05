// dashboard/explorer/video-call/LiveCall.tsx - FIXED: ProfileCard shows explorer themselves
"use client";
import CallHeader from "./components/CallHeader";
import ProfileCard from "./components/ProfileCard";
import InteractionPanel from "./components/InteractionPanel";
import BidComponent from "./components/BidComponent";
import Timer from "./Timer";
import { useState, useEffect, useCallback, useRef } from "react";
import GiftPanel from "./components/GiftPanel";
import CameraStream from "@/src/components/CameraStream";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useExplorerNotifications } from "./components/ExplorerNotifications";
import LoadingState from "@/src/components/app-reusables/LoadingState";
import MediaPermissionsHandler from "@/src/lib/providers/MediaPermissionsHandler";
import BillingStatus from "@/src/components/billing/BillingStatus";

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
  influencer?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    profile?: {
      username?: string;
      location?: string;
      callRate?: string;
    };
  };
  currentExplorer?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

interface GiftType {
  id: string;
  name: string;
  icon: string;
  price: number;
}

const LiveCall = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [currentCallState, setCurrentCallState] = useState<
    "joining" | "waiting" | "ongoing" | "ending"
  >("joining");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<StreamSession | null>(
    null
  );
  const [callDuration, setCallDuration] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [giftTypes, setGiftTypes] = useState<GiftType[]>([]);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [sessionFetchAttempts, setSessionFetchAttempts] = useState(0);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);

  // NEW: Profile card state
  const [isProfileMinimized, setIsProfileMinimized] = useState(false);

  // NEW: Video refs for sharing streams
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [videoRefs, setVideoRefs] = useState<{
    localVideoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    localStreamRef: React.RefObject<MediaStream | null>;
    remoteStreamRef: React.RefObject<MediaStream | null>;
  } | null>(null);

  // Enhanced connection health monitoring
  const [connectionHealth, setConnectionHealth] = useState({
    webSocket: false,
    mediaStream: false,
    mediaSoup: false,
    lastCheck: Date.now(),
  });

  // Critical error handling
  const [criticalError, setCriticalError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const notifications = useExplorerNotifications();

  // Get current user details
  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  // Enhanced critical error handler
  const handleCriticalError = useCallback(
    (error: string) => {
      console.error("💥 [Critical Error]:", error);
      setCriticalError(error);

      // Auto-redirect after critical error
      setTimeout(() => {
        router.push("/dashboard/explorer/live");
      }, 5000);
    },
    [router]
  );

  // FIXED: Direct session switching for bid acceptance
  const switchToSession = useCallback(async (targetSessionId: string) => {
    console.log(`🔄 [Explorer] Switching to session: ${targetSessionId}`);

    // Reset state for new session
    setSessionInitialized(false);
    setCurrentCallState("joining");
    setCurrentSession(null);
    setCallDuration(0);
    setIsVideoReady(false);

    // Update session ID
    setSessionId(targetSessionId);

    // Update URL without reload
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("sessionId", targetSessionId);
    window.history.replaceState({}, "", currentUrl.toString());

    // Fetch new session details and join
    try {
      await handleSessionJoin(targetSessionId);
    } catch (error) {
      console.error("❌ [Explorer] Failed to switch sessions:", error);
      handleCriticalError(`Failed to switch to session: ${error}`);
    }
  }, []);

  // WebSocket connection with comprehensive event handlers
  const webSocket = useWebSocket(userDetails?.id, {
    onStreamJoined: (data) => {
      console.log("🔵 STREAM_JOINED event received:", data);

      if (data.success) {
        console.log("✅ Stream join successful, setting state to ongoing");
        setCurrentCallState("ongoing");

        // Only show notification if this is our own join event
        if (data.userId === userDetails?.id) {
          if (notifications) {
            notifications.notifyInfluencerJoined(
              currentSession?.influencer?.firstName ||
                currentSession?.influencer?.profile?.username ||
                "Influencer"
            );
          } else {
            toast.success("Successfully joined the stream!");
          }
        }

        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        console.error("❌ Stream join failed:", data);
        toast.error("Failed to join stream");
        setTimeout(() => {
          router.push("/dashboard/explorer/live");
        }, 2000);
      }
    },

    onSessionEnded: (data) => {
      console.log("🔵 SESSION_ENDED:", data);
      setCurrentSession(null);
      setCurrentCallState("ending");
      toast.info("Stream session ended");

      setTimeout(() => {
        router.push("/dashboard/explorer/live");
      }, 2000);
    },

    onUserDisconnected: (data) => {
      console.log("🔵 USER_DISCONNECTED:", data);
      if (data.userId !== userDetails?.id) {
        if (notifications) {
          notifications.notifyInfluencerLeft(
            currentSession?.influencer?.firstName || "Influencer"
          );
        } else {
          toast.warning("Influencer left the call");
        }
        setCurrentCallState("ending");

        setTimeout(() => {
          router.push("/dashboard/explorer/live");
        }, 3000);
      }
    },

    // In dashboard/explorer/video-call/LiveCall.tsx, update the bid accepted handler:
    onBidAccepted: async (data) => {
      console.log("✅ Bid accepted event received:", data);

      // Check if this bid acceptance is for the current user
      if (data.bidderId === userDetails?.id) {
        console.log(
          `🎯 [Explorer] Our bid was accepted! Session ${data.sessionId}`
        );

        // Clean up current connections before switching
        if (videoRefs?.localStreamRef.current) {
          console.log("🧹 [Explorer] Cleaning up current media streams");
          videoRefs.localStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());
        }

        // Leave current session if different
        if (sessionId && sessionId !== data.sessionId) {
          console.log(`🚪 [Explorer] Leaving current session ${sessionId}`);
          webSocket.actions.leaveSession(sessionId);
        }

        // Update state for new session
        setSessionId(data.sessionId);
        setCurrentSession(null);
        setSessionInitialized(false);
        setCurrentCallState("joining");
        setCallDuration(0);
        setIsVideoReady(false);

        // Update URL to reflect new session
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("sessionId", data.sessionId);
        window.history.replaceState({}, "", newUrl.toString());

        // Join the new session
        try {
          console.log(
            `🚀 [Explorer] Joining accepted bid session ${data.sessionId}`
          );

          // Use a small delay to ensure cleanup is complete
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Join the new session
          await handleSessionJoin(data.sessionId);

          // Notify user of successful connection
          if (notifications) {
            notifications.notifyInfluencerJoined(
              data?.influencerName || "Influencer"
            );
          } else {
            toast.success("Connected to influencer!");
          }
        } catch (error) {
          console.error(
            "❌ [Explorer] Failed to join accepted bid session:",
            error
          );
          handleCriticalError(
            `Failed to connect after bid acceptance: ${error}`
          );
        }
      }
    },

    onBidRejected: (data) => {
      console.log("🚫 Bid rejected event:", data);
      if (data.bidderId === userDetails?.id) {
        if (notifications) {
          notifications.notifyBidRejected({
            amount: data.amount,
            reason: data.reason,
          });
        } else {
          toast.error("Your bid was rejected");
        }

        setTimeout(() => {
          router.push("/dashboard/explorer/live");
        }, 2000);
      }
    },

    onOutbid: (data) => {
      console.log("💸 Outbid event:", data);
      if (data.previousBidderId === userDetails?.id) {
        if (notifications) {
          notifications.notifyOutbid({
            previousAmount: data.previousAmount || 0,
            newAmount: data.newHighestBid,
          });
        } else {
          toast.warning(
            `You were outbid! New highest bid: $${data.newHighestBid}`
          );
        }
      }
    },

    onGiftSent: (data) => {
      console.log("🎁 Gift sent successfully:", data);
      setSendingGift(false);
      setShowGiftPanel(false);
      setSelectedGift(null);

      setTotalCost((prev) => prev + data.amount);

      if (notifications) {
        notifications.notifyGiftSent({
          type: data.giftType,
          amount: data.amount,
        });
      } else {
        toast.success(`Gift sent to ${currentSession?.influencer?.firstName}!`);
      }
    },

    onEarningsUpdated: (data) => {
      console.log("💰 Earnings updated:", data);
    },

    onError: (data) => {
      console.log("🔵 ERROR:", data);
      setSendingGift(false);

      if (notifications) {
        notifications.notifyConnectionIssue(
          data.message || "Something went wrong"
        );
      } else {
        toast.error(data.message || "Something went wrong");
      }

      if (data.code === "SESSION_NOT_FOUND") {
        router.push("/dashboard/explorer/live");
      }
    },
  });

  // FIXED: Enhanced session joining that ensures proper room joining
  const handleSessionJoin = useCallback(
    async (targetSessionId: string) => {
      if (!webSocket.socket || !userDetails?.id) {
        console.error(
          "❌ [Explorer] Cannot join - missing socket or user details"
        );
        throw new Error("Missing socket or user details");
      }

      console.log("🎬 [Explorer] Joining session:", targetSessionId);
      setCurrentCallState("joining");

      try {
        // First, get session details to understand current state
        const sessionDetails = await new Promise<StreamSession>(
          (resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Session fetch timeout"));
            }, 10000);

            const handleResponse = (response: any) => {
              clearTimeout(timeout);
              if (response.success && response.session) {
                resolve(response.session);
              } else {
                reject(new Error(response.error || "Session not found"));
              }
            };

            webSocket.socket.once("STREAM_SESSION_RESPONSE", handleResponse);
            webSocket.socket.emit("get_stream_session", {
              sessionId: targetSessionId,
            });
          }
        );

        console.log("📋 [Explorer] Session details:", sessionDetails);
        setCurrentSession(sessionDetails);

        // Ensure we're not already the current explorer
        if (sessionDetails.currentExplorerId === userDetails.id) {
          console.log(
            "🎯 [Explorer] We are already connected to this session!"
          );
          setCurrentCallState("ongoing");

          if (notifications) {
            notifications.notifyInfluencerJoined(
              sessionDetails.influencer?.firstName ||
                sessionDetails.influencer?.profile?.username ||
                "Influencer"
            );
          } else {
            toast.success("Reconnected to the stream!");
          }

          setSessionInitialized(true);
          return;
        }

        // CRITICAL: Join the stream with explicit session confirmation
        console.log(
          `🔗 [Explorer] Joining WebSocket room for session: ${targetSessionId}`
        );

        const joinResult = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Join timeout"));
          }, 15000);

          const handleJoinResponse = (response: any) => {
            clearTimeout(timeout);
            console.log("📨 [Explorer] Join response:", response);
            resolve(response);
          };

          webSocket.socket.emit(
            "join_stream",
            { sessionId: targetSessionId },
            handleJoinResponse
          );
        });

        if (joinResult.success) {
          console.log("✅ [Explorer] Successfully joined session");
          // The STREAM_JOINED event will handle state transition
        } else {
          throw new Error(joinResult.error || "Failed to join stream");
        }

        setSessionInitialized(true);
      } catch (error) {
        console.error("❌ [Explorer] Failed to join session:", error);
        setCurrentCallState("joining");
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : String(error);

        throw new Error(errorMessage);
      }
    },
    [webSocket.socket, userDetails?.id, notifications]
  );

  // Get sessionId from URL and join the session
  useEffect(() => {
    const urlSessionId = searchParams?.get("sessionId");
    
    // If no sessionId in URL, redirect to live streams page
    if (!urlSessionId) {
      console.log("🎬 No sessionId in URL, redirecting to live streams");
      router.push("/dashboard/explorer/live");
      return;
    }
    
    if (
      urlSessionId &&
      webSocket.isReady &&
      userDetails?.id &&
      !sessionInitialized
    ) {
      setSessionId(urlSessionId);
      console.log("🎬 Explorer attempting to join session:", urlSessionId);

      setSessionFetchAttempts(0);
      handleSessionJoin(urlSessionId).catch((error) => {
        console.error("❌ [Explorer] Initial session join failed:", error);
        toast.error(`Failed to join stream: ${error.message}`);
        setTimeout(() => {
          router.push("/dashboard/explorer/live");
        }, 2000);
      });
    }
  }, [
    searchParams,
    webSocket.isReady,
    userDetails?.id,
    handleSessionJoin,
    sessionInitialized,
    router,
  ]);

  // Monitor connection health
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const health = {
        webSocket: webSocket.isReady,
        mediaStream: isVideoReady,
        mediaSoup: connectionStatus === "connected",
        lastCheck: Date.now(),
      };

      setConnectionHealth(health);

      // Log health status for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("📊 [Connection Health]:", health);
      }

      // Auto-recovery logic
      if (!health.webSocket && webSocket.isConnected) {
        console.log("🔄 [Auto-Recovery] Attempting WebSocket reconnection...");
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [
    webSocket.isReady,
    isVideoReady,
    connectionStatus,
    webSocket.isConnected,
  ]);

  // Monitor for critical errors
  useEffect(() => {
    // If all connections fail for more than 30 seconds, consider it critical
    const criticalThreshold = 30000; // 30 seconds

    if (
      !webSocket.isReady &&
      !isVideoReady &&
      connectionStatus === "disconnected"
    ) {
      const timeSinceLastCheck = Date.now() - connectionHealth.lastCheck;

      if (timeSinceLastCheck > criticalThreshold) {
        handleCriticalError("Multiple connection failures detected");
      }
    }
  }, [
    webSocket.isReady,
    isVideoReady,
    connectionStatus,
    connectionHealth.lastCheck,
    handleCriticalError,
  ]);

  // Get gift types
  useEffect(() => {
    if (webSocket.socket) {
      const handleGiftTypesResponse = (response: any) => {
        if (response.success) {
          setGiftTypes(response.giftTypes || []);
          console.log("🎁 Gift types loaded:", response.giftTypes?.length || 0);
        }
      };

      webSocket.socket.on("GIFT_TYPES_RESPONSE", handleGiftTypesResponse);
      webSocket.socket.emit("get_gift_types");

      return () => {
        webSocket.socket.off("GIFT_TYPES_RESPONSE", handleGiftTypesResponse);
      };
    }
  }, [webSocket.socket]);

  // Call duration and cost tracking
  useEffect(() => {
    if (currentCallState === "ongoing") {
      const interval = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1;

          if (currentSession?.influencer?.profile?.callRate) {
            const ratePerMinute = parseFloat(
              currentSession.influencer.profile.callRate
            );
            const minutes = newDuration / 60;
            const newCost = minutes * ratePerMinute;
            setTotalCost((prev) => {
              if (Math.abs(newCost - prev) > 0.01) {
                return newCost;
              }
              return prev;
            });

            if (newCost > 50 && newCost % 25 < 1 && notifications) {
              notifications.notifyCostWarning(newCost);
            }
          }

          return newDuration;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [currentCallState, currentSession, notifications]);

  // Connection status tracking
  useEffect(() => {
    if (webSocket.isReady) {
      setConnectionStatus("connected");
    } else if (webSocket.isConnected) {
      setConnectionStatus("connecting");
    } else {
      setConnectionStatus("disconnected");
    }
  }, [webSocket.isReady, webSocket.isConnected]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleGiftPanel = useCallback(() => {
    setShowGiftPanel((prev) => !prev);
    if (showGiftPanel) {
      setSelectedGift(null);
    }
  }, [showGiftPanel]);

  const handleSendGift = useCallback(
    async (giftTypeId: string) => {
      if (!currentSession || !userDetails?.id || sendingGift) {
        return;
      }

      setSendingGift(true);
      setSelectedGift(giftTypeId);

      try {
        if (webSocket.socket) {
          webSocket.socket.emit(
            "send_gift",
            {
              sessionId: currentSession.id,
              giftTypeId,
              influencerId: currentSession.influencerId,
              message: `Gift from ${userDetails.firstName || "Explorer"}`,
            },
            (response: any) => {
              if (!response.success) {
                console.error("❌ Failed to send gift:", response.error);
                setSendingGift(false);
                setSelectedGift(null);
                toast.error("Failed to send gift");
              }
            }
          );
        }
      } catch (error) {
        console.error("Error sending gift:", error);
        setSendingGift(false);
        setSelectedGift(null);
        toast.error("Failed to send gift");
      }
    },
    [currentSession, userDetails?.id, sendingGift, webSocket.socket]
  );

  const handleEndCall = useCallback(() => {
    if (sessionId) {
      console.log("🔚 Explorer leaving session:", sessionId);
      webSocket.actions.leaveSession(sessionId);
      setCurrentCallState("ending");

      setTimeout(() => {
        router.push("/dashboard/explorer/live");
      }, 1000);
    } else {
      router.push("/dashboard/explorer/live");
    }
  }, [sessionId, webSocket, router]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Connection Health Indicator Component
  const ConnectionHealthIndicator = () => (
    <div className="absolute top-4 left-4 z-50">
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 ${
          connectionHealth.webSocket &&
          connectionHealth.mediaStream &&
          connectionHealth.mediaSoup
            ? "bg-green-500 text-white"
            : connectionHealth.webSocket && connectionHealth.mediaStream
            ? "bg-yellow-500 text-black"
            : "bg-red-500 text-white"
        }`}
      >
        <span>
          {connectionHealth.webSocket &&
          connectionHealth.mediaStream &&
          connectionHealth.mediaSoup
            ? "🟢"
            : connectionHealth.webSocket && connectionHealth.mediaStream
            ? "🟡"
            : "🔴"}
        </span>
        <span>
          {connectionHealth.webSocket &&
          connectionHealth.mediaStream &&
          connectionHealth.mediaSoup
            ? "Connected"
            : connectionHealth.webSocket && connectionHealth.mediaStream
            ? "Connecting..."
            : "Connection Issues"}
        </span>
      </div>
    </div>
  );

  // Render critical error state
  if (criticalError) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-red-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-sm opacity-75 mb-4">{criticalError}</p>
          <p className="text-xs opacity-50 mb-4">
            We're experiencing technical difficulties. You'll be redirected
            shortly.
          </p>
          <button
            onClick={() => router.push("/dashboard/explorer/live")}
            className="px-4 py-2 bg-white text-red-900 rounded hover:bg-gray-100 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Enhanced loading state with connection details
  if (!webSocket.isReady || !sessionId || !sessionInitialized) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-blue flex items-center justify-center">
        <div className="text-center text-white max-w-sm flex flex-col items-center">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg mb-2">Setting up connection...</p> */}

          <LoadingState />

          <p className="text-lg mb-2 mt-4">Setting up connection..</p>

          {/* <div className="space-y-2 text-sm">
            <div
              className={`flex items-center justify-center space-x-2 ${
                connectionHealth.webSocket
                  ? "text-green-300"
                  : "text-yellow-300"
              }`}
            >
              <span>{connectionHealth.webSocket ? "✅" : "🔄"}</span>
              <span>WebSocket</span>
            </div>

            <div
              className={`flex items-center justify-center space-x-2 ${
                connectionHealth.mediaStream
                  ? "text-green-300"
                  : "text-yellow-300"
              }`}
            >
              <span>{connectionHealth.mediaStream ? "✅" : "🔄"}</span>
              <span>Media Stream</span>
            </div>

            <div
              className={`flex items-center justify-center space-x-2 ${
                connectionHealth.mediaSoup
                  ? "text-green-300"
                  : "text-yellow-300"
              }`}
            >
              <span>{connectionHealth.mediaSoup ? "✅" : "🔄"}</span>
              <span>Video Connection</span>
            </div>
          </div>

          <p className="text-xs opacity-75 mt-4">
            {sessionInitialized
              ? "Checking connection status..."
              : "Joining stream..."}
          </p> */}
        </div>
      </div>
    );
  }

  // Joining state with better UX
  if (currentCallState === "joining") {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-blue flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">📹</div>
          <p className="text-lg">
            Joining{" "}
            {currentSession?.influencer?.firstName ||
              currentSession?.influencer?.profile?.username ||
              "stream"}
            ...
          </p>
          <p className="text-sm opacity-75 mt-2">
            Please wait while we connect you
          </p>

          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting state
  if (currentCallState === "waiting") {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-blue flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg">
            Waiting for {currentSession?.influencer?.firstName}...
          </p>
          <p className="text-sm opacity-75 mt-2">
            The influencer will join shortly
          </p>
          <button
            onClick={() => router.push("/dashboard/explorer/live")}
            className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Back to Live Streams
          </button>
        </div>
      </div>
    );
  }

  // Main video call interface
  return (

    <div
      className={`relative h-screen w-full overflow-hidden ${
        showGiftPanel ? "bg-white" : "bg-blue"
      } transition-colors duration-300`}
    >
      {/* FIXED: Enhanced Camera Stream with video ref sharing */}
      <CameraStream
        isMuted={isMuted}
        onVideoReady={setIsVideoReady}
        isInfluencer={false}
        isExplorer={true}
        sessionId={sessionId}
        userId={userDetails?.id}
        onVideoRefsReady={setVideoRefs}
      />

      <ConnectionHealthIndicator />

      {currentSession?.influencer && (
        <CallHeader
          name={
            `${currentSession.influencer.firstName || ""} ${
              currentSession.influencer.lastName || ""
            }`.trim() ||
            currentSession.influencer.profile?.username ||
            "Influencer"
          }
          profileImage={currentSession.influencer.profileImage}
          connectionStatus={connectionStatus}
          callDuration={callDuration}
        />
      )}

      <Timer
        time={formatTime(callDuration)}
        className={`absolute lg:left-1/2 transform lg:-translate-x-1/2 transition-all duration-300 ${
          showGiftPanel
            ? "bottom-[25.5rem] lg:bottom-72 2xl:bottom-80"
            : "bottom-40 lg:bottom-32 2xl:bottom-40"
        } w-max lg:w-auto ml-4 lg:ml-0`}
        callRate={
          currentSession?.influencer?.profile?.callRate
            ? parseFloat(currentSession.influencer.profile.callRate)
            : undefined
        }
        totalCost={totalCost}
        connectionQuality={
          connectionStatus === "connected"
            ? "good"
            : connectionStatus === "connecting"
            ? "fair"
            : "poor"
        }
      />

      {/* Billing Status Component */}
      {currentCallState === "ongoing" && currentSession && (
        <BillingStatus
          sessionId={sessionId || ""}
          bidAmount={bidAmount}
          callDuration={callDuration}
          callRate={
            currentSession?.influencer?.profile?.callRate
              ? parseFloat(currentSession.influencer.profile.callRate)
              : undefined
          }
          className="absolute top-20 right-4 w-80 z-40"
        />
      )}

      {showGiftPanel && (
        <GiftPanel
          giftTypes={giftTypes}
          selectedGift={selectedGift}
          onSelectGift={setSelectedGift}
          onSendGift={handleSendGift}
          isLoading={sendingGift}
        />
      )}

      <InteractionPanel
        isMuted={isMuted}
        onMuteToggle={toggleMute}
        onGiftClick={toggleGiftPanel}
        showGiftPanel={showGiftPanel}
        onEndCall={handleEndCall}
        isCallOngoing={currentCallState === "ongoing"}
      />

      {/* FIXED: ProfileCard shows the EXPLORER themselves (current user) */}
      {videoRefs && userDetails && (
        <ProfileCard
          imageUrl={userDetails.profileImage || "/img/hbb_user_logo.png"}
          explorerName={
            `${userDetails.firstName || ""} ${
              userDetails.lastName || ""
            }`.trim() ||
            userDetails.email?.split("@")[0] ||
            "Explorer"
          }
          location="Your Location"
          callRate={
            currentSession?.influencer?.profile?.callRate
              ? parseFloat(currentSession.influencer.profile.callRate)
              : undefined
          }
          isMinimized={isProfileMinimized}
          onMinimizeToggle={() => setIsProfileMinimized(!isProfileMinimized)}
          isExplorer={true}
          showLiveVideo={true}
          videoRef={videoRefs.localVideoRef} // FIXED: Show explorer themselves (local video)
        />
      )}

      {/* BidComponent for Explorers - Show when waiting for bid acceptance or during call */}
      {currentSession && currentCallState === "ongoing" && (
        <BidComponent
          stream={currentSession}
          onBidAccepted={() => {
            console.log("✅ Bid accepted callback triggered");
            setCurrentCallState("ongoing");
          }}
          onBidRejected={() => {
            console.log("❌ Bid rejected callback triggered");
            toast.error("Your bid was rejected");
          }}
          onOutbid={(newHighestBid) => {
            console.log("📈 Outbid callback triggered:", newHighestBid);
            toast.warning(`You were outbid! New highest: $${newHighestBid}`);
          }}
          className="absolute top-20 left-4 w-80 z-40"
        />
      )}

      {/* Timer for Explorers - Show when call is ongoing */}
      {currentCallState === "ongoing" && currentSession && (
        <Timer
          time={formatTime(callDuration)}
          className="absolute lg:left-1/2 transform lg:-translate-x-1/2 transition-all duration-300 bottom-40 lg:bottom-32 2xl:bottom-40 w-max lg:w-auto ml-4 lg:ml-0"
          maxTime={1800}
          showProgress={true}
        />
      )}

      {/* BillingStatus for Explorers - Show during call */}
      {currentCallState === "ongoing" && currentSession && (
        <BillingStatus
          sessionId={sessionId || ""}
          bidAmount={bidAmount}
          callDuration={callDuration}
          callRate={
            currentSession?.influencer?.profile?.callRate
              ? parseFloat(currentSession.influencer.profile.callRate)
              : undefined
          }
          className="absolute top-20 right-4 w-80 z-40"
        />
      )}

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded text-xs max-w-xs space-y-1">
          <p>
            <strong>Session:</strong> {sessionId}
          </p>
          <p>
            <strong>State:</strong> {currentCallState}
          </p>
          <p>
            <strong>Current Explorer:</strong>{" "}
            {currentSession?.currentExplorerId || "None"}
          </p>
          <p>
            <strong>We are explorer:</strong>{" "}
            {currentSession?.currentExplorerId === userDetails?.id
              ? "Yes"
              : "No"}
          </p>
          <p>
            <strong>WebSocket:</strong>{" "}
            {webSocket.isReady ? "Ready" : "Not Ready"}
          </p>
          <p>
            <strong>Video:</strong> {isVideoReady ? "Ready" : "Loading"}
          </p>
          <p>
            <strong>Duration:</strong> {formatTime(callDuration)}
          </p>
          <p>
            <strong>Initialized:</strong> {sessionInitialized ? "Yes" : "No"}
          </p>
        </div>
      )}

      {currentCallState === "ending" && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="text-2xl mb-4">📹</div>
            <h2 className="text-xl font-semibold mb-2">Call Ended</h2>
            <p className="text-sm opacity-75 mb-4">
              Thank you for using the platform!
            </p>
            {totalCost > 0 && (
              <p className="text-sm opacity-75 mb-4">
                Total cost: ${totalCost.toFixed(2)}
              </p>
            )}
            <p className="text-xs opacity-50">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCall;
