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