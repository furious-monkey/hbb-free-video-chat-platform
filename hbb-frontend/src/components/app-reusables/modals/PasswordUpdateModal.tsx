import React, { useTransition } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname } from "next/navigation";
import { z } from "zod";
import { changePasswordSchema } from "@/src/schema/auth/changePassword";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
interface Props {
  isOpen: boolean;
  onClose: (value: boolean) => void;
}

const PasswordisOpen = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { formState } = form;
  const { isValid } = formState;

  const openResetPasswordPage = () => {
    router.push(`${pathname}?modal=resetPassword`);
  };

  const onHandleSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    const { password, newPassword, confirmNewPassword } = data;
    startTransition(async () => {});
  };

  return (
    <>
      {isOpen && (
        <>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onHandleSubmit)}
              className="grid gap-4"
            >
              <div className="my-1 2xl:my-4 border-b-[0.5px] border-white pb-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-[9px] text-white text-xs opacity-60">
                        Current password
                      </FormLabel>
                      <FormControl className="mt-1">
                        <Input
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                          }}
                          placeholder="Enter current password"
                          type="password"
                          className=" text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:opacity-60 placeholder:text-xs !border-none outline-none w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end mt-2">
                  <p
                    className="text-xs font-medium text-[#F1E499] cursor-pointer"
                    onClick={openResetPasswordPage}
                  >
                    Forgot password?
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-[9px] text-white text-xs opacity-60">
                      New password
                    </FormLabel>
                    <FormControl className="mt-1">
                      <Input
                        placeholder="Enter new password"
                        type="password"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                        className=" text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:opacity-60 placeholder:text-xs !border-none outline-none w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-[9px] text-white text-xs opacity-60">
                      Confirm new password
                    </FormLabel>
                    <FormControl className="mt-1">
                      <Input
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                        placeholder="Re-enter new password"
                        type="password"
                        className=" text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:opacity-60 placeholder:text-xs !border-none outline-none w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:w-1/2 md:mx-auto w-full md:mt-[3.5rem] mt-[2.5rem] mb-8 justify-center items-center">
                <Button
                  variant="yellow"
                  className={`w-full grid h-11 shadow-custom-shadow text-sm
                    ${!isValid ? "bg-[#ECECEC] text-[#ADADAD]" : ""}
                  `}
                  disabled={!isValid}
                >
                  Update password
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </>
  );
};

export default PasswordisOpen;
