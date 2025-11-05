"use client";

import React, { useState } from "react";
import Heading from "./Heading";
import {
  SubscribeData,
  agencySubscribeData,
} from "@/src/schema/subscribe/index.data";
import SubscriptionCard from "../SubscriptionCard";
import { usePathname } from "next/navigation";

const Subscription = ({
  closeModal,
  screenWidth,
  heading,
  isAgencySegment,
}: {
  closeModal: () => void;
  screenWidth: number;
  heading: string;
  isAgencySegment: boolean;
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const subscriptionData = isAgencySegment
    ? agencySubscribeData
    : SubscribeData;

  return (
    <div className="2xl:py-20 lg:py-14 py-5 lg:px-8 px-4 w-full h-full relative">
      <div className="w-full h-full flex flex-col">
        <Heading
          onClick={closeModal}
          heading={heading}
          showIcon={screenWidth <= 1024}
        />

        <div className="flex-1 w-full overflow-y-auto no-scrollbar">
          <div className="mt-6 lg:mt-7">
            <p className="text-sm mb-5 lg:mb-8">
              Manage your {isAgencySegment ? "account" : "plan"}
            </p>

            <div className="pb-6 border-b border-white/60 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptionData.map((item, index) => (
                  <SubscriptionCard
                    key={index}
                    index={index}
                    item={item}
                    onClick={() => setSelectedIndex(index)}
                    selectedIndex={selectedIndex}
                    showPlanCta
                    isAgencyRoute={isAgencySegment}
                  />
                ))}
              </div>
            </div>

            <div className="">
              <p className="text-xl">Next payment date</p>
              <p className="text-sm text-white/60 mt-3">
                You are current on the free subscription
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
