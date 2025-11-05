"use client";

import { agencyProfileSchema } from "@/src/schema/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useTransition, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "../../ui/button";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "../../ui/input";
import { PhoneInput } from "../../ui/phone-input";
import * as RPNInput from "react-phone-number-input";

const AgencyProfileForm = () => {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | undefined>(undefined);
  const [subscription, setSubscription] = useState(false);

  const router = useRouter();

  const pathname = usePathname();
  const segment = pathname.split("/")[2];

  const form = useForm<z.infer<typeof agencyProfileSchema>>({
    resolver: zodResolver(agencyProfileSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      phone: "",
    },
  });

  const onHandleSubmit = async (data: z.infer<typeof agencyProfileSchema>) => {
    const {firstname, lastname, phone } = data;

    startTransition(async () => {
      try {
        // await dispatch(
        //   setUserProfile({
        //     email,
        //     firstname,
        //     lastname,
        //     phone,
        //     dob: "",
        //     sex: "",
        //     subscription,
        //   })
        // );

        router.push(`/dashboard/${segment}/subscription`);
      } catch (error: any) {
        console.error( error.message);
        toast.error("Error creating profile, try again or contact support");
      }
    });

    form.reset();
  };

  const { formState } = form;
  const { isValid } = formState;

  const handleImageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    inputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setImage(file);
  };

  return (
    <div className="h-full w-full px-4 pt-7 pb-9 md:px-14 md:py-10 lg:py-14 flex flex-col">
      <div className="h-full w-full text-white overflow-y-auto no-scrollbar">
        <div className="">
          <p className="font-medium text-lg md:text-2xl lg:text-lg 2xl:text-2xl mb-3 2xl:mb-6">
            Provide your personal information
          </p>

          <p className="text-[#DCDFE5] text-sm lg:text-base">
            Complete your information and verify your identity to get started
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onHandleSubmit)}>
            {/* Image and video */}
            <div className="flex gap-6 flex-col md:flex-row my-8 lg:mt-12">
              <div className={`flex items-center gap-5 w-fit`}>
                <div>
                  <Image
                    src={
                      image ? URL.createObjectURL(image) : "/assests/camera.svg"
                    }
                    alt={""}
                    width={112}
                    height={112}
                    className="w-24 h-24 lg:w-28 lg:h-28 rounded-full"
                  />

                  <Input
                    type="file"
                    accept="image/*"
                    ref={inputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <Button
                  className="text-base2 py-[6px] px-3 rounded-lg bg-white h-fit text-xs"
                  onClick={handleImageClick}
                >
                  Choose photo
                </Button>
              </div>
            </div>

            <div className="space-y-[15px] lg:space-y-6 pt-8 border-t border-white">
              {/* Names */}
              <div className="flex flex-col md:flex-row gap-[15px]">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-white text-xs mb-2 font-medium">
                        First name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter"
                          className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-white text-xs mb-2 font-medium">
                        Last name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter"
                          className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* phone and email */}
              <div className="flex flex-col md:flex-row gap-[15px]">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-white text-xs mb-2 font-medium">
                        Phone number
                      </FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter a phone number"
                          {...field}
                          value={field.value as RPNInput.Value | undefined}
                          onChange={(value) => field.onChange(value)}
                          international
                          defaultCountry="US"
                          className="!h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-white text-xs mb-2 font-medium">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="honeybunnybun@gmail.com"
                          className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
              </div>
            </div>

            <div className="mt-8 md:mt-[91px] text-center">
              <div className="flex justify-center mb-4">
                <Button
                  className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full text-gray font-normal text-sm shadow-[2px_2px_0px_2px_#000000] ${
                    !isValid
                      ? "bg-lightgray text-gray"
                      : "bg-tertiary hover:bg-tertiaryHover text-black"
                  }
              `}
                  // disabled={!isValid}
                  loading={isPending}
                  variant="yellow"
                  type="submit"
                >
                  Proceed to verification
                </Button>
              </div>

              <p className="text-[#F2EE98] text-sm">Save updates</p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AgencyProfileForm;
