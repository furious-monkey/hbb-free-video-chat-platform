import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";

const AgencyInboxLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout title="Inbox" />
    </>
  );
};

export default AgencyInboxLayout;
