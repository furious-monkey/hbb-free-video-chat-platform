"use client";

import React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { CardElement } from "@stripe/react-stripe-js";

interface CardDetailsProps {
  formData: {
    cardName: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  error: string | null;
  isPending: boolean;
}

const images = [
  { id: 1, src: "/icons/card-payment.svg", alt: "Card" },
  // { id: 2, src: "/icons/apple-pay.svg", alt: "Apple Pay" },
  // { id: 3, src: "/icons/paypal.svg", alt: "PayPal" },
];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#ffffff",
      fontSize: "16px",
      border: "1px solid #ffffff",
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#ffffff80",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

const CardDetails = ({
  formData,
  onChange,
  selectedIndex,
  onSelect,
  error,
  isPending,
}: CardDetailsProps) => {
  const { cardName } = formData;

  return (
    <>
      <div className="flex gap-4 mb-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => onSelect(index)}
            className={`relative max-w-[90px] flex justify-center items-center h-[46px] rounded-md bg-white/15 hover:bg-white/30 cursor-pointer ${
              selectedIndex === index ? "border border-white" : ""
            }`}
          >
            <div className="relative px-4 py-2 w-full h-full flex justify-center items-center">
              <Image
                src={image.src}
                alt={image.alt}
                width={1000}
                height={1000}
                className="w-auto h-[24px]"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm mb-2">Add your payment details</p>

      <div className="space-y-[15px] lg:space-y-6">
        <input
          name="cardName"
          placeholder="Jane Doe"
          value={cardName}
          onChange={onChange}
          className="border border-profile p-3 rounded-lg placeholder:text-[#ffffff80] text-sm w-full h-fit focus:border-white bg-transparent text-white transition-colors"
        />

        <div className="p-3 rounded-lg bg-transparent text-white text-sm border border-profile focus-within:border-white transition-colors">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>

        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        {isPending && (
          <p className="text-white text-sm mt-1 flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" /> Processing...
          </p>
        )}
      </div>
    </>
  );
};

export default CardDetails;
