export interface IAppointment {
  id: string;
  callerId: string | null;
  receiverId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'COMPLETED' | null;
  date: Date;
  appointmentReached: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface IProfile {
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
}
