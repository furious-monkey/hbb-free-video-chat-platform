interface Feature {
  feature: string;
  status: boolean;
  subText?: string;
}

interface Fees {
  label: string;
  amount: string;
}

export type CardItem = {
  title: string;
  price?: string;
  features: Feature[];
  fees?: Fees[];
  bgColor: string;
  activeSubscription?: boolean;
};

export const SubscribeData: CardItem[] = [
  {
    title: "free",
    price: "000",
    features: [
      {
        feature: "Live calls (limited)",
        status: true,
      },
      {
        feature: "Discover",
        status: false,
      },
      {
        feature: "Like",
        status: false,
      },
      {
        feature: "Request call",
        status: false,
      },
    ],
    bgColor: "#F88CAB",
    activeSubscription: true,
  },
  {
    title: "standard",
    price: "1000",
    features: [
      {
        feature: "Live calls",
        status: true,
      },
      {
        feature: "Discover",
        status: true,
      },
      {
        feature: "Like",
        status: true,
      },
      {
        feature: "Request call",
        status: false,
      },
    ],
    bgColor: "#6AB5D2",
  },
  {
    title: "premium",
    price: "2000",
    features: [
      {
        feature: "Live calls",
        status: true,
      },
      {
        feature: "Discover",
        status: true,
      },
      {
        feature: "Like",
        status: true,
      },
      {
        feature: "Request call",
        status: true,
      },
    ],
    bgColor: "#994D8A",
  },
];

export const agencySubscribeData: CardItem[] = [
  {
    title: "starter",
    price: "5,875",
    features: [
      {
        feature: "30 Influencers",
        status: true,
      },
      {
        feature: "Monthly fee",
        subText: "$375",
        status: true,
      },
      {
        feature: "Agency cut",
        subText: "18%",
        status: true,
      },
      {
        feature: "Influencer visibility",
        subText: "3x",
        status: true,
      },
      {
        feature: "Influencer daily call time",
        subText: "120 mins",
        status: true,
      },
    ],
    fees: [
      {
        label: "Registration fee",
        amount: "$ 5,500",
      },
      {
        label: "Monthly fee",
        amount: "$ 375",
      },
    ],
    bgColor: "#F88CAB",
    activeSubscription: true,
  },
  {
    title: "pro",
    price: "9,775",
    features: [
      {
        feature: "70 Influencers",
        status: true,
      },
      {
        feature: "Monthly fee",
        subText: "$475",
        status: true,
      },
      {
        feature: "Agency cut",
        subText: "18%",
        status: true,
      },
      {
        feature: "Influencer visibility",
        subText: "5x",
        status: true,
      },
      {
        feature: "Influencer daily call time",
        subText: "180 mins",
        status: true,
      },
    ],
    fees: [
      {
        label: "Registration fee",
        amount: "$ 9,300",
      },
      {
        label: "Monthly fee",
        amount: "$ 475",
      },
    ],
    bgColor: "#6AB5D2",
  },
  {
    title: "premium",
    price: "13,675",
    features: [
      {
        feature: "120 Influencers",
        status: true,
      },
      {
        feature: "Monthly fee",
        subText: "$575",
        status: true,
      },
      {
        feature: "Agency cut",
        subText: "18%",
        status: true,
      },
      {
        feature: "Influencer visibility",
        subText: "7x",
        status: true,
      },
      {
        feature: "Influencer daily call time",
        subText: "240 mins",
        status: true,
      },
    ],
    fees: [
      {
        label: "Registration fee",
        amount: "$ 13,100",
      },
      {
        label: "Monthly fee",
        amount: "$ 575",
      },
    ],
    bgColor: "#994D8A",
  },
];
