export interface IUser {
    id: string;
    email: string;
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
    profile?: any;
    profileImageDetails?: any;
    promotionalVideoDetails?: any;
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
    interestsDetails?: { id: string; name: string; image: string }[]; 
    zodiacSignDetails?: { id: string; name: string; image: string } | null; 
}

export const publicProfile = (influencerWithMedia: any): IPublicUser => {
    return {
        id: influencerWithMedia?.id,
        userRole: influencerWithMedia?.userRole,
        email: influencerWithMedia?.email,
        firstName: influencerWithMedia?.firstName,
        lastName: influencerWithMedia?.lastName,
        age: influencerWithMedia?.age,
        gender: influencerWithMedia?.gender,
        dateOfBirth: influencerWithMedia?.dateOfBirth,
        promotionalVideo: influencerWithMedia?.promotionalVideo,
        isOnline: influencerWithMedia?.isOnline,
        profile: influencerWithMedia?.profile,
        profileImageDetails: influencerWithMedia?.profileImageDetails,
        promotionalVideoDetails: influencerWithMedia?.promotionalVideoDetails,
        interestsDetails: influencerWithMedia?.interestsDetails,
        zodiacSignDetails: influencerWithMedia?.zodiacSignDetails, 
    };
};