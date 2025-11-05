import React from "react";
import Image from "next/image";

const InboxDetails = ({
  clickedItem,
  goBack,
  openCalenderModal,
  openProfile,
}) => {
  if (!clickedItem) {
    return null;
  }

  return (
    <div className="md:w-[60%] w-full absolute bg-pink rounded-[20px] md:relative p-4 h-full md:h-full">
      {clickedItem.type !== "admin" ? (
        <div className="flex w-full justify-between items-center mt-4">
          <div className="flex items-center">
            <Image
              onClick={goBack}
              src="/assests/arrowLeft.svg"
              alt="report"
              className="mr-2 cursor-pointer"
              width={12}
              height={9}
            />
            <div className="bg-black rounded-full w-10 h-10 flex items-center justify-center"></div>
            <p className="text-[15px] ml-2">{clickedItem?.name}</p>
          </div>
          <div>
            <Image
              src="/assests/dashboard/trash.svg"
              alt="report"
              className="ml-[2px]"
              width={20}
              height={9}
            />
          </div>
        </div>
      ) : (
        <div className="flex w-full justify-between items-center mt-4">
          <div className="flex items-center">
            <Image
              onClick={goBack}
              src="/assests/arrowLeft.svg"
              alt="report"
              className="mr-2 cursor-pointer"
              width={12}
              height={9}
            />

            <div className="bg-base1 rounded-full w-10 h-10 flex items-center justify-center"></div>
            <p className="text-[15px] flex items-center ml-2">
              Admin{" "}
              <Image
                src="/assests/adminVerification.svg"
                alt="report"
                className="ml-[2px]"
                width={11}
                height={9}
              />
            </p>
          </div>
          <div>
            <Image
              src="/assests/dashboard/trash.svg"
              alt="report"
              className="ml-[2px]"
              width={20}
              height={9}
            />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col md:flex-row md:items-center md:justify-between mt-4 md:mb-0 md:h-5">
        <p className="text-[12px] mb-1 md:mb-0">
          {clickedItem?.type === "call"
            ? "Call request"
            : clickedItem?.type === "admin"
            ? "Title"
            : clickedItem?.type === "gift"
            ? "Gifted"
            : ""}
        </p>

        {clickedItem?.type === "call" && (
          <div className="flex items-center gap-1">
            {clickedItem?.status === "Accepted" ? (
              <div className="flex items-center gap-[1px] h-6 pr-2 pl-2 bg-armyGreen text-[10px] rounded-[7px]">
                Accepted
              </div>
            ) : clickedItem?.status === "Rejected" ? (
              <div className="flex items-center gap-[1px] h-6 pr-2 pl-2 bg-red text-[10px] rounded-[7px]">
                Rejected
              </div>
            ) : (
              <>
                <button className="flex items-center gap-[1px] h-6 pr-2 pl-2 bg-armyGreen text-[10px] rounded-[7px]">
                  Accept
                </button>
                <button className="flex items-center gap-[1px] h-6 pr-2 pl-2 bg-red text-[10px] rounded-[7px]">
                  Reject
                </button>
                <button
                  onClick={openCalenderModal}
                  className="flex items-center gap-[1px] h-6 pr-2 pl-2 bg-base1 text-[10px] rounded-[7px]"
                >
                  Propose time
                  <Image
                    src="/assests/dashboard/time.svg"
                    alt="report"
                    className="ml-[2px]"
                    width={12}
                    height={9}
                  />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center w-full rounded-[10px] bg-[#ffffff20] pt-2 pb-2 pl-3 pr-3 mt-3 md:mt-4 mb-3 md:mb-4">
        <p className="text-[12px]">
          {clickedItem?.type === "call"
            ? "Hi! i would like to schedule a new time at 09:00 PM today."
            : clickedItem?.type === "admin"
            ? "Text"
            : clickedItem?.type === "gift"
            ? "Hello!  you’ve been gifted bronze bunny on HBB by James an Explorer."
            : ""}
        </p>
      </div>

      {clickedItem?.type === "call" && (
        <div className="p-3 md:p-4 rounded-[15px] flex items-center bg-white">
          <div className="h-full w-[35%] items-center justify-center hidden md:flex rounded-full bg-base1"></div>

          <div className="text-black h-full md:ml-5 w-full md:w-[60%]">
            <div className="flex items-center">
              <div className="h-10 w-10 items-center justify-center flex md:hidden rounded-full bg-base1"></div>
              <div className="flex flex-col pb-2 md:border-b border-base1 md:w-full">
                <p className="text-[13px] md:text-[17px] font-[500] mb-1">
                  {clickedItem?.name},{" "}
                  <span className="font-[100]">{clickedItem?.age}</span>
                </p>
                <p className="text-[10px] flex font-[100] items-center">
                  {" "}
                  <Image
                    src="/assests/location-white.svg"
                    alt="report"
                    className="mr-[2px]"
                    width={17}
                    height={9}
                  />
                  {clickedItem?.location}
                </p>
              </div>
            </div>

            <div className="flex flex-col pt-2 pb-2 md:border-b md:border-base w-full">
              <div className="flex items-center gap-1">
                <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
                  {clickedItem?.sign}
                </p>
                <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
                  {clickedItem?.gender}
                </p>
              </div>
              <p className="text-[10px] font-[100] mt-2 mb-2">My interest</p>

              <div className="flex border-b border-[#00000015] md:border-none pb-2 md:pb-0 font-[100] items-center gap-1 overflow-auto w-full ">
                {clickedItem?.interests.map((interest, index) => (
                  <p
                    key={index}
                    className="text-[10px] font-[100] text-white bg-base1 rounded-[15px] flex items-center justify-center h-6 pl-2 pr-2"
                  >
                    {interest}
                  </p>
                ))}
              </div>

              <div className="text-[10px] font-[100] flex flex-col">
                <p>Bio</p>
                <p>{clickedItem?.bio}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {clickedItem?.type === "gift" && (
        <div className="flex flex-col md:flex-row items-center justify-between w-full md:h-[30dvh]">
          <div className="bg-base1 rounded-[10px] border border-[#afdbec] flex flex-col items-center mb-3 md:mb-0 justify-center w-[250px] md:w-[38%] h-[200px] md:h-full">
            <img src="" className="h-24" alt="Gold bunny" />
            <p className="text-[9px] border-b w-20 text-[#ffffff90] text-center pb-1 mb-1 border-[#ffffff90]">
              Gold bunny
            </p>
            <p className="text-[20px]">$300</p>
          </div>

          <div className="bg-white p-4 md:p-2 rounded-[15px] flex md:flex-row flex-col md:items-center h-[40dvh] md:h-full w-full md:w-[60%] mb-5 md:mb-0">
            <div className="flex items-center">
              <div className="bg-base1 rounded-full w-[70px] h-[70px] md:w-[120px] md:h-[120px]"></div>
              <div className="text-black ml-2 w-[53%]">
                <p className="text-[15px] md:text-[17px] font-[500] mb-1">
                  {clickedItem?.name},{" "}
                  <span className="font-[100]">{clickedItem?.age}</span>
                </p>
                <p className="text-[10px] flex font-[100] items-center pb-2 md:border-b md:border-[#00000010]">
                  {" "}
                  <Image
                    src="/assests/location-white.svg"
                    alt="report"
                    className="mr-[2px]"
                    width={17}
                    height={9}
                  />
                  {clickedItem?.location}
                </p>
                <p
                  onClick={openProfile}
                  className="text-base1 hidden md:block text-[12px] cursor-pointer mt-2"
                >
                  View profile here
                </p>
              </div>
            </div>

            <div className="md:hidden mt-3">
              <div className="flex items-center gap-1">
                <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
                  {clickedItem?.sign}
                </p>
                <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
                  {clickedItem?.gender}
                </p>
              </div>
              <p className="text-[10px] font-[100] mt-2 mb-2">My interest</p>

              <div className="flex border-b border-[#00000015] md:border-none pb-2 md:pb-0 font-[100] items-center gap-1 md:overflow-auto overflow-hidden w-full  flex-wrap md:flex-nowrap">
                {clickedItem?.interests.map((interest, index) => (
                  <p
                    key={index}
                    className="text-[10px] font-[100] text-white bg-base1 rounded-[15px] flex items-center justify-center h-6 pl-2 pr-2 mb-1 md:mb-0"
                  >
                    {interest}
                  </p>
                ))}
              </div>

              <div className="text-[10px] text-black font-[100] flex flex-col">
                <p>Bio</p>
                <p>{clickedItem?.bio}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxDetails;
