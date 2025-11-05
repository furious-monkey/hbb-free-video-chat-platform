"use client";

import React, { createContext, useContext, useState } from "react";

interface SignupModalContextType {
  showSignupModal: boolean;
  signupModalContent: {
    question: string;
    button1Text: string;
    button2Text: string;
    button1Style: string;
    button2Style: string;
    onYesClick: () => void;
  };
  openSignupModal: (
    content: Omit<SignupModalContextType['signupModalContent'], 'onYesClick'>, 
    onYesClick: () => void
  ) => void;
  closeSignupModal: () => void;
}

const SignupModalContext = createContext<SignupModalContextType | undefined>(undefined);

export const SignupModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalContent, setSignupModalContent] = useState<SignupModalContextType['signupModalContent']>({
    question: "",
    button1Text: "",
    button2Text: "",
    button1Style: "",
    button2Style: "",
    onYesClick: () => {},
  });

  const openSignupModal = (
    content: Omit<SignupModalContextType['signupModalContent'], 'onYesClick'>,
    onYesClick: () => void
  ) => {
    setSignupModalContent({
      ...content,
      onYesClick,
    });
    setShowSignupModal(true);
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
  };

  return (
    <SignupModalContext.Provider 
      value={{ 
        showSignupModal, 
        signupModalContent, 
        openSignupModal, 
        closeSignupModal 
      }}
    >
      {children}
    </SignupModalContext.Provider>
  );
};

export const useSignupModal = () => {
  const context = useContext(SignupModalContext);
  if (!context) {
    throw new Error("useSignupModal must be used within a SignupModalProvider");
  }
  return context;
};