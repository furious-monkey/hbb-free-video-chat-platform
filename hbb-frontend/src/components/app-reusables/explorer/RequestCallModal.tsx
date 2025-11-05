"use client"

import React, { useEffect, useState } from 'react'
import { CancelIcon } from '@/src/components/svgs'
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import { useModal } from '@/src/state/context/modal';
import { Separator } from '../../ui/separator';
import { z } from "zod"
import CalendarTimePicker from './CalenderGrid';


const FormSchema = z.object({
    type: z.enum(["all", "mentions", "none"], {
        required_error: "You need to select a notification type.",
    }),
    message: z.string()
})


const RequestCallModal = () => {

    const { requestCallModal, setRequestCallModal } = useModal()

    const handleToggleModal = () => {
        setRequestCallModal(!requestCallModal); // Toggle the modal state
    };


    return (
        <>
            {requestCallModal &&

                <div className='w-full h-[calc(100%-100px)] mt-7  overflow-y-auto md:h-screen backdrop-blur-sm absolute top-0 left-0 right-0 grid content-center shadow-2xl'>


                    {/* The whole Modal screen */}
                    <div className=' md:px-[1rem] px-[1rem] md:py-[1rem] py-[1rem] md:w-[70%] lg:w-[50%] w-full mx-auto bg-base1 rounded-lg relative  md:h-[90vh] h-full my-lg:my-0'>

                        {/* Close button */}
                        <div className='flex justify-end'>
                            <Button onClick={handleToggleModal} className='h-8 w-8 p-0 hidden md:block bg-placeholderText items-center rounded-md' variant="ghost">

                                <CancelIcon className='w-4/6 mx-auto p-0 text-profile' />
                            </Button>
                        </div>

                        <p className=''>Request call</p>
                        <Separator className='w-full h-[0.04rem] bg-placeholderText my-1' orientation='horizontal' />


                        {/* rest of the page that holds important modal details */}
                        <section className='w-full md:h-[90%] h-full mt-[2rem] md:mt-[1.5rem] relative text-black  '>
                            <div className='bg-white rounded-lg p-5 h-full md:h-[90%] shadow-custom-shadow'>

                                <p className='font-bold text-center'>Change Time</p>

                                <CalendarTimePicker />
                            </div>
                        </section>
                    </div>
                </div>
            }
        </>
    )
}

export default RequestCallModal