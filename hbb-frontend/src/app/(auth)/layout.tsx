"use client";

import React from "react";
import Image from "next/image";

import Footer from "@/src/components/app-reusables/Footer";
import AuthLayoutCardHeader from "@/src/components/AuthLayoutCardHeader";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignupModalProvider } from "@/src/context/SignupModalContext";
import SignupModalWrapper from "@/src/components/app-reusables/SignupModalWrapper";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const specialRoutes =
    pathname === "/login" || pathname === "/forgot-password";

  return (
    <SignupModalProvider>
      <SignupModalWrapper />
      <main className="lg:flex lg:flex-col min-h-screen h-full lg:h-screen overflow-y-auto lg:overflow-hidden no-scrollbar bg-white">
        <div className="w-full h-full bg-background new-blur-bg overflow-hidden">
          <div className="w-full h-full py-35px px-4 lg:py-2 2xl:py-14 lg:px-120px md:px-20 md:py-12">
            <div className="flex flex-col lg:flex-row w-full h-full lg:justify-between items-center">
              <div className="hidden lg:flex justify-center lg:justify-start w-full lg:w-[46%] items-center p-0 mt-2 md:mt-0">
                <Image
                  className="w-[140px] h-[140px] lg:w-[380px] lg:h-auto 2xl:w-[400px] 2xl:h-auto object-contain"
                  width={91}
                  height={91}
                  src={"/assests/logo.svg"}
                  alt="logo"
                />
              </div>

              <div className="w-full lg:w-3/6 h-full flex justify-end items-center p-0">
                <div className=" lg:h-[80vh] md:h-full flex flex-col lg:flex-row lg:items-center md:w-4/5 w-[343px] m-auto">
                  <div className="m-auto flex flex-col bg-white rounded-3xl relative h-full min-h-[75vh] md:min-h-[550px] lg:max-h-[790px] w-full 2xl:max-h-[790px]">
                    <div className="px-4 h-max  pt-4">
                      <AuthLayoutCardHeader />
                      <div className=" overflow-hidden">{children}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <Footer />
        </div>
      </main>
    </SignupModalProvider>
  );
};

export default Layout;
