"use client";

import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { onSubmitError } from "../lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import contactUsSchema from "../schema/contactUs";
import { toast } from "sonner";
import { z } from "zod";
import { shallow } from "zustand/shallow";
import { useNoAuthStore } from "../store/no-authStore";

const ContactForm = () => {
  const [isPending, startTransition] = React.useTransition();

  const { postContactForm, contact } = useNoAuthStore(
    (state: any) => ({
      postContactForm: state.postContactForm,
      contact: state.contact,
    }),
    shallow
  );

  const form = useForm<z.infer<typeof contactUsSchema>>({
    resolver: zodResolver(contactUsSchema),
    defaultValues: {
      email: "",
      name: "",
      message: "",
      subject: "",
    },
  });

  const onHandleSubmit = async (data: z.infer<typeof contactUsSchema>) => {
    const { email, name, message, subject } = data;
    startTransition(async () => {
      const toastId = toast.loading("Sending message..");
      try {
        const response = await postContactForm({
          name: name,
          email: email,
          subject: subject,
          message: message,
        });
        toast.success(response?.message, { id: toastId });
        return form.reset();
      } catch (error) {
        console.error("Error submitting form:");
        form.reset();
        toast.error("Error submitting form. Please try again later.", {
          id: toastId,
        });
      }
    });
  };

  const { formState } = form;
  const { isValid } = formState;

  return (
    <div className="pb-8 lg:pb-0">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onHandleSubmit)}
          className="space-y-5 md:space-y-8"
        >
          <div className="space-y-5 md:space-y-5">
            <div className="md:flex w-full md:items-center md:justify-between space-y-5 md:space-y-0 md:gap-5 mt-1 md:mt-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-white text-xs">
                      Name
                    </FormLabel>
                    <FormControl className="mt-1">
                      <Input
                        placeholder="Enter"
                        className="bg-[#FFFFFF29] rounded-lg !h-9 2xl:!h-10 !text-white !text-xs px-2 2xl:px-4 w-full placeholder:text-lightgray border-transparent focus:border-white outline-none focus:bg-transparent"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-white text-xs mb-2">
                      Email Address
                    </FormLabel>
                    <FormControl className="mt-1">
                      <Input
                        type="email"
                        placeholder="Enter"
                        className="bg-[#FFFFFF29] rounded-lg !h-9 2xl:!h-10 !text-white !text-xs px-2 2xl:px-4 w-full placeholder:text-lightgray border-transparent focus:border-white outline-none focus:bg-transparent"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-xs mb-2">
                    Subject of your message
                  </FormLabel>
                  <FormControl className="mt-1">
                    <Input
                      placeholder="Enter"
                      className="bg-[#FFFFFF29] rounded-lg !h-9 2xl:!h-10 !text-white !text-xs px-2 2xl:px-4 w-full placeholder:text-lightgray border-transparent focus:border-white outline-none focus:bg-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-xs mb-2">
                    Message
                  </FormLabel>
                  <FormControl className="mt-1">
                    <Textarea
                      placeholder="Enter"
                      className="bg-[#FFFFFF29] rounded-lg !h-9 2xl:!h-10 !text-white !text-xs px-2 2xl:px-4 w-full placeholder:text-lightgray border-transparent focus:border-white outline-none focus:bg-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            className={` bg-white text-black w-full rounded-full p-3 hover:bg-white hover:text-black !h-9 !text-sm  ${
              isValid ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            loading={isPending}
            disabled={!isValid}
            variant="ghost"
            type="submit"
          >
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ContactForm;

