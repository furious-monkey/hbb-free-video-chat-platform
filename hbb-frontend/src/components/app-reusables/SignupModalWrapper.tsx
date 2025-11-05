"use client";

import React from "react";
import { useSignupModal } from "@/src/context/SignupModalContext";
import Modal from "@/src/components/app-reusables/Modal";
import {
    button1GreenStyle,
    button2RedStyle,
  } from "@/src/constants/buttonStyles";


const SignupModalWrapper = () => {
  const { showSignupModal, signupModalContent, closeSignupModal } = useSignupModal();

  const handleYesClick = () => {
    signupModalContent.onYesClick();
    closeSignupModal();
  };

  return (
    <div
      className={`top-0 left-1/2 transform -translate-x-1/2 absolute overflow-y-hidden z-40 w-full h-full ${
        showSignupModal ? "top-1/2 transform -translate-y-1/2" : "-translate-y-full"
      } ease-in-out duration-500`}
    >
      <Modal
        isOpen={showSignupModal}
        onClose={closeSignupModal}
        onYesClick={handleYesClick}
        question={signupModalContent.question}
        button1Text={signupModalContent.button1Text}
        button2Text={signupModalContent.button2Text}
        button1Style={button1GreenStyle}
        button2Style={button2RedStyle}
      />
    </div>
  );
};

export default SignupModalWrapper;