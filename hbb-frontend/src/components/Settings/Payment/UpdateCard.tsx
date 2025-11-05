"use client";

import React, { useState, useTransition } from "react";
import SecurityLayout from "../Security/SecurityLayout";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { toast } from "sonner";

const UpdateCard = ({ onClick }: { onClick: () => void }) => {
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    cardName: "",
    expiryDate: "",
    cardNumber: "",
    cvv: "",
  });

  const { cardName, expiryDate, cardNumber, cvv } = formData;
  const cardIsValid =
    cardName !== "" && expiryDate !== "" && cardNumber !== "" && cvv !== "";

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
        onClick();
      } catch (error: any) {
        console.error("Error subscribing:", error.message);
        toast.error("Error subscribing, try again or contact support");
      }
    });
  };

  return (
    <>
      <SecurityLayout onClick={onClick} heading={"Update my card"}>
        <div className="lg:mt-7 mt-6 flex-1">
          <div className="h-full flex flex-col justify-between lg:justify-normal">
            <div className="space-y-[15px] lg:space-y-6">
              <div className="flex flex-col md:flex-row gap-[15px]">
                <div className="w-full">
                  <label className="text-white/60 text-xs mb-2 font-medium">
                    Name on the card
                  </label>
                  <Input
                    placeholder="John Green"
                    className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                    name="cardName"
                    value={cardName}
                    onChange={handleChange}
                  />
                </div>
                <div className="w-full">
                  <label className="text-white/60 text-xs mb-2 font-medium">
                    Expiry date
                  </label>
                  <Input
                    placeholder="06/2024"
                    className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                    name="expiryDate"
                    value={expiryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-[15px]">
                <div className="w-full">
                  <label className="text-white/60 text-xs mb-2 font-medium">
                    Card number
                  </label>
                  <Input
                    placeholder="3333 6543 3456 2384"
                    className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                    name="cardNumber"
                    value={cardNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="w-full">
                  <label className="text-white/60 text-xs mb-2 font-medium">
                    CVV
                  </label>
                  <Input
                    placeholder="***"
                    type="password"
                    className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                    name="cvv"
                    value={cvv}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-7 lg:mt-10">
              <Button
                className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full text-gray font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 ${
                  !cardIsValid
                    ? "bg-lightgray text-gray"
                    : "bg-tertiary hover:bg-tertiaryHover text-black"
                }`}
                disabled={!cardIsValid || isPending}
                onClick={onHandleSubmit}
              >
                Save card details
              </Button>
            </div>
          </div>
        </div>
      </SecurityLayout>
    </>
  );
};

export default UpdateCard;
