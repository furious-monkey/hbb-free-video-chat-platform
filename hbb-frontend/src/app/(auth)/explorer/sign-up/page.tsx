import SignupForm from "@/src/components/app-reusables/form/SignupForm";
import { redirect } from "next/navigation"

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