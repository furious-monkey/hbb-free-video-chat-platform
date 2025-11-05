import React from "react";
import { ChevronDown } from "lucide-react";

const Modal = ({
  isOpen,
  onClose,
  onYesClick,
  onResendCode,
  question,
  button1Text,
  button2Text,
  button1Style,
  button2Style,
  origin,
}: modal) => {
  if (!isOpen) return null;

  const handleYesClick = () => {
    if (onYesClick) {
      onYesClick();
    }
  };

  const handleNoClick = () => {
    if (origin === "forgotPassword" && onResendCode) {
      onResendCode();
    } else {
      onClose(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full">
      <div className="flex justify-center pt-2 lg:pt-5 pb-[10px] md:pb-1 md:pt-4">
        <ChevronDown color="#EFD378" className="text-tertiary" size={30} />
      </div>
      <div className="modal-content bg-white w-4/5 lg:w-max md:px-20 rounded-xl mx-auto z-50 px-6 py-4 shadow-sm">
        <h2 className="text-[#080808] text-xs text-center mb-6">{question}</h2>
        <div className="flex gap-4 justify-center">
          <button
            className={`px-3 py-[6px] rounded-lg text-xs border font-light ${button1Style.hoverBgColor} ${button1Style.bgColor} ${button1Style.textColor} ${button1Style.border}`}
            onClick={handleYesClick}
          >
            {button1Text}
          </button>
          <button
            className={`px-3 py-[6px] rounded-lg text-xs font-light border ${button2Style.hoverBgColor} ${button2Style.bgColor} ${button2Style.textColor} ${button2Style.border}`}
            onClick={handleNoClick}
          >
            {button2Text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
