// import Profile from "@/src/components/pages/dashboard/Profile";
import Profile from "@/src/components/Profile";
import React from "react";


const Page = ({
  searchParams,
}: {
  searchParams?: {
    isConfirmationFlow?: string;
  };
}) => {

  const isConfirmationFlow = Boolean(searchParams?.isConfirmationFlow)
  
  return <Profile isConfirmationFlow={isConfirmationFlow} />;
};

export default Page;
