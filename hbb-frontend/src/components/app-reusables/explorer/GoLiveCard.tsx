import React from 'react';
import { LikeIcon, VideoIcon } from '../../svgs';
import { Button } from '../../ui/button';
import { useModal } from '@/src/state/context/modal';

const GoLiveCard = ({data, hideModal}:any) => {

    const {setGoModal, goModal} = useModal()

    const handleToggleModal = () => {
        setGoModal(!goModal); // Toggle the modal state
    };
    return (
        
        <div className="relative md:h-[12rem] h-[14rem] md:w-[15rem] mx-auto w-full rounded-lg" onClick={handleToggleModal}>
            {/* Background  tag */}
            <p className='bg-base1 absolute top-0 left-0 h-full w-full rounded-lg'></p>

            {/* Content divs on top of background */}
            <div className="absolute flex flex-col justify-between h-full w-full p-2">
                {/* Top section */}
                <div className="flex justify-end">
                    {data.liked ?
                    <p className='bg-pink p-2 rounded-md'>
                         <LikeIcon/> 
                    </p>
                        : <Button className='bg-white h-8 md:h-6 md:px-2 w-auto md:text-[10px] rounded-md text-black' variant="ghost">
                            Like
                        </Button>}
                </div>

                {/* Bottom section */}
                <div className="flex justify-between gap-2">
                    <div className=' bg-overlay px-2 py-1 backdrop-blur-lg w-full rounded-lg text-tertiary'>
                        <p>{data.name}, <span>{data.age}</span></p>
                        <p className='text-xs'>{data.location}</p>
                    </div>
                    <p className='p-2 bg-overlay backdrop-blur-lg w-fit m-auto rounded-lg'>
                        <VideoIcon />
                    </p>
                </div>
            </div>
        </div>
    );
}

export default GoLiveCard;
