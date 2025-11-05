import React from "react";
import EditProfileModal from "./EditProfileModal";
import PasswordUpdateModal from "./PasswordUpdateModal";
import PaymentMethodModal from "./PaymentMethodModal";
import CallHistoryModal from "./CallHistoryModal";
import EarningsModal from "./EarningsModal";
import CreatePasswordModal from "./CreatePasswordModal";
import ResetPasswordModal from "./ResetPasswordModal";
import ReportModal from "./ReportModal";
import { Button } from "../../ui/button";
import { CancelIcon } from "../../svgs";
import InfluencerViewModal from "./InfluencerViewModal";
import GiftModal from "../explorer/GiftModal";
import ShareProfileModal from "./ShareProfileModal";
import TransactionalHistoryModal from "./TransactionHistoryModal";
import TransactionDetailsModal from "./TransactionDetailsModal";
import GetPaidModal from "./GetPaidModal";
import { LIVE_FEATURES } from "@/src/lib/constants";

interface DashboardModalProps {
  type:
    | "edit"
    | "passwordUpdate"
    | "cardDetails"
    | "earnings"
    | "callHistory"
    | "resetPassword"
    | "createPassword"
    | "report"
    | "influencer"
    | "gift"
    | "shareProfile"
    | "transactionHistory"
    | "transactionDetails"
    | "getPaid"
  isOpen: boolean;
  onClose: () => void;
}



const DashboardModal = ({ type, isOpen, onClose }: DashboardModalProps) => {
  if (!isOpen) return null;
  
  if (!LIVE_FEATURES.includes(type)) {
    return null;
  }

  const renderModalContent = () => {
    switch (type) {
      case "edit":
        return <EditProfileModal isOpen={isOpen} onClose={onClose} />;
      case "report":
        return <ReportModal isOpen={isOpen} onClose={onClose} />;
      case "passwordUpdate":
        return <PasswordUpdateModal isOpen={isOpen} onClose={onClose} />;
      case "cardDetails":
        return <PaymentMethodModal isOpen={isOpen} onClose={onClose} />;
      case "earnings":
        return <EarningsModal isOpen={isOpen} onClose={onClose} />;
      case "resetPassword":
        return <ResetPasswordModal isOpen={isOpen} onClose={onClose} />;
      case "createPassword":
        return <CreatePasswordModal isOpen={isOpen} onClose={onClose} />;
      case "callHistory":
        return <CallHistoryModal isOpen={isOpen} />;
      case "gift":
        return <GiftModal isOpen={isOpen} />;
      case "influencer":
        return <InfluencerViewModal isOpen={isOpen} onClose={onClose} />;
      case "shareProfile":
        return <ShareProfileModal isOpen={isOpen} />;
      case "transactionHistory":
        return <TransactionalHistoryModal isOpen={isOpen} />;
      case "transactionDetails":
        return <TransactionDetailsModal isOpen={isOpen} />;
      case "getPaid":
        return <GetPaidModal onClose={onClose} isOpen={isOpen} />
      default:
        return null;
    }
  };

  const title = () => {
    switch (type) {
      case "edit":
        return "Edit Profile";
      case "report":
        return "Report";
      case "passwordUpdate":
        return "Change Password";
      case "cardDetails":
        return "Payment Method";
      case "earnings":
        return "Earnings";
      case "resetPassword":
        return "Reset Password";
      case "createPassword":
        return "Create Password";
      case "callHistory":
        return "Call History";
      case "gift":
        return "Gifts";
      case "transactionHistory":
        return "Transaction History";
      case "transactionDetails":
        return "Transaction Details";
      case "getPaid":
        return "Get Paid";
      default:
        return "";
    }
  };

  const closeModal = () => {
    console.log("run closeModal");
    onClose();
  };

  return (
    <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/[0.7] backdrop-blur-sm w-full fade-in"
    >
      <div className="relative rounded-lg w-11/12 md:w-[45%] mx-auto transform-gpu animate-flip-in overflow-hidden">
        <div className="flex items-center justify-center w-full ">
          <section className="bg-popover backdrop-blur-3xl border-white/10 border p-0 w-full max-w-full rounded-lg !h-[70vh] lg:!h-[80vh] lg:rounded-2xl shadow-lg relative overflow-hidden">
           <div className="bg-black/80  p-6 w-full h-full pb-10">
           <div className="pb-2 pt-2">
              <Button
                onClick={closeModal}
                variant="link"
                className="absolute top-4 right-6 bg-white rounded-md p-0.5 w-6 h-6 flex items-center justify-center"
              >
                <CancelIcon className="w-4/5 h-4 text-[#6AB5D2]" />
              </Button>
            </div>
            <div className="border-b-[1px] border-[#88C4DB] pb-1 -mt-1 mb-3 h-9">
              <p className="text-xl 2xl:text-xl leading-[30px] font-normal">
                {title()}
              </p>
            </div>
            <div className="h-full overflow-y-auto no-scrollbar">
              {renderModalContent()}
            </div>
           </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardModal;