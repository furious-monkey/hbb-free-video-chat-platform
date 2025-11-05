"use client";

import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/src/components/app-reusables/Modal";
import { forgotPasswordSchema } from "@/src/schema/auth/forgotPassword";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import {
  button1GreenStyle,
  button2GreenStyle,
} from "@/src/constants/buttonStyles";
import { z } from "zod";
import { useNoAuthStore } from "@/src/store/no-authStore";
import { shallow } from "zustand/shallow";

const ForgotPassword = () => {
  const [showModal, setShowModal] = useState(false);
  const [emailSend, setEmailSend] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { postForgotPassword } = useNoAuthStore(
    (state: any) => ({
      postForgotPassword: state.postForgotPassword,
    }),
    shallow
  );

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onHandleSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    const { email } = data;

    startTransition(async () => {
      try {
        const toastId = toast.loading("Sending link..");
        setEmailSend(email);

        const response = await postForgotPassword({
          email,
        });

        if (response?.success) {
          toast.success(response?.message, { id: toastId });
          return setShowModal(true);
        }

        toast.error("Link could not be sent", {
          id: toastId,
        });
      } catch (error: any) {
        console.error(error.message);
        toast.error("Error creating profile, try again or contact support");
      }
    });
  };

  const handleYesClick = () => {
    setShowModal(false);

    startTransition(async () => {
      try {
        toast.success("Please check your email, to proceed!");
      } catch (error: any) {
        console.error(error.message);
      }
    });
  };

  const handleResend = () => {
    setShowModal(false);

    startTransition(async () => {
      const toastId = toast.loading("Resending link..");
      try {
        if (emailSend) {
          const response = await postForgotPassword({
            email: emailSend,
          });

          if (response?.success) {
            toast.success(response?.message, { id: toastId });
            return setShowModal(true);
          }

          toast.error("Link could not be sent", {
            id: toastId,
          });
        }
      } catch (error: any) {
        console.error(error.message);
        toast.error("Error creating profile, try again or contact support", {
          id: toastId,
        });
      }
    });
  };

  const { formState } = form;
  const { isValid } = formState;

  return (
    <>
      <div className="py-6 md:py-10 lg:py-4 text-darkGray flex flex-col h-full px-1 md:px-0 lg:px-0">
        <div className="text-center">
          <p className="font-medium text-lg md:text-2xl mb-3">
            Forgot password?
          </p>

          <p className="text-sm md:text-base">
            Enter email address to reset your password.
          </p>
        </div>

        <div className="h-full mt-6 lg:mt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onHandleSubmit)}
              className="flex flex-col h-full justify-between"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-textGray2 text-xs mb-2 font-medium">
                      Email address
                    </FormLabel>
                    <FormControl className="mt-2">
                      <Input
                        placeholder="Enter email address"
                        className="border-borderGray py-12.5px rounded-lg px-3 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-center mt-36 md:mt-24 lg:mt-24">
                <Button
                  className={`w-full px-5 py-2 rounded-full mt-8 text-black font-normal text-lg ${
                    !isValid
                      ? "bg-lightgray text-gray"
                      : "bg-tertiary hover:bg-tertiaryHover"
                  }
              `}
                  // disabled={!isValid}
                  loading={isPending}
                  variant="yellow"
                  type="submit"
                >
                  Send
                </Button>
              </div>

              <div className="hidden md:block absolute border-solid border-background border-t-4 w-full left-0 bottom-5">
                <div className="text-center mt-4">
                  <p className="text-textGray2 font-normal text-sm 2xl:text-lg text-center w-4/5 mx-auto">
                    Don't have an account?
                    <Link
                      href="/influencer/referral"
                      className="font-normal text-tertiary text-sm 2xl:text-lg text-center ml-1"
                    >
                      Sign up
                    </Link>
                  </p>
                  </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <div
      // className={`top-0 left-1/2 transform -translate-x-1/2  absolute overflow-y-hidden z-40  w-full h-full  ${
      //   showModal ? "top-1/2 transform -translate-y-1/2" : "-translate-y-full"
      // } ease-in-out duration-500`}
      >
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onYesClick={handleYesClick}
          onResendCode={handleResend}
          question="Reset mail sent"
          button1Text="Got it!"
          button2Text="send again"
          button1Style={button1GreenStyle}
          button2Style={button2GreenStyle}
          origin="forgotPassword"
        />
      </div>
    </>
  );
};

export default ForgotPassword;
