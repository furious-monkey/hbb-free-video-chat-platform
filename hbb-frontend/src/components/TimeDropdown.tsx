"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";

interface DropdownItem {
  label: string;
  value: string;
  price: string;
}

interface DropdownProps {
  items: DropdownItem[];
  setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

const TimeDropdown = ({ items, setShowDropdown }: DropdownProps) => {
  const [selectedItem, setSelectedItem] = useState(items[0].value);

  const handleSelect = (value: string) => {
    setSelectedItem(value);
  };

  return (
    <ul>
      {items.map((item) => (
        <li
          key={item.value}
          className={`flex justify-between items-center px-5 py-3 lg:px-3 cursor-pointer hover:bg-base1/85 text-white border-b border-black text-lg transition-all duration-500 delay-75 ease-in-out ${
            selectedItem === item.value ? "bg-base1" : "bg-base2"
          }`}
          onClick={() => handleSelect(item.value)}
        >
          <p>{item.label}</p>
          <p>{item.price}</p>
        </li>
      ))}
      <li className="flex justify-center px-5 py-4 lg:px-3">
        <Button
          className={`w-2/3 px-5 py-2 rounded-full text-black font-normal text-sm shadow-[2px_2px_0px_2px_#000000] bg-tertiary hover:bg-tertiaryHover
              `}
          variant="yellow"
          onClick={() => setShowDropdown(false)}
        >
          Purchase
        </Button>
      </li>
    </ul>
  );
};

export default TimeDropdown;
