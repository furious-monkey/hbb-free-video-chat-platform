"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { CancelIcon, CallIcon } from "@/src/components/svgs/index";
import { LikedExplorerProfilesInterface } from "@/src/utils/interface";
import Image from "next/image";

interface Props {
  item: LikedExplorerProfilesInterface | null;
  isOpen: boolean;
  onClose: () => void;
  openReport: (item: any) => void;
  openRequestCall: (item: any) => void;
  openGift: (item: any) => void;
}

const ViewProfileModal = ({
  isOpen,
  onClose,
  item,
  openReport,
  openRequestCall,
  openGift,
}: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!isOpen) return null;

  const profileImageUrl = item?.profileImageDetails?.url;
  const noImg = !profileImageUrl || profileImageUrl === "";

  return (
    <main className="fixed inset-0 z-50 flex items-center bg-[#00000099] justify-center bg-opacity-50 backdrop-filter backdrop-blur-[6px]">
      <div className="flex flex-col bg-base1 rounded-[15px] w-[93%] md:w-[70%] h-[80dvh] md:h-[67dvh] relative p-3">
        {/* close button */}
        <Button
          className="bg-white absolute right-0 top-0 m-3 p-1 h-6 w-6 rounded-[5px]"
          onClick={onClose}
        >
          <CancelIcon className="h-5" />
        </Button>

        <div className="w-full flex flex-col md:flex-row items-center h-full">
          <div
            className="relative p-2 rounded-[4px] h-[40dvh] md:h-full w-[100%] md:w-[57%]"
            style={{
              backgroundImage: imageLoaded
                ? `url(${profileImageUrl || "/icons/no_img.svg"})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#000", // fallback color
            }}
          >
            {/* Black opacity overlay */}
            {imageLoaded && (
              <div className="absolute inset-0 bg-black opacity-20 rounded-[4px]"></div>
            )}
            {/* Skeleton loader until image loads */}
            {!noImg && !imageLoaded && (
              <div className="skeleton w-full h-full mb-2"></div>
            )}
            {/* Hidden img tag for triggering onLoad */}
            <img
              src={profileImageUrl || "/icons/no_img.svg"}
              alt={item?.firstName}
              className="hidden"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="w-[1px] hidden md:block bg-[#ffffff50] h-full md:ml-3"></div>

          <div className="w-[100%] md:w-[40%] h-full flex flex-col pt-4 pb-4 lg:pl-4">
            <div className="border-b border-[#ffffff50] flex flex-row md:flex-col items-center md:items-start justify-between w-full pb-3 mb-3">
              <p className="font-[500] text-[20px] lg:text-[32px]">
                {item?.firstName} {item?.lastName?.slice(0, 1)}
                {/* <span className="font-[100]">{item?.age}</span> */}
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
                  {item?.profile?.location || "No confirmed location"}
                </span>
              </span>
            </div>

            <div className="w-full border-b border-[#ffffff50] pb-3">
              {item?.profile?.zodiacSign && (
                <div>
                  <p className="bg-yellowbtn w-max px-4 h-8 flex justify-center items-center pl-3 pr-3 rounded-[15px] text-black text-[12px] font-[100]">
                    ♒️ <span className="ml-2">{item?.profile.zodiacSign}</span>
                  </p>
                </div>
              )}
              {item?.profile?.interests &&
                item?.profile?.interests?.length > 0 && (
                  <div>
                    <p className="text-[10px] mt-2 mb-2 font-[100]">
                      My interest
                    </p>
                    <div className="flex items-center gap-2 overflow-x-scroll no-scrollbar lg:flex lg:flex-wrap lg:overflow-x-hidden">
                      {item?.profile?.interests?.map((interest) => (
                        <p
                          key={interest}
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
                {item?.profile?.bio?.slice(0, 200) || "No bio available"}
              </p>
            </div>

            <div className="w-full border-b border-[#ffffff50] pt-4 pb-4">
              <p className="font-[400] text-[15px]">Request call</p>
              <p className="font-[100] text-[10px] mt-2 mb-1">Current rate</p>
              <p className="bg-darkPurple font-[100] text-[14px] w-[150px] rounded-[5px] h-10 flex items-center pl-3 pr-3">
                {item?.profile?.callRate ? `$${item?.profile?.callRate}` : "$0"}
              </p>
            </div>

            <div className="w-full flex items-center justify-between pt-3 mt-1">
              <Button
                onClick={openRequestCall}
                className="w-max justify-center shadow-custom-shadow-like !lg:w-[140px] items-center h-[40px] md:h-10 bg-pink text-black text-[14px] md:text-[12px] rounded-[20px] gap-2"
              >
                Request call <CallIcon className="w-[15px] h-[15px]" />
              </Button>
              <Button
                onClick={openGift}
                className="w-max shadow-custom-shadow-sm justify-center items-center h-[40px] md:h-10 bg-pink text-black text-[14px] md:text-[12px] rounded-[20px] gap-2"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M25.9518 9.13763H21.2249C21.5292 8.70809 21.6702 8.18396 21.6222 7.65968C21.5744 7.13548 21.3409 6.64557 20.9637 6.27826C20.5865 5.91095 20.0906 5.69039 19.5653 5.6563C19.0399 5.62222 18.5196 5.77685 18.0982 6.09235L15.2295 8.23933L13.4943 6.21632C13.3054 5.9961 13.075 5.81524 12.8163 5.68406C12.5575 5.55287 12.2754 5.47395 11.9861 5.45178C11.6969 5.4296 11.406 5.46461 11.1303 5.55482C10.8545 5.64502 10.5993 5.78865 10.379 5.97751C10.1588 6.16636 9.97788 6.39673 9.84675 6.65548C9.71555 6.91423 9.6366 7.19628 9.61442 7.48554C9.59224 7.77481 9.62722 8.06556 9.71749 8.34128C9.80768 8.617 9.95131 8.87226 10.1402 9.09246L10.179 9.13808H4.95154C4.72404 9.13808 4.50586 9.22842 4.34499 9.38924C4.18412 9.55014 4.09375 9.76826 4.09375 9.99575V13.3382C4.09387 13.5657 4.18435 13.7838 4.34528 13.9447C4.50622 14.1055 4.72446 14.1959 4.95199 14.1959H5.58554V27.5035C5.58554 27.8215 5.71188 28.1264 5.93676 28.3513C6.16165 28.5761 6.46666 28.7025 6.7847 28.7025H24.1209C24.4385 28.7025 24.7431 28.5764 24.9676 28.3519C25.1922 28.1273 25.3183 27.8228 25.3183 27.5053V14.1977H25.9518C26.1793 14.1977 26.3976 14.1073 26.5586 13.9465C26.7195 13.7857 26.81 13.5675 26.8101 13.34V9.99762C26.8103 9.88472 26.7883 9.77295 26.7453 9.66861C26.7023 9.56428 26.6391 9.46947 26.5593 9.38962C26.4796 9.30969 26.3849 9.24636 26.2807 9.20312C26.1764 9.15988 26.0647 9.13763 25.9518 9.13763Z"
                    fill="black"
                  />
                  <path
                    d="M13.0104 3.44793L10.067 5.97229C9.95364 6.06947 9.94062 6.24009 10.0378 6.35338L15.208 12.3808C15.3052 12.4941 15.4759 12.5071 15.5892 12.41L18.5326 9.88566C18.646 9.78847 18.659 9.61783 18.5618 9.50457L13.3915 3.47713C13.2944 3.36383 13.1237 3.35076 13.0104 3.44793Z"
                    fill="#E687A3"
                    stroke="black"
                    strokeWidth="1.5"
                    stroke-miterlimit="10"
                  />
                  <path
                    d="M23.5121 6.82991L21.1887 3.72553C21.0993 3.60603 20.9299 3.58165 20.8104 3.67109L14.4521 8.42893C14.3326 8.51838 14.3082 8.68776 14.3977 8.8072L16.7211 11.9116C16.8105 12.0311 16.9799 12.0555 17.0994 11.966L23.4577 7.20821C23.5772 7.11878 23.6016 6.94941 23.5121 6.82991Z"
                    fill="#E687A3"
                    stroke="black"
                    strokeWidth="1.5"
                    stroke-miterlimit="10"
                  />
                  <path
                    d="M26.4765 11.2348V26.2433C26.4765 26.5607 26.3504 26.8653 26.1259 27.0898C25.9013 27.3143 25.5968 27.4404 25.2792 27.4404H7.94528C7.62721 27.4404 7.32221 27.3142 7.09732 27.0893C6.87243 26.8644 6.74609 26.5594 6.74609 26.2414V11.233C6.74609 10.6946 6.95997 10.1784 7.34068 9.79766C7.72142 9.417 8.23774 9.20312 8.77616 9.20312H24.4447C24.9836 9.20312 25.5004 9.41723 25.8814 9.79818C26.2625 10.1792 26.4765 10.696 26.4765 11.2348Z"
                    fill="#F2EE98"
                    stroke="black"
                    strokeWidth="1.5"
                    stroke-miterlimit="10"
                  />
                  <path
                    d="M27.1081 7.875H6.10824C5.63425 7.875 5.25 8.25922 5.25 8.7332V12.0747C5.25 12.5486 5.63425 12.9329 6.10824 12.9329H27.1081C27.5821 12.9329 27.9663 12.5486 27.9663 12.0747V8.7332C27.9663 8.25922 27.5821 7.875 27.1081 7.875Z"
                    fill="#F2EE98"
                    stroke="black"
                    strokeWidth="1.5"
                    stroke-miterlimit="10"
                  />
                  <path
                    d="M18.2929 7.875H14.9219V27.4395H18.2929V7.875Z"
                    fill="#E687A3"
                    stroke="black"
                    strokeWidth="1.5"
                    stroke-miterlimit="10"
                  />
                </svg>
              </Button>
              <div className="border-r w-[1px] h-full border-[#ffffff50]"></div>
              <Button
                onClick={openReport}
                className="border border-white rounded-[20px] text-[14px] md:text-[12px] h-[40px] md:h-10 bg-transparent font-[100] w-max"
              >
                Report
              </Button>
            </div>
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
    </main>
  );
};

export default ViewProfileModal;
