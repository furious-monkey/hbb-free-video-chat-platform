import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const profileViewsLast7Days = [
  { date: "Mar 1", view: 5 },
  { date: "Mar 2", view: 3 },
  { date: "Mar 3", view: 6 },
  { date: "Mar 4", view: 8 },
  { date: "Mar 5", view: 5 },
  { date: "Mar 6", view: 7 },
  { date: "Mar 7", view: 4 },
];

const profileViewsThisMonth = [
  { date: "Mar 1", view: 5 },
  { date: "Mar 2", view: 3 },
  { date: "Mar 3", view: 6 },
  { date: "Mar 4", view: 8 },
  { date: "Mar 5", view: 5 },
  { date: "Mar 6", view: 7 },
  { date: "Mar 7", view: 4 },
  { date: "Mar 8", view: 6 },
  { date: "Mar 9", view: 10 },
  // ... add more data points for the month
];

const profileViewsThisYear = [
  { date: "Jan", view: 40 },
  { date: "Feb", view: 30 },
  { date: "Mar", view: 35 },
  { date: "Apr", view: 50 },
  { date: "May", view: 60 },
  { date: "Jun", view: 70 },
  { date: "Jul", view: 80 },
  { date: "Aug", view: 90 },
  // ... add more data points for the year
];

const profileViewsAllTime = [
  { date: "2020", view: 300 },
  { date: "2021", view: 400 },
  { date: "2022", view: 450 },
  { date: "2023", view: 500 },
  { date: "2024", view: 600 },
  // ... add more data points for all time
];

const ProfileMetrics = () => {
  const [selectedOption, setSelectedOption] = useState("Last 7 days");
  const [profileViews, setProfileViews] = useState(profileViewsLast7Days);

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    switch (option) {
      case "Last 7 days":
        setProfileViews(profileViewsLast7Days);
        break;
      case "This month":
        setProfileViews(profileViewsThisMonth);
        break;
      case "This year":
        setProfileViews(profileViewsThisYear);
        break;
      case "All":
        setProfileViews(profileViewsAllTime);
        break;
      default:
        setProfileViews(profileViewsLast7Days);
        break;
    }
  };

  return (
    <div className="rounded-lg bg-[#6AB5D2] text-white h-full px-4 py-2">
      <div className="flex flex-row justify-between items-center">
        <p className="text-[15px]">My Profile Metrics</p>
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="text-[#475467] data-[state=open]:text-[#6AB5D2] cursor-pointer"
          >
            <div className="px-2 text-[11px] text-[#6AB5D2] bg-white w-[144px] h-[36px] justify-between flex flex-row items-center rounded">
              <span>{selectedOption}</span>
              <ChevronDown size={20} className="ml-2" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white text-black border-0 p-0">
            <DropdownMenuItem
              className="flex items-center gap-2 bg-[#F1FBFF] cursor-pointer"
              onSelect={() => handleSelectOption("Last 7 days")}
            >
              Last 7 days
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 bg-[#F1FBFF] cursor-pointer"
              onSelect={() => handleSelectOption("This month")}
            >
              This month
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 bg-[#F1FBFF] cursor-pointer"
              onSelect={() => handleSelectOption("This year")}
            >
              This year
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 bg-[#F1FBFF] cursor-pointer"
              onSelect={() => handleSelectOption("All")}
            >
              All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ResponsiveContainer
        width={370}
        height={190}
        style={{
          marginTop: 8,
          marginLeft: -32,
          color: "white",
        }}
      >
        <LineChart data={profileViews}>
          <XAxis
            dataKey="date"
            tick={{ fill: "#C3E1ED" }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            tick={{ fill: "#C3E1ED" }}
            axisLine={false}
            tickLine={false}
            padding={{ top: 10, bottom: 10 }} 
          />
          <Tooltip />
          <CartesianGrid stroke="#80C0D9" vertical={false} />
          <Line
            type="monotone"
            dataKey="view"
            stroke="#FFD652"
            dot={{ r: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfileMetrics;
