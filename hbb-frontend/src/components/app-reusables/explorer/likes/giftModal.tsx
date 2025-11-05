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
} from "@/src/components/ui/form";
import Image from 'next/image';
import { toast } from "sonner";
import { onSubmitError } from "@/src/lib/utils";
// import { giftSchema } from "@/src/schema/gift/gift";
import data from "@/src/constants/gifts";
interface Gift {
  id: number;
  image: string;
  title: string;
  price: string;
}

const GiftModal = ({ isOpen, onClose, item }) => {
  const [isPending, startTransition] = React.useTransition();
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);;

  const form = useForm({
    // resolver: zodResolver(giftSchema),
    defaultValues: {
      giftType: selectedGift? selectedGift : null,
    },
  });

  if (!isOpen) return null;

  const handleGiftClick = (gift) => {
    setSelectedGift(gift);
  };

  const values = form.getValues();

  const onHandleSubmit = async (data: any) => {
    toast.success("Gift sent");

    startTransition(async () => {
      try {
        //   code to hit backend
      } catch (error: any) {
        console.error("Error sending gift:", error?.message);
        // Handle any errors here, such as displaying an error message to the user
        toast.error("Error submitting report. Please try again later.");
      }
    });
  };

  const isDisabled = values.giftType !== null;

  return (
    <main 
    className="fixed inset-0 z-50 flex items-center bg-[#00000099] justify-center bg-opacity-50 backdrop-filter backdrop-blur-[6px]"
    >
      <div className="flex flex-col bg-pink rounded-[15px] w-[93%] md:w-[60%] h-[82dvh] md:h-[65dvh] relative p-5">
        {/* close button */}
        <Button
          className="bg-white absolute right-0 top-0 m-3 p-1 h-6 w-6 rounded-[5px]"
          onClick={onClose}
        >
          <CancelIcon className="h-5" />
        </Button>

        <div>
          <p className="mt-3 md:mt-4 font-[400] text-[20px] border-b border-[#ffffff50] w-full pb-2 mb-3 md:mb-5">
            Gifts
          </p>

          <p className="flex justify-start text-[14px] md:text-[12px] mb-2 md:mb-3">
            Show support by sending her one of the above options
          </p>

          <form
            className="flex flex-col items-center justify-center"
            onSubmit={form.handleSubmit(onHandleSubmit, (errors: any) => {
              onSubmitError(errors);
            })}
          >
            <Form {...form}>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data?.map((gift) => (
                <div
                  className={`cursor-pointer rounded-[10px] flex md:flex-col items-center border justify-between border-[#ffffff50] p-4  ${
                    selectedGift?.id === gift?.id ? "bg-base1 border-base" : ""
                  }`}
                  key={gift?.id}
                  onClick={() => handleGiftClick(gift)}
                >
                  <div className="w-[53%] md:w-full h-[50px] md:h-[120px] flex items-center justify-center">
                    <Image
                      src={gift?.image}
                      alt={gift?.title}
                      className="object-contain h-full"
                    />
                  </div>

                  <div className="flex flex-col w-full items-center justify-end md:justify-center">
                  <p className="mt-2 text-center w-[43%] text-[12px] md:text-[10px] text-[#ffffff50] border-b border-[#ffffff50]">
                    {gift?.title}
                  </p>
                  <p className="mt-1 text-center text-[20px]">
                    {gift?.price}
                  </p>
                  </div>

                </div>
              ))}
            </div>
            <Button
              className={`text-[12px] mt-5 md:mt-10 text-black w-[100%] md:w-[40%] h-9 rounded-[20px] shadow-custom-shadow-component ${
                !isDisabled
                  ? "bg-lightgray cursor-not-allowed text-gray"
                  : "bg-tertiary hover:bg-tertiaryHover"
              }`}
              disabled={!isDisabled}
              loading={isPending}
              variant="yellow"
              type="submit"
            >
              Send gift
            </Button>
            </Form>
          </form>
          <Button className="md:hidden w-full text-center text-[12px] h-10 bg-transparent" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </main>
  );
};

export default GiftModal;
