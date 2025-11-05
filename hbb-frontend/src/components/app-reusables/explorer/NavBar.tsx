"use client";

import React from "react";
import Logo from "@/public/icons/logo.svg";
import { explorerData } from "@/src/constants/navBar";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NavBar = () => {
    const path = usePathname();

    return (
        <aside className="lg:w-fit bg-black lg:relative fixed w-full bottom-0 left-0 z-50 md:grid flex justify-center content-cente md:py-[2rem]">
            <Link href="/" className="text-center w-full lg:w-auto hidden lg:block">
                <Image
                    src={Logo}
                    alt="logo"
                    width={400}
                    height={400}
                    className="block w-[4rem] lg:w-[4rem] 2xl:w-[4rem] mx-auto"
                />
            </Link>
            <nav className="lg:grid flex gap-y-3 w-full lg:py-3">
                {explorerData.map((item) => {


                    // Determine if the current path matches the item's path
                    const isActive = path === item.to;

                    return (
                        <div
                            key={item.id}
                            className={isActive ? "lg:border-r-2 border-t-4 lg:border-t-0 border-base" : ""}
                        >
                            <Link
                                href={item.to}
                                passHref
                                className="flex flex-col w-full lg:justify-center lg:items-center md:justify-between h-fit text-center"
                            >
                                <Image
                                    alt={item.title}
                                    src={item.image}
                                    className="block lg:w-1/2 lg:h-1/2 w-[75%] mx-auto object-contain"
                                />
                                <p className="text-sm -mt-2">{item.title}</p>
                            </Link>
                        </div>
                    );
                })}
            </nav>

            <Button variant="ghost" className="hidden lg:block">
                Logout
            </Button>
        </aside>
    );
};

export default NavBar;
