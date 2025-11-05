"use client";

import { MapPin, Search, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { InfluencerData } from "./index.types";
import ProfileModal from "./ProfileModal";
import FlagModal from "./FlagModal";
import InfluencerTable from "./ModelTable";

const InfluencerTableData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openProfile, setOpenProfile] = useState(false);
  const [openFlagData, setOpenFlagData] = useState(false);

  const [inputActive, setInputActive] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const handleDivClick = () => {
    setInputActive(true);
  };

  const handleBlur = (e) => {
    if (!searchTerm && !e.currentTarget.contains(e.relatedTarget)) {
      setInputActive(false);
    }
  };

  useEffect(() => {
    if (inputActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputActive]);

  return (
    <>
      {modelsData.length > 0 ? (
        <div className="rounded-t-20 bg-[#FFFFFF1F] w-full lg:p-5 p-3">
          <div className="flex items-center justify-between mb-3">
            <p>List of all models</p>

            <div className="h-7 w-7 lg:h-9 lg:w-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Image
                src={"/assests/thrash.svg"}
                alt={""}
                height={20}
                width={20}
              />
            </div>
          </div>

          <div className="rounded-20 bg-white w-full h-full">
            <div
              onBlur={handleBlur}
              className="w-full flex items-center justify-between p-3 pl-2 lg:px-6 border-b-2 border-base2"
            >
              <div
                onClick={handleDivClick}
                className={`flex items-center p-2 lg:px-3 border border-[#E3DFE1] rounded-md gap-1 h-8 ${
                  inputActive ? "border-base1" : "w-8 lg:w-72 "
                }`}
              >
                <Search className="mr-2 h-4 w-4 shrink-0 text-[#AAAAAA]" />

                <Input
                  placeholder="Search here"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                  className={`text-xs placeholder:text-[#AAAAAA] p-0 border-0 ring-0 focus:border-0 ${
                    inputActive ? "block" : "hidden lg:block"
                  }`}
                />
              </div>

              <div className={`${inputActive ? "hidden lg:block" : "block"}`}>
                <p className="text-base1">Clear Filter</p>
              </div>
            </div>

            <InfluencerTable
              modelsData={modelsData}
              searchTerm={searchTerm}
              setOpenProfile={setOpenProfile}
              setOpenFlagData={setOpenFlagData}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-20 bg-[#FFFFFF1F] h-[362px] lg:h-[415px] w-full p-3 lg:py-8 lg:px-5">
          <div className="bg-[#FFFFFF1F] rounded-20 w-full h-full">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Image
                src={"/assests/empty-graph.svg"}
                alt={""}
                width={122}
                height={122}
                className="w-20 h-20 lg:w-[122px] lg:h-[122px]"
              />

              <p className="text-lg lg:text-2xl lg:mt-5 mt-8">
                No user added yet!
              </p>
            </div>
          </div>
        </div>
      )}

      {openProfile && <ProfileModal setOpenProfile={setOpenProfile} />}
      {openFlagData && <FlagModal setOpenFlagData={setOpenFlagData} />}
    </>
  );
};

export default InfluencerTableData;

const modelsData: InfluencerData[] = [
  {
    id: "01",
    name: "Inna Jackson",
    memberSince: "Aug 07, 2019",
    liveCalls: 487,
    callRequests: 678,
    gifts: 56,
    likes: "23k",
    flags: "25k",
    status: "active",
    totalEarnings: "$4643.65",
  },
  {
    id: "12",
    name: "Emily Smith",
    memberSince: "Sep 01, 2000",
    liveCalls: 333,
    callRequests: 621,
    gifts: 28,
    likes: "12k",
    flags: "25k",
    status: "active",
    totalEarnings: "$3251.02",
  },
  {
    id: "23",
    name: "Sophia Johnson",
    memberSince: "Sep 19, 2010",
    liveCalls: 321,
    callRequests: 497,
    gifts: 25,
    likes: "11k",
    flags: "25k",
    status: "suspended",
    totalEarnings: "$3251.02",
  },
  {
    id: "34",
    name: "Ava Brown",
    memberSince: "Sep 19, 2010",
    liveCalls: 321,
    callRequests: 497,
    gifts: 25,
    likes: "9k",
    flags: "25k",
    status: "active",
    totalEarnings: "$3251.02",
  },
  {
    id: "45",
    name: "Olivia Davis",
    memberSince: "Sep 19, 2010",
    liveCalls: 321,
    callRequests: 497,
    gifts: 25,
    likes: "9k",
    flags: "25k",
    status: "suspended",
    totalEarnings: "$4643.65",
  },
  {
    id: "56",
    name: "Isabella Wilson",
    memberSince: "Sep 19, 2010",
    liveCalls: 321,
    callRequests: 497,
    gifts: 25,
    likes: "9k",
    flags: "25k",
    status: "active",
    totalEarnings: "$3630.44",
  },
  {
    id: "67",
    name: "Mia Martinez",
    memberSince: "Sep 19, 2010",
    liveCalls: 321,
    callRequests: 497,
    gifts: 25,
    likes: "9k",
    flags: "25k",
    status: "active",
    totalEarnings: "$3251.02",
  },
  {
    id: "78",
    name: "Charlotte Anderson",
    memberSince: "Sep 19, 2010",
    liveCalls: 321,
    callRequests: 497,
    gifts: 25,
    likes: "9k",
    flags: "25k",
    status: "active",
    totalEarnings: "$3251.02",
  },
];
