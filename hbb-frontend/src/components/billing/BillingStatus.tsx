// components/billing/BillingStatus.tsx - Component for displaying billing status during calls
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { BillingService, BillingSession } from "@/src/api/billing/billing";
import { toast } from "sonner";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";

interface BillingStatusProps {
  sessionId: string;
  bidAmount: number;
  callDuration: number;
  callRate?: number;
  className?: string;
}

type BillingState = 
  | "idle"
  | "processing_payment"
  | "payment_pending"
  | "payment_success"
  | "payment_failed"
  | "billing_active"
  | "billing_completed"
  | "refunded";

const BillingStatus: React.FC<BillingStatusProps> = ({
  sessionId,
  bidAmount,
  callDuration,
  callRate,
  className = "",
}) => {
  const [billingState, setBillingState] = useState<BillingState>("idle");
  const [billingSession, setBillingSession] = useState<BillingSession | null>(null);
  const [totalCharged, setTotalCharged] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  // WebSocket for real-time billing updates
  const webSocket = useWebSocket(userDetails?.id, {
    onBillingStarted: (data) => {
      console.log("💰 Billing started:", data);
      if (data.sessionId === sessionId) {
        setBillingState("billing_active");
        // Create a mock billing session from the event data
        const mockSession: BillingSession = {
          id: data.billingSessionId,
          streamSessionId: data.sessionId,
          sessionId: data.sessionId,
          explorerId: userDetails?.id || "",
          influencerId: "",
          bidAmount: data.bidAmount,
          startTime: new Date().toISOString(),
          chargedAmount: data.bidAmount,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBillingSession(mockSession);
        toast.success("Call billing started");
      }
    },

    onBillingUpdated: (data) => {
      console.log("💰 Billing updated:", data);
      if (data.sessionId === sessionId) {
        setTotalCharged(data.totalCharged);
        // Update existing session or create new one
        setBillingSession(prev => prev ? {
          ...prev,
          chargedAmount: data.totalCharged,
          duration: data.duration,
          updatedAt: new Date().toISOString(),
        } : null);
      }
    },

    onBillingCompleted: (data) => {
      console.log("💰 Billing completed:", data);
      if (data.sessionId === sessionId) {
        setBillingState("billing_completed");
        setTotalCharged(data.finalAmount);
        // Update existing session or create new one
        setBillingSession(prev => prev ? {
          ...prev,
          chargedAmount: data.finalAmount,
          duration: data.duration,
          status: "COMPLETED",
          endTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : null);
        toast.success(`Call completed! Total charged: $${data.finalAmount}`);
      }
    },

    onPaymentFailed: (data) => {
      console.log("❌ Payment failed:", data);
      if (data.sessionId === sessionId) {
        setBillingState("payment_failed");
        toast.error("Payment failed. Please check your payment method.");
      }
    },

    onRefundProcessed: (data) => {
      console.log("💸 Refund processed:", data);
      if (data.sessionId === sessionId) {
        setBillingState("refunded");
        toast.info("Refund has been processed");
      }
    },
  });

  // Calculate current cost based on duration
  useEffect(() => {
    if (billingState === "billing_active" && callRate) {
      const minutes = callDuration / 60;
      const currentCost = bidAmount + (minutes * callRate);
      setTotalCharged(currentCost);
    }
  }, [callDuration, callRate, bidAmount, billingState]);

  const handleProcessPayment = async () => {
    if (!sessionId || isProcessing) return;

    setIsProcessing(true);
    setBillingState("processing_payment");

    try {
      // This would typically be called when a bid is accepted
      // For now, we'll simulate the payment process
      const result = await BillingService.processBidPayment("mock-bid-id");
      
      if (result.success) {
        setBillingState("payment_success");
        setBillingSession(result.billingSession || null);
        toast.success("Payment processed successfully!");
      } else {
        setBillingState("payment_failed");
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setBillingState("payment_failed");
      toast.error("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartBilling = async () => {
    if (!sessionId || !userDetails?.id) return;

    try {
      const result = await BillingService.startCallBilling({
        sessionId,
        explorerId: userDetails.id,
        influencerId: "mock-influencer-id", // This should come from session data
        bidAmount,
      });

      if (result.success) {
        setBillingState("billing_active");
        setBillingSession(result.billingSession || null);
        toast.success("Call billing started");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error starting billing:", error);
      toast.error("Failed to start billing");
    }
  };

  const handleEndBilling = async () => {
    if (!billingSession) return;

    try {
      const result = await BillingService.endCallBilling({
        sessionId,
        billingSessionId: billingSession.id,
        endTime: new Date().toISOString(),
        duration: callDuration,
      });

      if (result.success) {
        setBillingState("billing_completed");
        setBillingSession(result.billingSession || null);
        toast.success("Call billing completed");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error ending billing:", error);
      toast.error("Failed to end billing");
    }
  };

  const getStatusColor = (state: BillingState) => {
    switch (state) {
      case "idle":
        return "bg-gray-100 text-gray-800";
      case "processing_payment":
        return "bg-yellow-100 text-yellow-800";
      case "payment_pending":
        return "bg-blue-100 text-blue-800";
      case "payment_success":
        return "bg-green-100 text-green-800";
      case "payment_failed":
        return "bg-red-100 text-red-800";
      case "billing_active":
        return "bg-blue-100 text-blue-800";
      case "billing_completed":
        return "bg-green-100 text-green-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (state: BillingState) => {
    switch (state) {
      case "idle":
        return "Ready to Process Payment";
      case "processing_payment":
        return "Processing Payment...";
      case "payment_pending":
        return "Payment Pending";
      case "payment_success":
        return "Payment Successful";
      case "payment_failed":
        return "Payment Failed";
      case "billing_active":
        return "Billing Active";
      case "billing_completed":
        return "Billing Completed";
      case "refunded":
        return "Refunded";
      default:
        return "Unknown Status";
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Billing Status</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(billingState)}`}>
            {getStatusText(billingState)}
          </span>
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Bid Amount</p>
            <p className="font-semibold">{formatCurrency(bidAmount)}</p>
          </div>
          <div>
            <p className="text-gray-600">Call Duration</p>
            <p className="font-semibold">{formatDuration(callDuration)}</p>
          </div>
          {callRate && (
            <div>
              <p className="text-gray-600">Rate per Minute</p>
              <p className="font-semibold">{formatCurrency(callRate)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-600">Total Charged</p>
            <p className="font-semibold text-lg">{formatCurrency(totalCharged)}</p>
          </div>
        </div>

        {/* Payment Intent Info */}
        {billingSession?.stripePaymentIntentId && (
          <div className="text-xs text-gray-500">
            <p>Payment ID: {billingSession.stripePaymentIntentId}</p>
            {billingSession.stripeChargeId && (
              <p>Charge ID: {billingSession.stripeChargeId}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {billingState === "idle" && (
            <Button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Processing..." : "Process Payment"}
            </Button>
          )}

          {billingState === "payment_success" && (
            <Button
              onClick={handleStartBilling}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Start Call Billing
            </Button>
          )}

          {billingState === "billing_active" && (
            <Button
              onClick={handleEndBilling}
              variant="outline"
              className="flex-1"
            >
              End Call Billing
            </Button>
          )}

          {billingState === "payment_failed" && (
            <Button
              onClick={handleProcessPayment}
              variant="outline"
              className="flex-1"
            >
              Retry Payment
            </Button>
          )}
        </div>

        {/* Real-time Cost Updates */}
        {billingState === "billing_active" && callRate && (
          <div className="text-center text-sm text-blue-600">
            <p>💡 Cost updates every minute</p>
            <p>Current cost: {formatCurrency(totalCharged)}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BillingStatus;
