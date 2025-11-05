import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";

const ExplorerLikeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout />
    </>
  );
};

export default ExplorerLikeLayout;
