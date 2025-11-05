// app/(dashboard)/dashboard/test-billing/page.tsx - Test page for billing system
"use client";
import React from "react";
import BillingTestComponent from "@/src/components/billing/BillingTestComponent";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";

const TestBillingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing System Test</h1>
            <p className="text-gray-600 mt-1">
              Test the complete bidding and billing flow
            </p>
          </div>
          <Button
            onClick={() => router.back()}
            variant="outline"
          >
            Back
          </Button>
        </div>

        {/* Test Component */}
        <BillingTestComponent />

        {/* Additional Test Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Scenarios</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">1. Basic Bidding Flow</h4>
              <p className="text-sm text-gray-600">
                Place a bid → Get accepted → Confirm payment → Start call billing
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">2. Real-time Updates</h4>
              <p className="text-sm text-gray-600">
                Verify WebSocket events for billing status changes
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">3. Payment Processing</h4>
              <p className="text-sm text-gray-600">
                Test Stripe integration and payment confirmation
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">4. Error Handling</h4>
              <p className="text-sm text-gray-600">
                Test failed payments, network issues, and refunds
              </p>
            </div>
          </div>
        </Card>

        {/* Manual Test Steps */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Manual Test Steps</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">1</span>
              <p>Go to live streams and find an influencer accepting bids</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">2</span>
              <p>Place a bid and wait for acceptance</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">3</span>
              <p>Confirm payment when prompted</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">4</span>
              <p>Verify billing status updates during the call</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">5</span>
              <p>Check billing history after call ends</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestBillingPage;
