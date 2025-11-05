"use client";

import Image from "next/image";
import React, { useState } from "react";
import TimeDropdown from "./TimeDropdown";

interface LiveHeaderProps {
  src: string;
  alt: string;
  text: string;
  showBorder?: boolean;
  isFirst?: boolean;
  showTimer?: boolean;
}

const LiveHeader = ({ showTimer }: { showTimer?: boolean }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const IconText = ({
    src,
    alt,
    text,
    showBorder = false,
    isFirst = false,
    showTimer = false,
  }: LiveHeaderProps) => {
    return (
      <div
        className={`flex items-center lg:gap-4 gap-2 w-full relative ${
          showBorder
            ? "lg:pb-2 2xl:pb-4 pr-3 md:pr-4 lg:pr-0 lg:border-b lg:border-white/40 border-r lg:border-r-0 border-base2"
            : "lg:pt-2 2xl:pt-4 pl-3 md:pl-4 lg:pl-0"
        }`}
      >
        <div
          className={
            "h-8 lg:h-12 2xl:h-[68px] w-8 lg:w-12 2xl:w-[68px] rounded-full flex justify-center items-center bg-white"
          }
        >
          <Image
            src={src}
            alt={alt}
            width={40}
            height={40}
            className="w-8 h-8 2xl:w-10 2xl:h-10"
          />
        </div>
        <p className="lg:text-2xl 2xl:text-32px">{text}</p>

        {isFirst && showTimer && (
          <div className="w-fit absolute top-0 right-3 lg:top-0 lg:right-0 2xl:top-2 2xl:right-2">
            <Image
              src="/assests/timer.svg"
              alt="timer"
              width={32}
              height={32}
              className="w-4 h-4 lg:w-6 lg:h-6 2xl:w-8 2xl:h-8"
              onClick={toggleDropdown}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex lg:flex-col py-[10px] px-4 md:px-10 lg:px-[10px] 2xl:p-4 lg:bg-white/20 bg-white rounded-20 lg:rounded-xl text-black lg:text-white justify-between relative">
      <IconText
        src="/assests/active-live.svg"
        alt="live"
        text="60:00:00"
        showBorder={true}
        isFirst={true}
        showTimer={showTimer}
      />
      <IconText src="/assests/wallet.svg" alt="wallet" text="$ 0.00" />

      {showDropdown && (
        <div className="absolute top-14 lg:top-[60px] left-0 right-0 w-full bg-base2 rounded-2xl border border-black overflow-hidden">
          <TimeDropdown
            setShowDropdown={setShowDropdown}
            items={[
              { label: "+ 30 minutes", value: "30min", price: "$30" },
              { label: "+ 60 minutes", value: "60min", price: "$55" },
              { label: "+ 2 hours", value: "2hours", price: "$75" },
              { label: "+ 3 hours", value: "3hours", price: "$90" },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default LiveHeader;
