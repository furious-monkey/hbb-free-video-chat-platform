import React from "react";
import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";

const InfluencerLikesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout title="Benefits" />
    </>
  );
};

export default InfluencerLikesLayout;
