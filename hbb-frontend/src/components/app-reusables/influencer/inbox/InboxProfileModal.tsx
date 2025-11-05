import React from "react";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { CancelIcon } from "@/src/components/svgs/index";

const InboxProfileModal = ({ clickedItem, onClose, openProfile }) => {
  if (!openProfile) {
    return null;
  }

  return (
    <div className="absolute w-full h-full top-0 left-0 z-50 inset-0 opacity-100 bg-[#00000099] backdrop-filter backdrop-blur-[6px] flex items-center justify-center">

        <div className="bg-white p-4 md:p-2 relative rounded-[15px] flex md:h-[36dvh] md:items-center w-[90%] md:w-[50%] mb-5 md:mb-0">
          {/* close button */}
          <Button
            className="bg-[#00000010] absolute right-0 top-0 m-3 p-1 h-6 w-6 rounded-[5px]"
            onClick={onClose}
          >
            <CancelIcon className="h-5" />
          </Button>

          <div className="w-[200px] h-[200px] bg-pink md:block hidden rounded-full"></div>

          <div className="w-[60%] ml-4">
          <div className="flex items-center">
            <div className="bg-base1 rounded-full w-[70px] h-[70px] md:hidden"></div>
            <div className="text-black ml-2 w-full">
              <p className="text-[15px] md:text-[17px] font-[500] mb-1">
                {clickedItem?.name},{" "}
                <span className="font-[100]">{clickedItem?.age}</span>
              </p>
              <p className="text-[10px] flex w-full font-[100] items-center pb-2 md:border-b md:border-[#00000010]">
                {" "}
                <Image
                  src="/assests/location-white.svg"
                  alt="report"
                  className="mr-[2px]"
                  width={17}
                  height={9}
                />
                {clickedItem?.location}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1">
              <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
                {clickedItem?.sign}
              </p>
              <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
                {clickedItem?.gender}
              </p>
            </div>
            <p className="text-[10px] font-[100] text-black mt-2 mb-2">My interest</p>

            <div className="flex border-b border-[#00000015] pb-2 font-[100] items-center gap-1 overflow-auto w-full  ">
              {clickedItem?.interests.map((interest, index) => (
                <p
                  key={index}
                  className="text-[10px] font-[100] text-white bg-base1 rounded-[15px] flex items-center justify-center h-6 pl-2 pr-2"
                >
                  {interest}
                </p>
              ))}
            </div>

            <div className="text-[10px] text-black font-[100] flex flex-col">
              <p>Bio</p>
              <p>{clickedItem?.bio}</p>
            </div>
          </div>
          </div>
        </div>
    </div>
  );
};

export default InboxProfileModal;
