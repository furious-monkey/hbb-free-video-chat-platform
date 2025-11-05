import React, { RefObject, useEffect } from "react";
import ReactPlayer from "react-player";
import { FaPlay, FaPause } from "react-icons/fa6";
import { TbPencil } from "react-icons/tb";
import { ImageProps } from "@/src/types/image";
import { shallow } from "zustand/shallow";
import Image from "next/image";
import { useProfileStore } from "@/src/store/profileStore";

interface VideoUploadProps {
  videoSrc: string;
  webVideo: ImageProps | undefined;
  videoRef: RefObject<ReactPlayer>;
  handlePlayPause: () => void;
  isPlaying: boolean;
  setVideoSrc: (url: string) => void;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  promotionVideo: ImageProps | undefined;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  videoSrc,
  webVideo,
  videoRef,
  handlePlayPause,
  isPlaying,
  getRootProps,
  getInputProps,
  promotionVideo,
  isDragActive,
  isDragAccept,
  isDragReject,
}) => {
  const videoUrlToShow = webVideo?.url || promotionVideo?.url || videoSrc;
  const { postUpdateUserPromotionalVideo } = useProfileStore(
    (state: any) => ({
      postUpdateUserPromotionalVideo: state.postUpdateUserPromotionalVideo,
    }),
    shallow
  );

  useEffect(() => {
    if (webVideo) {
      postUpdateUserPromotionalVideo({ promotionalVideo: webVideo.id });
    }
  }, [webVideo]);

  return (
    <div className="relative w-full md:h-[358px] h-[302px] flex items-center justify-center bg-base1 rounded-2xl overflow-hidden">
      {videoUrlToShow ? (
        <div className="relative w-full h-full">
          <ReactPlayer
            ref={videoRef}
            url={videoUrlToShow}
            width="100%"
            height="100%"
            playing={isPlaying}
            muted
            loop={true}
            controls={false}
            style={{ position: "absolute", top: 0, left: 0 , backgroundColor: "black"}}
            config={{
              file: {
                attributes: {
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  },
                },
              },
            }}
          />
          <div
            onClick={handlePlayPause}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer text-white"
          >
            {isPlaying ? (
              <Image
                src="/icons/pause.svg"
                width={100}
                height={100}
                alt=""
                className="w-[48px] h-[48px] lg:w-[68px] lg:h-[68px]"
              />
            ) : (
              <Image
                src="/icons/play.svg"
                width={100}
                height={100}
                alt=""
                className="w-[48px] h-[48px] lg:w-[68px] lg:h-[68px]"
              />
            )}
          </div>
          <div
            {...getRootProps({})}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg text-xs border border-white text-white bg-white cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-[#E688A3]">Edit</span>
              <TbPencil color="#E688A3" className="w-4 h-4" />
            </span>
            <input
              {...getInputProps()}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div
          {...getRootProps({})}
            className={`relative w-full h-full flex items-center justify-center ${
              isDragActive ? "border-green-500" : "border-white"
          }`}
          >
            {videoUrlToShow && (
              <div className="absolute top-4 right-4 z-20 p-2 rounded-lg text-xs border border-white text-white bg-black bg-opacity-10 cursor-pointer">
                <p>Cancel</p>
              </div>
            )}

          <div className="absolute flex items-center justify-center p-8 bg-[#E7D4DA] bg-opacity-15 border border-dashed border-gray-400 rounded-20 px-1 w-full h-full">
            <p className="text-center font-medium text-sm">
              Drag and drop a video file{" "}
              <span className="text-[#F1E499]">here</span>
            </p>
          </div>
          <input
            {...getInputProps()}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
