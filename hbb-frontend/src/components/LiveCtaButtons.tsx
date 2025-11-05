import Image from "next/image";
import React from "react";

type LiveCtaButtonsProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

const LiveCtaButtons = ({ onConfirm, onCancel }: LiveCtaButtonsProps) => {
  return (
    <>
      <div onClick={onConfirm} className="w-fit h-fit cursor-pointer">
        <Image
          src={"/assests/mic.svg"}
          alt={""}
          width={68}
          height={68}
          className="2xl:h-[68px] 2xl:w-[68px] lg:h-[58px] lg:w-[58px] w-[52px] h-[52px]"
        />
      </div>

      <div onClick={onCancel} className="w-fit h-fit cursor-pointer">
        <Image
          src={"/assests/cancel-live.svg"}
          alt={""}
          width={68}
          height={68}
          className="2xl:h-[68px] 2xl:w-[68px] lg:h-[58px] lg:w-[58px] w-[52px] h-[52px]"
        />
      </div>
    </>
  );
};

export default LiveCtaButtons;
