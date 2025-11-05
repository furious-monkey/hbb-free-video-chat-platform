"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { CancelIcon, CallIcon } from "@/src/components/svgs/index";
import { getInitials } from "@/src/utils/functions";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";
import { Input } from "../../ui/input";

const JoinliveModal = ({ isOpen, onClose, item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [rate, setRate] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(e.target.value);
  };

  const { userDetails } = useUserStore(
    (state: any) => ({
      userDetails: state.userDetails,
    }),
    shallow
  );

  if (!isOpen) return null;


  return (
    <main className="fixed inset-0 z-50 flex items-center bg-[#00000099] justify-center bg-opacity-50 backdrop-filter backdrop-blur-[6px]">
      <div className="flex flex-col bg-base1 rounded-[15px] w-[93%] md:w-[70%] h-[80dvh] md:h-[67dvh] relative p-3">
        {/* Close button */}
        <Button
          className="bg-white absolute right-0 top-0 m-3 p-1 h-6 w-6 rounded-[5px]"
          onClick={onClose}
        >
          <CancelIcon className="h-5" />
        </Button>

        <div className="w-full flex flex-col md:flex-row items-center h-full">
          <div className="w-[100%] md:w-[57%] bg-white h-[40dvh] md:h-full rounded-[10px] flex items-center justify-center relative">
            {/* Skeleton loader until image loads */}
            {!imageLoaded && (
              <div className="skeleton w-full h-full mb-2 rounded-[10px]"></div>
            )}

            {/* Hidden img tag for triggering onLoad */}
            <img
              src={
                item?.user?.profileImageDetails?.url
                  ? item?.user?.profileImageDetails?.url
                  : "/icons/no_img.svg"
              }
              alt={item?.user?.firstName}
              className="hidden"
              onLoad={() => setImageLoaded(true)}
            />

            {imageLoaded && (
              <div
                className="absolute inset-0 bg-cover bg-center rounded-[10px]"
                style={{
                  backgroundImage: `url(${
                    item?.user?.profileImageDetails?.url || "/icons/no_img.svg"
                  })`,
                }}
              ></div>
            )}
          </div>

          <div className="w-[1px] hidden md:block bg-[#ffffff50] h-full md:ml-3"></div>

          <div className="w-[100%] md:w-[40%] h-full flex flex-col lg:pl-4 pt-4 pb-4">
            <div className="border-b border-[#ffffff50] flex flex-row md:flex-col items-center md:items-start justify-between w-full pb-3 mb-3">
              <p className="font-[500] text-[20px] lg:text-[32px]">
                {item?.user?.firstName} {item?.user?.lastName?.slice(0, 1)}
                {/* <span className="font-[100]">{item?.user?.age}</span> */}
              </p>
              <span className="font-[100] flex items-center text-[14px] lg:text-[12px] md:text-[10px] mt-1 gap-1">
                <svg
                  width="10"
                  height="15"
                  viewBox="0 0 12 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.168 6.5013C10.168 5.39623 9.72898 4.33643 8.94758 3.55502C8.16618 2.77362 7.10637 2.33464 6.0013 2.33464C4.89623 2.33464 3.83643 2.77362 3.05502 3.55502C2.27362 4.33643 1.83464 5.39623 1.83464 6.5013C1.83464 7.93964 3.21797 10.6938 6.0013 14.5455C8.78464 10.6938 10.168 7.93964 10.168 6.5013ZM6.0013 17.3346C2.11214 12.2596 0.167969 8.6488 0.167969 6.5013C0.167969 4.95421 0.78255 3.47047 1.87651 2.37651C2.97047 1.28255 4.45421 0.667969 6.0013 0.667969C7.5484 0.667969 9.03213 1.28255 10.1261 2.37651C11.2201 3.47047 11.8346 4.95421 11.8346 6.5013C11.8346 8.6488 9.89047 12.2596 6.0013 17.3346ZM6.0013 9.83463C5.11725 9.83463 4.2694 9.48345 3.64428 8.85833C3.01916 8.2332 2.66797 7.38536 2.66797 6.5013C2.66797 5.61725 3.01916 4.7694 3.64428 4.14428C4.2694 3.51916 5.11725 3.16797 6.0013 3.16797C6.88536 3.16797 7.7332 3.51916 8.35833 4.14428C8.98345 4.7694 9.33464 5.61725 9.33464 6.5013C9.33464 7.38536 8.98345 8.2332 8.35833 8.85833C7.7332 9.48345 6.88536 9.83463 6.0013 9.83463ZM6.0013 8.16797C6.44333 8.16797 6.86725 7.99237 7.17981 7.67981C7.49237 7.36725 7.66797 6.94333 7.66797 6.5013C7.66797 6.05927 7.49237 5.63535 7.17981 5.32279C6.86725 5.01023 6.44333 4.83464 6.0013 4.83464C5.55927 4.83464 5.13535 5.01023 4.82279 5.32279C4.51023 5.63535 4.33464 6.05927 4.33464 6.5013C4.33464 6.94333 4.51023 7.36725 4.82279 7.67981C5.13535 7.99237 5.55927 8.16797 6.0013 8.16797Z"
                    fill="#E688A3"
                  />
                </svg>

                <span className="ml-1">
                  {item?.user?.location || "No confirmed location"}
                </span>
              </span>
            </div>

            <div className="lg:!h-[50vh] lg:overflow-hidden lg:overflow-y-auto  lg:pb-8">
              <div className="w-full border-b border-[#ffffff50] pb-3">
                {item?.user?.profile?.zodiacSign && (
                  <div>
                    <p className="bg-yellowbtn w-max px-4 h-8 flex justify-center items-center pl-3 pr-3 rounded-[15px] text-black text-[12px] font-[100]">
                      ♒️{" "}
                      <span className="ml-2">
                        {item?.user.profile.zodiacSign}
                      </span>
                    </p>
                  </div>
                )}
                {item?.user?.profile?.interests?.length > 0 && (
                  <div>
                    <p className="text-[10px] mt-2 mb-2 font-[100]">
                      My interest
                    </p>
                    <div className="flex items-center gap-2 overflow-x-scroll no-scrollbar lg:flex lg:flex-wrap lg:overflow-x-hidden">
                      {item?.user?.profile?.interests?.map((interest) => (
                        <p
                          key={interest?.id}
                          className="bg-pink w-max h-6 flex justify-center pl-3 pr-3 items-center rounded-[15px] text-[10px] whitespace-nowrap font-[100]"
                        >
                          {interest}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <p className="font-[300] mb-2 mt-2 md:mb-0 text-[11px]">Bio</p>

                <p className="font-[100] min-h-12 text-[10px] break-words line-clamp-4 overflow-hidden mt-1">
                  {item?.user?.bio?.slice(0, 200) || "No bio available"}
                </p>
              </div>

              <div className="w-full flex flex-col items-center justify-center">
                <div className="flex w-full justify-between items-center mb-4">
                  <div className="w-[49%] h-[120px] pt-4">
                    <div className="flex mb-3 items-center w-full">
                      <p className="flex items-center justify-center bg-yellowbtn rounded-[50%] text-black font-[100] text-[12px] w-7 h-7">
                        {getInitials(
                          item?.user?.firstName,
                          item?.user?.lastName
                        )}
                      </p>{" "}
                      <p className="ml-1 font-[100] text-[14px]">Live caller</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-[100] mb-2">
                        Current rate
                      </p>
                      <div className="bg-[#9b978b] flex rounded-[5px] h-10">
                        <p className="placeholder-black text-[12px] outline-none ml-2 w-[90%] bg-[#00000000] flex justify-center items-center">
                          {item?.user?.profile?.callRate
                            ? "$" + `${item?.user?.profile?.callRate}`
                            : "No confirmed rate"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-[49%] h-[120px] pt-4">
                    <div className="flex mb-3 items-center w-full">
                      <p className="flex items-center justify-center bg-yellowbtn rounded-[50%] text-black font-[100] text-[12px] w-7 h-7">
                        {getInitials(
                          userDetails?.firstName,
                          userDetails?.lastName
                        )}
                      </p>{" "}
                      <p className="ml-1 font-[100] text-[14px]">You</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-[100] mb-2">Your offer</p>
                      <div className="bg-yellowbtn flex rounded-[5px] h-10">
                        {/* <input
                          className="placeholder-black text-[12px] outline-none ml-2 w-[90%] bg-[#00000000] "
                          type="text"
                          placeholder="$0.00"
                        /> */}

                        <Input
                          placeholder="0.00"
                          value={rate}
                          onChange={handleInputChange}
                          className="placeholder-black text-[12px] outline-none ml-2 w-[90%] bg-[#00000000] !border-0 "
                          numberOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="bg-white text-black text-[12px] h-10 rounded-[20px] shadow-custom-shadow-like w-full">
                  Enter your offer to join live
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-[14px] mt-2 lg:hidden"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default JoinliveModal;
