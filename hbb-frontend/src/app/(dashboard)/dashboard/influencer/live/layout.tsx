// dashboard/influencer/live/layout.tsx - Influencer live layout for handling live streaming
import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";

const InfluencerLiveLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout />
    </>
  );
};

export default InfluencerLiveLayout;
