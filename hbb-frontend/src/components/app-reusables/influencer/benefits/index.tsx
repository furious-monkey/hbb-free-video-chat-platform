"use client";

import React, { useState } from "react";
import Image from "next/image";
import { TbPencil } from "react-icons/tb";
import { IoIosArrowRoundForward } from "react-icons/io";
import { useModal } from "@/src/state/context/modal";
import BoostModal from "./BoostModal";

const Benefits = () => {

  const [editModal, setEditModal] = useState(false);

  return (
    <>
      <div
        className={`w-full md:w-full md:relative h-full bg-pink rounded-3xl overflow-y-auto  `}
      >
        <div className="flex flex-col w-full p-6">
          <div className="flex flex-col w-full bg-[#78486E] rounded-3xl p-8">
            <div className="flex flex-row border-b-2 border-[#A389B9] w-full pb-3">
              <p className="text-xl font-medium mr-4">Boost visibility</p>
              <p className="py-[8px] px-[12px] bg-[#855C85] text-xs rounded-md">
                Off
              </p>
            </div>
            <Image
              src="/assests/benefits_search.svg"
              alt="no live active"
              width={97}
              height={97}
              className="md:hidden block mt-3"
            />
            <div className="w-full md:w-[70%] mt-4">
              <p className="text-sm">
                You can increase your visibility on the live and explorer pages
                by making a payment. Charges are incurred only when an explorer
                clicks on your profile.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-between w-full">
              <div className="w-full md:w-[50%] flex flex-col">
                <div className="flex flex-row mt-6">
                  <div className="flex flex-row mr-6">
                    <Image
                      src="/assests/benefits_tick.svg"
                      alt="no live active"
                      width={20}
                      height={20}
                    />
                    <p className="text-sm ml-[4px]">2x</p>
                  </div>
                  <div className="flex flex-row mr-6">
                    <Image
                      src="/assests/benefits_tick.svg"
                      alt="no live active"
                      width={20}
                      height={20}
                    />
                    <p className="text-sm ml-[4px]">3x</p>
                  </div>
                  <div className="flex flex-row mr-6">
                    <Image
                      src="/assests/benefits_tick.svg"
                      alt="no live active"
                      width={20}
                      height={20}
                    />
                    <p className="text-sm ml-[4px]">5x</p>
                  </div>
                </div>

                <div
                  onClick={() => setEditModal(true)}
                  className="cursor-pointer mt-6 w-full md:w-[78px] h-[44px] flex flex-row items-center justify-center md:justify-between px-4 gap-2 py-2 rounded-lg text-[11px] border border-[#ffffff] text-[#ffffff] text-center"
                >
                  <p className="text-xs">Edit</p>
                  <TbPencil color="ffffff" className="w-4 h-4" />
                </div>
              </div>
              <Image
                src="/assests/benefits_search.svg"
                alt="no live active"
                width={154}
                height={154}
                className="md:block hidden"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full justify-between mt-6">
            <div className="flex flex-col w-full md:w-[49%] bg-[#78486E] rounded-3xl p-8 mb-6">
              <div className="flex flex-row border-b-2 border-[#A389B9] w-full pb-2">
                <p className="text-xl font-medium mr-4">Extend call time</p>
                <p className="py-[8px] px-[12px] bg-[#855C85] text-xs rounded-md">
                  Off
                </p>
              </div>
              <Image
                src="/assests/benefits_clock.svg"
                alt="no live active"
                width={97}
                height={97}
                className="mt-6 md:hidden block"
              />
              <div className="w-[100%] mt-4">
                <p className="text-sm">
                  You have the option to extend your call duration during live
                  calls by making a payment. Charges apply for specific
                  durations chosen by you.
                </p>
              </div>

              <div className="flex flex-row justify-between w-full">
                <div className="w-full flex flex-col">
                  <div className="flex flex-row mt-6">
                    <div className="flex flex-row mr-6">
                      <Image
                        src="/assests/benefits_tick.svg"
                        alt="no live active"
                        width={20}
                        height={20}
                      />
                      <p className="text-sm ml-[4px]">+30mins</p>
                    </div>
                    <div className="flex flex-row mr-6">
                      <Image
                        src="/assests/benefits_tick.svg"
                        alt="no live active"
                        width={20}
                        height={20}
                      />
                      <p className="text-sm ml-[4px]">+80mins</p>
                    </div>
                    <div className="flex flex-row mr-6">
                      <Image
                        src="/assests/benefits_tick.svg"
                        alt="no live active"
                        width={20}
                        height={20}
                      />
                      <p className="text-sm ml-[4px]">+2hours</p>
                    </div>
                  </div>

                  <div className="cursor-pointer mt-6 w-full md:w-[78px] h-[44px] flex flex-row items-center justify-center md:justify-between px-4 gap-2 py-2 rounded-lg text-[11px] border border-[#ffffff] text-[#ffffff] text-center">
                    <p className="text-xs">Edit</p>
                    <TbPencil color="ffffff" className="w-4 h-4" />
                  </div>
                </div>
                <Image
                  src="/assests/benefits_clock.svg"
                  alt="no live active"
                  width={124}
                  height={124}
                  className="mt-6 md:block hidden"
                />
              </div>
            </div>

            <div className="flex flex-col w-full md:w-[49%] bg-[#78486E] rounded-3xl p-8 mb-6">
              <div className="flex flex-row border-b-2 border-[#A389B9] w-full pb-3">
                <p className="text-xl font-medium mr-4">Refferals</p>
              </div>
              <Image
                src="/assests/benefits_alarm.svg"
                alt="no live active"
                width={97}
                height={97}
                className="mt-6 mb-4 md:hidden block "
              />
              <div className="w-[100%] mt-4">
                <p className="text-sm">
                  Refer friends and earn points for each model account created
                  using your unique referral code.
                </p>
              </div>

              <div className="flex flex-row justify-between w-full">
                <div className="w-full flex flex-col">
                  <div className="flex flex-row mt-6">
                    <div className="flex flex-row mr-6">
                      <p className="mr-2 py-[8px] px-[12px] bg-[#855C85] text-xs rounded-md">
                        #10401237808
                      </p>
                      <p className="py-[8px] px-[12px] bg-[#855C85] text-xs rounded-md">
                        <Image
                          src="/assests/benefits_shirt.svg"
                          alt="no live active"
                          width={14}
                          height={14}
                        />
                      </p>
                    </div>
                  </div>

                  <div className="cursor-pointer mt-12 w-full md:w-[7rem] h-[44px] flex flex-row items-center justify-center md:justify-between px-3  py-2 rounded-lg text-[11px] border border-[#ffffff] text-[#ffffff] text-center">
                    <p className="text-xs">Learn more</p>
                    <IoIosArrowRoundForward
                      color="ffffff"
                      className="w-4 h-4"
                    />
                  </div>
                </div>
                <Image
                  src="/assests/benefits_alarm.svg"
                  alt="no live active"
                  width={124}
                  height={124}
                  className="mt-6 md:block hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*  */}
      {editModal && <BoostModal editModal={editModal} setEditModal={setEditModal} />}
    </>
  );
};

export default Benefits;

