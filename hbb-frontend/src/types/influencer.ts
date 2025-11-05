export interface IPublicInfluencer {
    [x: string]: any
    id: string
    gender?: string
    promotionalVideo: any[]
    profileImageDetails: ProfileImageDetails
    promotionalVideoDetails: PromotionalVideoDetail[]
    interestsDetails: any[]
    isOnline: boolean
    profile: Profile
    isLive: boolean; 
    streamInfo?: {
      id: string;
      status: string;
      allowBids: boolean;
      startTime: Date | null;
      earnings: number;
      hasExplorer: boolean;
    } | null
  }
  
  export interface ProfileImageDetails {
    key: string
    url: string
    Location: any
  }
  
  export interface PromotionalVideoDetail {
    key: string
    url: string
    Location: any
  }
  
  export interface Profile {
    id: string
    userId: string
    username: string
    bio?: string
    location: string
    interests: string[]
    category: string[]
    zodiacSign?: string
    callRate?: string
    likedProfiles: any[]
    subscriptionPlan: any
    subscriptionStatus: any
    viewCount: number
    likes: number
    allowLike: any
  }
  