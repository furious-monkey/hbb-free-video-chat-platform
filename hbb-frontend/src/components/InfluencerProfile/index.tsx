"use client";

import React, { useRef } from "react";
import { useDropzone } from "react-dropzone";
import EditModal from "../app-reusables/modals/EditProfileModal";
import { useModal } from "@/src/state/context/modal";
import { useProfileData } from "@/src/hooks/useProfileData";
import UserProfileInfo from "./UserProfileInfo";
import VideoUpload from "./VideoUpload";
import EarningsCard from "./EarningsCard";
import AppointmentsList from "./AppointmentList";
import ProfileMetrics from "./ProfileMetrics";

const InfluencerProfile: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef(null);

  const {
    profile,
    appointments,
    videoSrc,
    setVideoSrc,
    handleProfileImageChange,
    handlePlayPause,
    isPlaying,
    handleDrop,
    image,
    webImage,
    webVideo,
  } = useProfileData();

  const { editModal, setEditModal } = useModal();

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: { "video/*": [] },
    onDrop: handleDrop,
  });

  return (
    <main className="h-full bg-pink overflow-y-auto custom-scroll">
      <div
        className="flex flex-col md:flex-row py-4"
        // className="overflow-auto md:overflow-hidden flex flex-col md:flex-row md:mb-1 w-full h-[47em] md:h-[47em] md:top-[9em] relative md:pt-6 md:px-3"
      >
        <div className="md:w-[35%] w-full md:pl-3 md:pr-3 md:pb-7 md:pt-1 h-full flex flex-col">
          <UserProfileInfo
            profile={profile}
            image={image}
            handleProfileImageChange={handleProfileImageChange}
            inputRef={inputRef}
            setEditModal={setEditModal}
            webImage={webImage}
          />
        </div>
        <div className="md:w-[30%] w-full pb-7 pt-1 h-full flex flex-col mb-4">
          <div className="px-4 lg:px-0 h-full">
            <VideoUpload
              videoSrc={videoSrc}
              webVideo={webVideo || undefined}
              videoRef={videoRef}
              promotionVideo={profile?.promotionalVideoDetails?.[0]}
              handlePlayPause={handlePlayPause}
              isPlaying={isPlaying}
              setVideoSrc={setVideoSrc}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              isDragAccept={isDragAccept}
              isDragReject={isDragReject}
            />
          </div>

          <div className="mt-2">
          <ProfileMetrics/>
          </div>
        </div>
        <div className="md:w-[35%] w-full px-4 pb-7 pt-1 h-full flex flex-col mb-4">
          <AppointmentsList appointments={appointments} />
          <EarningsCard title="Earning from live calls" amount="$1,455" />
          <EarningsCard title="Earning from gifts" amount="$1,455" />
        </div>
      </div>
      <EditModal isOpen={editModal} onClose={setEditModal} />
    </main>
  );
};

export default InfluencerProfile;
