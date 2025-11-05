import AccountHeader from "@/src/components/AgencyAccount/AccountHeader";
import EarningsByRegion from "@/src/components/AgencyAccount/EarningsByRegion";
import EarningsByYear from "@/src/components/AgencyAccount/EarningsByYear";
// import InfluencerTableData from "@/src/components/AgencyAccount/InfluencerTableData";
import React from "react";

const Page = () => {
  return (
    <div className="bg-base2 w-full h-full px-4 py-5 lg:pl-7 lg:py-9 relative">
      <div className="overflow-y-auto  h-full w-full pr-3">
        <AccountHeader />

        <div className="flex flex-col lg:flex-row my-4 gap-4">
          <EarningsByYear />
          <EarningsByRegion />
        </div>

        {/* <InfluencerTableData /> */}
      </div>
    </div>
  );
};

export default Page;
