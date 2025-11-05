"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/src/components/ui/form"
import data from '@/src/constants/gifts';

const FormSchema = z.object({
    type: z.enum(["all", "mentions", "none"], {
        required_error: "You need to select a notification type.",
    }),
    message: z.string()
})
interface Props {
  isOpen: boolean | undefined;
}

interface Gift {
  id: number;
  image: string;
  title: string;
  price: string;
}

const GiftModal = ({ isOpen }: Props) => {
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);;
    const form = useForm({
        // resolver: zodResolver(FormSchema),
        defaultValues: {
            giftType: selectedGift? selectedGift : null,
        },
    })

    const [isPending, startTransition] = React.useTransition();

    const handleGiftClick = (gift) => {
        console.log({ gift });
        
        setSelectedGift(gift);
    };

    const values = form.getValues();

    const onHandleSubmit = async (data: any) => {
        startTransition(async () => {
            try {
                //   code to hit backend
            } catch (error: any) {
                console.error( error.message);
                // Handle any errors here, such as displaying an error message to the user
                toast.error("Error logging in. Please try again later.");
            }
        });
    };

    const isDisabled = values.giftType !== null;

    return (
        <>
            {isOpen &&
                <div className='py-[1rem] pt-1 w-full mx-auto rounded-lg relative h-full my-lg:my-0'>
                    <p className='text-base leading-[20.4px]'>Show support by sending a gift to this influencer</p>
                    {/* rest of the page */}
                    <section className='w-full relative mt-4 flex flex-col flex-grow justify-between pb-4 h-[calc(100%-70px)] overflow-y-auto no-scrollbar'>
                        <div className='md:flex grid md:justify-between gap-[1rem] w-full'>
                            {data.map((item) => 
                                <div 
                                    className={`${selectedGift?.id === item?.id  ? "bg-base2" : "bg-transparent"} cursor-pointer border-white/40 rounded-md border text-center md:flex md:flex-col md:content-center md:justify-between grid grid-flow-col place-items-center py-[1rem] gap-3 w-full`} 
                                    key={item.id} 
                                    onClick={() => handleGiftClick(item)}
                                >
                                    <Image src={item.image} alt={`${item.image}'s picture`} className='w-2/4 mx-auto' />
                                    <div className=''>
                                        <p className={`text-[0.69rem] font-thin w-fit mx-auto border-b ${selectedGift?.id === item?.id  ? "border-white text-white" : "border-white/40 text-white/40"} px-1 pb-[2px]`}>{item.title}</p>
                                        <p className='mt-[2px] text-[26px] font-medium'>{item.price}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className='flex w-full flex-col items-center mt-6 md:mt-0'>
                            <Button
                                className={`px-5 py-5 rounded-full text-black font-normal mx-auto text-sm h-8 lg:w-1/2 w-[95%] shadow-[8px_8px_0px_-5px_rgba(0,0,0,0.75)] ${isDisabled
                                    ? "bg-lightgray cursor-not-allowed text-gray"
                                    : "bg-tertiary hover:bg-tertiaryHover"
                                    }`}
                                loading={isPending}
                                disabled={isDisabled}
                                variant="ghost" size="default"
                                type="submit"
                            >
                                Send gift
                            </Button>
                        </div>
                    </section>
                </div>
            }
        </>
    )
}

export default GiftModal