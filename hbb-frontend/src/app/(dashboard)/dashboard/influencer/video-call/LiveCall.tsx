// dashboard/influencer/video-call/LiveCall.tsx - FIXED: Shows explorer info when connected
"use client";
import CallHeader from "./components/CallHeader";
import ProfileCard from "./components/ProfileCard";
import InteractionPanel from "./components/InteractionPanel";
import Timer from "./Timer";
import { useState, useEffect, useCallback, useRef } from "react";
import CameraStream from "@/src/components/CameraStream";
import RulesAccordion from "./components/RulesAccordion";
import Earnings from "./components/Earnings";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import BidPanel from "./components/BidPanel";
import WaitingForExplorer from "./components/WaitingForExplorer";
import BidAcceptedCountdown from "./components/BidAcceptedCountdown";
import { useVideoCallNotifications } from "@/src/components/app-reusables/notifications/VideoCallNotifications";
import LoadingState from "@/src/components/app-reusables/LoadingState";

interface Bid {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName?: string;
  timestamp: Date;
}

interface Explorer {
  id: string;
  name?: string;
  profileImage?: string;
  location?: string;
}

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
  currentExplorer?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

const LiveCall = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [currentCallState, setCurrentCallState] = useState<
    "waiting" | "countdown" | "ongoing" | "ending"
  >("waiting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<StreamSession | null>(
    null
  );
  const [incomingBids, setIncomingBids] = useState<Bid[]>([]);
  const [currentExplorer, setCurrentExplorer] = useState<Explorer | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [earnings, setEarnings] = useState({ video: 0, gifts: 0 });
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [acceptedBidInfo, setAcceptedBidInfo] = useState<{
    bidAmount: number;
    explorerName: string;
    explorerImage?: string;
    explorerLocation?: string;
  } | null>(null);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // NEW: Profile card state
  const [isProfileMinimized, setIsProfileMinimized] = useState(false);

  // NEW: Video refs for sharing streams
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
  const notifications = useVideoCallNotifications();

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
        router.push("/dashboard/influencer/live");
      }, 5000);
    },
    [router]
  );

  // WebSocket connection with comprehensive event handlers
  const webSocket = useWebSocket(userDetails?.id, {
    onSessionCreated: (data) => {
      console.log("🔵 SESSION_CREATED:", data);
      setCurrentSession(data as any);
      setSessionId(data.sessionId);
      setCurrentCallState("waiting");
      toast.success("Stream session created successfully!");
    },

    onStreamJoined: (data) => {
      console.log("🔵 STREAM_JOINED:", data);
      if (data.userId !== userDetails?.id && data.success) {
        const explorer: Explorer = {
          id: data.userId,
          name: data.userName || data.userId.slice(0, 8),
          profileImage: data.profileImage || "/img/hbb_user_logo.png",
          location: "Unknown Location",
        };

        console.log("✅ Explorer joined, setting state to ongoing");
        setCurrentExplorer(explorer);
        setCurrentCallState("ongoing");
        setAcceptedBidInfo(null);
        setIncomingBids([]);
        if (notifications && explorer.name) {
          notifications.notifyExplorerJoined(explorer.name);
        } else if (explorer.name) {
          toast.success(`${explorer.name} joined your stream!`);
        }
      }
    },

    onSessionEnded: (data) => {
      console.log("🔵 SESSION_ENDED:", data);
      setCurrentSession(null);
      setIncomingBids([]);
      setCurrentExplorer(null);
      setCurrentCallState("ending");
      toast.info("Stream session ended");

      setTimeout(() => {
        router.push("/dashboard/influencer/live");
      }, 2000);
    },

    // Enhanced bid event handling
    onBidPlaced: (data) => {
      console.log("💰 BID_PLACED received:", data);

      const newBid: Bid = {
        bidId: data.bidId,
        sessionId: data.sessionId,
        amount: data.amount,
        bidderId: data.bidderId,
        bidderName: data.bidderName || data.userName,
        timestamp: new Date(data.timestamp || Date.now()),
      };

      setIncomingBids((prev) => {
        const filtered = prev.filter((bid) => bid.bidderId !== data.bidderId);
        const newBids = [newBid, ...filtered].sort(
          (a, b) => b.amount - a.amount
        );
        console.log("💰 Updated bids state:", newBids.length);
        return newBids;
      });

      if (currentCallState !== "waiting" && currentCallState !== "ongoing") {
        setCurrentCallState("waiting");
      }

      if (notifications) {
        notifications.notifyBidReceived({
          amount: data.amount,
          bidderName: data.bidderName || "Anonymous",
        });
      } else {
        toast.info(
          `💰 New bid: $${data.amount} from ${data.bidderName || "Anonymous"}`
        );
      }
    },

    onNewBid: (data) => {
      console.log("💰 NEW_BID received:", data);
      const newBid: Bid = {
        bidId: data.bidId,
        sessionId: data.sessionId,
        amount: data.amount,
        bidderId: data.bidderId,
        bidderName: data.bidderName,
        timestamp: new Date(data.timestamp || Date.now()),
      };

      setIncomingBids((prev) => {
        if (prev.some((bid) => bid.bidId === newBid.bidId)) {
          return prev;
        }
        const filtered = prev.filter((bid) => bid.bidderId !== data.bidderId);
        return [newBid, ...filtered].sort((a, b) => b.amount - a.amount);
      });
    },

    onBidAccepted: (data) => {
      console.log("✅ Bid accepted event received:", data);

      setProcessingBidId(null);
      setIncomingBids((prev) => prev.filter((bid) => bid.bidId !== data.bidId));

      const bidInfo = {
        bidAmount: data.amount,
        explorerName: data.bidderName || data.bidderId.slice(0, 8),
        explorerImage: data.profileImage || "/img/hbb_user_logo.png",
        explorerLocation: data.explorerLocation || "Unknown Location",
      };

      setAcceptedBidInfo(bidInfo);
      setCurrentCallState("countdown");
      setIncomingBids([]);

      setEarnings((prev) => {
        const newVideoEarnings = prev.video + data.amount;
        if (notifications) {
          notifications.notifyEarningUpdate(data.amount);
        }
        return { ...prev, video: newVideoEarnings };
      });

      if (notifications) {
        notifications.showNotification({
          type: "earning",
          title: "Bid Accepted!",
          message: `$${data.amount} bid from ${bidInfo.explorerName} accepted`,
          duration: 5000,
        });
      }
    },

    onBidRejected: (data) => {
      console.log("🔵 BID_REJECTED:", data);
      setProcessingBidId(null);
      setIncomingBids((prev) => prev.filter((bid) => bid.bidId !== data.bidId));

      if (notifications) {
        notifications.showNotification({
          type: "info",
          title: "Bid Rejected",
          message: `Bid from ${data.bidderName || "Anonymous"} was rejected`,
          duration: 3000,
        });
      } else {
        toast.info(`Bid from ${data.bidderName || "Anonymous"} rejected`);
      }
    },

    onUserDisconnected: (data) => {
      console.log("🔵 USER_DISCONNECTED:", data);
      if (data.userId === currentExplorer?.id) {
        if (notifications) {
          notifications.notifyExplorerLeft(currentExplorer.name || "Explorer");
        } else {
          toast.warning("Explorer left the call");
        }
        setCurrentExplorer(null);
        setCurrentCallState("waiting");
        setCallDuration(0);
      }
    },

    onGiftReceived: (data) => {
      console.log("🎁 Gift received:", data);
      setEarnings((prev) => ({
        ...prev,
        gifts: prev.gifts + data.amount,
      }));

      toast.success(`Received ${data.giftType} worth $${data.amount}!`);
    },

    onError: (data) => {
      console.log("🔵 ERROR:", data);
      setProcessingBidId(null);
      toast.error(data.message || "Something went wrong");

      if (data.code === "SESSION_NOT_FOUND") {
        router.push("/dashboard/influencer/live");
      }
    },
  });

  // FIXED: Enhanced session setup that checks for existing explorer
  const handleSessionSetup = useCallback(
    async (sessionId: string) => {
      if (!webSocket.socket || !userDetails?.id) {
        console.error(
          "❌ [Influencer] Cannot setup - missing socket or user details"
        );
        return;
      }

      console.log("👑 [Influencer] Setting up session:", sessionId);

      try {
        // Verify session exists and we're the owner
        const sessionDetails = await new Promise<StreamSession>(
          (resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Session verification timeout"));
            }, 10000);

            const handleResponse = (response: any) => {
              clearTimeout(timeout);
              if (response.success && response.session) {
                if (response.session.influencerId === userDetails.id) {
                  resolve(response.session);
                } else {
                  reject(new Error("Not authorized for this session"));
                }
              } else {
                reject(new Error(response.error || "Session not found"));
              }
            };

            webSocket.socket.once("STREAM_SESSION_RESPONSE", handleResponse);
            webSocket.socket.emit("get_stream_session", { sessionId });
          }
        );

        setCurrentSession(sessionDetails);

        // CRITICAL FIX: Explicitly join the stream room to receive bid events
        console.log("🎯 [Influencer] Joining stream room:", sessionId);
        try {
          await webSocket.actions.joinStream(sessionId);
          console.log("✅ [Influencer] Successfully joined stream room");
        } catch (error) {
          console.error("❌ [Influencer] Failed to join stream room:", error);
          // Continue anyway - the stream might still work
        }

        // Check if there's already an explorer connected
        if (
          sessionDetails.currentExplorerId &&
          sessionDetails.currentExplorer
        ) {
          console.log(
            "👤 [Influencer] Explorer already connected:",
            sessionDetails.currentExplorer
          );

          const explorer: Explorer = {
            id: sessionDetails.currentExplorerId,
            name:
              `${sessionDetails.currentExplorer.firstName || ""} ${
                sessionDetails.currentExplorer.lastName || ""
              }`.trim() || sessionDetails.currentExplorerId.slice(0, 8),
            profileImage:
              sessionDetails.currentExplorer.profileImage ||
              "/img/hbb_user_logo.png",
            location: "Connected",
          };

          setCurrentExplorer(explorer);
          setCurrentCallState("ongoing");

          if (notifications) {
            notifications.notifyExplorerJoined(explorer.name || "Explorer");
          } else {
            toast.success(`${explorer.name} is connected to your stream!`);
          }
        } else {
          setCurrentCallState("waiting");
        }

        setSessionInitialized(true);
        console.log("✅ [Influencer] Session setup complete");
      } catch (error) {
        console.error("❌ [Influencer] Failed to setup session:", error);
        toast.error(
          `Failed to setup stream: ${
            error instanceof Error ? error.message : String(error)
          }`
        );

        setTimeout(() => {
          router.push("/dashboard/influencer/live");
        }, 2000);
      }
    },
    [
      webSocket.socket,
      webSocket.actions,
      userDetails?.id,
      router,
      notifications,
    ]
  );

  // Get sessionId from URL and set up the session
  useEffect(() => {
    const urlSessionId = searchParams?.get("sessionId");
    
    // If no sessionId in URL, redirect to live page
    if (!urlSessionId) {
      console.log("🎬 No sessionId in URL, redirecting to live page");
      router.push("/dashboard/influencer/live");
      return;
    }
    
    if (
      urlSessionId &&
      webSocket.isReady &&
      userDetails?.id &&
      !sessionInitialized
    ) {
      setSessionId(urlSessionId);
      console.log("🎬 Setting up influencer session:", urlSessionId);

      handleSessionSetup(urlSessionId);
    }
  }, [
    searchParams,
    webSocket.isReady,
    userDetails?.id,
    handleSessionSetup,
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

  // Timer for call duration - only runs when explorer is connected
  useEffect(() => {
    if (currentCallState === "ongoing" && currentExplorer) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [currentCallState, currentExplorer]);

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

  const handleAcceptBid = useCallback(
    (bidId: string) => {
      if (!webSocket.isReady) {
        toast.error("Connection not ready");
        return;
      }

      if (processingBidId === bidId) {
        console.log("🚫 Bid already being processed:", bidId);
        return;
      }

      console.log("🎯 Accepting bid:", bidId);
      setProcessingBidId(bidId);

      try {
        webSocket.actions.acceptBid(bidId);
        console.log("✅ acceptBid action called successfully");
      } catch (error) {
        console.error("❌ Error calling acceptBid:", error);
        setProcessingBidId(null);
      }

      setTimeout(() => {
        if (processingBidId === bidId) {
          setProcessingBidId(null);
          toast.error("Bid acceptance timed out. Please try again.");
        }
      }, 10000);
    },
    [webSocket, processingBidId]
  );

  const handleRejectBid = useCallback(
    (bidId: string) => {
      if (!webSocket.isReady) {
        toast.error("Connection not ready");
        return;
      }

      console.log("🚫 Rejecting bid:", bidId);
      webSocket.actions.rejectBid(bidId);
    },
    [webSocket]
  );

  const handleEndCall = useCallback(() => {
    if (sessionId && webSocket.isReady) {
      console.log("🔚 Ending stream session:", sessionId);
      webSocket.actions.endStream(sessionId);
      setCurrentCallState("ending");
    } else {
      router.push("/dashboard/influencer/live");
    }
  }, [sessionId, webSocket, router]);

  const handleCountdownComplete = useCallback(() => {
    if (acceptedBidInfo) {
      console.log("⏰ Countdown completed, waiting for explorer to join...");

      setTimeout(() => {
        if (currentCallState === "countdown") {
          console.log(
            "🎥 Auto-transitioning to ongoing state (explorer should connect soon)"
          );

          const explorer: Explorer = {
            id: "pending-join",
            name: acceptedBidInfo.explorerName,
            profileImage: acceptedBidInfo.explorerImage,
            location: acceptedBidInfo.explorerLocation,
          };

          setCurrentExplorer(explorer);
          setCurrentCallState("ongoing");
          setAcceptedBidInfo(null);
        }
      }, 5000);
    }
  }, [acceptedBidInfo, currentCallState]);

  const handleCountdownCancel = useCallback(() => {
    setCurrentCallState("waiting");
    setAcceptedBidInfo(null);
    toast.info("Call cancelled");
  }, []);

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
            ? "Live"
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
            onClick={() => router.push("/dashboard/influencer/live")}
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
        <div className="text-center text-white max-w-sm flex flex-col items-center jus">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div> */}

          <LoadingState/>

                    <p className="text-lg mb-2 mt-4">Setting up your stream...</p>


          {/* {process.env.NODE_ENV === "development" && (
            <div className="space-y-2 text-sm">
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
          )}

          {process.env.NODE_ENV === "development" && (
            <p className="text-xs opacity-75 mt-4">
              {sessionInitialized
                ? "Checking for existing connections..."
                : "Initializing session..."}
            </p>
          )} */}
        </div>
      </div>
    );
  }

  return (
    
    <div className="relative h-screen w-full overflow-hidden bg-blue transition-colors duration-300">
      <div className="absolute inset-0 z-0">
        <CameraStream
          isMuted={isMuted}
          onVideoReady={setIsVideoReady}
          isInfluencer={true}
          sessionId={sessionId}
          userId={userDetails?.id}
          onVideoRefsReady={setVideoRefs}
        />
      </div>

      {/* <ConnectionHealthIndicator /> */}
      {/* 
      {currentCallState === "ongoing" && currentExplorer && (
        <CallHeader
          name={currentExplorer.name || currentExplorer.id.slice(0, 8)}
          profileImage={currentExplorer.profileImage}
          connectionStatus={connectionStatus}
        />
      )} */}

      {/* Waiting for Explorer Component */}
      {currentCallState === "waiting" && !currentExplorer && (
        <WaitingForExplorer
          hasIncomingBids={incomingBids.length > 0}
          sessionId={sessionId}
        />
      )}

      {/* Bid Accepted Countdown */}
      {currentCallState === "countdown" && acceptedBidInfo && (
        <BidAcceptedCountdown
          explorerName={acceptedBidInfo.explorerName}
          explorerImage={acceptedBidInfo.explorerImage}
          explorerLocation={acceptedBidInfo.explorerLocation}
          bidAmount={acceptedBidInfo.bidAmount}
          onCountdownComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      )}

      <BidPanel
        bids={incomingBids}
        onAcceptBid={handleAcceptBid}
        onRejectBid={handleRejectBid}
        currentExplorer={currentExplorer}
        isStreamReady={isVideoReady}
        processingBidId={processingBidId}
      />

      {/* Rules Accordion */}
      <RulesAccordion />

      {/* Timer - Show when call is ongoing */}
      {currentCallState === "ongoing" && currentExplorer && (
        <Timer
          time={formatTime(callDuration)}
          className="absolute lg:left-1/2 transform lg:-translate-x-1/2 transition-all duration-300 bottom-40 lg:bottom-32 2xl:bottom-40 w-max lg:w-auto ml-4 lg:ml-0"
          maxTime={1800}
          showProgress={true}
          earnings={earnings.video + earnings.gifts}
        />
      )}

      {/* Interaction Buttons */}
      <InteractionPanel
        isMuted={isMuted}
        onMuteToggle={toggleMute}
        onEndCall={handleEndCall}
        isCallOngoing={currentCallState === "ongoing"}
        hasExplorer={!!currentExplorer}
        sessionId={sessionId}
      />

      {/* Earnings Display */}
      <Earnings videoEarnings={earnings.video} giftEarnings={earnings.gifts} />

      {/* FIXED: ProfileCard shows EXPLORER info when connected, otherwise shows influencer */}
      {videoRefs && (
        <ProfileCard
          imageUrl={
            currentExplorer
              ? currentExplorer.profileImage || "/img/hbb_user_logo.png"
              : userDetails?.profileImage || "/img/hbb_user_logo.png"
          }
          explorerName={currentExplorer?.name}
          influencerName={
            `${userDetails?.firstName || ""} ${
              userDetails?.lastName || ""
            }`.trim() ||
            userDetails?.email?.split("@")[0] ||
            "Influencer"
          }
          location={currentExplorer?.location || "Your Location"}
          earnings={earnings.video + earnings.gifts}
          isMinimized={isProfileMinimized}
          onMinimizeToggle={() => setIsProfileMinimized(!isProfileMinimized)}
          isInfluencer={true}
          showLiveVideo={!!currentExplorer} // Only show live video when explorer is connected
          videoRef={
            currentExplorer
              ? videoRefs?.remoteVideoRef
              : videoRefs?.localVideoRef
          } // Show remote when explorer connected
        />
      )}

      {/* Debug Info (Development only) */}
      {/* {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded text-xs max-w-xs space-y-1">
          <p>
            <strong>Session:</strong> {sessionId}
          </p>
          <p>
            <strong>State:</strong> {currentCallState}
          </p>
          <p>
            <strong>Bids:</strong> {incomingBids.length}
          </p>
          <p>
            <strong>Explorer:</strong>{" "}
            {currentExplorer ? currentExplorer.name : "None"}
          </p>
          <p>
            <strong>Current Explorer ID:</strong>{" "}
            {currentSession?.currentExplorerId || "None"}
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
            <strong>Processing:</strong> {processingBidId || "None"}
          </p>
          <p>
            <strong>Initialized:</strong> {sessionInitialized ? "Yes" : "No"}
          </p>
        </div>
      )} */}

      {/* Ending State Overlay */}
      {currentCallState === "ending" && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="text-2xl mb-4">📹</div>
            <h2 className="text-xl font-semibold mb-2">Stream Ended</h2>
            <p className="text-sm opacity-75 mb-4">
              Total earnings: ${earnings.video + earnings.gifts}
            </p>
            <p className="text-xs opacity-50">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCall;
