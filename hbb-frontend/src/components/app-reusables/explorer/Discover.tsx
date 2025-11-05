"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "../../ui/separator";
import { Check, X } from "lucide-react";
import DiscoverCard from "./DiscoverCard";
import { useDrag } from "@use-gesture/react";
import { animated, useSpring, config } from "@react-spring/web";
import EmptyState from "../EmptyState";

const dummyProfiles = [
  {
    id: 1,
    firstName: "Sassy",
    lastName: "L",
    profile: {
      location: "Washington, D.C",
      zodiacSign: "Aquarius",
      interests: ["Writing", "Walking dogs", "Whisky"],
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fringilla sit libero sed neque aliquam curabitur ac adipiscing et. Nulla odio gravida augue tellus pellentesque.",
      callRate: 25.0,
    },
    profileImageDetails: {
      url: "https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/ced88dd7-8153-4c43-8ffc-35d9c2598d7b_1723190661234",
    },
  },
  {
    id: 2,
    firstName: "Cool",
    lastName: "C",
    profile: {
      location: "New York, NY",
      zodiacSign: "Gemini",
      interests: ["Photography", "Cooking", "Travel"],
      bio: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
      callRate: 30.0,
    },
    profileImageDetails: {
      url: "https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/2bf9e243-7ef4-4a76-99bf-9cad8b8424e5_1723193062783",
    },
  },
  {
    id: 3,
    firstName: "Charming",
    lastName: "B",
    profile: {
      location: "Los Angeles, CA",
      zodiacSign: "Leo",
      interests: ["Music", "Surfing", "Gaming"],
      bio: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque.",
      callRate: 35.0,
    },
    profileImageDetails: {
      url: "https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/2bf9e243-7ef4-4a76-99bf-9cad8b8424e5_1723193062783",
    },
  },
  {
    id: 4,
    firstName: "Glam",
    lastName: "G",
    profile: {
      location: "Miami, FL",
      zodiacSign: "Scorpio",
      interests: ["Fashion", "Beach Volleyball", "Blogging"],
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.",
      callRate: 28.0,
    },
    profileImageDetails: {
      url: "https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/ced88dd7-8153-4c43-8ffc-35d9c2598d7b_1723190661234",
    },
  },
];

const Discover = () => {
  const [profiles, setProfiles] = useState(dummyProfiles);
  const [swipeAnimation, setSwipeAnimation] = useSpring(() => ({
    x: 0,
    rotate: 0,
    config: config.stiff,
  }));

  const dragging = useRef(false);
  const currentProfile = profiles[0];
  const nextProfile = profiles.length > 1 ? profiles[1] : null;

  const handleSwipe = (direction) => {
    const isRightSwipe = direction === "right";
    const swipeValue = isRightSwipe ? 1200 : -1200; // Ensure swipe value is large enough to move card off-screen

    setSwipeAnimation.start({
      x: swipeValue,
      rotate: isRightSwipe ? 25 : -25, // Increase rotation slightly
      onRest: () => {
        setProfiles((prevProfiles) => prevProfiles.slice(1));
        setSwipeAnimation.start({ x: 0, rotate: 0 });
      },
    });
  };

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [xDir], cancel }) => {
      dragging.current = down;

      if (down) {
        setSwipeAnimation.start({
          x: mx,
          rotate: mx / 20,
        });
      }

      if (!down && (Math.abs(mx) > 100 || Math.abs(vx) > 0.5)) {
        const swipeDirection = mx > 0 ? "right" : "left";
        handleSwipe(swipeDirection);
        cancel();
      } else if (!down) {
        setSwipeAnimation.start({ x: 0, rotate: 0 });
      }
    },
    {
      axis: "x",
      filterTaps: true,
      threshold: 10,
    }
  );

  return (
    <div className="w-full flex flex-col h-[50vh] bg-pink gap-4 lg:h-[calc(100vh-160px)] relative">
      <Separator
        className="w-full h-px bg-placeholderText hidden md:block mt-12"
        orientation="horizontal"
      />

      <div className="flex-grow flex items-center justify-center relative m-0">
        {nextProfile && (
          <div className="absolute w-full h-full flex justify-center items-center">
            <DiscoverCard profile={nextProfile} />
          </div>
        )}

        {currentProfile ? (
          <animated.div
            {...bind()}
            className="absolute w-full h-full flex justify-center items-center"
            style={swipeAnimation}
          >
            <DiscoverCard profile={currentProfile} />
          </animated.div>
        ) : (
          <div className="w-full px-4">
            <EmptyState
              imageLink="/assests/no_live.svg"
              message="No Influencers profiles available"
              mini_text="Check back later to see more profiles"
              width={290}
              height={322}
              isLive
            />
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-x-8 justify-center mb-8 2xl:mb-16">
        <div className="text-center">
          <Button
            onClick={() => handleSwipe("left")}
            className="w-12 h-12 rounded-full bg-white shadow-lg"
            disabled={dragging.current || !currentProfile}
          >
            <X className="text-pink" />
          </Button>
          <p className="text-xs mt-1 text-white">Swipe left</p>
        </div>

        <Separator
          className="w-px h-full bg-placeholderText"
          orientation="vertical"
        />

        <div className="text-center">
          <Button
            onClick={() => handleSwipe("right")}
            className="w-12 h-12 rounded-full bg-white shadow-lg"
            disabled={dragging.current || !currentProfile}
          >
            <Check className="text-pink" />
          </Button>
          <p className="text-xs mt-1 text-white">Swipe right</p>
        </div>
      </div>
    </div>
  );
};

export default Discover;
