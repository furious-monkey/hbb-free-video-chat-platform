"use client";

import React from "react";
import Image from "next/image";

const InboxCard = ({ item, isClicked, onClick }) => {
  const statusClass = () => {
    switch (item.status) {
      case "Action required":
        return "bg-yellowbtn text-black";
      case "Accepted":
        return "bg-armyGreen text-white";
      case "Rejected":
        return "bg-red text-white";
      default:
        return "";
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case "admin":
        return "Text";
      case "call":
        return "Call request";
      case "gift":
        return "Gifted";
      default:
        return "";
    }
  };

  return (
    <div
      className={`p-3 mb-2 mr-1 rounded-[15px] relative cursor-pointer ${
        isClicked ? "bg-base1" : "bg-[#ffffff20]"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center text-[12px]">
          <div
            className={`w-10 h-10 ${
              item?.type === "admin" ? "bg-base1" : "bg-black"
            } rounded-full`}
          >
            <img
              src={item?.chatImg}
              alt={item?.name}
              className="w-10 h-10 rounded-full"
            />
          </div>

          <div className="ml-1">
            <h3 className="text-[14px] flex items-center font-[400]">
              {item?.type === "admin" ? "Admin" : item?.name}
              {item?.type === "admin" && (
                <Image
                  src="/assests/adminVerification.svg"
                  alt="report"
                  className="ml-[2px]"
                  width={11}
                  height={9}
                />
              )}
            </h3>
            <p className="text-[12px] font-[100]">{getTypeText(item?.type)}</p>
          </div>
        </div>

        <p className="text-[10px] text-gray-500 absolute top-0 right-0 m-3">
          {item?.time}pm
        </p>
      </div>

      {item?.type === "call" && (
        <div className="flex items-center justify-between pl-3 pr-3 pt-[5px] pb-[5px] mt-2 rounded-[10px] bg-[#ffffff20]">
          <p className="text-[11px]">Request for call</p>
          <div
            className={`p-3 pt-1 pb-1 rounded-lg text-[11px] ${statusClass()}`}
          >
            {item?.status}
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxCard;
