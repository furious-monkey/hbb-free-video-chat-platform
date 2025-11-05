"use client";

import TermsOfUse from "@/src/components/TermsOfUse";
import newPolicy from "@/src/constants/privacyPolicy";
import Image from "next/image";
import React, { useState } from "react";
import { X } from "lucide-react";

const PrivacyPolicyPage = () => {
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
      <div className="w-full h-full px-4 lg:pb-9 lg:px-120px md:px-20 md:pb-12 pb-8 ">
        <div className="h-full flex flex-col lg:overflow-y-hidden">
        <div className="flex hidden mb-0 justify-center lg:justify-start w-full lg:w-[46%] items-center p-0 mt-0">
          <Image
            className="w-[140px] h-[140px] lg:w-[340px] lg:h-auto 2xl:w-[390px] 2xl:h-auto object-contain"
            width={91}
            height={91}
            src={"/assests/logo.svg"}
            alt="logo"
          />
        </div>
          <div className="mt-6 lg:mt-0 flex-1 text-white overflow-hidden mb-5 rounded-20">
            <div className="flex lg:flex-row flex-col justify-between h-full">
              <div className="w-full lg:w-[35%] h-full overflow-hidden ">
              <div className="w-full lg:h-full h-[13vh]">
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
              </div>

              <div className="lg:block w-full lg:w-[80%]">
                <div className="bg-[#FFFFFF29] w-full lg:h-full h-[50vh] px-6 lg:pt-14 pt-5 pb-6 rounded-bl-20 rounded-br-20 lg:rounded-bl-none lg:rounded-br-none">
                  <div className="overflow-y-hidden flex flex-col h-full">
                    <TermsOfUse
                      terms={newPolicy}
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
    </div>
  );
};

export default PrivacyPolicyPage;
