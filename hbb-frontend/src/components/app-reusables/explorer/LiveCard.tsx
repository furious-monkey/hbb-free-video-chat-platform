import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import Image from "next/image";
import { IPublicInfluencer } from "@/src/types/influencer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
  item: IPublicInfluencer;
}

// Memoize the component to prevent unnecessary re-renders
const LiveCard = memo(({ item }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pre-calculate values to avoid re-computation
  const hasPromoVideo = item?.promotionalVideoDetails?.length > 0;
  const imageUrl = item?.profileImageDetails?.url || "/icons/no_img.svg";
  const username = item?.profile?.username || "unknown";
  const location = item?.profile?.location || "No confirmed location";
  const canJoin = item?.isOnline && item?.isLive && item?.streamInfo?.status !== "active";

  // Intersection observer for video auto-play
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isIntersecting = entry.isIntersecting;
    
    if (isIntersecting !== isInView) {
      setIsInView(isIntersecting);
    }
    
    if (!videoRef.current || !hasPromoVideo || !videoReady) return;
    
    if (isIntersecting) {
      // Use requestAnimationFrame for smoother playback
      requestAnimationFrame(() => {
        videoRef.current?.play().catch(() => {});
      });
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hasPromoVideo, videoReady, isInView]);

  // Setup intersection observer with cleanup
  useEffect(() => {
    if (!hasPromoVideo || !cardRef.current) return;

    // Reuse observer instance
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: "50px", // Start loading slightly before visible
        threshold: 0.5,
      });
    }

    const currentCard = cardRef.current;
    observerRef.current.observe(currentCard);

    return () => {
      if (observerRef.current && currentCard) {
        observerRef.current.unobserve(currentCard);
      }
    };
  }, [hasPromoVideo, handleIntersection]);

  // Handle video ready state
  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
    if (isInView && videoRef.current && !isHovered) {
      requestAnimationFrame(() => {
        videoRef.current?.play().catch(() => {});
      });
    }
  }, [isInView, isHovered]);

  // Optimized hover handlers
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = undefined;
    }
    
    setIsHovered(true);
    
    if (hasPromoVideo) {
      setShowImage(true);
      videoRef.current?.pause();
    }
  }, [hasPromoVideo]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    if (hasPromoVideo && isInView) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowImage(false);
        if (videoRef.current && videoReady && isInView) {
          requestAnimationFrame(() => {
            videoRef.current?.play().catch(() => {});
          });
        }
      }, 150);
    }
  }, [hasPromoVideo, isInView, videoReady]);

  // Video loop handler
  const handleVideoEnded = useCallback(() => {
    if (videoRef.current && isInView && !isHovered) {
      videoRef.current.currentTime = 0;
      requestAnimationFrame(() => {
        videoRef.current?.play().catch(() => {});
      });
    }
  }, [isInView, isHovered]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // Optimized modal handler
  const handleModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const currentParams = new URLSearchParams(searchParams?.toString());
    currentParams.set("modal", "influencer");
    currentParams.set("username", username);
    
    // Use replace instead of push for better performance
    router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
  }, [pathname, searchParams, username, router]);

  // Preload image for better performance
  useEffect(() => {
    if (imageUrl && imageUrl !== "/icons/no_img.svg") {
      const img = new window.Image();
      img.src = imageUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
    } else {
      setImageLoaded(true);
    }
  }, [imageUrl]);

  return (
    <div 
      ref={cardRef}
      className="relative p-2 rounded-[8px] h-[239px] lg:h-[314px] w-full shadow-custom-shadow-sm lg:shadow-custom-shadow-like overflow-hidden transition-transform duration-200 hover:scale-[1.01] cursor-pointer will-change-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleModal}
    >
      {/* Background container with GPU acceleration */}
      <div className="absolute inset-0 bg-black rounded-[8px] overflow-hidden transform-gpu">
        {/* Video element - plays by default */}
        {hasPromoVideo && (
          <div 
            className="absolute inset-0 transition-opacity duration-300"
            style={{ 
              opacity: showImage ? 0 : 1,
              willChange: 'opacity'
            }}
          >
            <video
              ref={videoRef}
              src={item.promotionalVideoDetails[0].url}
              muted
              loop
              playsInline
              disablePictureInPicture
              preload="metadata"
              className="w-full h-full object-cover"
              onCanPlay={handleVideoCanPlay}
              onEnded={handleVideoEnded}
              // Add poster for faster initial render
              poster={imageUrl}
            />
            <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
          </div>
        )}
        
        {/* Image element - use CSS instead of inline styles for better performance */}
        <div 
          className={`absolute inset-0 transition-all duration-300 bg-cover bg-center ${
            !hasPromoVideo || showImage ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-105' : 'scale-100'}`}
          style={{
            backgroundImage: imageLoaded ? `url(${imageUrl})` : undefined,
            willChange: 'transform, opacity'
          }}
        >
          {imageLoaded && <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>}
        </div>

        {/* Skeleton loader */}
        {!imageLoaded && (
          <div className="skeleton w-full h-full absolute inset-0"></div>
        )}
      </div>

      {/* Bottom content overlay - optimized with transform for GPU acceleration */}
      <div className={`absolute inset-x-0 bottom-1 z-10 explorer-livebtn-cover flex justify-between items-center rounded-[8px] p-[1px] w-[97%] mx-auto transition-all duration-200 transform-gpu ${
        isHovered ? 'backdrop-blur-sm bg-black/20' : ''
      }`}>
        <div className="h-[60px] explorer-livebtn md:h-[45px] pl-2 text-yellowbtn flex flex-col justify-center text-[11px] rounded-[8px] w-[77%]">
          <p className="font-[500] text-[14px] lg:text-xl capitalize">
            {username}
          </p>
          <p className="text-[10px] font-thin capitalize mb-1">
            {location}
          </p>
        </div>
        <div
          className={`h-[60px] cursor-pointer explorer-livebtn md:h-[45px] text-yellowbtn flex items-center justify-center rounded-[8px] w-[21%] transition-transform duration-200 ${
            isHovered ? 'scale-105' : ''
          }`}
        >
          <Image
            src={canJoin ? "/assests/dashboard/live.svg" : "/assests/dashboard/not-live.svg"}
            alt="live"
            width={42}
            height={42}
            className="!w-[48px] lg:h-[42px] lg:w-[42px]"
            priority={false}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.isOnline === nextProps.item?.isOnline &&
    prevProps.item?.isLive === nextProps.item?.isLive &&
    prevProps.item?.streamInfo?.status === nextProps.item?.streamInfo?.status
  );
});

LiveCard.displayName = 'LiveCard';

export default LiveCard;