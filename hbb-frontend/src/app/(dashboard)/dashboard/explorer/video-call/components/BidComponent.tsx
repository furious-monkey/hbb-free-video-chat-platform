// dashboard/explorer/components/BidComponent.tsx - Component for placing bids on streams
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";
import { toast } from "sonner";
import PaymentConfirmation from "@/src/components/billing/SimplePaymentConfirmation";

interface StreamInfo {
  id: string;
  influencer: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    profile?: {
      username?: string;
      location?: string;
    };
  };
  callRate?: number;
  allowBids: boolean;
  currentHighestBid?: number;
}

interface BidComponentProps {
  stream: StreamInfo;
  onBidPlaced?: (bidAmount: number) => void;
  onBidAccepted?: () => void;
  className?: string;
  compact?: boolean;
}

interface BidStatus {
  status:
    | "idle"
    | "placing"
    | "placed"
    | "accepted"
    | "rejected"
    | "outbid"
    | "error"
    | "cancelled";
  amount?: number;
  message?: string;
}

const BidComponent: React.FC<BidComponentProps> = ({
  stream,
  onBidPlaced,
  onBidAccepted,
  className = "",
  compact = false,
}) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidStatus, setBidStatus] = useState<BidStatus>({ status: "idle" });
  const [showBidForm, setShowBidForm] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [pendingBidData, setPendingBidData] = useState<{
    amount: number;
    bidId: string;
  } | null>(null);

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  // WebSocket connection for bid events
  const webSocket = useWebSocket(userDetails?.id, {
    onBidPlacedSuccess: (data) => {
      console.log("✅ Bid placed successfully:", data);
      setBidStatus({
        status: "placed",
        amount: data.bid.amount,
        message: "Bid placed successfully! Waiting for response...",
      });
      onBidPlaced?.(data.bid.amount);
    },

    onBidPlacedError: (data) => {
      console.log("❌ Bid placement failed:", data);
      setBidStatus({
        status: "idle",
        message: data.message || "Failed to place bid",
      });
      toast.error(data.message || "Failed to place bid");
    },

    onBidAccepted: (data) => {
      if (data.bidderId === userDetails?.id && data.sessionId === stream.id) {
        console.log("✅ Your bid was accepted!", data);
        
        // Show payment confirmation instead of immediately accepting
        setPendingBidData({
          amount: data.amount,
          bidId: data.bidId,
        });
        setShowPaymentConfirmation(true);
        
        setBidStatus({
          status: "accepted",
          amount: data.amount,
          message: "Your bid was accepted! Please confirm payment...",
        });
        toast.success("Your bid was accepted! Please confirm payment to start the call.");
      }
    },

    onBidRejected: (data) => {
      if (data.bidderId === userDetails?.id && data.sessionId === stream.id) {
        console.log("🚫 Your bid was rejected:", data);
        setBidStatus({
          status: "rejected",
          message: data.reason || "Your bid was rejected",
        });
        toast.error("Your bid was rejected");
        // Reset after 3 seconds
        setTimeout(() => {
          setBidStatus({ status: "idle" });
          setShowBidForm(false);
        }, 3000);
      }
    },

    onOutbid: (data) => {
      if (
        data.previousBidderId === userDetails?.id &&
        data.sessionId === stream.id
      ) {
        console.log("💸 You were outbid:", data);
        setBidStatus({
          status: "outbid",
          message: `You were outbid! New highest bid: $${data.newHighestBid}`,
        });
        toast.warning(
          `You were outbid! New highest bid: $${data.newHighestBid}`
        );
        // Allow placing new bid
        setTimeout(() => {
          setBidStatus({ status: "idle" });
        }, 2000);
      }
    },

    onNewBid: (data) => {
      if (data.sessionId === stream.id) {
        // Update current highest bid display
        stream.currentHighestBid = data.currentHighestBid || data.amount;
      }
    },
  });

  // Calculate estimated call cost
  useEffect(() => {
    const amount = parseFloat(bidAmount);
    if (!isNaN(amount) && stream.callRate) {
      // Estimate 10 minutes of call time
      const estimatedMinutes = 10;
      setEstimatedCost(amount + stream.callRate * estimatedMinutes);
    } else {
      setEstimatedCost(0);
    }
  }, [bidAmount, stream.callRate]);

  const handlePlaceBid = async () => {
    if (!userDetails?.id) {
      toast.error("Please log in to place bids");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    if (stream.currentHighestBid && amount <= stream.currentHighestBid) {
      toast.error(`Bid must be higher than $${stream.currentHighestBid}`);
      return;
    }

    if (!stream.allowBids) {
      toast.error("This stream is not accepting bids");
      return;
    }

    setBidStatus({ status: "placing", amount });

    try {
      webSocket.actions.placeBid(stream.id, amount);
    } catch (error) {
      console.error("Error placing bid:", error);
      setBidStatus({ status: "idle", message: "Failed to place bid" });
      toast.error("Failed to place bid");
    }
  };

  const getSuggestedBids = () => {
    const currentBid = stream.currentHighestBid || 0;
    return [
      currentBid + 10,
      currentBid + 25,
      currentBid + 50,
      currentBid + 100,
    ].filter((amount) => amount > currentBid);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Payment confirmation handlers
  const handlePaymentSuccess = (billingSession: any) => {
    console.log("✅ Payment confirmed, starting call:", billingSession);
    setShowPaymentConfirmation(false);
    setPendingBidData(null);
    setBidStatus({
      status: "accepted",
      message: "Payment confirmed! Starting call...",
    });
    toast.success("Payment confirmed! Starting call...");
    onBidAccepted?.();
  };

  const handlePaymentFailed = (error: string) => {
    console.error("❌ Payment failed:", error);
    setShowPaymentConfirmation(false);
    setPendingBidData(null);
    setBidStatus({
      status: "idle",
      message: "Payment failed. You can try bidding again.",
    });
    toast.error(`Payment failed: ${error}`);
  };

  const handleClosePaymentConfirmation = () => {
    setShowPaymentConfirmation(false);
    setPendingBidData(null);
    setBidStatus({ status: "idle" });
  };

  // Compact view for inline use
  if (compact) {
    return (
      <div className={`${className}`}>
        {bidStatus.status === "idle" && (
          <Button
            onClick={() => setShowBidForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!stream.allowBids}
          >
            {stream.allowBids ? "Place Bid" : "Bidding Closed"}
          </Button>
        )}

        {bidStatus.status === "placing" && (
          <Button disabled className="bg-gray-500">
            Placing Bid...
          </Button>
        )}

        {bidStatus.status === "placed" && (
          <Button disabled className="bg-yellow-500">
            Bid Placed (${bidStatus.amount})
          </Button>
        )}

        {bidStatus.status === "accepted" && (
          <Button disabled className="bg-green-500">
            Bid Accepted!
          </Button>
        )}

        {(bidStatus.status === "rejected" || bidStatus.status === "outbid") && (
          <Button
            onClick={() => setShowBidForm(true)}
            className="bg-red-500 hover:bg-red-600"
          >
            Bid Again
          </Button>
        )}

        {/* Simple bid form overlay */}
        {showBidForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 max-w-sm w-full">
              <h3 className="font-semibold mb-3">Place Your Bid</h3>
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: $${(stream.currentHighestBid || 0) + 1}`}
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBidForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={bidStatus.status === "placing"}
                >
                  {bidStatus.status === "placing" ? "Placing..." : "Place Bid"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view for dedicated bidding interface
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Stream Info Header */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={stream.influencer.profileImage || "/img/hbb_user_logo.png"}
          alt={stream.influencer.firstName}
          className="w-16 h-16 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/img/hbb_user_logo.png";
          }}
        />
        <div>
          <h3 className="text-lg font-semibold">
            {stream.influencer.firstName} {stream.influencer.lastName}
          </h3>
          {stream.influencer.profile?.username && (
            <p className="text-gray-600">
              @{stream.influencer.profile.username}
            </p>
          )}
          {stream.influencer.profile?.location && (
            <p className="text-sm text-gray-500">
              📍 {stream.influencer.profile.location}
            </p>
          )}
        </div>
      </div>

      {/* Current Bid Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Current Highest Bid</p>
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(stream.currentHighestBid || 0)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Call Rate</p>
          <p className="text-lg font-semibold">
            {stream.callRate
              ? `${formatCurrency(stream.callRate)}/min`
              : "Free"}
          </p>
        </div>
      </div>

      {/* Bid Status */}
      {bidStatus.message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            bidStatus.status === "accepted"
              ? "bg-green-100 text-green-800"
              : bidStatus.status === "placed"
              ? "bg-yellow-100 text-yellow-800"
              : bidStatus.status === "rejected" || bidStatus.status === "outbid"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {bidStatus.message}
        </div>
      )}

      {/* Bid Form */}
      {(bidStatus.status === "idle" || bidStatus.status === "outbid") &&
        stream.allowBids && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Bid Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-8"
                  placeholder={`Minimum: $${
                    (stream.currentHighestBid || 0) + 1
                  }`}
                  min={(stream.currentHighestBid || 0) + 1}
                  step="1"
                  disabled={
                    bidStatus.status !== "idle" && bidStatus.status !== "outbid"
                  }
                />
              </div>
            </div>

            {/* Suggested Bids */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Quick Bid Options
              </p>
              <div className="grid grid-cols-2 gap-2">
                {getSuggestedBids()
                  .slice(0, 4)
                  .map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBidAmount(amount.toString())}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                      disabled={bidStatus.status === "placing"}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
              </div>
            </div>

            {/* Cost Estimate */}
            {estimatedCost > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Estimated total cost:</strong>{" "}
                  {formatCurrency(estimatedCost)}
                  <br />
                  <span className="text-xs">
                    (Bid amount + estimated 10 min call time)
                  </span>
                </p>
              </div>
            )}

            {/* Action Button */}

            <Button
              onClick={handlePlaceBid}
              disabled={
                !bidAmount ||
                parseFloat(bidAmount) <= (stream.currentHighestBid || 0) ||
                !["idle", "outbid"].includes(bidStatus.status)
              }
            >
              {["placing", "accepted", "rejected"].includes(bidStatus.status)
                ? `Bid ${bidStatus.status}...`
                : "Place Bid"}
            </Button>
          </div>
        )}

      {/* No Bidding Allowed */}
      {!stream.allowBids && (
        <div className="text-center py-6">
          <div className="text-gray-400 text-4xl mb-3">🚫</div>
          <p className="text-gray-600">This stream is not accepting bids</p>
          <p className="text-sm text-gray-500">
            Contact the influencer directly to join
          </p>
        </div>
      )}

      {/* Terms */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        By placing a bid, you agree to pay the winning amount if accepted
      </p>

      {/* Payment Confirmation Modal */}
      {showPaymentConfirmation && pendingBidData && (
        <PaymentConfirmation
          isOpen={showPaymentConfirmation}
          onClose={handleClosePaymentConfirmation}
          bidAmount={pendingBidData.amount}
          influencerName={`${stream.influencer.firstName} ${stream.influencer.lastName}`.trim() || stream.influencer.profile?.username || "Influencer"}
          sessionId={stream.id}
          bidId={pendingBidData.bidId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailed={handlePaymentFailed}
        />
      )}
    </div>
  );
};

export default BidComponent;
