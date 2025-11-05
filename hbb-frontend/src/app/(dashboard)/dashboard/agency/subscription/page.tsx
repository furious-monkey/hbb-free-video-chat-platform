import SubscriptionForm from "@/src/components/app-reusables/form/SubscriptionForm";
import Image from "next/image";
import React from "react";

const Page = () => {
  return (
    <div className="w-full h-full flex bg-base2">
      <div className="w-full lg:w-[672px] h-full flex-auto lg:block hidden relative border-r border-[#E4BEC9]">
        <Image
          src="/assests/dashboard/dashboard.png"
          alt=""
          fill
          className="w-auto object-cover absolute"
          priority
        />
      </div>

      <div className="w-full lg:w-[960px] h-full flex-auto">
        <SubscriptionForm />
      </div>
    </div>
  );
};

export default Page;
