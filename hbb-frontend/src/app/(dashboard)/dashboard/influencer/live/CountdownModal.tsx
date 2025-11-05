// dashboard/influencer/live/CountdownModal.tsx - Countdown modal component for handling countdown modal
"use client";

import LiveCtaButtons from "@/src/components/LiveCtaButtons";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const CountdownModal = ({
  setOpenModal,
}: {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [counter, setCounter] = useState(10);

  const router = useRouter();
  const pathname = usePathname();

  const goToLive = () => {
    router.push(`${pathname}/session`);
  };

  useEffect(() => {
    if (counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect or handle after countdown finishes
      router.push(`${pathname}/session`);
    }
  }, [counter, pathname, router]);

  return (
    <div className="w-full h-full absolute top-0 left-0 right-0 border-none">
      <div className="w-full h-full">
        <div className="w-full h-full lg:pb-16 pb-4 2xl:pt-[124px] lg:pt-12 pt-12 lg:px-10 px-4 rounded-3xl flex flex-col justify-between items-center bg-black/70 backdrop-blur">
          <div className="w-full md:max-w-[311px] flex flex-col gap-4 2xl:gap-5">
            <div className="flex flex-col items-center justify-center">
              <div className="w-[72px] h-[72px] lg:w-20 lg:h-20 2xl:w-28 2xl:h-28 rounded-full bg-base2 lg:mb-4 mb-14"></div>
              <p className="font-medium 2xl:text-32px text-2xl">Sassy L, 24</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Image
                  src={"/assests/location-white.svg"}
                  alt={""}
                  width={20}
                  height={20}
                />
                <p className="font-light text-xs">Washington D.C</p>
              </div>
            </div>

            <span className="w-full h-[1px] bg-base1" />

            <div className="flex flex-col items-center justify-center">
              <p className="font-medium lg:text-lg 2xl:text-xl mb-4 lg:mb-0 2xl:mb-5">
                Joining live...
              </p>

              <p className="text-[#8FC0D3] font-medium text-[100px] 2xl:text-[200px]">
                {counter}
              </p>
            </div>
          </div>

          <div className="w-full flex justify-center items-center gap-4 lg:gap-5">
            <LiveCtaButtons
              onConfirm={goToLive}
              onCancel={() => setOpenModal(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownModal;
