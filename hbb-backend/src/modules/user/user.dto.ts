// modules/user/user.dto.ts - User DTOs for handling user details, referral code, discovery, blocking, unblocking, and profile completion
export interface VerifyEmailDto {
  otp: string;
}

export interface getUserDetailsDto {
  userId: string;
}

export interface fetchUsersByReferralCodeDto {
  ownedReferralCode: string;
}

export interface deleteUserDto {
  userId: string;
}

export interface discoverUsersDto {
  page: number;
  limit: number;
}

export interface discoverInfluencersDto {
  page: number;
  limit: number;
  userId: string;
}

export interface blockUserDto {
  userId: string;
  blockedUserId: string;
}

export interface unblockUserDto {
  userId: string;
  blockedUserId: string;
}

export interface getUserByReferralCodeDto {
  referralCode: string;
}

export interface CompleteUserProfileDto {
  userId: string;
  userName: string;
  country: string;
  promotionalVideo: string[];
  profileImage: string;
  categories: string[];
}

