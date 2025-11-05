// dashboard/influencer/video-call/components/InteractionPanel.tsx - Enhanced interaction controls
"use client";
import React, { useState } from 'react';

interface InteractionPanelProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  onEndCall: () => void;
  isCallOngoing?: boolean;
  hasExplorer?: boolean;
  sessionId?: string;
}

export default function InteractionPanel({
  isMuted,
  onMuteToggle,
  onEndCall,
  isCallOngoing = false,
  hasExplorer = false,
  sessionId
}: InteractionPanelProps) {
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEndCall = async () => {
    if (isEndingCall) return;
   
    console.log('🔚 InteractionPanel: End call clicked', {
      sessionId,
      isCallOngoing,
      hasExplorer
    });
   
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
    if (hasExplorer && isCallOngoing) {
      // Show confirmation for active calls
      setShowConfirmation(true);
    } else {
      // End immediately for inactive streams
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

  // Show different button states based on call status
  const getEndCallButtonConfig = () => {
    if (isEndingCall) {
      return {
        text: "Ending...",
        color: "bg-gray-500",
        disabled: true,
        icon: null
      };
    }
   
    if (hasExplorer) {
      return {
        text: "End Call",
        color: "bg-[#EB5656] hover:bg-[#D14B4B]",
        disabled: false,
        icon: "/icons/call-cancel.svg"
      };
    }
   
    return {
      text: "End Stream",
      color: "bg-[#EB5656] hover:bg-[#D14B4B]",
      disabled: false,
      icon: "/icons/call-cancel.svg"
    };
  };

  const endCallConfig = getEndCallButtonConfig();

  return (
    <>
      <div className="w-full lg:w-auto absolute bottom-28 lg:bottom-12 2xl:bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 lg:gap-6 ml-4 lg:ml-0">
       
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

        {/* End Call/Stream Button */}
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
              src={endCallConfig.icon || "/icons/call-cancel.svg"}
              alt="End Call"
              className="w-6 h-6 lg:w-8 lg:h-8"
            />
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="text-2xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">End Call?</h3>
              <p className="text-gray-600 mb-6">
                {hasExplorer 
                  ? "This will end your call with the current explorer. Are you sure?"
                  : "This will end your live stream. Are you sure?"
                }
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
                  End {hasExplorer ? 'Call' : 'Stream'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}