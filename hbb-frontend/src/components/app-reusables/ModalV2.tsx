"use client";

import React, { useEffect } from "react";
import { ChevronDown } from "lucide-react";

const ModalV2 = ({ isOpen, buttonText, onClose }: modal2) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 lg:w-fit w-full">
      <div className="flex justify-center mt-[-4px] pb-[10px] md:pb-1">
        <ChevronDown color="#6AB5D2" className="text-[#6AB5D2]" size={30} />
      </div>
      <div className="modal-content bg-white w-full lg:w-max md:px-20 rounded-20 mx-auto z-50 px-6 py-4">
        <div className="text-black text-center">
          <p>{buttonText}</p>
        </div>
      </div>
    </div>
  );
};

export default ModalV2;
