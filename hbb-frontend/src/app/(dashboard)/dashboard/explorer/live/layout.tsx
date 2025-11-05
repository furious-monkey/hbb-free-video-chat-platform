// frontend/src/app/(dashboard)/dashboard/explorer/live/layout.tsx - Explorer live layout for handling live streaming
import DashboardBoardLayout from "@/src/components/DashboardBoardLayout";
import React from "react";
import CategoriesComponent from "./Categories";

const ExplorerLiveLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <CategoriesComponent />

      {children}

      <DashboardBoardLayout />
    </>
  );
};

export default ExplorerLiveLayout;
