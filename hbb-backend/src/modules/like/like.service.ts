import { IPublicUser, IProfile, IUser } from './like.interface';
import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import * as profileRepository from './like.repository';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { fetchProfileImage, fetchPromotionalVideos } from '../../utils/media.utils';
import { publicProfile } from '../../utils/profile.utils';
import { fetchInterests, fetchZodiacSign } from '../../utils/profileService.utils';


const prisma = new PrismaClient();


export const likeProfile = async (userId: string, profileUserId: string): Promise<{}> => {
  const userProfile = await profileRepository.findProfileByUserId(userId);

  if (!userProfile) {
    throw new APIError('User profile not found', 'likeProfile', 404);
  }

  userProfile.likedProfiles = userProfile.likedProfiles ?? [];

  if (userProfile.likedProfiles.includes(profileUserId)) {
    return 'Profile already liked';
  }

  userProfile.likedProfiles.push(profileUserId);
  
  await profileRepository.updateProfile(userId, {
    likedProfiles: userProfile.likedProfiles,
  });

  await profileRepository.incrementProfileLikes(profileUserId);

  return {
    isLiked: true,
    message: 'Profile liked successfully',
  };
};

export const unlikeProfile = async (userId: string, profileUserId: string): Promise<string> => {
  const userProfile = await profileRepository.findProfileByUserId(userId);

  if (!userProfile) {
    throw new APIError('User profile not found', 'unlikeProfile', 404);
  }

  userProfile.likedProfiles = userProfile.likedProfiles ?? [];

  if (!userProfile.likedProfiles.includes(profileUserId)) {
    return 'Profile not liked yet';
  }

  userProfile.likedProfiles = userProfile.likedProfiles.filter(id => id !== profileUserId);
  
  await profileRepository.updateProfile(userId, {
    likedProfiles: userProfile.likedProfiles,
  });

  await profileRepository.decrementProfileLikes(profileUserId);

  return 'Profile unliked successfully';
};

export const explorerLikes = async (
  userId: string,
  page: number,
  pageSize: number
): Promise<{
  likedProfiles: IPublicUser[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}> => {
  try {
    const offset = (page - 1) * pageSize;

    const likedProfileIds = await profileRepository.findLikedProfilesByUserId(userId);
    if (!likedProfileIds || likedProfileIds.length === 0) {
      return {
        likedProfiles: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          pageSize,
        },
      };
    }

    const totalItems = likedProfileIds.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const likedProfiles = await profileRepository.findUsersByIds(
      likedProfileIds.slice(offset, offset + pageSize) as string[] 
    );

    const res = await Promise.all(
      likedProfiles.map(async (user) => {
        const profileImage = await fetchProfileImage(user.profileImage || null);
        const promotionalVideos = await fetchPromotionalVideos(user.promotionalVideo || []);
        const interestsDetails = await fetchInterests(user.profile?.interests as string[] || []); 
        const zodiacSignDetails = await fetchZodiacSign(user.profile?.zodiacSign as string | null);

        const userWithMedia = {
          ...user,
          profileImageDetails: profileImage || undefined,
          promotionalVideoDetails: promotionalVideos,
          interestsDetails,
          zodiacSignDetails,
        };

        return publicProfile(userWithMedia);
      })
    );

    return {
      likedProfiles: res,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
      },
    };
  } catch (error) {
    throw new APIError('Database Query Error', 'getLikedProfilesByUserId', 500);
  }
};

export const influencerLikes = async (
  profileUserId: string,
  page: number,
  pageSize: number
): Promise<{
  usersWhoLikedProfile: IPublicUser[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}> => {
  try {
    const offset = (page - 1) * pageSize;

    const usersWhoLikedProfileIds = await profileRepository.findUsersWhoLikedProfile(profileUserId);

    if (!usersWhoLikedProfileIds || usersWhoLikedProfileIds.length === 0) {
      return {
        usersWhoLikedProfile: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          pageSize,
        },
      };
    }

    const totalItems = usersWhoLikedProfileIds.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedUserIds = usersWhoLikedProfileIds.slice(offset, offset + pageSize);
    const paginatedUsers = await profileRepository.findUsersByIds(paginatedUserIds);

    const usersWithMedia = await Promise.all(
      paginatedUsers.map(async (user) => {
        const profileImage = await fetchProfileImage(user.profileImage || null);
        const promotionalVideos = await fetchPromotionalVideos(user.promotionalVideo || []);
        const interestsDetails = await fetchInterests(user.profile?.interests as string[] || []);
        const zodiacSignDetails = await fetchZodiacSign(user.profile?.zodiacSign as string | null);

        const userWithMedia = {
          ...user,
          profileImageDetails: profileImage || undefined,
          promotionalVideoDetails: promotionalVideos,
          interestsDetails,
          zodiacSignDetails,
        };

        return publicProfile(userWithMedia);
      })
    );

    return {
      usersWhoLikedProfile: usersWithMedia,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
      },
    };
  } catch (error) {
    throw new APIError('Database Query Error', 'getUsersWhoLikedProfile', 500);
  }
};