"use client";

import React, { useState } from "react";
import {
  CartesianGrid,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import { genderType } from "@/src/schema/profile/index.data";

const EarningsByYear = () => {
  const [selectedValue, setSelectedValue] = useState(DurationData[0].value);

  const data = [
    {
      name: "Mar 1",
      pv: 2400,
    },
    {
      name: "Mar 2",
      pv: 1398,
    },
    {
      name: "Mar 3",
      pv: 9800,
    },
    {
      name: "Mar 4",
      pv: 3908,
    },
    {
      name: "Mar 5",
      pv: 4800,
    },
    {
      name: "Mar 6",
      pv: 3800,
    },
    {
      name: "Mar 7",
      pv: 4300,
    },
  ];

  const formatCurrency = (tickItem: any) => {
    if (tickItem >= 1000) {
      return `${tickItem / 1000}k`;
    }
    return tickItem;
  };

  return (
    <div className="rounded-20 bg-base1 h-[243px] lg:h-[323px] lg:flex-[2] py-3 pr-3 lg:py-4 lg:pr-7">
      <div className="w-full h-full flex flex-col">
        <div className="w-full flex justify-between items-center pl-3 lg:pl-7 mb-4">
          <p className="text-sm lg:text-base">Earnings</p>

          <Select onValueChange={(value) => setSelectedValue(value)}>
            <SelectTrigger className="w-[115px] bg-white rounded-lg text-base1 px-3 capitalize text-xs">
              {selectedValue}
            </SelectTrigger>

            <SelectContent className="p-0 min-w-fit border-0">
              <SelectGroup className="w-[115px] border-0 bg-base1">
                {DurationData.map((data) => (
                  <SelectItem
                    key={data.value}
                    value={data.value}
                    showIndicator={false}
                    className="border-0 px-3 py-[6px] text-xs border-white/25 focus:bg-white focus:text-base1 border-b last:border-b-0"
                  >
                    {data.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <ResponsiveContainer width={"100%"} height={"78%"}>
          <LineChart data={data} margin={{ top: 5, left: -5 }}>
            <CartesianGrid vertical={false} stroke="#FFFFFF26" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              stroke="#FFFFFF99"
              tickMargin={12}
              color="black"
              padding={{ left: 20 }}
            />
            <YAxis
              tickLine={false}
              tickFormatter={(tick) => formatCurrency(tick)}
              stroke="#FFFFFF99"
              axisLine={false}
              domain={[0, 10000]}
              tickCount={3}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                backgroundColor: "#E688A3",
                color: "white",
                borderRadius: 8,
                borderWidth: 0,
              }}
            />
            <Line type="monotone" dataKey="pv" stroke="#FFD652" dot={false} />
          </LineChart>
        </ResponsiveContainer>{" "}
      </div>
    </div>
  );
};

export default EarningsByYear;

const DurationData: genderType[] = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
];
