"use client";

import React, { useState, useTransition } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import Modal from "../app-reusables/Modal";
import {
  button1GreenStyle,
  button2RedStyle,
} from "@/src/constants/buttonStyles";
import Heading from "./Heading";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";

const AgencyAccount = ({
  closeModal,
  screenWidth,
}: {
  closeModal: () => void;
  screenWidth: number;
}) => {
  // const data = useAppSelector((state) => state.userReducer.value);

  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleYesClick = () => {
    handleModalClose();

    closeModal();
  };

  const data = {
    firstname: "John",
    lastname: "Doe",
    sex: "male",
    dob: "1990-01-01",
    phone: "1234567890",
    email: "jane@doe.com"
  }

  const [formData, setFormData] = useState({
    fname: data.firstname || "",
    lname: data.lastname || "",
    phone: data.phone || "",
    email: data.email || "",
  });

  const { fname, lname, phone, email } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prevData) => ({
      ...prevData,
      dob: date,
    }));
  };

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

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "DD-MM-YYYY";
    return format(date, "MMM dd, yyyy");
  };

  return (
    <>
      <div className="2xl:py-20 lg:py-14 py-5 lg:px-8 px-4 h-full">
        <div className="w-full h-full flex flex-col">
          <Heading
            onClick={closeModal}
            heading="Account"
            showIcon={screenWidth <= 1024}
          />

          <div className="flex-1 w-full overflow-y-auto no-scrollbar">
            <div className="flex justify-between lg:justify-normal flex-col h-full w-full">
              <div className="space-y-[15px] lg:space-y-6 lg:mt-10 mt-4">
                <div className="flex flex-col lg:flex-row gap-[15px]">
                  <div className="w-full">
                    <label className="text-white text-xs mb-2 font-medium">
                      First name
                    </label>
                    <Input
                      placeholder=""
                      className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                      name="fname"
                      value={fname}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white text-xs mb-2 font-medium">
                      Last name
                    </label>
                    <Input
                      placeholder=""
                      className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                      name="lname"
                      value={lname}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-[15px]">
                  <div className="w-full">
                    <label className="text-white text-xs mb-2 font-medium">
                      Phone number
                    </label>
                    <Input
                      placeholder=""
                      className="border-profile p-3 !h-9 rounded-lg placeholder:text-profile text-sm w-full focus:border-white text-white"
                      name="phone"
                      value={phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white text-xs mb-2 font-medium">
                      Email address
                    </label>
                    <Input
                      placeholder=""
                      type="email"
                      className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                      name="email"
                      value={email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center mt-7 lg:mt-10 2xl:mt-32">
                <Button
                  className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 bg-tertiary hover:bg-tertiaryHover text-black`}
                  disabled={isPending}
                  onClick={onHandleSubmit}
                >
                  Save changes
                </Button>

                <div
                  onClick={() => {
                    setShowModal(true);
                  }}
                  className="mt-4 cursor-pointer"
                >
                  <p className="text-center text-[#C60000]">Delete account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`top-0 left-1/2 transform -translate-x-1/2  absolute overflow-y-hidden z-40  w-full h-full  ${
          showModal ? "top-1/2 transform -translate-y-1/2" : "-translate-y-full"
        } ease-in-out duration-500`}
      >
        <Modal
          isOpen={showModal}
          onClose={handleModalClose}
          onYesClick={handleYesClick}
          question="Do you want to delete your account?"
          button1Text="Yes, I want"
          button2Text="No, cancel"
          button1Style={button1GreenStyle}
          button2Style={button2RedStyle}
        />
      </div>
    </>
  );
};

export default AgencyAccount;
