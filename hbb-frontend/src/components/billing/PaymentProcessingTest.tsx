"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { BillingService } from '@/src/api/billing/billing';
import { toast } from 'sonner';

const PaymentProcessingTest: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [billingSessions, setBillingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [testDuration, setTestDuration] = useState<number>(180); // 3 minutes

  // Fetch billing sessions for a specific session
  const fetchBillingSessions = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await BillingService.getUserBillingSessions();
      if (response.data?.success) {
        setBillingSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching billing sessions:', error);
      toast.error('Failed to fetch billing sessions');
    } finally {
      setLoading(false);
    }
  };

  // Test end call billing
  const testEndCallBilling = async () => {
    if (!sessionId) {
      toast.error('Please enter a session ID');
      return;
    }

    try {
      const result = await BillingService.endCallBilling({
        streamSessionId: sessionId,
        duration: testDuration,
        reason: 'completed'
      });

      if (result.data?.success) {
        toast.success('Call billing ended successfully!');
        console.log('End call billing result:', result.data);
      } else {
        toast.error(`Failed to end call billing: ${result.data?.message}`);
      }
    } catch (error: any) {
      console.error('Error ending call billing:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Test payment failure handling
  const testPaymentFailure = async () => {
    if (!sessionId) {
      toast.error('Please enter a session ID');
      return;
    }

    try {
      const result = await BillingService.handlePaymentFailure(sessionId);
      
      if (result.data?.success) {
        toast.success('Payment failure handled successfully!');
        console.log('Payment failure result:', result.data);
      } else {
        toast.error(`Failed to handle payment failure: ${result.data?.message}`);
      }
    } catch (error: any) {
      console.error('Error handling payment failure:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Test refund processing
  const testRefund = async () => {
    if (!sessionId) {
      toast.error('Please enter a session ID');
      return;
    }

    try {
      const result = await BillingService.processRefund(sessionId);
      
      if (result.data?.success) {
        toast.success('Refund processed successfully!');
        console.log('Refund result:', result.data);
      } else {
        toast.error(`Failed to process refund: ${result.data?.message}`);
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">💳 Payment Processing Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Session ID Input */}
          <div>
            <Label htmlFor="sessionId">Session ID</Label>
            <Input
              id="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter session ID to test"
              className="bg-gray-700 border-gray-600"
            />
          </div>

          {/* Test Duration Input */}
          <div>
            <Label htmlFor="testDuration">Test Duration (seconds)</Label>
            <Input
              id="testDuration"
              type="number"
              value={testDuration}
              onChange={(e) => setTestDuration(parseInt(e.target.value) || 0)}
              placeholder="180"
              className="bg-gray-700 border-gray-600"
            />
            <p className="text-sm text-gray-400 mt-1">
              {Math.floor(testDuration / 60)}:{(testDuration % 60).toString().padStart(2, '0')} 
              ({testDuration} seconds)
            </p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={fetchBillingSessions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Loading...' : 'Fetch Billing Sessions'}
            </Button>
            
            <Button 
              onClick={testEndCallBilling}
              className="bg-green-600 hover:bg-green-700"
            >
              Test End Call Billing
            </Button>
            
            <Button 
              onClick={testPaymentFailure}
              className="bg-red-600 hover:bg-red-700"
            >
              Test Payment Failure
            </Button>
            
            <Button 
              onClick={testRefund}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Test Refund
            </Button>
          </div>

          {/* Billing Sessions Display */}
          {billingSessions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📊 Billing Sessions</h3>
              <div className="space-y-2">
                {billingSessions.map((session, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Session ID:</span>
                        <span className="ml-2 font-mono text-xs">{session.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          session.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Bid Amount:</span>
                        <span className="ml-2 font-semibold">${session.bidAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Charged Amount:</span>
                        <span className="ml-2 font-semibold">${session.chargedAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="ml-2">{session.duration ? `${Math.floor(session.duration / 60)}:${(session.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Stripe Charge ID:</span>
                        <span className="ml-2 font-mono text-xs">{session.stripeChargeId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Start Time:</span>
                        <span className="ml-2 text-xs">{new Date(session.startTime).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">End Time:</span>
                        <span className="ml-2 text-xs">{session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📋 Testing Instructions</h3>
            <div className="text-sm space-y-2">
              <div><strong>1. End-to-End Test:</strong></div>
              <div className="ml-4 text-gray-300">
                • Go to /dashboard/test-bidding<br/>
                • Create stream, place bid, accept bid<br/>
                • Complete payment, end call<br/>
                • Use session ID here to verify
              </div>
              
              <div><strong>2. Manual Testing:</strong></div>
              <div className="ml-4 text-gray-300">
                • Enter session ID from a completed call<br/>
                • Click "Fetch Billing Sessions" to see results<br/>
                • Test different scenarios (failure, refund)
              </div>
              
              <div><strong>3. Database Verification:</strong></div>
              <div className="ml-4 text-gray-300">
                • Check BillingSession table<br/>
                • Verify chargedAmount matches calculation<br/>
                • Confirm Stripe charge ID exists
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentProcessingTest;
