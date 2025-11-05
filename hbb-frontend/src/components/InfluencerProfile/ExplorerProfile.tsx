"use client";

import React, { useRef } from "react";
import { useDropzone } from "react-dropzone";
import EditModal from "../app-reusables/modals/EditProfileModal";
import { useModal } from "@/src/state/context/modal";
import { useProfileData } from "@/src/hooks/useProfileData";
import UserProfileInfo from "./UserProfileInfo";
import AppointmentsList from "./AppointmentList";

const ExplorerProfile: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef(null);

  const {
    profile,
    appointments,
    handleProfileImageChange,
    handleDrop,
    webImage,
    image,
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
    <main className="h-full bg-pink overflow-y-auto custom-scroll " >
      <div className="flex flex-col md:flex-row py-6 px-4 h-full mb-24">
        <div className="md:w-1/2 w-full md:pl-3 md:pr-3 md:pb-7 md:pt-1 flex flex-col h-full">
          <UserProfileInfo
            profile={profile}
            image={image}
            handleProfileImageChange={handleProfileImageChange}
            inputRef={inputRef}
            setEditModal={setEditModal}
            webImage={webImage}
          />
        </div>

        <div className="md:w-1/2 w-full pl-3 pr-2 pb-7 pt-1 flex flex-col h-full flex-grow">
          <AppointmentsList appointments={appointments} />
        </div>
      </div>
      <EditModal isOpen={editModal} onClose={setEditModal} />
    </main>
  );
};

export default ExplorerProfile;
