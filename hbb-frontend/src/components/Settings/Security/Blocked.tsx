"use client";

import React, { useState } from "react";
import SecurityLayout from "./SecurityLayout";
import ModalV2 from "../../app-reusables/ModalV2";
import { Button } from "../../ui/button";

const Blocked = ({
  handleGoBack,
  heading,
}: {
  handleGoBack: () => void;
  heading: string;
}) => {
  const [showModal, setShowModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([
    { id: 1, name: "Claudia Maudi" },
    { id: 2, name: "John Doe" },
    { id: 3, name: "Jane Smith" },
    { id: 4, name: "Michael Johnson" },
    { id: 5, name: "Emily Davis" },
    { id: 6, name: "David Brown" },
    { id: 7, name: "Sophia Wilson" },
    { id: 8, name: "Oliver Martinez" },
    { id: 9, name: "Liam Anderson" },
    { id: 10, name: "Emma Thompson" },
    { id: 11, name: "Ava White" },
    { id: 12, name: "Isabella Harris" },
    { id: 13, name: "Mason Clark" },
    { id: 14, name: "Lucas Lewis" },
    { id: 15, name: "Amelia Walker" },
  ]);
  const [unblockedUser, setUnblockedUser] = useState<string | null>(null);

  const handleUnblock = (userId: number, userName: string) => {
    setBlockedUsers((prevUsers) =>
      prevUsers.filter((user) => user.id !== userId)
    );
    setUnblockedUser(userName);
    setShowModal(true);
  };

  return (
    <>
      <SecurityLayout onClick={handleGoBack} heading={heading}>
        <div className="lg:mt-7 mt-6">
          {blockedUsers.map((user) => (
            <div
              key={user.id}
              className="w-full flex items-center justify-between p-3 border-b border-white/25"
            >
              <div className="flex items-center gap-3">
                <div className="lg:w-11 lg:h-11 w-9 h-9 rounded-full bg-slate-400" />
                <p className="">{user.name}</p>
              </div>

              <Button
                className="shadow-none border-none bg-transparent p-0 h-fit w-fit"
                onClick={() => handleUnblock(user.id, user.name)}
              >
                <p className="text-white text-sm rounded-32px py-2 lg:px-4 px-3 border border-white">
                  Unblock
                </p>
              </Button>
            </div>
          ))}
        </div>
      </SecurityLayout>

      <div
        className={`top-0 left-1/2 transform -translate-x-1/2  absolute overflow-y-hidden z-40  w-full h-full  ${
          showModal ? "top-1/2 transform -translate-y-1/2" : "-translate-y-full"
        } ease-in-out duration-500`}
      >
        <ModalV2
          isOpen={showModal}
          buttonText="✅  The user has been unblocked"
          onClose={() => {
            setShowModal(false);
          }}
        />
      </div>
    </>
  );
};

export default Blocked;
