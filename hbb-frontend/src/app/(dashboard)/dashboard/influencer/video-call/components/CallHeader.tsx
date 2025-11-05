// dashboard/influencer/video-call/components/CallHeader.tsx - Enhanced call header component
import React, { useState, useEffect } from 'react';

interface CallHeaderProps {
  name: string;
  profileImage?: string;
  connectionStatus?: 'connecting' | 'connected' | 'poor' | 'disconnected';
  callQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  isRecording?: boolean;
  earnings?: number;
  onToggleRecording?: () => void;
}

export default function CallHeader({ 
  name, 
  profileImage,
  connectionStatus = 'connected',
  callQuality = 'good',
  isRecording = false,
  earnings = 0,
  onToggleRecording
}: CallHeaderProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [displayName, setDisplayName] = useState(name);

  // Update display name when name changes
  useEffect(() => {
    setDisplayName(name || 'Explorer');
  }, [name]);

  // Get connection status color and icon
  const getConnectionDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'text-green-400', icon: '🟢', label: 'Connected' };
      case 'connecting':
        return { color: 'text-yellow-400', icon: '🟡', label: 'Connecting...' };
      case 'poor':
        return { color: 'text-orange-400', icon: '🟠', label: 'Poor Connection' };
      case 'disconnected':
        return { color: 'text-red-400', icon: '🔴', label: 'Disconnected' };
      default:
        return { color: 'text-gray-400', icon: '⚪', label: 'Unknown' };
    }
  };

  // Get call quality display
  const getQualityDisplay = () => {
    switch (callQuality) {
      case 'excellent':
        return { bars: 4, color: 'text-green-400' };
      case 'good':
        return { bars: 3, color: 'text-green-400' };
      case 'fair':
        return { bars: 2, color: 'text-yellow-400' };
      case 'poor':
        return { bars: 1, color: 'text-red-400' };
      default:
        return { bars: 3, color: 'text-green-400' };
    }
  };

  const connectionDisplay = getConnectionDisplay();
  const qualityDisplay = getQualityDisplay();

  const formatEarnings = (amount: number) => {
    return amount.toLocaleString('en-US');
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="absolute top-4 lg:top-8 2xl:top-12 right-4 lg:right-12 2xl:right-24 z-30">
      <div 
        className="bg-black bg-opacity-80 backdrop-blur-lg rounded-xl text-white shadow-lg border border-white border-opacity-20 overflow-hidden transition-all duration-300 cursor-pointer"
        onClick={toggleDetails}
      >
        {/* Main Header */}
        <div className="flex items-center gap-3 px-4 lg:px-6 py-3">
          {/* Profile Image */}
          {profileImage && (
            <div className="relative">
              <img
                src={profileImage}
                alt={displayName}
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-white border-opacity-30"
                onError={(e) => {
                  e.currentTarget.src = "/img/hbb_user_logo.png";
                }}
              />
              {/* Connection status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-black ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                connectionStatus === 'poor' ? 'bg-orange-500' : 'bg-red-500'
              }`}></div>
            </div>
          )}

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm lg:text-lg font-semibold truncate">
                {displayName}
              </h3>
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded-full text-xs">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-medium">REC</span>
                </div>
              )}
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-1 text-xs">
              <span className={connectionDisplay.color}>{connectionDisplay.icon}</span>
              <span className={`${connectionDisplay.color} font-medium`}>
                {connectionDisplay.label}
              </span>
            </div>
          </div>

          {/* Signal Strength */}
          <div className="flex items-center gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-colors duration-300 ${
                  i < qualityDisplay.bars ? qualityDisplay.color : 'bg-gray-600'
                }`}
                style={{ height: `${8 + i * 2}px` }}
              ></div>
            ))}
          </div>

          {/* Expand/Collapse indicator */}
          <div className="text-gray-400">
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="border-t border-white border-opacity-20 px-4 lg:px-6 py-3 space-y-2">
            {/* Call Quality */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Call Quality:</span>
              <span className={`font-medium capitalize ${qualityDisplay.color}`}>
                {callQuality}
              </span>
            </div>

            {/* Earnings */}
            {earnings > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Earnings:</span>
                <span className="font-medium text-green-400">
                  ${formatEarnings(earnings)}
                </span>
              </div>
            )}

            {/* Recording Controls */}
            {onToggleRecording && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Recording:</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRecording();
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
              </div>
            )}

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-white bg-opacity-5 rounded">
                <div className="text-gray-400">Duration</div>
                <div className="font-medium">Live</div>
              </div>
              <div className="text-center p-2 bg-white bg-opacity-5 rounded">
                <div className="text-gray-400">Status</div>
                <div className={`font-medium ${connectionDisplay.color}`}>
                  {connectionStatus === 'connected' ? 'Active' : 'Issues'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions (when not expanded) */}
      {!showDetails && connectionStatus === 'poor' && (
        <div className="mt-2 bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-40 rounded-lg p-2 text-xs text-yellow-300">
          <div className="flex items-center gap-1">
            <span>⚠️</span>
            <span>Connection issues detected</span>
          </div>
        </div>
      )}

      {/* Disconnect warning */}
      {connectionStatus === 'disconnected' && (
        <div className="mt-2 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-40 rounded-lg p-2 text-xs text-red-300">
          <div className="flex items-center gap-1">
            <span>🚨</span>
            <span>Explorer disconnected</span>
          </div>
        </div>
      )}
    </div>
  );
}