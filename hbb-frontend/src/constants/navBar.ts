import Live from "@/public/assests/dashboard/goLive.svg";
import Inbox from "@/public/assests/dashboard/inbox.svg";
import Likes from "@/public/assests/dashboard/liked.svg";
import Settings from "@/public/assests/dashboard/setting.svg";
import Discover from "@/public/assests/dashboard/discover.svg";

export const data = [
  {
    id: 1,
    image: Live,
    title: "Go live",
    to: "/dashboard/influencer/live",
  },
  {
    id: 2,
    image: Likes,
    title: "Likes",
    to: "/dashboard/influencer/likes",
  },
  {
    id: 3,
    image: Inbox,
    title: "Inbox",
    to: "/dashboard/influencer/inbox",
  },
  {
    id: 4,
    image: Settings,
    title: "Settings",
    to: "/dashboard/influencer/settings",
  },
];

export const explorerData = [
  {
    id: 1,
    image: Live,
    title: "Go live",
    to: "/dashboard/explorer/live",
  },
  {
    id: 2,
    image: Likes,
    title: "Likes",
    to: "/dashboard/explorer/likes",
  },
  {
    id: 3,
    image: Discover,
    title: "Discover",
    to: "/dashboard/explorer/discover",
  },
  {
    id: 4,
    image: Inbox,
    title: "Inbox",
    to: "/dashboard/explorer/inbox",
  },
  {
    id: 5,
    image: Settings,
    title: "Settings",
    to: "/dashboard/explorer/settings",
  },
];
