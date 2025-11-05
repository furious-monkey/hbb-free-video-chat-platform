import Image from "next/image";
import React from "react";

const Heading = ({
  onClick,
  heading,
  showIcon = false,
}: {
  onClick: () => void;
  heading: string;
  showIcon?: boolean;
}) => {
  return (
    <div className="flex items-center gap-4">
      {showIcon && (
        <div className="w-fit h-fit cursor-pointer" onClick={onClick}>
          <Image
            src={"/assests/arrowLeft.svg"}
            alt={""}
            width={24}
            height={24}
            className="w-5 h-5 2xl:w-6 2xl:h-6"
          />
        </div>
      )}

      <p className="lg:text-2xl text-lg font-medium capitalize">{heading}</p>
    </div>
  );
};

export default Heading;
