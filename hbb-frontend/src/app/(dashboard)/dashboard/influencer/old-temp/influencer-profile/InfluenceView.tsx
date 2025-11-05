"use client";
import InfluencerProfile from "@/src/components/InfluencerProfile";
import { ModalProvider } from "@/src/state/context/modal";
import React from "react";

const InfluenceView = () => {
  return (
    <>
      <ModalProvider>
        <>
          <InfluencerProfile />
        </>
      </ModalProvider>
    </>
  );
};

export default InfluenceView;
