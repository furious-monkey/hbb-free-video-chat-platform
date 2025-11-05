// dashboard/influencer/video-call/components/WaitingForExplorer.tsx
import Image from "next/image";
import React, { useState, useEffect } from "react";

interface WaitingForExplorerProps {
  hasIncomingBids: boolean;
  sessionId: string | null;
}

const WaitingForExplorer: React.FC<WaitingForExplorerProps> = ({
  hasIncomingBids,
  sessionId,
}) => {
  const [dots, setDots] = useState("");

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30">
      <div className="bg-black bg-opacity-60 backdrop-blur-lg rounded-2xl p-8 w-[579px] max-w-md mx-4 text-center text-white">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <Image
              src="/icons/video-waiting.svg"
              alt="Waiting Icon"
              className="w-12 h-12"
              width={60}
              height={60}
            />
          </div>
        </div>

        {/* Main Message */}
        <h2 className="text-xl font-semibold mb-4">
          {hasIncomingBids
            ? "You have incoming bids!"
            : "Waiting for explorers"}
        </h2>

        {/* Status Text */}
        <p className="text-sm opacity-75 mb-6">
          {hasIncomingBids
            ? "Review and accept bids to start your video call"
            : `Your stream is live${dots}`}
        </p>

        {sessionId && (
          <div className="bg-white bg-opacity-5 rounded-lg p-3 mb-4 h-20 mx-auto w-2/3"></div>
        )}

        <InfluencerSteps />

        {/* Pulse Animation for Live Indicator */}
        <div className="mt-6 flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-red-400">LIVE</span>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default WaitingForExplorer;


const InfluencerSteps = () => {
  const steps = [
    {
      icon: "/icons/share-influencer.svg",
      text: "Share your stream link with explorers",
      highlighted: true
    },
    {
      icon: "/icons/video-influencer.svg",
      text: "Explorers can bid to join your call",
      highlighted: false
    },
    {
      icon: "/icons/wallet-influencer.svg",
      text: "Start earning when someone joins!",
      highlighted: false
    }
  ];

  return (
    <div className="text-xs text-center flex flex-col items-center space-y-2 mt-6">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <img
            src={step.icon}
            alt={`Step ${index + 1}`}
            width={24}
            height={24}
            className="flex-shrink-0 w-6 h-6"
          />
          <p className={step.highlighted ? "text-[#6AB5D2]" : ""}>
            {step.text}
          </p>
        </div>
      ))}
    </div>
  );
};

