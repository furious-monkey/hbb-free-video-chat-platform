"use client";

import Image from "next/image";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { usePathname, useRouter } from "next/navigation";
import { refererSchema } from "@/src/schema/auth/referer";
import { shallow } from "zustand/shallow";
import { useUserStore } from "@/src/store/userStore";
import { z } from "zod";

interface ReferralProps {
  name: string;
  profileImage: string;
  location: string;
}

const RefererForm = () => {
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [currentReferralDetail, setCurrentReferralDetail] =
    useState<ReferralProps | null>(null);
  const { loading, getUserByReferralCode } = useUserStore(
    (state: any) => ({
      loading: state.loading,
      getUserByReferralCode: state.getUserByReferralCode,
    }),
    shallow
  );

  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.split("/")[1];

  const form = useForm<z.infer<typeof refererSchema>>({
    resolver: zodResolver(refererSchema),
    defaultValues: {
      referral_code: "", // Ensure referral_code has a default value
    },
  });

  // Debounce function to delay API call
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      const referralCode = value.referral_code;

      if (name === "referral_code") {
        // Clear previous timeout if the user is still typing
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        // Only proceed if the referral code has a value
        if (referralCode) {
          setDebounceTimeout(
            setTimeout(() => {
              if (referralCode.length === 6) {
                // Trigger the API call when referral code is exactly 6 characters
                startTransition(async () => {
                  try {
                    const response = await getUserByReferralCode(
                      {
                        referralCode: referralCode,
                      },
                      setCurrentReferralDetail
                    );

                    if (response) {
                      setCurrentReferralDetail(response.data);
                    } else {
                      setCurrentReferralDetail(null); // Invalid referral code
                    }
                  } catch (error: any) {
                    console.error(error.message);
                    setCurrentReferralDetail(null); // Error in fetching
                  }
                });
              } else if (referralCode.length < 6) {
                // Clear referral details if the code is less than 6 characters
                setCurrentReferralDetail(null);
              }
            }, 500) // Debounce delay (500ms)
          );
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, form.watch, debounceTimeout]);

  const onHandleSubmit = async (data: z.infer<typeof refererSchema>) => {
    if (!currentReferralDetail) {
      toast.error("Invalid referer code");
      return;
    } else {
      router.push(`/${segment}/sign-up?referral_code=${data.referral_code}`);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any
  ) => {
    const value = e.target.value.slice(0, 6); 
    field.onChange(value);
  };

  const { formState } = form;
  const { isValid } = formState;

  return (
    <>
      <div className="py-6 2xl:py-14 text-darkGray flex flex-col h-full">
        <div className="md:text-center">
          <p className="font-medium text-lg md:text-2xl lg:text-lg 2xl:text-2xl text-center mb-5 lg:mb-3 2xl:mb-6 w-4/5 mx-auto">
            Enter referral code
          </p>

          <p className="text-sm text-center md:text-base">
            Enter a valid referral code or hit us up for one
          </p>
        </div>

        <div className="text-center my-2 flex align-middle justify-center gap-6">
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="w-[24px] h-[24px] lg:w-[32px] lg:h-[32px] object-contain"
              width={32}
              height={32}
              src={"/assests/instagram.svg"}
              alt="instagram"
            />
          </a>

          <a
            href="https://www.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="w-[24px] h-[24px] lg:w-[32px] lg:h-[32px] object-contain"
              width={32}
              height={32}
              src={"/assests/tiktok.svg"}
              alt="tiktok"
            />
          </a>

          <a
            href="https://www.twitch.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="w-[24px] h-[24px] lg:w-[32px] lg:h-[32px] object-contain"
              width={32}
              height={32}
              src={"/assests/twitch.svg"}
              alt="twitch"
            />
          </a>
        </div>

        <div className="h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onHandleSubmit)}
              className="h-full flex justify-between flex-col gap-2"
            >
              <FormField
                control={form.control}
                name="referral_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-textGray2 text-xs mb-2 font-medium">
                      Referral code
                    </FormLabel>
                    <FormControl className="mt-1">
                      <Input
                        placeholder="Enter a valid referral code"
                        className="border-borderGray py-12.5px rounded-lg px-3 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                        value={field.value}
                        onChange={(e) => handleInputChange(e, field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                {currentReferralDetail && (
                  <div className="mb-16 md:mb-0">
                    <div className="text-center mt-4">
                      <div className="flex justify-center">
                        <Image
                          className="w-[52px] h-[52px] lg:w-[64px] lg:h-[64px] object-contain rounded-full bg-gray"
                          width={64}
                          height={64}
                          src={
                            currentReferralDetail.profileImage ||
                            "/img/hbb_user_logo.png"
                          }
                          alt="logo"
                        />
                      </div>

                      <h3 className="text-[16px] lg:text-[20px] flex items-center justify-center font-[500] mt-5 gap-2">
                        {currentReferralDetail?.name}
                        <Image
                          src="/assests/verified.svg"
                          alt="verified"
                          className=""
                          width={16}
                          height={16}
                        />
                      </h3>

                      <h3 className="text-[11px] flex items-center justify-center font-[300] mt-2 gap-2 uppercase">
                        <Image
                          src="/assests/location_black.svg"
                          alt="location"
                          className=""
                          width={20}
                          height={20}
                        />
                        {currentReferralDetail.location}
                      </h3>
                    </div>
                    <div className="mx-auto border-b-2 border-[#8FC0D3] lg:border-b-2 lg:w-1/2 mt-3 mb-[13px]" />
                  </div>
                )}

                <div 
                  className={`absolute px-4 left-0 bottom-6 md:relative md:px-0 md:bottom-0 mt-0 md:mt-0 w-full
                      ${!currentReferralDetail && "bottom-1 md:bottom-1 md:mt-20"} 
                  `}
                >
                  <Button
                    className={`w-full px-5 py-6 rounded-full text-black font-normal text-lg h-10
                      ${
                        !isValid
                          ? "bg-lightgray cursor-not-allowed text-gray"
                          : "bg-tertiary hover:bg-tertiaryHover"
                      }

                      ${!currentReferralDetail && "mt-8"}
                    `}
                    disabled={!isValid || !currentReferralDetail}
                    loading={isPending}
                    variant="yellow"
                    type="submit"
                  >
                    Proceed
                  </Button>
                </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default RefererForm;
