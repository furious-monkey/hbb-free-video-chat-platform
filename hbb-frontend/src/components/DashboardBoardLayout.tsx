"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import DashboardHeader from "./DashboardHeader";
import Image from "next/image";
import { useUserStore } from "../store/userStore";
import { shallow } from "zustand/shallow";
import DashboardModal from "./app-reusables/modals/DashboardModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EditProfileIcon } from "./svgs/EditProfileIcon";
import { EarningIcon } from "./svgs/EarningIcon";
import { CallHistoryIcon } from "./svgs/CallHistoryIcon";
import { CardDetailsIcon } from "./svgs/CardDetailsIcon";
import { ChangePasswordIcon } from "./svgs/ChangePasswordIcon";
import { LogoutIcon } from "./svgs/LogoutIcon";
import DashboardDivider from "./DashboardDivider";
import debounce from "lodash.debounce";
import { SearchInput } from "./ui/search-input";
import { IUserMain } from "../types/user";
import { Button } from "./ui/button";
import { ShareIcon } from "./svgs/ShareIcon";
import { TransactionHistoryIcon } from "./svgs/TransactionHistoryIcon";
import WavingHand from "./WavingHand";
import { logout } from "../lib/auth";
import { GetPaidIcon } from "./svgs/GetPaidIcon";
import { LIVE_FEATURES } from "../lib/constants";

interface DashboardBoardLayoutProps {
  title?: string;
}



