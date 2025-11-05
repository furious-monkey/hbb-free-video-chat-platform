"use client";

import Image from "next/image";
import { Button } from "../ui/button";

interface Props {
  imageLink: string;
  message: string;
  isLive?: boolean;
  isLike?: boolean;
  isInbox?: boolean;
  mini_text?: string;
  width: number;
  height: number;
}

const EmptyState = ({
  imageLink,
  message,
  isLive,
  isLike,
  isInbox,
  mini_text,
  width,
  height,
}: Props) => {
  return (
    <div
      className={`${
        isInbox ? " mx-7" : "h-full"
      } w-full relative gap-5 !rounded-2xl flex flex-row justify-center items-center overflow-hidden bg-pink !h-[70vh]`}
    >
      <div className="w-full h-full flex justify-center items-center p-8 ">
        <div className="hidden md:absolute md:block md:inset-0 md:bg-[#ffffff] md:opacity-10 md:rounded-2xl w"></div>
        {/* <div className="relative h-full flex justify-center items-center w-full bg-white/[0.16] rounded-2xl"> */}
        <div className="relative h-full flex justify-center items-center w-full">
          <div className="flex flex-col b">
          <div
            className={`w-full h-full flex flex-col items-center mx-[auto]  rounded-3xl`}
          >
            <Image
              src={imageLink}
              alt="no live active"
              width={width}
              height={height}
              className="mx-auto"
            />

            <p className="flex text-lg 2xl:text-2xl justify-center mb-4 mt-12 2xl:mt-8 text-center">
              {message}
            </p>
            {isLive && (
              <p className=" 2xl:text-sm flex justify-center text-xs font-normal text-center">
                {mini_text}
              </p>
            )}
            {isLike && (
              <Button
                className={`w-[90%] mx-auto rounded-full font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 mt-7 bg-tertiary hover:bg-tertiaryHover text-black`}
              >
                Explore now
              </Button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
