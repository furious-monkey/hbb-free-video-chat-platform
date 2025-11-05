// frontend/src/app/(dashboard)/dashboard/influencer/live/LiveRate.tsx
"use client";

import React, {
  useState,
  useTransition,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { formatCurrencyInput, parseCurrencyInput } from "@/src/lib/utils";
import { useUserStore } from "@/src/store/userStore";
import WebSocketDebug from "./WebsocketDebug";

interface LiveRateProps {
  setApproveRate: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string;
  maxDurationMinutes?: number;
}

const DEFAULT_MAX_DURATION = 30;

const LiveRate: React.FC<LiveRateProps> = ({
  setApproveRate,
  userId,
  maxDurationMinutes = DEFAULT_MAX_DURATION,
}) => {
  const [rateInput, setRateInput] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const [isSuccesToastShown, setIsSuccessToastShown] = useState(false);
  const router = useRouter();

  const parsedRate = useMemo(() => parseCurrencyInput(rateInput), [rateInput]);

  // Debug logging for component initialization
  useEffect(() => {
    console.log("🔧 LiveRate Component initialized with:", {
      userId,
      maxDurationMinutes,
      timestamp: new Date().toISOString(),
    });
  }, [userId, maxDurationMinutes]);

  const handleSessionCreated = useCallback(
    (data: {
      sessionId: string;
      streamerId: string;
      title?: string;
      createdAt: Date;
      allowBids: boolean;
      callRate?: number;
      influencerId: string;
      status: string;
      timestamp: Date;
    }) => {
      console.log("✅ Session created event received:", {
        ...data,
        timestamp: new Date().toISOString(),
      });

      if (data.sessionId) {
        console.log("🎯 Valid sessionId received, proceeding with navigation");
        setShowOverlay(false);
        setIsCreatingStream(false);
        toast.success("Stream created successfully!");
        setApproveRate(true);

        const navigationUrl = `/dashboard/influencer/video-call?sessionId=${data.sessionId}`;
        console.log("🧭 Navigating to:", navigationUrl);
        router.push(navigationUrl);
      } else {
        console.error("❌ No sessionId in response:", data);
        setShowOverlay(false);
        setIsCreatingStream(false);
        toast.error("Failed to create stream - no session ID");
      }
    },
    [setApproveRate, router]
  );

  const handleWebSocketError = useCallback(
    (data: {
      message: string;
      code?: string;
      sessionId?: string;
      timestamp: Date;
    }) => {
      console.error("🚨 WebSocket error received:", {
        ...data,
        timestamp: new Date().toISOString(),
      });
      setShowOverlay(false);
      setIsCreatingStream(false);
      toast.error(data.message);
    },
    []
  );

  const { isConnected, isAuthenticated, isReady, actions } = useWebSocket(
    userId,
    {
      onSessionCreated: handleSessionCreated,
      onError: handleWebSocketError,
    }
  );

  // Debug logging for WebSocket state changes
  useEffect(() => {
    console.log("🔌 WebSocket state changed:", {
      isConnected,
      isAuthenticated,
      isReady,
      userId,
      hasActions: !!actions,
      timestamp: new Date().toISOString(),
    });

    // Log specific state transitions
    if (!isConnected) {
      console.warn(
        "⚠️ WebSocket not connected - check network and server status"
      );
    }
    if (isConnected && !isAuthenticated) {
      console.info(
        "🔐 WebSocket connected but not authenticated - authentication in progress"
      );
    }
    if (isConnected && isAuthenticated && !isReady) {
      console.info("⏳ WebSocket connected and authenticated but not ready");
    }
    if (isReady) {
      console.log("🚀 WebSocket fully ready for operations");
    }
  }, [isConnected, isAuthenticated, isReady, userId, actions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrencyInput(e.target.value);
    console.log("💰 Rate input changed:", {
      rawValue: e.target.value,
      formattedValue,
      parsedRate: parseCurrencyInput(formattedValue),
      timestamp: new Date().toISOString(),
    });
    setRateInput(formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🎬 Submit triggered with state:", {
      parsedRate,
      isConnected,
      isAuthenticated,
      isReady,
      isPending,
      isCreatingStream,
      rateInput,
      timestamp: new Date().toISOString(),
    });

    // Prevent multiple submissions
    if (isCreatingStream || isPending) {
      console.warn("⚠️ Stream creation already in progress");
      return;
    }

    setShowOverlay(true);
    setIsCreatingStream(true);

    startTransition(async () => {
      try {
        if (!parsedRate || parsedRate <= 0) {
          console.error("❌ Invalid rate:", { parsedRate, rateInput });
          throw new Error("Please enter a valid rate greater than 0");
        }

        if (!isConnected) {
          console.error("❌ Not connected to server");
          throw new Error("Not connected to server. Please try again.");
        }

        if (!isAuthenticated) {
          console.error("❌ Not authenticated");
          throw new Error("Authentication in progress. Please wait...");
        }

        if (!actions || !actions.createStream) {
          console.error("❌ Actions not available:", { actions });
          throw new Error("WebSocket actions not ready. Please try again.");
        }

        console.log("🚀 Creating stream with:", {
          allowBids: true,
          rate: parsedRate.toString(),
          timestamp: new Date().toISOString(),
        });

        // Call the async createStream action and wait for response
        const result = await actions.createStream(true, parsedRate.toString());

        console.log("📡 createStream result:", result);

        if (result.success && result.sessionId) {
          console.log(
            "✅ Stream created successfully with sessionId:",
            result.sessionId
          );
          // The SESSION_CREATED event will also be triggered, but we can navigate immediately
          setShowOverlay(false);
          setIsCreatingStream(false);
          if(!isSuccesToastShown) {
            toast.success("Stream created successfully!");
            setIsSuccessToastShown(true);
          } 
          setApproveRate(true);

          const navigationUrl = `/dashboard/influencer/video-call?sessionId=${result.sessionId}`;
          console.log("🧭 Navigating to:", navigationUrl);
          router.push(navigationUrl);
        } else if (!result.success) {
          console.error("❌ Stream creation failed:", result.error);
          throw new Error(result.error || "Failed to create stream");
        } else {
          console.warn(
            "⚠️ Stream creation succeeded but no sessionId received"
          );
          // Wait for SESSION_CREATED event in this case
        }
      } catch (error) {
        console.error("❌ Error creating stream:", error);
        setShowOverlay(false);
        setIsCreatingStream(false);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to create stream. Please try again.";
        toast.error(errorMessage);
      }
    });
  };

  const isSubmitDisabled = useMemo(() => {
    const disabled =
      !parsedRate ||
      parsedRate <= 0 ||
      !isReady ||
      isPending ||
      isCreatingStream;
    console.log("🔒 Submit disabled check:", {
      disabled,
      parsedRate,
      isReady,
      isPending,
      isCreatingStream,
      reasons: {
        invalidRate: !parsedRate || parsedRate <= 0,
        notReady: !isReady,
        pending: isPending,
        creating: isCreatingStream,
      },
    });
    return disabled;
  }, [parsedRate, isReady, isPending, isCreatingStream]);

  const buttonStatusMessage = useMemo(() => {
    let message;
    if (!isConnected) message = "Connecting...";
    else if (isConnected && !isAuthenticated) message = "Authenticating...";
    else if (isPending || isCreatingStream) message = "Creating...";
    else message = "Go live";

    console.log("📱 Button status:", {
      message,
      isConnected,
      isAuthenticated,
      isPending,
      isCreatingStream,
      timestamp: new Date().toISOString(),
    });

    return message;
  }, [isConnected, isAuthenticated, isPending, isCreatingStream]);

  const loadingMessages = useMemo(
    () => ["Creating session", "Optimizing stream", "Almost ready"],
    []
  );

  // Debug log when overlay state changes
  useEffect(() => {
    console.log("🎭 Overlay state changed:", {
      showOverlay,
      isCreatingStream,
      timestamp: new Date().toISOString(),
    });
  }, [showOverlay, isCreatingStream]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (isCreatingStream) {
        console.log(
          "🧹 Component unmounting, cleaning up stream creation state"
        );
        setIsCreatingStream(false);
        setShowOverlay(false);
      }
    };
  }, [isCreatingStream]);

  return (
    <>
     <div className="bg-base1 rounded-xl p-2 lg:p-4 flex items-center overflow-hidden gap-2 lg:gap-4">
  {/* Duration Info Section */}
  <div className="w-fit flex items-center">
    <Button
      onClick={() => {
        console.log("ℹ️ Max time info clicked");
        // This should probably show a tooltip or modal with duration info
        toast.info(
          `Maximum call duration: ${maxDurationMinutes} minutes`
        );
      }}
      aria-label="Max time information"
      className="!h-[40px] !px-0 !w-[32px] border-none shadow-none flex justify-center items-center bg-transparent hover:bg-transparent"
    >
      <Image
        src="/icons/max-time.svg"
        alt="Maximum call duration"
        width={32}
        height={32}
        className="w-[32px] h-[32px]"
        priority
      />
    </Button>
    <div className="font-thin ml-1">
      <p className="text-[10px] lg:text-xs whitespace-nowrap">
        Max time
      </p>
      <p className="text-[10px] lg:text-xs">
        {maxDurationMinutes} mins
      </p>
    </div>
  </div>

  <div className="self-stretch w-px bg-[#EBE9E4]" />

  {/* Rate Input Section */}
  <div className="flex-1 px-2 lg:px-4 min-w-0">
    <label
      htmlFor="rate-input"
      className="text-xs mb-[6px] font-thin block"
    >
      Enter your rate
    </label>
    <div
      className={`flex items-center text-sm text-black pl-[10px] lg:pl-[14px] lg:pr-[4px] py-[15px] rounded-md !h-[40px] ${
        isSubmitDisabled ? "bg-white/30" : "bg-tertiary"
      } w-full`}
    >
      <span className="text-xs">$</span>
      <Input
        id="rate-input"
        placeholder="0.00"
        value={rateInput}
        onChange={handleInputChange}
        className="placeholder:text-black border-none outline-none focus:border-none h-fit p-0 pl-1 !text-xs flex-1"
        inputMode="decimal"
        disabled={isPending || isCreatingStream}
        aria-disabled={isPending || isCreatingStream}
      />
    </div>
  </div>

  <div className="self-stretch w-px bg-[#EBE9E4]" />

  {/* Submit Button Section */}
  <div className="w-fit flex flex-col lg:justify-center items-center">
    <p className="text-xs mb-[6px] text-center">{buttonStatusMessage}</p>
    <Button
      onClick={handleSubmit}
      disabled={isSubmitDisabled}
      aria-label={buttonStatusMessage}
      className={`!h-[40px] w-10 rounded-lg border-none shadow-none flex justify-center items-center p-1 ${
        isSubmitDisabled || isPending || isCreatingStream
          ? "bg-black/25"
          : "bg-white hover:bg-white/90"
      }`}
    >
      <Image
        src={
          isSubmitDisabled
            ? "/assests/disabled-live.svg"
            : "/assests/active-live.svg"
        }
        alt={
          isSubmitDisabled ? "Disabled live button" : "Active live button"
        }
        width={32}
        height={32}
        priority
      />
    </Button>
  </div>
</div>

      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-8">
          <div className="relative h-24 w-24">
            <div
              className="absolute inset-0 rounded-full animate-spin [animation-duration:2s] opacity-70"
              style={{
                background:
                  "conic-gradient(from 0deg, #3b82f6, #8b5cf6, #3b82f6)",
              }}
            />
            <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>

          <div className="w-full max-w-xs space-y-4">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{
                  animation: "progress 2.5s ease-in-out infinite",
                  width: `${Math.floor(Date.now() / 100) % 100}%`,
                }}
              />
            </div>
            <p className="text-center text-sm text-foreground/80 font-medium animate-pulse [animation-duration:1.5s]">
              {
                loadingMessages[
                  Math.floor(Date.now() / 1500) % loadingMessages.length
                ]
              }
              ...
            </p>
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-xs text-foreground/50">
              Secured connection •{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Enhanced: Cancel button for better UX */}
          <div className="absolute top-8 right-8">
            <Button
              onClick={() => {
                console.log("❌ User cancelled stream creation");
                setShowOverlay(false);
                setIsCreatingStream(false);
                toast.info("Stream creation cancelled");
              }}
              variant="ghost"
              size="sm"
              className="text-foreground/60 hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {/* {process.env.NODE_ENV === "development" && (
        <WebSocketDebug userId={userId} />
      )} */}
    </>
  );
};

export default React.memo(LiveRate);
