// dashboard/influencer/video-call/page.tsx - Influencer video call page for handling video call
"use client";
import React, { Suspense } from "react";
import LiveCall from "./LiveCall";
import LoadingState from "@/src/components/app-reusables/LoadingState";

const Page = () => {
  return (
    <Suspense fallback={<LoadingState />}>
      <LiveCall />
    </Suspense>
  );
};

export default Page;