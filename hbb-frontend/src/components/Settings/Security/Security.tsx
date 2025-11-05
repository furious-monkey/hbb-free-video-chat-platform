"use client";

import React, { useEffect, useState } from "react";
import Heading from "../Heading";
import Image from "next/image";
import Password from "./Password";
import Notification from "./Notification";
import Blocked from "./Blocked";
import { SecurityData } from "../index.types";
import { usePathname } from "next/navigation";

const Security = ({
  closeModal,
  screenWidth,
}: {
  closeModal: () => void;
  screenWidth: number;
}) => {
  const pathname = usePathname();
  const isModalRoute = pathname.includes("influencer");

  const [selectedContent, setSelectedContent] = useState<SecurityData | null>(
    null
  );

  const [openModal, setOpenModal] = useState(false);

  const handleSelect = (item: SecurityData) => {
    setSelectedContent(item);

    setOpenModal(true);
  };

  const handleGoBack = () => {
    setOpenModal(false);
  };

  const renderContent = () => {
    switch (selectedContent?.label) {
      case "password":
        return (
          <Password
            handleGoBack={handleGoBack}
            heading={selectedContent.heading}
          />
        );
      case "notification":
        return (
          <Notification
            handleGoBack={handleGoBack}
            heading={selectedContent.heading}
          />
        );
      case "blocked":
        return (
          <Blocked
            handleGoBack={handleGoBack}
            heading={selectedContent.heading}
          />
        );
      default:
        return null;
    }
  };

  const securityData: SecurityData[] = [
    {
      label: "password",
      heading: "Change password",
      body: "Change your password here at anytime",
    },
    {
      label: "notification",
      heading: "Notification",
      body: "Choose your notification preferences here",
    },
    ...(isModalRoute
      ? [
          {
            label: "blocked",
            heading: "Blocked",
            body: "Choose your notification preferences here",
          },
        ]
      : []),
  ];

  return (
    <div className="2xl:py-20 lg:py-14 py-5 lg:px-8 px-4 w-full h-full relative">
      <div className="w-full h-full overflow-y-auto no-scrollbar">
        <Heading
          onClick={closeModal}
          heading="Security"
          showIcon={screenWidth <= 1024}
        />

        <div className="mt-6 lg:mt-8 2xl:mt-10">
          <div className="flex-col flex gap-5 lg:gap-6">
            {securityData.map((data) => (
              <div
                key={data.label}
                onClick={() => {
                  handleSelect(data);
                }}
                className={`w-full flex justify-between items-center gap-20 cursor-pointer hover:bg-[#94E3FF30]`}
              >
                <div>
                  <p className="2xl:text-xl lg:text-lg capitalize">
                    {data.heading}
                  </p>
                  <p className="text-sm text-white/60">{data.body}</p>
                </div>

                <Image
                  src={"/assests/arrowRight.svg"}
                  alt={""}
                  width={24}
                  height={24}
                  className="w-5 h-5 2xl:w-6 2xl:h-6"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {openModal && (
        <div className="absolute top-0 left-0 right-0 w-full h-full bg-base2 overflow-hidden">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default Security;
