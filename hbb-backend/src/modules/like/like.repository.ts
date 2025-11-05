import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import { IProfile, IUser } from './like.interface';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';


const prisma = new PrismaClient();

export const updateProfile = async (userId: string, data: Partial<IProfile>): Promise<IProfile | null> => {
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


export const findLikedProfilesByUserId = async (userId: string): Promise<string[] | null> => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { likedProfiles: true },
  });
  return profile ? profile.likedProfiles : null;
};

export const findUsersByIds = async (userIds: string[]): Promise<Partial<IUser>[]> => {
  return prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { profile: true }, 
  });
};

export const incrementProfileLikes = async (userId: string): Promise<void> => {
  const profileExists = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profileExists) {
    throw new APIError('Profile not found', 'incrementProfileLikes', 404);
  }

  await prisma.profile.update({
    where: { userId },
    data: {
      likes: {
        increment: 1,
      },
    },
  });
};

export const decrementProfileLikes = async (userId: string): Promise<void> => {
  const profileExists = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profileExists) {
    throw new APIError('Profile not found', 'decrementProfileLikes', 404);
  }

  await prisma.profile.update({
    where: { userId },
    data: {
      likes: {
        decrement: 1,
      },
    },
  });
};

export const findUsersWhoLikedProfile = async (profileUserId: string): Promise<string[]> => {
  const users = await prisma.user.findMany({
    where: {
      profile: {
        likedProfiles: {
          has: profileUserId,
        },
      },
    },
    select: {
      id: true, 
    },
  });

  return users.map(user => user.id);
};










