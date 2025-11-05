"use client";

import React, { useEffect, useState } from "react";
import data from "../../../constants/likes";
import { Button } from "@/src/components/ui/button";
import ReportModal from "./likes/reportModal";
import formatNumber from "./likes/formatNumber";
import { X } from "lucide-react";
import Image from "next/image";
import { LikedProfilesInterface } from "@/src/utils/interface";
import { useProfileStore } from "@/src/store/profileStore";
import { shallow } from "zustand/shallow";
import { IoLocationOutline } from "react-icons/io5";
import { useInfluencerStore } from "@/src/store/influencerStore";
import EmptyState from "../EmptyState";

const Likes = () => {
  const removeLike = () => {
    console.log("removed");
  };
  const [fetchedUserProfileLikes, setFetchedUserProfileLikes] = useState<
    LikedProfilesInterface[] | null
  >(null);
  const [selectedItem, setSelectedItem] =
    useState<LikedProfilesInterface | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const infoOpen = true;

  const { getInfluencersLikes, likesFromExplorers, loading } =
    useInfluencerStore(
      (state: any) => ({
        getInfluencersLikes: state.getInfluencersLikes,
        likesFromExplorers: state.likesFromExplorers,
        loading: state.loading,
      }),
      shallow
    );

  useEffect(() => {
    getInfluencersLikes();
  }, []);

  useEffect(() => {
    if (likesFromExplorers?.length) {
      setFetchedUserProfileLikes(likesFromExplorers);
    }
  }, [likesFromExplorers]);

  useEffect(() => {
    if (fetchedUserProfileLikes?.length) {
      setSelectedItem(fetchedUserProfileLikes[0]);
    }
  }, [fetchedUserProfileLikes]);

  const openReportModal = (item) => {
    setIsReportModalOpen(true);
    setReportData(item);
  };
  const closeReportModal = () => setIsReportModalOpen(false);

  const openInfo = (item: LikedProfilesInterface) => {
    setSelectedItem(item);
  };

  const closeInfo = () => {
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-pink flex flex-col items-center justify-center bg-pink-100 text-pink-800">
        <p className="text-lg font-semibold">loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* report modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        item={reportData}
        onClose={closeReportModal}
      />
      <div
        className={`w-full md:w-full md:relative md:h-full bg-pink rounded-3xl`}
      >
        <div
          className={`flex flex-col h-full md:w-[full] w-full pt-5 md:pt-7 pl-4 md:pl-7 pr-4 md:pr-7`}
        >
          {/* display number of likes and convert to k if above a thousand */}
          <p className="mb-2 ml-1 font-[500] text-[20px]">
            {formatNumber(fetchedUserProfileLikes?.length)}
            <span className="font-[100]">
              {fetchedUserProfileLikes?.length &&
              fetchedUserProfileLikes?.length <= 1
                ? " Like"
                : " Likes"}
            </span>
          </p>

          <div className={`w-full flex h-[72.5dvh] md:h-[71dvh] overflow-auto`}>
            <div
              className={`flex flex-col overflow-auto md:h-[64dvh] w-full ${
                infoOpen && fetchedUserProfileLikes != null
                  ? "md:w-[59%]"
                  : "md:w-full"
              } pr-4`}
            >
              {fetchedUserProfileLikes?.length == 0 ||
              !fetchedUserProfileLikes ? (
                // display text if no likes
                <EmptyState
                  imageLink="/assests/no_like.svg"
                  message="No users liked your profile yet."
                  width={290}
                  height={322}
                />
              ) : (
                // mapped likes
                fetchedUserProfileLikes &&
                fetchedUserProfileLikes?.length &&
                fetchedUserProfileLikes?.map((item: LikedProfilesInterface) => (
                  <div
                    key={item?.id}
                    className={`flex justify-between p-[6.5px] items-center border-b border-[#ffffff38] border-solid cursor-pointer ${
                      selectedItem?.id === item?.id
                        ? "bg-base1 rounded-lg border-none"
                        : ""
                    }`}
                  >
                    <div
                      onClick={() => openInfo(item)}
                      className="flex cursor-pointer items-center"
                    >
                      {/* <div className="bg-white rounded-[100%] w-[35px] h-[35px]"></div> */}

                      <Image
                        src={
                          selectedItem?.profileImageDetails?.url
                            ? selectedItem?.profileImageDetails?.url
                            : "/icons/no_img.svg"
                        }
                        alt={""}
                        width={82}
                        height={82}
                        className="w-[35px] h-[35px] rounded-full object-cover"
                      />
                      <p className="text-[13px] ml-3">
                        {item?.firstName} {item?.lastName}
                      </p>
                    </div>

                    <div className="hidden md:block">
                      {/* report and block button desktop view */}
                      <Button className="border border-[#fff] border-solid rounded-[20px] bg-transparent text-[12px] h-[30px]">
                        Block
                      </Button>
                      <Button
                        onClick={() => openReportModal(item)}
                        className="border ml-3 border-[#fff] border-solid rounded-[20px] bg-transparent text-[12px] h-[30px]"
                      >
                        Report
                      </Button>
                    </div>

                    {/* report and block button mobile view */}
                    <div className="flex md:hidden items-center gap-[8px]">
                      <div className="bg-red rounded-[50%] text-[12px] w-[25px] h-[25px] flex items-center justify-center">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3.5 10.5L10.5 3.5"
                            stroke="white"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10.5 10.5L3.5 3.5"
                            stroke="white"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div
                        onClick={() => openReportModal(item)}
                        className="bg-white rounded-[50%] text-pink text-[12px] w-[25px] h-[25px] flex items-center justify-center"
                      >
                        <Image
                          src="/assests/report.svg"
                          alt="report"
                          width={1.5}
                          height={6}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* selected user information */}
            {infoOpen && selectedItem && (
              <div
                className={`w-[100%] md:w-[37%] md:ml-3 md:right-0 left-0 md:left-[59%] top-[0%] md:top-[11%] h-[100dvh] md:h-[64dvh] absolute flex items-center justify-center md:justify-end backdrop-blur-mobile`}
              >
                <div className="bg-white w-[92%] md:w-[100%] relative h-[60dvh] md:h-full rounded-[15px] p-4">
                  {/* close button for mobile view */}
                  <div
                    onClick={closeInfo}
                    className="absolute cursor-pointer top-0 right-0 m-3 bg-[#f7f6f3] md:hidden p-1 rounded-[7px]"
                  >
                    <X className="w-5 h-5" color="black" size={18} />
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-start w-full">
                    <div className="bg-yellow btn rounded-[50%] w-[65px] md:w-[120px] h-[65px] md:h-[120px] mb-3 mt-1">
                      <Image
                        src={
                          selectedItem?.profileImageDetails?.url
                            ? selectedItem?.profileImageDetails?.url
                            : "/icons/no_img.svg"
                        }
                        alt={""}
                        width={82}
                        height={82}
                        className="w-65px h-65px md:w-120px md:h-120px rounded-full object-cover"
                      />
                    </div>
                    <div className="pb-3 md:w-[100%] mb-3 md:border-b md:border-[#00000014] ml-3 md:ml-0">
                      <p className="text-[#000] font-[500] text-[24px]">
                        {selectedItem?.firstName}{" "}
                        {selectedItem?.lastName?.slice(0, 1)}
                      </p>
                      <p className="text-[#000] font-[200] text-[10px] flex flex-row items-center">
                        <IoLocationOutline
                          className="mr-1 text-[12px]"
                          color="#E5E5E5"
                        />
                        {selectedItem?.profile?.location || "No Location"}
                      </p>
                    </div>
                  </div>

                  <div className="pb-3 mb-3 border-b border-[#00000014]">
                    <div className="flex items-center gap-2">
                      <div className="text-[#000] bg-yellowbtn pb-1 pt-1 pl-3 pr-3 rounded-[20px] text-[12px] font-[200]">
                        <span className="mr-2">♒️</span>
                        {selectedItem?.profile?.zodiacSign
                          ? `${selectedItem?.profile?.zodiacSign}`
                          : "No Zodiac Sign"}
                      </div>
                      <div className="text-[#000] bg-yellowbtn pb-1 pt-1 pl-3 pr-3 rounded-[20px] text-[12px] font-[200]">
                        <span className="mr-2">🚹</span>
                        {selectedItem?.gender === "male" ? "Male" : "Female"}
                      </div>
                    </div>
                    {selectedItem?.profile &&
                      selectedItem?.profile?.interests?.length > 0 && (
                        <div>
                          <p className="text-[#000] font-[300] text-[12px] mt-3 mb-3">
                            My interest
                          </p>
                          <div className="flex items-center gap-2 overflow-x-scroll no-scrollbar">
                            {selectedItem?.profile?.interests?.map(
                              (interest, idx) => (
                                <div
                                  key={idx}
                                  className="bg-base1 text-[12px] font-[200] pl-3 pr-3 h-7 flex items-center whitespace-nowrap rounded-[20px]"
                                >
                                  {interest}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div>
                    <p className="text-[#000] font-[400] mb-2 md:mb-0 text-[12px]">
                      Bio
                    </p>
                    <p className="text-[#000] font-[200] text-[11px]">
                      {selectedItem?.profile?.bio || "................."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Likes;
