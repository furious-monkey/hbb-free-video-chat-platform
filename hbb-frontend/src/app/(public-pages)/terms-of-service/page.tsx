"use client";

import TermsOfUse from "@/src/components/TermsOfUse";
import newTerms from "@/src/constants/termOfUse";
import Image from "next/image";
import React, { useState } from "react";
import { X } from "lucide-react";

const TermsOfUsePage = () => {
  const [selectedTermIndex, setSelectedTermIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [itemSelected, setItemSelected] = useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleModalClose = () => {
    startTransition(async () => {
      setOpenModal(!openModal);
    });
  };

  return (
    <div className="text-black h-full">
      <div className="w-full h-full px-4 lg:pb-14 lg:px-120px md:px-20 md:pb-12 ">
        <div className="h-full flex flex-col overflow-y-auto no-scrollbar lg:overflow-y-hidden">
          <div className="flex hidden mb-0 justify-center lg:justify-start w-full lg:w-[46%] items-center p-0 mt-0">
            <Image
              className="w-[140px] h-[140px] lg:w-[340px] lg:h-auto 2xl:w-[390px] 2xl:h-auto object-contain"
              width={91}
              height={91}
              src={"/assests/logo.svg"}
              alt="logo"
            />
          </div>
          <div className="mt-6 lg:mt-0 text-white overflow-hidden rounded-20">
            <div className="flex lg:flex-row flex-col justify-between h-full pb-[52px] lg:pb-0">
              <div className="w-full lg:w-[35%] lg:h-full h-[13vh]">
                <img
                  src="/assests/dashboard/dashboard-mob.png"
                  alt=""
                  className="w-full h-full object-cover bg-black lg:hidden"
                />
                <img
                  src="/assests/dashboard/dashboard.png"
                  alt=""
                  className="w-full h-full object-cover bg-black hidden lg:block"
                />
              </div>

              <div className="lg:block w-full lg:w-[80%]">
              <div className="bg-[#FFFFFF29] w-full lg:h-full h-[50vh] px-6 lg:pt-14 pt-5 pb-6 rounded-bl-20 rounded-br-20 lg:rounded-bl-none lg:rounded-br-none">
              <div className="overflow-y-hidden flex flex-col h-full">
                    <TermsOfUse
                      terms={newTerms}
                      selectedTermIndex={selectedTermIndex}
                    />
                    <p className="text-xs mt-6">Last updated: February 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* {openModal && (
        <div className="lg:hidden absolute bg-[#0000008F] top-0 left-0 right-0 bottom-0 w-full h-screen">
          <div className="px-4 py-[50px] h-full w-full">
            <div className="bg-background !h-[75vh] flex flex-col w-full rounded-20 p-5">
              <div className="flex justify-end mb-4">
                <div
                  onClick={handleModalClose}
                  className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" color="black" size={18} />
                </div>
              </div>

              <div className="overflow-y-hidden flex flex-col h-full text-white">
                <TermsOfUse
                  terms={terms}
                  selectedTermIndex={selectedTermIndex}
                />

                <p className="text-xs mt-6">Last updated: November 2024</p>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default TermsOfUsePage;
