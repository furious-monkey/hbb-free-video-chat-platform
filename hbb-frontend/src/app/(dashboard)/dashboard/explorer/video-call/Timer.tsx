// dashboard/explorer/video-call/Timer.tsx - Enhanced timer component for explorer
import React, { useMemo } from 'react';
import { Button } from "@/src/components/ui/button";
import Image from "next/image";

interface TimerProps {
  time: string;
  className?: string;
  callRate?: number; // per minute rate
  totalCost?: number;
  isLive?: boolean;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function Timer({
  time,
  className = '',
  callRate = 0,
  totalCost = 0,
  isLive = true,
  connectionQuality = 'good'
}: TimerProps) {
  // Parse time string to get seconds for cost calculation
  const timeInSeconds = useMemo(() => {
    const parts = time.split(':');
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }, [time]);

  // Calculate estimated cost based on time and rate
  const estimatedCost = useMemo(() => {
    if (!callRate) return 0;
    const minutes = timeInSeconds / 60;
    return minutes * callRate;
  }, [timeInSeconds, callRate]);

  // Determine timer color based on connection quality
  const getTimerColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-white';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  // Get connection quality indicator
  const getQualityIndicator = () => {
    switch (connectionQuality) {
      case 'excellent':
        return { icon: '🟢', label: 'Excellent' };
      case 'good':
        return { icon: '🟢', label: 'Good' };
      case 'fair':
        return { icon: '🟡', label: 'Fair' };
      case 'poor':
        return { icon: '🔴', label: 'Poor' };
      default:
        return { icon: '🟢', label: 'Good' };
    }
  };

  const qualityIndicator = getQualityIndicator();

  // Format cost for display
  const formatCost = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-lg px-3 lg:px-6 py-2 lg:py-3 rounded-2xl text-white shadow-lg border border-white border-opacity-20">
        
        {/* Timer Icon */}
        <div className="w-fit h-full flex items-center">
          <div className="flex items-center">
            <Button
              className="!h-[24px] lg:!h-[48px] !px-0 !w-[24px] lg:!w-[32px] border-none shadow-none flex justify-center items-center bg-transparent hover:bg-transparent"
            >
              <Image
                src="/icons/max-time.svg"
                alt="timer"
                width={32}
                height={32}
                className="w-[20px] h-[20px] lg:w-[28px] lg:h-[28px] 2xl:w-[32px] 2xl:h-[32px]"
              />
            </Button>
          </div>
        </div>

        {/* Time Display */}
        <div className="lg:flex-1 border-l border-white border-opacity-30 ml-2 pl-3 lg:ml-4 lg:pl-4">
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            {isLive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs lg:text-sm font-medium text-red-400 hidden lg:block">
                  LIVE
                </span>
              </div>
            )}
            
            {/* Timer */}
            <p className={`text-lg lg:text-xl 2xl:text-2xl font-mono font-semibold ${getTimerColor()}`}>
              {time}
            </p>

            {/* Connection quality indicator */}
            <div className="flex items-center gap-1 text-xs">
              <span>{qualityIndicator.icon}</span>
              <span className="hidden lg:inline text-gray-300">{qualityIndicator.label}</span>
            </div>
          </div>
          
          {/* Cost information */}
          {callRate > 0 && (
            <div className="mt-1 lg:mt-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Rate: ${callRate}/min</span>
                <span>Est. Cost: ${formatCost(estimatedCost)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Cost Display (if applicable) */}
        {totalCost > 0 && (
          <div className="border-l border-white border-opacity-30 ml-3 pl-3 lg:ml-4 lg:pl-4">
            <div className="text-right">
              <p className="text-xs lg:text-sm text-gray-300">Total Cost</p>
              <p className="text-sm lg:text-lg font-semibold text-blue-400">
                ${formatCost(totalCost)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Connection quality warnings */}
      {connectionQuality === 'poor' && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-medium animate-pulse">
          🚨 Poor connection - call quality affected
        </div>
      )}
      
      {connectionQuality === 'fair' && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-lg text-xs font-medium">
          ⚠️ Connection issues detected
        </div>
      )}

      {/* Cost warning for expensive calls */}
      {callRate > 50 && timeInSeconds > 300 && ( // More than $50/min and 5 minutes
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-medium">
          💰 High cost call - ${formatCost(estimatedCost)} so far
        </div>
      )}
    </div>
  );
}