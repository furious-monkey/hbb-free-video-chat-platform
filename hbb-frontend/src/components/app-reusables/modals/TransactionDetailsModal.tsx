"use client";

import React from "react";

import { DownloadIcon } from "../../svgs/DownloadIcon";
import { Button } from "../../ui/button";
import { DateIcon } from "../../svgs/DateIcon";

interface Props {
  isOpen: boolean | undefined;
}

const TransactionDetailsModal = ({ isOpen }: Props) => {
  return (
    <>
      {isOpen && (
        <>
          <div className=" pb-20 lg:pb-0 relative h-full overflow-hidden">
            {/* Title and Date Picker */}

            <div className="border-b !border-[rgba(255,255,255,0.2)] pb-4 grid grid-cols-5 lg:grid-cols-3 mt-4">
              <div className="col-span-2 lg:col-span-1 flex items-center">
                <p className="text-[12px] font-medium leading-[1.3] text-white/60 font-space-grotesk">
                  Transaction ID
                </p>
              </div>
              <div className="col-span-3 lg:col-span-2 flex items-center">
                <p className="text-[#F1E499]">775403234</p>
              </div>
            </div>
            <div className="border-b !border-[rgba(255,255,255,0.2)] pb-4 grid grid-cols-5 lg:grid-cols-3 mt-4">
              <div className="col-span-2 lg:col-span-1 flex items-center">
                <p className="text-[12px] font-medium leading-[1.3] text-white/60 font-space-grotesk">
                  Date
                </p>
              </div>
              <div className="col-span-3 lg:col-span-2 flex items-center">
                <p className="text-white">24/03/2024</p>
              </div>
            </div>
            <div className="border-b !border-[rgba(255,255,255,0.2)] pb-4 grid grid-cols-5 lg:grid-cols-3 mt-4">
              <div className="col-span-2 lg:col-span-1 flex items-center">
                <p className="text-[12px] font-medium leading-[1.3] text-white/60 font-space-grotesk">
                  Payment Details
                </p>
              </div>
              <div className="col-span-3 lg:col-span-2 flex items-center">
                <p className="text-white">Inna Pinovich</p>
              </div>
            </div>
            <div className="border-b !border-[rgba(255,255,255,0.2)] pb-4 grid grid-cols-5 lg:grid-cols-3 mt-4">
              <div className="col-span-2 lg:col-span-1 flex items-center">
                <p className="text-[12px] font-medium leading-[1.3] text-white/60 font-space-grotesk">
                  Amount
                </p>
              </div>
              <div className="col-span-3 lg:col-span-2 flex items-center">
                <p className="text-white">+$20.00</p>
              </div>
            </div>

            <div className="flex justify-center items-center h-full pb-8 lg:pb-20">
              <Button className="w-full lg:w-max flex items-center gap-2 text-xs lg:!text-sm font-normal leading-[1.3] !text-[#F1E499] bg-transparent font-space-grotesk !h-8 hover:bg-white/10">
                <DownloadIcon />
                Download Invoice
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TransactionDetailsModal;
