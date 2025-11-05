// dashboard/influencer/video-call/components/BidAcceptedCountdown.tsx - Countdown after bid acceptance
"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface BidAcceptedCountdownProps {
  explorerName: string;
  explorerImage?: string;
  explorerLocation?: string;
  bidAmount: number;
  onCountdownComplete: () => void;
  onCancel?: () => void;
  initialCount?: number;
}

const BidAcceptedCountdown: React.FC<BidAcceptedCountdownProps> = ({
  explorerName,
  explorerImage,
  explorerLocation = "Unknown Location",
  bidAmount,
  onCountdownComplete,
  onCancel,
  initialCount = 10
}) => {
  const [counter, setCounter] = useState(initialCount);
  const [isActive, setIsActive] = useState(true);

  // Function to validate and sanitize image URL
  const getValidImageUrl = (imageUrl?: string): string => {
    const defaultImage = "/img/hbb_user_logo.png";
    
    if (!imageUrl) return defaultImage;
    
    // Check if it's a valid URL format
    try {
      // If it starts with http/https, return as is
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // If it starts with a slash, it's a relative path - return as is
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      
      // If it looks like a database ID (no slashes, no protocol), use default
      if (!imageUrl.includes('/') && !imageUrl.includes('.')) {
        console.warn(`Invalid image URL detected: ${imageUrl}. Using default image.`);
        return defaultImage;
      }
      
      // For other cases, try to construct a valid relative path
      return `/${imageUrl}`;
    } catch (error) {
      console.warn(`Error processing image URL: ${imageUrl}. Using default image.`, error);
      return defaultImage;
    }
  };

  const validImageUrl = getValidImageUrl(explorerImage);

  useEffect(() => {
    if (counter > 0 && isActive) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    } else if (counter === 0) {
      onCountdownComplete();
    }
  }, [counter, isActive, onCountdownComplete]);

  const handleCancel = () => {
    setIsActive(false);
    onCancel?.();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="w-full h-full bg-black/80 backdrop-blur-lg">
        <div className="w-full h-full lg:pb-16 pb-4 2xl:pt-[124px] lg:pt-12 pt-12 lg:px-10 px-4 flex flex-col justify-between items-center">
          
          {/* Top Section - Explorer Info */}
          <div className="w-full md:max-w-[400px] flex flex-col gap-4 2xl:gap-6">
            
            {/* Bid Accepted Badge */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span>Bid Accepted - ${bidAmount}</span>
              </div>
            </div>

            {/* Explorer Profile */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-[100px] h-[100px] lg:w-24 lg:h-24 2xl:w-32 2xl:h-32 rounded-full overflow-hidden border-4 border-green-400">
                  <Image
                    src={validImageUrl}
                    alt={explorerName}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/img/hbb_user_logo.png";
                    }}
                    priority
                  />
                </div>
                {/* Live indicator */}
                <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  JOINING
                </div>
              </div>

              <p className="font-medium 2xl:text-3xl text-2xl text-white text-center">
                {explorerName}
              </p>
              
              <div className="mt-2 flex items-center justify-center gap-1">
                <svg 
                  width={16} 
                  height={16} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={2} 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="opacity-75 text-gray-300"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <p className="font-light text-sm text-gray-300">
                  {explorerLocation}
                </p>
              </div>

              {/* Bid amount highlight */}
              <div className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg">
                <p className="text-sm font-medium">Winning Bid</p>
                <p className="text-xl font-bold">${bidAmount}</p>
              </div>
            </div>

            <span className="w-full h-[1px] bg-white bg-opacity-20" />

            {/* Countdown Section */}
            <div className="flex flex-col items-center justify-center">
              <p className="font-medium lg:text-xl 2xl:text-2xl mb-4 lg:mb-2 2xl:mb-6 text-white text-center">
                Starting video call...
              </p>

              <p className="text-[#8FC0D3] font-bold text-[120px] lg:text-[140px] 2xl:text-[200px] leading-none">
                {counter}
              </p>

              <p className="text-gray-300 text-sm mt-2 text-center max-w-md">
                Get ready! Your video call with {explorerName} will begin in {counter} second{counter !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Bottom Section - Actions */}
          <div className="w-full flex flex-col items-center gap-4">
            {/* Call preparation tips */}
            <div className="bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-40 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <span className="text-lg">💡</span>
                <span className="font-medium text-sm">Quick Tips</span>
              </div>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• Ensure good lighting and camera angle</li>
                <li>• Check your microphone is working</li>
                <li>• Be professional and engaging</li>
              </ul>
            </div>

            {/* Cancel option */}
            {onCancel && counter > 5 && (
              <button
                onClick={handleCancel}
                className="text-red-400 hover:text-red-300 text-sm underline transition-colors"
              >
                Cancel call (before countdown reaches 5)
              </button>
            )}

            {/* Connection status */}
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected and ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidAcceptedCountdown;