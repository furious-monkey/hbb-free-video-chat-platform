"use client";

import { ChevronLeft, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const AuthLayoutCardHeader = () => {
  const pathname = usePathname();

  return (
    <div className="flex justify-between items-center pb-8 md:pb-4 lg:pb-6 border-b border-b-tertiary mt-2 md:mt-4">
      <div className="flex items-center">
        {pathname === "/forgot-password" ? (
          <Link
            href="/login"
            className="w-9 h-9 bg-borderWhite text-black rounded-lg flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" color="black" size={18} strokeWidth={1} />
          </Link>
        ) : (
          <div className="w-7 h-7 bg-transparent" />
        )}
      </div>

      <Image
        className="lg:w-[70px] w-[63px]"
        width={63}
        height={63}
        src={"/icons/logo.svg"}
        alt="logo"
      />

      <div className="flex lg:items-center justify-between">
        <Link
          href="/"
          className="w-7 h-7 md:w-9 md:h-9 bg-borderWhite text-black rounded-lg flex items-center justify-center cursor-pointer"
        >
          <X className="w-6 h-6 md:w-8 md:h-8" color="black" size={20} strokeWidth={1} />
        </Link>
      </div>
    </div>
  );
};

export default AuthLayoutCardHeader;
