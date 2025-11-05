"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface EarningsCardProps {
  title: string;
  amount: string;
}

const EarningsCard: React.FC<EarningsCardProps> = ({ title, amount }) => {
  const [selectedOption, setSelectedOption] = useState("Total Earning");

  return (
    <div className="bg-neutral-200 w-full m-[auto] md:w-full bg-opacity-15 rounded-2xl p-4 mb-2 flex flex-col h-[16.5vh]">
      <div className="flex md:flex-row flex-col md:justify-between">
        <p className="text-[15px] mt-1">{title}</p>

        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="text-[#475467] data-[state=open]:text-base2 cursor-pointer"
          >
            <div className="px-2 py-2 rounded-lg text-[11px] mt-1 md:mt-0 bg-white text-[#E688A3] w-[132px] md:w-26 justify-between flex flex-row">
              <p className="text-[12px] text-[#E688A3]">{selectedOption}</p>
              <ChevronDown size={14} className="w-[16px] mt-1 ml-1" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="bg-white text-black border-0 p-0"
          >
            <DropdownMenuItem
              className="flex items-center gap-2 bg-[#F1FBFF] cursor-pointer"
              onSelect={() => setSelectedOption("Total Earning")}
            >
              <div className="px-2 pt-1 text-[11px] text-[#E688A3] w-26 h-[30px] justify-between flex flex-row">
                <p className="text-[12px] text-[#E69CB0]">Total Earning</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="py-2 px-3 border-b-[1px] border-[#ffffff] flex bg-[#E69CB0] items-center gap-2 cursor-pointer"
              onSelect={() => setSelectedOption("Last 30 days")}
            >
              <div className="px-2 pt-1 text-[11px] w-26 h-[30px] justify-between flex flex-row">
                <p className="text-[12px] text-[#ffffff]">Last 30 days</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="py-2 px-3 border-b-[1px] border-[#ffffff] bg-[#E69CB0] flex items-center gap-2 cursor-pointer"
              onSelect={() => setSelectedOption("This year")}
            >
              <div className="px-2 pt-1 text-[11px] text-[#E688A3] w-26 h-[30px] justify-between flex flex-row">
                <p className="text-[12px] text-[#ffffff]">This year</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="py-2 px-3 flex bg-[#E69CB0] items-center gap-2 cursor-pointer"
              onSelect={() => setSelectedOption("Today")}
            >
              <div className="px-2 pt-1 text-[11px] text-[#E688A3] w-26 h-[30px] justify-between flex flex-row">
                <p className="text-[12px] text-[#ffffff]">Today</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-[32px] font-medium">{amount}</p>
    </div>
  );
};

export default EarningsCard;
