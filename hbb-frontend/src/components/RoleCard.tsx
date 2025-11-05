import React from "react";
import Image from "next/image";

interface RoleCardProps {
  role: "influencer" | "explorer";
  selected: boolean;
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, selected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`py-4 rounded-28 border w-full cursor-pointer transition-all delay-75 duration-500 ease-in-out ${
        selected
          ? "bg-base2 border-base2"
          : "bg-white border-black hover:bg-base2/75"
      }`}
    >
      <div className="flex flex-col items-center gap-4 w-full">
        <Image
          className="rounded-full w-20 h-20 lg:h-28 lg:w-28"
          src={`/assests/${role}.png`}
          alt={`${role} image`}
          height={100}
          width={100}
        />
        <p
          className={`text-sm font-medium capitalize ${
            selected ? "text-white" : "text-black"
          }`}
        >
          {role}
        </p>
      </div>
    </div>
  );
};

export default RoleCard;
