import React from "react";

// Skeleton component following shadcn pattern
const Skeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  );
};

const LiveCardSkeleton = () => {
  return (
    <div className="relative p-2 bg-gray-100 dark:bg-gray-900 rounded-[8px] h-[239px] lg:h-[314px] w-full shadow-custom-shadow-sm lg:shadow-custom-shadow-like overflow-hidden">
      {/* Background skeleton */}
      <Skeleton className="absolute inset-0 rounded-[8px]" />
      
      {/* Bottom content overlay skeleton */}
      <div className="absolute inset-x-0 bottom-1 z-10 flex justify-between items-center rounded-[8px] p-[1px] w-[97%] mx-auto">
        <div className="h-[60px] md:h-[45px] pl-2 flex flex-col justify-center rounded-[8px] w-[77%] bg-black/10 backdrop-blur-sm">
          {/* Username skeleton */}
          <Skeleton className="h-5 w-24 mb-2" />
          {/* Location skeleton */}
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="h-[60px] md:h-[45px] flex items-center justify-center rounded-[8px] w-[21%] bg-black/10 backdrop-blur-sm">
          {/* Live indicator skeleton */}
          <Skeleton className="h-[42px] w-[42px] rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Grid skeleton loader for multiple cards
export const LiveCardSkeletonGrid = ({ count = 10 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <LiveCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default LiveCardSkeleton;