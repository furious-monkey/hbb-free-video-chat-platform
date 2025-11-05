import React, { useState } from "react";
import Image from "next/image";

const ProfileImage = ({
  profileImageUrl,
  name,
  size = "w-12 h-12",
  borderRadius = "50%",
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const noImg = !profileImageUrl || profileImageUrl === "";

  return (
    <div
      className={`relative rounded-full ${size} `}
      style={{ borderRadius }}
    >
      {imageLoaded && (
        <div className="absolute inset-0 bg-black opacity-20 rounded-full"></div>
      )}
      {!noImg && !imageLoaded && (
        <div className="skeleton w-full h-full mb-2 rounded-full"></div>
      )}
      <img
        src={profileImageUrl || "/icons/no_img.svg"}
        alt={name}
        className="h-full w-full rounded-full"
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
};

const Header = ({ clickedItem, goBack, isUserAdmin }) => (
  <div className="flex w-full justify-between items-center mt-4">
    <div className="flex items-center">
      <div className="md:h-full w-12 h-12 items-center justify-center md:flex">
        <ProfileImage
          profileImageUrl={clickedItem?.image?.src}
          name={clickedItem?.name}
        />
      </div>
      <p className="text-[15px] ml-2">
        {isUserAdmin ? (
          <>
            Admin{" "}
            <Image
              src="/assests/adminVerification.svg"
              alt="report"
              className="ml-[2px]"
              width={11}
              height={9}
            />
          </>
        ) : (
          clickedItem?.name
        )}
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
);

const CallRequestActions = ({ status, openCalenderModal }) => (
  <div className="flex items-center gap-1">
    {status === "Accepted" ? (
      <div className="flex items-center gap-[1px] h-6 pr-2 pl-2 bg-armyGreen text-[10px] rounded-[7px]">
        Accepted
      </div>
    ) : status === "Rejected" ? (
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
);

const ContentCard = ({ title, children }) => (
  <div className="flex items-center w-full rounded-[10px] bg-[#ffffff20] pt-2 pb-2 pl-3 pr-3 mt-3 md:mt-4 mb-3 md:mb-4">
    <p className="text-[12px]">{title}</p>
    {children}
  </div>
);

const CallDetails = ({ clickedItem, openProfile, profileImageUrl }) => (
  <div className="flex flex-col">
    <div className="p-3 md:py-3 md:pl-4 md:pr-7 rounded-[15px] flex justify-between items-center bg-white">
      <div className="md:h-full md:w-[35%] items-center justify-center hidden md:flex">
        <ProfileImage
          profileImageUrl={profileImageUrl}
          name={clickedItem?.name}
          size="md:h-[300px] w-[100%]"
          borderRadius="15px"
        />
      </div>
      <div className="text-black h-full md:ml-5 md:mt-1 md:mb-3 w-full md:w-[60%]">
        <UserProfileDetails clickedItem={clickedItem} />
      </div>
    </div>
    <p className="text-[#ffffff] text-xs font-normal md:hidden bottom-3 my-4 ml-auto">
      24, March. 2024
    </p>
  </div>
);

const UserProfileDetails = ({ clickedItem }) => (
  <>
    <div className="flex items-center">
      <div className="h-10 w-10 items-center justify-center flex md:hidden rounded-full">
        <ProfileImage
          profileImageUrl={clickedItem?.image?.src}
          name={clickedItem?.name}
        />
      </div>
      <div className="flex flex-col pb-2 md:border-b border-base1 md:w-full ml-2 md:ml-0">
        <p className="text-[13px] md:text-[17px] font-[500] mb-1">
          {clickedItem?.name}
        </p>
        <p className="text-[10px] flex font-[100] items-center">
          <Image
            src="/assests/location_grey.svg"
            alt="report"
            className="mr-[2px]"
            width={9}
            height={9}
          />
          <span className="ml-1">{clickedItem?.location}</span>
        </p>
      </div>
    </div>
    <div className="flex flex-col pt-2 pb-2 md:border-b md:border-base1 w-full">
      <div className="flex items-center gap-1">
        <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
          {clickedItem?.sign}
        </p>
        <p className="bg-yellowbtn font-[100] text-[10px] pr-2 pl-2 rounded-[15px] flex items-center justify-center h-6">
          {clickedItem?.gender}
        </p>
      </div>
      <p className="text-[10px] font-[100] mt-2 mb-2">My interest</p>
      <div className="flex border-b border-[#00000015] md:border-[#ffffff] md:border-0 pb-2 md:pb-0 font-[100] items-center gap-1 overflow-auto w-full ">
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
  </>
);

const GiftDetails = ({ clickedItem, profileImageUrl, openProfile }) => (
  <div className="flex flex-col md:flex-row items-center justify-between w-full md:h-[30dvh] gap-4">
    <div className="bg-base1 rounded-[10px] border border-[#afdbec] flex flex-col items-center mb-3 md:mb-0 justify-center w-[90%] md:w-[30%] h-[200px] md:h-full">
      <Image
        src="/assests/chest.svg"
        alt="no live active"
        width={100}
        height={100}
        className="mx-auto"
      />
      <p className="text-xs border-b w-20 text-[#ffffff90] text-center pb-1 mb-1 border-[#ffffff90]">
        Gold bunny
      </p>
      <p className="text-[20px]">$300</p>
    </div>
    <div className="bg-white p-4 md:p-2 rounded-[15px] flex md:flex-row flex-col md:items-center min-h-[50dvh] md:h-full w-full md:w-[70%] mb-5 md:mb-0">
      <div className="flex items-center w-full h-full md:px-4">
        <ProfileImage
          profileImageUrl={profileImageUrl}
          name={clickedItem?.name}
          size="md:h-full w-40 h-40"
        />
        <div className="text-black ml-2 md:w-full">
          <UserProfileDetails clickedItem={clickedItem} />
          <p
            onClick={openProfile}
            className="text-base1 hidden md:block text-[12px] cursor-pointer mt-2"
          >
            View profile here
          </p>
        </div>
      </div>
    </div>
    <p className="text-[#ffffff] text-xs font-normal md:hidden bottom-3 mt-1 mb-4 ml-auto">
      24, March. 2024
    </p>
  </div>
);

const InboxDetails = ({
  clickedItem,
  goBack,
  openCalenderModal,
  openProfile,
}) => {
  if (!clickedItem) return null;

  const isUserAdmin = clickedItem.type === "admin";
  const profileImageUrl = clickedItem?.image?.src;

  return (
    <div className="md:w-[60%] w-full absolute bg-pink rounded-[20px] md:relative p-4 h-full md:h-full">
      <Header
        clickedItem={clickedItem}
        goBack={goBack}
        isUserAdmin={isUserAdmin}
      />
      <div className="flex w-full flex-col md:flex-row md:items-center md:justify-between mt-4 md:mb-0 md:h-5">
        <p className="text-[12px] mb-1 md:mb-0">
          {clickedItem?.type === "call"
            ? "Call request"
            : isUserAdmin
            ? "Title"
            : clickedItem?.type === "gift"
            ? "Gifted"
            : ""}
        </p>
        {clickedItem?.type === "call" && (
          <CallRequestActions
            status={clickedItem?.status}
            openCalenderModal={openCalenderModal}
          />
        )}
      </div>
      <ContentCard
        title={
          clickedItem?.type === "call"
            ? "Hi! i would like to schedule a new time at 09:00 PM today."
            : clickedItem?.type === "admin"
            ? "Text"
            : clickedItem?.type === "gift"
            ? "Hello!  you’ve been gifted bronze bunny on HBB by James an Explorer."
            : ""
        }
      />
      {clickedItem?.type === "call" && (
        <CallDetails
          clickedItem={clickedItem}
          profileImageUrl={profileImageUrl}
        />
      )}
      {clickedItem?.type === "gift" && (
        <GiftDetails
          clickedItem={clickedItem}
          profileImageUrl={profileImageUrl}
          openProfile={openProfile}
        />
      )}
    </div>
  );
};

export default InboxDetails;
