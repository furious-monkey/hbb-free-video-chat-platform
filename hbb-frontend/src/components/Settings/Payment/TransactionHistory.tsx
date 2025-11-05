"use client";

import React, { useState } from "react";
import SecurityLayout from "../Security/SecurityLayout";
import { TransactionTable } from "./TransactionTable";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { format } from "date-fns";
import { Calendar } from "../../ui/calendar";
import { DateRange } from "react-day-picker";
import { CalendarDays } from "lucide-react";

const TransactionHistory = ({
  handleGoBack,
  heading,
}: {
  handleGoBack: () => void;
  heading: string;
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  return (
    <>
      <SecurityLayout onClick={handleGoBack} heading={heading}>
        <div className="lg:mt-7 mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:border-b border-[#E29EB2]">
            <div className="flex items-center lg:gap-6 gap-5 border-b border-[#E29EB2] lg:border-0">
              {tabData.map((tab) => (
                <p
                  key={tab}
                  className={`pb-1 transition-all duration-300 ease-in delay-75 border-b-4 ${
                    activeTab === tab
                      ? "text-white border-white"
                      : "text-white/60 border-transparent"
                  } cursor-pointer capitalize`}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab}
                </p>
              ))}
            </div>

            <div className="">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={
                      "p-0 w-full h-fit bg-transparent border-0 flex items-center justify-start"
                    }
                  >
                    <div className="w-6 h-6 flex items-center justify-center bg-[#E29EB2] mr-1 rounded">
                      <CalendarDays className="h-4 w-4" />
                    </div>

                    <p className="text-xs py-1 px-2 border border-[#E29EB2] rounded flex-1">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <p className="text-white/60 flex items-center w-full justify-between gap-5">
                          DD- MM - YYYY
                          <span className="text-white">to</span>
                          DD- MM - YYYY
                        </p>
                      )}
                    </p>
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 bg-base1" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={1}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="lg:mt-9 mt-4">
            <TransactionTable />
          </div>
        </div>
      </SecurityLayout>
    </>
  );
};

export default TransactionHistory;

const tabData = ["all", "credited", "debited"];
