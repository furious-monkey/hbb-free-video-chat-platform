import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";

const AgencySettingsLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout title="Settings" />
    </>
  );
};

export default AgencySettingsLayout;
