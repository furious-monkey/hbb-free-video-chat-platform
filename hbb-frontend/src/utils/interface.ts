export interface UserDetailInterface {
  id: string;
  userRole: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: null;
  gender: string;
  referralCode: string;
  ownedReferralCode: null;
  dateOfBirth: string;
  phone: string;
  profileImage: null;
  promotionalVideo: [];
  isOnline: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  blockedUsers: [];
  otp: null;
  otpExpires: null;
  profile: null;
  profileImageDetails: UploadedVideoInterface | null | undefined;
}

export interface UploadedVideoInterface {
  key: string;
  url: string;
  Location: string;
}

export interface UserProfileInfoInterface {
  id: string;
  userRole: string;
  email: string;
  password: string;
  firstName: null;
  lastName: null;
  age: null;
  gender: null;
  referralCode: null;
  ownedReferralCode: null;
  dateOfBirth: null;
  phone: null;
  profileImage: null;
  promotionalVideo: [];
  profileImageDetails: UploadedVideoInterface;
  promotionalVideoDetails: UploadedVideoInterface[];
  isOnline: false;
  isBanned: false;
  isEmailVerified: true;
  isDeleted: false;
  createdAt: string;
  updatedAt: string;
  emailNotifications: false;
  pushNotifications: false;
  blockedUsers: [];
  otp: string;
  otpExpires: string;
}

export interface ProfileDetailInterface {
  id: string;
  userId: string;
  username: string;
  bio: string;
  location: string;
  interests: string[];
  zodiacSign: string;
  callRate: string;
  likedProfiles: string[];
  subscriptionPlan: null;
  subscriptionStatus: null;
  allowLike: null;
  user: UserProfileInfoInterface;
}

export interface UserProfilePostInterface {
  username: string;
  bio: string;
  location: string;
  interests: string[];
  zodiacSign: string;
  callRate: string;
}

export interface UserAppointmentProfileInterface {
  id: string;
  userId: string;
  username: string;
  bio: string;
  location: string;
  interests: string[];
  zodiacSign: string;
  callRate: string;
  likedProfiles: string[];
  subscriptionPlan: null;
  subscriptionStatus: null;
  viewCount: number;
  likes: number;
  allowLike: null;
}

export interface UserAppointmentCallerInterface {
  id: string;
  userRole: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  referralCode: null;
  ownedReferralCode: null;
  dateOfBirth: string;
  phone: string;
  profileImage: string;
  promotionalVideo: string[];
  isOnline: boolean;
  isBanned: boolean;
  isEmailVerified: true;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  blockedUsers: string[];
  otp: null;
  otpExpires: null;
  profile: UserAppointmentProfileInterface;
}

export interface UserAppointmentRecieverInterface {
  id: string;
  userRole: string;
  email: string;
  password: string;
  firstName: null;
  lastName: null;
  age: null;
  gender: null;
  referralCode: null;
  ownedReferralCode: null;
  dateOfBirth: null;
  phone: null;
  profileImage: null;
  promotionalVideo: [];
  isOnline: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  blockedUsers: [];
  otp: null;
  otpExpires: null;
  profile: {
    id: string;
    userId: string;
    username: string;
    bio: string;
    location: string;
    interests: string[];
    zodiacSign: string;
    callRate: string;
    likedProfiles: [];
    subscriptionPlan: null;
    subscriptionStatus: null;
    viewCount: number;
    likes: number;
    allowLike: null;
  };
}

export interface UserAppointmentsInterface {
  id: string;
  callerId: string;
  receiverId: string;
  status: string;
  date: string;
  appointmentReached: false;
  createdAt: string;
  updatedAt: string;
  caller: UserAppointmentCallerInterface;
  receiver: UserAppointmentRecieverInterface;
}

export interface UserProfileViewsInterface {
  month: string;
  views: number;
}

export interface AdminFAQSInterface {
  id: string;
  question: string;
  answer: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormInterface {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface LikedProfilesInterface {
  id: string;
  userRole: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  profileImage: string | null;
  promotionalVideo: string[];
  isOnline: boolean;
  profileImageDetails: ProfileImageDetails;
  profile: {
    id: string;
    userId: string;
    username: string;
    bio: string;
    location: string;
    interests: string[];
    zodiacSign: string;
    callRate: string;
    likedProfiles: [];
    subscriptionPlan: string | null;
    subscriptionStatus: string | null;
    viewCount: number;
    likes: number;
    allowLike: null;
  };
}

export interface ForgotPasswordInterface {
  email: string;
}

export interface ResetPasswordInterface {
  password: string;
}

export interface ResetPasswordPayloadInterface {
  token: string;
  data: ResetPasswordInterface;
}

export interface InfluencerPayloadInterface {
  cursor: string;
  limit: number;
  categories: string[];
  search_term: string;
  is_user_online: boolean;
}

export interface InfluencersInterface {
  user: User;
  id: string;
  liked: boolean;
}

export interface User {
  id: string;
  userRole: string;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  dateOfBirth?: string;
  promotionalVideo: string[];
  isOnline: boolean;
  profile: Profile;
  profileImageDetails?: ProfileImageDetails;
  promotionalVideoDetails: PromotionalVideoDetail[];
}

export interface Profile {
  id: string;
  userId: string;
  username: any;
  bio: any;
  location: any;
  interests: any[];
  zodiacSign: any;
  callRate: any;
  likedProfiles: any[];
  subscriptionPlan: any;
  subscriptionStatus: any;
  viewCount: number;
  likes: number;
  allowLike: any;
}

export interface ProfileImageDetails {
  key: string;
  url: string;
  Location: any;
}

export interface PromotionalVideoDetail {
  key: string;
  url: string;
  Location?: string;
}

export interface ProfileImageDetails {
  key: string;
  url: string;
  Location: any;
}

export interface ProfileInterface {
  id: string;
  userId: string;
  username: string;
  bio: string;
  location: string;
  interests: string[];
  zodiacSign: string;
  callRate: string;
  likedProfiles: string[];
  subscriptionPlan: string;
  subscriptionStatus: string;
  viewCount: number;
  likes: number;
  allowLike: any;
}

export interface LikedExplorerProfilesInterface {
  id: string;
  userRole: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  referralCode: string;
  ownedReferralCode: any;
  dateOfBirth: string;
  phone: string;
  profileImage: string;
  promotionalVideo: string[];
  isOnline: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  blockedUsers: string[];
  otp: string;
  otpExpires: string;
  profile: ProfileInterface;
  profileImageDetails: ProfileImageDetails;
  promotionalVideoDetails: string[];
}

export interface DataInboxInterface {
  id: number;
  name: string;
  age: number;
  sign: string;
  gender: string;
  bio: string;
  interests: string[];
  time: string;
  location: string;
  image: string;
  chatImg: string;
  type: string;
  status: string;
  message: string;
}

interface IImageDetails {
  key: string;
  url: string;
  Location: string | null;
}

export interface CategoryInterface {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  imageDetails: IImageDetails;
}