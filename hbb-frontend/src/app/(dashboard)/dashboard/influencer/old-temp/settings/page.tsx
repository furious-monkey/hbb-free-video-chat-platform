import Settings from "@/src/components/Settings";
import React from "react";

const Page = () => {
  return <Settings settingsData={settingsData} />;
};

export default Page;

const settingsData = [
  {
    label: "account",
  },
  {
    label: "security",
  },
  {
    label: "payment",
  },
];
