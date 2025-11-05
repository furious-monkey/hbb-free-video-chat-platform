"use client";

import React, { useTransition, useState, useMemo, useEffect } from "react";
import Image from "next/image";
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
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { toast } from "sonner";
import Select, { StylesConfig } from "react-select";
import WaitlistService from "@/src/api/waitlist";
import countryList from "react-select-country-list";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

const waitlistSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  ageConfirmation: z.boolean().refine((val) => val === true, {
    message: "You must confirm that you are 18 or older",
  }),
});

const WaitListForm = () => {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const options = useMemo(() => countryList().getData(), []);

  // Helper function for random range
  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Trigger confetti when success state changes
  useEffect(() => {
    if (isSuccess) {
      // Fire confetti from multiple angles for a celebration effect
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Fire from left edge
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#E688A3', '#4B3567', '#EFD378', '#FFD662', '#ffffff']
        });
        
        // Fire from right edge
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#E688A3', '#4B3567', '#EFD378', '#FFD662', '#ffffff']
        });
      }, 250);

      // Also fire a big burst from the center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E688A3', '#4B3567', '#EFD378', '#FFD662', '#ffffff']
      });
    }
  }, [isSuccess]);

  const customStyles: StylesConfig = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      borderColor: state.isFocused ? "#ffffff" : "#ffffff60",
      borderRadius: "8px",
      outline: "none",
      "&:hover": {
        borderColor: "#ffffff",
      },
      color: "#161615",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "white",
      fontSize: "14px",
    }),
    option: (provided, state) => ({
      ...provided,
      color: "black",
      fontSize: "14px",
      backgroundColor: state.isFocused ? "#E688A3" : "transparent",
      "&:hover": {
        backgroundColor: "#E688A3",
        color: "#161615",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#161615",
      fontSize: "14px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#C1C1C1",
      fontSize: "14px",
    }),
    input: (provided) => ({
      ...provided,
      color: "#161615",
    }),
  };

  const form = useForm<z.infer<typeof waitlistSchema>>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      name: "",
      email: "",
      location: "",
      ageConfirmation: false,
    },
  });

  const onHandleSubmit = async (data: z.infer<typeof waitlistSchema>) => {
    startTransition(async () => {
      try {
        const response = await WaitlistService.joinWaitlist(data);

        if (response.success) {
          setIsSuccess(true);
          setReferralCode(response.data?.referralCode || "");
          toast.success("Successfully joined the waitlist!");
          form.reset();
        }
      } catch (error: any) {
        console.error("Error submitting waitlist form:", error);

        // Show specific error messages
        if (error.message === "This email is already on the waitlist") {
          toast.error("This email is already registered on our waitlist!");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      }
    });
  };

  const { formState } = form;
  const { isValid } = formState;

  const router = useRouter();

  const redirectToHome = () => {
    router.push("/");
  };

  // Success state UI
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center h-full lg:p-8 lg:w-3/4 mx-auto lg:max-w-[565px] h-full">
        <div className="bg-[#4B3567] rounded-2xl p-6 lg:p-8 w-full max-w-md lg:max-w-lg xl:max-w-xl text-white text-center animate-in fade-in-0 zoom-in-95 duration-500">
          <div className="flex justify-center mb-4" onClick={redirectToHome}>
            <Image
              className="w-[64px] h-[64px] lg:w-[80px] lg:h-[80px] cursor-pointer"
              width={120}
              height={120}
              src={"/assests/logo.svg"}
              alt="logo"
            />
          </div>

          <h2 className="text-xl lg:text-2xl font-bold mb-4">
            🎉 Welcome to HBB!
          </h2>
          <p className="text-base mb-4">
            You're on the list! We'll be in touch soon with your early access.
          </p>
          <p className="text-xs lg:text-sm opacity-80">
            Keep an eye on your inbox, we'll be sending you a referral code as
            we get closer to launch so you can secure your spot and start
            inviting your community.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full lg:px-8 lg:py-4 lg:w-3/4 mx-auto lg:max-w-[565px] h-full max-h-[750px]">
      <div className="bg-[#4B3567] rounded-2xl h-full p-6 lg:px-8 lg:pb-4 w-full max-w-md lg:max-w-lg xl:max-w-xl text-white">
        <div className="flex justify-center mb-2">
          <Image
            className="w-[64px] h-[64px] lg:w-[80px] lg:h-[80px]"
            width={120}
            height={120}
            src={"/assests/logo.svg"}
            alt="logo"
          />
        </div>

        <div className="w-full h-[1px] bg-[#EFD378] mb-2"></div>

        <div className="text-left lg:mb-2">
          <h2 className="text-xs lg:text-base font-medium mb-2">
            Join the HBB waitlist and be among the first to connect with fans
            through paid video chats.
          </h2>
          <p className="text-xs lg:text-base mb-2">
            Set your rate. Own your time. Get early access.
          </p>
          <p className="text-xs lg:text-base opacity-90">
            Keep an eye on your inbox, we'll be sending you a referral code as
            we get closer to launch so you can secure your spot and start
            inviting your community.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onHandleSubmit)}
            className="space-y-3 pt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-xs font-medium">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter"
                      className="bg-white border-0 rounded-lg px-3 !text-sm py-2 placeholder:text-gray-400 !text-[#161615] !h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[#FFD662] text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white !text-xs font-medium">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter"
                      className="bg-white border-0 rounded-lg px-3 py-2 !text-sm placeholder:text-gray-400 !text-[#161615] !h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[#FFD662] !text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-white !text-xs font-medium">
                    Location
                  </FormLabel>
                  <FormControl>
                    <Select
                      options={options}
                      placeholder="Country"
                      classNamePrefix="react-select"
                      styles={customStyles}
                      value={options.find(
                        (option) => option.label === field.value
                      )}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption?.label);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-[#FFD662] !text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageConfirmation"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-white data-[state=checked]:bg-[#E688A3] data-[state=checked]:border-[#E688A3]"
                    />
                  </FormControl>
                  <FormLabel className="text-white !text-xs font-normal cursor-pointer">
                    Please confirm that you are 18 or older
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormMessage className="text-[#FFD662] !text-xs" />

            <div className="pt-3 flex justify-center w-full">
              <Button
                type="submit"
                disabled={!isValid || isPending}
                loading={isPending}
                variant={"default"}
                className={`w-full px-5 py-3 rounded-full text-black font-normal !mx-auto px-8 !text-white !w-fit text-sm h-10 ${
                  !isValid
                    ? "bg-lightgray text-gray"
                    : "bg-[#E688A3] hover:bg-[#d97592]"
                }`}
              >
                Join Waitlist
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default WaitListForm;