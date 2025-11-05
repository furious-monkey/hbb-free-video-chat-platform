"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  agencyNavlinks,
  explorerNavlinks,
  modelNavlinks,
} from "../constants/sidebar";

const Sidebar = () => {
  const pathname = usePathname();
  const segment = pathname.split("/").slice(1, 3).join("/");

  const navlinks = useMemo(() => {
    let links = modelNavlinks;
    switch (true) {
      case pathname.includes("agency"):
        links = agencyNavlinks;
        break;
      case pathname.includes("explorer"):
        links = explorerNavlinks;
        break;
      default:
        links;
    }
    return links;
  }, [pathname]);

  return (
    <div className="lg:w-[10vw] w-full lg:h-full h-[78px] bg-black/70 flex-shrink-0 flex-grow-0">
      <div className="w-full h-full px-[30px] md:px-24 lg:px-0 lg:py-6 2xl:pb-[76px] flex lg:flex-col justify-between items-center">
        <div className="w-full">
          <div className="hidden lg:flex justify-center items-center">
            <Image
              src={"/assests/logo.svg"}
              alt={"logo"}
              width={87}
              height={87}
              className="w-[87px] h-[87px]"
            />
          </div>

          <ul className="lg:mt-14 2xl:mt-[72px] flex lg:flex-col gap-14 lg:gap-6 lg:items-center w-full justify-center items-start -mt-4">
            {navlinks.map((link) => {
              const isActive = pathname.includes(link.href);

              return (
                <li
                  key={link.label}
                  className={`lg:w-full lg:border-r-[3px] border-t-0 pt-[6px] lg:pt-0 hover:border-[#94E3FF] ${
                    isActive ? "border-[#94E3FF]" : "border-black"
                  }`}
                >
                  <Link
                    href={`/${segment}/${link.href}`}
                    className="flex flex-col items-center"
                  >
                    <Image
                      src={isActive ? link.activeImgSrc : link.imgSrc}
                      alt={"logo"}
                      width={63}
                      height={63}
                      className="lg:w-[63px] w-10 lg:h-[63px] h-10"
                    />
                    <h4
                      className={`hidden lg:flex text-xs lg:text-sm ${
                        isActive ? "text-base1" : "text-white"
                      }`}
                    >
                      {link.label}
                    </h4>
                    <h4
                      className={`lg:hidden text-xs lg:text-sm ${
                        isActive ? "text-base1" : "text-white"
                      }`}
                    >
                      {link.mobileLabel}
                    </h4>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* <div className="hidden lg:block">
          <p>Logout</p>
        </div> */}
      </div>
    </div>
  );
};

export default Sidebar;
