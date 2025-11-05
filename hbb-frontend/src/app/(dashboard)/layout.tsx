"use client";

import withAuth from "@/src/hooks/withAuth";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";

import React, { useCallback, useEffect, useState } from "react";
import { isNotEmpty } from "@/src/utils/functions";
import { Loader2 } from "lucide-react";
import LoadingState from "@/src/components/app-reusables/LoadingState";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [profileComplete, setProfileComplete] = useState(false);
  const [loadingProfileCheck, setLoadingProfileCheck] = useState(true);

  const { fetchUserDetails, userDetails, loading } = useUserStore(
    (state: any) => ({
      fetchUserDetails: state.fetchUserDetails,
      userDetails: state.userDetails,
      loading: state.loading,
    }),
    shallow
  );

  // Fetch user details with error handling
  const memoizedFetchUserDetails = useCallback(async () => {
    try {
      console.log("Fetching user details...");
      await fetchUserDetails();
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, [fetchUserDetails]);

  useEffect(() => {
    memoizedFetchUserDetails();
  }, [memoizedFetchUserDetails]);

  const pathname = usePathname();
  const isAgencySegment =
    pathname.includes("agency") && pathname.includes("account");

  useEffect(() => {
    if (userDetails) {
      const { profileImage } = userDetails;
      if (isNotEmpty(profileImage)) {
        setProfileComplete(true);
      } else {
        setProfileComplete(false);
      }
    }
    setLoadingProfileCheck(false);
  }, [userDetails]);

  if (loadingProfileCheck) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-pink">
        <LoadingState />
      </div>
    );
  }

  const isProfileRoute = pathname === "/dashboard/influencer/profile" ||  pathname === "/dashboard/explorer/profile" 
  const isVideoCallRoute = pathname === "/dashboard/influencer/video-call" ||  pathname === "/dashboard/explorer/video-call"
  // TODO: loader fix

  return (
    <div className="h-screen w-full splash-bg !overflow-hidden">
      <div className="h-full w-full flex flex-col lg:flex-row-reverse backdrop-blur bg-black/70 ">
        <div
          className={`w-full h-full flex-1 overflow-hidden relative ${
            !(isProfileRoute || isVideoCallRoute) && "px-2"
          }`}
        >
          <div 
          className={`${ !(isProfileRoute || isVideoCallRoute)  && "mt-20 lg:mt-28"}`}
          // className={`lg:mt-16`}
          >
            <div
              className={`w-full h-full overflow-hidden ${
                isAgencySegment
                  ? "rounded-t-3xl"
                  : `${!(isProfileRoute || isVideoCallRoute)  && "rounded-3xl"}`
              } 
               
                ${
                  !isAgencySegment && !profileComplete
                    ? "max-h-[70%] md:max-h-[100%]"
                    : ""
                }  overflow-hidden mx-auto ${
                !(isProfileRoute || isVideoCallRoute)  && "px-2 md:px-6"
              } bg-transparent`}
            >
              {children}
            </div>
          </div>
        </div>

        {/* {profileComplete && <Sidebar />} */}
      </div>
    </div>
  );
};

export default withAuth(DashboardLayout);
