// dashboard/influencer/video-call/components/BidPanel.tsx - Fixed UI
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import Image from "next/image";

interface Bid {
  bidId: string;
  sessionId: string;
  amount: number;
  bidderId: string;
  bidderName?: string;
  bidderProfileImage?: string;
  bidderLocation?: string;
  timestamp: Date;
}

interface Explorer {
  id: string;
  name?: string;
  profileImage?: string;
}

interface BidPanelProps {
  bids: Bid[];
  onAcceptBid: (bidId: string) => void;
  onRejectBid: (bidId: string) => void;
  currentExplorer?: Explorer | null;
  isStreamReady?: boolean;
  processingBidId?: string | null;
  forceShow?: boolean;
}

const BidPanel: React.FC<BidPanelProps> = ({
  bids,
  onAcceptBid,
  onRejectBid,
  currentExplorer,
  isStreamReady = true,
  processingBidId = null,
  forceShow = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortedBids, setSortedBids] = useState<Bid[]>([]);
  const [animatingBids, setAnimatingBids] = useState<Set<string>>(new Set());

  // Sort bids by amount (highest first) and timestamp
  useEffect(() => {
    const sorted = [...bids].sort((a, b) => {
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setSortedBids(sorted);
    console.log("📊 BidPanel: Sorted bids:", sorted);
  }, [bids]);

  // Auto-expand when new bids arrive
  useEffect(() => {
    if (bids.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [bids.length]);

  // Add animation for new bids
  useEffect(() => {
    const newBidIds = sortedBids.map((bid) => bid.bidId);
    const previousBidIds = Array.from(animatingBids);

    // Find new bids that weren't in the previous list
    const actuallyNewBids = newBidIds.filter(
      (id) => !previousBidIds.includes(id)
    );

    if (actuallyNewBids.length > 0) {
      setAnimatingBids(new Set(actuallyNewBids));

      // Remove animation after a short time
      setTimeout(() => {
        setAnimatingBids(new Set());
      }, 1000);
    }
  }, [sortedBids]);

  const handleAccept = useCallback(
    async (bidId: string) => {
      console.log("🎯 BidPanel: Accepting bid:", bidId);
      try {
        await onAcceptBid(bidId);
      } catch (error) {
        console.error("❌ BidPanel: Error accepting bid:", error);
      }
    },
    [onAcceptBid]
  );

  const handleReject = useCallback(
    async (bidId: string) => {
      console.log("🚫 BidPanel: Rejecting bid:", bidId);
      try {
        await onRejectBid(bidId);
      } catch (error) {
        console.error("❌ BidPanel: Error rejecting bid:", error);
      }
    },
    [onRejectBid]
  );

  const handleRejectAll = useCallback(() => {
    console.log("🚫 BidPanel: Rejecting all bids");
    sortedBids.forEach((bid) => {
      if (processingBidId !== bid.bidId) {
        handleReject(bid.bidId);
      }
    });
  }, [sortedBids, processingBidId, handleReject]);

  const handleAcceptHighest = useCallback(() => {
    if (sortedBids.length > 0 && processingBidId !== sortedBids[0].bidId) {
      console.log("✅ BidPanel: Accepting highest bid:", sortedBids[0]);
      handleAccept(sortedBids[0].bidId);
    }
  }, [sortedBids, processingBidId, handleAccept]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - new Date(timestamp).getTime()) / 1000
    );

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US");
  };

  const highestBid = sortedBids[0];
  const totalBidValue = sortedBids.reduce((sum, bid) => sum + bid.amount, 0);

  console.log("📊 BidPanel: Rendering with", sortedBids.length, "bids");

  return (
    <div className="absolute top-8 lg:top-12 left-4 z-50">
      {/* Always visible trigger button */}
      <div
        className="bg-white bg-opacity-5 backdrop-blur-lg text-white p-4 rounded-xl overflow-hidden backdrop-blur-[16px] flex items-center justify-between lg:w-[350px] max-w-[350px] cursor-pointer hover:bg-opacity-10 transition-all"
        onClick={toggleExpanded}
      >
        <span className="text-lg font-medium">
          Explorer Bids{" "}
          {sortedBids.length > 0 && (
            <span className="ml-1">{sortedBids.length}</span>
          )}
        </span>

        <Image
          src="/icons/bids-open.svg"
          alt="Bids Open"
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          width={36}
          height={36}
        />
      </div>

      {/* Expandable bid list */}
      {isExpanded && (
        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl text-white w-full max-w-[620px] overflow-hidden mt-2 p-4">
          
          {/* Header */}
          <div className="pb-2">
            <h3 className="text-lg font-medium">Explorer Bids</h3>
          </div>

          {/* Bid List */}
          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {sortedBids.map((bid, index) => (
              <div
                key={bid.bidId}
                className={`bg-black bg-opacity-20 backdrop-blur-lg rounded-lg overflow-hidden ${
                  animatingBids.has(bid.bidId)
                    ? "animate-pulse bg-blue-500 bg-opacity-10"
                    : ""
                }`}
              >
                {/* Bid Info Section */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={
                        bid.bidderProfileImage || "/img/logo.png"
                      }
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate text-white capitalize">
                        {bid.bidderName || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-white opacity-75">
                        <svg
                          className="w-3 h-3 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate text-xs">
                          {bid.bidderLocation || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider line between info and actions */}
                <div className="w-full h-[1px] bg-white bg-opacity-10"></div>

                {/* Action Section */}
                <div className="flex items-center justify-between p-4">
                  {/* Amount or Status */}
                  <div className="flex items-center gap-2">
                    {processingBidId === bid.bidId ? (
                      <>
                        <svg
                          className="w-5 h-5 animate-pulse text-yellow-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="text-sm text-yellow-300">Joining chat... 10</span>
                      </>
                    ) : (
                      <>
                        <Image
                          src="/icons/dollars.svg"
                          alt="Bid Amount"
                          className="w-5 h-5 flex-shrink-0"
                          width={16}
                          height={16}
                        />
                          
                        <span className="text-sm font-base text-white">
                          ${formatAmount(bid.amount)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReject(bid.bidId)}
                      disabled={processingBidId === bid.bidId}
                      className="bg-[#C45C55] hover:bg-[#B34B50] h-7 text-white !text-xs !rounded !px-4 !py-0 text-sm font-thin disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </Button>
                    {processingBidId === bid.bidId ? (
                      <Button
                        className="bg-[#6AB5D2] text-white h-7 rounded-full !text-xs px-2 py-1 font-thin"
                        disabled
                      >
                        Accepted
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAccept(bid.bidId)}
                        disabled={processingBidId === bid.bidId}
                        className="bg-[#4EB246] hover:bg-[#4AA23E] h-7 !text-xs text-white !rounded text-sm font-thin disabled:opacity-50 transition-colors"
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sortedBids.length === 0 && (
              <div className="p-8 text-center text-sm opacity-75">
                No bids yet
              </div>
            )}
          </div>

          {/* Quick actions footer (optional) */}
          {sortedBids.length > 1 && (
            <div className="bg-white bg-opacity-5 backdrop-blur-lg p-3 flex gap-2 justify-between border-t border-white border-opacity-20">
              <Button
                onClick={handleRejectAll}
                className="bg-[#C45C55] hover:bg-[#B34B50] text-white px-3 py-1 rounded-full text-xs font-medium flex-1"
              >
                Reject All
              </Button>
              <Button
                onClick={handleAcceptHighest}
                disabled={!!processingBidId}
                className="bg-[#4EB246] hover:bg-[#4AA23E] text-white px-3 py-1 rounded-full text-xs font-medium flex-1 disabled:opacity-50"
              >
                Accept Highest ($
                {highestBid ? formatAmount(highestBid.amount) : "0"})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BidPanel;