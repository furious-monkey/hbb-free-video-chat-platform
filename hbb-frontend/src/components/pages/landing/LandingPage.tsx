"use client";

import React, { useEffect, useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import Footer from "@/src/components/app-reusables/Footer";
import Modal from "@/src/components/app-reusables/Modal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "../../ui/carousel";
import landingPageData from "@/src/constants/landingPage";
import {
  button1GreenStyle,
  button2RedStyle,
} from "@/src/constants/buttonStyles";

const Landingpage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState(false);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [showVideo, setShowVideo] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const plugin = React.useRef(Autoplay({ delay: 7000 }));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    const theLastSeenSplash = localStorage.getItem("theLastSeenSplash");
    const currentDate = new Date().toLocaleDateString();

    if (theLastSeenSplash === currentDate) {
      setLoading(false);
    } else {
      setShowVideo(true);
      localStorage.setItem("theLastSeenSplash", currentDate);
    }

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

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleYesClick = () => {
    handleModalClose();
    router.push("/sign-up");
  };

  const handleBackHomeClick = () => {    
    router.push("/");
  };

  const handleVideoEnd = () => {
    setShowVideo(false);
    setLoading(false);
  };

  return (
    <div
      className={`md:overflow-hidden h-full lg:h-screen bg-white`}
    >
      {showVideo && (
        <div className="fixed top-0 left-0 w-full h-full bg-black z-50 flex items-center justify-center">
          <video
            src={
              isMobile
                ? "/videos/intro_video_mobile.mp4"
                : "/videos/intro_video_desktop.mp4"
            }
            autoPlay
            onEnded={handleVideoEnd}
            width="100%"
            height="100%"
            muted
            className="w-full h-full object-cover"
            playsInline
          />
        </div>
      )}

      {!showVideo && (
        <div
          className={`${isSafari ? "h-full" : "h-screen"} flex flex-col`}
        >
          <nav className="flex flex-1 lg:justify-end items-top lg:px-120px md:px-20 lg:pt-8 mb-12 md:mb-20 z-10 sticky visibility-hidden">
            <div style={{ visibility: "hidden" }}>
              <Button className="hidden md:flex cursor-pointer !text-[16px] rounded-[40px] border border-[#ffffff] text-[#ffffff] text-center !px-8">
                <Link href={process.env.NEXT_PUBLIC_LANDING_PAGE_URL || ""}>
                  Back to home page
                </Link>
              </Button>
              <Button className="flex md:hidden flex-row w-full mt-[2rem]" onClick={handleBackHomeClick}>
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
            } w-full bg-background !overflow-hidden -mt-[10.5rem] h-full flex flex-2 new-blur-bg`}
          >
            {/* this one right below */}
            <div className="w-full h-full py-2 px-4 lg:py-14 lg:px-120px md:px-20 md:py-12 max-h-[100%] overflow-scroll lg:overflow-hidden m-auto flex pb-0 no-scrollbar"> 
              <div className="flex flex-col lg:flex-row w-full h-full justify-center lg:justify-between items-center">
                <div className="flex justify-center lg:justify-start w-full lg:w-[46%] items-center p-0 mt-2 md:mt-0">
                  <Image
                    className="w-[140px] h-[140px] lg:w-[380px] lg:h-auto 2xl:w-[400px] 2xl:h-auto object-contain"
                    width={91}
                    height={91}
                    src={"/assests/logo.svg"}
                    alt="logo"
                  />
                </div>

                <div className="w-full lg:w-[54%] md:px-6 lg:px-0 text-white h-full lg:flex lg:justify-center lg:items-center max-h-[400px]">
                  <div className="h-full md:h-fit">
                    <div className="h-full w-full flex flex-col justify-normal md:justify-normal">
                      <div className="mt-6  md:mt-0">
                        <Carousel
                          opts={{ loop: true, align: "center" }}
                          plugins={[plugin.current]}
                          setApi={setApi}
                          className="w-full h-max lg:h-full flex"
                        >
                          <CarouselContent className="m-0 p-0 h-full">
                            {landingPageData.map((item, index) => (
                              <CarouselItem key={index} className="p-0 m-0">
                                <div className="px-2 md:px-0">
                                  <h4 className="text-[32px] font-medium leading-[40.83px] 2xl:leading-[72px] 2xl:text-64px mb-4 2xl:mb-5 2xl:mb-8">
                                    {item.heading}
                                  </h4>
                                  <p className="text-xs sm:text-[15px] leading-[22.5px] 2xl:leading-[27px] 2xl:text-lg 2xl:w-4/5">
                                    {item.text}
                                  </p>
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                        </Carousel>
                      </div>

                      <div className="flex flex-col gap-4 lg:flex-row md:gap-6 lg:mt-20 mt-10 md:mt-24 transition-colors ease-in-out delay-100 duration-700 mb-4 px-2 lg:px-0">
                        <Button
                          className={`text-base 2xl:text-lg h-12 lg:h-10 px-[48px] lg:px-[28px] py-[10px] lg:py-[20.5px] lg:rounded-40 rounded-full cursor-pointer text-center w-full lg:w-fit 
                            bg-white text-textGray
                          `}
                          onClick={() => {
                            setShowModal(true);
                          }}
                        >
                          <p>Sign Up</p>
                        </Button>

                        <Button
                          asChild
                          variant="secondary"
                          className="text-base 2xl:text-lg h-12 lg:h-10 px-[48px] lg:px-[28px] py-[13.5px] lg:py-[20.5px] lg:rounded-40 rounded-full cursor-pointer text-center w-full lg:w-fit text-white border border-white"
                        >
                          <Link href="/login">Log in</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <Footer />
          </div>
        </div>
      )}

      <div
        className={`top-0 left-1/2 transform -translate-x-1/2 absolute overflow-y-hidden z-40 w-full h-full ${
          showModal ? "top-1/2 transform -translate-y-1/2" : "-translate-y-full"
        } ease-in-out duration-500`}
      >
        <Modal
          isOpen={showModal}
          onClose={handleModalClose}
          onYesClick={handleYesClick}
          question="Are you 18 or older?"
          button1Text="Yes, I am"
          button2Text="No, cancel"
          button1Style={button1GreenStyle}
          button2Style={button2RedStyle}
        />
      </div>
    </div>
  );
};

export default Landingpage;
