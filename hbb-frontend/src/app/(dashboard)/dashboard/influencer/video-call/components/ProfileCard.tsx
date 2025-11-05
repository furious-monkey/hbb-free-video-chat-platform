// dashboard/influencer/video-call/components/ProfileCard.tsx - Enhanced with live video stream
"use client";
import React, { useState, useRef, useEffect } from 'react';

interface ProfileCardProps {
  imageUrl: string;
  explorerName?: string;
  influencerName?: string;
  location?: string;
  earnings?: number;
  isMinimized?: boolean;
  onMinimizeToggle?: () => void;
  // NEW: Props for live video - show the person represented by this card
  isExplorer?: boolean;
  isInfluencer?: boolean;
  showLiveVideo?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>; // Reference to the video of the person this card represents
}

export default function ProfileCard({
  imageUrl,
  explorerName,
  influencerName,
  location,
  earnings,
  isMinimized = false,
  onMinimizeToggle,
  isExplorer = false,
  isInfluencer = false,
  showLiveVideo = true,
  videoRef
}: ProfileCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const cardVideoRef = useRef<HTMLVideoElement>(null);
  
  // Clone the video stream for the profile card (person represented by this card)
  useEffect(() => {
    if (showLiveVideo && videoRef?.current && cardVideoRef.current) {
      const cloneStream = () => {
        try {
          const originalVideo = videoRef.current;
          const profileVideo = cardVideoRef.current;
          
          if (originalVideo && originalVideo.srcObject && profileVideo) {
            // Clone the stream for the profile card
            const originalStream = originalVideo.srcObject as MediaStream;
            if (originalStream && originalStream.getTracks().length > 0) {
              // Create a new stream with cloned tracks
              const clonedTracks = originalStream.getTracks().map(track => track.clone());
              const clonedStream = new MediaStream(clonedTracks);
              
              profileVideo.srcObject = clonedStream;
              profileVideo.play().catch(error => {
                console.warn('Profile card video autoplay failed:', error);
                setVideoError(true);
              });
              
              console.log('✅ Profile card video stream cloned successfully');
            } else {
              setVideoError(true);
            }
          }
        } catch (error) {
          console.error('Error cloning video stream for profile card:', error);
          setVideoError(true);
        }
      };

      // Try to clone immediately
      cloneStream();
      
      // Also listen for when the original video loads
      const originalVideo = videoRef.current;
      if (originalVideo) {
        const handleLoadedData = () => cloneStream();
        originalVideo.addEventListener('loadeddata', handleLoadedData);
        
        return () => {
          originalVideo.removeEventListener('loadeddata', handleLoadedData);
        };
      }
    }
  }, [showLiveVideo, videoRef]);

  const handleImageError = () => {
    setImageError(true);
  };

  const getDisplayImage = () => {
    if (imageError) {
      return "/img/hbb_user_logo.png";
    }
    return imageUrl || "/img/hbb_user_logo.png";
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const formatEarnings = (amount?: number) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  // Get the appropriate name to display
  const getDisplayName = () => {
    if (isInfluencer && explorerName) {
      return explorerName;
    }
    if (isExplorer && influencerName) {
      return influencerName;
    }
    return explorerName || influencerName || 'User';
  };

  // Get the appropriate role label
  const getRoleLabel = () => {
    if (isInfluencer) return 'Explorer';
    if (isExplorer) return 'Influencer';
    return 'User';
  };

  if (isMinimized) {
    return (
      <div 
        className="absolute bottom-28 lg:bottom-12 2xl:bottom-20 right-4 lg:right-8 w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform"
        onClick={onMinimizeToggle}
      >
        {showLiveVideo && !videoError ? (
          <video
            ref={cardVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ backgroundColor: '#1a1a1a' }}
            onError={() => setVideoError(true)}
          />
        ) : (
          <img
            src={getDisplayImage()}
            alt={getRoleLabel()}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        )}
      </div>
    );
  }

  return (
    <div className="absolute bottom-28 lg:bottom-12 2xl:bottom-20 right-4 lg:right-8">
      <div 
        className="w-[105px] h-[144px] lg:w-[200px] lg:h-[280px] 2xl:w-[250px] 2xl:h-[320px] rounded-lg overflow-hidden shadow-lg border-2 border-white bg-black bg-opacity-20 backdrop-blur-sm cursor-pointer hover:shadow-xl transition-all duration-200"
        onClick={toggleDetails}
      >
        {/* Profile Video/Image */}
        <div className="relative w-full h-3/4">
          {showLiveVideo && !videoError ? (
            <>
              {/* Live video stream */}
              <video
                ref={cardVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ backgroundColor: '#1a1a1a' }}
                onError={() => setVideoError(true)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (cardVideoRef.current && cardVideoRef.current.paused) {
                    cardVideoRef.current.play().catch(console.warn);
                  }
                }}
              />
              
              {/* Live indicator */}
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>

              {/* Video quality indicator */}
              <div className="absolute top-2 right-2 bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                HD
              </div>
            </>
          ) : (
            <>
              {/* Fallback to static image */}
              <img
                src={getDisplayImage()}
                alt={`${getRoleLabel()} Profile`}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              
              {/* Static indicator */}
              <div className="absolute top-2 left-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                PHOTO
              </div>
            </>
          )}
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

          {/* Minimize button */}
          {onMinimizeToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMinimizeToggle();
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center transition-all z-10"
            >
              <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          )}
          
          {/* Name and role overlay */}
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white text-sm lg:text-base font-semibold truncate">
              {getDisplayName()}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-white text-xs opacity-90">
                {getRoleLabel()}
              </p>
              {location && (
                <p className="text-white text-xs opacity-90 flex items-center gap-1">
                  📍 {location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className={`w-full h-1/4 bg-black bg-opacity-80 text-white p-2 lg:p-3 transition-all duration-300 ${
          showDetails ? 'h-1/2' : 'h-1/4'
        }`}>
          {/* Always visible info */}
          <div className="flex justify-between items-center text-xs lg:text-sm">
            <div>
              <p className="text-gray-300">Status</p>
              <p className="font-semibold text-green-400">Connected</p>
            </div>
            <div className="text-right">
              <p className="text-gray-300">Connection</p>
              <p className="text-green-400 font-semibold flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Strong
              </p>
            </div>
          </div>

          {/* Expandable details */}
          {showDetails && (
            <div className="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-600 space-y-2">
              {/* Show earnings for influencer viewing explorer */}
              {isInfluencer && earnings !== undefined && (
                <div className="flex justify-between items-center text-xs lg:text-sm">
                  <span className="text-gray-300">Session Earning</span>
                  <span className="text-green-400 font-semibold">{formatEarnings(earnings)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-gray-300">Video Quality</span>
                <span className="text-green-400 font-semibold flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  {showLiveVideo && !videoError ? 'HD Live' : 'Photo'}
                </span>
              </div>

              {/* Audio indicator */}
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-gray-300">Audio</span>
                <span className="text-green-400 font-semibold flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Clear
                </span>
              </div>

              {/* Video controls */}
              {showLiveVideo && !videoError && (
                <div className="flex justify-between items-center text-xs lg:text-sm">
                  <span className="text-gray-300">Video</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cardVideoRef.current) {
                        if (cardVideoRef.current.paused) {
                          cardVideoRef.current.play().catch(console.warn);
                        } else {
                          cardVideoRef.current.pause();
                        }
                      }
                    }}
                    className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                  >
                    Play/Pause
                  </button>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-1 lg:gap-2 mt-2">
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded transition-colors">
                  Profile
                </button>
                <button className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded transition-colors">
                  Message
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expand/Collapse indicator */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <div className={`w-8 h-1 bg-white bg-opacity-50 rounded-full transition-transform duration-300 ${
            showDetails ? 'rotate-180' : ''
          }`}>
            <div className="w-full h-full bg-white rounded-full transition-all duration-300"></div>
          </div>
        </div>
      </div>

      {/* Connection quality indicator */}
      <div className="absolute -top-8 right-0 flex items-center gap-1">
        <div className="flex items-center gap-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-colors duration-300 ${
                showLiveVideo && !videoError ? 'bg-green-400' : 'bg-yellow-400'
              }`}
              style={{ height: `${8 + i * 2}px` }}
            ></div>
          ))}
        </div>
        <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          {showLiveVideo && !videoError ? 'LIVE' : 'PHOTO'}
        </span>
      </div>
    </div>
  );
}