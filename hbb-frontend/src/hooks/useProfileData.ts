import { useState, useEffect, ChangeEvent } from "react";
import { getCookie } from "cookies-next";
import { useProfileStore } from "@/src/store/profileStore";
import { shallow } from "zustand/shallow";
import { handleImageUpload, handlePromotionalVideo } from "../utils/functions";
import { ImageProps } from "../types/image";

export const useProfileData = () => {
  const [image, setImage] = useState<File | undefined>(undefined);
  const [webVideo, setWebVideo] = useState<ImageProps | undefined>(undefined);
  const [webImage, setWebImage] = useState<ImageProps | undefined>(undefined);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const token = getCookie("accessToken") as string;

  const {
    getUserProfile,
    getUserAppointments,
    getProfileViews,
    profile,
    appointments,
    profileViews,
  } = useProfileStore(
    (state: any) => ({
      getUserProfile: state.getUserProfile,
      getUserAppointments: state.getUserAppointments,
      getProfileViews: state.getProfileViews,
      profile: state.profile,
      appointments: state.appointments,
      profileViews: state.profileViews,
    }),
    shallow
  );

  useEffect(() => {
    getUserProfile();
    getUserAppointments();
    getProfileViews();
  }, []);

  useEffect(() => {
    if (image && token) {
      const formData = new FormData();
      formData.append("file", image);
      handleImageUpload(formData, token, null).then((res) => {
        setWebImage(res.data);
      });
    }
  }, [image, token]);

  useEffect(() => {
    if (videoSrc && token) {
      fetch(videoSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "promotional_video.mp4", { type: blob.type });
          const formData = new FormData();
          formData.append("file", file);
          handlePromotionalVideo(formData, token, null).then((res) => setWebVideo(res.data));
        })
        .catch((err) => console.error("Error converting blob URL to file:", err));
    }
  }, [videoSrc, token]);


  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleDrop = (acceptedFiles: File[]) => {
    const mappedFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    )[0];
    setVideoSrc(mappedFiles.preview);
  };

  return {
    profile,
    appointments,
    profileViews,
    videoSrc,
    setVideoSrc,
    handleProfileImageChange,
    handlePlayPause,
    isPlaying,
    setIsPlaying,
    handleDrop,
    image,
    setImage,
    webImage,
    webVideo,
  };
};
