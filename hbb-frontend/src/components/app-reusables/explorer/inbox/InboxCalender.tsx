"use client";

import React, { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/src/components/ui/button";
import { CancelIcon } from "@/src/components/svgs/index";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { toast } from "sonner";
import Logo from "@/public/assests/logo.svg";
import Image from "next/image";
import { Input } from "@/src/components/ui/input";
import { onSubmitError } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
// import { giftSchema } from "@/src/schema/auth/signup";
import data from "@/src/constants/gifts";
import dayjs from "dayjs";

const InboxCalender = ({ isOpen, onClose, item }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const dateContainerRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;

  const daysInMonth = currentMonth.daysInMonth();
  const dates = Array.from({ length: daysInMonth }, (_, i) =>
    currentMonth.date(i + 1)
  );
  const times = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00"];

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  const handlePrevDate = () => {
    const newDate = dayjs(selectedDate).subtract(1, "day");
    if (newDate.isBefore(currentMonth.startOf("month"))) {
      setCurrentMonth(currentMonth.subtract(1, "month"));
    }
    setSelectedDate(newDate.format("YYYY-MM-DD"));
    scrollDateContainer("left");
  };

  const handleNextDate = () => {
    const newDate = dayjs(selectedDate).add(1, "day");
    if (newDate.isAfter(currentMonth.endOf("month"))) {
      setCurrentMonth(currentMonth.add(1, "month"));
    }
    setSelectedDate(newDate.format("YYYY-MM-DD"));
    scrollDateContainer("right");
  };

  const scrollDateContainer = (direction) => {
    if (dateContainerRef.current) {
      const scrollAmount = 100; // Adjust as needed
      if (direction === "left") {
        dateContainerRef.current.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      } else {
        dateContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date.format("YYYY-MM-DD"));
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time.");
      return;
    }
    const formData = {
      giftType: selectedDate,
      selectedTime,
    };
    console.log("Form Data Submitted:", formData);
    // Perform form submission
  };

  return (
    <main className="absolute w-full h-full top-20 left-[0%] md:top-20 md:left-[20%] z-50 flex blur-thing items-center justify-center">
      <div className="flex flex-col rounded-[15px] w-[95%] md:w-[60%] h-[82dvh] md:h-[80dvh] relative p-5">
        <div>
          <div className="flex justify-center items-center w-full h-[60dvh] md:h-[60dvh]">
            <div className="flex flex-col items-center justify-center h-full w-[100%] md:w-[80%]">
              <div className="bg-white rounded-[15px] shadow-custom-shadow-component relative h-full p-2 md:p-5 w-full">
                {/* close button */}
                <Button
                  className="bg-[#00000010] absolute right-0 top-0 m-3 p-1 h-6 w-6 rounded-[5px]"
                  onClick={onClose}
                >
                  <CancelIcon className="h-5" />
                </Button>
                <h2 className="text-[15px] text-center font-[500] mt-2 mb-3 md:mb-5 text-black">
                  Change time
                </h2>

                <p className="text-[12px] mb-2 text-black">Choose date</p>
                <div className="rounded-[10px] date-shadow p-2">
                  <div className="flex items-center md:gap-7 justify-between md:justify-center mb-4">
                    <button
                      onClick={handlePrevMonth}
                      className="w-5 h-5 text-[12px] flex items-center justify-center bg-gray-200 date-shadow rounded-[50%] text-pink"
                    >
                      <Image
                        src="/assests/callLeft.svg"
                        alt="report"
                        width={7}
                        height={9}
                      />
                    </button>
                    <span className="text-[12px] font-[100] text-black">
                      {currentMonth.format("MMMM YYYY")}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="w-5 h-5 text-[12px] flex items-center justify-center bg-gray-200 date-shadow rounded-[50%] text-pink"
                    >
                      <Image
                        src="/assests/callRight.svg"
                        alt="report"
                        width={7}
                        height={9}
                      />
                    </button>
                  </div>

                  <div className="mb-4 flex items-center">
                    <button
                      onClick={handlePrevDate}
                      className="w-[30px] flex items-center justify-center h-[20px] text-[12px] bg-white date-shadow rounded-[50%] text-pink"
                    >
                      <Image
                        src="/assests/callLeft.svg"
                        alt="report"
                        width={7}
                        height={9}
                      />
                    </button>
                    <div
                      className="flex overflow-x-auto  space-x-2 pb-2"
                      ref={dateContainerRef}
                    >
                      {dates.map((date) => (
                        <div
                          key={date.format("YYYY-MM-DD")}
                          className={`text-center${
                            selectedDate === date.format("YYYY-MM-DD")
                              ? "bg-pink text-white"
                              : "bg-gray-100 text-black"
                          }`}
                        >
                          <Button
                            className={`py-2 w-[45px] text-[12px] rounded-[10px] flex flex-col date-shadow items-center justify-center ${
                              selectedDate === date.format("YYYY-MM-DD")
                                ? "bg-pink text-white"
                                : "bg-gray-100 text-black"
                            }`}
                            onClick={() => handleDateClick(date)}
                          >
                            <div
                              className={`text-[11px] font-[100] text-[#00000060] ${
                                selectedDate === date.format("YYYY-MM-DD")
                                  ? "text-white"
                                  : ""
                              }`}
                            >
                              {date.format("ddd")}
                            </div>
                            {date.date()}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleNextDate}
                      className="w-[30px] h-[20px] flex items-center justify-center text-[12px] bg-white date-shadow rounded-[50%] text-pink"
                    >
                      <Image
                        src="/assests/callRight.svg"
                        alt="report"
                        width={7}
                        height={9}
                      />
                    </button>
                  </div>
                </div>

                <div className="mb-4 md:mb-6">
                  <p className="text-[12px] mb-2 mt-3 font-[100] text-black">
                    Choose time
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {times.map((time) => (
                      <Button
                        key={time}
                        className={`text-[12px] date-shadow rounded-[10px] h-7 ${
                          selectedTime === time
                            ? "bg-pink text-white"
                            : "bg-gray-100 text-black"
                        }`}
                        onClick={() => handleTimeClick(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={onClose}
                    className="px-4 py-2 border rounded-[10px] text-[12px] text-black bg-white h-[35px] w-[100px] md:w-[100px] border-pink"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-[#4eb246] text-white text-[12px] rounded-[10px] h-[35px] w-[100px] md:w-[100px]"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default InboxCalender;
