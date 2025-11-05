"use client";

import Image from "next/image";

interface Props {
  imageLink: string;
  message: string;
  mini_text?: string;
}

const EmptyStateInbox = ({ imageLink, message, mini_text }: Props) => {
  return (
    <div className="relative gap-5 h-full rounded-2xl flex flex-row justify-center overflow-hidden">
      <div className="hidden md:absolute md:block md:inset-0 md:bg-[#ffffff] md:opacity-10 md:rounded-2xl"></div>
      <div className="relative flex flex-col w-[20rem]">
        <div className="w-[124px] h-[124px] flex items-center mx-[auto] mt-[30%]">
          <Image
            src={imageLink}
            alt="no live active"
            width={124}
            height={124}
          />
        </div>
        <p className="flex justify-center text-xl font-medium mb-4">
          {message}
        </p>
        <p className="flex justify-center text-xs font-medium text-center">
          {mini_text}
        </p>
      </div>
    </div>
  );
};

export default EmptyStateInbox;
