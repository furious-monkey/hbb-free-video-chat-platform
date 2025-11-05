import React, { ReactNode } from "react";
import Heading from "../Heading";

const SecurityLayout = ({
  children,
  onClick,
  heading,
}: {
  children: ReactNode;
  onClick: () => void;
  heading: string;
}) => {
  return (
    <div className="2xl:py-20 lg:py-14 py-5 lg:px-8 px-4 w-full h-full relative">
      <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col">
        <Heading onClick={onClick} heading={heading} showIcon />

        <>{children}</>
      </div>
    </div>
  );
};

export default SecurityLayout;
