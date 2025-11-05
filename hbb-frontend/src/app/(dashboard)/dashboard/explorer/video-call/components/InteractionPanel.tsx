// dashboard/explorer/video-call/components/InteractionPanel.tsx - Enhanced with gift functionality
"use client";
import React, { useState } from 'react';

interface InteractionPanelProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  onGiftClick: () => void;
  showGiftPanel: boolean;
  onEndCall: () => void;
  isCallOngoing?: boolean;
}

export default function InteractionPanel({
  isMuted,
  onMuteToggle,
  onGiftClick,
  showGiftPanel,
  onEndCall,
  isCallOngoing = false
}: InteractionPanelProps) {
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEndCall = async () => {
    if (isEndingCall) return;
   
    console.log('🔚 InteractionPanel: End call clicked');
   
    setIsEndingCall(true);
   
    try {
      await onEndCall();
    } catch (error) {
      console.error('🔚 InteractionPanel: Error ending call:', error);
      setIsEndingCall(false);
    }
   
    // Reset after 5 seconds as fallback
    setTimeout(() => {
      setIsEndingCall(false);
    }, 5000);
  };

  const handleEndCallClick = () => {
    if (isCallOngoing) {
      // Show confirmation for active calls
      setShowConfirmation(true);
    } else {
      // End immediately for inactive calls
      handleEndCall();
    }
  };

  const confirmEndCall = () => {
    setShowConfirmation(false);
    handleEndCall();
  };

  const cancelEndCall = () => {
    setShowConfirmation(false);
  };

  // Get button configurations
  const getEndCallButtonConfig = () => {
    if (isEndingCall) {
      return {
        text: "Leaving...",
        color: "bg-gray-500",
        disabled: true
      };
    }
   
    return {
      text: "End Call",
      color: "bg-[#EB5656] hover:bg-[#D14B4B]",
      disabled: false
    };
  };

  const endCallConfig = getEndCallButtonConfig();

  return (
    <>
      <div className="w-full lg:w-auto absolute bottom-28 lg:bottom-12 2xl:bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 lg:gap-6 ml-4 lg:ml-0">
       
        {/* Gift Button */}
        <button
          onClick={onGiftClick}
          className={`h-10 w-10 lg:w-14 lg:h-14 flex items-center justify-center ${
            showGiftPanel ? "bg-[#6AB5D2]" : "bg-white"
          } rounded-full shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95`}
          aria-label="Send Gift"
          title="Send Gift"
        >
          <img
            src="/icons/call-gift.svg"
            alt="Gift"
            className="w-6 h-6 lg:w-8 lg:h-8"
          />
          {/* Gift indicator animation */}
          {showGiftPanel && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
          )}
        </button>

        {/* Mute/Unmute Button */}
        <button
          onClick={onMuteToggle}
          className={`${
            isMuted ? "bg-[#F2EE98]" : "bg-white"
          } h-10 w-10 lg:w-14 lg:h-14 flex items-center justify-center rounded-full shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95`}
          aria-label={isMuted ? "Unmute" : "Mute"}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          <img
            src={isMuted ? "/icons/call-muted.svg" : "/icons/call-unmuted.svg"}
            alt={isMuted ? "Unmute" : "Mute"}
            className="w-6 h-6 lg:w-8 lg:h-8"
          />
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCallClick}
          disabled={endCallConfig.disabled}
          className={`h-10 w-10 lg:w-14 lg:h-14 flex items-center justify-center ${endCallConfig.color} rounded-full shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          aria-label={endCallConfig.text}
          title={endCallConfig.text}
        >
          {isEndingCall ? (
            <div className="w-6 h-6 lg:w-8 lg:h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img
              src="/icons/call-cancel.svg"
              alt="End Call"
              className="w-6 h-6 lg:w-8 lg:h-8"
            />
          )}
        </button>

        {/* Status Indicator */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            isCallOngoing
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isCallOngoing ? 'bg-white animate-pulse' : 'bg-current'
            }`}></div>
            {isCallOngoing ? 'In Call' : 'Connected'}
          </div>
        </div>

        {/* Gift panel indicator */}
        {showGiftPanel && (
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 text-center">
            <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-bounce">
              🎁 Select a gift to send
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="text-2xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">End Call?</h3>
              <p className="text-gray-600 mb-6">
                This will end your video call with the influencer. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelEndCall}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndCall}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick tips overlay when gift panel is open */}
      {showGiftPanel && (
        <div className="absolute bottom-72 lg:bottom-80 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md">
          <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs text-center">
            <p className="mb-1">💡 <strong>Pro tip:</strong> Send gifts to show appreciation!</p>
            <p>Tap a gift to select, tap again to send</p>
          </div>
        </div>
      )}
    </>
  );
}