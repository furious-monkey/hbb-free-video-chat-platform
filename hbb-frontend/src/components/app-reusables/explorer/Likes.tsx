"use client";

import React, { useEffect, useState } from "react";
import ReportModal from "./likes/reportModal";
import ViewProfileModal from "./likes/viewProfileModal";
import GiftModal from "./likes/giftModal";
import formatNumber from "./likes/formatNumber";
import CallModal from "./likes/callModal";
import LikesCard from "./LikesCard";
import { LikedExplorerProfilesInterface } from "@/src/utils/interface";
import { useInfluencerStore } from "@/src/store/influencerStore";
import { shallow } from "zustand/shallow";
import { toast } from "sonner";
import EmptyState from "../EmptyState";

const Likes = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [fetchedLikedInfluencers, setFetchedLikedInfluencers] = useState<
    LikedExplorerProfilesInterface[]
  >([]);
  //call modal
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callData, setCallData] = useState(null);
  //profile modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] =
    useState<LikedExplorerProfilesInterface | null>(null);
  const closeReportModal = () => setIsReportModalOpen(false);
  const closeProfileModal = () => setIsProfileModalOpen(false);
  //gift modal
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftData, setGiftData] = useState(null);
  const closeCallModal = () => setIsCallModalOpen(false);
  const closeGiftModal = () => setIsGiftModalOpen(false);

  const openReportModal = (item) => {
    setIsReportModalOpen(true);
    setIsProfileModalOpen(false);
    setReportData(item);
  };

  const {
    getLikedInfluencerProfiles,
    likedProfiles,
    deleteInfluencerProfileUnlike,
    loading,
  } = useInfluencerStore(
    (state: any) => ({
      getLikedInfluencerProfiles: state.getLikedInfluencerProfiles,
      likedProfiles: state.likedProfiles,
      loading: state.loading,
      deleteInfluencerProfileUnlike: state.deleteInfluencerProfileUnlike,
    }),
    shallow
  );

  useEffect(() => {
    getLikedInfluencerProfiles();
  }, []);

  useEffect(() => {
    if (likedProfiles?.length || isLiked) {
      setFetchedLikedInfluencers(likedProfiles);
      setIsLiked(false);
    }
  }, [likedProfiles, isLiked]);

  const openProfileModal = (item: LikedExplorerProfilesInterface) => {
    setIsProfileModalOpen(true);
    setProfileData(item);
  };

  const openGiftModal = (item) => {
    setIsGiftModalOpen(true);
    setGiftData(item);
  };

  const openCallModal = (item) => {
    setIsCallModalOpen(true);
    setCallData(item);
  };

  const removeLike = async (id: string) => {
    if (id) {
      const response = await deleteInfluencerProfileUnlike(id);

      if (response?.message === "Profile unliked successfully") {
        // Update the state immediately by filtering out the removed item
        setFetchedLikedInfluencers((prev) =>
          prev.filter((item) => item.id !== id)
        );

        if (fetchedLikedInfluencers.length === 1) {
          getLikedInfluencerProfiles();
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-pink flex flex-col items-center justify-center bg-pink-100 text-pink-800">
        <p className="text-lg font-semibold">loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-pink rounded-3xl ">
      <div className="w-full  h-full">
        {fetchedLikedInfluencers?.length ? (
          <>
            {/* display number of likes and convert to k if above a thousand */}
            <div className="px-4 md:px-8 pt-8">
              <p className="mb-2 ml-1 font-[500] text-[20px]">
                {formatNumber(fetchedLikedInfluencers?.length)}{" "}
                <span className="font-[100]">Liked</span>
              </p>
            </div>
            <div
              className={`w-full overflow-y-auto h-[65vh] lg:h-[75vh] ${
                fetchedLikedInfluencers?.length > 8
                  ? "2xl:h-[80vh]"
                  : "2xl:h-auto"
              }`}
            >
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4 md:px-8 pb-4 w-full h-full  ${
                  fetchedLikedInfluencers?.length > 8 ? "mb-80 " : "mb-16"
                }  2xl:mb-24`}
              >
                {fetchedLikedInfluencers.map(
                  (item: LikedExplorerProfilesInterface) => (
                    <LikesCard
                      key={item?.id}
                      item={item}
                      openProfileModal={openProfileModal}
                      openGiftModal={openGiftModal}
                      openCallModal={openCallModal}
                      removeLike={removeLike}
                    />
                  )
                )}
              </div>
            </div>
          </>
        ) : (
            <EmptyState
              imageLink="/assests/no_like.svg"
              message="No Influencers online right now"
              isLike
              width={290}
              height={322}
            />
        )}
      </div>

      {/* report modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        item={reportData}
        onClose={closeReportModal}
      />

      {/* view profile modal */}
      <ViewProfileModal
        isOpen={isProfileModalOpen}
        item={profileData}
        onClose={closeProfileModal}
        openReport={() => openReportModal(profileData)}
        openGift={() => openGiftModal(profileData)}
        openRequestCall={() => openCallModal(profileData)}
      />

      {/* gift modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        item={giftData}
        onClose={closeGiftModal}
      />

      {/* call modal */}
      <CallModal
        isOpen={isCallModalOpen}
        item={callData}
        onClose={closeCallModal}
      />
    </div>
  );
};

export default Likes;
