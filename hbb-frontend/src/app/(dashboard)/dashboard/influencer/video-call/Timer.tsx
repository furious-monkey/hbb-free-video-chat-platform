// dashboard/influencer/video-call/Timer.tsx - Enhanced timer component
import React, { useMemo } from 'react';
import { Button } from "@/src/components/ui/button";
import Image from "next/image";

interface TimerProps {
  time: string;
  className?: string;
  maxTime?: number; // in seconds, for progress indication
  showProgress?: boolean;
  isLive?: boolean;
  earnings?: number;
}

export default function Timer({ 
  time, 
  className = '',
  maxTime = 1800, // 30 minutes default
  showProgress = false,
  isLive = true,
  earnings = 0
}: TimerProps) {
  
  // Parse time string to get seconds for progress calculation
  const timeInSeconds = useMemo(() => {
    const parts = time.split(':');
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }, [time]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!showProgress) return 0;
    return Math.min((timeInSeconds / maxTime) * 100, 100);
  }, [timeInSeconds, maxTime, showProgress]);

  // Determine timer color based on time elapsed
  const getTimerColor = () => {
    const percentElapsed = (timeInSeconds / maxTime) * 100;
    
    if (percentElapsed >= 90) return 'text-red-400';
    if (percentElapsed >= 75) return 'text-yellow-400';
    return 'text-white';
  };

  // Format earnings for display
  const formatEarnings = (amount: number) => {
    return amount.toLocaleString('en-US');
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
          </div>
          
          {/* Progress bar */}
          {showProgress && (
            <div className="mt-1 lg:mt-2">
              <div className="w-full bg-gray-700 bg-opacity-50 rounded-full h-1 lg:h-1.5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    progressPercentage >= 90 
                      ? 'bg-red-500' 
                      : progressPercentage >= 75 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0:00</span>
                <span>{Math.floor(maxTime / 60)}:00 max</span>
              </div>
            </div>
          )}
        </div>

        {/* Earnings Display (Optional) */}
        {earnings > 0 && (
          <div className="border-l border-white border-opacity-30 ml-3 pl-3 lg:ml-4 lg:pl-4">
            <div className="text-right">
              <p className="text-xs lg:text-sm text-gray-300">Earned</p>
              <p className="text-sm lg:text-lg font-semibold text-green-400">
                ${formatEarnings(earnings)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Time warnings */}
      {showProgress && (
        <>
          {/* 5 minutes remaining warning */}
          {timeInSeconds >= maxTime - 300 && timeInSeconds < maxTime && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-lg text-xs font-medium animate-pulse">
              ⚠️ 5 minutes remaining
            </div>
          )}
          
          {/* 1 minute remaining warning */}
          {timeInSeconds >= maxTime - 60 && timeInSeconds < maxTime && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-medium animate-pulse">
              🚨 1 minute remaining
            </div>
          )}
          
          {/* Time's up */}
          {timeInSeconds >= maxTime && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium animate-bounce">
              ⏰ Time's up!
            </div>
          )}
        </>
      )}
    </div>
  );
}