"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useAdminStore } from "@/src/store/adminStore";
import { shallow } from "zustand/shallow";
import { Button } from "../../ui/button";
import { AdminFAQSInterface } from "@/src/utils/interface";

interface FAQSInterface {
  question: string;
  answer: string;
}

const hardcodedFAQs: FAQSInterface[] = [
  {
    question: "Who can use HBB?",
    answer: "All users must be aged 18 and older to use HBB.",
  },
  {
    question: "What is the payment structure for Influencers?",
    answer:
      "HBB takes 20%, while Influencers receive 80% of the total payments made by Explorers to them, including gifts and other monetary contributions. Payments to Influencers are held for 24 hours before being processed. During this 24-hour hold period, any chargebacks or fraud concerns may be assessed.",
  },
  {
    question: "How are video chats billed?",
    answer:
      "Video chats are pro-rated and billed by the minute, rather than at a flat rate. For instance, if the flat rate is $30 for a call time of 30 minutes, and a user only spends 7 minutes on the call, they will be charged $7.",
  },
  {
    question: "Are live calls recorded?",
    answer:
      "No, HBB does not record live calls as we take the privacy of our users very seriously. We encourage users to obtain the consent of others if they choose to record live calls.",
  },
  {
    question: "Who can see my profile?",
    answer:
      "Only Explorers can search for and view Influencer profiles, while Explorer profiles remain private and can only be seen by an Influencer they engage with.",
  },
  {
    question: "Why was my account suspended/terminated?",
    answer:
      "Accounts may be suspended or terminated for violating our Terms of Service or Call Rules. Influencer accounts can also be suspended or terminated due to inactivity.",
  },
];


const FAQScreen = () => {
  const [fetchedAdminFAQs, setFetchedAdminFAQs] = useState<
    AdminFAQSInterface[]
  >([]);

  const { getAdminFaqs, faqs } = useAdminStore(
    (state: any) => ({
      getAdminFaqs: state.getAdminFaqs,
      faqs: state.faqs,
    }),
    shallow
  );

  useEffect(() => {
    getAdminFaqs();
  }, []);

  useEffect(() => {
    if (faqs?.length) {
      setFetchedAdminFAQs(faqs);
    }
  }, [faqs]);

  return (
    <div className="flex flex-col overflow-auto no-scrollbar h-full pb-16 lg:pb-0">
       <div className="flex md:hidden mb-2 md:mb-0 justify-center lg:justify-start w-full lg:w-[46%] items-center p-0 mt-0">
          <Image
            className="w-[140px] h-[140px] lg:w-[340px] lg:h-auto 2xl:w-[390px] 2xl:h-auto object-contain"
            width={91}
            height={91}
            src={"/assests/logo.svg"}
            alt="logo"
          />
        </div>
      <div className="w-full h-full px-4 lg:pb-14 lg:px-120px md:px-20 md:pb-12 ">
        <div className="flex flex-col w-full">
          <h3 className="hidden lg:flex font-medium text-[#ffffff] text-32px 2xl:text-4xl mb-2 lg:mb-5">
            Frequently asked questions
          </h3>
          <p className="block md:hidden text-[#ffffff] font-medium text-[32px] mb-2">
            FAQ
          </p>
          <div className="flex flex-col overflow-y-auto h-[60vh] lg:h-[50vh] 2xl:h-[60vh] mt-3">
            {hardcodedFAQs && hardcodedFAQs?.length
              ? hardcodedFAQs?.map((faq, idx) => (
                  <div
                    key={idx}
                    className="mx-auto w-full rounded-md bg-neutral-200 bg-opacity-15 mb-4"
                  >
                    <Disclosure as="div" className="px-3 md:px-6 py-4">
                      {({ open }) => (
                        <>
                          <DisclosureButton className="group flex w-full items-center justify-between">
                            <span className="max-w-[81%] text-base text-left lg:text-2xl font-medium text-white group-data-[hover]:text-white/80">
                              {faq?.question}
                            </span>
                            {open ? (
                              <Image
                                src={"/assests/chevUp.svg"}
                                alt={"logo"}
                                width={38}
                                height={38}
                                className="w-[38px] h-[38px]"
                              />
                            ) : (
                              <Image
                                src={"/assests/chevDown.svg"}
                                alt={"logo"}
                                width={38}
                                height={38}
                                className="w-[38px] h-[38px]"
                              />
                            )}
                          </DisclosureButton>
                          <DisclosurePanel className="mt-8 text-sm lg:text-base text-white/90">
                            {faq?.answer}
                          </DisclosurePanel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQScreen;
