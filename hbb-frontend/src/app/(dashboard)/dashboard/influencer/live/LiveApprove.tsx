// dashboard/influencer/live/LiveApprove.tsx - Live approve component for handling live approve, this is seen by influencer when they click on the live button
"use client";

import React, { useState } from "react";
import CountdownModal from "./CountdownModal";
import LiveCtaButtons from "@/src/components/LiveCtaButtons";
import LiveHeader from "@/src/components/LiveHeader";

const LiveApprove = ({
  setApproveRate,
  imageUrl,
}: {
  setApproveRate: React.Dispatch<React.SetStateAction<boolean>>;
  imageUrl: string;
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); // State to track image loading

  const openConfirmLiveModal = () => {
    setOpenModal(true);
  };

  return (
    <div className="w-full h-full">
      <div className="w-full h-full flex flex-col gap-3 lg:gap-0">
        <div className="lg:hidden">
          <LiveHeader />
        </div>

        <div className="w-full flex-1 relative">
          {/* Image and Skeleton Loader */}
          <img
            src={imageUrl}
            alt="Live Background"
            className="absolute inset-0 w-full h-full object-cover rounded-3xl lg:rounded-none"
            style={{ display: imageLoaded ? "block" : "none" }}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && <div className="skeleton w-full h-full rounded-3xl lg:rounded-none"></div>}

          {/* Overlay */}
          <div
            style={{
              backgroundColor: "#000",
              opacity: 0.2,
            }}
            className="absolute inset-0 rounded-3xl lg:rounded-none"
          ></div>

          <div className="relative w-full h-full flex flex-col justify-end lg:justify-between rounded-3xl lg:rounded-none lg:p-10 lg:pb-16 pt-0 pb-4">
            <div className="hidden lg:block lg:max-w-[210px] 2xl:max-w-[284px]">
              <LiveHeader />
            </div>

            <div className="w-full flex justify-center items-center gap-4 lg:gap-5">
              <LiveCtaButtons
                onConfirm={openConfirmLiveModal}
                onCancel={() => setApproveRate(false)}
              />
            </div>
          </div>

          {openModal && <CountdownModal setOpenModal={setOpenModal} />}
        </div>
      </div>
    </div>
  );
};

export default LiveApprove;
