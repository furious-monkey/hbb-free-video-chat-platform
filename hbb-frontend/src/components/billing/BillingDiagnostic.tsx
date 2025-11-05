"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { BillingService } from '@/src/api/billing/billing';
import { toast } from 'sonner';
import { useUserStore } from '@/src/store/userStore';
import { shallow } from 'zustand/shallow';

const BillingDiagnostic: React.FC = () => {
  const [billingSessions, setBillingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  // Fetch billing sessions
  const fetchBillingSessions = async () => {
    setLoading(true);
    try {
      const sessions = await BillingService.getUserBillingSessions(50);
      setBillingSessions(sessions);
      
      // Run diagnostics
      runDiagnostics(sessions);
    } catch (error) {
      console.error('Error fetching billing sessions:', error);
      toast.error('Failed to fetch billing sessions');
    } finally {
      setLoading(false);
    }
  };

  // Run diagnostics on billing sessions
  const runDiagnostics = (sessions: any[]) => {
    const stats = {
      total: sessions.length,
      pending: sessions.filter(s => s.status === 'PENDING').length,
      active: sessions.filter(s => s.status === 'ACTIVE').length,
      completed: sessions.filter(s => s.status === 'COMPLETED').length,
      failed: sessions.filter(s => s.status === 'FAILED').length,
      refunded: sessions.filter(s => s.status === 'REFUNDED').length,
    };

    const issues = [];
    
    if (stats.pending > 0) {
      issues.push(`⚠️ ${stats.pending} billing sessions stuck in PENDING status`);
    }
    
    if (stats.active > 0) {
      issues.push(`🔄 ${stats.active} billing sessions still ACTIVE (calls may not have ended)`);
    }
    
    if (stats.completed === 0 && stats.total > 0) {
      issues.push(`❌ No billing sessions have been completed successfully`);
    }

    const pendingSessions = sessions.filter(s => s.status === 'PENDING');
    const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
    
    setDiagnostics({
      stats,
      issues,
      pendingSessions,
      activeSessions,
      recommendations: generateRecommendations(stats, issues)
    });
  };

  // Generate recommendations based on diagnostics
  const generateRecommendations = (stats: any, issues: string[]) => {
    const recommendations = [];
    
    if (stats.pending > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Pending Billing Sessions',
        description: 'These sessions were created but never completed. This usually means calls ended without proper billing completion.',
        action: 'Check if calls are ending properly and if endCallBilling is being called.'
      });
    }
    
    if (stats.active > 0) {
      recommendations.push({
        type: 'info',
        title: 'Active Billing Sessions',
        description: 'These sessions are currently active. If calls have ended, these should be completed.',
        action: 'Manually end billing for completed calls using the test tool below.'
      });
    }
    
    if (stats.completed === 0 && stats.total > 0) {
      recommendations.push({
        type: 'error',
        title: 'No Completed Sessions',
        description: 'No billing sessions have been completed successfully. This indicates a problem with the billing flow.',
        action: 'Check backend logs for billing errors and ensure Stripe integration is working.'
      });
    }

    return recommendations;
  };

  // Manually end billing for a session
  const manuallyEndBilling = async (sessionId: string, duration: number = 300) => {
    try {
      const result = await BillingService.endCallBilling({
        streamSessionId: sessionId,
        duration: duration,
        reason: 'completed'
      });

      if (result.success) {
        toast.success(`Billing ended successfully for session ${sessionId}`);
        console.log('Manual end billing result:', result);
        // Refresh the data
        fetchBillingSessions();
      } else {
        toast.error(`Failed to end billing: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error ending billing:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Check billing health
  const checkBillingHealth = async () => {
    try {
      const health = await BillingService.getHealthStatus();
      toast.info(`Billing service status: ${health.success ? 'Healthy' : 'Unhealthy'}`);
      console.log('Billing health:', health);
    } catch (error) {
      toast.error('Failed to check billing health');
    }
  };

  useEffect(() => {
    if (userDetails?.id) {
      fetchBillingSessions();
    }
  }, [userDetails?.id]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">🔍 Billing Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Controls */}
          <div className="flex space-x-4">
            <Button 
              onClick={fetchBillingSessions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
            
            <Button 
              onClick={checkBillingHealth}
              className="bg-green-600 hover:bg-green-700"
            >
              Check Health
            </Button>
          </div>

          {/* Diagnostics Summary */}
          {diagnostics && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">📊 Billing Status Summary</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{diagnostics.stats.total}</div>
                  <div className="text-sm text-gray-400">Total Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{diagnostics.stats.pending}</div>
                  <div className="text-sm text-gray-400">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{diagnostics.stats.completed}</div>
                  <div className="text-sm text-gray-400">Completed</div>
                </div>
              </div>

              {/* Issues */}
              {diagnostics.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-red-400 mb-2">🚨 Issues Found:</h4>
                  <ul className="space-y-1">
                    {diagnostics.issues.map((issue: string, index: number) => (
                      <li key={index} className="text-sm text-red-300">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {diagnostics.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">💡 Recommendations:</h4>
                  <div className="space-y-2">
                    {diagnostics.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-700 rounded">
                        <div className="font-semibold text-sm">{rec.title}</div>
                        <div className="text-xs text-gray-300 mt-1">{rec.description}</div>
                        <div className="text-xs text-blue-300 mt-1"><strong>Action:</strong> {rec.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual End Billing Tool */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🔧 Manual End Billing Tool</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="sessionId">Session ID</Label>
                <Input
                  id="sessionId"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID"
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  defaultValue={300}
                  placeholder="300"
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            
            <Button 
              onClick={() => manuallyEndBilling(sessionId, 300)}
              disabled={!sessionId}
              className="bg-red-600 hover:bg-red-700"
            >
              Manually End Billing
            </Button>
          </div>

          {/* Billing Sessions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📋 Billing Sessions</h3>
            
            {billingSessions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No billing sessions found
              </div>
            ) : (
              <div className="space-y-2">
                {billingSessions.map((session, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Session ID:</span>
                        <div className="font-mono text-xs">{session.id}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          session.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          session.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Amount:</span>
                        <span className="ml-2 font-semibold">${session.bidAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Charged:</span>
                        <span className="ml-2 font-semibold">${session.chargedAmount || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="ml-2">{session.duration ? `${Math.floor(session.duration / 60)}:${(session.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Stripe Charge:</span>
                        <span className="ml-2 font-mono text-xs">{session.stripeChargeId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Created:</span>
                        <span className="ml-2 text-xs">{new Date(session.createdAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Updated:</span>
                        <span className="ml-2 text-xs">{new Date(session.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons for problematic sessions */}
                    {(session.status === 'PENDING' || session.status === 'ACTIVE') && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <Button 
                          size="sm"
                          onClick={() => manuallyEndBilling(session.streamSessionId, session.duration || 300)}
                          className="bg-red-600 hover:bg-red-700 text-xs"
                        >
                          Force End Billing
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDiagnostic;
