"use client";

import Image from "next/image";
import React, { useState } from "react";
import ProfileForm from "./app-reusables/form/ProfileForm";
import { usePathname } from "next/navigation";
import AgencyProfileForm from "./app-reusables/form/AgencyProfileForm";
import { UploadCloud } from "lucide-react";
import LoadingState from "./app-reusables/LoadingState";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  "pk_test_51QMXSQ07oQlHq5GS1vlAx8weSWq64UDWuOLlA1s0O7ra16ZmaiFjbD6C212aBDF4IXV86oT8RMVTH3GWAca9KjPg00ZiVHBVmI"
);

interface Props {
  isConfirmationFlow?: boolean;
}

const Profile = ({ isConfirmationFlow }: Props) => {
  const pathname = usePathname();
  const segment = pathname.split("/")[2];
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [gettingProfileDetails, setGettingProfileDetails] = useState(true);

  if (loadingProfile) {
    return (
      <div className="w-full !h-[70vh] lg:!h-[85vh]  bg-pink flex flex-col items-center justify-center bg-pink-100 text-pink-800 rounded-2xl">
        {/* <UploadCloud className="animate-bounce w-12 h-12 mb-4" /> */}
        <LoadingState />
        <p className="mt-4 text-lg font-semibold">Uploading your profile...</p>
        <p className="text-sm text-pink-600">
          Please wait, this might take a few moments.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full !h-[70vh] lg:!h-[85vh] lg:px-8">
        <div className="w-full h-full lg:flex-row flex flex-col lg:overflow-hidden overflow-y-auto bg-pink rounded-2xl">
          <div className="w-full lg:h-full h-[10vh] hidden xl:w-2/5 2xl:w-1/3 flex-none xl:block relative border-r border-[#E4BEC9] overflow-hidden">
            <img
              src="/assests/dashboard/dashboard-mob.png"
              alt=""
              className="w-full h-full object-cover bg-black lg:hidden"
            />
            <img
              src="/assests/dashboard/dashboard.png"
              alt=""
              className="w-full h-full object-cover bg-black lg:block"
            />
          </div>

          <div className="w-full xl:w-3/5 flex-auto bg-pink min-h-0">
            {segment === "agency" ? (
              <AgencyProfileForm />
            ) : (
              <Elements stripe={stripePromise}>
                <ProfileForm
                  gettingProfileDetails={gettingProfileDetails}
                  setLoadingProfile={setLoadingProfile}
                  setGettingProfileDetails={setGettingProfileDetails}
                  isConfirmationFlow={isConfirmationFlow}
                />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
