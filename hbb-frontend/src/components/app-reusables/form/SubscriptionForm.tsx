"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  SubscribeData,
  agencySubscribeData,
} from "@/src/schema/subscribe/index.data";
import { Circle, Check, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SubscriptionCard from "../../SubscriptionCard";

const SubscriptionForm = () => {
  // const { firstname, lastname } = useAppSelector(
  //   (state) => state.userReducer.value
  // );

  const [isPending, startTransition] = useTransition();

  // const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const pathname = usePathname();
  const segment = pathname.split("/")[2];

  const isAgencySegment = segment === "agency";

  const subscriptionData = isAgencySegment
    ? agencySubscribeData
    : SubscribeData;

  const route = segment === "explorer" ? "live" : "account";

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [subscription, setSubscription] = useState(false);

  const [formData, setFormData] = useState({
    cardName: "",
    expiryDate: "",
    cardNumber: "",
    cvv: "",
  });

  const { cardName, expiryDate, cardNumber, cvv } = formData;
  const cardIsValid =
    cardName !== "" && expiryDate !== "" && cardNumber !== "" && cvv !== "";

  useEffect(() => {
    const updateSubscription = () => {
      setSubscription(true);
    };

    updateSubscription();
  }, [cardIsValid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onHandleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (selectedIndex === null) {
      toast.error("Kindly pick a value");
      return;
    }

    startTransition(async () => {
      try {
        // await dispatch(
        //   updateSubscription({
        //     subscription,
        //   })
        // );

        router.push(`/dashboard/${segment}/${route}`);
      } catch (error: any) {
        console.error("Error subscribing:", error.message);
        toast.error("Error subscribing, try again or contact support");
      }
    });
  };

  return (
    <div className="h-full w-full px-4 pt-7 pb-9 md:px-14 md:py-10 lg:px-12 2xl:px-14 lg:py-14 flex flex-col">
      <div className="h-full w-full text-white overflow-y-auto no-scrollbar">
        <div className="mb-8 lg:mb-6">
          <p className="font-medium text-lg md:text-2xl lg:text-lg 2xl:text-2xl mb-3 2xl:mb-6">
            {isAgencySegment ? "Account" : "Subscription"}
          </p>
          <p className="text-[#eff0f0] text-sm lg:text-base">
            Choose {isAgencySegment ? "an account" : "a plan"} below and get
            started now
          </p>
        </div>
        <div className="">
          <div className="pb-[14px] lg:pb-5 2xl:pb-6 mb-7 lg:mb-8 2xl:mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionData.map((item, index) => (
                <SubscriptionCard
                  key={index}
                  index={index}
                  item={item}
                  onClick={() => setSelectedIndex(index)}
                  selectedIndex={selectedIndex}
                  showCheckIcon
                  isAgencyRoute={isAgencySegment}
                />
              ))}
            </div>
          </div>

          {selectedIndex !== null && (
            <>
              <div className="space-y-[15px] lg:space-y-6 pt-8 border-t border-white/60">
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

              <div className="flex justify-center mt-7 lg:mt-8 2xl:mt-10">
                <Button
                  className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full text-gray font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 ${
                    !cardIsValid
                      ? "bg-lightgray text-gray"
                      : "bg-tertiary hover:bg-tertiaryHover text-black"
                  }`}
                  disabled={!cardIsValid || isPending}
                  onClick={onHandleSubmit}
                >
                  Get started now
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionForm;
