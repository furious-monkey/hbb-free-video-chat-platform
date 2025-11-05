

import React, { createContext, useContext, useState } from 'react';

// Define the interface for the context
interface ModalContextType {
  goModal: boolean;
  setGoModal: (value: boolean) => void;
  editModal: boolean;
  setEditModal: (value: boolean) => void;
  likeModal: boolean;
  setLikeModal: (value: boolean) => void;
  reportModal: boolean;
  setReportModal: (value: boolean) => void;
  giftModal: boolean;
  setGiftModal: (value: boolean) => void;
  requestCallModal: boolean;
  setRequestCallModal: (value: boolean) => void;
}

// Create the context with an initial value of the defined interface
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Define the ModalProvider component
export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goModal, setGoModal] = useState(false);
  const [giftModal, setGiftModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [likeModal, setLikeModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [requestCallModal, setRequestCallModal] = useState(false);

  // Provide the state and function through the context
  const contextValue = {
    goModal,
    setGoModal,
      editModal,
      setEditModal,
      reportModal,
      setReportModal,
      likeModal, 
      setLikeModal,
      giftModal,
      setGiftModal,
      requestCallModal,
      setRequestCallModal
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

// Custom hook to access the ModalContext
export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
