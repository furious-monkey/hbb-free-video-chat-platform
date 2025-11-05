"use client";

import React, { useEffect, useState } from "react";
import { useEarningsStore } from "@/src/store/earningsStore";
import { shallow } from "zustand/shallow";
import { Button } from "../../ui/button";
import { CancelIcon, LocationIcon } from "../../svgs"; // Assuming LocationIcon is defined here
import Image from "next/image";
import { Skeleton } from "../../ui/skeleton";

interface Props {
  onClose: (value: boolean) => void;
  isOpen: boolean | undefined;
}

const EarningsModal = ({ isOpen, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<'all' | 'gifts' | 'video'>('all');
  
  const { 
    totalEarnings,
    earningsByType,
    recentEarnings, 
    summaryLoading,
    getEarningsSummary 
  } = useEarningsStore(
    (state: any) => ({
      totalEarnings: state.totalEarnings,
      earningsByType: state.earningsByType,
      recentEarnings: state.recentEarnings,
      summaryLoading: state.summaryLoading,
      getEarningsSummary: state.getEarningsSummary,
    }),
    shallow
  );

  // Fetch earnings when modal opens
  useEffect(() => {
    if (isOpen) {
      getEarningsSummary();
    }
  }, [isOpen, getEarningsSummary]);

  // trigger
  const handleToggleModal = () => {
    onClose(!isOpen); // Toggle the modal state
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Filter earnings based on active tab
  const filteredEarnings = recentEarnings.filter((item: any) => {

    console.log("Filtered Earnings:", item);
    if (activeTab === 'all') return true;
    if (activeTab === 'gifts') {
      return item.giftType !== 'BID_EARNINGS'
    }
    if (activeTab === 'video') {
      return item.giftType === 'BID_EARNINGS' 
    }
    return true;
  });

  // Get display amount based on active tab
  const getDisplayAmount = () => {
    if (activeTab === 'gifts') return earningsByType?.gifts || 0;
    if (activeTab === 'video') return earningsByType?.bids || 0;
    return totalEarnings;
  };

  // Get display text for earning type
  const getDisplayText = (item: any) => {
    // Check if it's a BID_EARNINGS type or Video call type
    if (item.type === 'BID_EARNINGS' || item.displayType === 'BID_EARNINGS' || 
        item.displayType === 'Video call' || item.type === 'Video call') {
      return 'Video chat';
    }
    return item.displayType || item.giftType || item.type;
  };

  // Skeleton loader for individual earning items
  const EarningSkeleton = () => (
    <div className="bg-[#FFFFFF0F] p-0 rounded-lg lg:rounded-2xl flex h-[115px] relative mb-2 mt-1 mr-1 ml-1">
      {/* Date Section Skeleton */}
      <div className="hidden md:flex flex-col items-center justify-center bg-[#6AB5D2]/20 w-[40px] h-full p-[8px] px-[32px] py-[6px] 2xl:py-[11px] gap-[2px] rounded-l-lg">
        <Skeleton className="w-8 h-4 bg-white/10" />
        <Skeleton className="w-8 h-4 bg-white/10" />
      </div>

      {/* Profile Picture and Details Skeleton */}
      <div 
        className="flex-grow flex flex-col ml-0 p-3 md:p-2 rounded-r-lg lg:rounded-r-2xl justify-center md:justify-normal"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
            <div>
              <Skeleton className="w-24 h-4 mb-1 bg-white/10" />
              <div className="flex items-center space-x-1">
                <Skeleton className="w-3 h-3 bg-white/10" />
                <Skeleton className="w-20 h-3 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Mobile Date Skeleton */}
          <div className="flex md:hidden">
            <Skeleton className="w-16 h-6 rounded-lg bg-white/10" />
          </div>
        </div>

        <div
          className="border-t w-full mt-2 mb-1"
          style={{ borderColor: "#F5CFDAA3" }}
        ></div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-8 h-8 rounded bg-white/10" />
            <Skeleton className="w-20 h-4 bg-white/10" />
          </div>
          <Skeleton className="w-16 h-4 bg-white/10" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <>
          {/* Total Earnings */}
          <div
            className="bg-[#8FD1E8] p-3 rounded-lg lg:rounded-2xl mb-3 text-white"
            style={{ backgroundColor: "#FFFFFF1F" }}
          >
            <p className="text-xs 2xl:text-base ">
              {activeTab === 'all' ? 'Total earnings' : 
               activeTab === 'gifts' ? 'Gift earnings' : 
               'Video chat earnings'}
            </p>
            <div className="text-lg 2xl:text-2xl mt-2">
              {summaryLoading ? (
                <Skeleton className="w-24 h-7 bg-white/10" />
              ) : (
                formatCurrency(getDisplayAmount())
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-custom-yellow hover:bg-destructive/90 rounded-full text-black' 
                  : 'bg-white/20 hover:bg-white/30 rounded-full text-white'
              }`}
              disabled={summaryLoading}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('gifts')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'gifts' 
                  ? 'bg-custom-yellow hover:bg-destructive/90 rounded-full text-black' 
                  : 'bg-white/20 hover:bg-white/30 rounded-full text-white'
              }`}
              disabled={summaryLoading}
            >
              Gifts
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'video' 
                  ? 'bg-custom-yellow hover:bg-destructive/90 rounded-full text-black' 
                  : 'bg-white/20 hover:bg-white/30 rounded-full text-white'
              }`}
              disabled={summaryLoading}
            >
              Video chat
            </button>
          </div>

          {/* Wrapper for Earnings List */}
          <div
            className="bg-[#8FD1E8] p-1 rounded-lg lg:rounded-2xl space-y-1 lg:p-2 h-[70%]"
            style={{ backgroundColor: "#FFFFFF1F" }}
          >
            {/* Earnings List */}
            <div className="space-y-1 max-h-full overflow-scroll no-scrollbar">
              {summaryLoading ? (
                // Skeleton loading state
                <>
                  {[...Array(4)].map((_, index) => (
                    <EarningSkeleton key={index} />
                  ))}
                </>
              ) : filteredEarnings.length === 0 ? (
                // Empty state
                <div className="flex items-center justify-center h-32">
                  <p className="text-white opacity-70">
                    {activeTab === 'all' ? 'No earnings yet' :
                     activeTab === 'gifts' ? 'No gift earnings yet' :
                     'No video chat earnings yet'}
                  </p>
                </div>
              ) : (
                filteredEarnings.map((item: any) => {
                  // Format the date
                  const date = new Date(item.createdAt);
                  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNum = date.getDate();
                  
                  return (
                  <div
                    key={item.id}
                    className="bg-[#FFFFFF0F] p-0 rounded-lg lg:rounded-2xl flex h-[115px] relative mb-2 mt-1 mr-1 ml-1"
                  >
                    {/* Date Section */}
                    <div className="hidden md:flex flex-col items-center justify-center bg-[#6AB5D2] w-[40px] h-full p-[8px] px-[32px] py-[6px] 2xl:py-[11px] gap-[2px] rounded-l-lg">
                      <p className="text-sm 2xl:text-xl ">{item.day}</p>
                      <p className="text-sm 2xl:text-xl ">{item.date}</p>
                    </div>

                    {/* Profile Picture and Details */}
                    <div 
                      className="flex-grow flex flex-col ml-0 p-3 md:p-2 rounded-r-lg lg:rounded-r-2xl justify-center md:justify-normal"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Image
                            src={item.profileImage || "/img/avatar.png"}
                            alt="User" width={100} height={100}
                            className="w-10 h-10 rounded-full"
                          />

                          <div>
                            <p className=" text-white font-medium text-base 2xl:text-sm">
                              {item.name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <LocationIcon className="text-white w-3 h-3" />
                              <p className=" text-white opacity-70 font-light text-[13px]">
                                {item.location}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex md:hidden mr-1 px-4 py-1 rounded-lg bg-[#6AB5D2]">
                          <span className="text-[10px] ">{`${item.day} ${item.date}`}</span>
                        </div>
                      </div>

                      <div
                        className="border-t w-full mt-2 mb-1"
                        style={{ borderColor: "#F5CFDAA3" }}
                      ></div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-2">
                          <Image
                            src={item.displayIcon || "/img/live 1.svg"}
                            alt="Video Chat"
                            className="w-8 h-8"
                            width={100}
                            height={100}
                          />
                          <p className=" text-white font-normal text-base">
                            {getDisplayText(item)}
                          </p>
                        </div>
                        <p className=" text-white font-normal text-sm 2xl:text-[15px]">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EarningsModal;