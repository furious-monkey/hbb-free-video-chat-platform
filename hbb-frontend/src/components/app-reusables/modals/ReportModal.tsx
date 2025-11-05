"use client";

import React from "react";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { onSubmitError } from "@/src/lib/utils";
import { Checkbox } from "@/src/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Textarea } from "../../ui/textarea";
import { reportSchema } from "@/src/schema/report/report";
import ReportService from "@/src/api/report/report";
import { useSearchParams } from "next/navigation";

interface Props {
  onClose: (value: boolean) => void;
  isOpen: boolean | undefined;
  item?: any; // Made optional since we'll get it from query params
}

const ReportModal = ({ isOpen, onClose, item: propItem }: Props) => {
  const [isPending, startTransition] = React.useTransition();
  const searchParams = useSearchParams();

  // Get user data from query params or props
  const getUserData = React.useMemo(() => {
    // First try to get from props
    if (propItem?.id) {
      return propItem;
    }

    // Then try to get from query params
    const userParam = searchParams.get("user");
    if (userParam) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(userParam));
        return decodedUser;
      } catch (error) {
        console.error("Error parsing user from query params:", error);
      }
    }

    // Fallback: try to get just userId from query params
    const userId = searchParams.get("userId");
    if (userId) {
      return { id: userId };
    }

    return null;
  }, [propItem, searchParams]);

  const item = getUserData;

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: [],
      description: "",
    },
    mode: "onChange",
  });

  const options = [
    "Catfishing",
    "Misconduct",
    "Harassment",
    "Illegal activities",
    "Other",
  ];

  const onHandleSubmit = async (data: z.infer<typeof reportSchema>) => {
    // Check if item exists and has an id
    if (!item || !item.id) {
      toast.error("Unable to report: User information is missing");
      return;
    }

    startTransition(async () => {
      try {
        // Convert options to uppercase enum format
        // Note: Backend uses ILLEGAL_ACTIVITY (singular) not ILLEGAL_ACTIVITIES
        const categories = data.category.map((opt) => {
          const categoryMap: { [key: string]: string } = {
            Catfishing: "CATFISHING",
            Misconduct: "MISCONDUCT",
            Harassment: "HARASSMENT",
            "Illegal activities": "ILLEGAL_ACTIVITIES", // Frontend keeps plural
            Other: "OTHER",
          };

          return categoryMap[opt] || opt.toUpperCase().replace(/\s+/g, "_");
        });

        const response = await ReportService.createReport({
          reportedUserId: item.id,
          categories,
          description: data.description || undefined,
        });

        if (response.data.success) {
          toast.success("Report submitted successfully");
          form.reset();
          onClose(false);
        } else {
          throw new Error("Failed to submit report");
        }
      } catch (error: any) {
        console.error("Error submitting report:", error);
        toast.error(
          error?.response?.data?.message ||
            "Error submitting report. Please try again later."
        );
      }
    });
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <section className="w-full h-full px-2 flex flex-col overflow-y-auto">
      {/* Optional: Show who is being reported */}
      {item?.name && (
        <div className="mb-4 text-center">
          <p className="text-white/70 text-sm">
            Reporting:{" "}
            <span className="text-white font-medium">{item.name}</span>
          </p>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onHandleSubmit, (errors: any) => {
            onSubmitError(errors);
          })}
          className="w-full flex flex-col min-h-full lg:pt-[10%]"
        >
          <div>
            <div className="w-full lg:grid lg:grid-cols-3 gap-4">
              <div className="!w-full my-4 col-span-1">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <div className="!w-full grid grid-cols-2 lg:grid-cols-1 gap-4 ">
                        {options.map((option) => (
                          <FormItem
                            className="flex items-center space-x-3 space-y-0"
                            key={option}
                          >
                            <FormControl>
                              <Checkbox
                                className="border border-white w-5 h-5 rounded-full data-[state=checked]:bg-[#E688A3] data-[state=checked]:border-none data-[state=checked]:text-white"
                                checked={field.value.includes(option)}
                                onCheckedChange={(checked) => {
                                  field.onChange(
                                    checked
                                      ? [...field.value, option]
                                      : field.value.filter(
                                          (value) => value !== option
                                        )
                                  );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-xs lg:text-sm text-white cursor-pointer select-none">
                              {option}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage className="mt-2" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="w-full  pt-4 lg:pt-0 col-span-2">
                {/* Description Section */}
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-sm text-white/80 mb-2 block mt-4 lg:mt-0">
                          Write description (optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Please provide any additional context or details about this report..."
                            {...field}
                            className="resize-none placeholder:text-white/40 w-full border-white/20 backdrop-blur-xl bg-white/10 text-white focus:bg-white/15 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full py-6 pb-16">
                  <Button
                    variant="yellow"
                    disabled={!form.formState.isValid || isPending || !item?.id}
                    loading={isPending}
                    className={`bg-tertiary shadow-custom-shadow w-full md:w-2/3 lg:w-1/2  flex items-center justify-center gap-2 h-12 text-black text-xs lg:text-sm font-medium transition-all
                                ${
                                  !form.formState.isValid || !item?.id
                                    ? "bg-lightgray cursor-not-allowed opacity-50"
                                    : "bg-tertiary hover:bg-tertiaryHover active:scale-[0.98]"
                                }
                            `}
                    type="submit"
                  >
                    {!item?.id
                      ? "User information missing"
                      : form.formState.isValid
                      ? "Submit Report"
                      : "Select at least one reason"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </section>
  );
};

export default ReportModal;
