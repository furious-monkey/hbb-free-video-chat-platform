import React from "react";
import Link from "next/link";
import { Copyright } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-black w-full px-4 pb-0 md:pb-0 !lg:pb-8">
      <div className="w-full mx-auto flex flex-col justify-center items-center !lg:h-20">
        <ul className=" flex items-center justify-between w-full lg:w-1/2 md:w-3/4 py-[16px] md:py-[10px] border-b border-[#D9D9D9] md:px-5">
          {footerLinks.map((link, index) => (
            <li key={index}>
              <Link
                href={link.link}
                className="text-xs text-text"
                {...(link.name === "Contact us" ? { target: "_blank" } : {})}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 md:mt-6 flex mb-6 md:mb-6 justify-center items-center gap-1 md:gap-2">
          <Copyright color="#6C6D71" size={16} />
          <p className="text-xs  text-text">{currentYear} HBB LLC</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

const footerLinks = [
  {
    name: "FAQ",
    link: "/faq",
  },
  {
    name: "Terms of service",
    link: "/terms-of-service",
  },
  {
    name: "Privacy policy",
    link: "/privacy-policy",
  },
  {
    name: "Contact us",
    link: "mailto:team@hbb.chat",
  },
];
