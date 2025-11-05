import Image from "next/image";
import React from "react";

interface IconTextProps {
  src: string;
  alt: string;
  text: string;
  showBorder?: boolean;
  isFirst?: boolean;
  showTimer?: boolean;
}

const IconText = ({
  src,
  alt,
  text,
  showBorder = false,
  isFirst = false,
  showTimer = false,
}: IconTextProps) => {
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
          />
        </div>
      )}
    </div>
  );
};

export default IconText;
