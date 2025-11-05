"use client";

import Image from "next/image";
import { Button } from "../ui/button";

const ErrorState = () => {
  return (
    <div className="relative pr-3 md:pr-7 gap-5 h-full rounded-2xl flex flex-row justify-center overflow-hidden">
      <div className="hidden md:absolute md:block md:inset-0 md:bg-[#ffffff] md:opacity-10 md:rounded-2xl"></div>
      <div className="relative flex flex-col w-[20rem] mt-[2rem]">
        <div className="w-[172px] h-[222px] flex items-center mx-[auto]">
          <Image
            src="/assests/error.svg"
            alt="no live active"
            width={172}
            height={222}
          />
        </div>
        <p className="flex justify-center text-xl font-medium my-[20px]">
          "Oops! something went wrong"
        </p>
        <Button
          className={`w-[90%] mx-auto rounded-full font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 bg-tertiary hover:bg-tertiaryHover text-black`}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
