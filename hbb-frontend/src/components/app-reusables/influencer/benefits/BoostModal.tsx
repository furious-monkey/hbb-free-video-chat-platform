"use client";

import React, { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/src/components/ui/input";
import { toast } from "sonner";
import data from "@/src/constants/interests";
import { onSubmitError } from "@/src/lib/utils";
import { useProfileStore } from "@/src/store/profileStore";
import { shallow } from "zustand/shallow";
import { boostSchema, } from "@/src/schema/profile";
import { z } from "zod";
import { X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { LuCalendarDays } from "react-icons/lu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { format, subYears } from "date-fns";
import { Calendar } from "@/src/components/ui/calendar";

interface Props {
  setEditModal: (value: boolean) => void;
  editModal: boolean;
}


const BoostModal: React.FC<Props> = ({ editModal, setEditModal }) => {
  const [selectedOption, setSelectedOption] = useState("Select");
  const { getUserProfile, profile, postUserProfileDetails } = useProfileStore(
    (state: any) => ({
      getUserProfile: state.getUserProfile,
      profile: state.profile,
      postUserProfileDetails: state.postUserProfileDetails,
    }),
    shallow
  );

  const [isPending, startTransition] = React.useTransition();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile?.interests || []
  );

  const form = useForm<z.infer<any>>({
    resolver: zodResolver(boostSchema),
    defaultValues: {
      username: profile?.username || "",
      location: profile?.location || "",
      bio: profile?.bio || "",
      callRate: profile.callRate || "",
      duration: profile.duration || undefined,
    },
  });

  const onHandleSubmit = async (data: any) => {
    const { username, location, bio, callRate } = data;
    startTransition(async () => {
      try {
        const toastId = toast.loading("Updating profile...");
        const response = await postUserProfileDetails({
          username,
          bio,
          location,
          interests: selectedInterests,
          zodiacSign: "Cancer",
          callRate,
        });
        if (response) {
          toast.success("Profile updated successfully", { id: toastId });
          await getUserProfile();
          setEditModal(false);
        } else {
          toast.error("Profile could not be updated", { id: toastId });
        }
      } catch (error: any) {
        console.error(error.message);
        toast.error("Error updating profile. Please try again later.");
      }
    });
  };

  const handleToggleModal = () => {
    setEditModal(!editModal);
  };

  const handleInterestSelection = (interest: string) => {
    if (selectedInterests.length < 3 && !selectedInterests.includes(interest)) {
      setSelectedInterests((interests) => [...interests, interest]);
    } else if (selectedInterests.includes(interest)) {
      setSelectedInterests((interests) =>
        interests.filter((item) => item !== interest)
      );
    }
  };

  const today = new Date();
  const minimumAgeDate = subYears(today, 18);

  return (
    <>
      {editModal && (
        <div className="z-20 w-full h-[calc(100%-100px)] overflow-y-auto md:h-screen backdrop-blur-md absolute top-0 left-0 right-0 grid justify-center content-center">
          <section className="md:h-[30rem] h-full overflow-y-auto m-auto grid justify-center md:px-[2rem] px-[1rem] md:py-[0.8rem] py-[0.8rem] md:w-[50rem] w-[90%] mx-auto bg-base1 rounded-lg">
            <div className="flex justify-end">
              <Button
                onClick={handleToggleModal}
                className="bg-placeholderText h-6 w-6 p-0 rounded-lg"
                variant="link"
              >
                <X className="p-0 w-3/5" />
              </Button>
            </div>
            <p className="">Boost Visibility</p>
            <section className="md:flex justify-between">
              <div className="md:w-[47%] p-[1rem] rounded-lg backdrop-blur-sm overflow-y-auto">
                <div className="flex flex-row justify-between pb-4">
                  <Form {...form}>
                    <form className="w-[100%] flex-col">
                      <div className="flex flex-row w-[100%] justify-between border-b-2 border-[#8FC0D3] pb-6 mb-4">
                        <FormField
                          control={form.control}
                          name="callRate"
                          render={({ field }) => (
                            <FormItem className="relative w-[47%]">
                              <FormLabel className="text-white text-sm">
                                Boost visibility
                              </FormLabel>
                              <FormControl>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <div className="!bg-[#8EC7DD] rounded-md justify-between flex flex-row backdrop-blur-sm relative mt-2 p-[15px] text-white focus:border-white outline-none w-full cursor-pointer">
                                      <span className="text-xs">
                                        {selectedOption}
                                      </span>
                                      <ChevronDown size={20} className="ml-2" />
                                    </div>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 cursor-pointer"
                                      onClick={() => setSelectedOption("Last 7 days")}
                                    >
                                      Last 7 days
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="callRate"
                          render={({ field }) => (
                            <FormItem className="relative w-[47%]">
                              <FormLabel className="text-white text-sm">
                                Price
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="$"
                                  className="!bg-[#8EC7DD] backdrop-blur-sm mt-2 relative placeholder:text-placeholderText placeholder:text-xs text-white focus:border-white outline-none w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-col">
                            <FormLabel className="text-white text-sm mb-2 font-medium">
                              Select Duration
                            </FormLabel>

                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"ghost"}
                                    className="!bg-[#8EC7DD] rounded-md justify-between flex flex-row backdrop-blur-sm relative mt-2 p-[4px] text-white focus:border-white outline-none w-full"
                                  >
                                    <p className="w-full p-3 rounded-md text-left">
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span className=" flex flex-row justify-between">
                                          <div className="flex flex-row">
                                            <LuCalendarDays className="mr-4 relative top-1" />
                                            <p className="text-[#ffffff] opacity-45">
                                              DD/MM/YYYY
                                            </p>
                                          </div>
                                          <ChevronDown
                                            size={20}
                                            className="ml-2"
                                          />
                                        </span>
                                      )}
                                    </p>
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>

                              <PopoverContent
                                className="w-auto p-0 bg-base1"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("1900-01-01") ||
                                    date > minimumAgeDate
                                  }
                                  initialFocus
                                  showYearPicker
                                />
                              </PopoverContent>
                            </Popover>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              </div>
              <div className="md:w-[47%] rounded-lg">
                <div className="flex flex-wrap py-[0.75rem] p-[0.75rem] bg-white rounded-lg mt-2">
                  {data.map((item) => (
                    <p
                      key={item.id}
                      onClick={() => handleInterestSelection(item.name)}
                      className={`cursor-pointer px-3 py-1 h-[2rem] text-center w-fit content-center grid rounded-xl text-xs ${
                        selectedInterests.includes(item.name)
                          ? "bg-[#E688A3] text-[£ffffff]"
                          : "bg-profile text-black"
                      }`}
                    >
                      {item.name}
                    </p>
                  ))}
                </div>
              </div>
            </section>
            <Button
              variant="yellow"
              className="md:w-1/2 mx-auto grid justify-center items-center h-8 md:mt-[1.5rem] mt-[1.78rem] shadow-custom-shadow"
              onClick={form.handleSubmit(onHandleSubmit, onSubmitError)}
            >
              Save updates
            </Button>
          </section>
        </div>
      )}
    </>
  );
};


export default BoostModal;
