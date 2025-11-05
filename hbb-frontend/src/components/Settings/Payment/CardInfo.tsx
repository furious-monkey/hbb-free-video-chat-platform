"use client";

import React, { useState } from "react";
import SecurityLayout from "../Security/SecurityLayout";
import { PencilLine, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import UpdateCard from "./UpdateCard";

const CardInfo = ({
  handleGoBack,
  heading,
}: {
  handleGoBack: () => void;
  heading: string;
}) => {
  const [openModal, setOpenModal] = useState(false);

  const handleNextPage = () => {
    setOpenModal(true);
  };

  const onClick = () => {
    setOpenModal(false);
  };

  return (
    <>
      <SecurityLayout onClick={handleGoBack} heading={heading}>
        <div className="lg:mt-7 mt-6 flex-1 flex flex-col justify-between lg:justify-normal">
          <div className="flex justify-between items-center pb-6 border-b border-white/40">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-4">
              <p>Current card</p>
              <p>**** **** **** 0924</p>
            </div>

            <div className="flex items-center gap-5">
              <Trash2
                size={24}
                color="white"
                className="w-5 h-5 lg:w-6 lg:h-6"
              />
              <PencilLine
                size={24}
                color="white"
                className="w-5 h-5 lg:w-6 lg:h-6"
              />
            </div>
          </div>

          <div className="w-full flex items-center justify-center mt-8">
            <Button
              className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full font-normal text-sm shadow-[2px_2px_0px_2px_#000000] mb-2 bg-tertiary hover:bg-tertiaryHover text-black`}
              onClick={handleNextPage}
            >
              Add a card
            </Button>
          </div>
        </div>
      </SecurityLayout>

      {openModal && (
        <div className="absolute top-0 left-0 right-0 w-full h-full bg-base2 overflow-hidden">
          <UpdateCard onClick={onClick} />
        </div>
      )}
    </>
  );
};

export default CardInfo;
