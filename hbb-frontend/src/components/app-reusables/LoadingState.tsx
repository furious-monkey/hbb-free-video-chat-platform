"use client";

import Image from "next/image";

const LoadingState = () => {
  return (
    <div className="w-[128px] h-[128px] relative flex justify-center items-center">
      <div className="absolute rounded-[50%] w-[128px] h-[128px] border-4 border-white/[.12] border-solid"></div>
      <div className="w-[128px] h-[128px] absolute border-solid border-4 border-transparent border-t-white spinner rounded-[50%]"></div>
      <Image
        src="/assests/logo.svg" priority
        alt="no live active" className="absolute w:4/5 h-full h-auto p-6"
        width={172}
        height={222}
      />
    </div>
  );
};

export default LoadingState;
