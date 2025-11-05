import React from "react";
import { redirect } from "next/navigation";
import SignupForm from "@/src/components/app-reusables/form/SignupForm";



const page = ({
  searchParams,
}: {
  searchParams?: {
    referral_code?: string;
  };
}) => {

  if(!searchParams?.referral_code){
    return redirect("/");
  }
  return <SignupForm referralCode={searchParams?.referral_code} />;
};

export default page;
