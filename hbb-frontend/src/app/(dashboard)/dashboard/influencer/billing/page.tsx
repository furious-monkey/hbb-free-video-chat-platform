// app/(dashboard)/dashboard/influencer/billing/page.tsx - Billing history page for influencers
"use client";
import React from "react";
import BillingHistory from "@/src/components/billing/BillingHistory";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";

const InfluencerBillingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings & Billing</h1>
            <p className="text-gray-600 mt-1">
              View your earnings from calls and billing information
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/influencer/live")}
            variant="outline"
          >
            Back to Live Streams
          </Button>
        </div>

        {/* Billing History */}
        <BillingHistory limit={20} />

        {/* Additional Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Earnings Information</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>How earnings work:</strong> You earn the bid amount when you accept a bid, plus any additional call time charges.
            </p>
            <p>
              <strong>Payouts:</strong> Earnings are processed and paid out according to your payout schedule.
            </p>
            <p>
              <strong>Fees:</strong> Platform fees may apply to your earnings.
            </p>
            <p>
              <strong>Questions?</strong> Contact support if you have any earnings questions or concerns.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InfluencerBillingPage;
