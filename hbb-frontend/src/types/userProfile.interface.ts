export interface UserProfile {
    username: string;
    location: string;
    bio: string;
    interests: string[];
    zodiacSign?: string;
    callRate: string;
    profileImageDetails?: {
      url: string;
    };
    promotionalVideoDetails?: { url: string }[];
    user?: {
      age?: number;
      gender?: string;
    };
  }
  
  export interface UserAppointmentsInterface {
    id: string;
    date: string;
    status: string;
    caller?: {
      firstName: string;
      lastName: string;
      profile?: {
        location: string;
      };
    };
  }
  
  export interface UserProfileViewsInterface {
    month: string;
    views: number;
  }
  