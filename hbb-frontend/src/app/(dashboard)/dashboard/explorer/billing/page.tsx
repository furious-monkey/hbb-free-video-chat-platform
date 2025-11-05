// app/(dashboard)/dashboard/explorer/billing/page.tsx - Billing history page for explorers
"use client";
import React from "react";
import BillingHistory from "@/src/components/billing/BillingHistory";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";

const BillingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing History</h1>
            <p className="text-gray-600 mt-1">
              View your call history and billing information
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/explorer/live")}
            variant="outline"
          >
            Back to Live Streams
          </Button>
        </div>

        {/* Billing History */}
        <BillingHistory limit={20} />

        {/* Additional Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Billing Information</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>How billing works:</strong> You pay the bid amount when your bid is accepted, plus any additional call time charges.
            </p>
            <p>
              <strong>Refunds:</strong> Refunds may be available if the call doesn't start within 5 minutes or if there are technical issues.
            </p>
            <p>
              <strong>Payment methods:</strong> All payments are processed securely through Stripe.
            </p>
            <p>
              <strong>Questions?</strong> Contact support if you have any billing questions or concerns.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BillingPage;
