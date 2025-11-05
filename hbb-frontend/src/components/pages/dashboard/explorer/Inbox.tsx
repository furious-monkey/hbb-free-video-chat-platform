"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import data from "@/src/constants/inbox";
import InboxCard from "../../../app-reusables/explorer/inbox/InboxCard";
import InboxCalender from "../../../app-reusables/explorer/inbox/InboxCalender";
import InboxDetails from "../../../app-reusables/explorer/inbox/InboxDetails";
import InboxProfileModal from "../../../app-reusables/explorer/inbox/InboxProfileModal";
import EmptyStateInbox from "@/src/components/app-reusables/EmptyStateInbox";
import EmptyState from "@/src/components/app-reusables/EmptyState";
import { DataInboxInterface } from "@/src/utils/interface";

const Inbox = () => {
  const [clickedItem, setClickedItem] = useState<DataInboxInterface | null>(
    null
  );

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

  useEffect(() => {
    if (data?.length) {
      setClickedItem(data[0]);
    }
  }, [data]);

  return (
    <>
      <div className="bg-pink relative h-full flex lg:flex-row flex-col items-center w-full overflow-auto">
        <div className="lg:w-[40%] w-full pl-5 pr-5 pb-7 pt-7 h-full lg:border-r lg:border-[#d6d6d68f] flex flex-col">
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
              className="text-black bg-transparent w-full !border-none !outline-none text-[12px] ml-2"
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
              {/* {data.length === 0 && (
                
              )} */}
              {data.length > 0 ? (
                data.map((item: any) => (
                  <InboxCard
                    key={item.id}
                    item={item}
                    isClicked={item.id === clickedItem?.id}
                    onClick={() => handleItemClick(item)}
                  />
                ))
              ) : (
                <EmptyStateInbox
                  imageLink="/assests/no_inbox.svg"
                  message="No Conversation yet!"
                  mini_text='There are no conversations under "All messages"'
                />
              )}
            </div>
          </div>
        </div>

        {data.length > 0 ? (
          <>
            <InboxDetails
              clickedItem={clickedItem}
              openCalenderModal={() => openCalenderModal(clickedItem!)}
              openProfile={() => openProfileModal(clickedItem!)}
              goBack={handleBackClick}
            />

            <p className="text-[#ffffff90] text-[10px] hidden md:block absolute bottom-3 lg:bottom-[5%] right-[3%]">
              24, March. 2024
            </p>
          </>
        ) : (
          <EmptyState
            imageLink="/assests/no_text.svg"
            message="Your inbox is empty"
            width={150}
            height={150}
            isInbox
          />
        )}
      </div>

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
    </>
  );
};

export default Inbox;
