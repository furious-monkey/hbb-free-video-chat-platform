// components/app-reusables/modals/InfluencerViewModal.tsx - Fixed bid handling and navigation
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../../ui/button";
import { CancelIcon } from "../../svgs";
import Image from "next/image";
import { Input } from "../../ui/input";
import { useInfluencerStore } from "@/src/store/influencerStore";
import { shallow } from "zustand/shallow";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingState from "../LoadingState";
import { toast } from "sonner";
import { useNoAuthStore } from "@/src/store/no-authStore";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useUserStore } from "@/src/store/userStore";

interface InfluencerViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfluencerViewModal = ({ isOpen, onClose }: InfluencerViewModalProps) => {
  const [rate, setRate] = useState("");
  const [influencerDetails, setInfluencerDetails] = useState<any>(null);
  const [showRules, setShowRules] = useState(false);
  const [liveCallerRate, setLiveCallerRate] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [buttonText, setButtonText] = useState("Enter bid amount");
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentHighestBid, setCurrentHighestBid] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isNavigating, setIsNavigating] = useState(false);
  const [bidAcceptedHandled, setBidAcceptedHandled] = useState(false);
  
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { getInfluencerByUsername, getUsernameLoading } = useInfluencerStore(
    (state: any) => ({
      getInfluencerByUsername: state.getInfluencerByUsername,
      getUsernameLoading: state.getUsernameLoading,
    }),
    shallow
  );

  // Get current user details
  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  // Get categories from store
  const { categories } = useNoAuthStore(
    (state: any) => ({
      categories: state.categories?.data || [],
    }),
    shallow
  );

  const searchParams = useSearchParams();
  const username = searchParams?.get("username");

  // Enhanced navigation function with more robust approach
  const navigateToVideoCall = useCallback(async (sessionId: string) => {
    console.log('🎬 Navigating to video call with session:', sessionId);
    setIsNavigating(true);
    
    // Clear any existing intervals
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Clear processing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    // Build the URL
    const videoCallUrl = `/dashboard/explorer/video-call?sessionId=${sessionId}`;
    console.log('🔗 Navigation URL:', videoCallUrl);
    
    try {
      // Method 1: Use window.location.replace for guaranteed navigation
      console.log('🚀 Using window.location.replace for reliable navigation');
      window.location.replace(videoCallUrl);
      
      // Don't close modal immediately - let the page navigation handle it
      console.log('✅ Navigation command executed');
      
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      
      // Fallback method: Try router first, then window.location
      try {
        console.log('🔄 Fallback: Trying router.replace');
        await router.replace(videoCallUrl);
        
        // Wait longer before closing modal
        setTimeout(() => {
          console.log('🚪 Closing modal after router navigation');
          onClose();
        }, 500);
        
      } catch (routerError) {
        console.error('❌ Router navigation also failed:', routerError);
        
        // Final fallback: Force page navigation
        console.log('🔄 Final fallback: Force page navigation');
        window.location.href = videoCallUrl;
      }
    }
  }, [router, onClose, timeoutId]);

  // Enhanced countdown function with immediate navigation option
  const startCountdown = useCallback((sessionId: string) => {
    console.log('⏰ Starting countdown for session:', sessionId);
    
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    let timer = 3; // Reduced to 3 seconds for faster testing
    setCountdown(timer);
    
    countdownIntervalRef.current = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      console.log('⏰ Countdown:', timer);

      if (timer <= 0) {
        console.log('🏁 Countdown completed, initiating navigation...');
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        
        // Call navigation function
        navigateToVideoCall(sessionId);
      }
    }, 1000);
    
    // Backup navigation in case interval fails
    setTimeout(() => {
      if (countdownIntervalRef.current) {
        console.log('⚠️ Backup navigation triggered');
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        navigateToVideoCall(sessionId);
      }
    }, 5000); // Reduced backup timer
    
  }, [navigateToVideoCall]);

  // WebSocket connection with comprehensive event handlers
  const webSocket = useWebSocket(userDetails?.id, {
    onBidPlaced: (data) => {
      console.log('💰 Bid placed:', data);
      if (data.currentHighestBid) {
        setCurrentHighestBid(data.currentHighestBid);
        setLiveCallerRate(data.currentHighestBid);
      }
    },
    
    onNewBid: (data) => {
      console.log('💰 New bid received:', data);
      if (data.currentHighestBid && data.currentHighestBid > currentHighestBid) {
        setCurrentHighestBid(data.currentHighestBid);
        setLiveCallerRate(data.currentHighestBid);
        toast.info(`New highest bid: $${data.currentHighestBid}`);
      }
    },
    
    onBidAccepted: (data) => {
      console.log('✅ Bid accepted event received:', data);
      if (data.bidderId === userDetails?.id) {
        // Prevent duplicate event handling
        if (bidAcceptedHandled) {
          console.log('⚠️ Bid accepted already handled, ignoring duplicate event');
          return;
        }
        setBidAcceptedHandled(true);
        
        // Clear processing state
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        setIsProcessing(false);
        
        toast.success("Your bid was accepted! Preparing to join...");
        
        // Show rules and start countdown
        setShowRules(true);
        
        // Use sessionId from the event, fallback to currentSessionId
        const sessionToUse = data.sessionId || currentSessionId;
        if (sessionToUse) {
          console.log('🎬 Starting countdown with session:', sessionToUse);
          startCountdown(sessionToUse);
        } else {
          console.error('❌ No session ID available for navigation');
          toast.error("Error: No session ID found");
          setShowRules(false);
          setBidAcceptedHandled(false); // Reset on error
        }
      }
    },
    
    onBidRejected: (data) => {
      console.log('🚫 Bid rejected:', data);
      if (data.bidderId === userDetails?.id) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        toast.error(data.reason || "Your bid was rejected");
        setIsProcessing(false);
        setShowRules(false);
        setBidAcceptedHandled(false); // Reset for future bids
      }
    },
    
    onOutbid: (data) => {
      console.log('💸 Outbid:', data);
      if (data.previousBidderId === userDetails?.id) {
        toast.warning("You've been outbid!");
        setCurrentHighestBid(data.newHighestBid);
        setLiveCallerRate(data.newHighestBid);
        setIsProcessing(false);
      }
    },
    
    onBidPlacedSuccess: (data) => {
      console.log('✅ Bid placed successfully:', data);
      toast.success("Bid placed successfully! Waiting for influencer response...");
      // Don't reset processing here - wait for accept/reject
    },
    
    onBidPlacedError: (data) => {
      console.log('❌ Bid placement failed:', data);
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      toast.error(data.message || "Failed to place bid");
      setIsProcessing(false);
      setShowRules(false);
      setBidAcceptedHandled(false); // Reset for future bids
    },
    
    onStreamJoined: (data) => {
      console.log('🎬 Stream joined directly:', data);
      if (data.success && data.sessionId) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        toast.success("Joined stream successfully!");
        navigateToVideoCall(data.sessionId);
      }
    },
    
    onError: (data) => {
      console.error('❌ WebSocket error:', data);
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      toast.error(data.message || "Something went wrong");
      setIsProcessing(false);
      setShowRules(false);
      setBidAcceptedHandled(false); // Reset for future bids
    }
  });

  useEffect(() => {
    const fetchInfluencer = async () => {
      if (isOpen && username) {
        const response = await getInfluencerByUsername(username);
        if (response?.influencer) {
          setInfluencerDetails(response.influencer);
          
          // Set session ID and current highest bid if stream is live
          if (response.influencer.streamInfo?.id) {
            setCurrentSessionId(response.influencer.streamInfo.id);
            
            // Use callRate as the base rate, not a hardcoded value
            const baseRate = parseFloat(response.influencer.streamInfo.callRate || response.influencer.profile?.callRate || "0");
            
            // If there's a current highest bid, use that; otherwise use the base rate
            const initialBid = response.influencer.streamInfo.currentHighestBid || baseRate;
            
            setLiveCallerRate(initialBid);
            setCurrentHighestBid(initialBid);
            
            console.log('💰 Stream bid info:', {
              baseRate,
              currentHighestBid: response.influencer.streamInfo.currentHighestBid,
              initialBid,
              allowBids: response.influencer.streamInfo.allowBids
            });
          }
        }
      }
    };

    fetchInfluencer();
  }, [isOpen, username, getInfluencerByUsername]);

  // Handle video transitions
  useEffect(() => {
    if (isOpen && influencerDetails && !showRules) {
      setShowVideo(false);
      setVideoReady(false);

      const hasVideo = influencerDetails.promotionalVideoDetails?.length > 0;
      if (hasVideo) {
        const timer = setTimeout(() => {
          setShowVideo(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, influencerDetails, showRules]);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.log("Auto-play prevented:", e);
        });
      }
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((e) => console.log("Loop play prevented:", e));
    }
  }, []);

  useEffect(() => {
    if (showVideo && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.log("Auto-play prevented after transition:", e));
      }
    }
  }, [showVideo]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [timeoutId]);

  // Update button state with enhanced logic
  useEffect(() => {
    const sanitizedRate = rate.replace(/,/g, "");
    const parsedRate = parseFloat(sanitizedRate) || 0;
    const streamAllowsBids = influencerDetails?.streamInfo?.allowBids;
    const hasCurrentExplorer = influencerDetails?.streamInfo?.hasExplorer;
    const currentHighestBidAmount = currentHighestBid || liveCallerRate;
    const requiresBid = streamAllowsBids;
    const isDirectJoin = !streamAllowsBids && !hasCurrentExplorer;

    console.log('🔘 Button State Update:', {
      isProcessing,
      isNavigating,
      streamAllowsBids,
      hasCurrentExplorer,
      currentHighestBidAmount,
      requiresBid,
      isDirectJoin,
      parsedRate,
      rate: rate.trim()
    });

    if (isProcessing || isNavigating) {
      setButtonText("Processing...");
      setIsButtonDisabled(true);
    } else if (isDirectJoin) {
      // Only allow direct join if stream doesn't allow bids
      setButtonText("Join Video Chat");
      setIsButtonDisabled(false);
    } else if (!rate.trim() || isNaN(parsedRate) || parsedRate <= 0) {
      // Need to enter a bid amount
      setButtonText("Enter bid amount");
      setIsButtonDisabled(true);
    } else if (hasCurrentExplorer && parsedRate <= currentHighestBidAmount) {
      // Bid amount is not high enough to outbid current explorer
      setButtonText(`Bid must be > $${currentHighestBidAmount}`);
      setIsButtonDisabled(true);
    } else if (requiresBid && parsedRate > 0) {
      // Valid bid amount for a stream that requires bids
      setButtonText(`Place Bid: $${parsedRate}`);
      setIsButtonDisabled(false);
    } else {
      // Default case
      setButtonText("Enter bid amount");
      setIsButtonDisabled(true);
    }
  }, [rate, liveCallerRate, currentHighestBid, isProcessing, isNavigating, influencerDetails?.streamInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(e.target.value);
  };

  const handleClick = async () => {
    if (!webSocket.isReady) {
      toast.error("Connection not ready. Please try again.");
      return;
    }

    if (!currentSessionId) {
      toast.error("No active stream found");
      return;
    }

    if (!userDetails?.id) {
      toast.error("Please log in to place a bid");
      return;
    }

    setIsProcessing(true);

    const sanitizedRate = rate.replace(/,/g, "");
    const bidAmount = parseFloat(sanitizedRate);

    // Set a timeout to reset processing state if no response
    const newTimeoutId = setTimeout(() => {
      setIsProcessing(false);
      toast.error("Request timed out. Please try again.");
      setTimeoutId(null);
    }, 30000);

    setTimeoutId(newTimeoutId);

    try {
      // Enhanced logic for determining join vs bid
      const streamAllowsBids = influencerDetails?.streamInfo?.allowBids;
      const hasCurrentExplorer = influencerDetails?.streamInfo?.hasExplorer;
      const currentHighestBidAmount = currentHighestBid || liveCallerRate;
      const hasValidBid = !isNaN(bidAmount) && bidAmount > 0;
      
      // If stream allows bids, ALWAYS require a bid (even if no current explorer)
      const requiresBid = streamAllowsBids;
      const isDirectJoin = !streamAllowsBids && !hasCurrentExplorer;
      
      console.log('🎯 Action Decision Logic:', {
        streamAllowsBids,
        hasCurrentExplorer,
        currentHighestBidAmount,
        liveCallerRate,
        bidAmount,
        requiresBid,
        isDirectJoin,
        hasValidBid,
        rate: rate.trim()
      });

      if (isDirectJoin) {
        // Only join directly if stream doesn't allow bids AND no current explorer
        console.log('🎬 Joining stream directly (no bids allowed):', currentSessionId);
        webSocket.actions.joinStream(currentSessionId);
        toast.info("Joining stream...");
      } else if (requiresBid && hasValidBid && bidAmount > 0) {
        // Valid bid amount that's higher than current, place bid
        console.log('💰 Placing bid (stream requires bids):', { 
          sessionId: currentSessionId, 
          amount: bidAmount,
          currentHighest: currentHighestBidAmount 
        });
        webSocket.actions.placeBid(currentSessionId, bidAmount);
        toast.info(`Placing bid of ${bidAmount}...`);
      } else {
        // Invalid scenario
        console.error('❌ Invalid action scenario:', {
          hasValidBid,
          bidAmount,
          currentHighestBidAmount,
          hasCurrentExplorer
        });
        toast.error("Invalid bid amount or action");
        setIsProcessing(false);
        if (newTimeoutId) clearTimeout(newTimeoutId);
        setTimeoutId(null);
        return;
      }
    } catch (error) {
      console.error('❌ Error in handleClick:', error);
      toast.error("Something went wrong. Please try again.");
      setIsProcessing(false);
      if (newTimeoutId) clearTimeout(newTimeoutId);
      setTimeoutId(null);
    }
  };

  // Handle modal close - cleanup
  const handleClose = useCallback(() => {
    // Clear any timers
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Reset states
    setShowRules(false);
    setIsProcessing(false);
    setIsNavigating(false);
    setCountdown(3);
    setBidAcceptedHandled(false); // Reset for future modal opens
    
    onClose();
  }, [onClose, timeoutId]);

  if (!isOpen) return null;

  if (getUsernameLoading || !influencerDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink">
        <LoadingState />
      </div>
    );
  }

  const {
    profile: {
      username: influencerUsername = "",
      location = "",
      category = [],
    } = {},
    promotionalVideoDetails = [],
    profileImageDetails = {},
  } = influencerDetails || {};

  const backgroundImage = profileImageDetails?.url || "https://via.placeholder.com/500";
  const hasPromoVideo = promotionalVideoDetails?.length > 0;
  const isCallOngoing = true;

  const canJoin = influencerDetails?.isOnline && 
                  influencerDetails?.isLive && 
                  influencerDetails?.streamInfo?.status === "LIVE" && 
                  currentSessionId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full h-full overflow-hidden">
        {/* Background Media Container */}
        <div className="absolute inset-0">
          {/* Rules Background */}
          {showRules && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('/bg/rules_bg.png')` }}
            />
          )}

          {/* Video Element */}
          {!showRules && hasPromoVideo && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                showVideo ? "opacity-100" : "opacity-0"
              }`}
            >
              <video
                ref={videoRef}
                src={promotionalVideoDetails[0]?.url}
                muted
                loop
                playsInline
                disablePictureInPicture
                preload="auto"
                className="w-full h-full object-cover"
                onCanPlay={handleVideoCanPlay}
                onEnded={handleVideoEnded}
                style={{ display: showVideo ? "block" : "none" }}
              />
            </div>
          )}

          {/* Static Image Background */}
          {!showRules && (
            <div
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
                hasPromoVideo && showVideo ? "opacity-0" : "opacity-100"
              }`}
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
        </div>

        {/* Bottom Gradient & Blur Overlay */}
        <div
          className={`absolute bottom-0 w-full ${
            showRules
              ? "h-[20%] 2xl:h-[15%] rounded-t-2xl bg-[rgba(0,0,0,0.4)] backdrop-blur-[8px]"
              : canJoin
              ? "min-h-[50%] max-h-[55%] 2xl:h-[35%] rounded-t-2xl bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-md"
              : "min-h-[42%] max-h-[55%] 2xl:h-[35%] rounded-t-2xl bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-md"
          }`}
        />

        {/* Rules Content */}
        {showRules && (
          <div className="absolute text-white top-8 px-6 py-6 w-full">
            <p className="text-2xl text-center">Rules</p>
            <ul className="custom-list mt-4 text-sm !h-[40vh] lg:!h-[50vh] 2xl:!h-[60vh] overflow-y-auto no-scrollbar">
              <li>Don't be weird - Conduct yourself in a respectful manner. This includes no nudity, no inappropriate comments or requests, etc. HBB reserves the right to determine what constitutes as "weird."</li>
              <li>Don't be disrespectful - Treat others with respect.</li>
              <li>Don't do anything illegal - Illegal activities will result in a permanent ban from HBB and will be reported to law enforcement.</li>
              <li>Don't record calls without express consent - You must obtain consent from all parties to record calls.</li>
              <li>No ding dong ditching - Do not bid on or start calls that you do not intend to finish. Immediately exiting a call will result in a fine equal to the price of the call, and repeated complaints of this will result in a ban from HBB.</li>
              <p>Failure to abide by these rules will result in a suspension or termination of your account.</p>
            </ul>
          </div>
        )}

        {/* Main Content Section */}
        {showRules ? (
          <div className="absolute bottom-0 z-10 w-full px-6 py-6 lg:px-12 lg:py-8 text-white">
            <div className="lg:w-[75%] mx-auto space-y-3">
              <Button
                variant="yellow"
                className="w-full grid h-11 shadow-custom-shadow text-sm bg-green-500 text-white"
                disabled
              >
                {isNavigating 
                  ? "Joining..." 
                  : `Joining Video chat in ${countdown}...`
                }
              </Button>
              
              {/* Skip countdown button */}
              {!isNavigating && countdown > 0 && currentSessionId && (
                <Button
                  onClick={() => {
                    console.log('⏭️ Skip countdown - immediate navigation');
                    if (countdownIntervalRef.current) {
                      clearInterval(countdownIntervalRef.current);
                      countdownIntervalRef.current = null;
                    }
                    navigateToVideoCall(currentSessionId);
                  }}
                  variant="outline"
                  className="w-full h-9 text-white border-white hover:bg-white hover:text-black text-sm"
                >
                  Join Now (Skip Countdown)
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 z-10 w-full px-6 py-6 lg:px-12 lg:py-8 text-white">
            {/* Title and Location */}
            <div className="text-center mb-2">
              <h2 className="text-3xl font-normal mb-1 capitalize">{influencerUsername}</h2>
              <p className="text-base lg:text-sm opacity-90 capitalize">{location}</p>
            </div>

            {/* Categories */}
            <div className="flex justify-center gap-4 mb-2">
              {category.map((catId: string) => {
                const matchedCategory = categories.find((cat: any) => cat.id === catId);
                return (
                  <div key={catId} className="flex items-center space-x-2">
                    <img
                      src={matchedCategory?.imageUrl || "https://via.placeholder.com/20"}
                      alt={matchedCategory?.name || `Category ${catId}`}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/20")}
                      className="w-3 h-3 object-contain"
                    />
                    <span className="text-[10px] lg:text-sm">
                      {matchedCategory?.name || "Unknown Category"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time and Rate */}
            <div className="flex items-center justify-center w-max mx-auto mb-4">
              {canJoin && (
                <div className="w-fit h-full flex items-center">
                  <div className="flex items-center">
                    <Button className="!h-[48px] !px-0 !w-[32px] border-none shadow-none flex justify-center items-center bg-transparent">
                      <Image
                        src="/icons/max-time.svg"
                        alt="live"
                        width={32}
                        height={32}
                        className="w-[32px] h-[32px]"
                      />
                    </Button>
                    <div className="font-thin ml-1">
                      <p className="text-[10px] lg:text-sm">Max time</p>
                      <p className="text-[10px] lg:text-sm">30 mins</p>
                    </div>
                  </div>
                </div>
              )}

              {canJoin && (
                <>
                  <div className="lg:flex-1 border-l border-r border-black mx-2 px-2 lg:mx-4 lg:px-4">
                    <p className="text-xs mb-[6px] font-thin lg:text-sm">Live caller</p>
                    <div className="flex items-center text-sm text-black pl-[10px] lg:pl-[14px] lg:pr-[4px] py-[15px] rounded-md !h-[40px] !w-24 lg:!w-28 bg-white">
                      <p className="text-xs">$</p>
                      <Input
                        placeholder="0.00"
                        value={liveCallerRate}
                        disabled
                        className="placeholder:text-black border-none outline-none focus:border-none h-fit p-0 pl-1 !text-xs"
                        numberOnly
                      />
                    </div>
                  </div>
                  <div className="lg:flex-1">
                    <p className="text-xs mb-[6px] font-thin lg:text-sm">Your bid</p>
                    <div className="flex items-center text-sm text-black pl-[10px] lg:pl-[14px] lg:pr-[4px] py-[15px] rounded-md !h-[40px] !w-24 lg:!w-28 bg-[#EFD378]">
                      <p className="text-xs">$</p>
                      <Input
                        placeholder="0.00"
                        value={rate}
                        onChange={handleInputChange}
                        className="placeholder:text-black border-none outline-none focus:border-none h-fit p-0 pl-1 !text-xs"
                        numberOnly
                        disabled={isProcessing || isNavigating}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Join Button */}
            <div className="lg:w-[75%] mx-auto">
              <Button
                variant="yellow"
                className={`w-full grid h-11 shadow-custom-shadow text-sm ${
                  isButtonDisabled || isProcessing || isNavigating || !webSocket.isReady ? "bg-white" : "bg-pink text-white"
                }`}
                onClick={handleClick}
                disabled={isButtonDisabled || !canJoin || isProcessing || isNavigating || !webSocket.isReady}
              >
                {!webSocket.isReady 
                  ? "Connecting..."
                  : !canJoin 
                  ? "Influencer is offline"
                  : isNavigating
                  ? "Joining..."
                  : buttonText}
              </Button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <Button
          onClick={handleClose}
          variant="link"
          className="absolute top-4 right-6 bg-white rounded-md p-0.5 w-6 h-6 flex items-center justify-center"
          disabled={isNavigating}
        >
          <CancelIcon className="w-4/5 h-4 text-[#6AB5D2]" />
        </Button>

       
      </div>
    </div>
  );
};

export default InfluencerViewModal;