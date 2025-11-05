// modules/user/user.service.ts - User service for handling user details, referral code, discovery, blocking, unblocking, and profile completion
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { getUserByReferralCodeDto, getUserDetailsDto, fetchUsersByReferralCodeDto, deleteUserDto, discoverUsersDto, discoverInfluencersDto, unblockUserDto, blockUserDto, CompleteUserProfileDto } from './user.dto';
import { APIError } from '../../middleware/error/appError';
import { ErrorHandler } from '../../middleware/error/errorHandler';
import { logger } from '../../config/logger';
import { differenceInYears } from 'date-fns';
import { fetchProfileImage, fetchPromotionalVideos } from '../../utils/media.utils';
import { fetchInterests, fetchZodiacSign } from '../../utils/profileService.utils';


const prisma = new PrismaClient();
const errorHandler = new ErrorHandler(logger);

@Service()
export default class UserService {
  async getUserDetails(payload: getUserDetailsDto): Promise<any> {
    const { userId } = payload;
  
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
  
      if (!user) {
        throw new APIError('User not found', 'getUserDetails', 400);
      }
  
      logger.info(`User ${userId} fetched their details`);
  
      // Fetch profile image and promotional videos
      const profileImage = await fetchProfileImage(user.profileImage || null);
      const promotionalVideos = await fetchPromotionalVideos(user.promotionalVideo || []);
  
      // Fetch interests and zodiac sign details
      const interestsDetails = await fetchInterests(user.profile?.interests as string[] || []);
      const zodiacSignDetails = await fetchZodiacSign(user.profile?.zodiacSign as string | null);
  
      // Combine the fetched details into the user object
      const userWithMedia = user
        ? {
          ...user,
          profileImageDetails: profileImage || undefined,
          promotionalVideoDetails: promotionalVideos,
          interestsDetails,
          zodiacSignDetails, 
        }
        : undefined;
  
      return { userDetails: userWithMedia, message: 'User details retrieved', alert: true };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'getUserDetails', 500);
    }
  }


  async fetchUsersByReferralCode(payload: fetchUsersByReferralCodeDto): Promise<any> {
    const { ownedReferralCode } = payload;

    try {
      const usersWithMatchingReferralCode = await prisma.user.findMany({
        where: { referralCode: ownedReferralCode },
      });

      logger.info(`Fetched users with referral code ${ownedReferralCode}`);

      return { usersWithMatchingReferralCode, message: 'Fetched users for this agency', alert: true };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'fetchUsersByReferralCode', 500);
    }
  }


  async discoverUsers(payload: discoverUsersDto): Promise<any> {
    const { page, limit } = payload;

    try {
      const users = await prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalUsers = await prisma.user.count();

      const totalPages = Math.ceil(totalUsers / limit);

      return {
        totalDocs: totalUsers,
        totalPages,
        currentPage: page,
        users,
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'discoverUsers', 500);
    }
  }

  async blockUser(payload: blockUserDto): Promise<any> {
    const { blockedUserId, userId } = payload;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new APIError('User not found', 'blockUser', 404);
      }

      const userToBlock = await prisma.user.findUnique({
        where: { id: blockedUserId },
      });

      if (!userToBlock) {
        throw new APIError('User to block not found', 'blockUser', 404);
      }

      if (user.blockedUsers.includes(blockedUserId)) {
        throw new APIError('User is already blocked', 'blockUser', 400);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          blockedUsers: {
            push: blockedUserId,
          },
        },
      });

      logger.info(`User ${userId} blocked user ${blockedUserId}`);

      return { message: 'User blocked successfully' };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'blockUser', 500);
    }
  }

  async unblockUser(payload: unblockUserDto): Promise<any> {
    const { blockedUserId, userId } = payload;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new APIError('User not found', 'unblockUser', 404);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          blockedUsers: {
            set: user.blockedUsers.filter(id => id !== blockedUserId),
          },
        },
      });

      logger.info(`User ${userId} unblocked user ${blockedUserId}`);

      return { message: 'User unblocked successfully' };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'unblockUser', 500);
    }
  }

  async getBlockedUsers(userId: string): Promise<{ user: any; profile: any }[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { blockedUsers: true },
    });

    if (!user || !user.blockedUsers.length) {
       return [];
    }

    const blockedUsers = await prisma.user.findMany({
      where: {
        id: { in: user.blockedUsers },
      },
      include: {
        profile: true, 
      },
    });

    return blockedUsers.map(blockedUser => ({
      user: blockedUser,
      profile: blockedUser.profile,
    }));
  } catch (error) {
    logger.error(`Error fetching blocked users for user ID: ${userId}`, error);
    throw new APIError('Internal server error', 'getBlockedUsers', 500);
  }
};

  async getUserByReferralCode(payload: getUserByReferralCodeDto): Promise<any> {
    const { referralCode } = payload;

    try {
      const user = await prisma.user.findFirst({
        where: {
          ownedReferralCode: referralCode,
          isDeleted: false,
        },
        select: {
          firstName: true,
          profileImage: true,
          id: true,
        },
      });

      if (!user) {
        throw new APIError('Invalid referral code', 'getUserByReferralCode', 404);
      }

      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { location: true },
      });

      if (!profile) {
        throw new APIError('Profile not found', 'getUserByReferralCode', 404);
      }

      return {
        name: user.firstName,
        profileImage: user.profileImage,
        location: profile.location,
      };
    } catch (error: any) {
      console.error('Error in getUserByReferralCode:', {
        error: error.message,
        stack: error.stack,
        referralCode,
      });

      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError('Internal server error', 'getUserByReferralCode', 500);
    }
  }

  async completeUserProfile(payload: CompleteUserProfileDto): Promise<any> {
    const { userId, userName, country, profileImage, promotionalVideo, categories = [] } = payload;
  
    try {
      // Check if username is already taken (only if userName is provided)
      if (userName) {
        const existingUserName = await prisma.profile.findFirst({
          where: { username: userName }, // Use findFirst for nullable username
        });
  
        if (existingUserName && existingUserName.userId !== userId) {
          throw new APIError('Username is already taken', 'completeUserProfile', 400);
        }
      }
  
      // Check to ensure no more than 3 categories are selected
      if (!Array.isArray(categories) || categories.length > 3) {
        throw new APIError('You can only select a maximum of 3 categories', 'completeUserProfile', 400);
      }
  
      // Ensure only valid categories are added
      const validCategories = await prisma.category.findMany({
        where: {
          id: {
            in: categories,
          },
        },
      });
  
      if (validCategories.length !== categories.length) {
        throw new APIError('Some categories are invalid', 'completeUserProfile', 400);
      }
  
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          promotionalVideo,
          profileImage,
        },
      });
  
      if (!updatedUser) {
        throw new APIError('User not found', 'completeUserProfile', 404);
      }
  
      // Check if the user already has a profile
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
      });
  
      let createdProfile;
  
      if (!existingProfile) {
        // Create a profile for the user if it doesn't exist
        createdProfile = await prisma.profile.create({
          data: {
            userId: userId,
            username: userName || null, // Handle nullable username
            bio: null,
            location: country || null,
            interests: [],
            category: categories || [],
          },
        });
      } else {
        // Update profile if it exists
        await prisma.profile.update({
          where: { userId },
          data: {
            category: categories || [],
            username: userName || null,
            location: country || null,
          },
        });
      }
  
      logger.info(`User ${userId} completed their profile`);
  
      return {
        _id: updatedUser?.id,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        gender: updatedUser?.gender,
        dateOfBirth: updatedUser?.dateOfBirth,
        phone: updatedUser?.phone,
        age: updatedUser?.age,
        promotionalVideo: updatedUser?.promotionalVideo,
        profileImage: updatedUser?.profileImage,
        profileId: existingProfile?.id || createdProfile?.id,
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'completeUserProfile', 500);
    }
  }
  
  
  

  async updateProfileImage(userId: string, profileImage: string | null): Promise<any> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profileImage },
      });

      if (!updatedUser) {
        throw new APIError('User not found', 'updateProfileImage', 404);
      }

      logger.info(`User ${userId} updated their profile image`);

      return {
        userId: updatedUser.id,
        profileImage: updatedUser.profileImage,
        message: 'Profile image updated successfully',
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'updateProfileImage', 500);
    }
  }

  async updatePromotionalVideos(userId: string, promotionalVideos: string[]): Promise<any> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { promotionalVideo: promotionalVideos },
      });

      if (!updatedUser) {
        throw new APIError('User not found', 'updatePromotionalVideos', 404);
      }

      logger.info(`User ${userId} updated their promotional videos`);

      return {
        userId: updatedUser.id,
        promotionalVideos: updatedUser.promotionalVideo,
        message: 'Promotional videos updated successfully',
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'updatePromotionalVideos', 500);
    }
  }
  
}
