"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Account from "./Account";
import Security from "./Security/Security";
import Payment from "./Payment/Payment";
import Subscription from "./Subscription";
import { usePathname } from "next/navigation";
import AgencyAccount from "./AgencyAccount";

interface Props {
  settingsData: {
    label: string;
  }[];
}

const Settings = ({ settingsData }: Props) => {
  const [selectedContent, setSelectedContent] = useState("account");
  const [openModal, setOpenModal] = useState(false);

  const [screenWidth, setScreenWidth] = useState(0);

  const pathname = usePathname();
  const segment = pathname.split("/")[2];

  const isAgencySegment = segment === "agency";

  useEffect(() => {
    setScreenWidth(window.innerWidth);

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSelect = (label: string) => {
    setSelectedContent(label);

    if (screenWidth < 1024) {
      setOpenModal(true);
    }
  };

  const closeModal = () => {
    setOpenModal(false);
  };

  const renderContent = () => {
    switch (selectedContent) {
      case "security":
        return <Security closeModal={closeModal} screenWidth={screenWidth} />;
      case "payment":
        return <Payment closeModal={closeModal} screenWidth={screenWidth} />;
      case "subscription":
      case "membership":
        return (
          <Subscription
            closeModal={closeModal}
            screenWidth={screenWidth}
            heading={selectedContent}
            isAgencySegment={isAgencySegment}
          />
        );
      default:
        return isAgencySegment ? (
          <AgencyAccount closeModal={closeModal} screenWidth={screenWidth} />
        ) : (
          <Account closeModal={closeModal} screenWidth={screenWidth} />
        );
    }
  };

  return (
    <div className="bg-base2 w-full h-full flex relative overflow-hidden">
      <div className="lg:w-1/3 lg:max-w-[556px] w-full h-full lg:border-r border-[#D6D6D68F] 2xl:py-20 lg:py-14 px-4 lg:px-0 py-5">
        {settingsData.map((setting) => (
          <div
            key={setting.label}
            onClick={() => {
              handleSelect(setting.label);
            }}
            className={`w-full flex justify-between items-center px-6 py-4 capitalize cursor-pointer hover:bg-[#94E3FF30] ${
              selectedContent === setting.label
                ? "border-r-2 border-[#277B96] bg-[#94E3FF30]"
                : ""
            }`}
          >
            <p className="2xl:text-2xl lg:text-xl">{setting.label}</p>

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

      <div className="flex-1 h-full hidden lg:block">{renderContent()}</div>

      {openModal && (
        <div className="absolute w-full h-full lg:hidden bg-base2 overflow-hidden">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default Settings;
