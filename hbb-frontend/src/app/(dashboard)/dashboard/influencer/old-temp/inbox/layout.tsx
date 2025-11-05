import React from "react";
import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";

const InfluencerLikesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout title="Inbox" />
    </>
  );
};

export default InfluencerLikesLayout;
