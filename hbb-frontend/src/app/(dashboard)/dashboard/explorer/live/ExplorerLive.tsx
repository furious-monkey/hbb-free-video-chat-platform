"use client";
import React, { useEffect, useRef } from "react";
import EmptyState from "@/src/components/app-reusables/EmptyState";
import LoadingState from "@/src/components/app-reusables/LoadingState";
import LiveCard from "@/src/components/app-reusables/explorer/LiveCard";
import { useSearchParams } from "next/navigation";
import { useInfluencersWebSocket } from "@/src/hooks/useInfluencersWebSocket";
import { LiveCardSkeletonGrid } from "@/src/components/skeletons/LiveCardSkeleton";

const ITEMS_PER_PAGE = 10;

function ExplorerLive() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const categories = searchParams.get("categories")?.split(",") || [];
  const search_term = searchParams.get("q") || "";

  // Use the custom WebSocket hook
  const {
    influencers,
    paginationData,
    loading,
    error,
    loadMore,
  } = useInfluencersWebSocket({
    categories,
    searchTerm: search_term,
    limit: ITEMS_PER_PAGE,
    onlineOnly: false, // Show all influencers
    autoSubscribe: true,
  });

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!observerTarget.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && paginationData.hasNextPage) {
          loadMore();
        }
      },
      { threshold: 0.9, rootMargin: "0px 0px 100px 0px" }
    );

    observerRef.current.observe(observerTarget.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMore, loading, paginationData.hasNextPage]);

  // Show skeleton loading state on initial load
  if (loading && influencers.length === 0) {
    return (
      <div className="w-full h-[80vh] overflow-y-auto no-scrollbar outline-none">
        <div className="pb-80 md:pb-64 lg:pr-4">
          <LiveCardSkeletonGrid count={ITEMS_PER_PAGE} />
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full h-[80vh] bg-pink rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <p className="text-sm text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[80vh] overflow-y-auto no-scrollbar outline-none">
      <div className="pb-80 md:pb-64 lg:pr-4">
        {influencers.length ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-5 gap-4">
              {influencers.map((item) => (
                <LiveCard key={item.id} item={item} />
              ))}
            </div>
            
            {/* Show skeleton cards while loading more */}
            {loading && influencers.length > 0 && (
              <div className="mt-4">
                <LiveCardSkeletonGrid count={5} />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            imageLink="/assests/no_live.svg"
            message="No Influencers online right now"
            mini_text="Check back later to see who is live"
            width={290}
            height={322}
            isLive
          />
        )}

        <div ref={observerTarget} className="w-full h-10"></div>
      </div>
    </div>
  );
}

export default ExplorerLive;