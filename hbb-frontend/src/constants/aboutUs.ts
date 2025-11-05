interface TextSegment {
  text: string;
  className?: string;
}

interface TextArrayItem {
  segments: TextSegment[];
}

export const textArray: TextArrayItem[] = [
  {
    segments: [
      {
        text: "“At the core of our platform lies our dedication to our creator community, prioritizing their needs and aspirations above all else.”",
      },
    ],
  },
  {
    segments: [
      {
        text: "“Our platform embraces inclusivity, offering a diverse array of captivating live influencers. Begin exploring variety of live influencers here",
      },
      {
        text: " here",
        className: "text-tertiary",
      },
      {
        text: " today.”",
      },
    ],
  },
  {
    segments: [
      {
        text: "Go live with HBB, monetize your streams according to your preferences. Join the HBB influencer community today!",
      },
    ],
  },
];
