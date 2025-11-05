"use client";

import LiveCtaButtons from "@/src/components/LiveCtaButtons";
import LiveHeader from "@/src/components/LiveHeader";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/src/components/ui/input";
import CallerOffer from "./CallerOffer";

const Session = () => {
  const router = useRouter();

  const [offer, setOffer] = useState("");
  const [showOffer, setShowOffer] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOffer(e.target.value);
  };

  return (
    <div className="w-full h-full">
      <div className="hidden lg:flex w-full h-full">
        <div className="flex-[3.4] max-w-[1146px] h-full relative">
          <Image
            src={"/temp/live-video.webp"}
            alt={""}
            className="w-auto absolute rounded-3xl object-cover object-center"
            fill
            priority
          />

          <div className="absolute top-0 left-0 right-0 w-full h-full rounded-3xl flex justify-center items-end lg:pb-16 gap-5">
            <LiveCtaButtons
              onConfirm={() => setShowOffer(true)}
              onCancel={router.back}
            />
          </div>
        </div>

        <div className="flex-1 max-w-[316px] h-full 2xl:p-4 p-3">
          <div className="h-full w-full flex flex-col justify-between">
            <LiveHeader showTimer />

            {showOffer && (
              <CallerOffer
                offer={offer}
                handleInputChange={handleInputChange}
              />
            )}

            <Image
              src={"/temp/golive-mobile.webp"}
              alt={""}
              width={284}
              height={348}
              className="object-cover lg:h-[280px] 2xl:h-[348px] rounded-3xl"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-full lg:hidden flex flex-col gap-3">
        <div className="w-full flex-1 relative rounded-3xl">
          <Image
            src={"/temp/live-video.webp"}
            alt={""}
            className="w-auto absolute rounded-3xl object-cover object-center"
            fill
            priority
          />

          <div className="absolute top-0 left-0 right-0 w-full h-full">
            <div className="w-full h-full flex flex-col justify-between">
              <LiveHeader showTimer />

              <div className="p-4 flex justify-between items-end">
                <div className="flex gap-4">
                  <LiveCtaButtons
                    onConfirm={() => setShowOffer(true)}
                    onCancel={router.back}
                  />
                </div>

                <Image
                  src={"/temp/golive-mobile.webp"}
                  alt={""}
                  width={105}
                  height={144}
                  className="object-cover rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>

        {showOffer && (
          <div className="w-full">
            <CallerOffer offer={offer} handleInputChange={handleInputChange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Session;
