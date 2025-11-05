import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import { IProfile, IUser } from './profile.interface';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { fetchCategoryImage } from '../../utils/media.utils';


const prisma = new PrismaClient();

export const createProfile = async (data: Partial<IProfile>): Promise<IProfile> => {
  if (!data.userId) {
    throw new Error("userId must be provided to create a profile");
  }

  return prisma.profile.create({ data: data as Prisma.ProfileCreateInput });
};

export const updateProfile = async (userId: string, data: Partial<IProfile>): Promise<IProfile | null> => {
  console.log('data coming', data);
  return prisma.profile.update({
    where: { userId },
    data: data as Prisma.ProfileUpdateInput,
  });
};

export const findProfileByUserId = async (userId: string): Promise<IProfile | null> => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!profile) return null;

  return {
    ...profile,
  };
};

export const findUsersByIds = async (userIds: string[]): Promise<Partial<IUser>[]> => {
  return prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { profile: true }, 
  });
};

export const findProfileById = async (userId: string): Promise<IProfile | null> => {
  try {
    logger.info(`Fetching profile for user ID: ${userId}`);
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) {
      logger.warn(`Profile not found for user ID: ${userId}`);
    } else {
      logger.info(`Profile found: ${JSON.stringify(profile)}`);
    }
    return profile;
  } catch (error) {
    logger.error('Error fetching profile by user ID:', error);
    throw new Error('Error fetching profile by user ID');
  }
};

export const incrementProfileViewCount = async (profileId: string): Promise<void> => {
  try {
    logger.info(`Incrementing view count for profile ID: ${profileId}`);
    await prisma.profile.update({
      where: { id: profileId },
      data: { viewCount: { increment: 1 } },
    });
    logger.info(`Profile view count incremented for profile ID: ${profileId}`);
  } catch (error) {
    logger.error('Error incrementing profile view count:', error);
    throw new Error('Error incrementing profile view count');
  }
};

export const logProfileView = async (viewerId: string, viewedUserId: string): Promise<void> => {
  try {
    logger.info(`Logging profile view: viewer ${viewerId}, viewed user ${viewedUserId}`);
    await prisma.profileView.create({
      data: {
        viewerId,
        viewedUserId,
        dateViewed: new Date(),
      },
    });
    logger.info(`Profile view logged successfully: viewer ${viewerId}, viewed user ${viewedUserId}`);
  } catch (error) {
    logger.error('Error logging profile view:', error);
    throw new Error('Error logging profile view');
  }
};

export const findProfileViewsByUserId = async (userId: string): Promise<ProfileView[]> => {
  try {
    logger.info(`Fetching profile views for user with ID: ${userId}`);
    return await prisma.profileView.findMany({
      where: { viewedUserId: userId },
    });
  } catch (error) {
    logger.error('Error fetching profile views by user ID:', error);
    throw new Error('Error fetching profile views by user ID');
  }
};


//category
export async function findAllCategories(): Promise<any[]> {
  const categories = await prisma.category.findMany();

  const categoriesWithImages = await Promise.all(
    categories.map(async (category) => {
      const imageDetails = await fetchCategoryImage(category.imageUrl);
      return {
        ...category,
        imageDetails: imageDetails || null,
      };
    })
  );

  return categoriesWithImages;
}

