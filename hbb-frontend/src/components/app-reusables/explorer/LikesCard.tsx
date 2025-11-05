import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { CancelIcon, CallIcon } from "@/src/components/svgs/index";
import Image from "next/image";
import { LikedExplorerProfilesInterface } from "@/src/utils/interface";

interface Props {
  item: LikedExplorerProfilesInterface;
  openProfileModal: (item: any) => void;
  openGiftModal: (item: any) => void;
  openCallModal: (item: any) => void;
  removeLike: (id: string) => Promise<void>;
}

const LikesCard = ({
  item,
  openProfileModal,
  openGiftModal,
  openCallModal,
  removeLike,
}: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const profileImageUrl = item?.profileImageDetails?.url;

  const noImg = !profileImageUrl || profileImageUrl === "";

  return (
    <div
      key={item?.id}
      className="bg-base1 relative p-2 rounded-[4px] h-[200px] md:h-[250px] flex flex-col items-center shadow-custom-shadow-like"
    >
      {/* Cancel button */}
      <Button
        onClick={() => removeLike(item?.id)}
        size="sm"
        className="p-1 absolute top-0 right-0 rounded bg-white w-6 md:m-3 m-1 h-6 text-black"
      >
        <CancelIcon />
      </Button>

      {/* Profile Image */}
      <div className="mt-1 md:mt-0 flex flex-row md:flex-col w-full justify-left md:justify-center items-center">
        <div className="relative rounded-[50%] mr-3 md:mr-0 w-[60px] h-[60px] md:w-[96px] md:h-[96px] bg-white overflow-hidden border-white border-[4px] mb-1">
          {/* Skeleton loader until image loads */}
          {!noImg && !imageLoaded && (
            <div className="skeleton w-full h-full rounded-full"></div>
          )}

          {/* Hidden img tag for triggering onLoad */}
          {!noImg && (
            <img
              src={profileImageUrl}
              alt={item?.firstName}
              className="hidden"
              onLoad={() => setImageLoaded(true)}
            />
          )}

          {/* Actual image or fallback */}
          {imageLoaded || noImg ? (
            <img
              src={profileImageUrl || "/icons/no_img.svg"}
              alt={item?.firstName}
              className="rounded-[50%] w-full h-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex flex-col md:items-center">
          <p className="text-black text-[17px] lg:text-[20px] font-[600]">
            {item?.firstName || "No name"}{" "}{item?.lastName?.slice(0, 1)}
           
          </p>
          <p className="text-[11px] flex items-center text-black font-[300]">
            <Image
              src="/assests/location.svg"
              alt="location"
              width={15}
              height={9}
            />
            <span className="ml-0.5">
            {item?.profile?.location ?? "No confirmed location"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center w-full mb-3 mt-3">
        <Button
          onClick={() => openProfileModal(item)}
          className="bg-white h-[37px] md:h-[30px] shadow-custom-shadow-component text-black text-[11px] rounded-[20px] w-[63%]"
        >
          View profile
        </Button>
        <div className="w-[2px] rounded h-[30px] bg-[#FFFFFF66]"></div>
        <Button
          onClick={() => openGiftModal(item)}
          className="bg-pink h-[37px] md:h-[30px] shadow-custom-shadow-component text-black text-[11px] rounded-[20px] w-[30%]"
        >
          <Image src="/assests/gift.svg" alt="gift" width={20} height={15} />
        </Button>
      </div>

      <Button
        onClick={() => openCallModal(item)}
        className="w-full justify-center items-center h-[40px] md:h-[30px] bg-pink shadow-custom-shadow-over text-black text-[11px] rounded-[20px] gap-2"
      >
        Request call <CallIcon className="w-[15px] h-[15px]" />
      </Button>
    </div>
  );
};

export default LikesCard;
