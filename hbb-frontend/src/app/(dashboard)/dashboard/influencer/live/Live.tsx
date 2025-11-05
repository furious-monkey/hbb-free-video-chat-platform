// dashboard/influencer/live/Live.tsx - Live component for handling live streaming
"use client";

import React, { useEffect, useState, useRef } from "react";
import LiveRate from "./LiveRate";
import AllowBidsToggle from "./AllowBidsToggle";
import LiveApprove from "./LiveApprove";
import { UserDetailInterface } from "@/src/utils/interface";
import { shallow } from "zustand/shallow";
import { useUserStore } from "@/src/store/userStore";
import { usePathname, useRouter } from "next/navigation";
import { isEmpty } from "@/src/utils/functions";

const Live = () => {
  const [approveRate, setApproveRate] = useState(false);
  const [fetchedUserProfile, setFetchedUserProfile] =
    useState<UserDetailInterface>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.split("/")[2];

  useEffect(() => {
    const checkProfileDetailsAndRedirect = async () => {
      if (userDetails) {
        setFetchedUserProfile(userDetails);
        const { firstName, lastName, profileImage, phone } = userDetails;

        if (
          isEmpty(firstName) &&
          isEmpty(lastName) &&
          isEmpty(phone) &&
          isEmpty(profileImage)
        ) {
          try {
            await router.push(`/dashboard/${segment}/profile`);
          } catch (error) {
            console.error("Failed to redirect:", error);
          }
        }
      }
    };

    checkProfileDetailsAndRedirect();
  }, [userDetails]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageAspectRatio(img.naturalWidth / img.naturalHeight);
    setImageLoaded(true);
  };

  return (
    <>
      {/* {approveRate ? (
        <LiveApprove
          setApproveRate={setApproveRate}
          imageUrl={fetchedUserProfile?.profileImageDetails?.url || ""}
        />
      ) : (
        
      )} */}

<div
          style={{
            width: "100%",
            position: "relative",
          }}
          className="w-full h-[75vh] lg:h-[80vh] max-w-screen-xl mx-auto rounded-3xl overflow-hidden bg-black"
        >
          {/* Background Container */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {/* Desktop Reflection Layer */}
            <div className="hidden lg:block absolute inset-0 overflow-hidden">
              {imageLoaded && (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${fetchedUserProfile?.profileImageDetails?.url || ""})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'blur(20px) brightness(0.5)',
                    transform: 'scale(1.05)',
                    opacity: 0.6,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0) 100%)',
                  }}
                />
              )}
            </div>

            {/* Main Image Container - Completely Sharp */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                aspectRatio: imageAspectRatio,
                maxWidth: '100%',
                maxHeight: '100%',
                margin: 'auto',
              }}
            >
              <img
                ref={imageRef}
                src={fetchedUserProfile?.profileImageDetails?.url || ""}
                alt="Profile"
                className="w-full h-full object-contain lg:object-cover"
                style={{ 
                  display: imageLoaded ? 'block' : 'none',
                  objectFit: 'cover', // For mobile
                }}
                onLoad={handleImageLoad}
              />
            </div>

            {/* Skeleton Loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-neutral-700 animate-pulse" />
              </div>
            )}
          </div>

          {/* Desktop UI */}
          <div className="relative w-full h-full hidden lg:block">
            <div className="w-full h-full p-8 flex justify-end gap-3 items-center flex-col">
              {/* <AllowBidsToggle/> */}
              <LiveRate setApproveRate={setApproveRate} userId={userDetails?.id || ''} />
            </div>
          </div>

          {/* Optimized Mobile UI */}
          <div className="relative h-full w-full flex flex-col lg:hidden">
            {/* Mobile Image Area */}
            <div className="w-full flex-1 relative">
              {/* Mobile-specific image container */}
              <div className="absolute inset-0 flex items-center justify-center">
                {imageLoaded ? (
                  <img
                    src={fetchedUserProfile?.profileImageDetails?.url || ""}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 animate-pulse" />
                )}
              </div>
              
              {/* Mobile Controls */}
              {/* <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <AllowBidsToggle  />
              </div> */}
            </div>

            {/* Mobile Bottom Panel */}
            <div className="w-full bg-black bg-opacity-80 backdrop-blur-sm p-4 rounded-t-3xl">
              <LiveRate setApproveRate={setApproveRate} userId={userDetails?.id || ''} />
            </div>
          </div>
        </div>
    </>
  );
};

export default Live;