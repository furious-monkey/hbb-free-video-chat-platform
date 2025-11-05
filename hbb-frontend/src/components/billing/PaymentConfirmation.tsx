// components/billing/PaymentConfirmation.tsx - Component for confirming payment when bid is accepted
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { BillingService } from "@/src/api/billing/billing";
import { toast } from "sonner";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";

interface PaymentConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  bidAmount: number;
  influencerName: string;
  sessionId: string;
  bidId: string;
  onPaymentSuccess: (billingSession: any) => void;
  onPaymentFailed: (error: string) => void;
}

type PaymentState = 
  | "confirming"
  | "processing"
  | "success"
  | "failed"
  | "cancelled";

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  isOpen,
  onClose,
  bidAmount,
  influencerName,
  sessionId,
  bidId,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const [paymentState, setPaymentState] = useState<PaymentState>("confirming");
  const [billingSession, setBillingSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentState("confirming");
      setBillingSession(null);
      setError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleConfirmPayment = async () => {
    if (!stripe || !elements || !userDetails?.id) {
      setError("Payment system not ready");
      return;
    }

    setIsProcessing(true);
    setPaymentState("processing");

    try {
      // Step 1: Process bid payment (create billing session and payment intent)
      const billingResult = await BillingService.processBidPayment(bidId);
      
      if (!billingResult.success) {
        throw new Error(billingResult.message);
      }

      setBillingSession(billingResult.billingSession);

      // Step 2: Confirm payment with Stripe
      if (billingResult.clientSecret) {
        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: 'if_required'
        });

        if (stripeError) {
          throw new Error(stripeError.message || 'Payment failed');
        }
      }

      // Step 3: Payment successful
      setPaymentState("success");
      toast.success("Payment confirmed! Starting call...");
      
      // Notify parent component
      setTimeout(() => {
        onPaymentSuccess(billingResult.billingSession);
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error("Payment confirmation failed:", error);
      setPaymentState("failed");
      setError(error.message || "Payment failed");
      onPaymentFailed(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setPaymentState("cancelled");
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStateIcon = (state: PaymentState) => {
    switch (state) {
      case "confirming":
        return "💰";
      case "processing":
        return "⏳";
      case "success":
        return "✅";
      case "failed":
        return "❌";
      case "cancelled":
        return "🚫";
      default:
        return "💰";
    }
  };

  const getStateColor = (state: PaymentState) => {
    switch (state) {
      case "confirming":
        return "text-blue-600";
      case "processing":
        return "text-yellow-600";
      case "success":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "cancelled":
        return "text-gray-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getStateIcon(paymentState)}</span>
            <span className={getStateColor(paymentState)}>
              {paymentState === "confirming" && "Confirm Payment"}
              {paymentState === "processing" && "Processing Payment"}
              {paymentState === "success" && "Payment Successful"}
              {paymentState === "failed" && "Payment Failed"}
              {paymentState === "cancelled" && "Payment Cancelled"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Details */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Influencer</span>
                <span className="font-medium">{influencerName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bid Amount</span>
                <span className="font-semibold text-lg">{formatCurrency(bidAmount)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Session ID</span>
                <span className="text-xs font-mono">{sessionId.slice(0, 8)}...</span>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          {paymentState === "confirming" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="border rounded-lg p-3">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {paymentState === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Payment confirmed! You will be connected to {influencerName} shortly.
              </p>
            </div>
          )}

          {/* Processing Message */}
          {paymentState === "processing" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <p className="text-sm text-yellow-800">Processing your payment...</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {paymentState === "confirming" && (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!stripe || !elements || isProcessing}
                >
                  {isProcessing ? "Processing..." : `Pay ${formatCurrency(bidAmount)}`}
                </Button>
              </>
            )}

            {paymentState === "failed" && (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Try Again
                </Button>
              </>
            )}

            {(paymentState === "success" || paymentState === "cancelled") && (
              <Button
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            )}
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            By confirming payment, you agree to pay the bid amount if the call proceeds.
            Refunds may be available if the call doesn't start within 5 minutes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmation;
