import React from 'react';
import LikedCard from './LikedCard';
import data from '@/src/constants/goLive';

const Liked = () => {
    return (
        <div className='relative flex flex-col h-[calc(100vh-100px)] w-full px-3'>
            {/* Header section (not scrollable) */}
            <div className='lg:px-2 lg:mx-0 pl-0 pt-[2rem]'>
                <p className='text-lg md:text-[1.50rem] font-bold'>200 <span className='font-extralight'>Liked</span></p>
            </div>

            {/* Scrollable section with padding */}
            <section className='flex-grow grid justify-between md:grid-cols-4 xl:grid-cols-5 grid-cols-1 gap-y-5 lg:gap-y-5 lg:gap-x-5 mx-auto w-full h-full mt-2 overflow-y-auto px-4 py-4 pb-4 pr-4'>
                {data.map((item) => (
                    <div key={item.id}>
                        <LikedCard data={item} />
                    </div>
                ))}
            </section>
        </div>
    );
};

export default Liked;
