// components/billing/BillingHistory.tsx - Component for displaying billing history
"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { BillingService, BillingSession } from "@/src/api/billing/billing";
import { toast } from "sonner";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";

interface BillingHistoryProps {
  className?: string;
  limit?: number;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({
  className = "",
  limit = 10,
}) => {
  const [billingSessions, setBillingSessions] = useState<BillingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  useEffect(() => {
    if (userDetails?.id) {
      loadBillingHistory();
    }
  }, [userDetails?.id, limit]);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sessions = await BillingService.getUserBillingSessions(limit);
      setBillingSessions(sessions);
    } catch (error: any) {
      console.error("Error loading billing history:", error);
      setError("Failed to load billing history");
      toast.error("Failed to load billing history");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (billingSessionId: string) => {
    try {
      const result = await BillingService.processRefund(billingSessionId);
      
      if (result.success) {
        toast.success("Refund processed successfully");
        loadBillingHistory(); // Reload to show updated status
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing history...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadBillingHistory} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (billingSessions.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-lg font-semibold mb-2">No Billing History</h3>
          <p className="text-gray-600">
            You haven't made any calls yet. Start bidding to see your billing history here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Billing History</h3>
          <Button onClick={loadBillingHistory} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {billingSessions.map((session) => (
            <div
              key={session.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Session {session.streamSessionId.slice(0, 8)}...
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    session.status === "COMPLETED" 
                      ? "bg-green-100 text-green-800" 
                      : session.status === "FAILED" 
                      ? "bg-red-100 text-red-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {session.status}
                  </span>
                </div>
                <span className="text-lg font-semibold">
                  {formatCurrency(session.chargedAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>Bid Amount: {formatCurrency(session.bidAmount)}</p>
                  <p>Duration: {formatDuration(session.duration)}</p>
                </div>
                <div>
                  <p>Started: {formatDate(session.startTime)}</p>
                  {session.endTime && (
                    <p>Ended: {formatDate(session.endTime)}</p>
                  )}
                </div>
              </div>

              {session.stripePaymentIntentId && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Payment ID: {session.stripePaymentIntentId}</p>
                  {session.stripeChargeId && (
                    <p>Charge ID: {session.stripeChargeId}</p>
                  )}
                </div>
              )}

              {/* Refund Button */}
              {session.status === "COMPLETED" && (
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => handleRefund(session.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Request Refund
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {billingSessions.length >= limit && (
          <div className="text-center">
            <Button onClick={() => loadBillingHistory()} variant="outline">
              Load More
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BillingHistory;
