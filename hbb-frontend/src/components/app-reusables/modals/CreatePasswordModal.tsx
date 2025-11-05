import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: (value: boolean) => void;
}

const CreatePassword = ({ isOpen, onClose }: Props) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const pathname = usePathname();
  const segment = pathname.split("/")[2];

  const { password, confirmPassword } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <>
        {isOpen && (
        <div className="w-full h-full flex">
          <div className={`flex flex-col md:flex-row w-full rounded-2xl ${segment === "explorer" ? "bg-base2" : "bg-base1"}`}>
            <div className="w-full md:w-[41.2%] 2xl:w-[672px] h-[119px] md:h-full flex-auto lg:block relative">
              <Image
                src="/assests/dashboard/dashboard.png"
                alt=""
                fill
                className="w-auto object-cover absolute"
                priority
              />
            </div>

             <div className="w-full md:w-[58.8957%] 2xl:w-[960px] h-full flex-auto px-4 md:px-8 py-10 md:py-12">
                <div>
                  <p className="text-lg 2xl:text-2xl text-white  font-medium">Create new password</p>
                  <p className="text-sm 2xl:text-base  text-white opacity-60 mt-2">Kindly create new password to access your account</p>
                </div>

                <form className="grid gap-2 mt-6">
                  <div className="pb-6">
                    <label className="mb-[9px] text-xs">New password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      className="text-sm placeholder:text-white text-white opacity-70 placeholder:text-sm outline-white focus:outline-white focus:border-white border-[0.5px] border-white w-full"
                      name="password" value={password}
                      onChange={handleChange}
                    />
                  </div>

                   <div className="pb-6">
                    <label className="mb-[9px] text-xs">Confirm new password</label>
                    <Input
                      type="password"
                      placeholder="Reenter new password"
                      className="text-sm placeholder:text-white text-white opacity-70 placeholder:text-sm outline-white focus:outline-white focus:border-white border-[0.5px] border-white w-full"
                      name="confirmPassword" value={confirmPassword}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="items-center absolute bottom-10 w-full left-0">
                    <Button
                      variant="yellow"
                      className={
                        `w-[95%] m-auto grid h-11 shadow-custom-shadow
                        ${(!password || !confirmPassword) ? "bg-[#ECECEC] text-[#ADADAD]": ""}
                      `}
                      disabled={!password || !confirmPassword}
                    >
                      Create a new password
                    </Button>
                  </div>
                </form>
               </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatePassword;
