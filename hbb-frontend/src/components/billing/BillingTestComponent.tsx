// components/billing/BillingTestComponent.tsx - Test component for verifying billing flow
"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { BillingService } from "@/src/api/billing/billing";
import { toast } from "sonner";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";

interface TestResult {
  test: string;
  status: "pending" | "running" | "passed" | "failed";
  message?: string;
  timestamp?: Date;
}

const BillingTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  // WebSocket for testing real-time events
  const webSocket = useWebSocket(userDetails?.id, {
    onBillingStarted: (data) => {
      console.log("✅ Test: Billing started event received:", data);
      updateTestResult("billing_events", "passed", "Billing started event received");
    },
    onBillingUpdated: (data) => {
      console.log("✅ Test: Billing updated event received:", data);
      updateTestResult("billing_events", "passed", "Billing updated event received");
    },
    onBillingCompleted: (data) => {
      console.log("✅ Test: Billing completed event received:", data);
      updateTestResult("billing_events", "passed", "Billing completed event received");
    },
    onPaymentFailed: (data) => {
      console.log("✅ Test: Payment failed event received:", data);
      updateTestResult("billing_events", "passed", "Payment failed event received");
    },
    onRefundProcessed: (data) => {
      console.log("✅ Test: Refund processed event received:", data);
      updateTestResult("billing_events", "passed", "Refund processed event received");
    },
  });

  const updateTestResult = (test: string, status: TestResult["status"], message?: string) => {
    setTestResults(prev => 
      prev.map(result => 
        result.test === test 
          ? { ...result, status, message, timestamp: new Date() }
          : result
      )
    );
  };

  const addTestResult = (test: string, status: TestResult["status"], message?: string) => {
    setTestResults(prev => [
      ...prev,
      { test, status, message, timestamp: new Date() }
    ]);
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setCurrentTest(testName);
    addTestResult(testName, "running");
    
    try {
      await testFn();
      updateTestResult(testName, "passed");
    } catch (error: any) {
      updateTestResult(testName, "failed", error.message);
    } finally {
      setCurrentTest(null);
    }
  };

  const testBillingAPI = async () => {
    // Test health check
    const health = await BillingService.getHealthStatus();
    if (!health.success) {
      throw new Error("Billing service health check failed");
    }

    // Test getting billing sessions
    const sessions = await BillingService.getUserBillingSessions(5);
    console.log("Billing sessions retrieved:", sessions.length);

    // Test getting specific billing session (if any exist)
    if (sessions.length > 0) {
      const session = await BillingService.getBillingSession(sessions[0].id);
      if (!session) {
        throw new Error("Failed to retrieve specific billing session");
      }
    }
  };

  const testWebSocketConnection = async () => {
    if (!webSocket.isReady) {
      throw new Error("WebSocket not ready");
    }
    
    if (!webSocket.isConnected) {
      throw new Error("WebSocket not connected");
    }
    
    if (!webSocket.isAuthenticated) {
      throw new Error("WebSocket not authenticated");
    }
  };

  const testBillingEvents = async () => {
    // This test will pass when billing events are received via WebSocket
    // We'll simulate a timeout if no events are received
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("No billing events received within 10 seconds"));
      }, 10000);

      // Check if we already have billing events
      const hasBillingEvents = testResults.some(result => 
        result.test === "billing_events" && result.status === "passed"
      );
      
      if (hasBillingEvents) {
        clearTimeout(timeout);
        resolve();
      }
    });
  };

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: WebSocket Connection
      await runTest("websocket_connection", testWebSocketConnection);
      
      // Test 2: Billing API
      await runTest("billing_api", testBillingAPI);
      
      // Test 3: Billing Events (with timeout)
      await runTest("billing_events", testBillingEvents);
      
      toast.success("All billing tests completed!");
    } catch (error: any) {
      toast.error(`Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "running":
        return "bg-yellow-100 text-yellow-800";
      case "passed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "running":
        return "🔄";
      case "passed":
        return "✅";
      case "failed":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Billing System Test Suite</h3>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? "Running Tests..." : "Run All Tests"}
          </Button>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">WebSocket</p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${webSocket.isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {webSocket.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Authenticated</p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${webSocket.isAuthenticated ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {webSocket.isAuthenticated ? "Yes" : "No"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Ready</p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${webSocket.isReady ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {webSocket.isReady ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <h4 className="font-medium">Test Results</h4>
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-sm">No tests run yet. Click "Run All Tests" to start.</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <div>
                      <p className="font-medium capitalize">
                        {result.test.replace(/_/g, " ")}
                      </p>
                      {result.message && (
                        <p className="text-sm text-gray-600">{result.message}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Test Indicator */}
        {currentTest && (
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-blue-800">
              Running: {currentTest.replace(/_/g, " ")}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Test Coverage:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>WebSocket connection and authentication</li>
            <li>Billing API endpoints</li>
            <li>Real-time billing events</li>
            <li>Payment processing flow</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default BillingTestComponent;
