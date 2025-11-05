export interface IProfile {
  id: string;
  userId: string;
  user?: IUser;
  username: string | null;
  bio: string | null;
  location: string | null;
  interests: String[]; 
  zodiacSign: String | null;
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

interface IInterest {
  id: string;
  name: string;
  image: string;
}

interface IZodiacSign {
  id: string;
  name: string;
  image: string;
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
  profile: IProfile;
  profileImageDetails?: IImage | null;
  promotionalVideoDetails?: IVideo[];
}
