"use client";
import ExplorerProfile from "@/src/components/InfluencerProfile/ExplorerProfile";
import { ModalProvider } from "@/src/state/context/modal";
import React from "react";

const ExplorerView = () => {
  return (
    <>
      <ModalProvider>
        <>
          <ExplorerProfile />
        </>
      </ModalProvider>
    </>
  );
};

export default ExplorerView;
