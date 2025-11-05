"use client";

import React, { useState, useTransition } from "react";
import Heading from "../Heading";
import SecurityLayout from "./SecurityLayout";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { toast } from "sonner";

const Password = ({
  handleGoBack,
  heading,
}: {
  handleGoBack: () => void;
  heading: string;
}) => {
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    password: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { password, newPassword, confirmPassword } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const isValid =
    password !== "" &&
    newPassword !== "" &&
    confirmPassword !== "" &&
    newPassword === confirmPassword;

  const onHandleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        console.log("data");
      } catch (error: any) {
        console.error("Error subscribing:", error.message);
        toast.error("Error subscribing, try again or contact support");
      }
    });
  };

  return (
    <SecurityLayout onClick={handleGoBack} heading={heading}>
      <div className="lg:mt-7 mt-6">
        <div className="w-full">
          <label className="text-white text-xs mb-2 font-medium">
            Current password
          </label>
          <Input
            placeholder="Enter current password"
            className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
            name="password"
            value={password}
            onChange={handleChange}
          />
        </div>

        <div className="text-black text-xs mt-2 mb-5 lg:mb-6">
          <p className="text-right">Forgot password?</p>
        </div>

        <div className="pt-5 lg:pt-6 space-y-5 lg:space-y-6 border-t border-white/20">
          <div className="w-full">
            <label className="text-white text-xs mb-2 font-medium">
              New password
            </label>
            <Input
              placeholder="Enter new password"
              className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
              name="newPassword"
              value={newPassword}
              onChange={handleChange}
            />
          </div>

          <div className="w-full">
            <label className="text-white text-xs mb-2 font-medium">
              Confirm new password
            </label>
            <Input
              placeholder="Re-enter new password"
              className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex items-center justify-center mt-6 lg:mt-8">
          <Button
            className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full text-gray font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 ${
              !isValid
                ? "bg-lightgray text-gray"
                : "bg-tertiary hover:bg-tertiaryHover text-black"
            }`}
            disabled={!isValid || isPending}
            onClick={onHandleSubmit}
          >
            Update password
          </Button>
        </div>
      </div>
    </SecurityLayout>
  );
};

export default Password;
