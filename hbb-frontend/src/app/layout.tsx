// frontend/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { ClientWebSocketProvider } from "../lib/providers/ClientWebSocketProvider";

 const SpaceGrotesk = localFont({
  src: [
    { path: "/fonts/SpaceGrotesk-Light.ttf", weight: "300", style: "light" },
    {
      path: "/fonts/SpaceGrotesk-Regular.ttf",
      weight: "400",
      style: "regular",
    },
    { path: "/fonts/SpaceGrotesk-Medium.ttf", weight: "500", style: "medium" },
    { path: "/fonts/SpaceGrotesk-SemiBold.ttf", weight: "600", style: "bold" },
    { path: "/fonts/SpaceGrotesk-Bold.ttf", weight: "700", style: "bold" },
  ],
});
export const metadata: Metadata = {
  title: "HBB | Easy way to link up with your favourite models",
  description:
    "Go live with HBB, monetize your streams according to your preferences. Join the HBB influencer community today!",
  openGraph: {
    title: "HBB | Go Live and Monetize Your Streams with Ease",
    description:
      "HBB helps you go live, connect with your audience, and monetize your content on your own terms. Join the growing HBB influencer community today.",
    url: "https://www.hbb.live",
    siteName: "HBB",
    images: [
      {
        url: "/img/hbb_banner.png",
        width: 1200,
        height: 630,
        alt: "HBB hero image - Go live and earn with your audience.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HBB | Go Live and Earn on Your Terms",
    description:
      "Stream, engage, and monetize with HBB. Join top influencers using HBB to grow their audience and income.",
    images: ["/img/bb_banner.png"],
  },
};

export const viewport: Viewport = {
  maximumScale: 1.0,
  initialScale: 1.0,
  userScalable: false,
  width: "device-width",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* I am adding this fix because safari for some doesn't support viewport from NextJS */}
       <head>
        {/* Ensures no zoom on input focus */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className={SpaceGrotesk.className} suppressHydrationWarning>
        <Toaster position="top-right" />

        <>
        <ClientWebSocketProvider>
          <div className="bg-black w-full h-full">
            <div className="w-full mx-auto max-w-screen-2xl 2xl:max-w-screen-3xl h-full">
              {children}
            </div>
          </div>
          </ClientWebSocketProvider>
        </>
      </body>
    </html>
  );
}
