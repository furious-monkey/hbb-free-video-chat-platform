import React, { ChangeEvent, RefObject, use, useEffect, useState } from "react";
import Image from "next/image";
import { TbPencil } from "react-icons/tb";
import { UserProfile } from "@/src/types/userProfile.interface";
import { usePathname } from "next/navigation";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "../ui/textarea";
import { ImageProps } from "@/src/types/image";
import { useProfileStore } from "@/src/store/profileStore";
import { shallow } from "zustand/shallow";

interface UserProfileInfoProps {
  profile: UserProfile | undefined;
  image: any;
  handleProfileImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef: RefObject<HTMLInputElement>;
  webImage: ImageProps | undefined;
  setEditModal: (editModal: boolean) => void;
}

const UserProfileInfo: React.FC<UserProfileInfoProps> = ({
  profile,
  image,
  handleProfileImageChange,
  inputRef,
  webImage,
  setEditModal,
}) => {
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const { postUpdateUserProfileImage } = useProfileStore(
    (state: any) => ({
      postUpdateUserProfileImage: state.postUpdateUserProfileImage,
    }),
    shallow
  );
  const pathname = usePathname();

  const segment = pathname.split("/")[2];

  useEffect(() => {
    if (webImage) {
      setPreview(webImage?.url);
      postUpdateUserProfileImage({ profileImage: webImage.id });
    }
  }, [webImage]);

  console.log(profile, "hrehhre");

  return (
    <div
      className={`md:bg-neutral-200 md:bg-opacity-15 md:rounded-2xl p-2 px-4 lg:p-5 mb-5 ${
        segment == "explorer" && "min-h-[600px]"
      }`}
    >
      <div className="flex flex-row justify-between">
        <div>
          <div>
            <Image
              src={
                preview
                  ? preview
                  : image
                  ? URL.createObjectURL(image)
                  : profile?.profileImageDetails?.url || "/assests/camera.svg"
              }
              alt="Profile Picture"
              width={82}
              height={82}
              className="w-24 h-24 lg:w-[112px] lg:h-[112px] object-cover border-1 border-[#F0B8C8] rounded-full"
            />

            <input
              type="file"
              accept="image/*"
              ref={inputRef}
              onChange={handleProfileImageChange}
              className="hidden"
            />
          </div>
          <Image
            src={"/assests/camera_small.svg"}
            alt="Edit Icon"
            width={32}
            height={32}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer w-6 h-6 lg:w-8 lg:h-8 rounded-full relative bottom-8 float-end"
          />
        </div>
        {segment == "influencer" && (
          <div>
            <div className="mt-5 p-3 pt-2 pb-2 rounded-lg text-[11px] bg-white text-[#E688A3] w-36 text-center">
              Likes 200k
            </div>
          </div>
        )}
      </div>
      <div className="w-full h-9 bg-neutral-200 bg-opacity-15 rounded-lg py-2 px-4 flex flex-row items-center gap-3">
        <span>♒️</span>
        <p className="text-xs">{profile?.zodiacSign || "Capricon"}</p>
        <div className="w-1 h-1 bg-white rounded-full"></div>
        <span className="mr-2">🚹</span>
        <p className="text-xs capitalize">{profile?.user?.gender || null}</p>
        <div className="w-1 h-1 bg-white rounded-full"></div>
        <span>🗓</span>
        <p className="text-xs">{profile?.user?.age || null}</p>
      </div>
      <div className="flex flex-row justify-between md:border-b md:border-[#ffffff] mt-5 pb-4">
        <p className="text-xl font-normal">Info</p>
        <div
          onClick={() => setEditModal(true)}
          className="cursor-pointer flex flex-row items-center justify-between px-4 gap-2 py-2 rounded-lg text-[11px] border border-[#ffffff] text-[#ffffff] text-center"
        >
          <p className="text-xs">Edit</p>
          <TbPencil color="ffffff" className="w-4 h-4" />
        </div>
      </div>
      <div className="flex mt-5 flex-col md:flex-col gap-[15px]">
        <div className="flex flex-col lg:flex-col gap-[15px]">
          <div className="w-full">
            <label className="text-white text-xs mb-2 font-medium opacity-50">
              Username
            </label>
            <Input
              placeholder="Eg. JohnDoe"
              className="border-[1px] p-3 rounded-lg placeholder:text-profile text-sm w-full !h-[45px] border-[#F0B8C8] text-white bg-transparent mt-1"
              name="username"
              disabled
              value={profile?.username}
            />
          </div>
          <div className="w-full">
            <label className="text-white text-xs mb-2 font-medium opacity-50">
              Location
            </label>
            <Input
              placeholder="City, State"
              className="border-[1px] p-3 rounded-lg placeholder:text-profile text-sm w-full !h-[45px] border-[#F0B8C8] text-white bg-transparent mt-1"
              name="location"
              disabled
              value={profile?.location}
            />
          </div>
          <div className="w-full">
            <label className="text-white text-xs mb-2 font-medium opacity-50">
              My Bio
            </label>
            <Textarea
              value={profile?.bio}
              disabled
              className="bg-[transparent] rounded-lg py-12.5px px-5 w-full placeholder:text-white border-[1px] border-[#F0B8C8] outline-none focus:bg-transparent mt-1"
            />
          </div>
          {profile?.interests && profile?.interests?.length > 0 && (
            <div className="w-full">
              <label className="text-white text-xs mb-2 font-medium">
                Interest
              </label>
              <div className="flex flex-row">
                {profile?.interests?.map((interest, idx) => (
                  <div
                    key={idx}
                    className="flex flex-row mr-2 justify-between p-2 rounded-3xl text-[11px] bg-[#6AB5D2] text-[#ffffff] h-8 text-center"
                  >
                    <TbPencil color="ffffff" className="mr-1" />
                    <p className="text-xs">{interest}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {segment == "influencer" && (
            <div className="w-full">
              <label className="text-white text-xs mb-2 font-medium opacity-50">
                Your call request rate
              </label>

              <Input
                placeholder="0.00"
                disabled
                value={profile?.callRate}
                className="border-[1px] p-3 rounded-lg placeholder:text-profile text-sm w-full !h-[45px] border-[#F0B8C8] text-white bg-transparent mt-1"
                numberOnly
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;