const DashboardBoardLayout = ({ title }: DashboardBoardLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [fetchedUserProfile, setFetchedUserProfile] = useState<IUserMain>();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const updateQueryParams = useCallback(
    (query: string) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (query.trim() !== "") {
        newSearchParams.set("q", query);
      } else {
        newSearchParams.delete("q");
      }
      window.history.replaceState(
        null,
        "",
        `${pathname}?${newSearchParams.toString()}`
      );
    },
    [pathname, searchParams]
  );

  const debouncedUpdateQueryParams = useCallback(
    debounce(updateQueryParams, 100),
    [updateQueryParams]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    debouncedUpdateQueryParams(value);
  };

  useEffect(() => {
    return () => {
      debouncedUpdateQueryParams.cancel();
    };
  }, [debouncedUpdateQueryParams]);

  useEffect(() => {
    if (userDetails) {
      setFetchedUserProfile(userDetails);
    }
  }, [userDetails]);

  const modalType = searchParams.get("modal");

  function closeModal() {
    const url = new URL(window.location.href);
    url.searchParams.delete("modal");
    url.searchParams.delete("username");
    url.searchParams.delete("id");
    window.history.replaceState({}, "", url);
  }

  function openModal(type: string) {
    if (!LIVE_FEATURES.includes(type)) {
      setShowComingSoon(true);
      return;
    }
    
    const url = new URL(window.location.href);
    url.searchParams.set("modal", type);
    window.history.pushState({}, "", url);
  }

  function closeComingSoon() {
    setShowComingSoon(false);
  }

  const isFeatureLive = (feature: string) => LIVE_FEATURES.includes(feature);

  const segment = pathname.split("/")[2];
  const isInfluencerSegment = segment === "influencer";

  return (
    <div>
      <DashboardHeader>
        <div className="w-full flex justify-between items-center pt-4 lg:pt-0">
          <div className="flex gap-3 items-center">
            <div className=" w-fit">
              <Image
                src={"/assests/logo.svg"}
                alt={"logo"}
                width={80}
                height={80}
                className="w-[64px] lg:w-[80px] h-auto"
              />
            </div>
            <div className="hidden h-12 lg:h-16 lg:flex flex-col justify-center lg:ml-4">
              <WavingHand />
            </div>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-max">
            <div
              className={`relative !w-full lg:!w-96 lg:mr-4 lg:mt-2 ml-2 lg:ml-0 ${
                isInfluencerSegment && "invisible"
              }`}
            >
              <SearchInput
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                icon="/icons/search.svg"
              />
            </div>

            <div className="w-[45px] h-[45px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  className="text-[#475467] data-[state=open]:text-base2 cursor-pointer"
                >
                  <Image
                    src={"/icons/hamburger.svg"}
                    alt={"hamburger"}
                    width={96}
                    height={96}
                    className="w-[96px] h-[96px]"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[rgba(0,0,0,0.80)] text-white border-0 p-4 -mt-4 rounded-xl backdrop-blur-[16px] min-w-[250px] 2xl:min-w-[291px] max-w-[300px] min-h-[70vh]  lg:min-h-[80vh] flex flex-col justify-between"
                >
                  <div>
                    <div className="mb-4 flex gap-2">
                      <div className="w-1/4">
                        <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden ">
                          <Image
                            src={
                              fetchedUserProfile?.profileImageDetails?.url ||
                              "/icons/no_img.svg"
                            }
                            alt="profile"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between gap-x-2  w-3/4 items-center">
                        <p className="text-base md:text-sm 2xl:text-lg lowercase font-thin text-[#6AB5D2] w-3/4 flex-wrap">
                          @
                          {fetchedUserProfile?.profile?.username.slice(0, 10) ||
                            "Username"}
                        </p>
                        {isInfluencerSegment && (
                          <DropdownMenuItem
                            onClick={() => openModal("shareProfile")}
                            className={`p-0 rounded-full bg-transparent m-0 w-8 h-8 cursor-pointer ${!isFeatureLive("shareProfile") ? "opacity-50" : ""}`}
                          >
                            <span>
                              <ShareIcon />
                            </span>
                          </DropdownMenuItem>
                        )}
                      </div>
                    </div>

                    <DashboardDivider />
                    <DropdownMenuItem
                      onClick={() => openModal("edit")}
                      className={`mb-2 cursor-pointer ${!isFeatureLive("edit") ? "opacity-50" : ""}`}
                    >
                      <EditProfileIcon className="mr-2" />
                      <span className="ml-2 text-base md:text-sm 2xl:text-lg">
                        Edit profile
                      </span>
                    </DropdownMenuItem>
                    {isInfluencerSegment && (
                      <DropdownMenuItem
                        onClick={() => openModal("earnings")}
                        className={`mb-2 cursor-pointer ${!isFeatureLive("earnings") ? "opacity-50" : ""}`}
                      >
                        <EarningIcon className="mr-2" />
                        <span className="ml-2 text-base md:text-sm 2xl:text-lg">
                          Earnings
                        </span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => openModal("callHistory")}
                      className={`mb-2 cursor-pointer ${!isFeatureLive("callHistory") ? "opacity-50" : ""}`}
                    >
                      <CallHistoryIcon className="mr-2" />
                      <span className="ml-2 text-base md:text-sm 2xl:text-lg">
                        Call history
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openModal("passwordUpdate")}
                      className={`mb-2 cursor-pointer ${!isFeatureLive("passwordUpdate") ? "opacity-50" : ""}`}
                    >
                      <ChangePasswordIcon className="mr-2" />
                      <span className="ml-2 text-base md:text-sm 2xl:text-lg">
                        Change password
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openModal("cardDetails")}
                      className={`mb-2 cursor-pointer ${!isFeatureLive("cardDetails") ? "opacity-50" : ""}`}
                    >
                      <CardDetailsIcon className="mr-2" />
                      <span className="ml-2 text-base md:text-sm 2xl:text-lg">
                        Payment Method
                      </span>
                    </DropdownMenuItem>
                    {isInfluencerSegment && (
                      <>
                        <DropdownMenuItem
                          onClick={() => openModal("transactionHistory")}
                          className={`mb-2 cursor-pointer ${!isFeatureLive("transactionHistory") ? "opacity-50" : ""}`}
                        >
                          <TransactionHistoryIcon className="mr-2" />
                          <span className="ml-2 text-base md:text-sm 2xl:text-lg">
                            Transaction history
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openModal("getPaid")}
                          className={`mb-2 cursor-pointer ${!isFeatureLive("getPaid") ? "opacity-50" : ""}`}
                        >
                          <GetPaidIcon className="mr-2" />
                          <span className="ml-2 text-base md:text-sm 2xl:text-lg">
                            Get Paid
                          </span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>
                  <div className="mb-8 2xl:mb-16">
                    <DashboardDivider />
                    <DropdownMenuItem
                      className="mt-4 cursor-pointer"
                      onClick={() => logout()}
                    >
                      <LogoutIcon className="mr-2" />
                      <span className="ml-2 text-basemd:text-sm 2xl:text-lg">
                        Log out
                      </span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </DashboardHeader>

      {modalType && LIVE_FEATURES.includes(modalType) && (
        <DashboardModal
          type={
            modalType as
              | "edit"
              | "passwordUpdate"
              | "cardDetails"
              | "earnings"
              | "callHistory"
          }
          isOpen={Boolean(modalType)}
          onClose={closeModal}
        />
      )}

      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/[0.7] backdrop-blur-sm w-full fade-in">
          <div className="relative rounded-lg w-11/12 md:w-[45%] mx-auto transform-gpu animate-flip-in overflow-hidden">
            <div className="flex items-center justify-center w-full">
              <section className="bg-popover backdrop-blur-3xl border-white/10 border p-0 w-full max-w-full rounded-lg lg:rounded-2xl shadow-lg relative overflow-hidden">
                <div className="bg-black/80 p-6 w-full pb-0 relative">
                  <Button
                    onClick={closeComingSoon}
                    variant="link"
                    className="absolute top-4 right-6 bg-white rounded-md p-0.5 w-6 h-6 flex items-center justify-center"
                  >
                    <span className="text-black text-lg">×</span>
                  </Button>
                  <div className="text-center py-12">
                    <h2 className="text-[24px] font-medium text-white mb-6">Coming Soon!</h2>
                    <p className="text-[14px] font-medium text-gray-300 mb-8 max-w-md mx-auto">
                      This feature is currently unavailable as we prepare for full public
                      launch. Stay tuned, it's coming soon!
                    </p>
                    <Button
                      onClick={closeComingSoon}
                      className="bg-white h-[38px] text-[14px] font-[300] w-3/4 mt-40 text-black px-8 py-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      Ok got it!
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardBoardLayout;