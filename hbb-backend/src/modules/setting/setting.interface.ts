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
