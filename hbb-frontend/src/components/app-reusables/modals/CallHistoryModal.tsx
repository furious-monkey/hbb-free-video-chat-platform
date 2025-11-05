"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallHistoryStore } from "@/src/store/callHistoryStore";
import { shallow } from "zustand/shallow";
import { LocationIcon } from "../../svgs";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Skeleton } from "../../ui/skeleton";

interface Gift {
  id: string;
  giftType: {
    name: string;
    imageUrl: string;
    price: number;
  };
  amount: number;
  createdAt: Date | string;
}

interface CallHistoryItem {
  id: string;
  streamSessionId: string;
  influencer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile: {
      username: string | null;
      location?: string | null;
    } | null;
  };
  explorer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    profile: {
      username: string | null;
      location?: string | null;
    } | null;
  } | null;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration?: number | null;
  earnings?: number | null;
  createdAt: Date | string;
  gifts?: Gift[];
}

interface Props {
  isOpen: boolean | undefined;
  isInfluencerView?: boolean;
}

const CallHistoryModal = ({ isOpen, isInfluencerView = false }: Props) => {
  const { getCallHistory, callHistory, loading } = useCallHistoryStore(
    (state: any) => ({
      getCallHistory: state.getCallHistory,
      callHistory: state.callHistory as CallHistoryItem[],
      loading: state.loading,
    }),
    shallow
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      getCallHistory();
    }
  }, [isOpen, getCallHistory]);

  const segment = pathname.split("/")[2];
  const isInfluencerSegment = segment === "influencer" || isInfluencerView;

  const openReportModal = (userId: string) => {
    router.push(`${pathname}?modal=report&userId=${userId}`);
  };

  const openGiftModal = (userId: string) => {
    router.push(`${pathname}?modal=gift&userId=${userId}`);
  };

  const formatDate = (dateString: Date | string) => {
    const date =
      typeof dateString === "string" ? parseISO(dateString) : dateString;
    return {
      day: format(date, "EEE"), // Short day name (Mon, Tue, etc.)
      date: format(date, "dd"), // Day of month
      fullDate: format(date, "MMM dd, yyyy"), // Full date (Jan 01, 2023)
      time: format(date, "h:mm a"), // Time (12:00 PM)
    };
  };

  const getDisplayName = (user: {
    firstName: string | null;
    lastName: string | null;
    profile: { username: string | null } | null;
  }) => {
    if (user.profile?.username) return user.profile.username;
    if (user.firstName || user.lastName)
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return "Anonymous";
  };

  const getLocation = (user: {
    profile: { location?: string | null } | null;
  }) => {
    return user.profile?.location || "Location not specified";
  };

  const getDuration = (start: Date | string, end?: Date | string | null) => {
    if (!end) return "Ongoing";
    const startDate = typeof start === "string" ? new Date(start) : start;
    const endDate = typeof end === "string" ? new Date(end) : end;
    const durationMs = endDate.getTime() - startDate.getTime();
    const minutes = Math.floor(durationMs / 60000);
    return `${minutes} min`;
  };

  // Skeleton loader for individual call history items
  const CallHistorySkeleton = () => (
    <div className="border-white/20 p-0 rounded-lg lg:rounded-2xl flex h-[115px] relative mb-2 mt-1 mr-1 ml-1">
      {/* Date Section Skeleton */}
      <div className="hidden md:flex flex-col items-center justify-center border-white/10 border w-[40px] h-full p-[8px] px-[32px] py-[6px] 2xl:py-[11px] gap-[2px] rounded-l-lg">
        <Skeleton className="w-8 h-4 bg-white/10" />
        <Skeleton className="w-8 h-4 bg-white/10" />
      </div>

      {/* Main Content Skeleton */}
      <div
        className="flex-grow flex flex-col ml-0 p-3 md:p-2 rounded-lg lg:rounded-2xl lg:rounded-l-none justify-center md:justify-normal"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      >
        {/* User Info Row Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
            <div>
              <Skeleton className="w-24 h-4 mb-1 bg-white/10" />
              <Skeleton className="w-20 h-3 bg-white/10" />
            </div>
          </div>

          {/* Mobile Date Skeleton */}
          <div className="flex md:hidden">
            <Skeleton className="w-16 h-6 rounded-lg bg-white/10" />
          </div>
        </div>

        {/* Divider */}
        <div
          className="border-t-[0.5px] w-full mt-2 mb-1"
          style={{ borderColor: "#CDCBDB" }}
        ></div>

        {/* Details Row Skeleton */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center space-x-4">
            <div>
              <Skeleton className="w-12 h-3 mb-1 bg-white/10" />
              <Skeleton className="w-16 h-4 bg-white/10" />
            </div>
            <div>
              <Skeleton className="w-12 h-3 mb-1 bg-white/10" />
              <Skeleton className="w-16 h-4 bg-white/10" />
            </div>
            {isInfluencerSegment && (
              <div>
                <Skeleton className="w-12 h-3 mb-1 bg-white/10" />
                <Skeleton className="w-16 h-4 bg-white/10" />
              </div>
            )}
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex space-x-2">
            {!isInfluencerSegment && (
              <Skeleton className="w-8 h-8 rounded bg-white/10" />
            )}
            <Skeleton className="w-16 h-6 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );

  console.log("Call History:", callHistory);

  return (
    <>
      {isOpen && (
        <div className="h-full">
          {/* Total Calls */}
          <div className="border-white/10 border py-2 px-4 rounded-lg mb-3 text-white">
            <p className="text-xs 2xl:text-base">Total calls</p>
            <div className="text-lg 2xl:text-2xl mt-2">
              {loading ? (
                <Skeleton className="w-12 h-7 bg-white/10" />
              ) : (
                callHistory.length
              )}
            </div>
          </div>

          {/* Call History List Container */}
          <div className="border-white/10 border p-1 rounded-lg space-y-1 2xl:p-4 h-[80%] flex flex-col">
            {loading ? (
              <div className="space-y-1 max-h-full overflow-y-auto no-scrollbar">
                {/* Show 3-4 skeleton items while loading */}
                {[...Array(4)].map((_, index) => (
                  <CallHistorySkeleton key={index} />
                ))}
              </div>
            ) : callHistory.length > 0 ? (
              <div className="space-y-1 max-h-full overflow-y-auto no-scrollbar">
                {callHistory.map((item) => {
                  const dateInfo = formatDate(item.startTime);
                  const otherUser = isInfluencerSegment
                    ? item.explorer
                    : item.influencer;
                  const earnings = isInfluencerSegment
                    ? item.earnings
                    : undefined;
                  const gifts = item.gifts || [];

                  return (
                    <div
                      key={item.id}
                      className="border-white/20 p-0 rounded-lg lg:rounded-2xl flex h-[115px] relative mb-2 mt-1 mr-1 ml-1"
                    >
                      {/* Date Section */}
                      <div className="hidden md:flex flex-col items-center justify-center border-white/10 border w-[40px] h-full p-[8px] px-[32px] py-[6px] 2xl:py-[11px] gap-[2px] rounded-l-lg">
                        <p className="text-sm 2xl:text-xl">{dateInfo.day}</p>
                        <p className="text-sm 2xl:text-xl">{dateInfo.date}</p>
                      </div>

                      {/* Main Content */}
                      <div
                        className="flex-grow flex flex-col ml-0 p-3 md:p-2 rounded-lg lg:rounded-2xl lg:rounded-l-none justify-center md:justify-normal"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                      >
                        {/* User Info Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <Image
                                src={
                                  otherUser?.profileImage || "/img/avatar.png"
                                }
                                alt="User"
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full"
                              />
                              {/* Gift indicator badge */}
                              {gifts.length > 0 && (
                                <div className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full w-4 h-4 flex items-center justify-center">
                                  <span className="text-[10px] text-black">
                                    🎁
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-white font-medium text-base 2xl:text-sm">
                                {otherUser
                                  ? getDisplayName(otherUser)
                                  : "Unknown User"}
                              </p>
                              <div className="flex items-center space-x-1">
                                <LocationIcon className="text-white w-3 h-3" />
                                <p className="text-white opacity-70 font-light text-[13px]">
                                  {otherUser
                                    ? getLocation(otherUser)
                                    : "Unknown location"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Date */}
                          <div className="flex md:hidden mr-1 px-4 py-1 rounded-lg bg-[#6AB5D2]">
                            <span className="text-[10px]">{`${dateInfo.day} ${dateInfo.date}`}</span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div
                          className="border-t-[0.5px] w-full mt-2 mb-1"
                          style={{ borderColor: "#CDCBDB" }}
                        ></div>

                        {/* Details Row */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-white opacity-70 text-xs">
                                Started
                              </p>
                              <p className="text-white text-sm">
                                {dateInfo.time}
                              </p>
                            </div>
                            <div>
                              <p className="text-white opacity-70 text-xs">
                                Duration
                              </p>
                              <p className="text-white text-sm">
                                {getDuration(item.startTime, item.endTime)}
                              </p>
                            </div>
                            {earnings !== undefined && (
                              <div>
                                <p className="text-white opacity-70 text-xs">
                                  Earnings
                                </p>
                                <p className="text-white text-sm">
                                  ${earnings?.toFixed(2) || "0.00"}
                                </p>
                              </div>
                            )}
                            {gifts.length > 0 && (
                              <div>
                                <p className="text-white opacity-70 text-xs">
                                  Gifts
                                </p>
                                <div className="flex space-x-1">
                                  {gifts.slice(0, 2).map((gift, index) => (
                                    <div key={index} className="relative">
                                      <Image
                                        src={gift.giftType.imageUrl}
                                        alt={gift.giftType.name}
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                      />
                                      {index === 1 && gifts.length > 2 && (
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center">
                                          <span className="text-[8px] text-black">
                                            +{gifts.length - 2}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            {!isInfluencerSegment && (
                              <button
                                className="cursor-pointer"
                                onClick={() =>
                                  otherUser && openGiftModal(otherUser.id)
                                }
                              >
                                <Image
                                  src="/img/gift 1.svg"
                                  alt="Send Gift"
                                  className="w-8 h-8"
                                  width={32}
                                  height={32}
                                />
                              </button>
                            )}
                            <button
                              className="text-white font-light text-xs border border-white rounded-full px-2 py-1 mt-0.5 mb-2"
                              onClick={() =>
                                otherUser && openReportModal(otherUser.id)
                              }
                            >
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Original Empty State
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 mb-4">
                    <Image
                      src="/img/no-calls.svg"
                      alt="No calls"
                      width={96}
                      height={96}
                    />
                  </div>
                  <p className="text-white text-lg mb-1">No calls made yet!</p>
                  <p className="text-white opacity-70 text-sm">
                    Your call history will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CallHistoryModal;