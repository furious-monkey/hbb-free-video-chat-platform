import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";

const ExplorerLiveLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout title="Discover" />
    </>
  );
};

export default ExplorerLiveLayout;
