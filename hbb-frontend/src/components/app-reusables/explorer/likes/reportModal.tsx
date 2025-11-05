// frontend/src/components/ReportModal.tsx (or the path where the modal is located)
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/src/components/ui/button";
import { CancelIcon } from "@/src/components/svgs/index";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { toast } from "sonner";
import { Textarea } from "@/src/components/ui/textarea";
import { onSubmitError } from "@/src/lib/utils";
import { reportSchema } from "@/src/schema/report/report";
import ReportService from "@/src/api/report/report";

const ReportModal = ({ isOpen, onClose, item }) => {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: [],
      description: "",
    },
    mode: "onChange",
  });

  if (!isOpen) return null;

  const options = [
    "Catfishing",
    "Misconduct",
    "Harassment",
    "Illegal activities",
    "Other",
  ];

  const onHandleSubmit = (data: z.infer<typeof reportSchema>) => {
    startTransition(async () => {
      try {
        // Convert options to uppercase enum format (e.g., "Illegal activities" -> "ILLEGAL_ACTIVITY")
        const categories = data.category.map((opt) =>
          opt.toUpperCase().replace(/\s+/g, "_")
        );

        const response = await ReportService.createReport({
          reportedUserId: item.id, // Assuming item has the reported user's id
          categories,
          description: data.description,
        });

        if (response.data.success) {
          toast.success("Report submitted successfully");
          onClose();
        } else {
          throw new Error("Failed to submit report");
        }
      } catch (error: any) {
        console.error("Error submitting report:", error);
        toast.error(error?.response?.data?.message || "Error submitting report. Please try again later.");
      }
    });
  };

  return (
    <main className="fixed inset-0 z-50 flex items-center bg-[#00000099] justify-center bg-opacity-50 backdrop-filter backdrop-blur-[6px]">
      <div className="flex flex-col bg-base1 rounded-[15px] w-[93%] md:w-[60%] h-[67dvh] md:h-[65dvh] p-5 relative">
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
          <Form {...form}>
            <form
              className="w-full h-[45dvh] flex flex-col md:items-center md:justify-center"
              onSubmit={form.handleSubmit(onHandleSubmit, onSubmitError)}
            >
              <div className="w-full h-[44dvh] flex flex-col md:flex-row">
                <div className="w-[100%] md:w-[40%] md:h-full mt-5 flex flex-wrap md:flex-col gap-[12px] md:gap-[25px]">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        {options.map((option, index) => (
                          <label key={index} className="flex text-[12px] items-center space-x-2">
                            <input
                              type="checkbox"
                              value={option}
                              checked={field.value.includes(option)}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                const newValue = checked
                                  ? [...field.value, option]
                                  : field.value.filter((v) => v !== option);
                                field.onChange(newValue);
                              }}
                              className="checkbox-custom"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-[100%] md:w-[60%] h-full mt-5">
                  <p className="text-[10px] text-[#ffffff99] mb-1">
                    Write something [optional]nn
                  </p>

                  <div className="bg-[#ffffff3d] w-[100%] border-none rounded-[10px] h-[20dvh] md:h-[30dvh] placeholder:text-white flex flex-wrap">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              className="bg-transparent border-none w-full h-full text-white placeholder:text-white resize-none"
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
                className={`text-[12px] text-black w-[100%] md:w-[40%] h-9 rounded-[20px] shadow-custom-shadow-component bg-tertiary hover:bg-tertiaryHover`}
                disabled={isPending}
                loading={isPending}
                variant="yellow"
                type="submit"
              >
                Send report
              </Button>
            </form>
          </Form>
          <Button className="text-[12px] bg-transparent h-9" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
};

export default ReportModal;