import React from "react";

const DashboardHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="absolute w-full lg:top-6 top-1 left-0 right-0 px-4 md:px-8 lg:px-8">
      <div className="w-full h-full">{children}</div>
    </div>
  );
};

export default DashboardHeader;
