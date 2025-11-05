// dashboard/test-bidding/page.tsx - Simple test page for bidding system
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";
import { useRouter } from "next/navigation";

const TestBiddingPage = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<string>("10");
  const [callRate, setCallRate] = useState<string>("2.00");
  const [allowBids, setAllowBids] = useState(true);
  const [currentBids, setCurrentBids] = useState<any[]>([]);
  const [acceptedBid, setAcceptedBid] = useState<any | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>("not_started");

  const router = useRouter();
  
  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  const webSocket = useWebSocket(userDetails?.id, {
    onSessionCreated: (data) => {
      console.log("✅ Session Created:", data);
      setSessionId(data.sessionId);
      setStreamStatus("live");
      toast.success(`Stream session ${data.sessionId} created!`);
    },
    onStreamJoined: (data) => {
      console.log("✅ Stream Joined:", data);
      toast.info(`User joined stream ${data.sessionId}`);
    },
    onSessionEnded: (data) => {
      console.log("✅ Session Ended:", data);
      setStreamStatus("ended");
      setAcceptedBid(null);
      setCurrentBids([]);
      toast.info(`Stream session ${data.sessionId} ended.`);
    },
    onBidPlaced: (data) => {
      console.log("✅ Bid Placed:", data);
      setCurrentBids((prev) => {
        const existing = prev.filter((b) => b.bidderId !== data.bidderId);
        return [...existing, data].sort((a, b) => b.amount - a.amount);
      });
      toast.info(`New bid: $${data.amount} from ${data.bidderName || data.bidderId.substring(0, 8)}`);
    },
    onBidAccepted: (data) => {
      console.log("✅ Bid Accepted:", data);
      setAcceptedBid(data);
      setCurrentBids([]);
      toast.success(`Bid $${data.amount} accepted!`);
      
      // Redirect both explorers and influencers to video call page
      setTimeout(() => {
        if (isExplorer) {
          router.push(`/dashboard/explorer/video-call?sessionId=${data.sessionId}`);
        } else if (isInfluencer) {
          router.push(`/dashboard/influencer/video-call?sessionId=${data.sessionId}`);
        }
      }, 2000);
    },
    onBidRejected: (data) => {
      console.log("✅ Bid Rejected:", data);
      setCurrentBids((prev) => prev.filter((b) => b.bidId !== data.bidId));
      toast.warning(`Bid $${data.amount} rejected.`);
    },
    onOutbid: (data) => {
      console.log("✅ Outbid:", data);
      toast.warning(`You were outbid! New highest: $${data.newHighestBid}`);
    },
    onError: (data) => {
      console.error("❌ WebSocket Error:", data);
      toast.error(`WebSocket Error: ${data.message}`);
    },
  });

  const handleCreateStream = async () => {
    if (!userDetails?.id) {
      toast.error("Please log in first");
      return;
    }
    
    try {
      const response = await webSocket.actions.createStream(allowBids, callRate);
      if (response.success && response.sessionId) {
        setSessionId(response.sessionId);
        setStreamStatus("live");
        toast.success(`Stream created: ${response.sessionId}`);
      } else {
        toast.error(`Failed to create stream: ${response.error}`);
      }
    } catch (error: any) {
      toast.error(`Error creating stream: ${error.message}`);
    }
  };

  const handleJoinStream = async () => {
    if (!sessionId) {
      toast.error("Please enter a session ID");
      return;
    }
    
    try {
      const response = await webSocket.actions.joinStream(sessionId);
      if (response.success) {
        toast.success(`Joined stream: ${sessionId}`);
        // Redirect to video call page
        router.push(`/dashboard/explorer/video-call?sessionId=${sessionId}`);
      } else {
        toast.error(`Failed to join stream: ${response.error}`);
      }
    } catch (error: any) {
      toast.error(`Error joining stream: ${error.message}`);
    }
  };

  const handlePlaceBid = async () => {
    if (!sessionId || !bidAmount) {
      toast.error("Session ID and bid amount are required");
      return;
    }
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    
    try {
      const response = await webSocket.actions.placeBid(sessionId, amount);
      if (response.success) {
        toast.success(`Bid of $${amount} placed.`);
      } else {
        toast.error(`Failed to place bid: ${response.error}`);
      }
    } catch (error: any) {
      toast.error(`Error placing bid: ${error.message}`);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      const response = await webSocket.actions.acceptBid(bidId);
      if (response.success) {
        toast.success(`Bid ${bidId.substring(0, 8)}... accepted.`);
      } else {
        toast.error(`Failed to accept bid: ${response.error}`);
      }
    } catch (error: any) {
      toast.error(`Error accepting bid: ${error.message}`);
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      const response = await webSocket.actions.rejectBid(bidId);
      if (response.success) {
        toast.warning(`Bid ${bidId.substring(0, 8)}... rejected.`);
      } else {
        toast.error(`Failed to reject bid: ${response.error}`);
      }
    } catch (error: any) {
      toast.error(`Error rejecting bid: ${error.message}`);
    }
  };

  const handleEndStream = async () => {
    if (!sessionId) {
      toast.error("No active stream to end");
      return;
    }
    
    try {
      const response = await webSocket.actions.endStream(sessionId);
      if (response.success) {
        toast.success(`Stream ended: ${sessionId}`);
        setStreamStatus("ended");
        setSessionId("");
        setAcceptedBid(null);
        setCurrentBids([]);
      } else {
        toast.error(`Failed to end stream: ${response.error}`);
      }
    } catch (error: any) {
      toast.error(`Error ending stream: ${error.message}`);
    }
  };

  const isInfluencer = userDetails?.userRole === "INFLUENCER";
  const isExplorer = userDetails?.userRole === "EXPLORER";

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Bidding System Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Info */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-xl">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User ID:</Label>
              <Input value={userDetails?.id || "Not logged in"} readOnly className="bg-gray-700 border-gray-600 text-gray-300" />
            </div>
            <div>
              <Label>User Role:</Label>
              <Input value={userDetails?.userRole || "Unknown"} readOnly className="bg-gray-700 border-gray-600 text-gray-300" />
            </div>
            <div>
              <Label>WebSocket Status:</Label>
              <Input 
                value={webSocket.isConnected ? "Connected" : "Disconnected"} 
                readOnly 
                className={`bg-gray-700 border-gray-600 ${webSocket.isConnected ? "text-green-300" : "text-red-300"}`} 
              />
            </div>
            <div>
              <Label>Stream Status:</Label>
              <Input value={streamStatus} readOnly className="bg-gray-700 border-gray-600 text-gray-300" />
            </div>
          </CardContent>
        </Card>

        {/* Stream Management */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-xl">Stream Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Session ID:</Label>
              <Input 
                value={sessionId} 
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID to join"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            
            {isInfluencer && (
              <>
                <div>
                  <Label>Call Rate (per minute):</Label>
                  <Input 
                    type="number"
                    value={callRate} 
                    onChange={(e) => setCallRate(e.target.value)}
                    placeholder="2.00"
                    className="bg-gray-700 border-gray-600"
                    disabled={streamStatus === "live"}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowBids"
                    checked={allowBids}
                    onChange={(e) => setAllowBids(e.target.checked)}
                    disabled={streamStatus === "live"}
                    className="rounded"
                  />
                  <Label htmlFor="allowBids">Allow Bids</Label>
                </div>
              </>
            )}

            <div className="flex space-x-2">
              {isInfluencer && streamStatus === "not_started" && (
                <Button onClick={handleCreateStream} className="bg-green-600 hover:bg-green-700">
                  Create Stream
                </Button>
              )}
              
              {isExplorer && sessionId && (
                <Button onClick={handleJoinStream} className="bg-blue-600 hover:bg-blue-700">
                  Join Stream
                </Button>
              )}
              
              {streamStatus === "live" && (
                <Button onClick={handleEndStream} className="bg-red-600 hover:bg-red-700">
                  End Stream
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bidding */}
        {streamStatus === "live" && (
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-xl">Bidding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isExplorer && (
                <div>
                  <Label>Bid Amount:</Label>
                  <Input 
                    type="number"
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="10.00"
                    className="bg-gray-700 border-gray-600"
                  />
                  <Button onClick={handlePlaceBid} className="w-full mt-2 bg-purple-600 hover:bg-purple-700">
                    Place Bid
                  </Button>
                </div>
              )}

              {isInfluencer && currentBids.length > 0 && (
                <div>
                  <Label>Current Bids ({currentBids.length}):</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {currentBids.map((bid) => (
                      <div key={bid.bidId} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
                        <span>
                          ${bid.amount.toFixed(2)} from {bid.bidderName || bid.bidderId.substring(0, 8)}...
                        </span>
                        <div className="space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptBid(bid.bidId)} 
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleRejectBid(bid.bidId)} 
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {acceptedBid && (
                <div className="p-3 bg-green-800 rounded-md">
                  <p className="font-semibold">Accepted Bid:</p>
                  <p>${acceptedBid.amount.toFixed(2)} from {acceptedBid.bidderName || acceptedBid.bidderId.substring(0, 8)}...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card className="bg-gray-800 border-gray-700 text-white mt-8">
        <CardHeader>
          <CardTitle className="text-xl">How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">For Influencers:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Set your call rate (e.g., $2.00/minute)</li>
                <li>Enable "Allow Bids"</li>
                <li>Click "Create Stream"</li>
                <li>Wait for bids to come in</li>
                <li>Accept or reject bids</li>
                <li>When bid is accepted, you'll be redirected to video call</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">For Explorers:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Get a session ID from an influencer</li>
                <li>Enter the session ID</li>
                <li>Click "Join Stream"</li>
                <li>Place bids with your desired amount</li>
                <li>Wait for bid acceptance</li>
                <li>When bid is accepted, you'll be redirected to video call</li>
              </ol>
            </div>
            
            <div className="p-4 bg-blue-900 rounded-md">
              <p className="font-semibold">💡 Tip:</p>
              <p>Open this page in two different browser windows/tabs - one as an influencer and one as an explorer to test the complete flow!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestBiddingPage;
