import React from 'react'
import { LocationIcon } from '../../svgs'

const VideoProcessingOverlay = () => {
    return (
        <div className='w-full h-full absolute top-0 left-0 right-0 backdrop-blur-lg bg-blend-overlay rounded-lg flex flex-1 bg-'>
            <div className="absolute inset-0 bg-overlay opacity-100 flex flex-1 h-full w-full rounded-lg"></div>
            <div className="grid justify-center items-center h-4/5 w-full relative z-10 mx-auto">
                {/* Caller details */}
                <div className='grid text-center mx-auto'>
                    {/* Image */}
                    <p className='bg-profile h-[7rem] w-[7rem] mx-auto rounded-full'></p>

                    {/* Name */}
                    <p>Samuel Etoo</p>

                    {/* Location */}
                    <p className='flex items-center gap-2'><LocationIcon /> Washington D.C</p>
                </div>

                {/* Connection progress slider */}
                <p className='mx-auto'>Joining live ...</p>

                {/* Progress Counter */}
                <p className='text-[5rem] text-background mx-auto'>10</p>
            </div>
        </div>
    );
}

export default VideoProcessingOverlay;
