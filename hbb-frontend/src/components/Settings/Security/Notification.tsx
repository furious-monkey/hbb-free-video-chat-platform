import React from "react";
import SecurityLayout from "./SecurityLayout";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";

const Notification = ({
  handleGoBack,
  heading,
}: {
  handleGoBack: () => void;
  heading: string;
}) => {
  return (
    <SecurityLayout onClick={handleGoBack} heading={heading}>
      <div className="lg:mt-7 mt-8 space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="push-notification">Push notification</Label>
          <Switch id="push-notification" />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="email-notification">Email notification</Label>
          <Switch id="email-notification" />
        </div>
      </div>
    </SecurityLayout>
  );
};

export default Notification;
