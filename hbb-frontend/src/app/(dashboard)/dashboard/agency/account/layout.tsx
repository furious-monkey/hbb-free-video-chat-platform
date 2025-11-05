import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";

const AccountLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}

      <DashboardBoardLayout title="Account" />
    </>
  );
};

export default AccountLayout;
