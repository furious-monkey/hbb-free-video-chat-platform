import React from "react";
import { CardItem } from "../schema/subscribe/index.data";
import { Circle, Check, X } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  item: CardItem;
  onClick: () => void;
  showCheckIcon?: boolean;
  showPlanCta?: boolean;
  selectedIndex: number | null;
  index: any;
  isAgencyRoute?: boolean;
}

const SubscriptionCard = ({
  item,
  onClick,
  showCheckIcon,
  selectedIndex,
  index,
  showPlanCta,
  isAgencyRoute,
}: Props) => {
  const isSelected = selectedIndex === index;

  return (
    <div
      onClick={onClick}
      className={`lg:py-6 py-[18px] px-4 lg:px-3 2xl:px-4 rounded-2xl border-white ${
        isSelected ? "border" : ""
      }`}
      style={{ backgroundColor: item.bgColor }}
    >
      <div>
        <div className="pb-4 border-b border-white/20 flex items-end">
          <div className="flex flex-col w-full">
            {showCheckIcon && (
              <>
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <Check
                      color="#E688A3"
                      className="text-tertiary"
                      size={18}
                    />
                  </div>
                ) : (
                  <Circle color="#ffffff" className="text-tertiary" size={24} />
                )}
              </>
            )}

            <p className="capitalize font-medium text-lg  mt-2 lg:mt-3 2xl:mt-4 mb-1 lg:mb-2 2xl:mb-3">
              {item.title}
            </p>

            {item.price && (
              <div className="flex items-center justify-between w-full">
                <p className="font-light text-sm">Rate</p>
                <div className="rounded-20 bg-white/20 px-[9px] w-fit">
                  <p className="font-bold text-[22px] lg:text-lg 2xl:text-[22px]">
                    ${item.price}
                    {!isAgencyRoute && (
                      <span className="text-xs font-normal">/monthly</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {item.fees && (
          <div className="py-4 border-b border-white/20">
            <div className="w-full flex flex-col gap-[6px]">
              {item.fees.map((fee) => (
                <div
                  key={fee.label}
                  className="flex items-center justify-between"
                >
                  <p className="font-light text-xs">{fee.label}</p>
                  <p className="font-medium text-xs">{fee.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex lg:flex-col flex-col-reverse gap-4">
          {showPlanCta && (
            <div className="lg:py-4 lg:border-b lg:border-white/20 flex items-center justify-between">
              {item.activeSubscription && (
                <p className="font-medium text-sm underline underline-offset-4 lg:hidden cursor-pointer">
                  Cancel plan
                </p>
              )}

              <Button
                className={`w-fit h-fit lg:px-6 px-5 py-[10px] rounded-full text-gray font-normal text-sm shadow-[2px_2px_0px_2px_#000000] ${
                  item.activeSubscription
                    ? "bg-lightgray text-gray"
                    : "bg-tertiary hover:bg-tertiaryHover text-black"
                }`}
                disabled={item.activeSubscription}
                // onClick={onHandleSubmit}
              >
                {item.activeSubscription ? "Current plan" : "Activate plan"}
              </Button>
            </div>
          )}

          <ul className="mt-4 lg:mt-0 flex flex-col gap-2">
            {item.features.map((feat, index) => (
              <li key={index} className="gap-[2px] flex items-center">
                {feat.status ? (
                  <Check color="#EFD378" className="text-tertiary" size={16} />
                ) : (
                  <X color="#FFB5CA" className="text-tertiary" size={16} />
                )}
                <p className="font-medium text-xs">
                  {feat.feature}
                  <span className="text-tertiary ml-1">
                    {feat?.subText ?? ""}
                  </span>
                </p>
              </li>
            ))}
          </ul>

          {item.activeSubscription && (
            <p className="font-medium text-sm underline underline-offset-4 hidden lg:block cursor-pointer">
              Cancel plan
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;
