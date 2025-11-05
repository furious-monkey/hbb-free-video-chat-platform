"use client";

import Modal from "@/src/components/app-reusables/Modal";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/src/components/ui/button";
import {
  button1GreenStyle,
  button2RedStyle,
} from "@/src/constants/buttonStyles";
import RoleCard from "@/src/components/RoleCard";

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [account, setAccount] = useState<string>("");
  const isDisabled = account === "";
  const router = useRouter();

  const handleInfluencerClick = () => {
    setAccount("influencer");
  };

  const handleExplorerClick = () => {
    setAccount("explorer");
  };

  const handleNextClick = () => {
    router.push(`/${account}/referral`);
  };

  return (
    <>
      <div className="mt-9 lg:mt-6 2xl:mt-14 text-center text-darkGray h-full px-1 md:px-4">
        <div className="h-full overflow-y-auto no-scrollbar">
          <p className="font-medium text-lg mb-8 lg:mb-8 2xl:mb-11">
            Are you an influencer or explorer?
          </p>

          <div
            className="grid grid-cols-2 gap-4 md:gap-8"
          >
            <RoleCard
              role="influencer"
              selected={account === "influencer"}
              onClick={handleInfluencerClick}
            />
            <RoleCard
              role="explorer"
              selected={account === "explorer"}
              onClick={handleExplorerClick}
            />
          </div>

          <div className="mt-8 lg:mt-5 2xl:mt-10 md:px-6 lg:px-0">
            {account && (
              <p>
                {account === "influencer"
                  ? "Get paid instantly on live video chats"
                  : "Video chat with influencers"}
              </p>
            )}
          </div>

          <div className="mt-2 lg:mt-7 2xl:mt-10 md:px-6 lg:px-0 mb-12 md:mb-20">
            <Button
              className={`w-full px-5 py-3 rounded-full lg:mt-2 mt-4 text-black text-sm h-10 ${
                isDisabled
                  ? "bg-lightgray cursor-not-allowed text-gray"
                  : "bg-tertiary hover:bg-tertiaryHover"
              }`}
              disabled={isDisabled}
              type="submit"
              onClick={handleNextClick}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

    </>
  );
};

export default Page;
