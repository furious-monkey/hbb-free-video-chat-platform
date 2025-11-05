"use client";

import React, { useEffect, useTransition } from "react";
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
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/src/schema/auth/resetPassword";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { setCookie } from "cookies-next";
import { shallow } from "zustand/shallow";
import { useNoAuthStore } from "@/src/store/no-authStore";

interface ResetPasswordProps {
  token: string;
}

const ResetPassword = ({ token }: ResetPasswordProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { postResetPassword } = useNoAuthStore(
    (state: any) => ({
      postResetPassword: state.postResetPassword,
    }),
    shallow
  );

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onHandleSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    const { password } = data;
    const toastId = toast.loading("Updating Password..");

    startTransition(async () => {
      try {
        if (token) {
          const payload = {
            token,
            data: {
              password,
            },
          };

          const response = await postResetPassword(payload);

          if (response?.success) {
            toast.success(response?.message, { id: toastId });
            return router.push("/login");
          }
        }
      } catch (error: any) {
        console.error(error.message);
        toast.error("Something went wrong", { id: toastId });
      }
    });
  };

  const { formState } = form;
  const { isValid } = formState;

  return (
    <div className="py-6 md:py-10 lg:py-4 2xl:py-14 text-darkGray flex flex-col h-full md:px-6 lg:px-0">
      <div className="text-center">
        <p className="font-medium text-lg md:text-2xl text-center">
          Create new password
        </p>
      </div>

      <div className="h-full mt-6 lg:mt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onHandleSubmit)}
            className="flex flex-col h-full justify-between"
          >
            <div className="space-y-3 md:space-y-5 lg:space-y-3 2xl:space-y-5">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="my-2">
                    <FormLabel className="text-textGray2 text-xs mb-2 font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your password"
                        className="border-borderGray py-12.5px rounded-lg px-5 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                        {...field}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="my-2">
                    <FormLabel className="text-textGray2 text-xs mb-2 font-medium">
                      Confirm password
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Confirm your password"
                        className="border-borderGray py-12.5px rounded-lg px-5 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                        {...field}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="text-center">
              <Button
                className={`w-full px-5 py-3 rounded-full mt-8 text-black font-normal text-sm ${
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
                Confirm
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;
