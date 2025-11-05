"use client";

import ContactForm from "@/src/components/ContactForm";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import Link from "next/link";
import Image from "next/image";
import Footer from "../../app-reusables/Footer";

const ContactUsPage = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  const handleBackHomeClick = () => {    
    router.push("/");
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    const theLastSeenSplash = localStorage.getItem("theLastSeenSplash");
    const currentDate = new Date().toLocaleDateString();

    const userAgent = navigator.userAgent;
    setIsSafari(
      !!userAgent.match(/Version\/[\d\.]+.*Safari/) &&
        !userAgent.includes("CriOS")
    );
    setIsChrome(!!userAgent.match(/CriOS/));

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={`${isSafari ? "h-full" : "h-screen"} flex flex-col overflow-auto no-scrollbar relative bg-background new-blur-bg`}>
        <nav className="flex lg:flex-1 lg:justify-end items-top lg:mb-6 lg:px-120px md:px-20 lg:pt-8 ">
        
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
        className={`${
          isSafari ? "lg:h-full" : "h-full"
        } w-full overflow-x-hidden h-full `}
      >
          
          <div className="w-full h-full md:pb-4 ">
            <div className="flex flex-col lg:flex-row w-full h-full lg:justify-between items-center -mt-8 lg:-mt-12">
              <div className="px-4 lg:px-120px md:px-20 flex justify-center lg:justify-start w-full lg:w-[46%] items-center p-0 mt-8 md:mt-0">
                <Image
                  className="w-[140px] h-[140px] lg:w-[340px] lg:h-auto 2xl:w-[390px] 2xl:h-auto object-contain"
                  width={91}
                  height={91}
                  src={"/assests/logo.svg"}
                  alt="logo"
                />
              </div>

              <div className="px-4 md:px-20 w-full lg:w-[54%] lg:mt-0 lg:px-0 text-white h-full lg:flex lg:justify-center lg:items-center">
                <div className="h-full md:h-fit">
                  <div className="h-full w-full flex flex-col justify-between md:justify-normal lg:w-2/3">
                    <div className="w-full">
                      <div className="lg:mb-6">
                        <h3 className="font-medium lg:text-4xl 2xl:text-5xl text-32px mb-2 2xl:mt-16">
                          Contact us 
                        </h3>
                        <p className="text-[15px] md:text-sm 2xl:text-lg mt-4 font-thin 2xl:mt-8 mb-3 md:mb-0 2xl:mb-12"> 
                          If you have any questions, kindly utilize the form
                          provided below to get in touch with us.
                        </p>
                      </div>

                      <ContactForm />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:hidden flex-1 w-full">
                <Footer/>
              </div>
            </div>
          </div>
      </div>
      <div className="hidden md:block absolute bottom-0 w-full">
        <Footer/>
      </div>
    </div>
  );
};

export default ContactUsPage;

