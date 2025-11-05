"use client"

import React, { useEffect, useState } from 'react'
import { CallIcon, CancelIcon, GiftIcon, LocationIcon } from '@/src/components/svgs'
import { Button } from '@/src/components/ui/button';
import userImage from "@/public/assests/dashboard/userImage.svg"
import { toast } from 'sonner';
import Image from "next/image"
import { useModal } from '@/src/state/context/modal';
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { Separator } from '../../ui/separator';
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
import { Input } from "@/src/components/ui/input"
import { Textarea } from '../../ui/textarea';

const FormSchema = z.object({
    type: z.enum(["all", "mentions", "none"], {
        required_error: "You need to select a notification type.",
    }),
    message: z.string()
})

interface Props {
  onClose: (value: boolean) => void;
  isOpen: boolean | undefined;
}

const ReportModal = ({ isOpen, onClose }: Props) => {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })

    const [isPending, startTransition] = React.useTransition();

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

    const handleToggleModal = () => {
        onClose(!isOpen); // Toggle the modal state
    }

    return (
        <>
            {isOpen &&
                <div className='w-full h-[calc(100%-100px)] overflow-y-auto md:h-screen backdrop-blur-sm absolute top-0 left-0 right-0 grid content-center'>
                    <div className=' md:px-[1rem] px-[1rem] md:py-[1rem] py-[1rem] md:w-[70%] lg:w-[60%] w-full mx-auto bg-base1 rounded-lg relative md:h-[70vh] h-full my-lg:my-0'>
                        {/* Close button */}
                        <div className='flex justify-end px-1 py-2'>
                             <Button
                                onClick={handleToggleModal}
                                variant="link"
                                className="absolute top-3 right-4 bg-white rounded-md p-0.5 w-6 h-6 flex items-center justify-center"
                            >
                                <CancelIcon className="w-4 h-4 text-[#6AB5D2]" />
                            </Button>
                        </div>

                         <div className='pt-2'>
                            <p className="text-xl 2xl:text-2xl leading-[30px] font-medium">
                                Report
                            </p>
                         </div>

                        <Separator className='w-full h-[0.04rem] bg-placeholderText my-2' orientation='horizontal' />
                        {/* rest of the page */}
                        <section className='w-full md:h-3/4 h-full mt-[2.5rem] relative'>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onHandleSubmit)} className="w-full md:flex flex-col justify-between gap-5 px-4">
                                    <div className=' md:flex justify-between items-center gap-[1rem] w-full'>
                                        <div className='md:w-[45%]'>
                                            <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-5 text-white text-base">
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex flex-col space-y-4"
                                                            >
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="all" className='border border-white w-6 h-6' />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-sm text-white">
                                                                        Catfishing
                                                                    </FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="all" className='border border-white w-6 h-6' />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-sm text-white">
                                                                        Misconduct
                                                                    </FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="all" className='border border-white w-6 h-6' />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-sm text-white">
                                                                        Harassment
                                                                    </FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="all" className='border border-white w-6 h-6' />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-sm text-white">
                                                                        Illegal activity
                                                                    </FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="all" className='border border-white w-6 h-6' />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-sm text-white">
                                                                        Other
                                                                    </FormLabel>
                                                                </FormItem>
                                                            </RadioGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                        </div>
                                        <div className='w-full h-full rounded-lg mt-7 md:mt-0'>
                                            <FormField
                                                control={form.control}
                                                name="message"
                                                render={({ field }) => (
                                                    <FormItem className='w-full h-full'>
                                                        <FormLabel className='text-xs 2xl:text-sm text-white/60 mb-2'>Write description [optional]</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={10} placeholder="Write something here" {...field} className=' placeholder:text-placeholderText placeholder:opacity-60 w-full h-full border-0 mt-1 backdrop-blur-xl bg-white/20' />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Bottom section */}
                                    {/* <div className='md:absolute bottom-6 md:left-1/2 md:-translate-x-1/2 text-center grid gap-3 w-full mt-5 md:mt-0'> */}
                                    <div className='text-center w-full mt-2 md:mt-8'>
                                        <Button variant="yellow" className="bg-tertiary shadow-custom-shadow w-3/6 mx-auto flex items-center lg:gap-2 h-10 text-black text-sm">
                                            Send Report
                                        </Button>
                                    </div>

                                </form>
                            </Form>
                        </section>
                    </div>
                </div>
            }
        </>
    )
}

export default ReportModal