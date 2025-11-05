// components/billing/SimplePaymentConfirmation.tsx - Simplified payment confirmation
"use client";
import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";
import BillingService from "@/src/api/billing/billing";

interface SimplePaymentConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  bidAmount: number;
  influencerName: string;
  sessionId: string;
  bidId: string;
  onPaymentSuccess: (billingSession: any) => void;
  onPaymentFailed: (error: string) => void;
}

const SimplePaymentConfirmation: React.FC<SimplePaymentConfirmationProps> = ({
  isOpen,
  onClose,
  bidAmount,
  influencerName,
  sessionId,
  bidId,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [testCardNumber, setTestCardNumber] = useState("4242 4242 4242 4242");

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  const handleConfirmPayment = async () => {
    if (!userDetails?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      console.log("💳 Processing payment for bid:", {
        bidId,
        sessionId,
        bidAmount,
        userId: userDetails.id,
      });

      // For testing purposes, we'll simulate a successful payment
      // In production, this would integrate with Stripe
      const mockPaymentResult = {
        success: true,
        billingSession: {
          id: `billing_${Date.now()}`,
          sessionId,
          bidAmount,
          status: "ACTIVE",
          startTime: new Date().toISOString(),
        },
        message: "Payment processed successfully",
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (mockPaymentResult.success) {
        toast.success("Payment successful! Starting your call.");
        onPaymentSuccess(mockPaymentResult.billingSession);
      } else {
        throw new Error(mockPaymentResult.message || "Payment failed");
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      setPaymentError(error.message || "An unexpected error occurred.");
      toast.error(error.message || "Payment failed.");
      onPaymentFailed(error.message || "Unknown payment error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Confirm Your Bid Payment
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Your bid of <span className="font-semibold text-blue-600">${bidAmount.toFixed(2)}</span> for a call with{" "}
            <span className="font-semibold">{influencerName}</span> has been accepted!
            Please confirm payment to start the call.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Test Card Information */}
          <div className="border p-3 rounded-md bg-gray-50">
            <Label htmlFor="testCard" className="text-sm font-medium text-gray-700">
              Test Card Number (Stripe Test Mode):
            </Label>
            <Input
              id="testCard"
              value={testCardNumber}
              onChange={(e) => setTestCardNumber(e.target.value)}
              className="mt-1 bg-white"
              placeholder="4242 4242 4242 4242"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is a test card for development. No real payment will be processed.
            </p>
          </div>

          {/* Payment Summary */}
          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">Payment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Bid Amount:</span>
                <span className="font-semibold">${bidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Call Rate:</span>
                <span className="font-semibold">$2.00/min</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-2">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold text-blue-600">${bidAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{paymentError}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-lg font-semibold"
            >
              {isProcessing ? "Processing Payment..." : `Pay $${bidAmount.toFixed(2)} & Start Call`}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="px-4 text-gray-700 border-gray-300 hover:bg-gray-100"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePaymentConfirmation;

