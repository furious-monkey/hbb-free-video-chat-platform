import ConfirmationForm from "@/src/components/app-reusables/form/ConfirmationForm";
import React from "react";

const ConfirmationPage = ({
  searchParams,
}: {
  searchParams?: {
    email?: string;
  };
}) => {
  return (
    <>
      {searchParams?.email && <ConfirmationForm email={searchParams?.email} />}
    </>
  );
};

export default ConfirmationPage;
