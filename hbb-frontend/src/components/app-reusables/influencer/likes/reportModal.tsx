"use client";

import React, { useState } from "react";
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
// import { reportSchema } from "@/src/schema/report/report";

const ReportModal = ({ isOpen, onClose, item }) => {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const form = useForm({
    // resolver: zodResolver(reportSchema),
    defaultValues: {
      category: selectedOptions,
      description: "",
    },
  });

  if (!isOpen) return null;

  const options = [
    "Catfishing",
    "Misconduct",
    "Harassment",
    "Illegal activities",
    "Other",
  ];

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedOptions([...selectedOptions, value]);
    } else {
      setSelectedOptions(selectedOptions.filter(option => option !== value));
    }
  };

  const values = form.getValues();

  const onHandleSubmit = async (data: any) => {
    toast.success("Report submitted");
    console.log("Report submitted");

    startTransition(async () => {
      try {
        //   code to hit backend
      } catch (error: any) {
        console.error("Error submitting report:", error?.message);
        // Handle any errors here, such as displaying an error message to the user
        toast.error("Error submitting report. Please try again later.");
      }
    });
  };

  const isDisabled = values.category.length !== 0 && values.description !== "";

  return (
    <main className="absolute w-screen h-screen top-0 left-0 z-50 inset-0 opacity-100 backdrop-filter backdrop-blur-[6px] flex items-center justify-center">
      <div className="flex flex-col bg-base1 rounded-[15px] w-[93%] md:w-[60%] h-[67dvh] md:h-[65dvh] relative p-5">
        {/* close button */}
        <Button
          className="bg-white absolute right-0 top-0 m-3 p-1 h-6 w-6 rounded-[5px]"
          onClick={onClose}
        >
          <CancelIcon className="h-5" />
        </Button>
        <p className="w-full border-b pb-2 border-[#ffffff33] text-[16px] md:text-[19px] mt-2 md:mt-5 mb-4">
          Report
        </p>
        <div className="w-full h-full flex flex-col items-center md:justify-center">
          <form
            className="w-full h-[45dvh] flex flex-col md:items-center md:justify-center"
            onSubmit={form.handleSubmit(onHandleSubmit, (errors: any) => {
              onSubmitError(errors);
            })}
          >
            <Form {...form}>
              <div className="w-full h-[44dvh] flex flex-col md:flex-row">
                <div className="w-[100%] md:w-[40%] md:h-full mt-5 flex flex-wrap md:flex-col gap-[12px] md:gap-[25px]">
                  {options.map((option, index) => (
                    <label key={index} className="flex text-[12px] items-center space-x-2">
                      <input
                        type="checkbox"
                        value={option}
                        onChange={handleCheckboxChange}
                        className="checkbox-custom"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>

                <div className="w-[100%] md:w-[60%] h-full mt-5">
                  <p className="text-[10px] text-[#ffffff99] mb-1">
                    Write something [optional]
                  </p>

                  <div className="bg-[#ffffff3d] w-[100%] border-none rounded-[10px] h-[20dvh] md:h-[30dvh] placeholder:text-white flex flex-wrap">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              className="bg-transparent border-none w-[100%] text-white placeholder:text-white"
                              placeholder="Write something here"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <Button
                className={`text-[12px] text-black w-[100%] md:w-[40%] h-9 rounded-[20px] shadow-custom-shadow-component ${
                  !isDisabled
                    ? "bg-lightgray cursor-not-allowed text-gray"
                    : "bg-tertiary hover:bg-tertiaryHover"
                }`}
                disabled={!isDisabled}
                loading={isPending}
                variant="yellow"
                type="submit"
              >
                Send report
              </Button>
            </Form>
          </form>
          <Button className="text-[12px] bg-transparent h-9" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
};

export default ReportModal;
