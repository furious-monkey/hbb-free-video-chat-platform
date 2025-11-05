import React, { useState } from "react";
import { LocationIcon } from "@/src/components/svgs";
import Image from "next/image";
import { Separator } from "../../ui/separator";

const DiscoverCard = ({ profile }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewProfile, setViewProfile] = useState(false);
  const profileImageUrl = profile?.profileImageDetails?.url || "";
  const noImg = !profileImageUrl;

  const handleViewProfile = () => {
    setViewProfile(true);
  };

  const handleExitProfile = () => {
    setViewProfile(false);
  };

  // Desktop version
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden lg:flex lg:w-full">
        <div className="md:w-[65%] max-h-[50vh] mx-auto bg-[#6AB5D2] rounded-lg overflow-hidden lg:flex lg:gap-4 lg:justify-between ">
          {/* Profile Image with Skeleton Loader */}
          <div className="lg:w-1/2 relative h-[50vh] p-4 flex flex-col justify-center">
            <div className="h-full">
              {!imageLoaded && (
                <div className="skeleton !rounded-none w-full h-full"></div>
              )}
              <img
                src={profileImageUrl}
                alt={`${profile.name}'s image`}
                className="hidden"
                onLoad={() => setImageLoaded(true)}
              />
              {imageLoaded && (
                <Image
                  src={profileImageUrl}
                  alt={`${profile.name}'s image`}
                  layout="fill"
                  objectFit="cover"
                  className=""
                />
              )}
            </div>
          </div>

          <div className="h-[50vh] py-4">
            <Separator
              className="w-px h-full bg-[#8FC0D3]"
              orientation="vertical"
            />
          </div>

          {/* User Profile */}
          <div className="w-full lg:w-1/2 px-4 lg:px-0 py-2 text-white lg:pr-4">
            <div className="h-full max-h-[50vh] overflow-auto flex flex-col justify-between">
              <div className="border-b border-[#ffffff50] flex justify-between md:flex-col md:justify-start pb-3 mb-3 mt-8">
                <p className="font-[500] text-[20px] lg:text-[32px]">
                  {profile?.firstName} {profile?.lastName?.charAt(0)}
                </p>
                <span className="font-[100] flex items-center text-[14px] lg:text-[12px] md:text-[10px] mt-1 gap-1">
                  <LocationIcon fill="#E688A3" />
                  <span className="ml-2">
                    {profile?.profile?.location || "No confirmed location"}
                  </span>
                </span>
              </div>

              <div className="w-full border-b border-[#ffffff50] pb-3">
                {profile?.profile?.zodiacSign && (
                  <p className="bg-yellowbtn w-max px-4 h-8 flex justify-center items-center pl-3 pr-3 rounded-[15px] text-black text-[12px] font-[100]">
                    ♒️{" "}
                    <span className="ml-2">{profile.profile.zodiacSign}</span>
                  </p>
                )}
                {profile?.profile?.interests?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] mt-2 mb-2 font-[100]">
                      My interests
                    </p>
                    <div className="flex items-center gap-2 overflow-x-scroll no-scrollbar lg:flex-wrap">
                      {profile.profile.interests.map((interest) => (
                        <p
                          key={interest}
                          className="bg-pink w-max h-6 flex justify-center items-center pl-3 pr-3 rounded-[15px] text-[12px] whitespace-nowrap font-[100]"
                        >
                          {interest}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <p className="font-[100] min-h-12 text-[10px] break-words line-clamp-4 overflow-hidden mt-4">
                  {profile?.profile?.bio?.slice(0, 200) || "No bio available"}
                </p>
              </div>

              <div className="w-full pt-4 pb-4 mt-4">
                <p className="font-[400] text-[15px]">Request call</p>
                <p className="font-[100] text-[10px] mt-2 mb-1">Current rate</p>
                <p className="bg-darkPurple font-[100] text-[14px] w-[150px] rounded-[5px] h-10 flex items-center pl-3 pr-3">
                  {profile?.profile?.callRate
                    ? `$${profile.profile.callRate}`
                    : "$0"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden w-full h-screen">
        {!viewProfile ? (
          <div className="relative h-full w-full rounded-lg">
            {/* Image without gradient, just placed in the background */}
            <Image
              src={profileImageUrl}
              alt={`${profile.name}'s image`}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg"></div>

            {imageLoaded && (
              <div className="absolute bottom-0 w-full">
                <div className="flex justify-between items-center bg-black/30 p-4 rounded-lg">
                  <div>
                    <p className="text-xl font-bold">
                      {profile?.firstName} {profile?.lastName?.charAt(0)},{" "}
                      {profile?.profile?.age || "N/A"}
                    </p>
                    <p className="text-sm">{profile?.profile?.location}</p>
                  </div>
                  <button
                    className="text-sm text-[#6AB5D2] font-medium"
                    onClick={handleViewProfile}
                    style={{
                      fontFamily: '"Space Grotesk", sans-serif',
                    }}
                  >
                    View profile
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-full p-4 bg-[#6AB5D2] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xl font-bold">{profile?.firstName} L</p>
              <button className="text-sm underline" onClick={handleExitProfile}>
                Exit view
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <LocationIcon fill="#E688A3" />
              <p className="text-sm">{profile?.profile?.location}</p>
            </div>

            {profile?.profile?.zodiacSign && (
              <p className="bg-yellowbtn w-max px-4 h-8 flex justify-center items-center pl-3 pr-3 rounded-[15px] text-black text-[12px] mb-4">
                ♒️ {profile.profile.zodiacSign}
              </p>
            )}

            {profile?.profile?.interests?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm mb-2">My interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.profile.interests.map((interest) => (
                    <p
                      key={interest}
                      className="bg-pink w-max h-6 flex justify-center items-center px-3 rounded-[15px] text-[12px]"
                    >
                      {interest}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm mb-4">
              {profile?.profile?.bio?.slice(0, 200) || "No bio available"}
            </p>

            <div className="border-t border-white pt-4">
              <p className="text-lg">Request call</p>
              <p className="text-sm mt-2">Current rate</p>
              <p className="bg-darkPurple text-lg w-[150px] rounded-[5px] h-10 flex items-center px-4 mt-2">
                {profile?.profile?.callRate
                  ? `$${profile.profile.callRate}`
                  : "$0"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverCard;
