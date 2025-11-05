"use client";

import React, { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import ModalV2 from "../app-reusables/ModalV2";
import { Input } from "../ui/input";
import { toast } from "sonner";

const AccountHeader = () => {
  const [isPending, startTransition] = useTransition();

  const [textToCopy, setTextToCopy] = useState("rt6hjdidid9jdjd000qe");
  const [copy, setCopy] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopy(true);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const PlanDiv = () => (
    <div
      className={`w-fit h-fit px-5 py-[6px] rounded-full font-normal text-sm shadow-[2px_2px_0px_2px_#000000] bg-white text-black`}
    >
      Free plan
    </div>
  );

  const [formData, setFormData] = useState({
    agencyName: "",
    location: "",
  });

  const { agencyName, location } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
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

  return (
    <>
      <div className="w-full flex flex-col lg:flex-row gap-2 lg:gap-3 2xl:gap-4">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 2xl:gap-4 flex-1">
          <div className="bg-base1 rounded-20 p-4 flex justify-between flex-1 lg:min-w-[311px]">
            <div>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="bg-base2 h-[54px] w-[54px]  lg:h-[84px] lg:w-[84px] rounded-full flex-shrink-0" />

                <div className="">
                  <p className="font-medium lg:text-xl">Name Agency</p>
                  <div className="flex items-center gap-1 lg:my-2">
                    <Image
                      src="/assests/location-white.svg"
                      alt=""
                      height={20}
                      width={20}
                    />
                    <p className="text-xs font-light">Washington D.C</p>
                  </div>

                  <p className="text-sm font-light">
                    <span className="mr-2">🗓</span>02/04/2024
                  </p>
                </div>
              </div>

              <div className="mt-3 lg:hidden">
                <PlanDiv />
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div
                onClick={() => {
                  setShowEditModal(true);
                }}
                className="border border-white py-2 px-3 w-fit h-fit flex items-center gap-[10px] rounded-md cursor-pointer"
              >
                <p className="font-medium text-xs">Edit</p>
                <Pencil size={14} color="white" />
              </div>

              <div className="mt-4 lg:block hidden">
                <PlanDiv />
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF1F] p-3 lg:p-5 rounded-20">
            <p className="text-sm lg:text-base">Referal code</p>

            <div className="w-full mt-3 lg:mt-7 lg:max-w-[260px] flex h-8 bg-white rounded-xl">
              <p className="flex-1 text-base2 flex items-center px-3">
                {textToCopy}
              </p>
              <div
                onClick={handleCopy}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-base1 cursor-pointer"
              >
                <Image
                  src={"/assests/copy.svg"}
                  alt={"copy"}
                  width={16}
                  height={16}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 lg:gap-3 2xl:gap-4 justify-between">
          <div className="bg-[#FFFFFF1F] p-3 lg:p-5 rounded-20 flex-1 lg:flex-none">
            <div className="flex items-center justify-between gap-5">
              <p className="text-sm lg:text-base text-wrap">Total earnings</p>

              <div className="h-7 w-7 lg:h-9 lg:w-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <Image
                  src={"/assests/dollar.svg"}
                  alt={""}
                  height={20}
                  width={20}
                />
              </div>
            </div>

            <p className="font-medium lg:text-32px text-2xl lg:mt-2 mt-5">
              $0.00
            </p>
          </div>

          <div className="bg-[#FFFFFF1F] p-3 lg:p-5 rounded-20 flex-1 lg:flex-none">
            <div className="flex items-center justify-between gap-5">
              <p className="text-sm lg:text-base text-wrap">Number of influencers</p>

              <div className="h-7 w-7 lg:h-9 lg:w-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <Image
                  src={"/assests/audience.svg"}
                  alt={""}
                  height={20}
                  width={20}
                />
              </div>
            </div>

            <p className="font-medium lg:text-32px text-2xl lg:mt-2 mt-5 text-white/40">
              0/120
            </p>
          </div>
        </div>
      </div>

      <div
        className={`top-0 left-1/2 transform -translate-x-1/2  absolute overflow-y-hidden z-40  w-full h-full  ${
          copy ? "top-1/2 transform -translate-y-1/2" : "-translate-y-full"
        } ease-in-out duration-500`}
      >
        <ModalV2
          isOpen={copy}
          buttonText="Copied to clipboard"
          onClose={() => {
            setCopy(false);
          }}
        />
      </div>

      {showEditModal && (
        <div className="fixed top-0 left-0 z-20 w-full h-full backdrop-blur-sm bg-black/55">
          <div className="w-full h-full flex items-center justify-center px-4 lg:px-8 py-20">
            <div className="bg-base1 w-full lg:max-w-[955px] h-full lg:max-h-[556px] p-4 rounded-xl overflow-hidden">
              <div className="w-full h-full">
                <div className="w-full flex justify-end">
                  <X
                    className="w-8 h-8 cursor-pointer bg-white rounded-[10px]"
                    color="#292D32"
                    size={18}
                    onClick={() => setShowEditModal(false)}
                  />
                </div>

                <div className="border-b pb-4 border-[#8FC0D3] mb-7">
                  <p>Edit Profile</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="bg-base2 w-28 h-28 rounded-full mb-7"></div>

                  <div className="lg:w-1/2 w-full">
                    <div className="w-full">
                      <label className="text-white/60 text-xs mb-2 font-medium">
                        Agency Name
                      </label>
                      <Input
                        placeholder="Enter"
                        className="border-none p-3 rounded-lg placeholder:text-white text-sm w-full h-fit focus:border-white text-white bg-white/25"
                        name="agencyName"
                        value={agencyName}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="w-full mt-4">
                      <label className="text-white/60 text-xs mb-2 font-medium">
                        Location
                      </label>
                      <Input
                        placeholder="Enter"
                        className="border-none p-3 rounded-lg placeholder:text-white text-sm w-full h-fit focus:border-white text-white bg-white/25"
                        name="location"
                        value={location}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="flex flex-col items-center justify-center mt-7">
                      <Button
                        className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 bg-tertiary hover:bg-tertiaryHover text-black`}
                        disabled={isPending}
                        onClick={onHandleSubmit}
                      >
                        Save Updates
                      </Button>

                      <div
                        onClick={() => {
                          setShowEditModal(true);
                        }}
                        className="mt-3 cursor-pointer"
                      >
                        <p className="text-center">Cancel</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountHeader;
