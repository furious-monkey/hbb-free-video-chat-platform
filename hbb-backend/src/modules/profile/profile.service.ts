import { IProfile, IUser } from './profile.interface';
import { Prisma, PrismaClient, ProfileView, ReportReason } from '@prisma/client';
import { CreateProfileDto, } from './profile.dto';
import * as profileRepository from './profile.repository';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { fetchProfileImage, fetchPromotionalVideos } from '../../utils/media.utils';
import { fetchInterests, fetchZodiacSign } from '../../utils/profileService.utils';
import { findAllCategories } from './profile.repository';


const prisma = new PrismaClient();


export const createOrUpdateProfile = async (userId: string, profileData: CreateProfileDto): Promise<IProfile | null> => {
  let profile = await profileRepository.findProfileByUserId(userId);

  console.log('data hitting here', profileData);


  if (!profile) {
    profile = await profileRepository.createProfile({
      ...profileData,
      userId,
      likedProfiles: [], 
    });
  } else {
    profile = await profileRepository.updateProfile(userId, profileData);
  }
  return profile;
};

export const getProfileByUserId = async (userId: string): Promise<IProfile | null> => {
  try {
    const profile = await profileRepository.findProfileByUserId(userId);
    if (!profile) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileImage: true,
        promotionalVideo: true,
      },
    });

    // Fetch profile image and promotional videos
    const profileImage = await fetchProfileImage(user?.profileImage || null);
    const promotionalVideos = await fetchPromotionalVideos(user?.promotionalVideo || []);

    // Fetch interests and zodiac sign details
    const interests = await fetchInterests(profile.interests);
    const zodiacSign = await fetchZodiacSign(profile.zodiacSign);

    const profileWithDetails: IProfile & {
      profileImageDetails?: any;
      promotionalVideoDetails?: any;
      interestsDetails?: any[];
      zodiacSignDetails?: any;
    } = {
      ...profile,
      profileImageDetails: profileImage || undefined,
      promotionalVideoDetails: promotionalVideos,
      interestsDetails: interests,
      zodiacSignDetails: zodiacSign || undefined,
    };

    return profileWithDetails;
  } catch (error) {
    throw new APIError('Database Query Error', 'getProfileByUserId', 500);
  }
};


export const viewUserProfile = async (viewerId: string, userId: string): Promise<IProfile | null> => {
  try {
    logger.info(`User ${viewerId} is viewing profile for user ${userId}`);
    
    const profile = await profileRepository.findProfileById(userId);
    if (!profile) {
      throw new APIError('Profile not found', 'viewUserProfile', 404);
    }

    await profileRepository.incrementProfileViewCount(profile.id);
    await profileRepository.logProfileView(viewerId, userId);

    logger.info(`Profile view count incremented and logged for profile ${profile.id}`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileImage: true,
        promotionalVideo: true,
      },
    });

    // Fetch profile image and promotional videos
    const profileImage = await fetchProfileImage(user?.profileImage || null);
    const promotionalVideos = await fetchPromotionalVideos(user?.promotionalVideo || []);

    // Fetch interests and zodiac sign details
    const interests = await fetchInterests(profile.interests);
    const zodiacSign = await fetchZodiacSign(profile.zodiacSign);

    // Combine the fetched media and other details into the profile object
    const profileWithDetails: IProfile & {
      profileImageDetails?: any;
      promotionalVideoDetails?: any;
      interestsDetails?: any[];
      zodiacSignDetails?: any;
    } = {
      ...profile,
      profileImageDetails: profileImage || undefined,
      promotionalVideoDetails: promotionalVideos,
      interestsDetails: interests,
      zodiacSignDetails: zodiacSign || undefined,
    };

    return profileWithDetails;
  } catch (error) {
    logger.error('Error in viewUserProfile service function:', error);
    throw new APIError('Database Query Error', 'viewUserProfile', 500);
  }
};

export const getUserProfileViews = async (userId: string): Promise<{ month: string, views: number }[]> => {
  try {
    logger.info(`Fetching profile views for user ${userId}`);
    
    const profileViews = await profileRepository.findProfileViewsByUserId(userId);

    const viewsPerMonth = profileViews.reduce((acc: Record<string, number>, view: ProfileView) => {
      const month = view.dateViewed.toISOString().slice(0, 7); 
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(viewsPerMonth).map(([month, views]) => ({ month, views }));
  } catch (error) {
    logger.error('Error in getUserProfileViews service function:', error);
    throw new APIError('Database Query Error', 'getUserProfileViews', 500);
  }
};

//category
export async function getAllCategories(): Promise<any[]> {
  try {
    const categories = await findAllCategories();
    return categories;
  } catch (error) {
    throw new APIError('Error fetching categories', 'getAllCategories', 500);
  }
}