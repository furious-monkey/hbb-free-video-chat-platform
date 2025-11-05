import ResetPassword from "@/src/components/pages/auth/ResetPassword";
import { redirect } from "next/navigation";

const Page = ({
  searchParams,
}: {
  searchParams?: {
    token?: string;
  };
}) => {

  if(!searchParams?.token){
    return redirect("/login");
  }
  return <ResetPassword token={searchParams?.token} />;
};

export default Page;