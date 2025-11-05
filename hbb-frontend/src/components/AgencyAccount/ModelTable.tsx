"use client";

import React, { useState } from "react";
import { InfluencerData } from "./index.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { DotsHorizontalIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { Maximize2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import Image from "next/image";

interface Props {
  modelsData: InfluencerData[];
  searchTerm: string;
  setOpenProfile: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenFlagData: React.Dispatch<React.SetStateAction<boolean>>;
}

const InfluencerTable = ({
  modelsData,
  searchTerm,
  setOpenProfile,
  setOpenFlagData,
}: Props) => {
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInfluencers(modelsData.map((influencer) => influencer.id));
    } else {
      setSelectedInfluencers([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInfluencers([...selectedInfluencers, id]);
    } else {
      setSelectedInfluencers(
        selectedInfluencers.filter((modelId) => modelId !== id)
      );
    }
  };

  const filteredInfluencers = modelsData.filter((influencer) =>
    influencer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* laptops */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader className="hidden lg:table-header-group">
            <TableRow className="border-b border-base2 text-[#475467] text-sm text-nowrap">
              <TableHead className="2xl:w-[68px] w-12 p-0">
                <div className="flex items-center justify-center 2xl:w-[68px] w-12 lg:px-6 px-3">
                  <Checkbox
                    checked={
                      selectedInfluencers.length === filteredInfluencers.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(checked as boolean)
                    }
                    className="2xl:h-5 2xl:w-5 border-borderGray data-[state=checked]:bg-base2 data-[state=checked]:border-none data-[state=checked]:text-white"
                  />
                </div>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Member since</TableHead>
              <TableHead>Live calls</TableHead>
              <TableHead>Call requests</TableHead>
              <TableHead>Gifts</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total earnings</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredInfluencers.map((influencer) => (
              <TableRow
                key={influencer.id}
                className="text-[#101828] font-light border-[#E688A31F] text-nowrap"
              >
                <TableCell className="2xl:w-[68px] w-12 p-0">
                  <div className="flex items-center justify-center 2xl:w-[68px] w-12 lg:px-6 px-3">
                    <Checkbox
                      checked={selectedInfluencers.includes(influencer.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(influencer.id, checked as boolean)
                      }
                      className="2xl:h-5 2xl:w-5 border-borderGray data-[state=checked]:bg-base2 data-[state=checked]:border-none data-[state=checked]:text-white"
                    />
                  </div>
                </TableCell>

                <TableCell
                  className={`flex items-center gap-3 font-normal ${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full shrink-0 bg-base2" />
                  {influencer.name}
                </TableCell>

                <TableCell
                  className={`${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  {influencer.memberSince}
                </TableCell>

                <TableCell
                  className={`${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  {influencer.liveCalls}
                </TableCell>

                <TableCell
                  className={`${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  {influencer.callRequests}
                </TableCell>

                <TableCell
                  className={`${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  {influencer.gifts}
                </TableCell>

                <TableCell
                  className={`${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  {influencer.likes}
                </TableCell>

                <TableCell
                  className={`cursor-pointer ${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                  onClick={() => setOpenFlagData(true)}
                >
                  <div className="flex items-center gap-2">
                    <p>{influencer.flags}</p>
                    <Maximize2 size={12} className="text-base1" />
                  </div>
                </TableCell>

                <TableCell
                  className={`${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  <div className="flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-base1" />
                    <p
                      className={`font-bold capitalize ${
                        influencer.status === "active"
                          ? "text-base1"
                          : "text-base2"
                      }`}
                    >
                      {influencer.status}
                    </p>
                  </div>
                </TableCell>

                <TableCell
                  className={`font-medium ${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  {influencer.totalEarnings}
                </TableCell>

                <TableCell
                  className={`px-2 2xl:px-4 ${
                    influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
                  }`}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="text-[#475467] data-[state=open]:text-base2 cursor-pointer"
                    >
                      <DotsVerticalIcon className="h-5 w-5" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="bg-white text-black border-0 p-0"
                    >
                      <DropdownMenuItem
                        onClick={() => setOpenProfile(true)}
                        className="py-2 px-3 flex items-center gap-2 bg-[#F1FBFF] cursor-pointer"
                      >
                        <Image
                          src="/assests/avatar.svg"
                          alt=""
                          width={16}
                          height={16}
                        />
                        <p className="text-sm text-base1">View profile</p>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="py-2 px-3 flex items-center gap-2 cursor-pointer">
                        <Image
                          src="/assests/thrash.svg"
                          alt=""
                          width={16}
                          height={16}
                        />
                        <p className="text-sm text-base2">Delete</p>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* mobile */}
      <div className="lg:hidden w-full h-full">
        {filteredInfluencers.map((influencer) => (
          <div
            key={influencer.id}
            className={`flex items-start gap-[10px] py-3 border-b border-[#FCF1F4] ${
              influencer.status === "suspended" ? "bg-[#FCF1F4]" : ""
            }`}
          >
            <div className="flex items-center justify-center 2xl:w-[68px] w-12 lg:px-6 px-3">
              <Checkbox
                checked={selectedInfluencers.includes(influencer.id)}
                onCheckedChange={(checked) =>
                  handleSelectOne(influencer.id, checked as boolean)
                }
                className="h-5 w-5 border-borderGray data-[state=checked]:bg-base2 data-[state=checked]:border-none data-[state=checked]:text-white"
              />
            </div>

            <div className="flex-1">
              <div className="w-full flex items-center justify-between pb-2">
                <div className={`flex items-center gap-3`}>
                  <div className="h-8 w-8 rounded-full shrink-0 bg-base2" />

                  <div>
                    <p className="text-black">{influencer.name}</p>
                    <div className="flex items-center gap-[6px]">
                      <span className="w-[6px] h-[6px] rounded-full bg-base1" />
                      <p
                        className={`font-bold capitalize text-[10px] ${
                          influencer.status === "active"
                            ? "text-base1"
                            : "text-base2"
                        }`}
                      >
                        {influencer.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`px-2 2xl:px-4`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="text-[#475467] data-[state=open]:text-base2 cursor-pointer"
                    >
                      <DotsVerticalIcon className="h-5 w-5" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="bg-white text-black border-0 p-0"
                    >
                      <DropdownMenuItem
                        onClick={() => setOpenProfile(true)}
                        className="py-2 px-3 flex items-center gap-2 bg-[#F1FBFF] cursor-pointer"
                      >
                        <Image
                          src="/assests/avatar.svg"
                          alt=""
                          width={16}
                          height={16}
                        />
                        <p className="text-sm text-base1">View profile</p>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="py-2 px-3 flex items-center gap-2 cursor-pointer">
                        <Image
                          src="/assests/thrash.svg"
                          alt=""
                          width={16}
                          height={16}
                        />
                        <p className="text-sm text-base2">Delete</p>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="py-2 border-y border-[#FCF1F4] flex justify-between w-full">
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-[#8D8D8D] mb-[6px]">
                      Membership date
                    </p>
                    <p className="text-xs text-black font-light">
                      {influencer.memberSince}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#8D8D8D] mb-[6px]">
                      Call request
                    </p>
                    <p className="text-xs text-black font-light">
                      {influencer.callRequests}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#8D8D8D] mb-[6px]">Likes</p>
                    <p className="text-xs text-black font-light">
                      {influencer.likes}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-[#8D8D8D] mb-[6px]">
                      Live calls
                    </p>
                    <p className="text-xs text-black font-light">
                      {influencer.liveCalls}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#8D8D8D] mb-[6px]">Gifts</p>
                    <p className="text-xs text-black font-light">
                      {influencer.gifts}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#8D8D8D] mb-[6px]">Flags</p>
                    <div
                      className={`cursor-pointer`}
                      onClick={() => setOpenFlagData(true)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-black font-light">
                          {influencer.flags}
                        </p>
                        <Maximize2 size={12} className="text-base1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-[#8D8D8D] mb-[6px]">
                  Total Earnings
                </p>
                <p className="text-xs text-black font-light">
                  {influencer.totalEarnings}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default InfluencerTable;
