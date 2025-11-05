import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
interface Props {
  isOpen: boolean;
  onClose: (value: boolean) => void;
}

const ResetPassword = ({ isOpen, onClose }: Props) => {
  const [formData, setFormData] = useState({
    email: "",
  });

  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.split("/")[2];

  const { email } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    setFormData((prevData) => ({
      ...prevData,
      email: value,
    }));
  };

  const handleBackClick = () => {
    router.push(`/dashboard/${segment}/live?modal=passwordUpdate`);
  }

  return (
    <>
      {isOpen && (
        <div className="w-full pb-9 md:py-10">
          <div className="h-full flex flex-col md:flex-row w-full rounded-2xl">
             <div className="w-full md:w-[58.8957%] 2xl:w-[960px] h-full flex-auto">
                <div>
                  <p className="text-sm 2xl:text-base  text-white opacity-60 mt-2">Kindly provide your email address to reset your password</p>
                </div>

                <form className="grid gap-4 mt-6">
                  <div className="my-4 pb-6 mb-28 md:mb-0">
                    <p className="mb-[9px] text-xs">Email address</p>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      className="text-sm placeholder:text-white text-white opacity-70 placeholder:text-sm outline-white focus:outline-white focus:border-white border-[0.5px] border-white w-full"
                      value={email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="items-center absolute bottom-10 w-full left-0">
                    <Button
                      variant="yellow"
                      className={
                        `w-[90%] m-auto grid h-11 shadow-custom-shadow
                        ${(!email) ? "bg-[#ECECEC] text-[#9E9E9E]": ""}
                      `}
                      disabled={!email}
                    >
                      Send
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

export default ResetPassword;