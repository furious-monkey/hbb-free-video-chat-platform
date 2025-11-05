export type UserStoreState = {
    user: any;
    isAuth: boolean;
    loading: boolean;
    isToken: boolean;
    register: (data: any) => Promise<void>;
    login: (data: any, router: any) => Promise<void>;
    tryAuth: (data: any) => Promise<void>;
  };
  


  export interface IUserMain {
    id: string
    userRole: string
    email: string
    firstName: string
    lastName: string
    age: number
    gender: string
    referralCode: string
    ownedReferralCode: any
    dateOfBirth: string
    phone: string
    profileImage: string
    promotionalVideo: any[]
    isOnline: boolean
    isBanned: boolean
    isEmailVerified: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    emailNotifications: boolean
    pushNotifications: boolean
    blockedUsers: any[]
    otp: any
    otpExpires: any
    profile: Profile
    profileImageDetails: ProfileImageDetails
    promotionalVideoDetails: any[]
    interestsDetails: any[]
    zodiacSignDetails: any
  }
  
  export interface Profile {
    id: string
    userId: string
    username: string
    bio: any
    location: string
    interests: any[]
    category: any[]
    zodiacSign: any
    callRate: any
    likedProfiles: any[]
    subscriptionPlan: any
    subscriptionStatus: any
    viewCount: number
    likes: number
    allowLike: any
  }
  
  export interface ProfileImageDetails {
    key: string
    url: string
    Location: any
  }
  