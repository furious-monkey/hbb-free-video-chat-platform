"use client";

import React, { useState } from "react";
import Image from "next/image";
import data from "@/src/constants/inbox";
import InboxCard from "../../../app-reusables/influencer/inbox/InboxCard";
import InboxCalender from "../../../app-reusables/influencer/inbox/InboxCalender";
import InboxDetails from "../../../app-reusables/influencer/inbox/InboxDetails";
import InboxProfileModal from "../../../app-reusables/influencer/inbox/InboxProfileModal";

const Inbox = () => {
  const [clickedItem, setClickedItem] = useState<any>(null);

  const handleItemClick = (item: any) => {
    setClickedItem(item);
  };

  const handleBackClick = () => {
    setClickedItem(null);
  };

  // Call modal
  const [isCalenderModalOpen, setIsCalenderModalOpen] = useState(false);
  const [calenderData, setCalenderData] = useState<any>(null);

  const openCalenderModal = (item: any) => {
    setIsCalenderModalOpen(true);
    setCalenderData(item);
  };

  const closeCalenderModal = () => setIsCalenderModalOpen(false);

  // Profile modal
  const [isProfile, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const openProfileModal = (item: any) => {
    setIsProfileOpen(true);
    setProfileData(item);
  };

  const closeProfileModal = () => setIsProfileOpen(false);

  return (
    <>
      {/* Call modal */}
      <InboxCalender
        isOpen={isCalenderModalOpen}
        item={calenderData}
        onClose={closeCalenderModal}
      />

      {/* Profile modal */}
      <InboxProfileModal
        openProfile={isProfile}
        clickedItem={profileData}
        onClose={closeProfileModal}
      />
      <main className="bg-pink relative md:h-[calc(100vh-100px)] flex md:flex-row flex-col items-center w-full overflow-auto rounded-2xl">
        <div className="md:w-[40%] w-full pl-5 pr-5 pb-7 pt-7 h-full md:border-r md:border-[#d6d6d68f] flex flex-col">
          {/* Search bar */}
          <div className="bg-white w-full h-10 rounded-full flex items-center pr-3 pl-3">
            <Image
              src="/assests/dashboard/Search.svg"
              alt="report"
              width={20}
              height={9}
            />
            <input
              type="text"
              className="text-black bg-transparent w-full outline-none text-[12px] ml-2"
              placeholder="Search..."
            />
          </div>

          {/* Inbox messages */}
          <div className="w-full">
            <div className="flex items-center justify-between mt-4 mb-4">
              <p className="text-[12px] cursor-pointer">All inbox</p>
              <p className="text-red text-[12px] cursor-pointer">Empty inbox</p>
            </div>

            <div className="flex flex-col overflow-auto h-[57dvh]">
              {data.length === 0 && (
                <p className="text-center">No inbox message</p>
              )}
              {data.length > 0 &&
                data.map((item: any) => (
                  <InboxCard
                    key={item.id}
                    item={item}
                    isClicked={item.id === clickedItem?.id}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
            </div>
          </div>
        </div>

        <InboxDetails
          clickedItem={clickedItem}
          openCalenderModal={() => openCalenderModal(clickedItem!)}
          openProfile={() => openProfileModal(clickedItem!)}
          goBack={handleBackClick}
        />

        <p className="text-[#ffffff90] text-[10px] absolute bottom-3 md:bottom-[15%] right-[3%]">
          24, March. 2024
        </p>
      </main>
    </>
  );
};

export default Inbox;
