export type InfluencerData = {
  id: string;
  name: string;
  memberSince: string;
  liveCalls: number;
  callRequests: number;
  gifts: number;
  likes: string;
  flags: string;
  status: "active" | "suspended";
  totalEarnings: string;
};
