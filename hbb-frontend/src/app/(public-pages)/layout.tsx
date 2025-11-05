"use client";

import Footer from "@/src/components/app-reusables/Footer";
import { Button } from "@/src/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    const handleBackHomeClick = () => {    
    router.push("/");
  };

  return (
    <main className="min-h-screen h-full lg:h-screen overflow-y-auto lg:overflow-hidden no-scrollbar bg-background new-blur-bg" >
      <div 
      className="h-full flex flex-col"
      >
        <nav className="flex lg:flex-1 justify-between items-top lg:mb-6 lg:px-120px md:px-20 lg:pt-8 ">
          <div className="hidden md:flex justify-center lg:justify-start mt-6">
            <Image
              className="w-[168px] h-[168px] lg:w-[142px] lg:h-[112px]"
              width={91}
              height={91}
              src={"/assests/logo.svg"}
              alt="logo"
            />
          </div>

          <div>
            <Button className="hidden md:flex cursor-pointer !text-[16px] rounded-[40px] border border-[#ffffff] text-[#ffffff] text-center !px-8">
              <Link href="/">Back to home page</Link>
            </Button>
            <Button className="flex md:hidden  flex-row w-full  mt-[2rem]" onClick={handleBackHomeClick}>
              <Image
                className="w-[20px] h-[20px] object-contain mr-2"
                width={20}
                height={20}
                src={"/assests/back_home.svg"}
                alt="logo"
              />
              <p className="text-base font-medium text-[#ffffff]">Back</p>
            </Button>
          </div>
        </nav>

        <div 
        className="w-full flex-grow lg:flex-2 lg:h-full lg:overflow-hidden"
        >
          {children}
        </div>

        <div className="lg:flex-1  lg:pb-0">
          <Footer />
        </div>
      </div>
    </main>
  );
};

export default Layout;
