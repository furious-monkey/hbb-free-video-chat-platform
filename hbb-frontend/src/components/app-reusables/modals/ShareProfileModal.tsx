"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useProfileStore } from "@/src/store/profileStore";
import { shallow } from "zustand/shallow";
import Image from "next/image";
import { InstaIcon } from "../../svgs/InstaIcon";
import { TiktokIcon } from "../../svgs/TiktokIcon";
import { TwitchIcon } from "../../svgs/TwitchIcon";
import { useNoAuthStore } from "@/src/store/no-authStore";

interface Props {
  isOpen: boolean | undefined;
}

const ShareProfileModal = ({ isOpen }: Props) => {
  const [copied, setCopied] = useState(false);

  const { getUserProfile, profile } = useProfileStore(
    (state: any) => ({
      getUserProfile: state.getUserProfile,
      profile: state.profile,
    }),
    shallow
  );
  const router = useRouter();
  const pathname = usePathname();

  const segment = pathname.split("/")[2];
  const isInfluencerSegment = segment === "influencer";

  const { fetchCategories, categories } = useNoAuthStore(
    (state: any) => ({
      fetchCategories: state.fetchCategories,
      categories: state.categories,
      loading: state.loading,
    }),
    shallow
  );

  useEffect(() => {
    getUserProfile();
  }, []);

  const memoizedFetchCategories = useCallback(async () => {
    try {
      await fetchCategories();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [fetchCategories]);

  useEffect(() => {
    memoizedFetchCategories();
  }, [memoizedFetchCategories]);

  console.log("profilecategories", profile, categories);
  const userProfileLink = `${window.location.origin}/influencer/${profile?.username}`;

  const copyToClipboard = () => {
    const link = userProfileLink;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      {isOpen && (
        <>
          <div className="flex flex-col items-center justify-center lg:px-4 overflow-y-auto no-scrollbar pb-20 lg:pb-0">
            <h3 className="text-2xl lg:text-3xl lg:mt-4">Share profile</h3>
            <div className="avatar-bg h-40 w-40 relative flex justify-center items-center lg:my-4">
              <div className=" rounded-full w-32 h-32 lg:w-40 lg:h-40 absolute">
                <Image
                  src="/bg/avatar_bg.svg"
                  alt="Background"
                  layout="fill"
                  className="rounded-full object-cover"
                />
              </div>
              <div className="rounded-full p-4 relative h-24 w-24 lg:w-28 lg:h-28 z-10 border-[1px] border-white">
                <Image
                  src={
                    profile?.profileImageDetails?.url || "/assests/camera.svg"
                  }
                  alt="Profile"
                  layout="fill"
                  className="rounded-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-lg font-medium mb-2 capitalize">
              {profile?.username}
            </h1>
            <div className="flex space-x-2 mb-4 gap-2">
              {categories?.data
                ?.filter((category: any) =>
                  profile?.category?.includes(category.id)
                )
                .slice(0, 3)
                .map((category: any) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-1"
                  >
                    <div className="w-4 h-4 relative">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        layout="fill"
                        className="rounded-full"
                      />
                    </div>
                    <span className="text-xs lg:text-sm">{category.name}</span>
                  </div>
                ))}
            </div>

            <div className="rounded-full bg-[rgba(255,255,255,0.16)] w-full max-w-md pl-4 pr-1 py-1 flex justify-between items-center lg:mt-4">
              <a href={userProfileLink} className="truncate text-white text-sm">
                {userProfileLink}
              </a>
              <button
                onClick={copyToClipboard}
                className="rounded-[16.5px] bg-[rgba(255,255,255,0.40)] text-black text-sm py-2 whitespace-nowrap px-4"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>

            <p className="text-sm my-4">Or</p>
            <div className="flex space-x-4">
              <a
                href={`https://www.instagram.com/?url=${encodeURIComponent(
                  `${window.location.origin}/influencer/${profile?.username}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Instagram"
                className="text-blue-600"
              >
                <InstaIcon />
              </a>

              {/* TikTok share link */}
              <a
                href={`https://www.tiktok.com/share?url=${encodeURIComponent(
                  `${window.location.origin}/influencer/${profile?.username}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on TikTok"
                className="text-blue-600"
              >
                <TiktokIcon />
              </a>

              {/* Twitch does not have a direct share URL, but you can guide users to post it */}
              <a
                href={`https://www.twitch.tv/directory`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Twitch"
                className="text-blue-600"
              >
                <TwitchIcon />
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ShareProfileModal;
