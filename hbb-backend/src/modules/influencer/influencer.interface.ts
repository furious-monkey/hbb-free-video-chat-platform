export interface IProfile {
  id: string;
  userId: string;
  user?: IUser;
  username: string | null;
  bio: string | null;
  location: string | null;
  interests: string[];
  zodiacSign: string | null;
  callRate: string | null;
  likedProfiles: string[];
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  likes: number | null;
  viewCount: number | null;
  allowLike: number | null;
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  userRole: 'INFLUENCER' | 'EXPLORER' | 'ADMIN' | 'AGENCY';
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  gender?: string | null;
  referralCode?: string | null;
  ownedReferralCode?: string | null;
  dateOfBirth?: Date | null;
  phone?: string | null;
  profileImage?: string | null;
  promotionalVideo?: string[] | null;
  isOnline?: boolean;
  isBanned?: boolean;
  isEmailVerified?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  blockedUsers?: string[];
  otp?: string | null;
  otpExpires?: Date | null;
  profileImageDetails?: IImage | null;
  promotionalVideoDetails?: IVideo[];
  interestsDetails?: { name: string; image: string }[];
  zodiacSignDetails?: { name: string; image: string };
  profile?: IProfile | null;
}

interface IImage {
  key: string | null;
  url: string | null;
  Location: string | null;
}

interface IVideo {
  key: string | null;
  url: string | null;
  Location: string | null;
}

export interface IPublicUser {
  id: string;
  userRole: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  dateOfBirth: Date | null;
  promotionalVideo: string[];
  isOnline: boolean;
  profile: any;
  profileImageDetails?: any;
  promotionalVideoDetails?: any;
}

export interface IEPublicInfluencer {
  id: string;
  gender: string | null;
  promotionalVideo: string[];
  profileImageDetails?: {
    key: string | null;
    url: string | null;
    Location: string | null;
  };
  promotionalVideoDetails?: {
    key: string | null;
    url: string | null;
    Location: string | null;
  }[];
  interestsDetails?: { name: string; image: string }[];
  isOnline: boolean;
  isLive: boolean;
  profile: {
    id: string;
    userId: string;
    username: string | null;
    bio: string | null;
    location: string | null;
    interests: string[];
    zodiacSign: string | null;
    callRate: string | null;
    likedProfiles: string[];
    subscriptionPlan: string | null;
    subscriptionStatus: string | null;
    likes: number | null;
    viewCount: number | null;
    allowLike: number | null;
  };
  streamInfo?: {
    id: string;
    status: string;
    allowBids: boolean;
    startTime: Date | null;
    earnings: number;
    hasExplorer: boolean;
  } | null
  zodiacSignDetails?: { name: string; image: string };
}
