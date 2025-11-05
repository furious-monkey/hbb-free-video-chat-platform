"use client";

import React, { useLayoutEffect } from "react";
import { redirect } from "next/navigation";
import { useUserStore } from "../store/userStore";

export default function withAuth(Component: any) {
  return function WithAuth(props: any) {
    const isAuth = useUserStore((state: any) => state.isAuth);

    useLayoutEffect(() => {
      if (!isAuth) {
        redirect("/");
      }
    }, [isAuth]);

    if (!isAuth) {
      return null;
    }

    return <Component {...props} />;
  };
}
