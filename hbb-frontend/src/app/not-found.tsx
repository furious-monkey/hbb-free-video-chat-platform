"use client"

import React from "react";
import { Button } from "../components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Error = () => {
  const router = useRouter();

  const backToHomePage = () => {
    router.push(`/`);
  };

  return (
    <div className="relative flex justify-center items-center bg-[#E688A3] min-h-screen h-screen py-12">
      <div className="relative bg-white/[0.16] w-[92%] max-w-[92%] h-full flex justify-center items-center mx-auto rounded-3xl">
        <div className="md:w-2/4 flex flex-col items-center justify-between">
         <Image
            src="/img/Group 1000004419.svg"
            alt="Empty state icon" width={292} height={342}
            className="w-[219px] h-[256px] md:w-[292px] lg:h-auto 2xl:w-[390px] 2xl:h-auto object-contain md:mb-16" priority
          />
          <div className="w-full absolute bottom-16 md:bottom-10 md:mt-10">
            <h1 className="md:text-[24px] text-lg font-medium text-white mb-2 text-center">
              404 | Not Found.
            </h1>
            <div className="flex justify-center mt-7 md:mt-10 w-[100%] mx-auto lg:max-w-[342px] mb-2">
              <Button
                className="w-3/4 opacity-1 px-5 py-3 text-black rounded-full font-normal text-sm shadow-[2px_2px_0px_2px_#000000] bg-tertiary hover:bg-tertiaryHover"
                onClick={backToHomePage}
                variant="yellow"
              >
                Back to home page
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error;