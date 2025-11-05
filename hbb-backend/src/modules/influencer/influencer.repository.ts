import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import { IProfile, IUser } from './influencer.interface';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';


const prisma = new PrismaClient();


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