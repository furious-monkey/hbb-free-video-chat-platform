import { Input } from "@/src/components/ui/input";
import Image from "next/image";
import React from "react";

type CallerOfferProps = {
  offer: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const CallerOffer = ({ offer, handleInputChange }: CallerOfferProps) => {
  return (
    <div className="bg-base1 rounded-3xl 2xl:p-4 p-3">
      <div className="rounded-full bg-white/15 w-full flex items-center justify-between 2xl:pr-6 lg:pr-4 pr-6">
        <div className="flex items-center">
          <div className="bg-base2 w-12 h-12 lg:w-9 lg:h-9 2xl:w-12 2xl:h-12 rounded-full 2xl:mr-[14px] lg:mr-[10px] mr-3"></div>

          <Image
            src={"/assests/phone.svg"}
            alt={"call"}
            height={24}
            width={24}
          />

          <p className="2xl:ml-4 lg:ml-3 ml-4 text-sm text-black">
            Joining live...
          </p>
        </div>

        <p className="text-black font-medium 2xl:text-22 text-lg">10</p>
      </div>

      <p className="mt-[6px]">James M, 25</p>

      <div className="mt-2 2xl:mt-[14px]">
        <p className="text-xs mb-[6px]">Caller’s offer</p>

        <div className="flex items-center text-sm text-black px-[14px] py-[15px] lg:py-3 2xl:py-[15px] rounded-md w-full h-fit bg-white/15">
          <p>$</p>
          <Input
            placeholder="0.00"
            value={offer}
            onChange={handleInputChange}
            className="placeholder:text-black  border-none outline-none focus:border-none h-fit p-0 pl-1"
          />
        </div>
      </div>
    </div>
  );
};

export default CallerOffer;
