"use client";

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/en';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { useModal } from '@/src/state/context/modal';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";

dayjs.extend(isBetween);

const FormSchema = z.object({
    request_date: z.enum(["all", "mentions", "none"], {
        required_error: "You need to select a notification type.",
    }),
    request_time: z.string()
});

const CalendarTimePicker: React.FC = () => {
    const MOBILE_WIDTH_THRESHOLD = 480;
    const TABLET_WIDTH_THRESHOLD = 768;

    const [deviceWidth, setDeviceWidth] = useState(window.innerWidth);
    const [renderContent, setRenderContent] = useState(deviceWidth <= MOBILE_WIDTH_THRESHOLD);

    const { requestCallModal, setRequestCallModal } = useModal();
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(currentDate);
    const [selectedTime, setSelectedTime] = useState('13:00');

    const startTime = dayjs().startOf('day').add(12, 'hour');
    const endTime = dayjs().startOf('day').add(16, 'hour').add(30, 'minute');

    // Define time intervals within the specified range
    const timeIntervals = Array.from({ length: 48 }, (_, i) =>
        dayjs().startOf('day').add(i * 30, 'minute')
    ).filter(time => time.isBetween(startTime, endTime, 'minute', '[)'));

    // Handle date selection
    const handleDateSelection = (date: dayjs.Dayjs) => {
        setSelectedDate(date);
    };

    // Handle time selection
    const handleTimeSelection = (time: dayjs.Dayjs) => {
        setSelectedTime(time.format('HH:mm'));
    };

    // Toggle modal state
    const handleToggleModal = () => {
        setRequestCallModal(!requestCallModal);
    };

    
    useEffect(() => {
        const handleResize = () => {
            setDeviceWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup event listener
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    useEffect(() => {
        setRenderContent(deviceWidth <= MOBILE_WIDTH_THRESHOLD);
    }, [deviceWidth]);

  
    const getFourDaysRange = (currentDate: dayjs.Dayjs): Array<dayjs.Dayjs> => {
       
        const days: Array<dayjs.Dayjs> = [];
        for (let i = 0; i < 4; i++) {
            days.push(currentDate.add(i, 'day'));
        }
        return days;
    };


    const handleNextFourDays = () => {
        setCurrentDate(currentDate.add(4, 'day'));
    };

   
    const handlePreviousFourDays = () => {
        setCurrentDate(currentDate.subtract(4, 'day'));
    };


    const getSevenDaysRange = (currentDate: dayjs.Dayjs): Array<dayjs.Dayjs> => {
        const startOfWeek = currentDate.startOf('week');
        const endOfWeek = currentDate.endOf('week');
        const days: Array<dayjs.Dayjs> = [];

        let day = startOfWeek;
        while (day.isBefore(endOfWeek, 'day') || day.isSame(endOfWeek, 'day')) {
            days.push(day);
            day = day.add(1, 'day');
        }
        return days;
    };

   
    const renderFourDays = () => {
        const fourDaysRange = getFourDaysRange(currentDate);

        return (
            <div className="grid grid-cols-4 gap-3">
                {fourDaysRange.map((d, index) => (
                    <div
                        key={index}
                        className={`py-2 px-4 flex flex-col items-center gap-y-3 text-center cursor-pointer rounded-xl shadow-md ${d.isSame(selectedDate, 'day') ? 'bg-pink text-white' : 'text-lightGray'
                            }`}
                        onClick={() => handleDateSelection(d)}
                        role="button"
                        aria-label={`${d.format('dddd D MMMM YYYY')}`}
                    >
                        <div className="text-sm font-thin">{d.format('ddd')}</div>
                        <div className="font-medium">{d.format('D')}</div>
                    </div>
                ))}
            </div>
        );
    };

    
    const renderWeek = () => {
        const days = getSevenDaysRange(currentDate);

        return (
            <div className="grid grid-cols-7 gap-3">
                {days.map((d, index) => (
                    <div
                        key={index}
                        className={`py-2 px-4 flex flex-col items-center gap-y-3 text-center cursor-pointer rounded-xl shadow-md ${d.isSame(selectedDate, 'day') ? 'bg-pink text-white' : 'text-lightGray'
                            }`}
                        onClick={() => handleDateSelection(d)}
                        role="button"
                        aria-label={`${d.format('dddd D MMMM YYYY')}`}
                    >
                        <div className="text-sm font-thin">{d.format('ddd')}</div>
                        <div className="font-medium">{d.format('D')}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4">
            {/* Date Picker */}
            <div className="grid gap-y-1">
                <p className="tracking-wide text-sm">Choose date</p>

                <div className="rounded-lg shadow-lg p-3 grid gap-y-4">

                    {/* Month navigation */}
                    <div className="flex justify-center items-center mb-2 gap-7">
                        <button
                            className="text-sm rounded-full bg-white shadow-2xl drop-shadow-xl"
                            onClick={() => setCurrentDate(prev => prev.subtract(1, 'month'))}
                            aria-label="Previous Month"
                        >
                            <ChevronLeft color="#E688A3" size={18} />
                        </button>
                        <span>{currentDate.format('MMMM')}   <span> {currentDate.format('YYYY')}</span></span>
                        <button
                            className="text-sm rounded-full bg-white shadow-2xl drop-shadow-xl"
                            onClick={() => setCurrentDate(prev => prev.add(1, 'month'))}
                            aria-label="Next Month"
                        >
                            <ChevronRight color="#E688A3" size={18} />
                        </button>
                    </div>

                    {/* Week navigation */}
                    <div className="flex items-center gap-x-4">
                        <button
                            className="text-sm rounded-full bg-white shadow-2xl drop-shadow-xl"
                            onClick={handlePreviousFourDays}
                            aria-label="Previous 4 Days"
                        >
                            <ChevronLeft color="#E688A3" size={18} />
                        </button>

                        {/* Render appropriate content */}
                        {renderContent ? renderFourDays() : renderWeek()}

                        <button
                            className="text-sm rounded-full bg-white shadow-2xl drop-shadow-xl"
                            onClick={handleNextFourDays}
                            aria-label="Next 4 Days"
                        >
                            <ChevronRight color="#E688A3" size={18} />
                        </button>
                    </div>

                </div>
            </div>

            {/* Time Picker */}
            <div className="mt-4">
                <p className="tracking-wide text-sm">Choose time</p>

                <div className="bg-white rounded p-2">
                    {/* Display time intervals */}
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-2">
                        {timeIntervals.map((time, index) => (
                            <button
                                key={index}
                                className={`py-2 px-5 w-fit text-center text-sm cursor-pointer shadow-lg drop-shadow-lg rounded-lg ${time.format('HH:mm') === selectedTime ? 'bg-pink text-white' : ''
                                    }`}
                                onClick={() => handleTimeSelection(time)}
                                aria-label={time.format('HH:mm')}
                            >
                                {time.format('HH:mm')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Button group */}
            <div className="flex justify-between text-sm mt-3">
                <Button className="border-[1.5px] border-pink bg-white h-10 w-fit px-7 rounded-lg" onClick={()=>setRequestCallModal(false)}>
                    Cancel
                </Button>

                <Button className="text-white bg-green h-10 w-fit px-7 rounded-lg">
                    Save
                </Button>
            </div>
        </div>
    );
};

export default CalendarTimePicker;
