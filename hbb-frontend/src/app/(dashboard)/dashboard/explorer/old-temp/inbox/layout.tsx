import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";

const ExplorerInboxLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout />
    </>
  );
};

export default ExplorerInboxLayout;
