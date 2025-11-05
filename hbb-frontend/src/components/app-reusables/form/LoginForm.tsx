"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/src/schema/auth/login";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { shallow } from "zustand/shallow";
import { useUserStore } from "@/src/store/userStore";
import { useSignupModal } from "@/src/context/SignupModalContext";

const LoginForm = () => {
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const { openSignupModal } = useSignupModal();

  // create a function that uses the data to confirm if the user is a influencer or agency or explorer and route based on that

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { loading, login } = useUserStore(
    (state: any) => ({
      loading: state.loading,
      login: state.login,
      isAuth: state.isAuth,
    }),
    shallow
  );

  const handleSignUpClick = () => {
    openSignupModal(
      {
        question: "Are you 18 or older?",
        button1Text: "Yes, I am",
        button2Text: "No, cancel",
        button1Style: "",
        button2Style: "",
      },
      () => {
        router.push("/sign-up");
      }
    );
  };

  const onHandleSubmit = async (data: z.infer<typeof loginSchema>) => {
    const { email, password } = data;
    startTransition(async () => {
      try {
        await login({ email: email.toLowerCase().trim(), password }, router);
      } catch (error: any) {
        console.error("Error in:", error?.message);
      }
    });
  };

  const { formState } = form;
  const { isValid } = formState;

  return (
    <div className="py-4 md:py-6 lg:pt-2 lg:pb-0 text-darkGray flex flex-col h-full md:px-6 lg:px-0">
      <div className="h-full overflow-y-auto no-scrollbar">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onHandleSubmit)}
            className="h-full flex flex-col justify-between overflow-hidden"
          >
            <div className="h-[350px] 2xl:h-[60vh] overflow-scroll no-scrollbar">
              <p className="font-medium text-lg md:text-2xl lg:text-lg 2xl:text-2xl text-center mb-6 lg:mb-3 2xl:mb-6 w-4/5 mx-auto mt-4">
                Log in to see your favorite content creator
              </p>

              <div className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text text-xs font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl className="mt-1">
                        <Input
                          placeholder="Enter a Valid Email"
                          className="border-borderGray py-12.5px rounded-lg px-3 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className=" max-h-[35vh] lg:max-h-[45vh]">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-textGray2 text-xs mb-2 font-medium">
                          Password
                        </FormLabel>
                        <FormControl className="mt-1">
                          <Input
                            type="password"
                            placeholder="Enter your Password"
                            className="border-borderGray py-12.5px rounded-lg px-3 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                            {...field}
                            eyeToggleColor="#BFBEB9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end mt-2">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-base2"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>

              {/* <div className="text-center mt-5 md:mt-8 lg:mt-16 mb-16 md:mb-24"> */}
              <div className="text-center mt-2 md:mt-8 lg:mt-4 2xl:mt-16">
                <Button
                  className={`w-full px-5 py-3 rounded-full text-black font-normal text-sm h-10 ${
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
                  Next
                </Button>
              </div>
            </div>

            <div className="absolute left-0 border-solid border-background border-t-4 w-full bottom-5 mt-6">
              <div className="text-center mt-4">
                <p className="text-textGray2 font-normal text-sm 2xl:text-lg text-center w-4/5 mx-auto">
                  Don't have an account?
                  <Button
                    type="button"
                    onClick={handleSignUpClick}
                    className="px-0 font-normal text-tertiary text-sm 2xl:text-lg text-center ml-1"
                  >
                    Sign up
                  </Button>
                </p>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
