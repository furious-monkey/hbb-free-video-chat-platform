"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { shallow } from "zustand/shallow";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { usePathname, useRouter } from "next/navigation";
import { signUpSchema } from "@/src/schema/auth/signup";
import { Checkbox } from "../../ui/checkbox";
import { z } from "zod";
import { CircleCheck } from "lucide-react";
import { useUserStore } from "@/src/store/userStore";

interface SignupFormProps {
  referralCode?: string;
}

type CheckType =
  | "characters"
  | "upper_lower_case"
  | "special_character"
  | "number";

const SignupForm = ({ referralCode }: SignupFormProps) => {
  const [isPending, startTransition] = useTransition();
  const { loading, register } = useUserStore(
    (state: any) => ({
      loading: state.loading,
      register: state.register,
      isAuth: state.isAuth,
    }),
    shallow
  );

  const router = useRouter();
  const pathname = usePathname();
  const userRole = pathname.split("/")[1];
  
  const passwordChecks: CheckType[] = [
    "characters",
    "upper_lower_case",
    "special_character",
    "number",
  ];
  
  const [checkedPasswordFields, setCheckedPasswordFields] = useState<
    Record<CheckType, boolean>
  >({
    characters: false,
    upper_lower_case: false,
    special_character: false,
    number: false,
  });

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      consent: false,
    },
  });

  const password = form.watch("password");

  const checkPasswordValues = (val: string) => {
    setCheckedPasswordFields({
      characters: val.length >= 8,
      upper_lower_case: /[a-z]/.test(val) && /[A-Z]/.test(val),
      number: /\d/.test(val),
      special_character: /[!@#$%^&*(),.?":{}|<>]/.test(val),
    });
  };

  useEffect(() => {
    checkPasswordValues(password);
  }, [password]);

  const onHandleSubmit = async (data: z.infer<typeof signUpSchema>) => {
    const { email, password } = data;
    startTransition(async () => {
      try {
        const response = await register(
          {
            email: email.toLowerCase().trim(),
            password,
            userRole: userRole.toUpperCase(),
            referralCode: referralCode || "",
          },
          router
        );

        if (response) {
          router.push(`/${userRole}/confirm?email=${email}`);
        }
      } catch (error: any) {
        console.error(error?.message);
      }
    });
  };

  const getCheckName = (val: CheckType): string => {
    const names: Record<CheckType, string> = {
      characters: "8 characters",
      upper_lower_case: "one uppercase & one lowercase",
      special_character: "one special character",
      number: "one number",
    };
    return names[val];
  };

  const isFormValid = Object.values(checkedPasswordFields).every(Boolean) && 
                     form.getValues("consent") && 
                     form.getValues("password") === form.getValues("confirmPassword");

  return (
    <div className="py-4 lg:pb-0 text-darkGray flex flex-col h-full md:px-2 lg:px-0 pb-0">
      <div className="h-full overflow-y-auto no-scrollbar">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onHandleSubmit)}
            className="h-full flex flex-col justify-between overflow-hidden"
          >
            <div>
              <p className="font-medium text-lg md:text-2xl lg:text-lg 2xl:text-2xl text-center mb-2 md:mb-6 lg:mb-3 2xl:mb-6 w-4/5 mx-auto">
                Sign up
              </p>

              <div className="space-y-2 md:space-y-2 2xl:space-y-4 max-h-[35vh] lg:max-h-[45vh] overflow-scroll no-scrollbar pl-2 pr-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-textGray2 text-xs mb-2 font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a Valid Email"
                          className="border-borderGray py-3 rounded-lg px-3 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          className="border-borderGray py-3 rounded-lg px-3 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                          {...field}
                          eyeToggleColor="#BFBEB9"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-4">
                  <p className="mb-1 w-4/5 text-xs">
                    Your password must contain at least:
                  </p>
                  <div className="flex flex-wrap gap-x-4 mt-2 flex-col">
                    {passwordChecks.map((check: CheckType) => (
                      <div
                        className="flex items-center mb-2"
                        key={check}
                      >
                        <CircleCheck
                          className="mr-1"
                          color={
                            checkedPasswordFields[check] ? "#0a8f8f" : "#808080"
                          }
                          size={16}
                        />
                        <p
                          className={`text-xs ${
                            checkedPasswordFields[check]
                              ? "text-[#0a8f8f]"
                              : "text-[#808080]"
                          }`}
                        >
                          {getCheckName(check)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="my-2">
                      <FormLabel className="text-textGray2 text-xs mb-2 font-medium">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Confirm your password"
                          className="border-borderGray py-3 rounded-lg px-3 placeholder:text-placeholderText2 text-sm w-full h-fit focus:border-base1"
                          {...field}
                          eyeToggleColor="#BFBEB9"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="consent"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-borderGray data-[state=checked]:bg-base2 data-[state=checked]:border-none"
                          />
                          <div className="grid gap-1.5 leading-none">
                            <FormLabel
                              htmlFor="consent"
                              className="text-[11px] text-[#A5A5A5] leading-4"
                            >
                              By signing up, you consent to our{" "}
                              <Link href={"/terms-of-service"} className="text-base2 hover:underline">
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link href="/privacy-policy" className="text-base2 hover:underline">
                                Privacy Policy
                              </Link>
                            </FormLabel>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-6 mb-20">
                  <Button
                    className={`w-full px-5 py-3 rounded-full text-black font-normal text-sm h-10 ${
                      !isFormValid
                        ? "bg-lightgray text-gray cursor-not-allowed"
                        : "bg-tertiary hover:bg-tertiaryHover"
                    }`}
                    disabled={!isFormValid}
                    loading={isPending || loading}
                    type="submit"
                  >
                    Next
                  </Button>

                  <div className="mt-5 flex justify-center gap-3">
                    <div className="w-2.5 h-2.5 border border-base1 rounded-full bg-base1"></div>
                    <div className="w-2.5 h-2.5 border border-base1 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-background pt-4 mt-6">
              <div className="text-center">
                <p className="text-textGray2 font-normal text-sm text-center w-4/5 mx-auto">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-normal text-tertiary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SignupForm;