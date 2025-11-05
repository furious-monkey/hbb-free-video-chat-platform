"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { confirmCodeSchema } from "@/src/schema/auth/signup";
import { z } from "zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/src/components/ui/input-otp";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { shallow } from "zustand/shallow";
import { useUserStore } from "@/src/store/userStore";
import { Loader2 } from "lucide-react";

interface Props {
  email: string;
}

const ConfirmationForm = ({ email }: Props) => {
  const [isPending, startTransition] = React.useTransition();

  const { loading, resendOTP, verifyEmail, resendLoading } = useUserStore(
    (state: any) => ({
      loading: state.loading,
      resendLoading: state.resendLoading,
      resendOTP: state.resendOTP,
      verifyEmail: state.verifyEmail,
      isAuth: state.isAuth,
    }),
    shallow
  );

  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.split("/")[1];

  const form = useForm<z.infer<typeof confirmCodeSchema>>({
    resolver: zodResolver(confirmCodeSchema),
    defaultValues: {
      pin: "",
    },
  });

  const pin = form.watch("pin");

  const handleResendOTP = () => {
    startTransition(async () => {
      try {
        await resendOTP({ email });
      } catch (error: any) {
        console.error( error.message);
      }
    });
  };

  const onSubmit = (data: z.infer<typeof confirmCodeSchema>) => {
    console.log("data:", data);
    startTransition(async () => {
      try {
        const response = await verifyEmail({ otp: data.pin });
        if(response){
          router.push(`/dashboard/${segment}/profile?isConfirmationFlow=true`);
        }
      } catch (error: any) {
        console.error( error.message);
      }
    });
  };

  return (
    <div className="py-6 md:py-10 lg:py-6 2xl:py-14 text-darkGray h-full flex flex-col md:px-6 lg:px-0">
      <div className="h-full overflow-y-auto no-scrollbar">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="h-full flex flex-col justify-between"
          >
            <div className="">
              <div className="text-center md:mb-[60px] mb-9">
                <h4 className="text-base 2xl:text-2xl font-medium mb-4">
                  Enter confirmation code
                </h4>
                <p className="text-sm 2xl:text-lg">
                  Enter code sent to {email || "--"}
                  <span
                    onClick={handleResendOTP}
                    className="text-sm 2xl:text-lg text-base2 ml-1 cursor-pointer m-auto"
                  >
                    {resendLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Resend"
                    )}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-center">
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <>
                      <FormItem className="w-fit border border-borderGray rounded-32px px-4 py-[6px] text-black">
                        <FormControl>
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup className="flex gap-[10px]">
                              {Array.from({ length: 6 }, (_, index) => (
                                <InputOTPSlot
                                  key={index}
                                  index={index}
                                  className="text-xl 2xl:text-sxl border-b border-r-0 border-t-0 border-l-0 border-[#BFBEB9] text-xl text-darkGray cursor-text"
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
              </div>
            </div>

            <div className="mt-24">
              <Button
                type="submit"
                variant="yellow"
                disabled={!pin || pin.length < 4}
                loading={isPending} size={"lg"}
                className={`w-full px-5 py-3 rounded-full text-black font-normal text-sm ${
                  !pin
                    ? "bg-lightgray cursor-not-allowed text-gray"
                    : "bg-tertiary hover:bg-tertiaryHover"
                }`}
              >
                Confirm
              </Button>

              <div className="mt-8 flex justify-center gap-[12px]"> 
                <div className="w-[10px] h-[10px] border border-base1 rounded-full bg-primary"></div>
                <div className="w-[10px] h-[10px] border border-base1 rounded-full bg-base1"></div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ConfirmationForm;
