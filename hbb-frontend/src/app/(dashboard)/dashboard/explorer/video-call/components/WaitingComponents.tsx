// dashboard/explorer/components/WaitingComponents.tsx - Components for waiting states
import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';

interface WaitingForBidResponseProps {
  bidAmount: number;
  influencerName: string;
  influencerImage?: string;
  timeElapsed?: number;
  onCancel?: () => void;
  onRetry?: () => void;
}

export const WaitingForBidResponse: React.FC<WaitingForBidResponseProps> = ({
  bidAmount,
  influencerName,
  influencerImage,
  timeElapsed = 0,
  onCancel,
  onRetry
}) => {
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(timeElapsed);

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getValidImageUrl = (imageUrl?: string): string => {
    const defaultImage = "/img/hbb_user_logo.png";
    
    if (!imageUrl) return defaultImage;
    
    try {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      if (!imageUrl.includes('/') && !imageUrl.includes('.')) {
        return defaultImage;
      }
      return `/${imageUrl}`;
    } catch (error) {
      return defaultImage;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="w-full h-full bg-black/80 backdrop-blur-lg">
        <div className="w-full h-full lg:pb-16 pb-4 2xl:pt-[124px] lg:pt-12 pt-12 lg:px-10 px-4 flex flex-col justify-between items-center">
          
          {/* Top Section - Bid Info */}
          <div className="w-full md:max-w-[400px] flex flex-col gap-4 2xl:gap-6">
            
            {/* Bid Status Badge */}
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500 text-black px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <span>Bid Pending - ${bidAmount}</span>
              </div>
            </div>

            {/* Influencer Profile */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-[100px] h-[100px] lg:w-24 lg:h-24 2xl:w-32 2xl:h-32 rounded-full overflow-hidden border-4 border-yellow-400">
                  <img
                    src={getValidImageUrl(influencerImage)}
                    alt={influencerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/img/hbb_user_logo.png";
                    }}
                  />
                </div>
                {/* Waiting indicator */}
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-semibold">
                  WAITING
                </div>
              </div>

              <p className="font-medium 2xl:text-3xl text-2xl text-white text-center">
                {influencerName}
              </p>
              
              {/* Bid info */}
              <div className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-4 py-2 rounded-lg">
                <p className="text-sm font-medium">Your Bid</p>
                <p className="text-xl font-bold">${bidAmount}</p>
              </div>
            </div>

            <span className="w-full h-[1px] bg-white bg-opacity-20" />

            {/* Waiting Section */}
            <div className="flex flex-col items-center justify-center">
              <p className="font-medium lg:text-xl 2xl:text-2xl mb-4 lg:mb-2 2xl:mb-6 text-white text-center">
                Waiting for response{dots}
              </p>

              <p className="text-[#8FC0D3] font-bold text-[60px] lg:text-[80px] 2xl:text-[120px] leading-none">
                {formatTime(elapsed)}
              </p>

              <p className="text-gray-300 text-sm mt-2 text-center max-w-md">
                {influencerName} will review your bid shortly. You'll be notified when they respond.
              </p>
            </div>
          </div>

          {/* Bottom Section - Actions */}
          <div className="w-full flex flex-col items-center gap-4">
            {/* Tips */}
            <div className="bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-40 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <span className="text-lg">💡</span>
                <span className="font-medium text-sm">While You Wait</span>
              </div>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• Check your camera and microphone settings</li>
                <li>• Ensure stable internet connection</li>
                <li>• Browse other live streams</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  Cancel Bid
                </Button>
              )}
              
              {onRetry && elapsed > 120 && ( // Show retry after 2 minutes
                <Button
                  onClick={onRetry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Increase Bid
                </Button>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Bid submitted and pending review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface JoiningCallProps {
  influencerName: string;
  influencerImage?: string;
  bidAmount?: number;
  onCancel?: () => void;
}

export const JoiningCall: React.FC<JoiningCallProps> = ({
  influencerName,
  influencerImage,
  bidAmount,
  onCancel
}) => {
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getValidImageUrl = (imageUrl?: string): string => {
    const defaultImage = "/img/hbb_user_logo.png";
    
    if (!imageUrl) return defaultImage;
    
    try {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      if (!imageUrl.includes('/') && !imageUrl.includes('.')) {
        return defaultImage;
      }
      return `/${imageUrl}`;
    } catch (error) {
      return defaultImage;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="w-full h-full bg-black/80 backdrop-blur-lg">
        <div className="w-full h-full flex flex-col justify-center items-center px-4">
          
          {/* Success Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>Bid Accepted!</span>
            </div>
          </div>

          {/* Influencer Profile */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative mb-6">
              <div className="w-[120px] h-[120px] lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-green-400">
                <img
                  src={getValidImageUrl(influencerImage)}
                  alt={influencerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/img/hbb_user_logo.png";
                  }}
                />
              </div>
              {/* Connecting indicator */}
              <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                CONNECTING
              </div>
            </div>

            <p className="font-medium text-3xl lg:text-4xl text-white text-center mb-2">
              {influencerName}
            </p>
            
            {bidAmount && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg">
                <p className="text-sm font-medium">Winning Bid</p>
                <p className="text-xl font-bold">${bidAmount}</p>
              </div>
            )}
          </div>

          {/* Connecting Section */}
          <div className="flex flex-col items-center justify-center mb-8">
            <p className="font-medium text-xl lg:text-2xl mb-4 text-white text-center">
              Joining video call{dots}
            </p>

            {/* Loading animation */}
            <div className="flex space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>

            <p className="text-gray-300 text-sm text-center max-w-md">
              Setting up your video connection. The call will begin momentarily...
            </p>
          </div>

          {/* Connection tips */}
          <div className="bg-green-500 bg-opacity-20 border border-green-500 border-opacity-40 rounded-lg p-4 max-w-md mb-6">
            <div className="flex items-center gap-2 text-green-300 mb-2">
              <span className="text-lg">🎥</span>
              <span className="font-medium text-sm">Get Ready</span>
            </div>
            <ul className="text-xs text-green-200 space-y-1">
              <li>• Your camera and microphone will activate</li>
              <li>• Make sure you're in good lighting</li>
              <li>• Be professional and respectful</li>
            </ul>
          </div>

          {/* Cancel option (usually not available at this stage) */}
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Cancel
            </Button>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-2 text-green-400 text-sm mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Establishing secure connection...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StreamUnavailableProps {
  reason: 'ended' | 'full' | 'private' | 'banned';
  influencerName?: string;
  message?: string;
  onGoBack?: () => void;
  onBrowseOthers?: () => void;
}

export const StreamUnavailable: React.FC<StreamUnavailableProps> = ({
  reason,
  influencerName,
  message,
  onGoBack,
  onBrowseOthers
}) => {
  const getReasonConfig = () => {
    switch (reason) {
      case 'ended':
        return {
          icon: '📹',
          title: 'Stream Ended',
          defaultMessage: `${influencerName || 'The influencer'}'s stream has ended`,
          color: 'text-yellow-400'
        };
      case 'full':
        return {
          icon: '👥',
          title: 'Stream Full',
          defaultMessage: `${influencerName || 'This'} stream is currently at capacity`,
          color: 'text-orange-400'
        };
      case 'private':
        return {
          icon: '🔒',
          title: 'Private Stream',
          defaultMessage: 'This stream is private and requires special access',
          color: 'text-blue-400'
        };
      case 'banned':
        return {
          icon: '🚫',
          title: 'Access Denied',
          defaultMessage: 'You do not have permission to join this stream',
          color: 'text-red-400'
        };
      default:
        return {
          icon: '❓',
          title: 'Unavailable',
          defaultMessage: 'This stream is not available',
          color: 'text-gray-400'
        };
    }
  };

  const config = getReasonConfig();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="w-full h-full bg-black/80 backdrop-blur-lg flex items-center justify-center">
        <div className="max-w-md mx-4 text-center text-white">
          
          {/* Icon */}
          <div className="text-6xl mb-6">
            {config.icon}
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-semibold mb-4 ${config.color}`}>
            {config.title}
          </h2>

          {/* Message */}
          <p className="text-gray-300 mb-8">
            {message || config.defaultMessage}
          </p>

          {/* Suggestions based on reason */}
          {reason === 'ended' && (
            <div className="bg-gray-500 bg-opacity-20 border border-gray-500 border-opacity-40 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">
                This stream has concluded. You can browse other live streams or follow this influencer for future notifications.
              </p>
            </div>
          )}

          {reason === 'full' && (
            <div className="bg-orange-500 bg-opacity-20 border border-orange-500 border-opacity-40 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-200">
                This stream has reached its viewer limit. Try again later or explore other available streams.
              </p>
            </div>
          )}

          {reason === 'private' && (
            <div className="bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-40 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-200">
                Contact the influencer directly for access to their private stream.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onGoBack && (
              <Button
                onClick={onGoBack}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                Go Back
              </Button>
            )}
            
            {onBrowseOthers && (
              <Button
                onClick={onBrowseOthers}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse Other Streams
              </Button>
            )}
          </div>

          {/* Additional help */}
          <p className="text-xs text-gray-500 mt-6">
            Need help? Contact support for assistance with stream access.
          </p>
        </div>
      </div>
    </div>
  );
};